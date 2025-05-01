-- Migration to update categories and properly organize food and drink items
-- Add new drink categories if they don't exist

-- First, check if we need to add beer category
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM menu_categories WHERE name = 'Beer') THEN
        INSERT INTO menu_categories (id, name, description, display_order)
        VALUES ('beer', 'Beer', 'All beer options', 8);
    END IF;
END
$$;

-- Add wine category
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM menu_categories WHERE name = 'Wine') THEN
        INSERT INTO menu_categories (id, name, description, display_order)
        VALUES ('wine', 'Wine', 'Wine selections', 9);
    END IF;
END
$$;

-- Add cocktails category
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM menu_categories WHERE name = 'Cocktails') THEN
        INSERT INTO menu_categories (id, name, description, display_order)
        VALUES ('cocktails', 'Cocktails', 'Specialty cocktails', 10);
    END IF;
END
$$;

-- Add margaritas category
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM menu_categories WHERE name = 'Margaritas') THEN
        INSERT INTO menu_categories (id, name, description, display_order)
        VALUES ('margaritas', 'Margaritas', 'Margarita varieties', 11);
    END IF;
END
$$;

-- Add martinis category
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM menu_categories WHERE name = 'Martinis') THEN
        INSERT INTO menu_categories (id, name, description, display_order)
        VALUES ('martinis', 'Martinis', 'Martini varieties', 12);
    END IF;
END
$$;

-- Update items that should be in the beer category
UPDATE menu_items
SET category_id = (SELECT id FROM menu_categories WHERE name = 'Beer')
WHERE 
    (name ILIKE '%beer%' OR 
     name ILIKE '%ipa%' OR 
     name ILIKE '%lager%' OR 
     name ILIKE '%ale%' OR
     name ILIKE '%corona%' OR
     name ILIKE '%modelo%' OR
     name ILIKE '%heineken%' OR
     name ILIKE '%budweiser%' OR
     name ILIKE '%coors%' OR
     name ILIKE '%miller%' OR
     name ILIKE '%bottle beer%')
    AND category_id != (SELECT id FROM menu_categories WHERE name = 'Beer');

-- Update items that should be in the wine category
UPDATE menu_items
SET category_id = (SELECT id FROM menu_categories WHERE name = 'Wine')
WHERE 
    (name ILIKE '%wine%' OR 
     name ILIKE '%cabernet%' OR 
     name ILIKE '%merlot%' OR 
     name ILIKE '%chardonnay%' OR
     name ILIKE '%pinot%' OR
     name ILIKE '%sauvignon%' OR
     name ILIKE '%zinfandel%' OR
     name ILIKE '%rosé%' OR
     name ILIKE '%champagne%' OR
     name ILIKE '%prosecco%')
    AND category_id != (SELECT id FROM menu_categories WHERE name = 'Wine');

-- Update items that should be in the cocktails category
UPDATE menu_items
SET category_id = (SELECT id FROM menu_categories WHERE name = 'Cocktails')
WHERE 
    (name ILIKE '%cocktail%' OR 
     name ILIKE '%mojito%' OR 
     name ILIKE '%old fashioned%' OR
     name ILIKE '%negroni%' OR
     name ILIKE '%manhattan%' OR
     name ILIKE '%daiquiri%' OR
     name ILIKE '%house favorite%' OR
     name ILIKE '%flight%')
    AND category_id != (SELECT id FROM menu_categories WHERE name = 'Cocktails');

-- Update items that should be in the margaritas category
UPDATE menu_items
SET category_id = (SELECT id FROM menu_categories WHERE name = 'Margaritas')
WHERE 
    (name ILIKE '%margarita%' OR name ILIKE '%rita%')
    AND category_id != (SELECT id FROM menu_categories WHERE name = 'Margaritas');

-- Update items that should be in the martinis category
UPDATE menu_items
SET category_id = (SELECT id FROM menu_categories WHERE name = 'Martinis')
WHERE 
    (name ILIKE '%martini%' OR name ILIKE '%cosmopolitan%' OR name ILIKE '%appletini%')
    AND category_id != (SELECT id FROM menu_categories WHERE name = 'Martinis');

-- Update non-alcoholic beverages that might be miscategorized
UPDATE menu_items
SET category_id = (SELECT id FROM menu_categories WHERE name = 'Non-Alcoholic Beverages')
WHERE 
    (name ILIKE '%soda%' OR 
     name ILIKE '%water%' OR 
     name ILIKE '%juice%' OR 
     name ILIKE '%coffee%' OR 
     name ILIKE '%tea%' OR
     name ILIKE '%fountain%' OR
     name ILIKE '%coke%' OR
     name ILIKE '%sprite%' OR
     name ILIKE '%dr pepper%' OR
     name ILIKE '%lemonade%' OR
     name ILIKE '%smoothie%' OR
     name ILIKE '%red bull%' OR
     name ILIKE '%topo chico%' OR
     name ILIKE '%jarritos%')
    AND category_id != (SELECT id FROM menu_categories WHERE name = 'Non-Alcoholic Beverages');

-- Add item type column to menu_items table for better categorization
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS item_type TEXT;

-- Set item type based on category
UPDATE menu_items
SET item_type = 'drink'
WHERE category_id IN (
    SELECT id FROM menu_categories 
    WHERE name IN ('Non-Alcoholic Beverages', 'Beer', 'Wine', 'Cocktails', 'Margaritas', 'Martinis')
);

UPDATE menu_items
SET item_type = 'food'
WHERE category_id IN (
    SELECT id FROM menu_categories 
    WHERE name IN ('Birria Specialties', 'Small Bites', 'Seafood', 'Breakfast', 'Wings', 'Main Dishes')
);

-- Create an index on the new item_type column
CREATE INDEX IF NOT EXISTS menu_items_item_type_idx ON menu_items(item_type);

-- Add comment for the new column
COMMENT ON COLUMN menu_items.item_type IS 'Type of item (food or drink)';
