-- =====================================================
-- COMPLETE DJ DASHBOARD SCHEMA & FUNCTIONALITY
-- Based on your current Supabase database structure
-- =====================================================

-- =====================================================
-- CORE DJ TABLES
-- =====================================================

-- DJ Dashboard State (Real-time DJ control center)
CREATE TABLE IF NOT EXISTS dj_dashboard_state (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    dj_id uuid REFERENCES users(id),
    current_broadcast_id uuid,
    is_live boolean DEFAULT false,
    broadcast_queue jsonb DEFAULT '[]',
    auto_queue_enabled boolean DEFAULT false,
    current_crowd_size integer DEFAULT 0,
    current_energy_level integer DEFAULT 5,
    active_participants uuid[] DEFAULT '{}',
    dashboard_config jsonb DEFAULT '{
        "theme": "dark", 
        "quick_actions": ["vibe_check", "song_battle", "shout_out", "single_ladies", "shots_time"], 
        "default_colors": {"text": "#ffffff", "accent": "#ff0066", "background": "#1a1a1a"}, 
        "show_analytics": true, 
        "auto_close_polls": true, 
        "default_duration": 60, 
        "notification_sound": true
    }',
    updated_at timestamp with time zone DEFAULT now()
);

-- DJ Broadcasts (Messages/interactions sent to the pack)
CREATE TABLE IF NOT EXISTS dj_broadcasts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    dj_id uuid REFERENCES users(id),
    location_id uuid REFERENCES locations(id),
    session_id uuid,
    
    -- Message Content
    title text NOT NULL,
    subtitle text,
    message text NOT NULL,
    broadcast_type text DEFAULT 'general' CHECK (broadcast_type IN ('general', 'howl_request', 'contest_announcement', 'song_request', 'vibe_check', 'spotlight', 'event')),
    
    -- Visual Styling
    background_color text DEFAULT '#1a1a1a',
    text_color text DEFAULT '#ffffff',
    accent_color text DEFAULT '#ff0066',
    animation_type text DEFAULT 'pulse',
    emoji_burst text[],
    
    -- Interaction Settings
    interaction_config jsonb DEFAULT '{}',
    duration_seconds integer DEFAULT 60,
    auto_close boolean DEFAULT true,
    priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    
    -- Status & Metrics
    status text DEFAULT 'active' CHECK (status IN ('draft', 'active', 'completed', 'cancelled', 'expired')),
    sent_at timestamp with time zone,
    expires_at timestamp with time zone,
    closed_at timestamp with time zone,
    view_count integer DEFAULT 0,
    interaction_count integer DEFAULT 0,
    unique_participants integer DEFAULT 0,
    
    -- Organization
    tags text[],
    category text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- DJ Broadcast Responses (User responses to broadcasts)
CREATE TABLE IF NOT EXISTS dj_broadcast_responses (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    broadcast_id uuid REFERENCES dj_broadcasts(id),
    user_id uuid REFERENCES users(id),
    
    -- Response Data
    response_type text NOT NULL CHECK (response_type IN ('option_select', 'text_response', 'emoji_reaction', 'voice_note', 'photo', 'multiple_choice', 'text', 'emoji', 'media')),
    option_id text,
    text_response text,
    emoji text,
    media_url text,
    response_metadata jsonb DEFAULT '{}',
    
    -- Context
    device_type text,
    responded_at timestamp with time zone DEFAULT now(),
    
    -- Moderation
    is_anonymous boolean DEFAULT false,
    is_featured boolean DEFAULT false,
    is_hidden boolean DEFAULT false,
    moderation_status text DEFAULT 'pending'
);

-- DJ Events (Interactive events like dance battles, polls, contests)
CREATE TABLE IF NOT EXISTS dj_events (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    dj_id uuid REFERENCES users(id),
    location_id uuid REFERENCES locations(id),
    
    -- Event Details
    event_type text NOT NULL CHECK (event_type IN ('dance_battle', 'hottest_person', 'best_costume', 'name_that_tune', 'song_request', 'next_song_vote', 'trivia', 'contest', 'poll', 'custom')),
    title text NOT NULL,
    description text,
    
    -- Status & Timing
    status text DEFAULT 'active' CHECK (status IN ('pending', 'active', 'voting', 'completed', 'cancelled')),
    created_at timestamp with time zone DEFAULT now(),
    started_at timestamp with time zone,
    ended_at timestamp with time zone,
    voting_ends_at timestamp with time zone,
    
    -- Results
    winner_id uuid REFERENCES users(id),
    winner_data jsonb,
    
    -- Configuration
    event_config jsonb,
    voting_format text CHECK (voting_format IN ('binary', 'multiple_choice', 'participant')),
    options jsonb
);

