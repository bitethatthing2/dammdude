import { supabase } from '@/lib/supabase/client';

export interface NotificationData {
  recipientId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  data?: Record<string, unknown>;
}

/**
 * Creates a new notification for a user
 */
export async function createNotification(notification: NotificationData) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        recipient_id: notification.recipientId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        link: notification.link || null,
        data: notification.data || {},
        read: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating notification:', error);
      return null;
    }

    return data;
  } catch (err) {
    console.error('Failed to create notification:', err);
    return null;
  }
}

/**
 * Creates multiple notifications at once
 */
export async function createNotifications(notifications: NotificationData[]) {
  try {
    const notificationRecords = notifications.map(notification => ({
      recipient_id: notification.recipientId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      link: notification.link || null,
      data: notification.data || {},
      read: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    const { data, error } = await supabase
      .from('notifications')
      .insert(notificationRecords)
      .select();

    if (error) {
      console.error('Error creating notifications:', error);
      return null;
    }

    return data;
  } catch (err) {
    console.error('Failed to create notifications:', err);
    return null;
  }
}

/**
 * Common notification types and their creators
 */
export const NotificationCreators = {
  orderReady: (recipientId: string, orderId: string) => ({
    recipientId,
    type: 'order_ready',
    title: 'Your order is ready!',
    message: `Your order #${orderId} is ready for pickup.`,
    link: `/orders/${orderId}`,
    data: { orderId, category: 'order' }
  }),

  newMessage: (recipientId: string, senderName: string, messageId?: string) => ({
    recipientId,
    type: 'message',
    title: `New message from ${senderName}`,
    message: 'You have a new message in Wolf Pack chat.',
    link: '/wolfpack/chat',
    data: { sender: senderName, messageId, category: 'message' }
  }),

  announcement: (recipientId: string, title: string, message: string, link?: string) => ({
    recipientId,
    type: 'announcement',
    title,
    message,
    link,
    data: { category: 'announcement' }
  }),

  welcome: (recipientId: string) => ({
    recipientId,
    type: 'welcome',
    title: 'Welcome to High Energy Sports Bar!',
    message: 'Thanks for joining our community. Check out our latest features.',
    link: '/welcome',
    data: { category: 'welcome', welcomeFlow: true }
  })
};