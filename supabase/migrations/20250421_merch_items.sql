-- Create merch categories table
CREATE TABLE IF NOT EXISTS merch_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create merch items table
CREATE TABLE IF NOT EXISTS merch_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  image_url TEXT,
  category_id TEXT NOT NULL REFERENCES merch_categories(id),
  available BOOLEAN NOT NULL DEFAULT true,
  featured BOOLEAN DEFAULT false,
  external_id TEXT,
  external_url TEXT,
  variants JSONB,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS merch_categories_display_order_idx ON merch_categories(display_order);
CREATE INDEX IF NOT EXISTS merch_items_category_id_idx ON merch_items(category_id);
CREATE INDEX IF NOT EXISTS merch_items_available_idx ON merch_items(available);
CREATE INDEX IF NOT EXISTS merch_items_featured_idx ON merch_items(featured);

-- Enable RLS on merch tables
ALTER TABLE merch_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE merch_items ENABLE ROW LEVEL SECURITY;

-- Create policies for merch categories
CREATE POLICY select_merch_categories ON merch_categories 
  FOR SELECT 
  USING (true);

CREATE POLICY insert_merch_categories ON merch_categories 
  FOR INSERT 
  WITH CHECK ((SELECT auth.role() FROM auth.users WHERE auth.uid() = auth.uid()) = 'authenticated');

CREATE POLICY update_merch_categories ON merch_categories 
  FOR UPDATE 
  USING ((SELECT auth.role() FROM auth.users WHERE auth.uid() = auth.uid()) = 'authenticated');

-- Create policies for merch items
CREATE POLICY select_merch_items ON merch_items 
  FOR SELECT 
  USING (true);

CREATE POLICY insert_merch_items ON merch_items 
  FOR INSERT 
  WITH CHECK ((SELECT auth.role() FROM auth.users WHERE auth.uid() = auth.uid()) = 'authenticated');

CREATE POLICY update_merch_items ON merch_items 
  FOR UPDATE 
  USING ((SELECT auth.role() FROM auth.users WHERE auth.uid() = auth.uid()) = 'authenticated');

-- Comments
COMMENT ON TABLE merch_categories IS 'Merchandise categories (apparel, accessories, etc.)';
COMMENT ON TABLE merch_items IS 'Individual merchandise items';
COMMENT ON COLUMN merch_items.external_id IS 'ID for external service (e.g., Printify)';
COMMENT ON COLUMN merch_items.external_url IS 'URL to the item on external service';
COMMENT ON COLUMN merch_items.variants IS 'Size, color, and other variant information';