import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { Database } from '@/lib/database.types';

export async function GET() {
  try {
    console.log("[TEST API] Starting database test");
    
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({
      cookies: () => cookieStore,
      options: {
        global: {
          headers: {
            // Add any necessary headers for authentication
          }
        }
      }
    });
    
    // Test 1: Simple query to check basic connectivity
    console.log("[TEST API] Running simple query test");
    const { data: testData, error: testError } = await supabase
      .from('orders')
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
      .from('tables')
      .select('id')
      .limit(1);
      
    // Test 3: Check order_items table
    console.log("[TEST API] Checking order_items table");
    const { data: orderItemsData, error: orderItemsError } = await supabase
      .from('order_items')
      .select('id')
      .limit(1);

    // Test 4: Try different query approach for orders
    console.log("[TEST API] Trying alternative orders query");
    const { data: altOrdersData, error: altOrdersError } = await supabase.rpc(
      'get_orders',
      { status_filter: ['pending', 'ready'] }
    ).catch(err => {
      return { data: null, error: { message: `RPC not found: ${err.message}` } };
    });
    
    // Return all test results
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      tests: {
        basicQueryResult: {
          success: !testError,
          rowCount: testData?.length || 0,
          error: testError?.message || null
        },
        tablesQuery: {
          success: !tableError,
          exists: (tableData?.length || 0) > 0,
          error: tableError?.message || null
        },
        orderItemsQuery: {
          success: !orderItemsError,
          exists: (orderItemsData?.length || 0) > 0,
          error: orderItemsError?.message || null
        },
        rpcQuery: {
          success: !altOrdersError,
          exists: altOrdersData !== null,
          error: altOrdersError?.message || null
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