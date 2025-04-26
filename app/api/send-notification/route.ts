import { NextRequest, NextResponse } from 'next/server';
import { SendNotificationRequest } from '@/lib/types/api';
import admin from 'firebase-admin';
import { createClient } from '@supabase/supabase-js';
import { initializeFirebaseAdmin, isFirebaseAdminInitialized, simulateNotificationResponse, getAdminMessaging } from '@/lib/firebase/admin';

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

// Helper function to remove invalid tokens from the database
async function removeInvalidToken(token: string, supabaseAdmin: DatabaseClient): Promise<boolean> {
  if (!token) return false;

  console.log(`Removing invalid token: ${token.substring(0, 10)}...`);
  
  try {
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
    console.log('Send notification API called');
    
    // Initialize Firebase Admin SDK
    const adminApp = initializeFirebaseAdmin();
    
    // Log initialization status for debugging
    console.log('Firebase Admin initialization status:', {
      initialized: isFirebaseAdminInitialized(),
      hasApp: !!adminApp,
      environment: process.env.NODE_ENV
    });

    // Assume the request body might have the notification nested or flat
    const rawBody = await request.json();
    console.log('Raw notification request body:', JSON.stringify(rawBody, null, 2));
    
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

    // Check if we should simulate success (development mode or failed initialization)
    const shouldSimulate = process.env.NODE_ENV === 'development' || !isFirebaseAdminInitialized();
    
    // In development mode or if Firebase failed to initialize, return a simulated success response
    if (shouldSimulate) {
      console.log(`Simulating notification delivery (${!isFirebaseAdminInitialized() ? 'failed initialization' : 'development mode'})`);
      
      // Use our simulation helper
      const target = body.token ? 'device token' : body.topic ? `topic: ${body.topic}` : body.sendToAll ? 'all devices' : 'unknown';
      return NextResponse.json(simulateNotificationResponse(body.title, body.body, target));
    }

    // Get messaging service - if null, simulate response
    const messaging = getAdminMessaging();
    if (!messaging) {
      console.error('Failed to get messaging service, simulating success response');
      return NextResponse.json(simulateNotificationResponse(body.title, body.body, 'fallback'));
    }

    // Connect to Supabase Admin to manage tokens
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase credentials for token management');
      // Continue without token management capabilities
    }
    
    const supabaseAdmin = createClient(
      supabaseUrl,
      supabaseServiceKey
    );

    let messageIds: string[] = [];
    let invalidTokensRemoved = 0;
    let tokenCount = 0;

    // Default icons for different platforms
    const webIcon = body.icon || '/icons/logo.png';
    const androidIcon = '/icons/android-lil-icon-white.png';
    const androidBigIcon = '/icons/android-big-icon.png';
    
    // Create the notification payload separately to avoid type issues
    const notificationPayload = {
      title: body.title,
      body: body.body,
      imageUrl: body.image || androidBigIcon // Use image or fall back to big icon
    };

    // Create the data payload separately - ensure all values are strings
    const dataPayload: Record<string, string> = {
      title: body.title,
      body: body.body,
      click_action: "FLUTTER_NOTIFICATION_CLICK"
    };
    
    // Add optional fields to data payload if they exist
    if (body.link) dataPayload.link = body.link;
    if (body.image) dataPayload.image = body.image;
    
    // Add any custom data fields
    if (body.data) {
      Object.entries(body.data).forEach(([key, value]) => {
        dataPayload[key] = String(value); // Ensure all values are strings
      });
    }

    // Create the webpush configuration separately
    const webPushConfig = {
      notification: {
        icon: webIcon,
        image: body.image,
        badge: '/icons/badge-icon.png',
        vibrate: [200, 100, 200],
        actions: [
          {
            action: 'open_url',
            title: 'View',
            icon: webIcon
          }
        ]
      },
      fcmOptions: {
        link: body.link
      }
    };
    
    // Create Android specific configuration with proper Firebase typing
    const androidConfig: admin.messaging.AndroidConfig = {
      priority: 'high', // Using literal string with allowed values
      notification: {
        icon: androidIcon,
        color: '#FF3E2F', // Brand color
        sound: 'default',
        clickAction: "FLUTTER_NOTIFICATION_CLICK",
        channelId: "high_importance_channel"
      }
    };

    // Handle different targeting options
    if (body.sendToAll) {
      console.log('Sending to all devices (querying database for tokens)');
      
      try {
        // Get all FCM tokens
        const { data: tokensData, error } = await supabaseAdmin
          .from('fcm_tokens')
          .select('token')
          .order('created_at', { ascending: false })
          .limit(1000);
  
        if (error) {
          console.error('Error fetching tokens:', error);
          return NextResponse.json({ error: 'Failed to fetch tokens' }, { status: 500 });
        }
  
        if (!tokensData || tokensData.length === 0) {
          console.warn('No FCM tokens found');
          return NextResponse.json({ 
            success: true, 
            warning: 'No registered devices found', 
            tokenCount: 0,
            recipients: 0 
          });
        }
  
        // Extract the tokens
        const tokens = tokensData.map((t: { token: string }) => t.token);
        tokenCount = tokens.length;
  
        console.log(`Sending to ${tokens.length} devices`);
  
        // Send to multiple devices
        const response = await messaging.sendEachForMulticast({
          tokens,
          notification: notificationPayload,
          data: dataPayload,
          webpush: webPushConfig,
          android: androidConfig
        });
  
        // Handle response
        console.log('Multicast send results:', {
          successCount: response.successCount,
          failureCount: response.failureCount,
          responses: response.responses.length
        });
  
        // Handle token cleanup for failures
        if (response.failureCount > 0) {
          // Create an array of promises for removing tokens
          const failedTokenPromises = [] as Promise<boolean | null>[];
          
          response.responses.forEach((resp, idx) => {
            if (!resp.success && isInvalidTokenError(resp.error)) {
              // Remove invalid token and track for reporting
              failedTokenPromises.push(
                removeInvalidToken(tokens[idx], supabaseAdmin).then(success => {
                  if (success) invalidTokensRemoved++;
                  return null;
                })
              );
            }
          });
  
          await Promise.all(failedTokenPromises);
        }
  
        // Set message IDs for response - this ensures we only include defined strings
        messageIds = response.responses
          .filter(resp => resp.success && resp.messageId)
          .map(resp => resp.messageId!)
          .filter(id => typeof id === 'string') as string[];
  
        return NextResponse.json({
          success: true,
          messageIds,
          recipients: response.successCount,
          failures: response.failureCount,
          invalidTokensRemoved,
          totalTokens: tokenCount
        });
      } catch (error) {
        console.error('Error sending multicast notification:', error);
        return NextResponse.json(
          { 
            error: 'Failed to send notification to devices',
            errorDetails: error instanceof Error ? error.message : String(error)
          }, 
          { status: 500 }
        );
      }
    } else if (body.topic) {
      console.log(`Sending to topic: ${body.topic}`);

      try {
        // Send to topic
        const response = await messaging.send({
          topic: body.topic,
          notification: notificationPayload,
          data: dataPayload,
          webpush: webPushConfig,
          android: androidConfig
        });

        console.log(`Successfully sent message to topic: ${response}`);
        return NextResponse.json({
          success: true,
          messageIds: [response],
          topic: body.topic
        });
      } catch (error) {
        console.error(`Error sending to topic ${body.topic}:`, error);
        return NextResponse.json(
          { 
            error: `Failed to send to topic: ${body.topic}`,
            errorDetails: error instanceof Error ? error.message : String(error)
          }, 
          { status: 500 }
        );
      }
    } else if (body.token) {
      console.log(`Sending to individual token: ${body.token.substring(0, 10)}...`);

      try {
        // Send to a specific device
        const response = await messaging.send({
          token: body.token,
          notification: notificationPayload,
          data: dataPayload,
          webpush: webPushConfig,
          android: androidConfig
        });
        
        console.log(`Successfully sent message to token: ${response}`);
        
        return NextResponse.json({
          success: true,
          messageIds: [response],
          recipients: 1
        });
      } catch (error) {
        console.error('Error sending to individual token:', error);
        
        // Check if token is invalid and should be removed
        let tokenRemoved = false;
        if (isInvalidTokenError(error)) {
          tokenRemoved = await removeInvalidToken(body.token, supabaseAdmin);
        }
        
        return NextResponse.json(
          { 
            error: 'Failed to send notification',
            errorDetails: error instanceof Error ? error.message : String(error),
            tokenRemoved
          }, 
          { status: 500 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Invalid request: Must specify token, topic, or sendToAll' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Unexpected error in send notification API:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        errorDetails: error instanceof Error ? error.message : String(error)
      }, 
      { status: 500 }
    );
  }
}
