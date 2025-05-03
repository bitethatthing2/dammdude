-- EXECUTION MIGRATION SCRIPT FOR SCHEMA FIXES
-- This script is a modified version of 20250501_fix_schema.sql with additional validation
-- and error handling to ensure safe execution in production

-- Enable transaction for safer execution
BEGIN;

-- Check if tables exists before trying to modify them
DO $$
BEGIN
    -- First check if the orders table exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'orders' AND table_schema = 'public'
    ) THEN
        RAISE EXCEPTION 'Orders table does not exist, cannot proceed with migration';
    END IF;

    -- Check if the order_items table exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'order_items' AND table_schema = 'public'
    ) THEN
        -- Create order_items table if it doesn't exist
        CREATE TABLE order_items (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            order_id UUID NOT NULL,
            item_id TEXT,
            item_name TEXT,
            quantity INTEGER NOT NULL DEFAULT 1,
            price_at_order NUMERIC(10, 2),
            modifiers JSONB,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        RAISE NOTICE 'Created order_items table as it did not exist';
    END IF;
    
    -- Check if the tables table exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'tables' AND table_schema = 'public'
    ) THEN
        RAISE EXCEPTION 'Tables table does not exist, cannot proceed with migration';
    END IF;
END
$$;

-- 1. Fix table column types and names with extra safeguards
DO $$
DECLARE
    column_exists boolean;
BEGIN
    -- Check if total_price exists in orders table
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'orders' AND column_name = 'total_price'
    ) INTO column_exists;
    
    -- If total_price exists, rename it, otherwise check for total_amount
    IF column_exists THEN
        ALTER TABLE orders RENAME COLUMN total_price TO total_amount;
        RAISE NOTICE 'Renamed total_price to total_amount in orders table';
    ELSE
        -- Check if total_amount already exists
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'orders' AND column_name = 'total_amount'
        ) INTO column_exists;
        
        -- If neither exists, add total_amount column
        IF NOT column_exists THEN
            ALTER TABLE orders ADD COLUMN total_amount NUMERIC(10, 2);
            RAISE NOTICE 'Added total_amount column to orders table';
        ELSE
            RAISE NOTICE 'total_amount column already exists in orders table';
        END IF;
    END IF;
    
    -- Check if inserted_at exists in orders table
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'orders' AND column_name = 'inserted_at'
    ) INTO column_exists;
    
    -- If inserted_at exists, rename it, otherwise check for created_at
    IF column_exists THEN
        ALTER TABLE orders RENAME COLUMN inserted_at TO created_at;
        RAISE NOTICE 'Renamed inserted_at to created_at in orders table';
    ELSE
        -- Check if created_at already exists
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'orders' AND column_name = 'created_at'
        ) INTO column_exists;
        
        -- If neither exists, add created_at column
        IF NOT column_exists THEN
            ALTER TABLE orders ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
            RAISE NOTICE 'Added created_at column to orders table';
        ELSE
            RAISE NOTICE 'created_at column already exists in orders table';
        END IF;
    END IF;
    
    -- Ensure table_id is TEXT type
    ALTER TABLE orders ALTER COLUMN table_id TYPE TEXT USING table_id::TEXT;
    RAISE NOTICE 'Ensured table_id is TEXT type in orders table';
    
    -- Add notes column if it doesn't exist
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'orders' AND column_name = 'notes'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE orders ADD COLUMN notes TEXT;
        RAISE NOTICE 'Added notes column to orders table';
    ELSE
        RAISE NOTICE 'notes column already exists in orders table';
    END IF;
END
$$;

-- 2. Migrate JSONB items data to order_items table safely
DO $$
DECLARE
    has_items_column boolean;
    items_column_type text;
