-- =====================================================
-- COMPLETE CHAT SYSTEM SCHEMA
-- Based on your current Supabase database structure
-- =====================================================

-- =====================================================
-- USERS TABLE (Chat-related fields only)
-- =====================================================
-- Note: Your users table already exists, these are the chat-relevant fields
/*
Key chat-related fields in your existing users table:
- id (uuid, primary key)
- email (text)
- first_name (text)
- last_name (text)
- display_name (character varying) - Used as chat display name
- wolf_emoji (character varying) - User's wolf emoji, defaults to '🐺'
- profile_image_url (text) - Profile picture URL
- avatar_url (text) - Fallback avatar URL
- allow_messages (boolean) - Whether user accepts messages, defaults to true
- bio (text) - User bio
- favorite_drink (character varying)
- vibe_status (character varying) - Status message, defaults to 'Ready to party! 🎉'
- is_profile_visible (boolean) - Profile visibility, defaults to true
- last_login (timestamp with time zone) - For online status
- last_seen_at (timestamp with time zone) - Last activity timestamp
- notification_preferences (jsonb) - Notification settings
- is_online (boolean) - Online status
- deleted_at (timestamp with time zone) - Soft delete
*/

-- =====================================================
-- WOLF PRIVATE MESSAGES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS wolf_private_messages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id uuid NOT NULL REFERENCES users(id),
    receiver_id uuid NOT NULL REFERENCES users(id),
    message text NOT NULL,
    image_url text,
    image_id uuid REFERENCES images(id),
    is_read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    read_at timestamp with time zone,
    is_deleted boolean DEFAULT false,
    flagged boolean DEFAULT false,
    flag_reason text,
    flagged_by uuid REFERENCES users(id),
    flagged_at timestamp with time zone,
    is_flirt_message boolean DEFAULT false
);

-- Enable RLS
ALTER TABLE wolf_private_messages ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- WOLF PACK INTERACTIONS TABLE (for blocking, etc.)
-- =====================================================
CREATE TABLE IF NOT EXISTS wolf_pack_interactions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id uuid NOT NULL REFERENCES users(id),
    receiver_id uuid NOT NULL REFERENCES users(id),
    interaction_type text NOT NULL CHECK (interaction_type IN ('wink', 'like', 'dislike', 'block', 'report', 'super_like', 'pass')),
    location_id uuid REFERENCES locations(id),
    message_content text,
    metadata jsonb DEFAULT '{}',
    status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired', 'resolved')),
    read_at timestamp with time zone,
    expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE wolf_pack_interactions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- IMAGES TABLE (for message attachments)
-- =====================================================
CREATE TABLE IF NOT EXISTS images (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    url text NOT NULL,
    size integer,
    mime_type text,
    uploaded_by uuid REFERENCES users(id),
    storage_path text,
    image_type text CHECK (image_type IN ('avatar', 'chat', 'message', 'announcement')),
    metadata jsonb DEFAULT '{}',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    deleted_at timestamp with time zone
);

-- Enable RLS
ALTER TABLE images ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PERFORMANCE INDEXES
-- =====================================================

-- Wolf Private Messages Indexes
CREATE INDEX IF NOT EXISTS idx_wolf_private_messages_conversation 
ON wolf_private_messages(sender_id, receiver_id, created_at DESC) 
WHERE is_deleted = false;

CREATE INDEX IF NOT EXISTS idx_wolf_private_messages_auth_sender 
ON wolf_private_messages(sender_id) 
WHERE is_deleted = false;

CREATE INDEX IF NOT EXISTS idx_wolf_private_messages_auth_receiver 
ON wolf_private_messages(receiver_id) 
WHERE is_deleted = false;

CREATE INDEX IF NOT EXISTS idx_wolf_private_messages_unread 
ON wolf_private_messages(receiver_id, is_read, created_at DESC) 
WHERE is_deleted = false AND flagged = false;

-- Wolf Pack Interactions Indexes
CREATE INDEX IF NOT EXISTS idx_wolf_pack_interactions_blocks
ON wolf_pack_interactions(sender_id, receiver_id, interaction_type, status)
WHERE interaction_type = 'block' AND status = 'active';

CREATE INDEX IF NOT EXISTS idx_wolf_pack_interactions_sender
ON wolf_pack_interactions(sender_id);

CREATE INDEX IF NOT EXISTS idx_wolf_pack_interactions_receiver
ON wolf_pack_interactions(receiver_id);

-- =====================================================
-- CHAT FUNCTIONS
-- =====================================================

