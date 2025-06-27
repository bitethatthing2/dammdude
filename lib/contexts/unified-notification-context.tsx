'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/lib/supabase/client'; // Use shared instance

/**
 * Notification interface matching your fetch_notifications function return type
 */
interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

/**
 * Notification context interface
 */
interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  refreshNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  dismissNotification: (id: string) => Promise<void>;
  dismissAllNotifications: () => Promise<void>;
}

/**
 * Notification context
 */
const NotificationContext = createContext<NotificationContextType | null>(null);

/**
 * Notification provider props
 */
interface NotificationProviderProps {
  children: ReactNode;
}

/**
 * Notification provider component
 * Provides notification state and actions to child components
 */
export function NotificationProvider({ children }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch notifications from Supabase
  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('fetch_notifications', {
        p_user_id: null, // null means current user
        p_limit: 50,
        p_offset: 0
      });

      if (error) {
        console.error('Error fetching notifications:', error);
        return;
      }

      setNotifications(data || []);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase.rpc('mark_notification_read', {
        p_notification_id: notificationId
      });

      if (error) {
        console.error('Failed to mark notification as read:', error);
        return;
      }

      // Update local state
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  }, []);

  // Dismiss notification (same as mark as read)
  const dismissNotification = useCallback(async (notificationId: string) => {
    await markAsRead(notificationId);
  }, [markAsRead]);

  // Mark all notifications as read
  const dismissAllNotifications = useCallback(async () => {
    try {
      const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
      
      // Mark all unread notifications as read
      for (const id of unreadIds) {
        await markAsRead(id);
      }
      
      // Refresh notifications to get updated state
      await fetchNotifications();
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  }, [notifications, markAsRead, fetchNotifications]);

  // Refresh notifications
  const refreshNotifications = useCallback(async () => {
    await fetchNotifications();
  }, [fetchNotifications]);

  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.read).length;

  // Load notifications on mount
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Context value
  const contextValue: NotificationContextType = {
    notifications,
    unreadCount,
    isLoading,
    refreshNotifications,
    markAsRead,
    dismissNotification,
    dismissAllNotifications,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
}

/**
 * Hook to use notification context
 * Throws an error if used outside of NotificationProvider
 */
export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

/**
 * Safe hook to use notification context
 * Returns null if used outside of NotificationProvider (doesn't throw)
 */
export function useSafeNotifications() {
  const context = useContext(NotificationContext);
  return context;
}

export default NotificationProvider;