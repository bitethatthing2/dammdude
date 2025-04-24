import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { createClient } from '@supabase/supabase-js';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  try {
    // Use a more reliable initialization approach with proper error handling
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FCM_PROJECT_ID, // Make sure this is also set in your env
        // Use environment variables for sensitive credentials
        clientEmail: process.env.FCM_CLIENT_EMAIL,
        // IMPORTANT: Never hardcode private keys!
        // Set FCM_PRIVATE_KEY in your .env.local file
        // Ensure the key includes newline characters correctly, e.g., by replacing \n with actual newlines
        privateKey: process.env.FCM_PRIVATE_KEY?.replace(/\n/g, '\n'),
      }),
    });
    console.log('Firebase Admin initialized successfully in subscribe-to-topic');
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
    throw new Error('Failed to initialize Firebase Admin');
  }
}

// Initialize Supabase client using environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Check if Supabase is configured
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables are missing');
}

/**
 * API route to subscribe a device token to a topic
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, topic } = body;
    
    console.log('Subscribe to topic API called:', { topic, tokenLength: token?.length });
    
    // Validate required fields
    if (!token || !topic) {
      console.error('Missing required fields:', { token: !!token, topic: !!topic });
      return NextResponse.json(
        { error: 'Missing required fields: token and topic' },
        { status: 400 }
      );
    }
    
    // Log the subscription request
    console.log(`Subscribing token to topic: ${topic}`);
    
    try {
      // Get Firebase messaging instance
      const messaging = admin.messaging();
      
      // Log the token format to help debug
      console.log('Token format check:', {
        length: token.length,
        startsWith: token.substring(0, 10) + '...',
        isArray: Array.isArray(token)
      });
      
      // If token is an array, convert it to a single token
      const tokenToUse = Array.isArray(token) ? token[0] : token;
      
      // Subscribe the token to the topic
      const response = await messaging.subscribeToTopic(tokenToUse, topic);
      
      console.log('Subscription successful:', response);
      
      // Save the subscription to the database
      try {
        const { error } = await supabase
          .from('topic_subscriptions')
          .upsert({
            token: tokenToUse,
            topic,
            created_at: new Date().toISOString()
          });
          
        if (error) {
          console.error('Error saving subscription to database:', error);
        } else {
          console.log('Subscription saved to database');
        }
      } catch (dbError) {
        console.error('Database error:', dbError);
        // Continue even if database save fails
      }
      
      // Return success response
      return NextResponse.json({
        success: true,
        message: `Successfully subscribed to topic: ${topic}`,
        results: response
      });
    } catch (error) {
      console.error('Firebase messaging error:', error);
      return NextResponse.json(
        { 
          error: 'Failed to subscribe to topic',
          details: error instanceof Error ? error.message : String(error)
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error processing subscription request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
