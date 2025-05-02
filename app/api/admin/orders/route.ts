import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { Database } from '@/lib/database.types';

// Define interfaces for type safety
interface RawOrder {
  id: string;
  table_id: string;
  status: string;
  created_at: string;
  total_amount?: number;
  total_price?: number;
  notes?: string;
  customer_notes?: string;
  estimated_time?: number;
  order_items?: any[];
  items?: any[];
  table?: {
    name?: string;
    section?: string;
  };
}

interface ProcessedOrder {
  id: string;
  table_id: string;
  table_name: string;
  status: string;
  created_at: string;
  total_amount: number;
  items: any[];
  notes: string | null;
  estimated_time: number | null;
}

/**
 * Admin orders API endpoint
 * Fetches orders with filtering, pagination and error handling
 */
export async function GET(request: Request) {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    
    // Get all status values, not just one
    const statusParams = searchParams.getAll('status');
    
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');
    const offset = (page - 1) * limit;
    
    // Create server-side Supabase client
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Build query with proper error handling
    let query = supabase
      .from('orders')
      .select('*, table:tables(name, section), order_items(*)');
    
    // Add filters - handle multiple status values
    if (statusParams.length > 0) {
      query = query.in('status', statusParams);
    }
    
    // Add pagination and ordering
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    // Execute query
    const { data, error, count } = await query;
    
    if (error) {
      console.error('Supabase error fetching orders:', error);
      
      return NextResponse.json({
        error: {
          message: 'Failed to fetch orders from database',
          code: 'SUPABASE_ERROR',
          details: error.message,
          hint: error.hint || 'Check database connection and permissions'
        }
      }, { status: 500 });
    }
    
    // Process orders to ensure consistent structure for the front-end
    const processedOrders = (data || []).map((order: RawOrder): ProcessedOrder => ({
      id: order.id,
      table_id: order.table_id,
      table_name: order.table?.name || `Table ${order.table_id}`,
      status: order.status,
      created_at: order.created_at,
      total_amount: order.total_amount || order.total_price || 0,
      items: order.order_items || order.items || [],
      notes: order.notes || order.customer_notes || null,
      estimated_time: order.estimated_time || null
    }));
    
    return NextResponse.json({ 
      orders: processedOrders,
      pagination: {
        total: count || processedOrders.length,
        page,
        limit
      }
    });
    
  } catch (err: any) {
    console.error('Server error fetching orders:', err);
    return NextResponse.json({
      error: 'Unexpected error when fetching orders',
      details: err.message
    }, { status: 500 });
  }
}