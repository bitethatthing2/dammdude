-- Create table for storing sent notifications
CREATE TABLE IF NOT EXISTS sent_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  image_url TEXT,
  action_url TEXT,
  topic TEXT,
  platform TEXT,
  android_config JSONB,
  ios_config JSONB,
  web_config JSONB,
  recipient_count INT NOT NULL,
  delivered_count INT,
  opened_count INT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS sent_notifications_created_at_idx ON sent_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS sent_notifications_topic_idx ON sent_notifications(topic);
CREATE INDEX IF NOT EXISTS sent_notifications_platform_idx ON sent_notifications(platform);

-- Create RLS policies
ALTER TABLE sent_notifications ENABLE ROW LEVEL SECURITY;

-- Policy for admin to insert new notifications
CREATE POLICY insert_sent_notifications ON sent_notifications
  FOR INSERT
  WITH CHECK ((SELECT auth.role() FROM auth.users WHERE auth.uid() = auth.uid()) = 'authenticated');

-- Policy for selecting notifications
CREATE POLICY select_sent_notifications ON sent_notifications
  FOR SELECT
  USING (true); -- Everyone can view sent notifications

-- Policy for admins to update notification metrics
CREATE POLICY update_sent_notifications ON sent_notifications
  FOR UPDATE
  USING ((SELECT auth.role() FROM auth.users WHERE auth.uid() = auth.uid()) = 'authenticated');

-- Comments
COMMENT ON TABLE sent_notifications IS 'Stores history of sent notifications';
COMMENT ON COLUMN sent_notifications.title IS 'Notification title';
COMMENT ON COLUMN sent_notifications.body IS 'Notification message body';
COMMENT ON COLUMN sent_notifications.image_url IS 'Optional image URL';
COMMENT ON COLUMN sent_notifications.action_url IS 'Optional URL to open when notification is clicked';
COMMENT ON COLUMN sent_notifications.topic IS 'Topic the notification was sent to';
COMMENT ON COLUMN sent_notifications.platform IS 'Platform the notification was sent to (all, ios, android, web)';
COMMENT ON COLUMN sent_notifications.android_config IS 'Android-specific configuration';
COMMENT ON COLUMN sent_notifications.ios_config IS 'iOS-specific configuration';
COMMENT ON COLUMN sent_notifications.web_config IS 'Web-specific configuration';
COMMENT ON COLUMN sent_notifications.recipient_count IS 'Number of recipients targeted';
COMMENT ON COLUMN sent_notifications.delivered_count IS 'Number of confirmed deliveries';
COMMENT ON COLUMN sent_notifications.opened_count IS 'Number of confirmed opens';