BEGIN
    -- Check if items column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'orders' AND column_name = 'items'
    ) INTO has_items_column;
    
    IF has_items_column THEN
        -- Get the data type of items column
        SELECT data_type INTO items_column_type
        FROM information_schema.columns
        WHERE table_name = 'orders' AND column_name = 'items';
        
        -- Only try to migrate if the column is JSONB
        IF items_column_type = 'jsonb' THEN
            -- Check if there's any data to migrate
            IF EXISTS (
                SELECT 1 FROM orders WHERE items IS NOT NULL AND items != 'null'::jsonb LIMIT 1
            ) THEN
                RAISE NOTICE 'Migrating JSONB items data to order_items table...';
                
                -- Create a function to migrate JSONB items to order_items table
                CREATE OR REPLACE FUNCTION migrate_order_items()
                RETURNS void AS $$
                DECLARE
                    order_rec RECORD;
                    item_rec RECORD;
                    new_item_id UUID;
                    items_array JSONB;
                BEGIN
                    FOR order_rec IN SELECT id, items FROM orders WHERE items IS NOT NULL AND items != 'null'::jsonb LOOP
                        -- Handle both object and array formats
                        IF jsonb_typeof(order_rec.items) = 'array' THEN
                            items_array := order_rec.items;
                        ELSE
                            -- Try to extract items array from object
                            IF order_rec.items ? 'items' AND jsonb_typeof(order_rec.items->'items') = 'array' THEN
                                items_array := order_rec.items->'items';
                            ELSE
                                -- Wrap single object in an array
                                items_array := jsonb_build_array(order_rec.items);
                            END IF;
                        END IF;
                        
                        -- For each item in the items array
                        FOR item_rec IN SELECT * FROM jsonb_array_elements(items_array) LOOP
                            -- Skip if already migrated (check by order_id + name combination)
                            IF NOT EXISTS (
                                SELECT 1 FROM order_items 
                                WHERE order_id = order_rec.id 
                                AND item_name = item_rec.value->>'name'
                                LIMIT 1
                            ) THEN
                                -- Generate new UUID for the item
                                new_item_id := uuid_generate_v4();
                                
                                -- Insert into order_items table with safer COALESCE handling
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
                                    COALESCE(item_rec.value->>'menu_item_id', item_rec.value->>'id', NULL),
                                    COALESCE(item_rec.value->>'name', 'Unknown Item'),
                                    COALESCE((item_rec.value->>'quantity')::integer, 1),
                                    COALESCE((item_rec.value->>'price')::numeric, 0),
                                    CASE 
                                        WHEN item_rec.value ? 'modifiers' THEN item_rec.value->'modifiers'
                                        WHEN item_rec.value ? 'customizations' THEN item_rec.value->'customizations'
                                        ELSE NULL::jsonb
                                    END,
                                    NOW()
                                );
                                
                                RAISE NOTICE 'Migrated item % for order %', COALESCE(item_rec.value->>'name', 'Unknown Item'), order_rec.id;
                            END IF;
                        END LOOP;
                    END LOOP;
                END;
                $$ LANGUAGE plpgsql;

                -- Execute the migration function
                PERFORM migrate_order_items();
                
                -- Drop the function
                DROP FUNCTION migrate_order_items();
                
                RAISE NOTICE 'Completed JSONB items migration to order_items table';
            ELSE
                RAISE NOTICE 'No JSONB items data to migrate';
            END IF;
        ELSE
            RAISE NOTICE 'Items column exists but is not JSONB type, skipping migration';
        END IF;
    ELSE
        RAISE NOTICE 'No items column found in orders table, skipping migration';
    END IF;
END
$$;

-- 3. Fix database relationships safely
DO $$
DECLARE
    orders_tables_fk_exists boolean;
    order_items_orders_fk_exists boolean;
    order_items_menu_items_fk_exists boolean;
