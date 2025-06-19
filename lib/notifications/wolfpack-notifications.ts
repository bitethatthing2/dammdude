import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export interface WolfPackNotificationData {
  type: 'chat_message' | 'order_update' | 'member_joined' | 'member_left' | 'event_announcement' | 'wink_received';
  sessionId?: string;
  memberId?: string;
  memberName?: string;
  orderId?: string;
  messageContent?: string;
  eventTitle?: string;
  customData?: Record<string, unknown>;
}

export interface NotificationRecipient {
  userId: string;
  fcmToken: string;
  preferences?: {
    chatMessages: boolean;
    orderUpdates: boolean;
    memberActivity: boolean;
    events: boolean;
    socialInteractions: boolean;
  };
}

/**
 * Send a WolfPack chat message notification to all members
 */
export async function sendChatMessageNotification(
  sessionId: string,
  senderName: string,
  messageContent: string,
  excludeUserId?: string
): Promise<boolean> {
  try {
    const supabase = getSupabaseBrowserClient();

    // Get all active WolfPack members with FCM tokens
    const { data: members, error } = await supabase
      .from('wolfpack_memberships')
      .select(`
        user_id,
        display_name,
        user_profiles!inner (
          fcm_token,
          notification_preferences
        )
      `)
      .eq('session_id', sessionId)
      .eq('is_active', true)
      .neq('user_id', excludeUserId || '')
      .not('user_profiles.fcm_token', 'is', null);

    if (error || !members) {
      console.error('Error fetching WolfPack members:', error);
      return false;
    }

    // Filter members who have chat notifications enabled
    const recipients = members.filter((member: { user_profiles: { fcm_token: string; notification_preferences?: { chatMessages?: boolean } } }) => {
      const prefs = member.user_profiles?.notification_preferences;
      return !prefs || prefs.chatMessages !== false;
    });

    if (recipients.length === 0) {
      console.log('No recipients found for chat notification');
      return true;
    }

    // Prepare notification data
    const notificationData: WolfPackNotificationData = {
      type: 'chat_message',
      sessionId,
      memberId: excludeUserId,
      memberName: senderName,
      messageContent: messageContent.substring(0, 100) // Truncate for notification
    };

    // Send notifications
    return await sendBulkNotification({
      title: `${senderName} in WolfPack`,
      body: messageContent.length > 50 
        ? `${messageContent.substring(0, 50)}...` 
        : messageContent,
      data: notificationData,
      recipients: recipients.map((m: { user_id: string; user_profiles: { fcm_token: string } }) => ({
        userId: m.user_id,
        fcmToken: m.user_profiles.fcm_token
      })),
      link: `/wolfpack/chat?session=${sessionId}`,
      icon: '/icons/chat-notification.png'
    });

  } catch (error) {
    console.error('Error sending chat message notification:', error);
    return false;
  }
}

/**
 * Send order status update notification to a specific user
 */
export async function sendOrderUpdateNotification(
  userId: string,
  orderId: string,
  status: string,
  estimatedTime?: number
): Promise<boolean> {
  try {
    const supabase = getSupabaseBrowserClient();

    // Get user's FCM token and preferences
    const { data: userProfile, error } = await supabase
      .from('user_profiles')
      .select('fcm_token, notification_preferences')
      .eq('user_id', userId)
      .single();

    if (error || !userProfile?.fcm_token) {
      console.error('Error fetching user profile or no FCM token:', error);
      return false;
    }

    // Check if user wants order notifications
    const prefs = userProfile.notification_preferences;
    if (prefs && prefs.orderUpdates === false) {
      console.log('User has disabled order update notifications');
      return true;
    }

    // Prepare notification content based on status
    let title = 'Order Update';
    let body = '';

    switch (status) {
      case 'confirmed':
        title = '🍴 Order Confirmed!';
        body = estimatedTime 
          ? `Your order is being prepared. Estimated time: ${estimatedTime} minutes`
          : 'Your order has been confirmed and is being prepared';
        break;
      case 'preparing':
        title = '👨‍🍳 Order in Kitchen';
        body = estimatedTime
          ? `Your food is being prepared. Ready in about ${estimatedTime} minutes`
          : 'Your order is currently being prepared';
        break;
      case 'ready':
        title = '🔔 Order Ready!';
        body = 'Your order is ready for pickup. Head to the counter!';
        break;
      case 'delivered':
        title = '✅ Order Delivered';
        body = 'Your order has been delivered. Enjoy your meal!';
        break;
      default:
        body = `Your order status has been updated to: ${status}`;
    }

    const notificationData: WolfPackNotificationData = {
      type: 'order_update',
      orderId,
      customData: { status, estimatedTime }
    };

    return await sendSingleNotification({
      title,
      body,
      data: notificationData,
      recipient: {
        userId,
        fcmToken: userProfile.fcm_token
      },
      link: `/orders/${orderId}`,
      icon: '/icons/order-notification.png'
    });

  } catch (error) {
    console.error('Error sending order update notification:', error);
    return false;
  }
}