-- DJ Event Participants (People participating in events)
CREATE TABLE IF NOT EXISTS dj_event_participants (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id uuid REFERENCES dj_events(id),
    participant_id uuid REFERENCES users(id),
    participant_number integer,
    added_at timestamp with time zone DEFAULT now(),
    metadata jsonb
);

-- DJ Broadcast Templates (Reusable broadcast templates)
CREATE TABLE IF NOT EXISTS dj_broadcast_templates (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    dj_id uuid REFERENCES users(id),
    template_name text NOT NULL,
    message_template text NOT NULL,
    emoji_prefix text DEFAULT '🎵',
    emoji_suffix text DEFAULT '🎵',
    is_global boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);

-- DJ Event Templates (Pre-built event templates)
CREATE TABLE IF NOT EXISTS dj_event_templates (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    template_name text NOT NULL,
    category text NOT NULL,
    description text,
    broadcast_type text NOT NULL,
    default_title text NOT NULL,
    default_message text NOT NULL,
    default_options jsonb,
    default_duration integer DEFAULT 60,
    customization_config jsonb DEFAULT '{}',
    usage_count integer DEFAULT 0,
    last_used_at timestamp with time zone,
    is_premium boolean DEFAULT false,
    tags text[],
    created_by uuid REFERENCES users(id),
    is_public boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);

