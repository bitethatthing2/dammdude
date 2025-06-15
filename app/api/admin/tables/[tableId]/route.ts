import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

/**
 * API endpoint for fetching a single table by ID
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ tableId: string }> }
) {
  try {
    const { tableId } = await params;
    
    if (!tableId) {
      return NextResponse.json(
        { error: 'Table ID is required' },
        { status: 400 }
      );
    }
    
    // Create server-side Supabase client using our custom function
    const supabase = await createServerClient();
    
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
    
  } catch (err: unknown) {
    console.error('Unexpected error in table API:', err);
    
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    
    return NextResponse.json(
      { error: 'Unexpected error', details: errorMessage },
      { status: 500 }
    );
  }
}