/**
 * Send notification when someone joins the WolfPack
 */
export async function sendMemberJoinedNotification(
  sessionId: string,
  newMemberName: string,
  newMemberUserId: string
): Promise<boolean> {
  try {
    const supabase = getSupabaseBrowserClient();

    // Get all other active WolfPack members
    const { data: members, error } = await supabase
      .from('wolfpack_memberships')
      .select(`
        user_id,
        user_profiles!inner (
          fcm_token,
          notification_preferences
        )
      `)
      .eq('session_id', sessionId)
      .eq('is_active', true)
      .neq('user_id', newMemberUserId);

    if (error || !members) {
      console.error('Error fetching WolfPack members:', error);
      return false;
    }

    // Filter members who want member activity notifications
    const recipients = members.filter((member: { user_profiles: { fcm_token: string; notification_preferences?: { memberActivity?: boolean } } }) => {
      const prefs = member.user_profiles?.notification_preferences;
      return !prefs || prefs.memberActivity !== false;
    });

    if (recipients.length === 0) {
      return true;
    }

    const notificationData: WolfPackNotificationData = {
      type: 'member_joined',
      sessionId,
      memberId: newMemberUserId,
      memberName: newMemberName
    };

    return await sendBulkNotification({
      title: '🐺 New Pack Member!',
      body: `${newMemberName} has joined your WolfPack`,
      data: notificationData,
      recipients: recipients.map((m: { user_id: string; user_profiles: { fcm_token: string } }) => ({
        userId: m.user_id,
        fcmToken: m.user_profiles.fcm_token
      })),
      link: `/wolfpack?session=${sessionId}`,
      icon: '/icons/wolfpack-notification.png'
    });

  } catch (error) {
    console.error('Error sending member joined notification:', error);
    return false;
  }
}

/**
 * Send event announcement to all WolfPack members
 */
export async function sendEventAnnouncementNotification(
  sessionId: string,
  eventTitle: string,
  eventDescription: string,
  eventTime?: string
): Promise<boolean> {
  try {
    const supabase = getSupabaseBrowserClient();

    // Get all active WolfPack members
    const { data: members, error } = await supabase
      .from('wolfpack_memberships')
      .select(`
        user_id,
        user_profiles!inner (
          fcm_token,
          notification_preferences
        )
      `)
      .eq('session_id', sessionId)
      .eq('is_active', true);

    if (error || !members) {
      console.error('Error fetching WolfPack members:', error);
      return false;
    }

    // Filter members who want event notifications
    const recipients = members.filter((member: { user_profiles: { fcm_token: string; notification_preferences?: { events?: boolean } } }) => {
      const prefs = member.user_profiles?.notification_preferences;
      return !prefs || prefs.events !== false;
    });

    if (recipients.length === 0) {
      return true;
    }

    const notificationData: WolfPackNotificationData = {
      type: 'event_announcement',
      sessionId,
      eventTitle,
      customData: { eventDescription, eventTime }
    };

    const body = eventTime 
      ? `${eventDescription} • ${eventTime}`
      : eventDescription;

    return await sendBulkNotification({
      title: `🎉 ${eventTitle}`,
      body: body.length > 100 ? `${body.substring(0, 100)}...` : body,
      data: notificationData,
      recipients: recipients.map((m: { user_id: string; user_profiles: { fcm_token: string } }) => ({
        userId: m.user_id,
        fcmToken: m.user_profiles.fcm_token
      })),
      link: `/wolfpack/events?session=${sessionId}`,
      icon: '/icons/event-notification.png'
    });

  } catch (error) {
    console.error('Error sending event announcement:', error);
    return false;
  }
}