-- DJ Analytics (Performance metrics and insights)
CREATE TABLE IF NOT EXISTS dj_analytics (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    dj_id uuid REFERENCES users(id),
    session_id uuid,
    session_date date,
    
    -- Broadcast Metrics
    total_broadcasts integer DEFAULT 0,
    total_responses integer DEFAULT 0,
    unique_participants integer DEFAULT 0,
    peak_concurrent_users integer DEFAULT 0,
    
    -- Engagement Analytics
    top_broadcast_types jsonb DEFAULT '[]',
    most_engaged_broadcasts jsonb DEFAULT '[]',
    response_rate_by_type jsonb DEFAULT '{}',
    peak_engagement_times jsonb DEFAULT '[]',
    average_response_time integer,
    
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- DJ Dashboard State
CREATE INDEX IF NOT EXISTS idx_dj_dashboard_state_dj_id ON dj_dashboard_state(dj_id);
CREATE INDEX IF NOT EXISTS idx_dj_dashboard_state_is_live ON dj_dashboard_state(dj_id, is_live);

-- DJ Broadcasts
CREATE INDEX IF NOT EXISTS idx_dj_broadcasts_dj_id ON dj_broadcasts(dj_id);
CREATE INDEX IF NOT EXISTS idx_dj_broadcasts_location_created ON dj_broadcasts(location_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dj_broadcasts_status_created ON dj_broadcasts(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dj_broadcasts_active ON dj_broadcasts(status, expires_at) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_dj_broadcasts_type ON dj_broadcasts(broadcast_type);

-- DJ Broadcast Responses
CREATE INDEX IF NOT EXISTS idx_dj_broadcast_responses_broadcast ON dj_broadcast_responses(broadcast_id);
CREATE INDEX IF NOT EXISTS idx_dj_broadcast_responses_user ON dj_broadcast_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_dj_broadcast_responses_type ON dj_broadcast_responses(response_type);
CREATE INDEX IF NOT EXISTS idx_dj_broadcast_responses_responded_at ON dj_broadcast_responses(responded_at DESC);

-- DJ Events
CREATE INDEX IF NOT EXISTS idx_dj_events_dj_location ON dj_events(dj_id, location_id);
CREATE INDEX IF NOT EXISTS idx_dj_events_status_created ON dj_events(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dj_events_type ON dj_events(event_type);
CREATE INDEX IF NOT EXISTS idx_dj_events_active ON dj_events(status, voting_ends_at) WHERE status IN ('active', 'voting');

-- DJ Analytics
CREATE INDEX IF NOT EXISTS idx_dj_analytics_dj_date ON dj_analytics(dj_id, session_date DESC);
CREATE INDEX IF NOT EXISTS idx_dj_analytics_session ON dj_analytics(session_id);

-- =====================================================
-- CORE DJ FUNCTIONS
-- =====================================================

-- Function: Get DJ Dashboard Analytics
CREATE OR REPLACE FUNCTION get_dj_dashboard_analytics(
    p_dj_id UUID,
    p_timeframe TEXT DEFAULT 'today'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_result JSON;
    v_date_filter DATE;
    v_broadcasts_today INTEGER;
    v_responses_today INTEGER;
    v_engagement_rate NUMERIC;
    v_top_broadcast_types JSON;
    v_recent_broadcasts JSON;
BEGIN
    -- Set date filter based on timeframe
    CASE p_timeframe
        WHEN 'today' THEN v_date_filter := CURRENT_DATE;
        WHEN 'week' THEN v_date_filter := CURRENT_DATE - INTERVAL '7 days';
        WHEN 'month' THEN v_date_filter := CURRENT_DATE - INTERVAL '30 days';
        ELSE v_date_filter := CURRENT_DATE;
    END CASE;
    
    -- Get broadcast count
    SELECT COUNT(*) INTO v_broadcasts_today
    FROM dj_broadcasts 
    WHERE dj_id = p_dj_id 
    AND created_at >= v_date_filter;
    
    -- Get response count
    SELECT COUNT(*) INTO v_responses_today
    FROM dj_broadcast_responses dbr
    JOIN dj_broadcasts db ON dbr.broadcast_id = db.id
    WHERE db.dj_id = p_dj_id 
    AND dbr.responded_at >= v_date_filter;
    
    -- Calculate engagement rate
    v_engagement_rate := CASE 
        WHEN v_broadcasts_today > 0 THEN ROUND((v_responses_today::NUMERIC / v_broadcasts_today::NUMERIC) * 100, 2)
        ELSE 0 
    END;
    
    -- Get top broadcast types
    SELECT COALESCE(json_agg(
        json_build_object(
            'type', broadcast_type,
            'count', type_count,
            'avg_responses', avg_responses
        )
    ), '[]') INTO v_top_broadcast_types
    FROM (
        SELECT 
            db.broadcast_type,
            COUNT(*) as type_count,
            ROUND(AVG(db.interaction_count), 1) as avg_responses
        FROM dj_broadcasts db
        WHERE db.dj_id = p_dj_id 
        AND db.created_at >= v_date_filter
        GROUP BY db.broadcast_type
        ORDER BY type_count DESC
        LIMIT 5
    ) broadcast_stats;
    
    -- Get recent broadcasts
    SELECT COALESCE(json_agg(
        json_build_object(
            'id', id,
            'title', title,
            'broadcast_type', broadcast_type,
            'interaction_count', interaction_count,
            'view_count', view_count,
            'created_at', created_at,
            'status', status
        ) ORDER BY created_at DESC
    ), '[]') INTO v_recent_broadcasts
    FROM dj_broadcasts
    WHERE dj_id = p_dj_id
    AND created_at >= v_date_filter
    LIMIT 10;
    
    -- Build result
    SELECT json_build_object(
        'timeframe', p_timeframe,
        'broadcasts_count', v_broadcasts_today,
        'responses_count', v_responses_today,
        'engagement_rate', v_engagement_rate,
        'top_broadcast_types', v_top_broadcast_types,
        'recent_broadcasts', v_recent_broadcasts,
        'generated_at', now()
    ) INTO v_result;
    
    RETURN v_result;
END;
$$;

-- Function: Create DJ Broadcast
CREATE OR REPLACE FUNCTION dj_broadcast_message(
    p_message TEXT,
    p_broadcast_type TEXT DEFAULT 'general'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_broadcast_id UUID;
    v_dj_id UUID;
    v_location_id UUID;
    v_result JSONB;
BEGIN
    -- Get current user as DJ
    SELECT u.id, u.location_id INTO v_dj_id, v_location_id
    FROM users u
    WHERE u.auth_id = auth.uid() AND u.role = 'dj';
    
    IF v_dj_id IS NULL THEN
        RETURN json_build_object('error', 'User is not a DJ');
    END IF;
    
    -- Create broadcast
    INSERT INTO dj_broadcasts (
        dj_id, 
        location_id,
        title, 
        message, 
        broadcast_type,
        sent_at,
        expires_at
    ) VALUES (
        v_dj_id,
        v_location_id,
        'DJ Broadcast',
        p_message,
        p_broadcast_type,
        now(),
        now() + interval '60 seconds'
    ) RETURNING id INTO v_broadcast_id;
    
    -- Update dashboard state
    INSERT INTO dj_dashboard_state (dj_id, current_broadcast_id, is_live)
    VALUES (v_dj_id, v_broadcast_id, true)
    ON CONFLICT (dj_id) DO UPDATE SET
        current_broadcast_id = v_broadcast_id,
        is_live = true,
        updated_at = now();
    
    -- Return result
    SELECT json_build_object(
        'broadcast_id', v_broadcast_id,
        'status', 'sent',
        'message', p_message,
        'expires_at', now() + interval '60 seconds'
    ) INTO v_result;
    
    RETURN v_result;
END;
$$;

-- Function: Record Broadcast Response
CREATE OR REPLACE FUNCTION record_broadcast_response(
    p_broadcast_id UUID,
    p_response_type TEXT,
    p_option_id TEXT DEFAULT NULL,
    p_text_response TEXT DEFAULT NULL,
    p_emoji TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_user_id UUID;
    v_response_id UUID;
    v_result JSONB;
BEGIN
    -- Get current user
    SELECT id INTO v_user_id 
    FROM users 
    WHERE auth_id = auth.uid();
    
    IF v_user_id IS NULL THEN
        RETURN json_build_object('error', 'User not found');
    END IF;
    
    -- Insert response
    INSERT INTO dj_broadcast_responses (
        broadcast_id,
        user_id,
        response_type,
        option_id,
        text_response,
        emoji
    ) VALUES (
        p_broadcast_id,
        v_user_id,
        p_response_type,
        p_option_id,
        p_text_response,
        p_emoji
    ) RETURNING id INTO v_response_id;
    
    -- Update broadcast interaction count
    UPDATE dj_broadcasts 
    SET 
        interaction_count = interaction_count + 1,
        updated_at = now()
    WHERE id = p_broadcast_id;
    
    -- Return result
    SELECT json_build_object(
        'response_id', v_response_id,
        'status', 'recorded',
        'broadcast_id', p_broadcast_id
    ) INTO v_result;
    
    RETURN v_result;
END;
$$;

-- Function: Get Broadcast Results
CREATE OR REPLACE FUNCTION get_broadcast_results(p_broadcast_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_result JSON;
    v_broadcast JSON;
    v_responses JSON;
    v_response_stats JSON;
BEGIN
    -- Get broadcast details
    SELECT json_build_object(
        'id', id,
        'title', title,
        'message', message,
        'broadcast_type', broadcast_type,
        'interaction_count', interaction_count,
        'view_count', view_count,
        'created_at', created_at,
        'status', status
    ) INTO v_broadcast
    FROM dj_broadcasts
    WHERE id = p_broadcast_id;
    
    -- Get responses
    SELECT COALESCE(json_agg(
        json_build_object(
            'id', dbr.id,
            'response_type', dbr.response_type,
            'option_id', dbr.option_id,
            'text_response', dbr.text_response,
            'emoji', dbr.emoji,
            'responded_at', dbr.responded_at,
            'user', json_build_object(
                'id', u.id,
                'display_name', COALESCE(u.display_name, u.first_name),
                'wolf_emoji', u.wolf_emoji
            )
        ) ORDER BY dbr.responded_at DESC
    ), '[]') INTO v_responses
    FROM dj_broadcast_responses dbr
    JOIN users u ON dbr.user_id = u.id
    WHERE dbr.broadcast_id = p_broadcast_id;
    
    -- Get response statistics
    SELECT json_build_object(
        'total_responses', COUNT(*),
        'response_types', json_object_agg(response_type, type_count)
    ) INTO v_response_stats
    FROM (
        SELECT 
            response_type,
            COUNT(*) as type_count
        FROM dj_broadcast_responses
        WHERE broadcast_id = p_broadcast_id
        GROUP BY response_type
    ) stats;
    
    -- Build result
    SELECT json_build_object(
        'broadcast', v_broadcast,
        'responses', v_responses,
        'statistics', v_response_stats
    ) INTO v_result;
    
    RETURN v_result;
END;
$$;

-- Function: Create DJ Event
CREATE OR REPLACE FUNCTION create_dj_event(
    p_event_type TEXT,
    p_title TEXT,
    p_description TEXT DEFAULT NULL,
    p_voting_duration_minutes INTEGER DEFAULT 5,
    p_location_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_event_id UUID;
    v_dj_id UUID;
    v_result JSONB;
BEGIN
    -- Get current user as DJ
    SELECT u.id INTO v_dj_id 
    FROM users u
    WHERE u.auth_id = auth.uid() AND u.role = 'dj';
    
    IF v_dj_id IS NULL THEN
        RETURN json_build_object('error', 'User is not a DJ');
    END IF;
    
    -- Create event
    INSERT INTO dj_events (
        dj_id,
        location_id,
        event_type,
        title,
        description,
        status,
        started_at,
        voting_ends_at
    ) VALUES (
        v_dj_id,
        p_location_id,
        p_event_type,
        p_title,
        p_description,
        'active',
        now(),
        now() + (p_voting_duration_minutes || ' minutes')::interval
    ) RETURNING id INTO v_event_id;
    
    -- Return result
    SELECT json_build_object(
        'event_id', v_event_id,
        'status', 'created',
        'event_type', p_event_type,
        'voting_ends_at', now() + (p_voting_duration_minutes || ' minutes')::interval
    ) INTO v_result;
    
    RETURN v_result;
END;
$$;

-- Function: Close DJ Event
CREATE OR REPLACE FUNCTION close_dj_event(p_event_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_result JSONB;
    v_winner_id UUID;
    v_vote_count INTEGER;
BEGIN
    -- Get winner (most voted participant)
    SELECT 
        participant_id,
        COUNT(*) as votes
    INTO v_winner_id, v_vote_count
    FROM wolf_pack_votes
    WHERE voted_for_id IN (
        SELECT participant_id 
        FROM dj_event_participants 
        WHERE event_id = p_event_id
    )
    GROUP BY participant_id
    ORDER BY votes DESC
    LIMIT 1;
    
    -- Update event
    UPDATE dj_events 
    SET 
        status = 'completed',
        ended_at = now(),
        winner_id = v_winner_id,
        winner_data = json_build_object('vote_count', COALESCE(v_vote_count, 0))
    WHERE id = p_event_id;
    
    -- Return result
    SELECT json_build_object(
        'event_id', p_event_id,
        'status', 'completed',
        'winner_id', v_winner_id,
        'vote_count', COALESCE(v_vote_count, 0)
    ) INTO v_result;
    
    RETURN v_result;
END;
$$;

-- Function: Create Broadcast from Template
CREATE OR REPLACE FUNCTION create_broadcast_from_template(
    p_template_id UUID,
    p_dj_id UUID,
    p_location_id UUID,
    p_customizations JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_template RECORD;
    v_broadcast_id UUID;
    v_final_message TEXT;
BEGIN
    -- Get template
    SELECT * INTO v_template
    FROM dj_broadcast_templates
    WHERE id = p_template_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Template not found';
    END IF;
    
    -- Apply customizations to message
    v_final_message := v_template.emoji_prefix || ' ' || 
                      COALESCE(p_customizations->>'message', v_template.message_template) || 
                      ' ' || v_template.emoji_suffix;
    
    -- Create broadcast
    INSERT INTO dj_broadcasts (
        dj_id,
        location_id,
        title,
        message,
        broadcast_type,
        background_color,
        text_color,
        accent_color,
        sent_at,
        expires_at
    ) VALUES (
        p_dj_id,
        p_location_id,
        COALESCE(p_customizations->>'title', v_template.template_name),
        v_final_message,
        'general',
        COALESCE(p_customizations->>'background_color', '#1a1a1a'),
        COALESCE(p_customizations->>'text_color', '#ffffff'),
        COALESCE(p_customizations->>'accent_color', '#ff0066'),
        now(),
        now() + interval '60 seconds'
    ) RETURNING id INTO v_broadcast_id;
    
    RETURN v_broadcast_id;
END;
$$;

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE dj_dashboard_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE dj_broadcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE dj_broadcast_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE dj_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE dj_event_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE dj_broadcast_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE dj_event_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE dj_analytics ENABLE ROW LEVEL SECURITY;

-- DJ Dashboard State Policies
DROP POLICY IF EXISTS "DJs can manage their dashboard state" ON dj_dashboard_state;
CREATE POLICY "DJs can manage their dashboard state" ON dj_dashboard_state
    FOR ALL USING (
        dj_id IN (SELECT id FROM users WHERE auth_id = auth.uid()) OR 
        EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'admin')
    );

-- DJ Broadcasts Policies
DROP POLICY IF EXISTS "DJs can manage broadcasts" ON dj_broadcasts;
CREATE POLICY "DJs can manage broadcasts" ON dj_broadcasts
    FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role IN ('dj', 'admin'))
    );

DROP POLICY IF EXISTS "Everyone can view active broadcasts" ON dj_broadcasts;
CREATE POLICY "Everyone can view active broadcasts" ON dj_broadcasts
    FOR SELECT USING (status = 'active' AND expires_at > now());

-- DJ Broadcast Responses Policies
DROP POLICY IF EXISTS "Users can respond to broadcasts" ON dj_broadcast_responses;
CREATE POLICY "Users can respond to broadcasts" ON dj_broadcast_responses
    FOR INSERT WITH CHECK (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

DROP POLICY IF EXISTS "Users can view responses" ON dj_broadcast_responses;
CREATE POLICY "Users can view responses" ON dj_broadcast_responses
    FOR SELECT USING (
        user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()) OR
        EXISTS (
            SELECT 1 FROM dj_broadcasts 
            WHERE id = broadcast_id AND dj_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
        ) OR
        EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'admin')
    );

-- DJ Events Policies
DROP POLICY IF EXISTS "DJs can manage events" ON dj_events;
CREATE POLICY "DJs can manage events" ON dj_events
    FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role IN ('dj', 'admin'))
    );

DROP POLICY IF EXISTS "Everyone can view active events" ON dj_events;
CREATE POLICY "Everyone can view active events" ON dj_events
    FOR SELECT USING (status IN ('active', 'voting'));

-- DJ Event Participants Policies
DROP POLICY IF EXISTS "DJs can manage participants" ON dj_event_participants;
CREATE POLICY "DJs can manage participants" ON dj_event_participants
    FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role IN ('dj', 'admin'))
    );

-- DJ Templates Policies
DROP POLICY IF EXISTS "DJs can manage templates" ON dj_broadcast_templates;
CREATE POLICY "DJs can manage templates" ON dj_broadcast_templates
    FOR ALL USING (
        dj_id IN (SELECT id FROM users WHERE auth_id = auth.uid()) OR 
        EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'admin')
    );

DROP POLICY IF EXISTS "DJs can view all templates" ON dj_broadcast_templates;
CREATE POLICY "DJs can view all templates" ON dj_broadcast_templates
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role IN ('dj', 'admin'))
    );

