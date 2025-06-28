import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST() {
  try {
    console.log('🔐 Admin menu data population...');
    
    // Use admin/service role client that bypasses RLS
    const supabaseAdmin = createAdminClient();
    console.log('🔧 Using service role key for admin access');

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

    // Insert categories with admin client
    console.log('📂 Inserting categories with admin privileges...');
    const { data: categoriesData, error: categoriesError } = await supabaseAdmin
      .from('food_drink_categories')
      .upsert([...foodCategories, ...drinkCategories], { onConflict: 'id' })
      .select();

    if (categoriesError) {
      console.error('Error inserting categories:', categoriesError);
      return NextResponse.json({
        success: false,
        step: 'categories',
        error: categoriesError
      });
    }

    console.log(`✅ Categories inserted: ${categoriesData?.length || 0}`);

    // Sample Food Items (reduced set for testing)
    const foodItems = [
      // Appetizers
      { id: '650e8400-e29b-41d4-a716-446655440001', name: 'Buffalo Chicken Dip', description: 'Creamy buffalo chicken dip served with tortilla chips', category_id: '550e8400-e29b-41d4-a716-446655440001', price: 12.99, is_available: true, display_order: 1 },
      { id: '650e8400-e29b-41d4-a716-446655440002', name: 'Loaded Nachos', description: 'Crispy tortilla chips topped with cheese, jalapeños, and sour cream', category_id: '550e8400-e29b-41d4-a716-446655440001', price: 14.99, is_available: true, display_order: 2 },
      
      // Burgers
      { id: '650e8400-e29b-41d4-a716-446655440011', name: 'Classic Cheeseburger', description: 'Beef patty with cheese, lettuce, tomato, and pickles', category_id: '550e8400-e29b-41d4-a716-446655440002', price: 16.99, is_available: true, display_order: 1 },
      { id: '650e8400-e29b-41d4-a716-446655440012', name: 'BBQ Bacon Burger', description: 'Beef patty with BBQ sauce, bacon, and onion rings', category_id: '550e8400-e29b-41d4-a716-446655440002', price: 18.99, is_available: true, display_order: 2 },
      
      // Wings
      { id: '650e8400-e29b-41d4-a716-446655440021', name: 'Buffalo Wings (6pc)', description: 'Classic buffalo wings with celery and blue cheese', category_id: '550e8400-e29b-41d4-a716-446655440003', price: 12.99, is_available: true, display_order: 1 },
      { id: '650e8400-e29b-41d4-a716-446655440022', name: 'BBQ Wings (6pc)', description: 'Sweet and tangy BBQ wings', category_id: '550e8400-e29b-41d4-a716-446655440003', price: 12.99, is_available: true, display_order: 2 },
    ];

    // Sample Drink Items
    const drinkItems = [
      // Beers
      { id: '650e8400-e29b-41d4-a716-446655440111', name: 'Bud Light', description: 'Light American lager', category_id: '550e8400-e29b-41d4-a716-446655440011', price: 4.99, is_available: true, display_order: 1 },
      { id: '650e8400-e29b-41d4-a716-446655440112', name: 'Corona', description: 'Mexican lager with lime', category_id: '550e8400-e29b-41d4-a716-446655440011', price: 5.99, is_available: true, display_order: 2 },
      
      // Cocktails
      { id: '650e8400-e29b-41d4-a716-446655440121', name: 'Margarita', description: 'Classic lime margarita with salt rim', category_id: '550e8400-e29b-41d4-a716-446655440012', price: 9.99, is_available: true, display_order: 1 },
      { id: '650e8400-e29b-41d4-a716-446655440122', name: 'Long Island Iced Tea', description: 'Mixed liquors with cola and lemon', category_id: '550e8400-e29b-41d4-a716-446655440012', price: 11.99, is_available: true, display_order: 2 },
    ];

    // Insert items with admin client
    console.log('🍽️ Inserting menu items with admin privileges...');
    const { data: itemsData, error: itemsError } = await supabaseAdmin
      .from('food_drink_items')
      .upsert([...foodItems, ...drinkItems], { onConflict: 'id' })
      .select();

    if (itemsError) {
      console.error('Error inserting items:', itemsError);
      return NextResponse.json({
        success: false,
        step: 'items',
        error: itemsError
      });
    }

    console.log(`✅ Menu items inserted: ${itemsData?.length || 0}`);

    // Verify the data was inserted
    const { data: verifyCategories } = await supabaseAdmin
      .from('food_drink_categories')
      .select('*');

    const { data: verifyItems } = await supabaseAdmin
      .from('food_drink_items')
      .select('*');

    console.log('✅ Data verification:');
    console.log(`   Categories: ${verifyCategories?.length || 0}`);
    console.log(`   Items: ${verifyItems?.length || 0}`);

    return NextResponse.json({
      success: true,
      message: 'Menu data populated successfully with admin privileges',
      summary: {
        categoriesInserted: categoriesData?.length || 0,
        itemsInserted: itemsData?.length || 0,
        totalCategories: verifyCategories?.length || 0,
        totalItems: verifyItems?.length || 0
      }
    });

  } catch (error) {
    console.error('🚨 Admin populate error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Admin populate failed', 
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : null
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Use POST to populate menu data with admin privileges',
    endpoint: '/api/admin-populate-menu',
    method: 'POST',
    note: 'This endpoint uses service role key to bypass RLS'
  });
}
