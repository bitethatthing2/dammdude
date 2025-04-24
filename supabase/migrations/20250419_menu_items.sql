-- Create menu categories table
CREATE TABLE IF NOT EXISTS menu_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  display_order INT NOT NULL DEFAULT 0,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create menu items table
CREATE TABLE IF NOT EXISTS menu_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  image_url TEXT,
  category_id TEXT NOT NULL REFERENCES menu_categories(id),
  available BOOLEAN NOT NULL DEFAULT true,
  popular BOOLEAN DEFAULT false,
  allergens JSONB,
  dietary_info JSONB,
  options JSONB,
  location TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS menu_categories_display_order_idx ON menu_categories(display_order);
CREATE INDEX IF NOT EXISTS menu_categories_location_idx ON menu_categories(location);
CREATE INDEX IF NOT EXISTS menu_items_category_id_idx ON menu_items(category_id);
CREATE INDEX IF NOT EXISTS menu_items_available_idx ON menu_items(available);
CREATE INDEX IF NOT EXISTS menu_items_popular_idx ON menu_items(popular);
CREATE INDEX IF NOT EXISTS menu_items_location_idx ON menu_items(location);

-- Enable RLS on menu tables
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

-- Create policies for menu categories
CREATE POLICY select_menu_categories ON menu_categories 
  FOR SELECT 
  USING (true);

CREATE POLICY insert_menu_categories ON menu_categories 
  FOR INSERT 
  WITH CHECK ((SELECT auth.role() FROM auth.users WHERE auth.uid() = auth.uid()) = 'authenticated');

CREATE POLICY update_menu_categories ON menu_categories 
  FOR UPDATE 
  USING ((SELECT auth.role() FROM auth.users WHERE auth.uid() = auth.uid()) = 'authenticated');

-- Create policies for menu items
CREATE POLICY select_menu_items ON menu_items 
  FOR SELECT 
  USING (true);

CREATE POLICY insert_menu_items ON menu_items 
  FOR INSERT 
  WITH CHECK ((SELECT auth.role() FROM auth.users WHERE auth.uid() = auth.uid()) = 'authenticated');

CREATE POLICY update_menu_items ON menu_items 
  FOR UPDATE 
  USING ((SELECT auth.role() FROM auth.users WHERE auth.uid() = auth.uid()) = 'authenticated');

-- Comments
COMMENT ON TABLE menu_categories IS 'Menu categories (appetizers, drinks, etc.)';
COMMENT ON TABLE menu_items IS 'Individual menu items';
COMMENT ON COLUMN menu_items.allergens IS 'List of allergens (dairy, nuts, gluten, etc.)';
COMMENT ON COLUMN menu_items.dietary_info IS 'Dietary information (vegetarian, vegan, gluten-free)';
COMMENT ON COLUMN menu_items.options IS 'Customization options for the item';