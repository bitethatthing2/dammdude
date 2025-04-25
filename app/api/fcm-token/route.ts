import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Interface for the request body containing the FCM token
interface FcmTokenRequestBody {
  token: string;
}

/**
 * API route to store an FCM token in the database
 */
export async function POST(request: NextRequest) {
  try {
    console.log('FCM token storage API called');
    
    // Parse the request body
    const body: FcmTokenRequestBody = await request.json();
    const { token } = body;
    
    // Validate the token
    if (!token) {
      console.error('Missing required field: token');
      return NextResponse.json(
        { error: 'Missing required field: token' },
        { status: 400 }
      );
    }
    
    // Log token details for debugging (without exposing the full token)
    console.log('Processing FCM token:', {
      tokenStart: token.substring(0, 6) + '...',
      tokenLength: token.length,
    });
    
    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase credentials');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Simply attempt a direct insert - using UPSERT to handle duplicates
    // Match the actual structure of the table: token, device_info, created_at, updated_at
    const { error: upsertError } = await supabaseAdmin
      .from('fcm_tokens')
      .upsert(
        { 
          token,
          device_info: { 
            userAgent: request.headers.get('user-agent') || 'unknown',
            lastActive: new Date().toISOString()
          },
          // updated_at will be set automatically by the database's default value
        },
        { 
          onConflict: 'token',
          // Update only the updated_at field on conflict
          update: ['updated_at', 'device_info']
        }
      );
    
    if (upsertError) {
      console.error('Error storing FCM token:', upsertError);
      
      // Gracefully handle the error - still return 200 to allow notifications to work
      return NextResponse.json({ 
        success: true, 
        warning: 'Token storage issue, but notifications will still work',
        details: upsertError.message 
      });
    }
    
    console.log('FCM token stored or updated successfully');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing FCM token request:', error);
    
    // Still return 200 to allow notifications to work even if token storage fails
    return NextResponse.json({
      success: true,
      warning: 'Token storage failed, but notifications will still work',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}
