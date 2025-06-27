-- Populate Menu Data Script
-- This script adds sample food and drink categories and items

-- Insert Food Categories
INSERT INTO public.food_drink_categories (id, name, type, description, icon, display_order, is_active) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Appetizers', 'food', 'Start your meal right', '🥗', 1, true),
('550e8400-e29b-41d4-a716-446655440002', 'Burgers', 'food', 'Juicy handcrafted burgers', '🍔', 2, true),
('550e8400-e29b-41d4-a716-446655440003', 'Wings', 'food', 'Hot and crispy wings', '🍗', 3, true),
('550e8400-e29b-41d4-a716-446655440004', 'Sandwiches', 'food', 'Fresh and delicious sandwiches', '🥪', 4, true),
('550e8400-e29b-41d4-a716-446655440005', 'Salads', 'food', 'Fresh and healthy options', '🥗', 5, true),
('550e8400-e29b-41d4-a716-446655440006', 'Desserts', 'food', 'Sweet treats to finish', '🍰', 6, true)
ON CONFLICT (id) DO NOTHING;

-- Insert Drink Categories  
INSERT INTO public.food_drink_categories (id, name, type, description, icon, display_order, is_active) VALUES
('550e8400-e29b-41d4-a716-446655440011', 'Beers', 'drink', 'Cold draft and bottled beers', '🍺', 1, true),
('550e8400-e29b-41d4-a716-446655440012', 'Cocktails', 'drink', 'Handcrafted cocktails', '🍹', 2, true),
('550e8400-e29b-41d4-a716-446655440013', 'Wine', 'drink', 'Fine wines by the glass', '🍷', 3, true),
('550e8400-e29b-41d4-a716-446655440014', 'Shots', 'drink', 'Premium spirits', '🥃', 4, true),
('550e8400-e29b-41d4-a716-446655440015', 'Non-Alcoholic', 'drink', 'Soft drinks and mocktails', '🥤', 5, true)
ON CONFLICT (id) DO NOTHING;

-- Insert Food Items
-- Appetizers
INSERT INTO public.food_drink_items (id, name, description, category_id, price, is_available, display_order) VALUES
('650e8400-e29b-41d4-a716-446655440001', 'Buffalo Chicken Dip', 'Creamy buffalo chicken dip served with tortilla chips', '550e8400-e29b-41d4-a716-446655440001', 12.99, true, 1),
('650e8400-e29b-41d4-a716-446655440002', 'Loaded Nachos', 'Crispy tortilla chips topped with cheese, jalapeños, and sour cream', '550e8400-e29b-41d4-a716-446655440001', 14.99, true, 2),
('650e8400-e29b-41d4-a716-446655440003', 'Mozzarella Sticks', 'Golden fried mozzarella sticks with marinara sauce', '550e8400-e29b-41d4-a716-446655440001', 10.99, true, 3),
('650e8400-e29b-41d4-a716-446655440004', 'Onion Rings', 'Beer-battered onion rings served with ranch', '550e8400-e29b-41d4-a716-446655440001', 8.99, true, 4)
ON CONFLICT (id) DO NOTHING;

-- Burgers
INSERT INTO public.food_drink_items (id, name, description, category_id, price, is_available, display_order) VALUES
('650e8400-e29b-41d4-a716-446655440011', 'Classic Cheeseburger', 'Beef patty with cheese, lettuce, tomato, and pickles', '550e8400-e29b-41d4-a716-446655440002', 16.99, true, 1),
('650e8400-e29b-41d4-a716-446655440012', 'BBQ Bacon Burger', 'Beef patty with BBQ sauce, bacon, and onion rings', '550e8400-e29b-41d4-a716-446655440002', 18.99, true, 2),
('650e8400-e29b-41d4-a716-446655440013', 'Mushroom Swiss Burger', 'Beef patty with sautéed mushrooms and Swiss cheese', '550e8400-e29b-41d4-a716-446655440002', 17.99, true, 3),
('650e8400-e29b-41d4-a716-446655440014', 'Veggie Burger', 'Plant-based patty with avocado and sprouts', '550e8400-e29b-41d4-a716-446655440002', 15.99, true, 4)
ON CONFLICT (id) DO NOTHING;

-- Wings
INSERT INTO public.food_drink_items (id, name, description, category_id, price, is_available, display_order) VALUES
('650e8400-e29b-41d4-a716-446655440021', 'Buffalo Wings (6pc)', 'Classic buffalo wings with celery and blue cheese', '550e8400-e29b-41d4-a716-446655440003', 12.99, true, 1),
('650e8400-e29b-41d4-a716-446655440022', 'BBQ Wings (6pc)', 'Sweet and tangy BBQ wings', '550e8400-e29b-41d4-a716-446655440003', 12.99, true, 2),
('650e8400-e29b-41d4-a716-446655440023', 'Honey Garlic Wings (6pc)', 'Sticky honey garlic glazed wings', '550e8400-e29b-41d4-a716-446655440003', 13.99, true, 3),
('650e8400-e29b-41d4-a716-446655440024', 'Wings Platter (12pc)', 'Mix and match flavors', '550e8400-e29b-41d4-a716-446655440003', 22.99, true, 4)
ON CONFLICT (id) DO NOTHING;

