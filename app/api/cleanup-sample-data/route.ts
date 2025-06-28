import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST() {
  try {
    console.log('🧹 Removing sample menu data...');
    
    // Use admin client to remove the sample data I added
    const supabaseAdmin = createAdminClient();
    
    // Remove the specific sample categories I added (these were the IDs from my populate script)
    const sampleCategoryIds = [
      '550e8400-e29b-41d4-a716-446655440001', // Appetizers
      '550e8400-e29b-41d4-a716-446655440002', // Burgers
      '550e8400-e29b-41d4-a716-446655440003', // Wings
      '550e8400-e29b-41d4-a716-446655440004', // Sandwiches
      '550e8400-e29b-41d4-a716-446655440005', // Salads
      '550e8400-e29b-41d4-a716-446655440006', // Desserts
      '550e8400-e29b-41d4-a716-446655440011', // Beers
      '550e8400-e29b-41d4-a716-446655440012', // Cocktails
      '550e8400-e29b-41d4-a716-446655440013', // Wine
      '550e8400-e29b-41d4-a716-446655440014', // Shots
      '550e8400-e29b-41d4-a716-446655440015', // Non-Alcoholic
    ];

    // Remove sample menu items first (they reference categories)
    const sampleItemIds = [
      '650e8400-e29b-41d4-a716-446655440001',
      '650e8400-e29b-41d4-a716-446655440002',
      '650e8400-e29b-41d4-a716-446655440011',
      '650e8400-e29b-41d4-a716-446655440012',
      '650e8400-e29b-41d4-a716-446655440021',
      '650e8400-e29b-41d4-a716-446655440022',
      '650e8400-e29b-41d4-a716-446655440111',
      '650e8400-e29b-41d4-a716-446655440112',
      '650e8400-e29b-41d4-a716-446655440121',
      '650e8400-e29b-41d4-a716-446655440122',
    ];

    console.log('Removing sample menu items...');
    const { error: itemsError } = await supabaseAdmin
      .from('food_drink_items')
      .delete()
      .in('id', sampleItemIds);

    if (itemsError) {
      console.error('Error removing sample items:', itemsError);
    }

    console.log('Removing sample categories...');
    const { error: categoriesError } = await supabaseAdmin
      .from('food_drink_categories')
      .delete()
      .in('id', sampleCategoryIds);

    if (categoriesError) {
      console.error('Error removing sample categories:', categoriesError);
    }

    // Remove sample modifiers
    const sampleModifierIds = [
      '750e8400-e29b-41d4-a716-446655440001',
      '750e8400-e29b-41d4-a716-446655440002',
      '750e8400-e29b-41d4-a716-446655440003',
      '750e8400-e29b-41d4-a716-446655440004',
      '750e8400-e29b-41d4-a716-446655440011',
      '750e8400-e29b-41d4-a716-446655440012',
      '750e8400-e29b-41d4-a716-446655440013',
      '750e8400-e29b-41d4-a716-446655440014',
      '750e8400-e29b-41d4-a716-446655440015',
    ];

    console.log('Removing sample modifiers...');
    const { error: modifiersError } = await supabaseAdmin
      .from('menu_item_modifiers')
      .delete()
      .in('id', sampleModifierIds);

    if (modifiersError) {
      console.error('Error removing sample modifiers:', modifiersError);
    }

    // Verify final counts
    const { data: finalCategories } = await supabaseAdmin
      .from('food_drink_categories')
      .select('*');

    const { data: finalItems } = await supabaseAdmin
      .from('food_drink_items')
      .select('*');

    console.log('✅ Sample data cleanup completed');
    console.log(`Real categories remaining: ${finalCategories?.length || 0}`);
    console.log(`Real menu items remaining: ${finalItems?.length || 0}`);

    return NextResponse.json({
      success: true,
      message: 'Sample data removed successfully',
      remaining: {
        categories: finalCategories?.length || 0,
        items: finalItems?.length || 0
      }
    });

  } catch (error) {
    console.error('🚨 Cleanup error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Cleanup failed', 
        message: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Use POST to remove sample menu data',
    endpoint: '/api/cleanup-sample-data',
    method: 'POST'
  });
}
