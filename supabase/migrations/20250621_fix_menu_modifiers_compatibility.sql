-- Menu Modifiers Frontend-Backend Compatibility Fix
-- Date: 2025-06-21
-- Author: Cline
-- Description: Fixes schema mismatches and adds missing modifier functionality

-- 1. Add missing columns to existing tables (if they don't exist)
DO $$ 
BEGIN
    -- Add missing columns to item_modifier_groups
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'item_modifier_groups' AND column_name = 'min_selections') THEN
        ALTER TABLE item_modifier_groups ADD COLUMN min_selections INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'item_modifier_groups' AND column_name = 'description') THEN
        ALTER TABLE item_modifier_groups ADD COLUMN description TEXT;
    END IF;
    
    -- Add missing columns to menu_item_modifiers  
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'menu_item_modifiers' AND column_name = 'description') THEN
        ALTER TABLE menu_item_modifiers ADD COLUMN description TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'menu_item_modifiers' AND column_name = 'is_popular') THEN
        ALTER TABLE menu_item_modifiers ADD COLUMN is_popular BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'menu_item_modifiers' AND column_name = 'spice_level') THEN
        ALTER TABLE menu_item_modifiers ADD COLUMN spice_level INTEGER CHECK (spice_level >= 0 AND spice_level <= 5);
    END IF;
END $$;

-- 2. Create menu_items view for frontend compatibility
CREATE OR REPLACE VIEW menu_items AS
SELECT 
    id,
    name,
    description,
    price,
    image_url,
    image_id,
    is_available,
    category_id,
    created_at,
    updated_at
FROM food_drink_items
WHERE is_available = true;

-- 3. Update existing wing sauces to have proper type
UPDATE menu_item_modifiers 
SET modifier_type = 'wing_sauce'
WHERE modifier_type = 'sauce' 
AND name IN ('Buffalo', 'BBQ', 'Garlic Parmesan', 'Korean BBQ', 'Mango Habanero', 'Sweet Teriyaki', 'Garlic Buffalo');

-- 4. Set spice levels and popularity for existing sauces
UPDATE menu_item_modifiers SET spice_level = 3, is_popular = true, description = 'Classic buffalo wing sauce with medium heat' WHERE name = 'Buffalo' AND modifier_type = 'wing_sauce';
UPDATE menu_item_modifiers SET spice_level = 4, description = 'Sweet and spicy tropical heat' WHERE name = 'Mango Habanero' AND modifier_type = 'wing_sauce';
UPDATE menu_item_modifiers SET spice_level = 2, is_popular = true, description = 'Sweet and savory Korean-style sauce' WHERE name = 'Korean BBQ' AND modifier_type = 'wing_sauce';
UPDATE menu_item_modifiers SET spice_level = 1, description = 'Rich garlic and parmesan flavor' WHERE name = 'Garlic Parmesan' AND modifier_type = 'wing_sauce';
UPDATE menu_item_modifiers SET spice_level = 1, description = 'Sweet and smoky barbecue sauce' WHERE name = 'BBQ' AND modifier_type = 'wing_sauce';
UPDATE menu_item_modifiers SET spice_level = 2, description = 'Sweet teriyaki with Asian flavors' WHERE name = 'Sweet Teriyaki' AND modifier_type = 'wing_sauce';
UPDATE menu_item_modifiers SET spice_level = 3, description = 'Buffalo sauce with extra garlic kick' WHERE name = 'Garlic Buffalo' AND modifier_type = 'wing_sauce';

-- 5. Add descriptions and popularity to meat options
UPDATE menu_item_modifiers SET description = 'Fresh white fish, lightly seasoned', is_popular = true WHERE name = 'Fish' AND modifier_type = 'meat';
UPDATE menu_item_modifiers SET description = 'Traditional grilled beef, Mexican-style', is_popular = true WHERE name = 'Asada' AND modifier_type = 'meat';
UPDATE menu_item_modifiers SET description = 'Succulent grilled shrimp' WHERE name = 'Shrimp' AND modifier_type = 'meat';
UPDATE menu_item_modifiers SET description = 'Slow-cooked spiced beef' WHERE name = 'Birria' AND modifier_type = 'meat';
UPDATE menu_item_modifiers SET description = 'Marinated grilled chicken', is_popular = true WHERE name = 'Chicken' AND modifier_type = 'meat';
UPDATE menu_item_modifiers SET description = 'Seasoned ground beef' WHERE name = 'Ground Beef' AND modifier_type = 'meat';
UPDATE menu_item_modifiers SET description = 'Tender braised pork' WHERE name = 'Carnitas' AND modifier_type = 'meat';

