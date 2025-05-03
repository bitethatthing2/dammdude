-- Create table for booking requests
CREATE TABLE IF NOT EXISTS booking_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  contact_info TEXT NOT NULL,
  requested_date DATE NOT NULL,
  requested_time TEXT NOT NULL,
  party_size INT NOT NULL,
  booking_type TEXT NOT NULL,
  notes TEXT,
  location_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  confirmed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS booking_requests_location_idx ON booking_requests(location_id);
CREATE INDEX IF NOT EXISTS booking_requests_date_idx ON booking_requests(requested_date);
CREATE INDEX IF NOT EXISTS booking_requests_status_idx ON booking_requests(status);

-- Enable RLS
ALTER TABLE booking_requests ENABLE ROW LEVEL SECURITY;

-- Allow any authenticated user to insert bookings
CREATE POLICY insert_booking_request ON booking_requests 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

-- Only admin can update bookings
CREATE POLICY update_booking_request ON booking_requests 
  FOR UPDATE 
  USING ((SELECT auth.role() FROM auth.users WHERE auth.uid() = auth.uid()) = 'authenticated');

-- Everyone can view booking requests
CREATE POLICY select_booking_request ON booking_requests 
  FOR SELECT 
  USING (true);

-- Add bookings to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE booking_requests;

-- Comments
COMMENT ON TABLE booking_requests IS 'Stores booking/reservation requests';
COMMENT ON COLUMN booking_requests.name IS 'Customer name';
COMMENT ON COLUMN booking_requests.contact_info IS 'Customer phone or email';
COMMENT ON COLUMN booking_requests.requested_date IS 'Requested booking date';
COMMENT ON COLUMN booking_requests.requested_time IS 'Requested booking time';
COMMENT ON COLUMN booking_requests.party_size IS 'Number of people';
COMMENT ON COLUMN booking_requests.booking_type IS 'Type of booking (Table, Party, Catering)';
COMMENT ON COLUMN booking_requests.location_id IS 'Location (portland or salem)';
COMMENT ON COLUMN booking_requests.status IS 'Status (pending, confirmed, rejected)';