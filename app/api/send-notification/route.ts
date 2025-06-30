import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { initializeFirebaseAdmin, getAdminMessaging, isFirebaseAdminInitialized } from '@/lib/firebase/admin';
import { NOTIFICATION_TOPICS } from '@/lib/types/firebase';
import type { NotificationTopicKey, FcmResponse, BulkNotificationResult } from '@/lib/types/firebase';
import type { TopicMessage, MulticastMessage } from 'firebase-admin/messaging';
import { createClient } from '@/lib/supabase/server';

// Define the structure for notification requests
interface NotificationRequestBody {
  title: string;
  body: string;
  data?: Record<string, string>;
  image?: string;
  link?: string;
  
  // Target options (only one should be specified)
  topic?: NotificationTopicKey | string;
  userId?: string;
  tokens?: string[];
  
  // Optional settings
  requireInteraction?: boolean;
  silent?: boolean;
  badge?: string;
  icon?: string;
  tag?: string;
}

/**
 * Validate that only one target type is specified
 */
function validateTargetOptions(body: NotificationRequestBody): string | null {
  const targets = [body.topic, body.userId, body.tokens].filter(Boolean);
  
  if (targets.length === 0) {
    return 'Must specify one target: topic, userId, or tokens';
  }
  
  if (targets.length > 1) {
    return 'Only one target type allowed: topic, userId, or tokens';
  }
  
  return null;
}

/**
 * Get device tokens for a specific user
 */
async function getUserTokens(userId: string, supabase: Awaited<ReturnType<typeof createServerClient>>): Promise<string[]> {
  const { data, error } = await supabase
    .from('device_tokens')
    .select('token')
    .eq('id', userId)
    .eq('is_active', true);
  
  if (error) {
    console.error('Error fetching user tokens:', error);
    return [];
  }
  
  return data?.map((row: { token: string }) => row.token) || [];
}

/**
 * Send notification to a topic
 */
async function sendToTopic(
  topic: string,
  title: string,
  body: string,
  data?: Record<string, string>,
  options?: {
    image?: string;
    icon?: string;
    badge?: string;
    link?: string;
    requireInteraction?: boolean;
    silent?: boolean;
    tag?: string;
  }
): Promise<FcmResponse> {
  const messaging = getAdminMessaging();
  if (!messaging) {
    return {
      success: false,
      error: {
        code: 'messaging-unavailable',
        message: 'Firebase messaging not available'
      }
    };
  }
  
  try {
    // Build the message payload for Firebase Admin SDK
    const message: TopicMessage = {
      topic,
      notification: {
        title,
        body,
      },
      data: {
        title,
        body,
        timestamp: new Date().toISOString(),
        ...(data || {})
      },
      webpush: {
        headers: {},
        notification: {
          title,
          body,
          icon: options?.icon || '/icons/android-big-icon.png',
          badge: options?.badge || '/icons/android-lil-icon-white.png',
          requireInteraction: options?.requireInteraction || false,
          silent: options?.silent || false,
          tag: options?.tag,
          image: options?.image,
          data: {
            url: options?.link || '/',
            ...(data || {})
          }
        },
        fcmOptions: {
          link: options?.link || '/'
        }
      }
    };
    
    const response = await messaging.send(message);
    
    return {
      success: true,
      messageId: response
    };
  } catch (error) {
    console.error('Error sending to topic:', error);
    return {
      success: false,
      error: {
        code: 'send-failed',
        message: error instanceof Error ? error.message : String(error)
      }
    };
  }
}

/**
 * Send notification to multiple tokens
 */
async function sendToTokens(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, string>,
  options?: {
    image?: string;
    icon?: string;
    badge?: string;
    link?: string;
    requireInteraction?: boolean;
    silent?: boolean;
    tag?: string;
  }
): Promise<BulkNotificationResult> {
  const messaging = getAdminMessaging();
  if (!messaging) {
    return {
      successCount: 0,
      failureCount: tokens.length,
      responses: tokens.map(() => ({
        success: false,
        error: {
          code: 'messaging-unavailable',
          message: 'Firebase messaging not available'
        }
      })),
      invalidTokens: []
    };
  }
  
  if (tokens.length === 0) {
    return {
      successCount: 0,
      failureCount: 0,
      responses: [],
      invalidTokens: []
    };
  }
  
  try {
    // Build the message payload
    const baseMessage = {
      notification: {
        title,
        body,
      },
      data: {
        title,
        body,
        timestamp: new Date().toISOString(),
        ...(data || {})
      },
      webpush: {
        headers: {},
        notification: {
          title,
          body,
          icon: options?.icon || '/icons/android-big-icon.png',
          badge: options?.badge || '/icons/android-lil-icon-white.png',
          requireInteraction: options?.requireInteraction || false,
          silent: options?.silent || false,
          tag: options?.tag,
          image: options?.image,
          data: {
            url: options?.link || '/',
            ...(data || {})
          }
        },
        fcmOptions: {
          link: options?.link || '/'
        }
      }
    };
    
    // Send to multiple tokens
    const multicastMessage: MulticastMessage = {
      tokens,
      ...baseMessage
    };
    
    const response = await messaging.sendEachForMulticast(multicastMessage);
    
    // Process results
    const responses: FcmResponse[] = [];
    const invalidTokens: string[] = [];
    
    response.responses.forEach((result, index) => {
      if (result.success) {
        responses.push({
          success: true,
          messageId: result.messageId
        });
      } else {
        responses.push({
          success: false,
          error: {
            code: result.error?.code || 'unknown',
            message: result.error?.message || 'Unknown error'
          }
        });
        
        // Check if token is invalid
        const errorCode = result.error?.code;
        if (
          errorCode === 'messaging/registration-token-not-registered' ||
          errorCode === 'messaging/invalid-registration-token'
        ) {
          invalidTokens.push(tokens[index]);
        }
      }
    });
    
    return {
      successCount: response.successCount,
      failureCount: response.failureCount,
      responses,
      invalidTokens
    };
  } catch (error) {
    console.error('Error sending to tokens:', error);
    
    // Return error for all tokens
    return {
      successCount: 0,
      failureCount: tokens.length,
      responses: tokens.map(() => ({
        success: false,
        error: {
          code: 'send-failed',
          message: error instanceof Error ? error.message : String(error)
        }
      })),
      invalidTokens: []
    };
  }
}