-- Sandwiches
INSERT INTO public.food_drink_items (id, name, description, category_id, price, is_available, display_order) VALUES
('650e8400-e29b-41d4-a716-446655440031', 'Club Sandwich', 'Triple-decker with turkey, bacon, lettuce, and tomato', '550e8400-e29b-41d4-a716-446655440004', 14.99, true, 1),
('650e8400-e29b-41d4-a716-446655440032', 'Philly Cheesesteak', 'Sliced steak with peppers, onions, and cheese', '550e8400-e29b-41d4-a716-446655440004', 16.99, true, 2),
('650e8400-e29b-41d4-a716-446655440033', 'Grilled Chicken Sandwich', 'Marinated chicken breast with avocado', '550e8400-e29b-41d4-a716-446655440004', 15.99, true, 3),
('650e8400-e29b-41d4-a716-446655440034', 'Fish Sandwich', 'Beer-battered cod with tartar sauce', '550e8400-e29b-41d4-a716-446655440004', 14.99, true, 4)
ON CONFLICT (id) DO NOTHING;

-- Salads
INSERT INTO public.food_drink_items (id, name, description, category_id, price, is_available, display_order) VALUES
('650e8400-e29b-41d4-a716-446655440041', 'Caesar Salad', 'Romaine lettuce with Caesar dressing and croutons', '550e8400-e29b-41d4-a716-446655440005', 11.99, true, 1),
('650e8400-e29b-41d4-a716-446655440042', 'House Salad', 'Mixed greens with tomatoes, cucumbers, and onions', '550e8400-e29b-41d4-a716-446655440005', 9.99, true, 2),
('650e8400-e29b-41d4-a716-446655440043', 'Buffalo Chicken Salad', 'Crispy buffalo chicken over mixed greens', '550e8400-e29b-41d4-a716-446655440005', 15.99, true, 3),
('650e8400-e29b-41d4-a716-446655440044', 'Cobb Salad', 'Mixed greens with bacon, egg, cheese, and avocado', '550e8400-e29b-41d4-a716-446655440005', 16.99, true, 4)
ON CONFLICT (id) DO NOTHING;

-- Desserts
INSERT INTO public.food_drink_items (id, name, description, category_id, price, is_available, display_order) VALUES
('650e8400-e29b-41d4-a716-446655440051', 'Chocolate Brownie', 'Warm chocolate brownie with vanilla ice cream', '550e8400-e29b-41d4-a716-446655440006', 7.99, true, 1),
('650e8400-e29b-41d4-a716-446655440052', 'New York Cheesecake', 'Classic cheesecake with berry compote', '550e8400-e29b-41d4-a716-446655440006', 8.99, true, 2),
('650e8400-e29b-41d4-a716-446655440053', 'Apple Pie', 'Homemade apple pie with cinnamon ice cream', '550e8400-e29b-41d4-a716-446655440006', 7.99, true, 3),
('650e8400-e29b-41d4-a716-446655440054', 'Ice Cream Sundae', 'Three scoops with hot fudge and whipped cream', '550e8400-e29b-41d4-a716-446655440006', 6.99, true, 4)
ON CONFLICT (id) DO NOTHING;

-- Insert Drink Items
-- Beers
INSERT INTO public.food_drink_items (id, name, description, category_id, price, is_available, display_order) VALUES
('650e8400-e29b-41d4-a716-446655440111', 'Bud Light', 'Light American lager', '550e8400-e29b-41d4-a716-446655440011', 4.99, true, 1),
('650e8400-e29b-41d4-a716-446655440112', 'Corona', 'Mexican lager with lime', '550e8400-e29b-41d4-a716-446655440011', 5.99, true, 2),
('650e8400-e29b-41d4-a716-446655440113', 'Blue Moon', 'Belgian-style wheat beer', '550e8400-e29b-41d4-a716-446655440011', 5.99, true, 3),
('650e8400-e29b-41d4-a716-446655440114', 'IPA on Tap', 'Local craft IPA', '550e8400-e29b-41d4-a716-446655440011', 6.99, true, 4)
ON CONFLICT (id) DO NOTHING;