-- 6. Create sample item-modifier relationships for wings
INSERT INTO item_modifier_groups (item_id, modifier_type, is_required, max_selections, min_selections, group_name, description)
SELECT 
    fdi.id,
    'wing_sauce',
    true,
    2,
    1,
    'Choose Your Wing Sauce',
    'Select 1-2 sauces for your wings'
FROM food_drink_items fdi
WHERE LOWER(fdi.name) LIKE '%wings%'
AND NOT EXISTS (
    SELECT 1 FROM item_modifier_groups img 
    WHERE img.item_id = fdi.id AND img.modifier_type = 'wing_sauce'
);

-- 7. Create sample item-modifier relationships for tacos and burritos
INSERT INTO item_modifier_groups (item_id, modifier_type, is_required, max_selections, min_selections, group_name, description)
SELECT 
    fdi.id,
    'meat',
    true,
    1,
    1,
    'Choose Your Protein',
    'Select your preferred protein'
FROM food_drink_items fdi
WHERE (LOWER(fdi.name) LIKE '%taco%' OR LOWER(fdi.name) LIKE '%burrito%' OR LOWER(fdi.name) LIKE '%quesadilla%')
AND NOT EXISTS (
    SELECT 1 FROM item_modifier_groups img 
    WHERE img.item_id = fdi.id AND img.modifier_type = 'meat'
);

-- 8. Create sample sauce relationships for items that can have sauces
INSERT INTO item_modifier_groups (item_id, modifier_type, is_required, max_selections, min_selections, group_name, description)
SELECT 
    fdi.id,
    'sauce',
    false,
    3,
    0,
    'Choose Your Sauces',
    'Optional: Add up to 3 sauces'
FROM food_drink_items fdi
WHERE (LOWER(fdi.name) LIKE '%taco%' OR LOWER(fdi.name) LIKE '%burrito%' OR LOWER(fdi.name) LIKE '%quesadilla%' OR LOWER(fdi.name) LIKE '%nacho%')
AND NOT EXISTS (
    SELECT 1 FROM item_modifier_groups img 
    WHERE img.item_id = fdi.id AND img.modifier_type = 'sauce'
);

-- 9. Add RLS policies for modifier data
DO $$
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can view modifiers" ON menu_item_modifiers;
    DROP POLICY IF EXISTS "Users can view modifier groups" ON item_modifier_groups;
    
    -- Create new policies
    CREATE POLICY "Users can view modifiers" ON menu_item_modifiers
        FOR SELECT USING (true);

    CREATE POLICY "Users can view modifier groups" ON item_modifier_groups
        FOR SELECT USING (true);
EXCEPTION
    WHEN undefined_table THEN
        -- Tables might not exist yet, skip policy creation
        NULL;
END $$;

-- 10. Enable RLS on modifier tables (if not already enabled)
DO $$
BEGIN
    ALTER TABLE menu_item_modifiers ENABLE ROW LEVEL SECURITY;
    ALTER TABLE item_modifier_groups ENABLE ROW LEVEL SECURITY;
EXCEPTION
    WHEN undefined_table THEN
        -- Tables might not exist yet
        NULL;
END $$;

-- 11. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_item_modifier_groups_item_id ON item_modifier_groups(item_id);
CREATE INDEX IF NOT EXISTS idx_item_modifier_groups_modifier_type ON item_modifier_groups(modifier_type);
CREATE INDEX IF NOT EXISTS idx_menu_item_modifiers_type ON menu_item_modifiers(modifier_type);
CREATE INDEX IF NOT EXISTS idx_menu_item_modifiers_available ON menu_item_modifiers(is_available);

-- 12. Add some helpful comments
COMMENT ON VIEW menu_items IS 'Frontend-compatible view of food_drink_items table';
COMMENT ON COLUMN item_modifier_groups.min_selections IS 'Minimum number of modifiers required from this group';
COMMENT ON COLUMN item_modifier_groups.description IS 'Description shown to users for this modifier group';
COMMENT ON COLUMN menu_item_modifiers.description IS 'Description of the modifier option';
COMMENT ON COLUMN menu_item_modifiers.is_popular IS 'Whether this modifier should be highlighted as popular';
COMMENT ON COLUMN menu_item_modifiers.spice_level IS 'Spice level from 0 (none) to 5 (very hot)';

-- 13. Refresh any materialized views (if they exist)
-- This is defensive programming in case there are materialized views
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT schemaname, matviewname FROM pg_matviews WHERE schemaname = 'public'
    LOOP
        EXECUTE 'REFRESH MATERIALIZED VIEW ' || quote_ident(r.schemaname) || '.' || quote_ident(r.matviewname);
    END LOOP;
END $$;

-- Migration completed successfully
SELECT 'Menu modifiers frontend-backend compatibility migration completed successfully' as status;
