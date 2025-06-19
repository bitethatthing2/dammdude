import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import type { 
  TopicSubscription, 
  NotificationTopic, 
  SubscriptionResult, 
  TopicsResult,
  UserRole,
  WolfPackLocation 
} from '@/types/notifications';

/**
 * Subscribe a device token to a notification topic
 * @param token FCM token
 * @param topic Topic to subscribe to
 * @param userId Optional user ID to associate with subscription
 * @returns Success status and error if any
 */
export async function subscribeToTopic(
  token: string, 
  topic: string, 
  userId?: string
): Promise<SubscriptionResult> {
  if (!token || !topic) {
    return { success: false, error: 'Token and topic are required' };
  }

  try {
    const supabase = getSupabaseBrowserClient();
    
    // Get current user if userId not provided
    let user_id = userId;
    if (!user_id) {
      const { data: { user } } = await supabase.auth.getUser();
      user_id = user?.id;
    }

    const { error } = await supabase
      .from('topic_subscriptions')
      .upsert({
        token,
        topic,
        user_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'token,topic',
        ignoreDuplicates: false
      });

    if (error) {
      console.error(`Error subscribing to topic ${topic}:`, error);
      return { success: false, error: error.message };
    }

    console.log(`Successfully subscribed to topic: ${topic}`);
    return { success: true };
  } catch (err) {
    console.error(`Error subscribing to topic ${topic}:`, err);
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Unsubscribe a device token from a notification topic
 * @param token FCM token
 * @param topic Topic to unsubscribe from
 * @returns Success status and error if any
 */
export async function unsubscribeFromTopic(
  token: string, 
  topic: string
): Promise<SubscriptionResult> {
  if (!token || !topic) {
    return { success: false, error: 'Token and topic are required' };
  }

  try {
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase
      .from('topic_subscriptions')
      .delete()
      .match({ token, topic });

    if (error) {
      console.error(`Error unsubscribing from topic ${topic}:`, error);
      return { success: false, error: error.message };
    }

    console.log(`Successfully unsubscribed from topic: ${topic}`);
    return { success: true };
  } catch (err) {
    console.error(`Error unsubscribing from topic ${topic}:`, err);
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Get all topics a device is subscribed to
 * @param token FCM token
 * @returns List of topics and error if any
 */
export async function getSubscribedTopics(
  token: string
): Promise<{ topics: string[]; error?: Error | string | null }> {
  if (!token) {
    return { topics: [], error: 'Token is required' };
  }

  try {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from('topic_subscriptions')
      .select('topic')
      .eq('token', token);

    if (error) {
      console.error('Error getting subscribed topics:', error);
      return { topics: [], error: error.message };
    }

    const topicsData = (data || []) as Pick<TopicSubscription, 'topic'>[];
    const topics = topicsData.map(item => item.topic);
    return { topics };
  } catch (err) {
    console.error('Error getting subscribed topics:', err);
    return { topics: [], error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Get all available notification topics
 * @returns List of available topics and error if any
 */
export async function getAvailableTopics(): Promise<TopicsResult> {
  try {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from('notification_topics')
      .select('*')
      .eq('is_active', true)
      .order('display_name');

    if (error) {
      console.error('Error getting available topics:', error);
      return { topics: [], error: error.message };
    }

    return { topics: (data || []) as NotificationTopic[] };
  } catch (err) {
    console.error('Error getting available topics:', err);
    return { topics: [], error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Subscribe to location-based wolf pack topics
 * @param token FCM token
 * @param location 'salem' | 'portland'
 * @returns Success status and error if any
 */
export async function subscribeToWolfPackLocation(
  token: string,
  location: WolfPackLocation
): Promise<SubscriptionResult> {
  const topic = `wolfpack_${location}`;
  return subscribeToTopic(token, topic);
}

/**
 * Unsubscribe from all wolf pack location topics
 * @param token FCM token
 * @returns Success status and error if any
 */
export async function unsubscribeFromAllWolfPackLocations(
  token: string
): Promise<SubscriptionResult> {
  try {
    const results = await Promise.all([
      unsubscribeFromTopic(token, 'wolfpack_salem'),
      unsubscribeFromTopic(token, 'wolfpack_portland')
    ]);

    const hasError = results.some(r => !r.success);
    return { 
      success: !hasError, 
      error: hasError ? 'Failed to unsubscribe from some topics' : null 
    };
  } catch (err) {
    return { 
      success: false, 
      error: err instanceof Error ? err.message : String(err) 
    };
  }
}

/**
 * Update notification preferences for multiple topics at once
 * @param token FCM token
 * @param topicsToSubscribe Topics to subscribe to
 * @param topicsToUnsubscribe Topics to unsubscribe from
 * @returns Success status and error if any
 */
export async function updateNotificationPreferences(
  token: string,
  topicsToSubscribe: string[] = [],
  topicsToUnsubscribe: string[] = []
): Promise<SubscriptionResult> {
  try {
    const subscribePromises = topicsToSubscribe.map(topic => 
      subscribeToTopic(token, topic)
    );
    const unsubscribePromises = topicsToUnsubscribe.map(topic => 
      unsubscribeFromTopic(token, topic)
    );

    const allResults = await Promise.all([
      ...subscribePromises,
      ...unsubscribePromises
    ]);

    const hasError = allResults.some(result => !result.success);
    
    if (hasError) {
      const errors = allResults
        .filter(result => !result.success)
        .map(result => result.error)
        .join(', ');
      return { success: false, error: `Some operations failed: ${errors}` };
    }

    return { success: true };
  } catch (err) {
    return { 
      success: false, 
      error: err instanceof Error ? err.message : String(err) 
    };
  }
}

/**
 * Check if user can subscribe to a topic based on their role
 * @param topicKey Topic to check access for
 * @param userRole User's role
 * @returns Whether user can subscribe to topic
 */
export async function canSubscribeToTopic(
  topicKey: string,
  userRole?: UserRole
): Promise<{ canSubscribe: boolean; topic?: NotificationTopic }> {
  try {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from('notification_topics')
      .select('*')
      .eq('topic_key', topicKey)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      return { canSubscribe: false };
    }

    const topic = data as NotificationTopic;

    // If no role requirement, anyone can subscribe
    if (!topic.requires_role) {
      return { canSubscribe: true, topic };
    }

    // Check if user has required role
    const canSubscribe = userRole === topic.requires_role || 
                        userRole === 'admin' || 
                        (topic.requires_role === 'staff' && ['bartender', 'dj'].includes(userRole || ''));

    return { canSubscribe, topic };
  } catch (err) {
    console.error('Error checking topic access:', err);
    return { canSubscribe: false };
  }
}

/**
 * Get user's notification preferences
 * @param userId User ID
 * @returns User's subscribed topics
 */
export async function getUserNotificationPreferences(
  userId: string
): Promise<{ subscriptions: TopicSubscription[]; error?: Error | string | null }> {
  try {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from('topic_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting user notification preferences:', error);
      return { subscriptions: [], error: error.message };
    }

    return { subscriptions: (data || []) as TopicSubscription[] };
  } catch (err) {
    console.error('Error getting user notification preferences:', err);
    return { 
      subscriptions: [], 
      error: err instanceof Error ? err.message : String(err) 
    };
  }
}

/**
 * Get topics filtered by user role
 * @param userRole User's role for filtering topics
 * @returns Available topics for the user's role
 */
export async function getTopicsForRole(userRole?: UserRole): Promise<TopicsResult> {
  try {
    const { topics, error } = await getAvailableTopics();
    
    if (error) {
      return { topics: [], error };
    }

    // Filter topics based on user role
    const filteredTopics = topics.filter(topic => {
      // No role requirement means everyone can access
      if (!topic.requires_role) return true;
      
      // Admin can access everything
      if (userRole === 'admin') return true;
      
      // Staff role includes bartender and dj
      if (topic.requires_role === 'staff') {
        return ['staff', 'bartender', 'dj', 'admin'].includes(userRole || '');
      }
      
      // Exact role match
      return topic.requires_role === userRole;
    });

    return { topics: filteredTopics };
  } catch (err) {
    return { 
      topics: [], 
      error: err instanceof Error ? err.message : String(err) 
    };
  }
}
