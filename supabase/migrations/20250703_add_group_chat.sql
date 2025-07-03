-- =====================================================
-- GROUP CHAT FUNCTIONALITY
-- Add public wolfpack chat capabilities
-- =====================================================

-- =====================================================
-- WOLFPACK CHAT SESSIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS wolfpack_chat_sessions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id text NOT NULL UNIQUE, -- e.g., 'general', 'salem', 'portland'
    location_id uuid REFERENCES locations(id),
    display_name text NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    max_participants integer DEFAULT 100,
    current_participants integer DEFAULT 0,
    chat_settings jsonb DEFAULT '{}',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- =====================================================
-- WOLFPACK CHAT MESSAGES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS wolfpack_chat_messages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id text NOT NULL REFERENCES wolfpack_chat_sessions(session_id),
    sender_id uuid NOT NULL REFERENCES users(id),
    message text NOT NULL,
    message_type text DEFAULT 'text' CHECK (message_type IN ('text', 'emoji', 'system', 'announcement')),
    image_url text,
    reply_to_id uuid REFERENCES wolfpack_chat_messages(id),
    is_pinned boolean DEFAULT false,
    metadata jsonb DEFAULT '{}',
    flagged boolean DEFAULT false,
    flag_reason text,
    flagged_by uuid REFERENCES users(id),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    deleted_at timestamp with time zone
);

-- =====================================================
-- WOLFPACK CHAT PARTICIPANTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS wolfpack_chat_participants (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id text NOT NULL REFERENCES wolfpack_chat_sessions(session_id),
    user_id uuid NOT NULL REFERENCES users(id),
    joined_at timestamp with time zone DEFAULT now(),
    last_read_at timestamp with time zone DEFAULT now(),
    last_seen_at timestamp with time zone DEFAULT now(),
    is_active boolean DEFAULT true,
    participant_role text DEFAULT 'member' CHECK (participant_role IN ('member', 'moderator', 'admin')),
    UNIQUE(session_id, user_id)
);

-- Enable RLS
ALTER TABLE wolfpack_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wolfpack_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE wolfpack_chat_participants ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- INDEXES
-- =====================================================

-- Chat Messages Indexes
CREATE INDEX IF NOT EXISTS idx_wolfpack_chat_messages_session_time 
ON wolfpack_chat_messages(session_id, created_at DESC) 
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_wolfpack_chat_messages_sender 
ON wolfpack_chat_messages(sender_id) 
WHERE deleted_at IS NULL;

-- Chat Participants Indexes
CREATE INDEX IF NOT EXISTS idx_wolfpack_chat_participants_session 
ON wolfpack_chat_participants(session_id, is_active);

