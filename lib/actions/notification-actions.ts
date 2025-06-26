import { createServerClient } from '@/lib/supabase/server';

export interface NotificationData {
  userId: string;
  type: 'info' | 'warning' | 'error';
  body: string;
  link?: string;
  expiresAt?: Date;
}

export interface BulkNotificationData {
  type: 'info' | 'warning' | 'error';
  body: string;
  link?: string;
  expiresAt?: Date;
}

export async function createNotification(data: NotificationData) {
  try {
    const supabase = await createServerClient();
    
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        user_id: data.userId,
        type: data.type,
        body: data.body,
        link: data.link,
        expires_at: data.expiresAt?.toISOString(),
        created_at: new Date().toISOString(),
        read: false
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating notification:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true, notification };
  } catch (error) {
    console.error('Error in createNotification:', error);
    return { success: false, error: 'Failed to create notification' };
  }
}

export async function createBulkNotifications(userIds: string[], data: BulkNotificationData) {
  try {
    const supabase = await createServerClient();
    
    const notifications = userIds.map(userId => ({
      user_id: userId,
      type: data.type,
      body: data.body,
      link: data.link,
      expires_at: data.expiresAt?.toISOString(),
      created_at: new Date().toISOString(),
      read: false
    }));
    
    const { data: insertedNotifications, error } = await supabase
      .from('notifications')
      .insert(notifications)
      .select();
    
    if (error) {
      console.error('Error creating bulk notifications:', error);
      return { success: false, error: error.message };
    }
    
    return { 
      success: true, 
      notifications: insertedNotifications,
      count: insertedNotifications?.length || 0
    };
  } catch (error) {
    console.error('Error in createBulkNotifications:', error);
    return { success: false, error: 'Failed to create bulk notifications' };
  }
}