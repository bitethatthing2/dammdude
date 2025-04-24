import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { createClient } from '@supabase/supabase-js';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  try {
    // Use a more reliable initialization approach with proper error handling
    const serviceAccount = {
      projectId: "new1-f04b3",
      clientEmail: "firebase-adminsdk-fbsvc@new1-f04b3.iam.gserviceaccount.com",
      privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC5IhIspbL79g6E\nIEyH5iyk0kDHDnlBoc/ZHKa849tgJCCQcaxnZXoPsUvlqoqb9vLWaM9F5ds0yj/+\nJ0zwwv0Oz5Nx1ylU0vndhrx4LUHI8NrVCP3ob0QzH5ziLhEE3d8BfUcHC9/ZMXK1\nOj+qwr68J9EyiJH/xVpPaGZuDXGKmWzuryr0RlLaJSRw+GYi9YsdVTiyijyANzdI\nXXtU1fSfOkuAfkJPLBJ2aNtvJnvP4haFTMdf6da1RzoBAR8GZZERTumxlky0BBIB\n76Xq+Kgw3K5nC8ktuNvjH/Is8RDW+hpfO97QTFy0ARlUKNBxhF/xE6rY8xcDf4NX\nO5v09p1JAgMBAAECggEACgC6RKlLS2vXCvKH0Avyu5EUqOyyRoaMqWlv5OLW1pH9\nJHDP5OJJvxFQTX9yb8zfABC3qkoqFucaoAvVj2ipraQvjkYW2JtxnrOJ+WBQnp/M\n4xfSSD3CzJRXsKzWhJHMW9M+BDZzCNQwI3SbPgm5robkObvBT7WFFKdKaYXWbauW\n13zw+RjSR6icgq+VjDixvcPldsnHTZbGRwc7xtZz6wGoObnIH/47WrNwrGOuRgAc\nFV2cEFDZn47Xe3jWBdZv5ckItVaVmT01PSZV2PsM9EQkcz+S7kjsOJkyyYwQmmta\n+x2Bwf6hgc3BA7Fqy6U4ofWN32QtbWjV9RYdIZyV1QKBgQDzoMT/u7WoqbhYvY/N\nTfgekrdCPG9aWWwsQ+sgsg8YY1TpNIRMt8Vo+aYOSzTOqCiycYUnwx5U1KJlL+II\nVAcU3SQqI19/IiBksMz2FnY/OfFHOAMVVq2St9Ajk8GwtTGthL8AN3+DETFK6xOP\n1bJpJ2kHDPHhP5sdotBGUVCd8wKBgQDCiNoDdJXqR+3U7ua8j2x5KPitdxmA0InX\nfA9AGRvTYXLHMbuBpRyImPiif4R2KTb2g7dTav1AWQ4p4vSdeuKESOu+J61fedQr\nzxsYkGn6i7KZVDE/YaViXOBe/eduH1PtbxfPFtszZWnh02YwQ+g2CJ9yNK+HWEv4\niyIVPk9a0wKBgFVGEY4dirEVbsQI3buTreQtoF1bv/IU2KsJvtP73xK/OepCiog7\nzqo2r6vTIRGwhEYpO902C3jP0GOwheI6XxwrZ0wkg3mBXWtBAwyjwhHRWyV9cn7W\njvyKwByjzCjo0xGUJDKUOlqK+wDpFTjEKKVruPRR0Jvx4n5WDaZ/McOHAoGBAKX/\nRyGZs28mD7EaZrPSIvrEVmcW8SE1UdoZl53XjyHxzpJhQqJfNRjuh4OKEosNokP6\no03ARvhIxchCTP+wY2gEHX22t7934u+7G2D7oiNUX4NtD1UJSqnDnQYR3RDgFKrP\nmF5zH3sc95vm2xUmbRjmhMBcasewNauRdfTwpaBXAoGAW7vbVvvaqFPPgF0mfKAC\nzwh/ybzIj2fUShvARIoAM4xKRKF4JkIDaMfiomtYmEGFlAj6h5KTcPaTey7Lu6gi\nylhrJ5AdbW+DWMQ2u8p7mt42CT7UB69PjE6KzSURi2+8AkM0qR/EDFo8FzUX1qOx\nzW7x3wFzhxLjInO6XcMxKSo=\n-----END PRIVATE KEY-----\n",
    };

    // Check that all required fields are present
    if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
      throw new Error('Missing required Firebase Admin SDK credentials');
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
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