CREATE INDEX IF NOT EXISTS idx_wolfpack_chat_participants_user 
ON wolfpack_chat_participants(user_id, is_active);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function: Send wolfpack chat message
CREATE OR REPLACE FUNCTION send_wolfpack_chat_message(
    p_session_id TEXT,
    p_content TEXT,
    p_message_type TEXT DEFAULT 'text'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_user_id UUID;
    v_message_id UUID;
    v_result JSON;
    v_is_participant BOOLEAN;
    v_session_exists BOOLEAN;
BEGIN
    -- Get current user
    SELECT id INTO v_user_id FROM users WHERE auth_id = auth.uid();
    
    IF v_user_id IS NULL THEN
        RETURN json_build_object('error', 'User not authenticated');
    END IF;
    
    -- Check if session exists
    SELECT EXISTS (
        SELECT 1 FROM wolfpack_chat_sessions 
        WHERE session_id = p_session_id AND is_active = true
    ) INTO v_session_exists;
    
    IF NOT v_session_exists THEN
        RETURN json_build_object('error', 'Chat session not found');
    END IF;
    
    -- Check if user is a participant (auto-join if not)
    SELECT EXISTS (
        SELECT 1 FROM wolfpack_chat_participants 
        WHERE session_id = p_session_id 
        AND user_id = v_user_id 
        AND is_active = true
    ) INTO v_is_participant;
    
    -- Auto-join user to session if not already a participant
    IF NOT v_is_participant THEN
        INSERT INTO wolfpack_chat_participants (session_id, user_id)
        VALUES (p_session_id, v_user_id)
        ON CONFLICT (session_id, user_id) DO UPDATE SET
            is_active = true,
            joined_at = now();
    END IF;
    
    -- Insert the message
    INSERT INTO wolfpack_chat_messages (
        session_id,
        sender_id,
        message,
        message_type
    ) VALUES (
        p_session_id,
        v_user_id,
        p_content,
        p_message_type
    ) RETURNING id INTO v_message_id;
    
    -- Update participant's last activity
    UPDATE wolfpack_chat_participants 
    SET last_seen_at = now()
    WHERE session_id = p_session_id AND user_id = v_user_id;
    
    -- Build result
    SELECT json_build_object(
        'message_id', v_message_id,
        'status', 'sent',
        'session_id', p_session_id,
        'timestamp', now()
    ) INTO v_result;
    
    RETURN v_result;
END;
$$;

-- Function: Get wolfpack chat messages
CREATE OR REPLACE FUNCTION get_wolfpack_chat_messages(
    p_session_id TEXT,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_messages JSON;
    v_user_id UUID;
BEGIN
    -- Get current user
    SELECT id INTO v_user_id FROM users WHERE auth_id = auth.uid();
    
    -- Get messages with sender info
    SELECT COALESCE(json_agg(
        json_build_object(
            'id', wcm.id,
            'message', wcm.message,
            'message_type', wcm.message_type,
            'image_url', wcm.image_url,
            'reply_to_id', wcm.reply_to_id,
            'is_pinned', wcm.is_pinned,
            'created_at', wcm.created_at,
            'sender', json_build_object(
                'id', u.id,
                'display_name', COALESCE(u.display_name, u.first_name),
                'wolf_emoji', COALESCE(u.wolf_emoji, '🐺'),
                'profile_image_url', COALESCE(u.profile_image_url, u.avatar_url)
            )
        ) ORDER BY wcm.created_at ASC
    ), '[]') INTO v_messages
    FROM wolfpack_chat_messages wcm
    JOIN users u ON wcm.sender_id = u.id
    WHERE wcm.session_id = p_session_id
    AND wcm.deleted_at IS NULL
    ORDER BY wcm.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
    
    RETURN v_messages;
END;
$$;

-- Function: Join wolfpack chat session
CREATE OR REPLACE FUNCTION join_wolfpack_chat(p_session_id TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_user_id UUID;
    v_result JSON;
BEGIN
    -- Get current user
    SELECT id INTO v_user_id FROM users WHERE auth_id = auth.uid();
    
    IF v_user_id IS NULL THEN
        RETURN json_build_object('error', 'User not authenticated');
    END IF;
    
    -- Join the session
    INSERT INTO wolfpack_chat_participants (session_id, user_id)
    VALUES (p_session_id, v_user_id)
    ON CONFLICT (session_id, user_id) DO UPDATE SET
        is_active = true,
        joined_at = now();
    
    -- Update session participant count
    UPDATE wolfpack_chat_sessions 
    SET current_participants = (
        SELECT COUNT(*) FROM wolfpack_chat_participants 
        WHERE session_id = p_session_id AND is_active = true
    )
    WHERE session_id = p_session_id;
    
    SELECT json_build_object(
        'status', 'joined',
        'session_id', p_session_id,
        'joined_at', now()
    ) INTO v_result;
    
    RETURN v_result;
END;
$$;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Chat Sessions - Everyone can view active sessions
CREATE POLICY "Everyone can view active chat sessions" ON wolfpack_chat_sessions
    FOR SELECT USING (is_active = true);

-- Chat Messages - Participants can view messages
CREATE POLICY "Participants can view chat messages" ON wolfpack_chat_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM wolfpack_chat_participants wcp
            WHERE wcp.session_id = wolfpack_chat_messages.session_id
            AND wcp.user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
            AND wcp.is_active = true
        )
    );

-- Chat Messages - Authenticated users can send messages
CREATE POLICY "Authenticated users can send messages" ON wolfpack_chat_messages
    FOR INSERT WITH CHECK (
        sender_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    );

-- Chat Participants - Users can view participant lists
CREATE POLICY "Users can view chat participants" ON wolfpack_chat_participants
    FOR SELECT USING (
        user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()) OR
        EXISTS (
            SELECT 1 FROM wolfpack_chat_participants wcp2
            WHERE wcp2.session_id = wolfpack_chat_participants.session_id
            AND wcp2.user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
            AND wcp2.is_active = true
        )
    );

-- Chat Participants - Users can join sessions
CREATE POLICY "Users can join chat sessions" ON wolfpack_chat_participants
    FOR INSERT WITH CHECK (
        user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
    );

-- =====================================================
-- FUNCTION PERMISSIONS
-- =====================================================

GRANT EXECUTE ON FUNCTION send_wolfpack_chat_message TO authenticated;
GRANT EXECUTE ON FUNCTION get_wolfpack_chat_messages TO authenticated;
GRANT EXECUTE ON FUNCTION join_wolfpack_chat TO authenticated;

-- =====================================================
-- INSERT DEFAULT SESSIONS
-- =====================================================

INSERT INTO wolfpack_chat_sessions (session_id, display_name, description, location_id) VALUES
('general', 'General Chat', 'Main wolfpack chat for all locations', NULL),
('salem', 'Salem Wolfpack', 'Salem location chat', '50d17782-3f4a-43a1-b6b6-608171ca3c7c'),
('portland', 'Portland Wolfpack', 'Portland location chat', 'ec1e8869-454a-49d2-93e5-ed05f49bb932')
ON CONFLICT DO NOTHING;