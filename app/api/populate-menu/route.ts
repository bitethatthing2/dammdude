import { createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
  try {
    console.log('🚀 Starting menu data population...');
    
    const supabase = await createServerClient();
    
    // Food Categories
    const foodCategories = [
      { id: '550e8400-e29b-41d4-a716-446655440001', name: 'Appetizers', type: 'food', description: 'Start your meal right', icon: '🥗', display_order: 1, is_active: true },
      { id: '550e8400-e29b-41d4-a716-446655440002', name: 'Burgers', type: 'food', description: 'Juicy handcrafted burgers', icon: '🍔', display_order: 2, is_active: true },
      { id: '550e8400-e29b-41d4-a716-446655440003', name: 'Wings', type: 'food', description: 'Hot and crispy wings', icon: '🍗', display_order: 3, is_active: true },
      { id: '550e8400-e29b-41d4-a716-446655440004', name: 'Sandwiches', type: 'food', description: 'Fresh and delicious sandwiches', icon: '🥪', display_order: 4, is_active: true },
      { id: '550e8400-e29b-41d4-a716-446655440005', name: 'Salads', type: 'food', description: 'Fresh and healthy options', icon: '🥗', display_order: 5, is_active: true },
      { id: '550e8400-e29b-41d4-a716-446655440006', name: 'Desserts', type: 'food', description: 'Sweet treats to finish', icon: '🍰', display_order: 6, is_active: true },
    ];

    // Drink Categories
    const drinkCategories = [
      { id: '550e8400-e29b-41d4-a716-446655440011', name: 'Beers', type: 'drink', description: 'Cold draft and bottled beers', icon: '🍺', display_order: 1, is_active: true },
      { id: '550e8400-e29b-41d4-a716-446655440012', name: 'Cocktails', type: 'drink', description: 'Handcrafted cocktails', icon: '🍹', display_order: 2, is_active: true },
      { id: '550e8400-e29b-41d4-a716-446655440013', name: 'Wine', type: 'drink', description: 'Fine wines by the glass', icon: '🍷', display_order: 3, is_active: true },
      { id: '550e8400-e29b-41d4-a716-446655440014', name: 'Shots', type: 'drink', description: 'Premium spirits', icon: '🥃', display_order: 4, is_active: true },
      { id: '550e8400-e29b-41d4-a716-446655440015', name: 'Non-Alcoholic', type: 'drink', description: 'Soft drinks and mocktails', icon: '🥤', display_order: 5, is_active: true },
    ];

    // Insert categories
    console.log('📂 Inserting categories...');
    const { error: categoriesError } = await supabase
      .from('food_drink_categories')
      .upsert([...foodCategories, ...drinkCategories], { onConflict: 'id' });

    if (categoriesError) {
      console.error('Error inserting categories:', categoriesError);
      throw categoriesError;
    }

    // Food Items
    const foodItems = [
      // Appetizers
      { id: '650e8400-e29b-41d4-a716-446655440001', name: 'Buffalo Chicken Dip', description: 'Creamy buffalo chicken dip served with tortilla chips', category_id: '550e8400-e29b-41d4-a716-446655440001', price: 12.99, is_available: true, display_order: 1 },
      { id: '650e8400-e29b-41d4-a716-446655440002', name: 'Loaded Nachos', description: 'Crispy tortilla chips topped with cheese, jalapeños, and sour cream', category_id: '550e8400-e29b-41d4-a716-446655440001', price: 14.99, is_available: true, display_order: 2 },
      { id: '650e8400-e29b-41d4-a716-446655440003', name: 'Mozzarella Sticks', description: 'Golden fried mozzarella sticks with marinara sauce', category_id: '550e8400-e29b-41d4-a716-446655440001', price: 10.99, is_available: true, display_order: 3 },
      { id: '650e8400-e29b-41d4-a716-446655440004', name: 'Onion Rings', description: 'Beer-battered onion rings served with ranch', category_id: '550e8400-e29b-41d4-a716-446655440001', price: 8.99, is_available: true, display_order: 4 },
      
      // Burgers
      { id: '650e8400-e29b-41d4-a716-446655440011', name: 'Classic Cheeseburger', description: 'Beef patty with cheese, lettuce, tomato, and pickles', category_id: '550e8400-e29b-41d4-a716-446655440002', price: 16.99, is_available: true, display_order: 1 },
      { id: '650e8400-e29b-41d4-a716-446655440012', name: 'BBQ Bacon Burger', description: 'Beef patty with BBQ sauce, bacon, and onion rings', category_id: '550e8400-e29b-41d4-a716-446655440002', price: 18.99, is_available: true, display_order: 2 },
      { id: '650e8400-e29b-41d4-a716-446655440013', name: 'Mushroom Swiss Burger', description: 'Beef patty with sautéed mushrooms and Swiss cheese', category_id: '550e8400-e29b-41d4-a716-446655440002', price: 17.99, is_available: true, display_order: 3 },
      { id: '650e8400-e29b-41d4-a716-446655440014', name: 'Veggie Burger', description: 'Plant-based patty with avocado and sprouts', category_id: '550e8400-e29b-41d4-a716-446655440002', price: 15.99, is_available: true, display_order: 4 },
      
      // Wings
      { id: '650e8400-e29b-41d4-a716-446655440021', name: 'Buffalo Wings (6pc)', description: 'Classic buffalo wings with celery and blue cheese', category_id: '550e8400-e29b-41d4-a716-446655440003', price: 12.99, is_available: true, display_order: 1 },
      { id: '650e8400-e29b-41d4-a716-446655440022', name: 'BBQ Wings (6pc)', description: 'Sweet and tangy BBQ wings', category_id: '550e8400-e29b-41d4-a716-446655440003', price: 12.99, is_available: true, display_order: 2 },
      { id: '650e8400-e29b-41d4-a716-446655440023', name: 'Honey Garlic Wings (6pc)', description: 'Sticky honey garlic glazed wings', category_id: '550e8400-e29b-41d4-a716-446655440003', price: 13.99, is_available: true, display_order: 3 },
      { id: '650e8400-e29b-41d4-a716-446655440024', name: 'Wings Platter (12pc)', description: 'Mix and match flavors', category_id: '550e8400-e29b-41d4-a716-446655440003', price: 22.99, is_available: true, display_order: 4 },
      
      // Sandwiches
      { id: '650e8400-e29b-41d4-a716-446655440031', name: 'Club Sandwich', description: 'Triple-decker with turkey, bacon, lettuce, and tomato', category_id: '550e8400-e29b-41d4-a716-446655440004', price: 14.99, is_available: true, display_order: 1 },
      { id: '650e8400-e29b-41d4-a716-446655440032', name: 'Philly Cheesesteak', description: 'Sliced steak with peppers, onions, and cheese', category_id: '550e8400-e29b-41d4-a716-446655440004', price: 16.99, is_available: true, display_order: 2 },
      { id: '650e8400-e29b-41d4-a716-446655440033', name: 'Grilled Chicken Sandwich', description: 'Marinated chicken breast with avocado', category_id: '550e8400-e29b-41d4-a716-446655440004', price: 15.99, is_available: true, display_order: 3 },
      { id: '650e8400-e29b-41d4-a716-446655440034', name: 'Fish Sandwich', description: 'Beer-battered cod with tartar sauce', category_id: '550e8400-e29b-41d4-a716-446655440004', price: 14.99, is_available: true, display_order: 4 },
      
      // Salads
      { id: '650e8400-e29b-41d4-a716-446655440041', name: 'Caesar Salad', description: 'Romaine lettuce with Caesar dressing and croutons', category_id: '550e8400-e29b-41d4-a716-446655440005', price: 11.99, is_available: true, display_order: 1 },
      { id: '650e8400-e29b-41d4-a716-446655440042', name: 'House Salad', description: 'Mixed greens with tomatoes, cucumbers, and onions', category_id: '550e8400-e29b-41d4-a716-446655440005', price: 9.99, is_available: true, display_order: 2 },
      { id: '650e8400-e29b-41d4-a716-446655440043', name: 'Buffalo Chicken Salad', description: 'Crispy buffalo chicken over mixed greens', category_id: '550e8400-e29b-41d4-a716-446655440005', price: 15.99, is_available: true, display_order: 3 },
      { id: '650e8400-e29b-41d4-a716-446655440044', name: 'Cobb Salad', description: 'Mixed greens with bacon, egg, cheese, and avocado', category_id: '550e8400-e29b-41d4-a716-446655440005', price: 16.99, is_available: true, display_order: 4 },
      
      // Desserts
      { id: '650e8400-e29b-41d4-a716-446655440051', name: 'Chocolate Brownie', description: 'Warm chocolate brownie with vanilla ice cream', category_id: '550e8400-e29b-41d4-a716-446655440006', price: 7.99, is_available: true, display_order: 1 },
      { id: '650e8400-e29b-41d4-a716-446655440052', name: 'New York Cheesecake', description: 'Classic cheesecake with berry compote', category_id: '550e8400-e29b-41d4-a716-446655440006', price: 8.99, is_available: true, display_order: 2 },
      { id: '650e8400-e29b-41d4-a716-446655440053', name: 'Apple Pie', description: 'Homemade apple pie with cinnamon ice cream', category_id: '550e8400-e29b-41d4-a716-446655440006', price: 7.99, is_available: true, display_order: 3 },
      { id: '650e8400-e29b-41d4-a716-446655440054', name: 'Ice Cream Sundae', description: 'Three scoops with hot fudge and whipped cream', category_id: '550e8400-e29b-41d4-a716-446655440006', price: 6.99, is_available: true, display_order: 4 },
    ];

    // Drink Items
    const drinkItems = [
      // Beers
      { id: '650e8400-e29b-41d4-a716-446655440111', name: 'Bud Light', description: 'Light American lager', category_id: '550e8400-e29b-41d4-a716-446655440011', price: 4.99, is_available: true, display_order: 1 },
      { id: '650e8400-e29b-41d4-a716-446655440112', name: 'Corona', description: 'Mexican lager with lime', category_id: '550e8400-e29b-41d4-a716-446655440011', price: 5.99, is_available: true, display_order: 2 },
      { id: '650e8400-e29b-41d4-a716-446655440113', name: 'Blue Moon', description: 'Belgian-style wheat beer', category_id: '550e8400-e29b-41d4-a716-446655440011', price: 5.99, is_available: true, display_order: 3 },
      { id: '650e8400-e29b-41d4-a716-446655440114', name: 'IPA on Tap', description: 'Local craft IPA', category_id: '550e8400-e29b-41d4-a716-446655440011', price: 6.99, is_available: true, display_order: 4 },
      
      // Cocktails
      { id: '650e8400-e29b-41d4-a716-446655440121', name: 'Margarita', description: 'Classic lime margarita with salt rim', category_id: '550e8400-e29b-41d4-a716-446655440012', price: 9.99, is_available: true, display_order: 1 },
      { id: '650e8400-e29b-41d4-a716-446655440122', name: 'Long Island Iced Tea', description: 'Mixed liquors with cola and lemon', category_id: '550e8400-e29b-41d4-a716-446655440012', price: 11.99, is_available: true, display_order: 2 },
      { id: '650e8400-e29b-41d4-a716-446655440123', name: 'Mojito', description: 'Rum with mint, lime, and soda', category_id: '550e8400-e29b-41d4-a716-446655440012', price: 10.99, is_available: true, display_order: 3 },
      { id: '650e8400-e29b-41d4-a716-446655440124', name: 'Old Fashioned', description: 'Whiskey with bitters and orange', category_id: '550e8400-e29b-41d4-a716-446655440012', price: 12.99, is_available: true, display_order: 4 },
      
      // Wine
      { id: '650e8400-e29b-41d4-a716-446655440131', name: 'House Red', description: 'Cabernet Sauvignon blend', category_id: '550e8400-e29b-41d4-a716-446655440013', price: 7.99, is_available: true, display_order: 1 },
      { id: '650e8400-e29b-41d4-a716-446655440132', name: 'House White', description: 'Chardonnay blend', category_id: '550e8400-e29b-41d4-a716-446655440013', price: 7.99, is_available: true, display_order: 2 },
      { id: '650e8400-e29b-41d4-a716-446655440133', name: 'Pinot Grigio', description: 'Light and crisp white wine', category_id: '550e8400-e29b-41d4-a716-446655440013', price: 8.99, is_available: true, display_order: 3 },
      { id: '650e8400-e29b-41d4-a716-446655440134', name: 'Merlot', description: 'Smooth red wine', category_id: '550e8400-e29b-41d4-a716-446655440013', price: 8.99, is_available: true, display_order: 4 },
      
      // Shots
      { id: '650e8400-e29b-41d4-a716-446655440141', name: 'Fireball', description: 'Cinnamon whiskey shot', category_id: '550e8400-e29b-41d4-a716-446655440014', price: 4.99, is_available: true, display_order: 1 },
      { id: '650e8400-e29b-41d4-a716-446655440142', name: 'Jameson', description: 'Irish whiskey shot', category_id: '550e8400-e29b-41d4-a716-446655440014', price: 6.99, is_available: true, display_order: 2 },
      { id: '650e8400-e29b-41d4-a716-446655440143', name: 'Tequila', description: 'Silver tequila shot', category_id: '550e8400-e29b-41d4-a716-446655440014', price: 5.99, is_available: true, display_order: 3 },
      { id: '650e8400-e29b-41d4-a716-446655440144', name: 'Jager Bomb', description: 'Jägermeister dropped in Red Bull', category_id: '550e8400-e29b-41d4-a716-446655440014', price: 8.99, is_available: true, display_order: 4 },
      
      // Non-Alcoholic
      { id: '650e8400-e29b-41d4-a716-446655440151', name: 'Coca-Cola', description: 'Classic Coke', category_id: '550e8400-e29b-41d4-a716-446655440015', price: 2.99, is_available: true, display_order: 1 },
      { id: '650e8400-e29b-41d4-a716-446655440152', name: 'Sprite', description: 'Lemon-lime soda', category_id: '550e8400-e29b-41d4-a716-446655440015', price: 2.99, is_available: true, display_order: 2 },
      { id: '650e8400-e29b-41d4-a716-446655440153', name: 'Virgin Mojito', description: 'Mint, lime, and soda water', category_id: '550e8400-e29b-41d4-a716-446655440015', price: 4.99, is_available: true, display_order: 3 },
      { id: '650e8400-e29b-41d4-a716-446655440154', name: 'Iced Tea', description: 'Fresh brewed sweet tea', category_id: '550e8400-e29b-41d4-a716-446655440015', price: 2.99, is_available: true, display_order: 4 },
    ];

    // Insert menu items
    console.log('🍽️ Inserting food items...');
    const { error: foodItemsError } = await supabase
      .from('food_drink_items')
      .upsert(foodItems, { onConflict: 'id' });

    if (foodItemsError) {
      console.error('Error inserting food items:', foodItemsError);
      throw foodItemsError;
    }

    console.log('🍹 Inserting drink items...');
    const { error: drinkItemsError } = await supabase
      .from('food_drink_items')
      .upsert(drinkItems, { onConflict: 'id' });

    if (drinkItemsError) {
      console.error('Error inserting drink items:', drinkItemsError);
      throw drinkItemsError;
    }

    // Insert modifiers
    const modifiers = [
      // Meat options
      { id: '750e8400-e29b-41d4-a716-446655440001', modifier_type: 'meat', name: 'Chicken', price_adjustment: 0.00, is_available: true, display_order: 1 },
      { id: '750e8400-e29b-41d4-a716-446655440002', modifier_type: 'meat', name: 'Beef', price_adjustment: 2.00, is_available: true, display_order: 2 },
      { id: '750e8400-e29b-41d4-a716-446655440003', modifier_type: 'meat', name: 'Turkey', price_adjustment: 1.00, is_available: true, display_order: 3 },
      { id: '750e8400-e29b-41d4-a716-446655440004', modifier_type: 'meat', name: 'No Meat', price_adjustment: -2.00, is_available: true, display_order: 4 },
      
      // Sauce options
      { id: '750e8400-e29b-41d4-a716-446655440011', modifier_type: 'sauce', name: 'Ranch', price_adjustment: 0.00, is_available: true, display_order: 1 },
      { id: '750e8400-e29b-41d4-a716-446655440012', modifier_type: 'sauce', name: 'Buffalo', price_adjustment: 0.00, is_available: true, display_order: 2 },
      { id: '750e8400-e29b-41d4-a716-446655440013', modifier_type: 'sauce', name: 'BBQ', price_adjustment: 0.00, is_available: true, display_order: 3 },
      { id: '750e8400-e29b-41d4-a716-446655440014', modifier_type: 'sauce', name: 'Honey Mustard', price_adjustment: 0.00, is_available: true, display_order: 4 },
      { id: '750e8400-e29b-41d4-a716-446655440015', modifier_type: 'sauce', name: 'Blue Cheese', price_adjustment: 0.50, is_available: true, display_order: 5 },
    ];

    console.log('🧄 Inserting modifiers...');
    const { error: modifiersError } = await supabase
      .from('menu_item_modifiers')
      .upsert(modifiers, { onConflict: 'id' });

    if (modifiersError) {
      console.error('Error inserting modifiers:', modifiersError);
      throw modifiersError;
    }

    console.log('✅ Menu data population completed successfully!');
    
    return NextResponse.json({
      success: true,
      message: 'Menu data populated successfully',
      summary: {
        categories: foodCategories.length + drinkCategories.length,
        foodItems: foodItems.length,
        drinkItems: drinkItems.length,
        modifiers: modifiers.length,
        totalItems: foodItems.length + drinkItems.length
      }
    });

  } catch (error) {
    console.error('🚨 Error populating menu data:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to populate menu data', 
        message: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Use POST to populate menu data',
    endpoint: '/api/populate-menu',
    method: 'POST'
  });
}
