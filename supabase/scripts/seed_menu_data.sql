-- File: supabase/scripts/seed_menu_data.sql
-- Seed data for food menu tables
-- IMPORTANT: Assumes auto-incrementing integer IDs.
--            Replace placeholder IDs in join tables with actual generated IDs after inserts.

-- 1. Insert Categories
INSERT INTO
  public.categories (name, display_order)
VALUES
  ('Non-Alcoholic Beverages', 1), -- ID: 1 (Assumed)
  ('Birria Specialties', 2),      -- ID: 2 (Assumed)
  ('Small Bites', 3),             -- ID: 3 (Assumed)
  ('Seafood', 4),                 -- ID: 4 (Assumed)
  ('Breakfast', 5),               -- ID: 5 (Assumed)
  ('Wings', 6),                   -- ID: 6 (Assumed)
  ('Main Dishes', 7);             -- ID: 7 (Assumed)

-- 2. Insert Menu Items
-- Associate with Category IDs from above
INSERT INTO
  public.menu_items (name, description, price, category_id, display_order)
VALUES
  -- Non-Alcoholic Beverages (Category ID: 1)
  ('Fountain Drinks', 'Unlimited refills', 3.00, 1, 1),
  ('Coke (Fountain)', NULL, 3.00, 1, 2),
  ('Dr Pepper', NULL, 3.00, 1, 3),
  ('Diet Coke', NULL, 3.00, 1, 4),
  ('Lemonade', NULL, 3.00, 1, 5),
  ('Sprite (Fountain)', NULL, 3.00, 1, 6),
  ('Sweet Ice Tea', NULL, 3.00, 1, 7),
  ('Glass Beverages', NULL, 4.75, 1, 8),
  ('Topo Chico', NULL, 4.75, 1, 9),
  ('Coke (Glass)', NULL, 4.75, 1, 10),
  ('Jarritos', 'Multiple Flavors', 4.75, 1, 11), -- Item ID: 11 (Assumed) - Linked to Jarritos Flavors later
  ('Sprite (Glass)', NULL, 4.75, 1, 12),
  ('Smoothies', 'Comes with whipped cream', 13.00, 1, 13), -- Item ID: 13 (Assumed) - Linked to Fruit Flavors later
  ('Coffee', NULL, 4.75, 1, 14),
  ('Abuelita Hot Chocolate', NULL, 4.75, 1, 15),
  ('Red Bull', NULL, 4.75, 1, 16),
  -- Birria Specialties (Category ID: 2)
  ('Birria Queso Tacos', '3 QUESO BIRRIA TACOS, QUESO OAXACA, ONIONS, CILANTRO. ALL BIRRIA ITEMS COME WITH CONSUME', 16.75, 2, 1),
  ('Birria Pizza', 'TWO FLOUR TORTILLAS, CILANTRO, ONIONS, QUESO OAXACA. ALL BIRRIA ITEMS COME WITH CONSUME', 29.00, 2, 2),
  ('Birria Ramen Bowl', 'BIRRIA TAPATIO NOODLES, CILANTRO AND ONIONS. ALL BIRRIA ITEMS COME WITH CONSUME', 14.75, 2, 3),
  ('Birria Flautas', 'CORN TORTILLA, BIRRIA, CONSUME. ALL BIRRIA ITEMS COME WITH CONSUME', 12.00, 2, 4),
  -- Small Bites (Category ID: 3)
  ('Regular Tacos', 'Gluten free corn tortilla, onions, cilantro, choice of meat', 3.75, 3, 1), -- Item ID: 21 (Assumed) - Linked to Meat Options
  ('Queso Tacos', 'Gluten free corn tortilla, queso Oaxaca, onions, cilantro, choice of meat', 5.75, 3, 2), -- Item ID: 22 (Assumed) - Linked to Meat Options
  ('Chips & Guac', NULL, 8.00, 3, 3),
  ('Basket of Fries', NULL, 7.00, 3, 4),
  ('Basket of Tots', NULL, 7.00, 3, 5),
  -- Seafood (Category ID: 4)
  ('Fried Fish Tacos (2)', 'ONIONS, CABBAGE, CHIPOTLE, CHEESE, CORN TORTILLA', 8.75, 4, 1),
  ('Fried Shrimp Tacos (2)', 'ONIONS, CABBAGE, CHIPOTLE, CHEESE, CORN TORTILLA', 8.75, 4, 2),
  -- Breakfast (Category ID: 5)
  ('Asada & Bacon Burrito w/Eggs', 'FLOUR TORTILLA, ASADA, BACON, TOTS, SOUR CREAM, GUAC SAUCE', 13.00, 5, 1),
  -- Wings (Category ID: 6)
  ('Wings (4)', 'TRADITIONAL OR BONELESS', 8.00, 6, 1),  -- Item ID: 29 (Assumed) - Linked to Wing Flavors
  ('Wings (8)', 'TRADITIONAL OR BONELESS', 15.00, 6, 2), -- Item ID: 30 (Assumed) - Linked to Wing Flavors
  -- Main Dishes (Category ID: 7)
  ('Burrito', 'Flour tortilla, beans, rice, cilantro, onions, guac sauce, chipotle, tortilla chips, choice of meat', 12.00, 7, 1), -- Item ID: 31 (Assumed) - Linked to Meat Options
  ('Quesadilla', 'Flour tortilla, queso Oaxaca, guac sauce, choice of meat', 14.00, 7, 2), -- Item ID: 32 (Assumed) - Linked to Meat Options
  ('Torta', 'Bread, queso Oaxaca, beans, lettuce, tomatoes, onions, cilantro, avocado, jalapeños, chipotle, guac sauce, cotija, choice of meat', 13.50, 7, 3), -- Item ID: 33 (Assumed) - Linked to Meat Options
  ('Flautas (4)', 'Potatoes and carnitas', 10.00, 7, 4),
  ('Mulitas', 'Corn tortilla, queso Oaxaca, cilantro, onions, guac sauce, choice of meat', 7.75, 7, 5), -- Item ID: 35 (Assumed) - Linked to Meat Options
  ('Vampiros', 'Corn tortilla, queso Oaxaca, guacamole, choice of meat', 7.75, 7, 6), -- Item ID: 36 (Assumed) - Linked to Meat Options
  ('Empanadas', 'Fried flour, queso Oaxaca, sour cream, guac sauce, lettuce', 7.00, 7, 7),
  ('Loaded Fries (Full)', 'Nacho cheese, pico, jalapeños, guac sauce, chipotle, cotija, sour cream, choice of meat', 19.00, 7, 8), -- Item ID: 38 (Assumed) - Linked to Meat Options
  ('Loaded Fries (Half)', NULL, 12.00, 7, 9), -- Item ID: 39 (Assumed) - Linked to Meat Options
  ('Loaded Nachos (Full)', 'Nacho cheese, pico, jalapeños, guac sauce, chipotle, cotija, sour cream, choice of meat', 19.00, 7, 10),-- Item ID: 40 (Assumed) - Linked to Meat Options
  ('Loaded Nachos (Half)', NULL, 12.00, 7, 11),-- Item ID: 41 (Assumed) - Linked to Meat Options
  ('Hustle Bowl', 'Beans, rice, lettuce, pico, jalapeños, sour cream, guac sauce, cotija, tortilla chips, choice of meat', 15.00, 7, 12), -- Item ID: 42 (Assumed) - Linked to Meat Options
  ('Taco Salad', 'Flour tortilla, lettuce, pico, cilantro, sour cream, cotija, choice of meat', 14.00, 7, 13); -- Item ID: 43 (Assumed) - Linked to Meat Options


