import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { Database } from '@/lib/database.types';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    console.log("[API DEBUG] Starting orders API request");
    
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    
    // Get all status values, not just one
    const statusParams = searchParams.getAll('status');
    console.log("[API DEBUG] Status parameters:", statusParams);
    
    // Use the correct cookie store
    const cookieStore = cookies();
    console.log("[API DEBUG] Cookie store created");
    
    // Use our custom server client that properly handles cookies
    const supabase = createSupabaseServerClient(cookieStore);
    console.log("[API DEBUG] Supabase client created");
    console.log("[API DEBUG] Supabase client created");
    
    // SIMPLIFIED QUERY - avoiding table joins due to relationship error
    console.log("[API DEBUG] Fetching orders with separate queries to avoid table join issues...");
    
    // Start with a minimal query to test if it works - no table joins
    // Error fix: changed created_at to updated_at since that's the actual column name
    // Additional fix: Only query the orders table without joining tables
    // Further fix: Removed 'customer_notes' column that doesn't exist in the database
    let query = supabase.from('orders').select(`
      id, 
      status, 
      updated_at, 
      total_amount,
      table_id
    `);
    
    // Add filters only if needed
    if (statusParams.length > 0) {
      query = query.in('status', statusParams);
      console.log("[API DEBUG] Added status filter:", statusParams);
    }
    
    // Remove pagination for now to simplify
    // Error fix: changed created_at to updated_at in the order clause
    query = query.order('updated_at', { ascending: false }).limit(10);
    
    // Execute the simplified query
    console.log("[API DEBUG] Executing query...");
    const { data, error } = await query;
    
    // Handle errors with detailed logging
    if (error) {
      console.error('[API ERROR] Supabase error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      
      return NextResponse.json({
        error: 'Database query failed',
        details: error.message,
        code: error.code
      }, { status: 500 });
    }
    
    // Verify data exists
    console.log("[API DEBUG] Query successful, row count:", data?.length || 0);
    
    // If needed, we could fetch table information separately here
    // but for now we're keeping queries simple to avoid relationship errors
    /*
    if (data && data.length > 0) {
      // Get unique table IDs
      const tableIds = [...new Set(data.map(order => order.table_id))];
      
      // Fetch table data separately
      const { data: tableData } = await supabase
        .from('tables')
        .select('id, name')
        .in('id', tableIds);
        
      // Create a lookup map
      const tableLookup = tableData?.reduce((map, table) => {
        map[table.id] = table;
        return map;
      }, {}) || {};
      
      // Enhance orders with table information
      data = data.map(order => ({
        ...order,
        table_name: tableLookup[order.table_id]?.name || `Table ${order.table_id}`
      }));
    }
    */
    
    // Return simplified data
    return NextResponse.json({ 
      orders: data || [],
      count: data?.length || 0,
      debug: { statusParams }
    });
    
  } catch (err) {
    // Catch and log any unexpected errors
    console.error('[API CRITICAL ERROR]', err);
    return NextResponse.json({
      error: 'Unexpected server error',
      details: err instanceof Error ? err.message : String(err)
    }, { status: 500 });
  }
}