-- Function: Get chat data between two users
CREATE OR REPLACE FUNCTION get_chat_data(
    p_current_user_id UUID,
    p_other_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_result JSON;
    v_user_data JSON;
    v_is_blocked BOOLEAN;
    v_messages JSON;
BEGIN
    -- Check if users are blocked
    SELECT EXISTS (
        SELECT 1 FROM wolf_pack_interactions
        WHERE sender_id = p_current_user_id 
        AND receiver_id = p_other_user_id
        AND interaction_type = 'block'
        AND status = 'active'
    ) INTO v_is_blocked;
    
    -- Get other user data
    SELECT json_build_object(
        'id', u.id,
        'email', u.email,
        'first_name', u.first_name,
        'last_name', u.last_name,
        'role', u.role,
        'display_name', COALESCE(u.display_name, u.first_name),
        'wolf_emoji', COALESCE(u.wolf_emoji, '🐺'),
        'vibe_status', u.vibe_status,
        'profile_image_url', COALESCE(u.profile_image_url, u.avatar_url),
        'allow_messages', COALESCE(u.allow_messages, true),
        'bio', u.bio,
        'favorite_drink', u.favorite_drink,
        'is_profile_visible', COALESCE(u.is_profile_visible, true),
        'is_online', CASE 
            WHEN u.last_login > NOW() - INTERVAL '5 minutes' THEN true
            ELSE false
        END,
        'last_activity', u.last_login
    ) INTO v_user_data
    FROM users u
    WHERE u.id = p_other_user_id;
    
    -- Get messages between users
    WITH ordered_messages AS (
        SELECT 
            wpm.id,
            wpm.sender_id,
            wpm.receiver_id,
            wpm.message,
            wpm.image_url,
            wpm.is_read,
            wpm.created_at,
            wpm.read_at,
            wpm.is_deleted,
            wpm.flagged,
            wpm.flag_reason,
            wpm.flagged_by,
            wpm.flagged_at,
            wpm.image_id,
            CASE 
                WHEN wpm.sender_id = p_other_user_id THEN
                    json_build_object(
                        'display_name', COALESCE(u_sender.display_name, u_sender.first_name),
                        'wolf_emoji', COALESCE(u_sender.wolf_emoji, '🐺'),
                        'profile_image_url', COALESCE(u_sender.profile_image_url, u_sender.avatar_url)
                    )
                ELSE NULL
            END AS sender_user
        FROM wolf_private_messages wpm
        LEFT JOIN users u_sender ON wpm.sender_id = u_sender.id
        WHERE (
            (wpm.sender_id = p_current_user_id AND wpm.receiver_id = p_other_user_id)
            OR (wpm.sender_id = p_other_user_id AND wpm.receiver_id = p_current_user_id)
        )
        AND wpm.is_deleted = false
        ORDER BY wpm.created_at ASC
    )
    SELECT COALESCE(json_agg(
        json_build_object(
            'id', om.id,
            'sender_id', om.sender_id,
            'receiver_id', om.receiver_id,
            'message', om.message,
            'image_url', om.image_url,
            'is_read', om.is_read,
            'created_at', om.created_at,
            'read_at', om.read_at,
            'is_deleted', om.is_deleted,
            'flagged', om.flagged,
            'flag_reason', om.flag_reason,
            'flagged_by', om.flagged_by,
            'flagged_at', om.flagged_at,
            'image_id', om.image_id,
            'sender_user', om.sender_user
        )
    ), '[]'::json) INTO v_messages
    FROM ordered_messages om;
    
    -- Build final result
    SELECT json_build_object(
        'user_data', v_user_data,
        'is_blocked', v_is_blocked,
        'messages', v_messages
    ) INTO v_result;
    
    RETURN v_result;
END;
$$;

-- Function: Get recent conversations for a user
CREATE OR REPLACE FUNCTION get_recent_conversations(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
    other_user_id UUID,
    other_user_display_name TEXT,
    other_user_wolf_emoji TEXT,
    other_user_profile_image_url TEXT,
    last_message TEXT,
    last_message_time TIMESTAMP WITH TIME ZONE,
    unread_count BIGINT,
    is_blocked BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    RETURN QUERY
    WITH latest_messages AS (
        SELECT 
            CASE 
                WHEN wpm.sender_id = p_user_id THEN wpm.receiver_id
                ELSE wpm.sender_id
            END as other_user_id,
            wpm.message as last_message,
            wpm.created_at as last_message_time,
            ROW_NUMBER() OVER (
                PARTITION BY 
                    CASE 
                        WHEN wpm.sender_id = p_user_id THEN wpm.receiver_id
                        ELSE wpm.sender_id
                    END 
                ORDER BY wpm.created_at DESC
            ) as rn
        FROM wolf_private_messages wpm
        WHERE (wpm.sender_id = p_user_id OR wpm.receiver_id = p_user_id)
        AND wpm.is_deleted = FALSE
    ),
    unread_counts AS (
        SELECT 
            sender_id as other_user_id,
            COUNT(*)::BIGINT as unread_count
        FROM wolf_private_messages
        WHERE receiver_id = p_user_id
        AND is_read = FALSE
        AND is_deleted = FALSE
        AND flagged = FALSE
        GROUP BY sender_id
    ),
    block_status AS (
        SELECT 
            CASE 
                WHEN wpi.sender_id = p_user_id THEN wpi.receiver_id
                ELSE wpi.sender_id
            END as other_user_id,
            TRUE as is_blocked
        FROM wolf_pack_interactions wpi
        WHERE (wpi.sender_id = p_user_id OR wpi.receiver_id = p_user_id)
        AND wpi.interaction_type = 'block'
        AND wpi.status = 'active'
    )
    SELECT 
        lm.other_user_id,
        COALESCE(u.display_name::TEXT, u.first_name, 'Unknown User') as other_user_display_name,
        COALESCE(u.wolf_emoji::TEXT, '🐺') as other_user_wolf_emoji,
        COALESCE(u.profile_image_url, u.avatar_url, '') as other_user_profile_image_url,
        lm.last_message,
        lm.last_message_time,
        COALESCE(uc.unread_count, 0::BIGINT) as unread_count,
        COALESCE(bs.is_blocked, FALSE) as is_blocked
    FROM latest_messages lm
    JOIN users u ON lm.other_user_id = u.id
    LEFT JOIN unread_counts uc ON lm.other_user_id = uc.other_user_id
    LEFT JOIN block_status bs ON lm.other_user_id = bs.other_user_id
    WHERE lm.rn = 1
    AND u.deleted_at IS NULL
    ORDER BY lm.last_message_time DESC
    LIMIT p_limit;
END;
$$;

-- Function: Get unread message count for a user
CREATE OR REPLACE FUNCTION get_unread_message_count(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*)::INTEGER INTO v_count
    FROM wolf_private_messages wpm
    WHERE wpm.receiver_id = p_user_id
    AND wpm.is_read = false
    AND wpm.is_deleted = false
    AND NOT EXISTS (
        SELECT 1 FROM wolf_pack_interactions wpi
        WHERE wpi.sender_id = p_user_id
        AND wpi.receiver_id = wpm.sender_id
        AND wpi.interaction_type = 'block'
        AND wpi.status = 'active'
    );
    
    RETURN COALESCE(v_count, 0);
END;
$$;

-- =====================================================
-- TRIGGER FUNCTIONS
-- =====================================================

-- Function: Handle message read timestamp
CREATE OR REPLACE FUNCTION update_message_read_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.is_read = true AND OLD.is_read = false THEN
        NEW.read_at = NOW();
    END IF;
    RETURN NEW;
END;
$$;

-- Function: Update user's last seen timestamp on message
CREATE OR REPLACE FUNCTION update_last_seen()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $$
BEGIN
    -- Update last_seen_at for the sender in the users table
    UPDATE users 
    SET 
        last_seen_at = NOW(),
        last_activity = NOW(),
        updated_at = NOW()
    WHERE id = NEW.sender_id;
    
    RETURN NEW;
END;
$$;

-- Function: Handle push notifications for private messages
CREATE OR REPLACE FUNCTION notify_on_private_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_sender_name TEXT;
    v_recipient_preferences RECORD;
    v_notification_count INTEGER;
BEGIN
    -- Get sender's name
    SELECT COALESCE(first_name || ' ' || last_name, email) INTO v_sender_name
    FROM public.users
    WHERE id = NEW.sender_id;
    
    -- Check recipient's preferences from users table
    SELECT u.allow_messages, u.notification_preferences
    INTO v_recipient_preferences
    FROM public.users u
    WHERE u.id = NEW.receiver_id;
    
    -- If user doesn't want private message notifications, exit
    IF v_recipient_preferences.allow_messages IS FALSE THEN
        RETURN NEW;
    END IF;
    
    -- Check notification preferences for private messages
    IF v_recipient_preferences.notification_preferences IS NOT NULL 
       AND (v_recipient_preferences.notification_preferences->>'chat_messages')::boolean IS FALSE THEN
        RETURN NEW;
    END IF;
    
    -- Queue push notifications for all active devices of the recipient
    INSERT INTO public.push_notifications (
        user_id, 
        title, 
        body, 
        status, 
        data,
        type
    )
    SELECT 
        dt.user_id,
        'New message from ' || split_part(v_sender_name, ' ', 1),
        CASE 
            WHEN length(NEW.message) > 100 
            THEN substring(NEW.message from 1 for 97) || '...'
            ELSE NEW.message
        END,
        'pending',
        jsonb_build_object(
            'type', 'private_message',
            'message_id', NEW.id,
            'from_user_id', NEW.sender_id,
            'from_user_name', v_sender_name,
            'has_image', NEW.image_url IS NOT NULL
        ),
        'chat_message'
    FROM public.device_tokens dt
    WHERE dt.user_id = NEW.receiver_id
    AND dt.is_active = true;
    
    GET DIAGNOSTICS v_notification_count = ROW_COUNT;
    
    RETURN NEW;
END;
$$;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger: Update read_at timestamp when message is marked as read
DROP TRIGGER IF EXISTS tr_update_message_read_at ON wolf_private_messages;
CREATE TRIGGER tr_update_message_read_at
    BEFORE UPDATE ON wolf_private_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_message_read_at();

-- Trigger: Update user's last seen when they send a message
DROP TRIGGER IF EXISTS update_last_seen_on_pm ON wolf_private_messages;
CREATE TRIGGER update_last_seen_on_pm
    AFTER INSERT ON wolf_private_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_last_seen();

-- Trigger: Send push notification on new private message
DROP TRIGGER IF EXISTS on_private_message_notify ON wolf_private_messages;
CREATE TRIGGER on_private_message_notify
    AFTER INSERT ON wolf_private_messages
    FOR EACH ROW
    EXECUTE FUNCTION notify_on_private_message();

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- RLS for wolf_private_messages
DROP POLICY IF EXISTS "Users can view their own messages" ON wolf_private_messages;
CREATE POLICY "Users can view their own messages" ON wolf_private_messages
    FOR SELECT USING (
        auth.uid() = sender_id OR 
        auth.uid() = receiver_id
    );

DROP POLICY IF EXISTS "Users can send messages" ON wolf_private_messages;
CREATE POLICY "Users can send messages" ON wolf_private_messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id AND
        NOT EXISTS (
            SELECT 1 FROM wolf_pack_interactions 
            WHERE sender_id = auth.uid() 
            AND receiver_id = wolf_private_messages.receiver_id 
            AND interaction_type = 'block' 
            AND status = 'active'
        )
    );

DROP POLICY IF EXISTS "Users can update their received messages" ON wolf_private_messages;
CREATE POLICY "Users can update their received messages" ON wolf_private_messages
    FOR UPDATE USING (auth.uid() = receiver_id);

-- RLS for wolf_pack_interactions
DROP POLICY IF EXISTS "Users can view their interactions" ON wolf_pack_interactions;
CREATE POLICY "Users can view their interactions" ON wolf_pack_interactions
    FOR SELECT USING (
        auth.uid() = sender_id OR 
        auth.uid() = receiver_id
    );

DROP POLICY IF EXISTS "Users can create interactions" ON wolf_pack_interactions;
CREATE POLICY "Users can create interactions" ON wolf_pack_interactions
    FOR INSERT WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Users can update their sent interactions" ON wolf_pack_interactions;
CREATE POLICY "Users can update their sent interactions" ON wolf_pack_interactions
    FOR UPDATE USING (auth.uid() = sender_id);

-- =====================================================
-- FUNCTION PERMISSIONS
-- =====================================================

GRANT EXECUTE ON FUNCTION get_chat_data TO authenticated;
GRANT EXECUTE ON FUNCTION get_recent_conversations TO authenticated;
GRANT EXECUTE ON FUNCTION get_unread_message_count TO authenticated;

-- =====================================================
-- EXAMPLE USAGE
-- =====================================================

/*
-- Get chat data between current user and another user
SELECT get_chat_data(
    auth.uid(), 
    'other-user-uuid'::uuid
);

-- Get recent conversations for current user
SELECT * FROM get_recent_conversations(auth.uid(), 10);

-- Get unread message count for current user
SELECT get_unread_message_count(auth.uid());

-- Send a message
INSERT INTO wolf_private_messages (sender_id, receiver_id, message)
VALUES (auth.uid(), 'receiver-uuid'::uuid, 'Hello!');

-- Mark a message as read
UPDATE wolf_private_messages 
SET is_read = true 
WHERE id = 'message-uuid'::uuid 
AND receiver_id = auth.uid();

-- Block a user
INSERT INTO wolf_pack_interactions (sender_id, receiver_id, interaction_type, status)
VALUES (auth.uid(), 'user-to-block-uuid'::uuid, 'block', 'active');

-- Unblock a user
UPDATE wolf_pack_interactions 
SET status = 'inactive' 
WHERE sender_id = auth.uid() 
AND receiver_id = 'user-to-unblock-uuid'::uuid 
AND interaction_type = 'block';
*/