/**
 * Send wink notification to a specific user
 */
export async function sendWinkNotification(
  recipientUserId: string,
  senderName: string,
  senderUserId: string,
  sessionId?: string
): Promise<boolean> {
  try {
    const supabase = getSupabaseBrowserClient();

    // Get recipient's FCM token and preferences
    const { data: userProfile, error } = await supabase
      .from('user_profiles')
      .select('fcm_token, notification_preferences')
      .eq('user_id', recipientUserId)
      .single();

    if (error || !userProfile?.fcm_token) {
      console.error('Error fetching user profile or no FCM token:', error);
      return false;
    }

    // Check if user wants social interaction notifications
    const prefs = userProfile.notification_preferences;
    if (prefs && prefs.socialInteractions === false) {
      console.log('User has disabled social interaction notifications');
      return true;
    }

    const notificationData: WolfPackNotificationData = {
      type: 'wink_received',
      sessionId,
      memberId: senderUserId,
      memberName: senderName
    };

    return await sendSingleNotification({
      title: '😉 Someone winked at you!',
      body: `${senderName} sent you a wink`,
      data: notificationData,
      recipient: {
        userId: recipientUserId,
        fcmToken: userProfile.fcm_token
      },
      link: sessionId ? `/wolfpack?session=${sessionId}` : '/wolfpack',
      icon: '/icons/wink-notification.png'
    });

  } catch (error) {
    console.error('Error sending wink notification:', error);
    return false;
  }
}

/**
 * Send a single notification
 */
async function sendSingleNotification(options: {
  title: string;
  body: string;
  data: WolfPackNotificationData;
  recipient: NotificationRecipient;
  link?: string;
  icon?: string;
}): Promise<boolean> {
  try {
    const response = await fetch('/api/send-notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: options.recipient.fcmToken,
        title: options.title,
        body: options.body,
        data: {
          ...options.data,
          link: options.link || '/',
          userId: options.recipient.userId
        },
        link: options.link,
        icon: options.icon || '/icons/android-big-icon.png'
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('Error sending single notification:', error);
    return false;
  }
}

/**
 * Send bulk notifications to multiple recipients
 */
async function sendBulkNotification(options: {
  title: string;
  body: string;
  data: WolfPackNotificationData;
  recipients: NotificationRecipient[];
  link?: string;
  icon?: string;
}): Promise<boolean> {
  try {
    const promises = options.recipients.map(recipient => 
      sendSingleNotification({
        title: options.title,
        body: options.body,
        data: options.data,
        recipient,
        link: options.link,
        icon: options.icon
      })
    );

    const results = await Promise.allSettled(promises);
    const successCount = results.filter(r => r.status === 'fulfilled' && r.value).length;
    
    console.log(`Sent ${successCount}/${options.recipients.length} notifications successfully`);
    
    // Consider it successful if at least 50% were sent
    return successCount >= Math.ceil(options.recipients.length * 0.5);
  } catch (error) {
    console.error('Error sending bulk notifications:', error);
    return false;
  }
}

/**
 * Get user's notification preferences
 */
export async function getUserNotificationPreferences(userId: string) {
  try {
    const supabase = getSupabaseBrowserClient();
    
    const { data, error } = await supabase
      .from('user_profiles')
      .select('notification_preferences')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching notification preferences:', error);
      return null;
    }

    return data?.notification_preferences || {
      chatMessages: true,
      orderUpdates: true,
      memberActivity: true,
      events: true,
      socialInteractions: true
    };
  } catch (error) {
    console.error('Error getting notification preferences:', error);
    return null;
  }
}

/**
 * Update user's notification preferences
 */
export async function updateNotificationPreferences(
  userId: string,
  preferences: {
    chatMessages?: boolean;
    orderUpdates?: boolean;
    memberActivity?: boolean;
    events?: boolean;
    socialInteractions?: boolean;
  }
): Promise<boolean> {
  try {
    const supabase = getSupabaseBrowserClient();
    
    const { error } = await supabase
      .from('user_profiles')
      .update({
        notification_preferences: preferences,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating notification preferences:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    return false;
  }
}
