import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    console.log("[TEST API] Starting database test");
    
    // Use our custom server client that handles cookies correctly
    const supabase = await createServerClient();
    
    // Test 1: Simple query to check basic connectivity
    console.log("[TEST API] Running simple query test");
    const { data: testData, error: testError } = await supabase
      .from('bartender_orders')
      .select('id, status, updated_at')  // Using updated_at instead of created_at
      .limit(1);
    
    if (testError) {
      console.error("[TEST API] Basic query failed:", testError);
      return NextResponse.json({
        success: false,
        error: testError.message,
        step: 'basic_query'
      }, { status: 500 });
    }
    
    // Test 2: Check foreign key constraints
    console.log("[TEST API] Checking foreign key constraints");
    const { data: tableData, error: tableError } = await supabase
      .from('restaurant_tables')
      .select('id')
      .limit(1);
      
    // Test 3: Check order_items table
    console.log("[TEST API] Checking order_items table");
    const { data: orderItemsData, error: orderItemsError } = await supabase
      .from('order_items')
      .select('id')
      .limit(1);

    // Test 4: Try simple query for orders with filters
    console.log("[TEST API] Trying filtered orders query");
    const { data: filteredOrdersData, error: filteredOrdersError } = await supabase
      .from('bartender_orders')
      .select('id, status, table_location')
      .in('status', ['pending', 'ready'])
      .limit(5);
    
    // Return all test results
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      tests: {
        basicQueryResult: {
          success: !testError,
          rowCount: testData?.length || 0,
          error: (testError as any)?.message || null
        },
        tablesQuery: {
          success: !tableError,
          exists: (tableData?.length || 0) > 0,
          error: (tableError as any)?.message || null
        },
        orderItemsQuery: {
          success: !orderItemsError,
          exists: (orderItemsData?.length || 0) > 0,
          error: (orderItemsError as any)?.message || null
        },
        filteredQuery: {
          success: !filteredOrdersError,
          rowCount: filteredOrdersData?.length || 0,
          error: filteredOrdersError?.message || null
        }
      },
      tables: {
        orders: {
          rowCount: testData?.length || 0
        },
        tables: {
          rowCount: tableData?.length || 0
        },
        orderItems: {
          rowCount: orderItemsData?.length || 0
        }
      }
    });
    
  } catch (err) {
    console.error("[TEST API] Critical error:", err);
    return NextResponse.json({
      success: false,
      error: err instanceof Error ? err.message : String(err),
      step: 'unexpected_error'
    }, { status: 500 });
  }
}
