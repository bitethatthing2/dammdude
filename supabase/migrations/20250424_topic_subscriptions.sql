-- Create table for topic subscriptions
CREATE TABLE IF NOT EXISTS topic_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token TEXT NOT NULL,
  topic TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS topic_subscriptions_token_idx ON topic_subscriptions(token);
CREATE INDEX IF NOT EXISTS topic_subscriptions_topic_idx ON topic_subscriptions(topic);
CREATE UNIQUE INDEX IF NOT EXISTS topic_subscriptions_token_topic_idx ON topic_subscriptions(token, topic);

-- Create RLS policies
ALTER TABLE topic_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy for anyone to read topic subscriptions
CREATE POLICY "Anyone can read topic subscriptions"
  ON topic_subscriptions FOR SELECT
  USING (true);

-- Policy for service role to insert/update/delete
CREATE POLICY "Service role can manage topic subscriptions"
  ON topic_subscriptions FOR ALL
  USING (auth.role() = 'service_role');
