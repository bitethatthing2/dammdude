import { NextResponse } from 'next/server';
import type { Order, Table } from '@/lib/database.types';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { OrderStatus } from '@/lib/types/order';

// Type for the selected order fields from our query
type OrderQueryResult = Pick<Order, 'id' | 'table_id' | 'status' | 'created_at'> & {
  total_price: number | null;
  user_notes: string | null;
};

// Type for table query result
type TableQueryResult = Pick<Table, 'id' | 'name'>;

/**
 * GET /api/admin/orders
 * Fetches orders with filtering by status and optional pagination
 */
export async function GET(request: Request) {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    
    // Get status filter values
    const statusParams = searchParams.getAll('status') as OrderStatus[];
    
    // Get pagination parameters
    const limit = Number(searchParams.get('limit')) || 50;
    const page = Number(searchParams.get('page')) || 1;
    const offset = (page - 1) * limit;
    
    // Get cookie store and create Supabase client with fixed async cookie handling
    const supabase = await createSupabaseServerClient();
    
    // SIMPLIFIED QUERY - Avoiding table joins until migration is applied
    // Using a simpler query structure for now to avoid foreign key errors
    let query = supabase.from('orders')
      .select(`
        id, 
        table_id,
        status, 
        created_at,
        total_price,
        user_notes
      `);
    
    // Add status filter if provided
    if (statusParams.length > 0) {
      query = query.in('status', statusParams);
    }
    
    // Add order by and pagination
    query = query
      .order('created_at', { ascending: false })
      .limit(limit)
      .range(offset, offset + limit - 1);
    
    // Execute query
    const { data, error, count } = await query;
    
    // Handle query errors
    if (error) {
      console.error('Database query failed:', error);
      
      return NextResponse.json({
        error: 'Database query failed',
        details: error.message,
        code: error.code
      }, { status: 500 });
    }
    
    // Fetch table names separately to avoid join issues
    let tableNamesMap: Record<string, string> = {};
    if (data && data.length > 0) {
      const tableIds = Array.from(new Set(data.map((order: OrderQueryResult) => order.table_id)));
      
      try {
        const { data: tableData } = await supabase
          .from('tables')
          .select('id, name')
          .in('id', tableIds);
          
        if (tableData) {
          tableNamesMap = tableData.reduce((acc: Record<string, string>, table: TableQueryResult) => {
            acc[table.id] = table.name;
            return acc;
          }, {});
        }
      } catch (tableError) {
        console.error('Error fetching table names:', tableError);
        // Continue without table names if there's an error
      }
    }

    // Format orders with table name (from map or fallback) and empty items array for now
    const formattedOrders = data?.map((order: OrderQueryResult) => ({
      id: order.id,
      table_id: order.table_id,
      table_name: tableNamesMap[order.table_id] || `Table ${order.table_id}`,
      status: order.status,
      created_at: order.created_at,
      updated_at: order.created_at, // Use created_at since updated_at isn't selected
      total_amount: order.total_price,
      notes: order.user_notes,
      items: [] // Simplified until order_items relationship is fixed
    })) || [];
    
    // Return formatted response
    return NextResponse.json({ 
      orders: formattedOrders,
      count: count || formattedOrders.length,
      pagination: {
        page,
        limit,
        total: count
      }
    });
    
  } catch (err) {
    // Log and return unexpected errors
    console.error('Unexpected server error:', err);
    
    return NextResponse.json({
      error: 'Unexpected server error',
      details: err instanceof Error ? err.message : String(err)
    }, { status: 500 });
  }
}
