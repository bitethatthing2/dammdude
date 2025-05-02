import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { Database } from '@/lib/database.types';

export async function GET(request: Request) {
  try {
    console.log("[API DEBUG] Starting orders API request");
    
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    
    // Get all status values, not just one
    const statusParams = searchParams.getAll('status');
    console.log("[API DEBUG] Status parameters:", statusParams);
    
    // Use async/await with cookies as required in Next.js 13+
    const cookieStore = cookies();
    console.log("[API DEBUG] Cookie store created");
    
    // Create server-side Supabase client with async cookies
    // Fix: Added proper typing and handling for Supabase authentication
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
    console.log("[API DEBUG] Supabase client created");
    
    // SIMPLIFIED QUERY - removing potential error sources
    console.log("[API DEBUG] Fetching orders with stripped down query...");
    
    // Start with a minimal query to test if it works
    // Error fix: changed created_at to updated_at since that's the actual column name
    let query = supabase.from('orders').select('id, status, updated_at, total_amount');
    
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