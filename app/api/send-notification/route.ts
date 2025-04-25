import { NextRequest, NextResponse } from 'next/server';
import { SendNotificationRequest } from '@/lib/types/api';
import admin from 'firebase-admin';
import { createClient } from '@supabase/supabase-js';

// Define a type for our Supabase client operations
interface DatabaseClient {
  from: (table: string) => {
    delete: () => {
      eq: (column: string, value: string) => Promise<{ error: Error | null }>;
    };
    select: (column: string) => {
      order: (column: string, options: { ascending: boolean }) => {
        limit: (count: number) => Promise<{ data: Array<{ token: string }> | null; error: Error | null }>;
      };
    };
  };
}

// Helper function to initialize Firebase Admin SDK
function initializeFirebaseAdmin() {
  if (!admin.apps.length) {
    try {
      // Get the Base64 encoded key from environment variables
      const encodedPrivateKey = process.env.FIREBASE_PRIVATE_KEY;

      // Decode the Base64 key
      let decodedPrivateKey: string | undefined;
      if (encodedPrivateKey) {
        try {
          decodedPrivateKey = Buffer.from(encodedPrivateKey, 'base64').toString('utf8');
        } catch (error) {
          console.error('Failed to decode Base64 private key:', error);
          throw new Error('Failed to decode Base64 private key');
        }
      }

      // Construct the service account object with the decoded key
      const serviceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: decodedPrivateKey,
      };

      // Check that all required fields are present
      if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
        console.error('Missing required Firebase Admin SDK credentials');
        throw new Error('Missing required Firebase Admin SDK credentials');
      }

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
      });
    } catch (error) {
      console.error('Firebase Admin initialization error:', error);
      throw new Error('Failed to initialize Firebase Admin');
    }
  }
}

/**
 * Helper function to remove invalid tokens from the database
 */
async function removeInvalidToken(token: string, supabaseAdmin: DatabaseClient) {
  try {
    console.log(`Removing invalid FCM token from database: ${token.substring(0, 10)}...`);
    
    // Remove from fcm_tokens table
    const { error: tokenError } = await supabaseAdmin
      .from('fcm_tokens')
      .delete()
      .eq('token', token);
      
    if (tokenError) {
      console.error(`Error removing token from fcm_tokens: ${tokenError.message}`);
      return false;
    }
    
    // Remove from topic_subscriptions table
    const { error: subscriptionError } = await supabaseAdmin
      .from('topic_subscriptions')
      .delete()
      .eq('token', token);
      
    if (subscriptionError) {
      console.error(`Error removing token from topic_subscriptions: ${subscriptionError.message}`);
      return false;
    }
    
    console.log(`Successfully removed invalid token: ${token.substring(0, 10)}...`);
    return true;
  } catch (error) {
    console.error(`Error removing invalid token: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

/**
 * Check if the error is due to an invalid token
 */
function isInvalidTokenError(error: any): boolean {
  const errorMessage = String(error);
  return (
    errorMessage.includes('messaging/registration-token-not-registered') ||
    errorMessage.includes('Requested entity was not found')
  );
}

/**
 * API route to send push notifications using Firebase Admin SDK
 */
export async function POST(request: NextRequest) {
  try {
    // Initialize Firebase Admin SDK
    initializeFirebaseAdmin();

    // Assume the request body might have the notification nested or flat
    const rawBody = await request.json();
    const notificationData = rawBody.notification || rawBody; // Use nested or top-level
    const body: SendNotificationRequest = {
      ...rawBody, // Keep other potential top-level fields like token, topic, sendToAll
      title: notificationData.title, // Get title from notification object or top-level
      body: notificationData.body,   // Get body from notification object or top-level
      icon: notificationData.icon, // Also handle icon and image if nested
      image: notificationData.image
    };

    console.log('Send notification API called with parsed data:', {
      title: body.title,
      body: body.body,
      hasToken: !!body.token,
      hasTopic: !!body.topic,
      sendToAll: !!body.sendToAll
    });

    // Validate required fields using the correctly parsed values
    if (!body.title || !body.body) {
      console.error('Missing required fields: title or body');
      return NextResponse.json(
        { error: 'Missing required fields: title and body' },
        { status: 400 }
      );
    }

    // Modified validation: if token or topic is provided, they should be valid
    if (body.token === '' || body.topic === '') {
      return NextResponse.json(
        { error: 'Token or topic must not be empty if provided' },
        { status: 400 }
      );
    }

    // Log the notification details for debugging
    console.log('Notification request:', {
      title: body.title,
      body: body.body,
      token: body.token ? '[TOKEN REDACTED]' : undefined,
      topic: body.topic,
      link: body.link,
      orderId: body.orderId
    });

    try {
      // Get Firebase messaging instance
      const messaging = admin.messaging();
      
      // Get Supabase client with service role for admin access
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.SUPABASE_SERVICE_ROLE_KEY || '',
        { auth: { persistSession: false } }
      ) as DatabaseClient;
      
      // Prepare notification message using correctly parsed values
      const baseMessage = {
        notification: {
          title: body.title,
          body: body.body,
          // Icon is a relative path within your app
          icon: '/images/about/icon-for-nav-light-screen.png',
          // Image URL if provided
          ...(body.image && { imageUrl: body.image }),
        },
        // Add Android-specific configuration
        android: {
          priority: "high" as const,
          notification: {
            // Small icon (drawable resource name only)
            icon: 'notification_icon',
            color: '#F65B0D',
            // Only include necessary fields
            channelId: 'default_channel',
          }
        },
        // Include data payload for additional parameters
        data: {
          ...(body.orderId && { orderId: body.orderId }),
          ...(body.link && { link: body.link }),
          ...(body.linkButtonText && { linkButtonText: body.linkButtonText }),
          ...(body.actionButton && { actionButton: body.actionButton }),
          ...(body.actionButtonText && { actionButtonText: body.actionButtonText }),
          // Add a timestamp
          timestamp: Date.now().toString(),
        },
      };
      
      let messageResponse;
      
      try {
        // Check what targets are provided
        if (body.token) {
          // Send to specific device (token)
          console.log(`Sending notification to token: [TOKEN REDACTED]`);
          messageResponse = await messaging.send({
            token: body.token,
            ...baseMessage,
          });
        } else if (body.topic) {
          // Send to topic
          console.log(`Sending notification to topic: ${body.topic}`);
          messageResponse = await messaging.send({
            topic: body.topic,
            ...baseMessage,
          });
        } else if (body.sendToAll) {
          // Send to the 'all_devices' topic
          console.log('Sending notification to all devices');
          messageResponse = await messaging.send({
            topic: 'all_devices',
            ...baseMessage,
          });
        } else {
          // No valid target
          throw new Error('No valid target specified. Please provide a token, topic, or set sendToAll.');
        }

        // Return success response with message ID
        return NextResponse.json({
          success: true,
          messageId: messageResponse,
        });
      } catch (error) {
        console.error('Error sending notification:', error);
        return NextResponse.json(
          { error: 'Error sending notification', details: String(error) },
          { status: 500 }
        );
      }
    } catch (error) {
      console.error('Error processing notification request:', error);
      return NextResponse.json(
        { error: 'Error processing notification request', details: String(error) },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error processing notification request:', error);
    return NextResponse.json(
      { error: 'Error processing notification request', details: String(error) },
      { status: 400 }
    );
  }
}
