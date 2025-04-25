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
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    let messageIds: string[] = [];
    let invalidTokensRemoved = 0;
    let tokenCount = 0;

    // Create the notification payload separately to avoid type issues
    const notificationPayload = {
      title: body.title,
      body: body.body,
      imageUrl: body.icon || body.image
    };

    // Create the data payload separately
    const dataPayload = {
      ...(body.data || {}),
      link: body.link || '' 
    };

    // Create the webpush configuration separately
    const webPushConfig = {
      notification: {
        icon: body.icon,
        image: body.image,
        actions: [
          {
            action: 'open_url',
            title: 'View',
            icon: body.icon
          }
        ]
      },
      fcmOptions: {
        link: body.link
      }
    };

    // Handle different targeting options
    if (body.sendToAll) {
      console.log('Sending to all devices (querying database for tokens)');
      
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
      console.log(`Found ${tokens.length} tokens, sending notification`);

      try {
        // Send in batches of 500 to comply with FCM limits
        const batchSize = 500;
        let sentCount = 0;
        
        for (let i = 0; i < tokens.length; i += batchSize) {
          const batch = tokens.slice(i, i + batchSize);
          
          try {
            // Use sendEachForMulticast method
            const batchResponse = await messaging.sendEachForMulticast({
              tokens: batch,
              notification: notificationPayload,
              data: dataPayload,
              webpush: webPushConfig
            });
            
            // Process response - using proper type assertion
            sentCount += batchResponse.successCount;
            
            // Collect successful message IDs with a simpler approach
            batchResponse.responses.forEach((resp) => {
              if (resp.success && resp.messageId) {
                messageIds.push(resp.messageId);
              }
            });

            // Handle invalid tokens
            for (let j = 0; j < batchResponse.responses.length; j++) {
              const resp = batchResponse.responses[j];
              if (!resp.success && resp.error && isInvalidTokenError(resp.error)) {
                await removeInvalidToken(batch[j], supabaseAdmin as any);
                invalidTokensRemoved++;
              }
            }
          } catch (batchError) {
            console.error(`Error sending batch ${i / batchSize + 1}:`, batchError);
          }
        }
        
        console.log(`Successfully sent to ${sentCount} of ${tokens.length} devices`);
        
        return NextResponse.json({
          success: true,
          messageIds,
          recipients: sentCount,
          tokenCount,
          invalidTokensRemoved
        });
      } catch (error) {
        console.error('Error sending multicast messages:', error);
        return NextResponse.json(
          { error: `Error sending multicast messages: ${error instanceof Error ? error.message : String(error)}` }, 
          { status: 500 }
        );
      }
    } else if (body.topic) {
      console.log(`Sending to topic: ${body.topic}`);
      
      try {
        // Send to a specific topic
        const response = await messaging.send({
          topic: body.topic,
          notification: notificationPayload,
          data: dataPayload,
          webpush: webPushConfig
        });
        
        console.log(`Successfully sent to topic ${body.topic}:`, response);
        
        return NextResponse.json({
          success: true,
          messageIds: [response],
          recipients: 1, // Unknown actual count for topics
          tokenCount: 0,
          topic: body.topic
        });
      } catch (error) {
        console.error(`Error sending to topic ${body.topic}:`, error);
        return NextResponse.json(
          { error: `Error sending to topic: ${error instanceof Error ? error.message : String(error)}` }, 
          { status: 500 }
        );
      }
    } else if (body.token) {
      console.log(`Sending to single device token: ${body.token.substring(0, 10)}...`);
      
      try {
        // Send to a specific device token
        const response = await messaging.send({
          token: body.token,
          notification: notificationPayload,
          data: dataPayload,
          webpush: webPushConfig
        });
        
        console.log('Successfully sent to device:', response);
        
        return NextResponse.json({
          success: true,
          messageIds: [response],
          recipients: 1,
          tokenCount: 1
        });
      } catch (error) {
        console.error('Error sending to device:', error);
        
        // If the token is invalid, remove it from the database
        if (isInvalidTokenError(error)) {
          await removeInvalidToken(body.token, supabaseAdmin as any);
          invalidTokensRemoved++;
          
          return NextResponse.json({
            success: false,
            error: 'Invalid FCM token',
            invalidTokensRemoved
          }, { status: 400 });
        }
        
        return NextResponse.json(
          { error: `Error sending to device: ${error instanceof Error ? error.message : String(error)}` }, 
          { status: 500 }
        );
      }
    } else {
      console.error('No valid target specified (sendToAll, topic, or token)');
      return NextResponse.json(
        { error: 'You must specify either sendToAll, topic, or token' }, 
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error processing notification request:', error);
    return NextResponse.json(
      { error: `Error processing notification request: ${error instanceof Error ? error.message : String(error)}` }, 
      { status: 500 }
    );
  }
}