BEGIN
    -- Check if foreign keys already exist
    SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'orders_table_id_fkey'
        AND table_name = 'orders'
    ) INTO orders_tables_fk_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'order_items_order_id_fkey'
        AND table_name = 'order_items'
    ) INTO order_items_orders_fk_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'order_items_item_id_fkey'
        AND table_name = 'order_items'
    ) INTO order_items_menu_items_fk_exists;
    
    -- Add or replace foreign keys
    IF orders_tables_fk_exists THEN
        ALTER TABLE orders DROP CONSTRAINT orders_table_id_fkey;
        RAISE NOTICE 'Dropped existing orders_table_id_fkey constraint';
    END IF;
    
    -- Ensure tables.id has the right type before adding constraint
    ALTER TABLE tables ALTER COLUMN id TYPE TEXT USING id::TEXT;
    
    -- Add the foreign key with proper error handling
    BEGIN
        ALTER TABLE orders ADD CONSTRAINT orders_table_id_fkey
            FOREIGN KEY (table_id)
            REFERENCES tables (id)
            ON DELETE CASCADE;
        RAISE NOTICE 'Added orders_table_id_fkey constraint';
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Error adding orders_table_id_fkey constraint: %', SQLERRM;
    END;
    
    -- Fix order_items to orders relationship
    IF order_items_orders_fk_exists THEN
        ALTER TABLE order_items DROP CONSTRAINT order_items_order_id_fkey;
        RAISE NOTICE 'Dropped existing order_items_order_id_fkey constraint';
    END IF;
    
    -- Ensure orders.id and order_items.order_id have the right type
    ALTER TABLE orders ALTER COLUMN id TYPE UUID USING id::UUID;
    ALTER TABLE order_items ALTER COLUMN order_id TYPE UUID USING order_id::UUID;
    
    -- Add the foreign key with proper error handling
    BEGIN
        ALTER TABLE order_items ADD CONSTRAINT order_items_order_id_fkey
            FOREIGN KEY (order_id)
            REFERENCES orders (id)
            ON DELETE CASCADE;
        RAISE NOTICE 'Added order_items_order_id_fkey constraint';
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Error adding order_items_order_id_fkey constraint: %', SQLERRM;
    END;
    
    -- Fix order_items to menu_items relationship (optional)
    IF order_items_menu_items_fk_exists THEN
        ALTER TABLE order_items DROP CONSTRAINT order_items_item_id_fkey;
        RAISE NOTICE 'Dropped existing order_items_item_id_fkey constraint';
    END IF;
    
    -- This constraint is optional - only try to add if menu_items table exists
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'menu_items' AND table_schema = 'public'
    ) THEN
        BEGIN
            ALTER TABLE order_items ADD CONSTRAINT order_items_item_id_fkey
                FOREIGN KEY (item_id)
                REFERENCES menu_items (id)
                ON DELETE SET NULL;
            RAISE NOTICE 'Added order_items_item_id_fkey constraint';
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Error adding order_items_item_id_fkey constraint: %', SQLERRM;
        END;
    ELSE
        RAISE NOTICE 'menu_items table not found, skipping order_items_item_id_fkey constraint';
    END IF;
END
$$;

-- 4. Create indexes for performance
DO $$
BEGIN
    -- Create indexes if they don't already exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE indexname = 'idx_orders_status'
    ) THEN
        CREATE INDEX idx_orders_status ON orders(status);
        RAISE NOTICE 'Created index idx_orders_status';
    ELSE
        RAISE NOTICE 'Index idx_orders_status already exists';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE indexname = 'idx_orders_created_at'
    ) THEN
        CREATE INDEX idx_orders_created_at ON orders(created_at);
        RAISE NOTICE 'Created index idx_orders_created_at';
    ELSE
        RAISE NOTICE 'Index idx_orders_created_at already exists';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE indexname = 'idx_order_items_order_id'
    ) THEN
        CREATE INDEX idx_order_items_order_id ON order_items(order_id);
        RAISE NOTICE 'Created index idx_order_items_order_id';
    ELSE
        RAISE NOTICE 'Index idx_order_items_order_id already exists';
    END IF;
END
$$;

-- 5. Add table comments
COMMENT ON TABLE orders IS 'Customer orders with status tracking';
COMMENT ON COLUMN orders.status IS 'Order status: pending, preparing, ready, delivered, completed, cancelled';
COMMENT ON TABLE order_items IS 'Individual items within an order';

-- 6. Additional validations to confirm migration was successful
DO $$
DECLARE
    orders_count INTEGER;
    order_items_count INTEGER;
    orders_with_status_count INTEGER;
BEGIN
    -- Check basic counts
    SELECT COUNT(*) INTO orders_count FROM orders;
    SELECT COUNT(*) INTO order_items_count FROM order_items;
    SELECT COUNT(*) INTO orders_with_status_count FROM orders WHERE status IS NOT NULL;
    
    -- Report counts
    RAISE NOTICE 'Migration validation summary:';
    RAISE NOTICE '- Orders count: %', orders_count;
    RAISE NOTICE '- Order items count: %', order_items_count;
    RAISE NOTICE '- Orders with status: %', orders_with_status_count;
    
    -- Warn if orders exist but no order items
    IF orders_count > 0 AND order_items_count = 0 THEN
        RAISE WARNING 'Warning: Orders exist but no order items were migrated. This may indicate a migration issue.';
    END IF;
END
$$;

-- Commit the transaction
COMMIT;