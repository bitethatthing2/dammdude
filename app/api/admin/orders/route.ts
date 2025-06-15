import { NextResponse } from 'next/server';
import type { Database } from '@/lib/database.types';

type Order = Database['public']['Tables']['bartender_orders']['Row'];
type Table = Database['public']['Tables']['tables']['Row'];
import { createServerClient } from '@/lib/supabase/server';
import { OrderStatus } from '@/lib/types/order';

// Type for the selected order fields from our query
type OrderQueryResult = Pick<Order, 'id' | 'status' | 'created_at' | 'total_amount' | 'customer_notes' | 'table_location'>;

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
    const supabase = await createServerClient();
    
    // Query bartender_orders table with correct column names
    let query = supabase.from('bartender_orders')
      .select(`
        id,
        status, 
        created_at,
        total_amount,
        customer_notes,
        table_location
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
    
    // Format orders using actual column names from bartender_orders table
    const formattedOrders = data?.map((order: OrderQueryResult) => ({
      id: order.id,
      table_location: order.table_location,
      status: order.status,
      created_at: order.created_at,
      updated_at: order.created_at, // Use created_at since updated_at isn't selected
      total_amount: order.total_amount,
      notes: order.customer_notes,
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