-- Cocktails
INSERT INTO public.food_drink_items (id, name, description, category_id, price, is_available, display_order) VALUES
('650e8400-e29b-41d4-a716-446655440121', 'Margarita', 'Classic lime margarita with salt rim', '550e8400-e29b-41d4-a716-446655440012', 9.99, true, 1),
('650e8400-e29b-41d4-a716-446655440122', 'Long Island Iced Tea', 'Mixed liquors with cola and lemon', '550e8400-e29b-41d4-a716-446655440012', 11.99, true, 2),
('650e8400-e29b-41d4-a716-446655440123', 'Mojito', 'Rum with mint, lime, and soda', '550e8400-e29b-41d4-a716-446655440012', 10.99, true, 3),
('650e8400-e29b-41d4-a716-446655440124', 'Old Fashioned', 'Whiskey with bitters and orange', '550e8400-e29b-41d4-a716-446655440012', 12.99, true, 4)
ON CONFLICT (id) DO NOTHING;

-- Wine
INSERT INTO public.food_drink_items (id, name, description, category_id, price, is_available, display_order) VALUES
('650e8400-e29b-41d4-a716-446655440131', 'House Red', 'Cabernet Sauvignon blend', '550e8400-e29b-41d4-a716-446655440013', 7.99, true, 1),
('650e8400-e29b-41d4-a716-446655440132', 'House White', 'Chardonnay blend', '550e8400-e29b-41d4-a716-446655440013', 7.99, true, 2),
('650e8400-e29b-41d4-a716-446655440133', 'Pinot Grigio', 'Light and crisp white wine', '550e8400-e29b-41d4-a716-446655440013', 8.99, true, 3),
('650e8400-e29b-41d4-a716-446655440134', 'Merlot', 'Smooth red wine', '550e8400-e29b-41d4-a716-446655440013', 8.99, true, 4)
ON CONFLICT (id) DO NOTHING;

-- Shots
INSERT INTO public.food_drink_items (id, name, description, category_id, price, is_available, display_order) VALUES
('650e8400-e29b-41d4-a716-446655440141', 'Fireball', 'Cinnamon whiskey shot', '550e8400-e29b-41d4-a716-446655440014', 4.99, true, 1),
('650e8400-e29b-41d4-a716-446655440142', 'Jameson', 'Irish whiskey shot', '550e8400-e29b-41d4-a716-446655440014', 6.99, true, 2),
('650e8400-e29b-41d4-a716-446655440143', 'Tequila', 'Silver tequila shot', '550e8400-e29b-41d4-a716-446655440014', 5.99, true, 3),
('650e8400-e29b-41d4-a716-446655440144', 'Jager Bomb', 'Jägermeister dropped in Red Bull', '550e8400-e29b-41d4-a716-446655440014', 8.99, true, 4)
ON CONFLICT (id) DO NOTHING;

-- Non-Alcoholic
INSERT INTO public.food_drink_items (id, name, description, category_id, price, is_available, display_order) VALUES
('650e8400-e29b-41d4-a716-446655440151', 'Coca-Cola', 'Classic Coke', '550e8400-e29b-41d4-a716-446655440015', 2.99, true, 1),
('650e8400-e29b-41d4-a716-446655440152', 'Sprite', 'Lemon-lime soda', '550e8400-e29b-41d4-a716-446655440015', 2.99, true, 2),
('650e8400-e29b-41d4-a716-446655440153', 'Virgin Mojito', 'Mint, lime, and soda water', '550e8400-e29b-41d4-a716-446655440015', 4.99, true, 3),
('650e8400-e29b-41d4-a716-446655440154', 'Iced Tea', 'Fresh brewed sweet tea', '550e8400-e29b-41d4-a716-446655440015', 2.99, true, 4)
ON CONFLICT (id) DO NOTHING;

-- Add some basic modifier groups and modifiers
INSERT INTO public.menu_item_modifiers (id, modifier_type, name, price_adjustment, is_available, display_order) VALUES
-- Meat options
('750e8400-e29b-41d4-a716-446655440001', 'meat', 'Chicken', 0.00, true, 1),
('750e8400-e29b-41d4-a716-446655440002', 'meat', 'Beef', 2.00, true, 2),
('750e8400-e29b-41d4-a716-446655440003', 'meat', 'Turkey', 1.00, true, 3),
('750e8400-e29b-41d4-a716-446655440004', 'meat', 'No Meat', -2.00, true, 4),

-- Sauce options
('750e8400-e29b-41d4-a716-446655440011', 'sauce', 'Ranch', 0.00, true, 1),
('750e8400-e29b-41d4-a716-446655440012', 'sauce', 'Buffalo', 0.00, true, 2),
('750e8400-e29b-41d4-a716-446655440013', 'sauce', 'BBQ', 0.00, true, 3),
('750e8400-e29b-41d4-a716-446655440014', 'sauce', 'Honey Mustard', 0.00, true, 4),
('750e8400-e29b-41d4-a716-446655440015', 'sauce', 'Blue Cheese', 0.50, true, 5)
ON CONFLICT (id) DO NOTHING;
