import { createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    console.log('🔍 DEBUG: Starting menu debug...');
    
    const supabase = await createServerClient();
    
    // Test basic connection
    const { data: testData, error: testError } = await supabase
      .from('food_drink_categories')
      .select('count(*)')
      .single();
      
    console.log('🔍 DEBUG: Connection test result:', { testData, testError });

    // Fetch categories
    const { data: categories, error: categoriesError } = await supabase
      .from('food_drink_categories')
      .select('*')
      .order('display_order', { ascending: true });

    console.log('🔍 DEBUG: Categories query result:', { 
      count: categories?.length || 0, 
      error: categoriesError,
      categories: categories?.slice(0, 3) // Just first 3 for debug
    });

    // Fetch items
    const { data: items, error: itemsError } = await supabase
      .from('food_drink_items')
      .select('*')
      .limit(10);

    console.log('🔍 DEBUG: Items query result:', { 
      count: items?.length || 0, 
      error: itemsError,
      items: items?.slice(0, 3) // Just first 3 for debug
    });

    return NextResponse.json({
      connection: testError ? 'Failed' : 'Success',
      categories: {
        count: categories?.length || 0,
        error: categoriesError?.message || null,
        sample: categories?.slice(0, 3) || []
      },
      items: {
        count: items?.length || 0,
        error: itemsError?.message || null,
        sample: items?.slice(0, 3) || []
      }
    });

  } catch (error) {
    console.error('🔍 DEBUG: Error in menu debug:', error);
    return NextResponse.json(
      { 
        error: 'Debug failed', 
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : null
      },
      { status: 500 }
    );
  }
}
