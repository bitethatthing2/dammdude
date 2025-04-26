-- Create notification types enum
CREATE TYPE public.notification_type AS ENUM ('info', 'warning', 'error');

-- Create notifications table for user-facing notifications
CREATE TABLE public.notifications (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type public.notification_type NOT NULL DEFAULT 'info',
    body TEXT NOT NULL,
    link TEXT,
    dismissed BOOLEAN NOT NULL DEFAULT false,
    expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '1 month'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for efficient queries
CREATE INDEX idx_notifications_user_dismissed
ON public.notifications (user_id, dismissed, expires_at);

-- Enable Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own notifications
CREATE POLICY notifications_read_self
ON public.notifications FOR SELECT
TO authenticated
USING (
    user_id = (select auth.uid())
);

-- Allow users to dismiss their notifications
CREATE POLICY notifications_update_self
ON public.notifications FOR UPDATE
TO authenticated
USING (
    user_id = (select auth.uid())
)
WITH CHECK (
    user_id = (select auth.uid()) AND
    (
        -- Only allow updating the dismissed field
        (dismissed IS DISTINCT FROM dismissed AND
         type IS NOT DISTINCT FROM type AND
         body IS NOT DISTINCT FROM body AND
         link IS NOT DISTINCT FROM link AND
         expires_at IS NOT DISTINCT FROM expires_at)
    )
);

-- Allow service role to create notifications
CREATE POLICY notifications_insert_service
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create function to automatically clean up expired notifications
CREATE OR REPLACE FUNCTION cleanup_expired_notifications()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM public.notifications
    WHERE expires_at < NOW();
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to run cleanup function daily
CREATE TRIGGER trigger_cleanup_expired_notifications
AFTER INSERT ON public.notifications
EXECUTE PROCEDURE cleanup_expired_notifications();

-- Comments
COMMENT ON TABLE public.notifications IS 'User-facing notifications with real-time updates';
COMMENT ON COLUMN public.notifications.id IS 'Primary key';
COMMENT ON COLUMN public.notifications.user_id IS 'User who will receive the notification';
COMMENT ON COLUMN public.notifications.type IS 'Type of notification (info, warning, error)';
COMMENT ON COLUMN public.notifications.body IS 'Notification message content';
COMMENT ON COLUMN public.notifications.link IS 'Optional URL to navigate to when clicked';
COMMENT ON COLUMN public.notifications.dismissed IS 'Whether the notification has been dismissed by the user';
COMMENT ON COLUMN public.notifications.expires_at IS 'When the notification should expire and be deleted';
COMMENT ON COLUMN public.notifications.created_at IS 'When the notification was created';
