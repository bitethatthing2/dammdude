-- Migration to fix schema inconsistencies in orders tables
-- Based on audit findings

-- First, ensure table_id is always a string
ALTER TABLE IF EXISTS orders
ALTER COLUMN table_id TYPE TEXT;

-- Ensure consistent naming for total amount
ALTER TABLE IF EXISTS orders
RENAME COLUMN total_price TO total_amount;

-- Ensure consistent naming for timestamps
ALTER TABLE IF EXISTS orders
RENAME COLUMN inserted_at TO created_at;

-- Add missing customer_notes column if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'orders'
        AND column_name = 'notes'
    ) THEN
        ALTER TABLE orders
        ADD COLUMN notes TEXT;
    END IF;
END
$$;

-- Convert items JSONB to properly support order_items table
DO $$
BEGIN
    -- First check if we need to migrate data from JSONB to relational
    IF EXISTS (
        SELECT 1
        FROM orders
        WHERE items IS NOT NULL
        LIMIT 1
    ) THEN
        -- Create a function to migrate JSONB items to order_items table
        CREATE OR REPLACE FUNCTION migrate_order_items()
        RETURNS void AS $$
        DECLARE
            order_rec RECORD;
            item_rec RECORD;
            new_item_id UUID;
        BEGIN
            FOR order_rec IN SELECT id, items FROM orders WHERE items IS NOT NULL LOOP
                IF jsonb_typeof(order_rec.items) = 'array' THEN
                    -- For each item in the JSONB array
                    FOR item_rec IN SELECT * FROM jsonb_array_elements(order_rec.items) LOOP
                        -- Generate new UUID for the item
                        new_item_id := uuid_generate_v4();
                        
                        -- Insert into order_items table
                        INSERT INTO order_items (
                            id,
                            order_id,
                            item_id,
                            item_name,
                            quantity,
                            price_at_order,
                            modifiers,
                            created_at
                        ) VALUES (
                            new_item_id,
                            order_rec.id,
                            COALESCE(item_rec.value->>'menu_item_id', item_rec.value->>'id', uuid_generate_v4()),
                            item_rec.value->>'name',
                            COALESCE((item_rec.value->>'quantity')::int, 1),
                            COALESCE((item_rec.value->>'price')::numeric, 0),
                            CASE 
                                WHEN item_rec.value->>'modifiers' IS NOT NULL THEN item_rec.value->'modifiers'
                                WHEN item_rec.value->>'customizations' IS NOT NULL THEN item_rec.value->'customizations'
                                ELSE NULL::jsonb
                            END,
                            NOW()
                        );
                    END LOOP;
                END IF;
            END LOOP;
        END;
        $$ LANGUAGE plpgsql;

        -- Execute the migration function
        PERFORM migrate_order_items();
        
        -- Drop the function
        DROP FUNCTION migrate_order_items();
    END IF;
END
$$;

-- Fix relationship between orders and tables
ALTER TABLE IF EXISTS orders
DROP CONSTRAINT IF EXISTS orders_table_id_fkey,
ADD CONSTRAINT orders_table_id_fkey
    FOREIGN KEY (table_id)
    REFERENCES tables (id)
    ON DELETE CASCADE;

-- Fix relationship between order_items and orders
ALTER TABLE IF EXISTS order_items
DROP CONSTRAINT IF EXISTS order_items_order_id_fkey,
ADD CONSTRAINT order_items_order_id_fkey
    FOREIGN KEY (order_id)
    REFERENCES orders (id)
    ON DELETE CASCADE;

-- Fix relationship between order_items and menu_items
ALTER TABLE IF EXISTS order_items
DROP CONSTRAINT IF EXISTS order_items_item_id_fkey,
ADD CONSTRAINT order_items_item_id_fkey
    FOREIGN KEY (item_id)
    REFERENCES menu_items (id)
    ON DELETE SET NULL;

-- Update indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- Add comments for clarity
COMMENT ON TABLE orders IS 'Customer orders with status tracking';
COMMENT ON COLUMN orders.status IS 'Order status: pending, preparing, ready, delivered, completed, cancelled';
COMMENT ON TABLE order_items IS 'Individual items within an order';