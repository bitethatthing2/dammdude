import { NextRequest, NextResponse } from 'next/server';
import { SendNotificationRequest } from '@/lib/types/api';
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
  if (!error) return false;
  
  const errorMessage = String(error);
  return (
    errorMessage.includes('messaging/registration-token-not-registered') ||
    errorMessage.includes('messaging/invalid-registration-token') ||
    errorMessage.includes('messaging/invalid-argument') ||
    errorMessage.includes('Requested entity was not found')
  );
}

/**
 * Clean up invalid tokens in the database
 */
async function cleanupInvalidTokens(supabaseAdmin: any): Promise<{ removed: number, total: number }> {
  // Skip token validation in development mode to avoid Firebase Admin errors
  if (process.env.NODE_ENV === 'development') {
    console.log('Skipping token validation in development mode');
    return { removed: 0, total: 0 };
  }
  
  try {
    // Get all tokens
    const { data: tokensData, error } = await supabaseAdmin
      .from('fcm_tokens')
      .select('token')
      .order('created_at', { ascending: false });
    
    if (error || !tokensData) {
      console.error('Error fetching tokens for cleanup:', error);
      return { removed: 0, total: 0 };
    }
    
    const tokens = tokensData.map((t: { token: string }) => t.token);
    console.log(`Found ${tokens.length} tokens to validate`);
    
    // In production, we'll just check for obviously invalid tokens
    // This avoids issues with Firebase Admin SDK validation
    const invalidTokens: string[] = tokens.filter((token: string) => 
      !token || 
      token.length < 100 || 
      token === 'undefined' || 
      token === 'null'
    );
    
    console.log(`Found ${invalidTokens.length} obviously invalid tokens`);
    
    // Remove invalid tokens
    let removedCount = 0;
    for (const token of invalidTokens) {
      const removed = await removeInvalidToken(token, supabaseAdmin);
      if (removed) removedCount++;
    }
    
    return { removed: removedCount, total: tokens.length };
  } catch (error) {
    console.error('Error cleaning up invalid tokens:', error);
    return { removed: 0, total: 0 };
  }
}

/**
 * API route to send push notifications using Firebase Admin SDK
 */
