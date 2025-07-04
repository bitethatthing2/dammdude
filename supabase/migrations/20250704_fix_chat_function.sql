-- Fix the get_wolfpack_chat_messages function
-- Remove the conflicting ORDER BY clauses that cause GROUP BY errors

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
    
    -- Get messages with sender info - fixed to avoid GROUP BY issues
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
        )
    ), '[]') INTO v_messages
    FROM (
        SELECT wcm.*, u.id as user_id, u.display_name, u.first_name, u.wolf_emoji, u.profile_image_url, u.avatar_url
        FROM wolfpack_chat_messages wcm
        JOIN users u ON wcm.sender_id = u.id
        WHERE wcm.session_id = p_session_id
        AND wcm.deleted_at IS NULL
        ORDER BY wcm.created_at DESC
        LIMIT p_limit
        OFFSET p_offset
    ) wcm_with_users;
    
    RETURN v_messages;
END;
$$;