-- 3. Insert Option Groups
INSERT INTO
  public.option_groups (name, selection_type, display_order) -- Assuming min/max selections default appropriately
VALUES
  ('Meat Options', 'single', 1), -- Group ID: 1 (Assumed)
  ('Wing Flavors', 'single', 2), -- Group ID: 2 (Assumed)
  ('Fruit Flavors', 'single', 3), -- Group ID: 3 (Assumed) - For Smoothies
  ('Jarritos Flavors', 'single', 4); -- Group ID: 4 (Assumed) - For Jarritos

-- 4. Insert Options
-- Associate with Option Group IDs from above
INSERT INTO
  public.options (name, additional_price, option_group_id, display_order)
VALUES
  -- Meat Options (Group ID: 1)
  ('Asada', 0.00, 1, 1),
  ('Birria', 0.00, 1, 2),
  ('Al Pastor', 0.00, 1, 3),
  ('Carnitas', 0.00, 1, 4),
  ('Chorizo', 0.00, 1, 5),
  ('Pollo', 0.00, 1, 6),
  ('Veggies', 0.00, 1, 7),
  ('Lengua', 2.00, 1, 8),
  -- Wing Flavors (Group ID: 2)
  ('KOREAN BBQ', 0.00, 2, 1),
  ('MANGO HABANERO', 0.00, 2, 2),
  ('SWEET TERIYAKI', 0.00, 2, 3),
  ('GARLIC BUFFALO', 0.00, 2, 4),
  ('BUFFALO', 0.00, 2, 5),
  ('GARLIC PARMESAN', 0.00, 2, 6),
  ('BBQ', 0.00, 2, 7),
  -- Fruit Flavors (Group ID: 3) - For Smoothies
  ('Strawberry', 0.00, 3, 1),
  ('Watermelon', 0.00, 3, 2),
  ('Mango', 0.00, 3, 3),
  ('Peach', 0.00, 3, 4),
  ('Passion Fruit', 0.00, 3, 5),
  ('Raspberry', 0.00, 3, 6),
  ('Prickly Pear', 0.00, 3, 7),
  ('Pineapple', 0.00, 3, 8),
  ('Guava', 0.00, 3, 9),
  ('Kiwi', 0.00, 3, 10),
  ('Blackberry', 0.00, 3, 11),
  ('Coconut', 0.00, 3, 12),
  -- Jarritos Flavors (Group ID: 4) - For Jarritos
  ('Multiple Flavors', 0.00, 4, 1); -- Placeholder, could list individual flavors if known

