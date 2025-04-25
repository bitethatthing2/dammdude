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
    
    // First check if the token already exists
    const { data: existingToken, error: checkError } = await supabaseAdmin
      .from('fcm_tokens')
      .select('id')
      .eq('token', token)
      .maybeSingle();
    
    if (checkError) {
      console.error('Error checking for existing token:', checkError);
      return NextResponse.json(
        { error: 'Database query failed', details: checkError.message },
        { status: 500 }
      );
    }
    
    let result;
    
    if (existingToken) {
      // Token exists, update the last_updated timestamp
      console.log('Token already exists, updating timestamp');
      result = await supabaseAdmin
        .from('fcm_tokens')
        .update({ last_updated: new Date().toISOString() })
        .eq('id', existingToken.id);
    } else {
      // Token doesn't exist, insert it
      console.log('Inserting new FCM token');
      result = await supabaseAdmin
        .from('fcm_tokens')
        .insert([
          {
            token,
            created_at: new Date().toISOString(),
            last_updated: new Date().toISOString()
          }
        ]);
    }
    
    if (result.error) {
      console.error('Error storing FCM token:', result.error);
      return NextResponse.json(
        { error: 'Failed to store token', details: result.error.message },
        { status: 500 }
      );
    }
    
    console.log('FCM token stored successfully');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing FCM token request:', error);
    return NextResponse.json(
      { error: `Error processing request: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}
