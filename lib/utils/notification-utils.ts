import { getSupabaseBrowserClient, safeSupabaseQuery } from '@/lib/supabase/client';

/**
 * Subscribe a device token to a notification topic
 * @param token FCM token
 * @param topic Topic to subscribe to
 * @returns Success status and error if any
 */
export async function subscribeToTopic(token: string, topic: string): Promise<{ success: boolean; error?: any }> {
  if (!token || !topic) {
    return { success: false, error: 'Token and topic are required' };
  }

  try {
    const supabase = getSupabaseBrowserClient();
    const { error } = await safeSupabaseQuery(supabase, (client) =>
      client.from('topic_subscriptions')
        .upsert({
          token,
          topic,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'token,topic',
          ignoreDuplicates: true
        })
    );

    if (error) {
      console.error(`Error subscribing to topic ${topic}:`, error);
      return { success: false, error };
    }

    console.log(`Successfully subscribed to topic: ${topic}`);
    return { success: true };
  } catch (err) {
    console.error(`Error subscribing to topic ${topic}:`, err);
    return { success: false, error: err };
  }
}

/**
 * Unsubscribe a device token from a notification topic
 * @param token FCM token
 * @param topic Topic to unsubscribe from
 * @returns Success status and error if any
 */
export async function unsubscribeFromTopic(token: string, topic: string): Promise<{ success: boolean; error?: any }> {
  if (!token || !topic) {
    return { success: false, error: 'Token and topic are required' };
  }

  try {
    const supabase = getSupabaseBrowserClient();
    const { error } = await safeSupabaseQuery(supabase, (client) =>
      client.from('topic_subscriptions')
        .delete()
        .match({ token, topic })
    );

    if (error) {
      console.error(`Error unsubscribing from topic ${topic}:`, error);
      return { success: false, error };
    }

    console.log(`Successfully unsubscribed from topic: ${topic}`);
    return { success: true };
  } catch (err) {
    console.error(`Error unsubscribing from topic ${topic}:`, err);
    return { success: false, error: err };
  }
}

/**
 * Get all topics a device is subscribed to
 * @param token FCM token
 * @returns List of topics and error if any
 */
export async function getSubscribedTopics(token: string): Promise<{ topics: string[]; error?: any }> {
  if (!token) {
    return { topics: [], error: 'Token is required' };
  }

  try {
    // Define the expected return type from Supabase
    interface TopicSubscription {
      topic: string;
    }

    const supabase = getSupabaseBrowserClient();
    const { data, error } = await safeSupabaseQuery(supabase, (client) =>
      client.from('topic_subscriptions')
        .select('topic')
        .eq('token', token)
    );

    if (error) {
      console.error('Error getting subscribed topics:', error);
      return { topics: [], error };
    }

    // Properly type the data and handle null case
    const topicsData = (data || []) as TopicSubscription[];
    const topics = topicsData.map(item => item.topic);
    return { topics };
  } catch (err) {
    console.error('Error getting subscribed topics:', err);
    return { topics: [], error: err };
  }
}

/**
 * Get all available notification topics
 * @returns List of available topics and error if any
 */
export async function getAvailableTopics(): Promise<{ topics: string[]; error?: any }> {
  try {
    // This is a placeholder - in a real app, you might fetch this from a topics table
    // or from a configuration endpoint
    const availableTopics = [
      'all_devices',
      'new_orders',
      'order_updates',
      'promotions',
      'announcements'
    ];
    
    return { topics: availableTopics };
  } catch (err) {
    console.error('Error getting available topics:', err);
    return { topics: [], error: err };
  }
}
