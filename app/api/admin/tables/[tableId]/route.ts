import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { Database } from '@/lib/database.types';

/**
 * API endpoint for fetching a single table by ID
 */
export async function GET(
  request: Request,
  { params }: { params: { tableId: string } }
) {
  try {
    const { tableId } = params;
    
    if (!tableId) {
      return NextResponse.json(
        { error: 'Table ID is required' },
        { status: 400 }
      );
    }
    
    // Create server-side Supabase client
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Fetch table data
    const { data, error } = await supabase
      .from('tables')
      .select('id, name, section, active')
      .eq('id', tableId)
      .single();
    
    if (error) {
      console.error('Error fetching table:', error);
      
      return NextResponse.json(
        { 
          error: {
            message: 'Failed to fetch table data',
            details: error.message
          }
        },
        { status: 500 }
      );
    }
    
    if (!data) {
      return NextResponse.json(
        { error: 'Table not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(data);
    
  } catch (err: any) {
    console.error('Unexpected error in table API:', err);
    
    return NextResponse.json(
      { error: 'Unexpected error', details: err.message },
      { status: 500 }
    );
  }
}