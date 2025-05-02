import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/database.types';

/**
 * Database health check API endpoint
 * Verifies database connection and basic functionality
 */
export async function GET() {
  try {
    // Create server-side Supabase client
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Test database connection
    const start = Date.now();
    const { data, error } = await supabase
      .from('orders')
      .select('count')
      .limit(1);
    
    const latency = Date.now() - start;
    
    if (error) {
      console.error('Database health check failed:', error);
      
      // Check for specific error types
      const errorType = error.code === '42P01' ? 'TABLE_NOT_FOUND' :
                       error.code === '28000' ? 'INVALID_CREDENTIALS' :
                       error.code === '3D000' ? 'DATABASE_NOT_FOUND' : 'UNKNOWN';
      
      return NextResponse.json({
        healthy: false,
        error: error.message,
        errorCode: error.code,
        errorType,
        details: `Failed to query orders table. Check Supabase connection, credentials, and table existence.`
      }, { status: 500 });
    }
    
    return NextResponse.json({
      healthy: true,
      latency: `${latency}ms`,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    console.error('Server error during health check:', err);
    return NextResponse.json({
      healthy: false,
      error: err.message,
      errorType: 'SERVER_ERROR',
      details: 'Unexpected server error during database health check'
    }, { status: 500 });
  }
}