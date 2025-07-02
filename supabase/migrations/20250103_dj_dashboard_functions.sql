-- DJ Dashboard Functions Migration
-- Add this file to your supabase/migrations/ folder

-- =====================================================
-- Function: get_wolfpack_live_stats
-- Returns live statistics for a location
-- =====================================================
CREATE OR REPLACE FUNCTION get_wolfpack_live_stats(p_location_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSON;
BEGIN
    WITH active_users AS (
        SELECT 
            u.id,
            u.display_name,
            u.profile_image_url,
            u.gender,
            u.vibe_status,
            CASE 
                WHEN u.last_seen_at > NOW() - INTERVAL '5 minutes' THEN true
                ELSE false
            END as is_very_active
        FROM users u
        JOIN wolf-pack-members wm ON u.id = wm.user_id
        WHERE wm.location_id = p_location_id
        AND wm.status = 'active'
        AND u.last_seen_at > NOW() - INTERVAL '30 minutes'
    ),
    gender_counts AS (
        SELECT 
            COALESCE(gender, 'unknown') as gender,
            COUNT(*) as count
        FROM active_users
        GROUP BY gender
    ),
    top_vibers AS (
        SELECT 
            au.id as user_id,
            au.display_name as name,
            au.profile_image_url as avatar,
            au.vibe_status as vibe
        FROM active_users au
        WHERE au.is_very_active = true
        ORDER BY RANDOM() -- Order by activity in real implementation
        LIMIT 5
    )
    SELECT json_build_object(
        'total_active', (SELECT COUNT(*) FROM active_users),
        'very_active', (SELECT COUNT(*) FROM active_users WHERE is_very_active = true),
        'gender_breakdown', (
            SELECT json_object_agg(gender, count) 
            FROM gender_counts
        ),
        'recent_interactions', json_build_object(
            'total_interactions', COALESCE((
                SELECT COUNT(*) 
                FROM dj_broadcast_responses dbr
                JOIN dj_broadcasts db ON dbr.broadcast_id = db.id
                WHERE db.location_id = p_location_id
                AND dbr.responded_at > NOW() - INTERVAL '30 minutes'
            ), 0),
            'active_participants', (SELECT COUNT(DISTINCT user_id) FROM active_users)
        ),
        'energy_level', LEAST(100, (
            SELECT COUNT(*) * 10 
            FROM active_users 
            WHERE is_very_active = true
        ))::numeric / 100.0, -- Return as decimal 0-1
        'top_vibers', COALESCE((
            SELECT json_agg(row_to_json(tv))
            FROM top_vibers tv
        ), '[]'::json)
    ) INTO v_result;
    
    RETURN v_result;
END;
$$;

-- =====================================================
-- Function: get_dj_dashboard_analytics
-- Returns analytics for DJ dashboard
-- =====================================================
CREATE OR REPLACE FUNCTION get_dj_dashboard_analytics(
    p_dj_id UUID,
    p_timeframe TEXT DEFAULT 'today'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_start_date TIMESTAMP;
    v_result JSON;
BEGIN
    -- Determine timeframe
    v_start_date := CASE p_timeframe
        WHEN 'today' THEN CURRENT_DATE
        WHEN 'week' THEN CURRENT_DATE - INTERVAL '7 days'
        WHEN 'month' THEN CURRENT_DATE - INTERVAL '30 days'
        ELSE CURRENT_DATE
    END;
    
    WITH broadcast_stats AS (
        SELECT 
            COUNT(*) as total_broadcasts,
            COUNT(DISTINCT broadcast_type) as broadcast_types_used,
            AVG(interaction_count) as avg_interactions,
            MAX(unique_participants) as max_participants,
            SUM(interaction_count) as total_responses,
            COUNT(DISTINCT dbr.user_id) as unique_responders
        FROM dj_broadcasts db
        LEFT JOIN dj_broadcast_responses dbr ON db.id = dbr.broadcast_id
        WHERE db.dj_id = p_dj_id
        AND db.created_at >= v_start_date
    ),
    response_times AS (
        SELECT 
            AVG(EXTRACT(EPOCH FROM (dbr.responded_at - db.sent_at))) as avg_response_time_seconds
        FROM dj_broadcasts db
        JOIN dj_broadcast_responses dbr ON db.id = dbr.broadcast_id
        WHERE db.dj_id = p_dj_id
        AND db.created_at >= v_start_date
        AND db.sent_at IS NOT NULL
    ),
    broadcasts_by_type AS (
        SELECT 
            broadcast_type,
            COUNT(*) as count
        FROM dj_broadcasts
        WHERE dj_id = p_dj_id
        AND created_at >= v_start_date
        GROUP BY broadcast_type
    ),
    top_broadcasts AS (
        SELECT 
            db.title,
            db.broadcast_type as type,
            db.interaction_count as responses,
            db.unique_participants as participants
        FROM dj_broadcasts db
        WHERE db.dj_id = p_dj_id
        AND db.created_at >= v_start_date
        ORDER BY db.interaction_count DESC
        LIMIT 5
    )
    SELECT json_build_object(
        'timeframe', p_timeframe,
        'start_date', v_start_date,
        'broadcasts', COALESCE((SELECT total_broadcasts FROM broadcast_stats), 0),
        'broadcast_types_used', COALESCE((SELECT broadcast_types_used FROM broadcast_stats), 0),
        'avg_interactions', COALESCE((SELECT avg_interactions FROM broadcast_stats), 0),
        'max_participants', COALESCE((SELECT max_participants FROM broadcast_stats), 0),
        'total_responses', COALESCE((SELECT total_responses FROM broadcast_stats), 0),
        'unique_responders', COALESCE((SELECT unique_responders FROM broadcast_stats), 0),
        'avg_response_time_seconds', COALESCE((SELECT avg_response_time_seconds FROM response_times), 0),
        'broadcasts_by_type', COALESCE((
            SELECT json_object_agg(broadcast_type, count)
            FROM broadcasts_by_type
        ), '{}'::json),
        'top_broadcasts', COALESCE((
            SELECT json_agg(row_to_json(tb))
            FROM top_broadcasts tb
        ), '[]'::json)
    ) INTO v_result;
    
    RETURN v_result;
END;
$$;

-- =====================================================
-- Function: quick_vibe_check
-- Creates a quick vibe check broadcast
-- =====================================================
CREATE OR REPLACE FUNCTION quick_vibe_check(
    p_dj_id UUID,
    p_location_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_broadcast_id UUID;
BEGIN
    INSERT INTO dj_broadcasts (
        dj_id,
        location_id,
        broadcast_type,
        title,
        message,
        priority,
        duration_seconds,
        auto_close,
        status,
        background_color,
        text_color,
        accent_color,
        animation_type,
        emoji_burst,
        interaction_config
    ) VALUES (
        p_dj_id,
        p_location_id,
        'vibe_check',
        '✨ VIBE CHECK!',
        'How''s everyone feeling? React with your current vibe!',
        'high',
        30,
        true,
        'active',
        '#ef4444',
        '#ffffff',
        '#fbbf24',
        'pulse',
        ARRAY['✨', '🔥', '💯', '🎉'],
        json_build_object(
            'response_type', 'emoji',
            'show_results_live', true,
            'anonymous_responses', false
        )
    ) RETURNING id INTO v_broadcast_id;
    
    -- Update sent_at and expires_at
    UPDATE dj_broadcasts 
    SET 
        sent_at = NOW(),
        expires_at = NOW() + INTERVAL '30 seconds'
    WHERE id = v_broadcast_id;
    
    RETURN v_broadcast_id;
END;
$$;

-- =====================================================
-- Function: single_ladies_spotlight
-- Creates a single ladies spotlight broadcast
-- =====================================================
CREATE OR REPLACE FUNCTION single_ladies_spotlight(
    p_dj_id UUID,
    p_location_id UUID,
    p_custom_message TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_broadcast_id UUID;
    v_message TEXT;
BEGIN
    v_message := COALESCE(
        p_custom_message, 
        '💃 All the single ladies, make some noise! This one''s for you! Get on the dance floor and show us what you got! 💜'
    );
    
    INSERT INTO dj_broadcasts (
        dj_id,
        location_id,
        broadcast_type,
        title,
        message,
        priority,
        duration_seconds,
        auto_close,
        status,
        background_color,
        text_color,
        accent_color,
        animation_type,
        emoji_burst,
        interaction_config
    ) VALUES (
        p_dj_id,
        p_location_id,
        'spotlight',
        '💃 SINGLE LADIES SPOTLIGHT!',
        v_message,
        'urgent',
        45,
        true,
        'active',
        '#ec4899',
        '#ffffff',
        '#fbbf24',
        'bounce',
        ARRAY['💃', '💜', '✨', '🔥', '👑'],
        json_build_object(
            'response_type', 'emoji',
            'show_results_live', true,
            'anonymous_responses', false
        )
    ) RETURNING id INTO v_broadcast_id;
    
    -- Update sent_at and expires_at
    UPDATE dj_broadcasts 
    SET 
        sent_at = NOW(),
        expires_at = NOW() + INTERVAL '45 seconds'
    WHERE id = v_broadcast_id;
    
    RETURN v_broadcast_id;
END;
$$;

-- =====================================================
-- Function: calculate_crowd_energy
-- Calculates the energy level of the crowd
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_crowd_energy(p_location_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_energy_level NUMERIC;
    v_active_users INTEGER;
    v_recent_interactions INTEGER;
    v_recent_broadcasts INTEGER;
BEGIN
    -- Count active users
    SELECT COUNT(*) INTO v_active_users
    FROM users u
    JOIN wolf-pack-members wm ON u.id = wm.user_id
    WHERE wm.location_id = p_location_id
    AND wm.status = 'active'
    AND u.last_seen_at > NOW() - INTERVAL '15 minutes';
    
    -- Count recent interactions
    SELECT COUNT(*) INTO v_recent_interactions
    FROM dj_broadcast_responses dbr
    JOIN dj_broadcasts db ON dbr.broadcast_id = db.id
    WHERE db.location_id = p_location_id
    AND dbr.responded_at > NOW() - INTERVAL '30 minutes';
    
    -- Count recent broadcasts
    SELECT COUNT(*) INTO v_recent_broadcasts
    FROM dj_broadcasts
    WHERE location_id = p_location_id
    AND created_at > NOW() - INTERVAL '1 hour'
    AND status = 'active';
    
    -- Calculate energy level (0-100)
    v_energy_level := LEAST(100, (
        (v_active_users * 5) + 
        (v_recent_interactions * 2) + 
        (v_recent_broadcasts * 10)
    ));
    
    RETURN v_energy_level;
END;
$$;

-- =====================================================
-- Function: send_broadcast_notification
-- Placeholder for notification sending
-- =====================================================
CREATE OR REPLACE FUNCTION send_broadcast_notification(p_broadcast_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- In a real implementation, this would trigger push notifications
    -- For now, just return success
    RETURN json_build_object(
        'success', true,
        'broadcast_id', p_broadcast_id,
        'timestamp', NOW()
    );
END;
$$;

-- =====================================================
-- Function: get_broadcast_results
-- Gets results for a specific broadcast
-- =====================================================
CREATE OR REPLACE FUNCTION get_broadcast_results(p_broadcast_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSON;
BEGIN
    WITH response_counts AS (
        SELECT 
            option_id,
            COUNT(*) as count
        FROM dj_broadcast_responses
        WHERE broadcast_id = p_broadcast_id
        AND option_id IS NOT NULL
        GROUP BY option_id
    ),
    total_responses AS (
        SELECT COUNT(*) as total
        FROM dj_broadcast_responses
        WHERE broadcast_id = p_broadcast_id
    ),
    results AS (
        SELECT 
            rc.option_id,
            rc.count,
            CASE 
                WHEN tr.total > 0 THEN (rc.count::numeric / tr.total * 100)::integer
                ELSE 0
            END as percentage
        FROM response_counts rc
        CROSS JOIN total_responses tr
    )
    SELECT json_build_object(
        'broadcast_id', p_broadcast_id,
        'total_responses', (SELECT total FROM total_responses),
        'results', COALESCE((
            SELECT json_agg(row_to_json(r))
            FROM results r
        ), '[]'::json)
    ) INTO v_result;
    
    RETURN v_result;
END;
$$;

-- =====================================================
-- Create active_broadcasts_live view if not exists
-- =====================================================
CREATE OR REPLACE VIEW active_broadcasts_live AS
SELECT 
    db.*,
    CASE 
        WHEN db.expires_at IS NOT NULL THEN 
            GREATEST(0, EXTRACT(EPOCH FROM (db.expires_at - NOW())))::integer
        ELSE NULL
    END as seconds_remaining,
    u.display_name as dj_name,
    u.profile_image_url as dj_avatar
FROM dj_broadcasts db
LEFT JOIN users u ON db.dj_id = u.id
WHERE db.status IN ('active', 'paused');

-- Grant permissions
GRANT ALL ON FUNCTION get_wolfpack_live_stats TO authenticated;
GRANT ALL ON FUNCTION get_dj_dashboard_analytics TO authenticated;
GRANT ALL ON FUNCTION quick_vibe_check TO authenticated;
GRANT ALL ON FUNCTION single_ladies_spotlight TO authenticated;
GRANT ALL ON FUNCTION calculate_crowd_energy TO authenticated;
GRANT ALL ON FUNCTION send_broadcast_notification TO authenticated;
GRANT ALL ON FUNCTION get_broadcast_results TO authenticated;
GRANT ALL ON active_broadcasts_live TO authenticated;