-- 5. Link Option Groups to Menu Items
-- !! IMPORTANT: Replace placeholder Item IDs and Group IDs with actual IDs after running inserts above !!
INSERT INTO
  public.menu_item_option_groups (menu_item_id, option_group_id)
VALUES
  -- Examples - Needs full mapping based on actual generated IDs
  (21, 1), -- Regular Tacos (Assumed ID 21) link to Meat Options (Assumed ID 1)
  (22, 1), -- Queso Tacos (Assumed ID 22) link to Meat Options (Assumed ID 1)
  (31, 1), -- Burrito (Assumed ID 31) link to Meat Options (Assumed ID 1)
  (32, 1), -- Quesadilla (Assumed ID 32) link to Meat Options (Assumed ID 1)
  (33, 1), -- Torta (Assumed ID 33) link to Meat Options (Assumed ID 1)
  (35, 1), -- Mulitas (Assumed ID 35) link to Meat Options (Assumed ID 1)
  (36, 1), -- Vampiros (Assumed ID 36) link to Meat Options (Assumed ID 1)
  (38, 1), -- Loaded Fries (Full) (Assumed ID 38) link to Meat Options (Assumed ID 1)
  (39, 1), -- Loaded Fries (Half) (Assumed ID 39) link to Meat Options (Assumed ID 1)
  (40, 1), -- Loaded Nachos (Full) (Assumed ID 40) link to Meat Options (Assumed ID 1)
  (41, 1), -- Loaded Nachos (Half) (Assumed ID 41) link to Meat Options (Assumed ID 1)
  (42, 1), -- Hustle Bowl (Assumed ID 42) link to Meat Options (Assumed ID 1)
  (43, 1), -- Taco Salad (Assumed ID 43) link to Meat Options (Assumed ID 1)
  (29, 2), -- Wings (4) (Assumed ID 29) link to Wing Flavors (Assumed ID 2)
  (30, 2), -- Wings (8) (Assumed ID 30) link to Wing Flavors (Assumed ID 2)
  (13, 3), -- Smoothies (Assumed ID 13) link to Fruit Flavors (Assumed ID 3)
  (11, 4); -- Jarritos (Assumed ID 11) link to Jarritos Flavors (Assumed ID 4)
