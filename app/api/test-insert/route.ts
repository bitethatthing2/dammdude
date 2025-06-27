import { createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
  try {
    console.log('🧪 Testing database insert...');
    
    const supabase = await createServerClient();
    
    // Test 1: Try inserting a single category
    console.log('🧪 Test 1: Insert single category');
    const { data: categoryResult, error: categoryError } = await supabase
      .from('food_drink_categories')
      .insert([{
        id: '550e8400-e29b-41d4-a716-446655440001',
        name: 'Test Appetizers',
        type: 'food',
        description: 'Test category',
        icon: '🥗',
        display_order: 1,
        is_active: true
      }])
      .select();

    console.log('Category Result:', { categoryResult, categoryError });

    if (categoryError) {
      return NextResponse.json({
        success: false,
        step: 'category_insert',
        error: categoryError,
        details: {
          code: categoryError.code,
          message: categoryError.message,
          details: categoryError.details
        }
      });
    }

    // Test 2: Try inserting a single menu item
    console.log('🧪 Test 2: Insert single menu item');
    const { data: itemResult, error: itemError } = await supabase
      .from('food_drink_items')
      .insert([{
        id: '650e8400-e29b-41d4-a716-446655440001',
        name: 'Test Buffalo Chicken Dip',
        description: 'Test item',
        category_id: '550e8400-e29b-41d4-a716-446655440001',
        price: 12.99,
        is_available: true,
        display_order: 1
      }])
      .select();

    console.log('Item Result:', { itemResult, itemError });

    if (itemError) {
      return NextResponse.json({
        success: false,
        step: 'item_insert',
        error: itemError,
        details: {
          code: itemError.code,
          message: itemError.message,
          details: itemError.details
        }
      });
    }

    // Test 3: Try reading back the data
    console.log('🧪 Test 3: Read back data');
    const { data: readResult, error: readError } = await supabase
      .from('food_drink_categories')
      .select('*');

    console.log('Read Result:', { readResult, readError });

    return NextResponse.json({
      success: true,
      message: 'Test insert successful',
      results: {
        category: categoryResult,
        item: itemResult,
        readBack: readResult
      }
    });

  } catch (error) {
    console.error('🚨 Test insert error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Test insert failed', 
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : null
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Use POST to test database insert',
    endpoint: '/api/test-insert',
    method: 'POST'
  });
}
