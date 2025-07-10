-- Fix notification system to make it fully functional
-- This migration adds missing columns and creates required functions

-- Add missing columns to notifications table
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS read BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW());

-- Update existing notifications to have titles
UPDATE public.notifications 
SET title = message 
WHERE title IS NULL;

-- Make title required after updating existing records
ALTER TABLE public.notifications 
ALTER COLUMN title SET NOT NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON public.notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- Create trigger to update updated_at
CREATE TRIGGER trigger_notifications_updated_at
    BEFORE UPDATE ON public.notifications
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to fetch notifications for a user
CREATE OR REPLACE FUNCTION public.fetch_notifications(
    p_id UUID DEFAULT NULL,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
    id UUID,
    recipient_id TEXT,
    type TEXT,
    title TEXT,
    message TEXT,
    link TEXT,
    read BOOLEAN,
    data JSONB,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    target_user_id UUID;
BEGIN
    -- Get the target user ID (current user if p_id is null)
    IF p_id IS NULL THEN
        target_user_id := auth.uid();
    ELSE
        target_user_id := p_id;
    END IF;
    
    -- Return notifications for the target user
    RETURN QUERY
    SELECT 
        n.id,
        n.recipient_id,
        n.type,
        n.title,
        n.message,
        n.link,
        n.read,
        n.data,
        n.created_at,
        n.updated_at
    FROM public.notifications n
    WHERE n.recipient_id = target_user_id::TEXT
    ORDER BY n.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- Create function to mark a notification as read
CREATE OR REPLACE FUNCTION public.mark_notification_read(
    p_notification_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    notification_exists BOOLEAN;
    current_user_id UUID;
BEGIN
    -- Get current user ID
    current_user_id := auth.uid();
    
    -- Check if notification exists and belongs to current user
    SELECT EXISTS(
        SELECT 1 FROM public.notifications 
        WHERE id = p_notification_id 
        AND recipient_id = current_user_id::TEXT
    ) INTO notification_exists;
    
    IF NOT notification_exists THEN
        RETURN FALSE;
    END IF;
    
    -- Mark as read
    UPDATE public.notifications 
    SET read = TRUE, updated_at = TIMEZONE('utc'::text, NOW())
    WHERE id = p_notification_id;
    
    RETURN TRUE;
END;
$$;

-- Create function to mark all notifications as read for a user
CREATE OR REPLACE FUNCTION public.mark_all_notifications_read()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    updated_count INTEGER;
    current_user_id UUID;
BEGIN
    -- Get current user ID
    current_user_id := auth.uid();
    
    -- Mark all unread notifications as read
    UPDATE public.notifications 
    SET read = TRUE, updated_at = TIMEZONE('utc'::text, NOW())
    WHERE recipient_id = current_user_id::TEXT 
    AND read = FALSE;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    
    RETURN updated_count;
END;
$$;

-- Create policies for notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications
    FOR SELECT USING (recipient_id = auth.uid()::TEXT);

CREATE POLICY "Users can update their own notifications" ON public.notifications
    FOR UPDATE USING (recipient_id = auth.uid()::TEXT);

-- Create policy for inserting notifications (for system/admin use)
CREATE POLICY "Service role can insert notifications" ON public.notifications
    FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT EXECUTE ON FUNCTION public.fetch_notifications(UUID, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_notification_read(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_all_notifications_read() TO authenticated;