-- DJ Event Templates Policies
DROP POLICY IF EXISTS "Everyone can view public templates" ON dj_event_templates;
CREATE POLICY "Everyone can view public templates" ON dj_event_templates
    FOR SELECT USING (is_public = true OR created_by IN (SELECT id FROM users WHERE auth_id = auth.uid()));

DROP POLICY IF EXISTS "DJs can create templates" ON dj_event_templates;
CREATE POLICY "DJs can create templates" ON dj_event_templates
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role IN ('dj', 'admin'))
    );

-- DJ Analytics Policies
DROP POLICY IF EXISTS "DJs can view their analytics" ON dj_analytics;
CREATE POLICY "DJs can view their analytics" ON dj_analytics
    FOR SELECT USING (
        dj_id IN (SELECT id FROM users WHERE auth_id = auth.uid()) OR 
        EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'admin')
    );

-- =====================================================
-- FUNCTION PERMISSIONS
-- =====================================================

GRANT EXECUTE ON FUNCTION get_dj_dashboard_analytics TO authenticated;
GRANT EXECUTE ON FUNCTION dj_broadcast_message TO authenticated;
GRANT EXECUTE ON FUNCTION record_broadcast_response TO authenticated;
GRANT EXECUTE ON FUNCTION get_broadcast_results TO authenticated;
GRANT EXECUTE ON FUNCTION create_dj_event TO authenticated;
GRANT EXECUTE ON FUNCTION close_dj_event TO authenticated;
GRANT EXECUTE ON FUNCTION create_broadcast_from_template TO authenticated;