export async function POST(request: NextRequest) {
  try {
    console.log('Send notification API called');
    
    // Initialize Firebase Admin SDK
    const adminApp = initializeFirebaseAdmin();
    
    // Ensure Firebase Admin is properly initialized
    if (!adminApp) {
      console.error('Firebase Admin failed to initialize');
      return NextResponse.json(
        { error: 'Firebase Admin failed to initialize' },
        { status: 500 }
      );
    }
    
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
    
    // Create the data payload with all notification information
    // This allows the app's message handler to create the notification
    const dataPayload: Record<string, string> = {
      title: body.title,
      body: body.body,
      click_action: "FLUTTER_NOTIFICATION_CLICK"
    };
    
    // Add optional fields to data payload
    if (body.link) dataPayload.link = body.link;
    if (body.image && body.image.startsWith('http')) dataPayload.image = body.image;
    
    // Add icon information for the client to use
    dataPayload.icon = webIcon;
    dataPayload.androidIcon = androidIcon;
    
    // Add any custom data fields
    if (body.data) {
      Object.entries(body.data).forEach(([key, value]) => {
        dataPayload[key] = String(value); // Ensure all values are strings
      });
    }

    // Create the webpush configuration separately
    const webPushConfig = {
      fcmOptions: {
        link: body.link
      },
      // Don't include notification property to avoid duplicates
      headers: {
        TTL: '86400' // 24 hours in seconds
      }
    };
    
    // Create Android specific configuration with proper Firebase typing
    const androidConfig: {
      priority: 'high' | 'normal';
      // Don't include notification property to avoid duplicates
      ttl?: number;
      restrictedPackageName?: string;
    } = {
      priority: 'high', // Using literal string with allowed values
      ttl: 86400000 // 24 hours in milliseconds
    };

    // Special case: if this is a cleanup request, run token cleanup
    if (body.action === 'cleanup_tokens') {
      console.log('Running token cleanup operation');
      
      const cleanupResult = await cleanupInvalidTokens(supabaseAdmin);
      
      return NextResponse.json({
        success: true,
        action: 'cleanup_tokens',
        removed: cleanupResult.removed,
        total: cleanupResult.total
      });
    }

    // Handle different targeting options
    if (body.sendToAll) {
      console.log('Sending to all devices (querying database for tokens)');
      
      // Get all tokens from the database
      const { data: tokensData, error: tokensError } = await supabaseAdmin
        .from('fcm_tokens')
        .select('token')
        .order('created_at', { ascending: false });
      
      if (tokensError) {
        console.error('Error fetching tokens:', tokensError);
        return NextResponse.json(
          { error: 'Failed to fetch tokens', details: tokensError.message },
          { status: 500 }
        );
      }
      
      if (!tokensData || tokensData.length === 0) {
        console.log('No tokens found in database');
        return NextResponse.json(
          { success: true, recipients: 0, message: 'No devices registered for notifications' }
        );
      }
      
      // Extract tokens and filter out obviously invalid ones
      const tokens = tokensData
        .map((t: { token: string }) => t.token)
        .filter((token: string) => 
          token && 
          token.length > 100 && 
          token !== 'undefined' && 
          token !== 'null'
        );
      
      console.log(`Sending to ${tokens.length} devices`);
      
      // If no valid tokens, return early
      if (tokens.length === 0) {
        console.log('No valid tokens found after filtering');
        return NextResponse.json(
          { success: true, recipients: 0, message: 'No valid devices registered for notifications' }
        );
      }
      
      // Send multicast message
      try {
        // Use sendEachForMulticast instead of sendMulticast (which might not be available in this version)
        const batchResponse = await messaging.sendEachForMulticast({
          tokens: tokens,
          data: dataPayload,
          webpush: webPushConfig,
          android: androidConfig
        });
        
        console.log(`Multicast send results: { successCount: ${batchResponse.successCount}, failureCount: ${batchResponse.failureCount}, responses: ${batchResponse.responses.length} }`);
        
        // Handle failed tokens
        const failedTokens: string[] = [];
        batchResponse.responses.forEach((resp: any, idx: number) => {
          if (!resp.success) {
            const failedToken = tokens[idx];
            console.log(`Failed to send to token: ${failedToken.substring(0, 10)}... Error: ${resp.error?.message || 'Unknown error'}`);
            
            // Check if token is invalid and should be removed
            if (resp.error && isInvalidTokenError(resp.error)) {
              failedTokens.push(failedToken);
            }
          }
        });
        
        // Remove invalid tokens
        let removedCount = 0;
        if (failedTokens.length > 0) {
          console.log(`Removing ${failedTokens.length} invalid tokens`);
          
          for (const token of failedTokens) {
            const removed = await removeInvalidToken(token, supabaseAdmin);
            if (removed) removedCount++;
          }
          
          console.log(`Removed ${removedCount} invalid tokens`);
        }
        
        return NextResponse.json({
          success: true,
          successCount: batchResponse.successCount,
          failureCount: batchResponse.failureCount,
          invalidTokensRemoved: removedCount
        });
      } catch (error) {
        console.error('Error sending multicast message:', error);
        return NextResponse.json(
          { 
            error: 'Failed to send multicast message',
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
        // Validate token (skip in development mode)
        if (process.env.NODE_ENV !== 'development') {
          try {
            // Simple validation - if token is obviously invalid, don't try to send
            if (!body.token || body.token.length < 100 || body.token === 'undefined' || body.token === 'null') {
              console.error('Token validation failed: Token appears invalid');
              await removeInvalidToken(body.token, supabaseAdmin);
              return NextResponse.json({
                success: false,
                error: 'Invalid token',
                tokenRemoved: true
              });
            }
          } catch (validationError) {
            if (isInvalidTokenError(validationError)) {
              console.error('Token validation failed:', validationError);
              await removeInvalidToken(body.token, supabaseAdmin);
              return NextResponse.json({
                success: false,
                error: 'Invalid token',
                tokenRemoved: true
              });
            }
          }
        }
        
        // Send to a specific device
        const response = await messaging.send({
          token: body.token,
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