/**
 * Log notification to database
 */
async function logNotification(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  title: string,
  body: string,
  data: Record<string, string> | undefined,
  target: {
    topic?: string;
    userId?: string;
    tokenCount?: number;
  },
  result: FcmResponse | BulkNotificationResult
): Promise<void> {
  try {
    const logEntry = {
      title,
      body,
      data: data ? JSON.stringify(data) : null,
      topic: target.topic || null,
      id: target.userId || null,
      status: 'success' in result && result.success ? 'sent' : 
              'successCount' in result && result.successCount > 0 ? 'partial' : 'failed',
      sent_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { error } = await supabase
      .from('push_notifications')
      .insert([logEntry]);
    
    if (error) {
      console.error('Error logging notification:', error);
    }
  } catch (error) {
    console.error('Error in logNotification:', error);
  }
}

/**
 * Clean up invalid tokens from database
 */
async function cleanupInvalidTokens(supabase: Awaited<ReturnType<typeof createServerClient>>, invalidTokens: string[]): Promise<void> {
  if (invalidTokens.length === 0) return;
  
  try {
    const { error } = await supabase
      .from('device_tokens')
      .update({
        is_active: false,
        last_error: 'Token invalid or unregistered',
        error_count: 1, // Simple increment, or we could fetch current value first
        updated_at: new Date().toISOString()
      })
      .in('token', invalidTokens);
    
    if (error) {
      console.error('Error cleaning up invalid tokens:', error);
    } else {
      console.log(`Marked ${invalidTokens.length} tokens as inactive`);
    }
  } catch (error) {
    console.error('Error in cleanupInvalidTokens:', error);
  }
}

/**
 * API route to send push notifications
 */
export async function POST(request: NextRequest) {
  try {
    console.log('Send notification API called');
    
    // Initialize Firebase Admin
    if (!isFirebaseAdminInitialized()) {
      console.log('Initializing Firebase Admin in send notification API');
      initializeFirebaseAdmin();
    }
    
    // Parse request body
    const body: NotificationRequestBody = await request.json();
    const { title, body: messageBody, data, topic, userId, tokens, ...options } = body;
    
    // Validate required fields
    if (!title || !messageBody) {
      return NextResponse.json(
        { error: 'Missing required fields: title and body' },
        { status: 400 }
      );
    }
    
    // Validate target options
    const targetError = validateTargetOptions(body);
    if (targetError) {
      return NextResponse.json(
        { error: targetError },
        { status: 400 }
      );
    }
    
    // Initialize Supabase
    const supabase = await createServerClient();
    
    let result: FcmResponse | BulkNotificationResult;
    let targetInfo: { topic?: string; userId?: string; tokenCount?: number };
    
    // Handle different target types
    if (topic) {
      // Send to topic
      console.log(`Sending notification to topic: ${topic}`);
      result = await sendToTopic(topic, title, messageBody, data, options);
      targetInfo = { topic };
      
    } else if (userId) {
      // Send to specific user
      console.log(`Sending notification to user: ${userId}`);
      const userTokens = await getUserTokens(userId, supabase);
      
      if (userTokens.length === 0) {
        return NextResponse.json({
          success: false,
          error: 'No active tokens found for user'
        });
      }
      
      result = await sendToTokens(userTokens, title, messageBody, data, options);
      targetInfo = { userId, tokenCount: userTokens.length };
      
    } else if (tokens && tokens.length > 0) {
      // Send to specific tokens
      console.log(`Sending notification to ${tokens.length} tokens`);
      result = await sendToTokens(tokens, title, messageBody, data, options);
      targetInfo = { tokenCount: tokens.length };
      
    } else {
      return NextResponse.json(
        { error: 'No valid target specified' },
        { status: 400 }
      );
    }
    
    // Log notification
    await logNotification(supabase, title, messageBody, data, targetInfo, result);
    
    // Clean up invalid tokens if any
    if ('invalidTokens' in result && result.invalidTokens.length > 0) {
      await cleanupInvalidTokens(supabase, result.invalidTokens);
    }
    
    // Return success response
    return NextResponse.json({
      success: true,
      result,
      target: targetInfo
    });
    
  } catch (error) {
    console.error('Error in send notification API:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * Handle GET requests - return available topics and basic info
 */
export async function GET() {
  return NextResponse.json({
    availableTopics: Object.values(NOTIFICATION_TOPICS),
    info: {
      supportedTargets: ['topic', 'userId', 'tokens'],
      requiredFields: ['title', 'body'],
      optionalFields: ['data', 'image', 'link', 'requireInteraction', 'silent', 'badge', 'icon', 'tag']
    }
  });
}