-- =====================================================
-- INSERT SAMPLE EVENT TEMPLATES
-- =====================================================

INSERT INTO dj_event_templates (template_name, category, description, broadcast_type, default_title, default_message, default_options, default_duration, tags) VALUES
('Dance Battle Royale', 'contest', 'Epic dance battle between pack members', 'contest_announcement', 'Dance Battle Royale! 💃🕺', 'Time for an epic dance battle! Who has the best moves tonight?', '{"options": [{"id": "1", "text": "Contestant 1", "emoji": "💃"}, {"id": "2", "text": "Contestant 2", "emoji": "🕺"}]}', 120, ARRAY['dance', 'battle', 'contest']),
('Hottest Pack Member', 'contest', 'Vote for the hottest person in the pack tonight', 'contest_announcement', 'Hottest Pack Member Contest! 🔥', 'Who is looking absolutely stunning tonight? Vote for your pick!', '{"options": [{"id": "1", "text": "Option 1", "emoji": "🔥"}, {"id": "2", "text": "Option 2", "emoji": "💯"}]}', 180, ARRAY['hottest', 'contest', 'voting']),
('Song Request Battle', 'music', 'Let the pack vote on the next song', 'song_request', 'Song Request Battle! 🎵', 'What should we play next? Vote for your favorite!', '{"options": [{"id": "1", "text": "Hip Hop", "emoji": "🎤"}, {"id": "2", "text": "EDM", "emoji": "🎧"}, {"id": "3", "text": "Pop", "emoji": "🎵"}]}', 60, ARRAY['music', 'song', 'voting']),
('Vibe Check', 'engagement', 'Quick energy check with the crowd', 'general', 'Vibe Check! ✨', 'How is everyone feeling right now? Let me know your energy!', '{"options": [{"id": "1", "text": "🔥 On Fire", "emoji": "🔥"}, {"id": "2", "text": "✨ Good Vibes", "emoji": "✨"}, {"id": "3", "text": "😴 Warming Up", "emoji": "😴"}]}', 30, ARRAY['vibe', 'energy', 'quick']),
('Single Ladies Spotlight', 'social', 'Special shoutout for single ladies', 'general', 'Single Ladies Spotlight! 💃', 'All the single ladies, this one is for you! Show us what you got!', '{"options": [{"id": "1", "text": "💃 Dancing", "emoji": "💃"}, {"id": "2", "text": "🎉 Party", "emoji": "🎉"}, {"id": "3", "text": "✨ Vibing", "emoji": "✨"}]}', 45, ARRAY['ladies', 'spotlight', 'social'])
ON CONFLICT DO NOTHING;

-- =====================================================
-- UPDATE TRIGGERS FOR TIMESTAMPS
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_dj_dashboard_state_updated_at BEFORE UPDATE ON dj_dashboard_state FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_dj_broadcasts_updated_at BEFORE UPDATE ON dj_broadcasts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_dj_analytics_updated_at BEFORE UPDATE ON dj_analytics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- CREATE VIEW FOR ACTIVE BROADCASTS WITH DJ INFO
-- =====================================================

CREATE OR REPLACE VIEW active_broadcasts_live AS
SELECT 
    db.*,
    EXTRACT(EPOCH FROM (db.expires_at - now()))::integer as seconds_remaining,
    u.display_name as dj_name,
    u.avatar_url as dj_avatar
FROM dj_broadcasts db
JOIN users u ON db.dj_id = u.id
WHERE db.status = 'active' 
AND db.expires_at > now()
ORDER BY db.created_at DESC;

-- Grant access to the view
GRANT SELECT ON active_broadcasts_live TO authenticated;