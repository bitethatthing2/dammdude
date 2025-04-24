-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_id TEXT NOT NULL,
  location TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  items JSONB NOT NULL,
  total_amount DECIMAL(10, 2),
  notes TEXT,
  inserted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS orders_table_id_idx ON orders(table_id);
CREATE INDEX IF NOT EXISTS orders_location_idx ON orders(location);
CREATE INDEX IF NOT EXISTS orders_status_idx ON orders(status);
CREATE INDEX IF NOT EXISTS orders_inserted_at_idx ON orders(inserted_at);

-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY select_orders ON orders 
  FOR SELECT 
  USING (true);

CREATE POLICY insert_orders ON orders 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY update_orders ON orders 
  FOR UPDATE 
  USING ((SELECT auth.role() FROM auth.users WHERE auth.uid() = auth.uid()) = 'authenticated');

-- Add orders to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE orders;

-- Create function to get orders for a location
CREATE OR REPLACE FUNCTION get_orders_by_location(loc TEXT, status_filter TEXT DEFAULT NULL)
RETURNS SETOF orders AS $$
BEGIN
  IF status_filter IS NULL THEN
    RETURN QUERY 
    SELECT * FROM orders 
    WHERE location = loc
    ORDER BY inserted_at DESC;
  ELSE
    RETURN QUERY 
    SELECT * FROM orders 
    WHERE location = loc AND status = status_filter
    ORDER BY inserted_at DESC;
  END IF;
END;
$$ LANGUAGE plpgsql;