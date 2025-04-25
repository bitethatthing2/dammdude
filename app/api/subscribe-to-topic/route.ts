import { NextRequest, NextResponse } from 'next/server';
import * as admin from 'firebase-admin';
import { ServiceAccount } from 'firebase-admin';
import { createClient } from '@supabase/supabase-js';

// Define the structure for the expected request body
interface SubscribeRequestBody {
  token: string;
  topic: string;
}

// Helper function to initialize Firebase Admin SDK
function initializeFirebaseAdmin() {
  if (!admin.apps.length) {
    try {
      // Get the Base64 encoded key from environment variables
      const encodedPrivateKey = process.env.FIREBASE_PRIVATE_KEY;
      console.log('Attempting Firebase Init in subscribe-to-topic...'); // Add a log here

      // Decode the Base64 key
      let decodedPrivateKey: string | undefined;
      if (encodedPrivateKey) {
        try {
          decodedPrivateKey = Buffer.from(encodedPrivateKey, 'base64').toString('utf8');
        } catch (error) {
          console.error('Failed to decode Base64 private key in subscribe-to-topic:', error);
          throw new Error('Failed to decode Base64 private key in subscribe-to-topic');
        }
      } else {
        throw new Error('FIREBASE_PRIVATE_KEY environment variable not found.');
      }

      const serviceAccount: ServiceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: decodedPrivateKey,
      };

      // Check that all required fields are present before initializing
      if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
        console.error('Missing required Firebase Admin SDK credentials for initialization in subscribe-to-topic.');
        throw new Error('Missing required Firebase Admin SDK credentials');
      }

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('Firebase Admin initialized successfully in subscribe-to-topic.');
    } catch (error) {
      console.error('Firebase Admin initialization error during request (subscribe):', error);
      // Throw the error to be caught by the request handler
      throw new Error(`Failed to initialize Firebase Admin: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

/**
 * API route to subscribe a device token to a topic
 */
export async function POST(request: NextRequest) {
  try {
    // Initialize Firebase Admin SDK
    initializeFirebaseAdmin();

    const body = await request.json();
    const { token, topic }: SubscribeRequestBody = body;
    
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
      
      // Initialize Supabase client
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      // Log the values received from the environment
      console.log('DEBUG Runtime SUPABASE_URL:', supabaseUrl ? 'Exists' : 'MISSING');
      console.log('DEBUG Runtime SUPABASE_SERVICE_KEY:', supabaseServiceKey ? 'Exists (checking first few chars)' : 'MISSING');
      if (supabaseServiceKey) {
        console.log('DEBUG Runtime SERVICE_KEY Start:', supabaseServiceKey.substring(0, 5));
      }

      if (!supabaseUrl || !supabaseServiceKey) {
        console.error('Supabase URL or Service Key missing in environment variables.');
        throw new Error('Server configuration error: Supabase credentials missing.');
      }

      const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
