import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/database.types';

/**
 * Enhanced database health check API endpoint
 * Verifies database connection and table accessibility
 * Provides detailed diagnostics for troubleshooting
 */
export async function GET() {
  try {
    // Create server-side Supabase client
    // FIX: Using await with cookies() as per Next.js warnings
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient<Database>({
      cookies: () => cookieStore,
    });
    
    // Test database connection and collect diagnostics
    const diagnostics = {
      ordersTable: { success: false, error: null, latency: 0, count: 0 },
      tablesTable: { success: false, error: null, latency: 0, count: 0 },
      orderItemsTable: { success: false, error: null, latency: 0, count: 0 },
      environment: {
        nextVersion: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || 'unknown',
        nodeEnv: process.env.NODE_ENV || 'unknown'
      }
    };
    
    // Test orders table
    let start = Date.now();
    const ordersResult = await supabase
      .from('orders')
      .select('count')
      .limit(1)
      .catch(err => ({ data: null, error: err }));
    
    diagnostics.ordersTable.latency = Date.now() - start;
    diagnostics.ordersTable.success = !ordersResult.error;
    
    if (ordersResult.error) {
      diagnostics.ordersTable.error = {
        message: ordersResult.error.message,
        code: ordersResult.error.code,
        details: ordersResult.error.details
      };
    } else {
      diagnostics.ordersTable.count = ordersResult.data?.length || 0;
    }
    
    // Test tables table
    start = Date.now();
    const tablesResult = await supabase
      .from('tables')
      .select('count')
      .limit(1)
      .catch(err => ({ data: null, error: err }));
    
    diagnostics.tablesTable.latency = Date.now() - start;
    diagnostics.tablesTable.success = !tablesResult.error;
    
    if (tablesResult.error) {
      diagnostics.tablesTable.error = {
        message: tablesResult.error.message,
        code: tablesResult.error.code,
        details: tablesResult.error.details
      };
    } else {
      diagnostics.tablesTable.count = tablesResult.data?.length || 0;
    }
    
    // Test order_items table
    start = Date.now();
    const orderItemsResult = await supabase
      .from('order_items')
      .select('count')
      .limit(1)
      .catch(err => ({ data: null, error: err }));
    
    diagnostics.orderItemsTable.latency = Date.now() - start;
    diagnostics.orderItemsTable.success = !orderItemsResult.error;
    
    if (orderItemsResult.error) {
      diagnostics.orderItemsTable.error = {
        message: orderItemsResult.error.message,
        code: orderItemsResult.error.code,
        details: orderItemsResult.error.details
      };
    } else {
      diagnostics.orderItemsTable.count = orderItemsResult.data?.length || 0;
    }
    
    // Overall health status
    const isHealthy = diagnostics.ordersTable.success || 
                      diagnostics.tablesTable.success || 
                      diagnostics.orderItemsTable.success;
    
    const status = isHealthy ? 200 : 500;
    
    return NextResponse.json({
      healthy: isHealthy,
      diagnostics,
      timestamp: new Date().toISOString(),
      troubleshooting: isHealthy ? null : {
        suggestions: [
          "Check Supabase connection string in environment variables",
          "Verify table permissions for the service role",
          "Ensure database tables exist with expected schema",
          "Check for network connectivity issues",
          "Verify middleware is not blocking API requests"
        ]
      }
    }, { status });
    
  } catch (err: any) {
    console.error('Server error during health check:', err);
    return NextResponse.json({
      healthy: false,
      error: err.message,
      errorType: 'SERVER_ERROR',
      details: 'Unexpected server error during database health check',
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    }, { status: 500 });
  }
}