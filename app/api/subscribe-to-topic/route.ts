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
      
      // Fallback for Firebase configuration if environment variables are missing
      const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      
      if (!projectId) {
        throw new Error('Firebase Project ID not found in environment variables');
      }
      
      let serviceAccount: ServiceAccount;
      
      // If we have all the required credentials, use them
      if (encodedPrivateKey && clientEmail) {
        // Decode the Base64 key
        let decodedPrivateKey: string;
        try {
          decodedPrivateKey = Buffer.from(encodedPrivateKey, 'base64').toString('utf8');
        } catch (error) {
          console.error('Failed to decode Base64 private key:', error);
          throw new Error('Failed to decode Firebase private key');
        }
        
        serviceAccount = {
          projectId,
          clientEmail,
          privateKey: decodedPrivateKey,
        };
        
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
      } 
      // Fallback to application default credentials when not all credentials are available
      else {
        console.warn('Using application default credentials for Firebase Admin');
        admin.initializeApp({
          projectId,
        });
      }
      
      console.log('Firebase Admin initialized successfully');
    } catch (error) {
      console.error('Firebase Admin initialization error:', error);
      throw new Error(`Failed to initialize Firebase Admin: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  return admin;
}

/**
 * API route to subscribe a device token to a topic
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body with error handling
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      );
    }
    
    const { token, topic }: SubscribeRequestBody = body;
    
    // Validate required fields
    if (!token || !topic) {
      console.error('Missing required fields:', { token: !!token, topic: !!topic });
      return NextResponse.json(
        { error: 'Missing required fields: token and topic' },
        { status: 400 }
      );
    }
    
    // Log token details for debugging (without exposing the full token)
    console.log('Subscribe request:', { 
      topic, 
      tokenStart: token.substring(0, 6) + '...',
      tokenLength: token.length 
    });
    
    // Initialize Firebase Admin SDK with error handling
    let firebaseApp;
    try {
      firebaseApp = initializeFirebaseAdmin();
    } catch (firebaseInitError) {
      console.error('Firebase initialization failed:', firebaseInitError);
      // Return a 200 response to prevent client from continuously retrying
      return NextResponse.json(
        { 
          success: false, 
          message: 'Firebase initialization failed, will not retry',
          error: 'Server configuration issue'
        },
        { status: 200 }
      );
    }
    
    // Process token format
    const tokenToUse = Array.isArray(token) ? token[0] : token;
    
    // Attempt to subscribe to topic with retry logic
    let subscribeSuccess = false;
    let subscribeError = null;
    let subscribeResponse = null;
    
    // Try subscription up to 2 times
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const messaging = firebaseApp.messaging();
        subscribeResponse = await messaging.subscribeToTopic(tokenToUse, topic);
        subscribeSuccess = true;
        console.log(`Topic subscription successful (attempt ${attempt}):`, subscribeResponse);
        break;
      } catch (error) {
        subscribeError = error;
        console.error(`Topic subscription failed (attempt ${attempt}):`, error);
        
        // Wait before retry (only if this isn't the last attempt)
        if (attempt < 2) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    
    // Initialize Supabase client with fallback values
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dzvvjgmnlcmgrsnyfqnw.supabase.co';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6dnZqZ21ubGNtZ3JzbnlmcW53Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczOTQxNTk5NCwiZXhwIjoyMDU0OTkxOTk0fQ.6Hg7cNG6iDY3iOT8m5WjaoDQBINvsu1YH95TN-RVUk0';

    // Attempt to save subscription to database (but don't fail if it doesn't work)
    let dbSaveSuccess = false;
    try {
      if (supabaseUrl && supabaseServiceKey) {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        // Save the subscription to the database
        const { error } = await supabase
          .from('topic_subscriptions')
          .upsert({
            token: tokenToUse,
            topic,
            created_at: new Date().toISOString(),
            success: subscribeSuccess
          });
            
        if (error) {
          console.error('Error saving subscription to database:', error);
        } else {
          console.log('Subscription saved to database');
          dbSaveSuccess = true;
        }
      } else {
        console.warn('Skipping database save due to missing Supabase credentials');
      }
    } catch (dbError) {
      console.error('Database operation failed:', dbError);
      // Continue even if database save fails
    }
    
    // Return appropriate response based on subscription result
    if (subscribeSuccess) {
      return NextResponse.json({
        success: true,
        message: `Successfully subscribed to topic: ${topic}`,
        results: subscribeResponse,
        dbSaved: dbSaveSuccess
      });
    } else {
      // Return a 200 status so the client knows we processed the request
      // but couldn't complete the subscription
      return NextResponse.json({
        success: false,
        message: `Failed to subscribe to topic: ${topic}`,
        error: subscribeError instanceof Error ? subscribeError.message : String(subscribeError),
        dbSaved: false
      }, { status: 200 });
    }
  } catch (error) {
    console.error('Unexpected error in subscribe API:', error);
    
    // Return a 200 response with error details to prevent continuous retries
    return NextResponse.json({
      success: false,
      message: 'Error processing subscription request',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 200 });
  }
}
