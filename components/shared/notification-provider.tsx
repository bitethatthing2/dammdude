'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from '@/components/ui/use-toast';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/lib/database.types';
import { useRouter } from 'next/navigation';

// Define notification types
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'order_ready' | 'system' | 'alert';
  target_id?: string;
  target_type?: string;
  read: boolean;
  created_at: string;
}

// Define context values and methods
interface NotificationContextValue {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearNotifications: () => void;
}

// Create context with default values
const NotificationContext = createContext<NotificationContextValue>({
  notifications: [],
  unreadCount: 0,
  markAsRead: async () => {},
  markAllAsRead: async () => {},
  clearNotifications: () => {},
});

// Hook to use the notification context
export const useNotifications = () => useContext(NotificationContext);

// Provider component
export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const router = useRouter();
  
  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.read).length;
  
  // Initialize notifications and set up real-time subscription
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    
    // Fetch initial notifications
    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(15);
        
      if (error) {
        console.error('Error fetching notifications:', error);
        return;
      }
      
      if (data) {
        setNotifications(data);
      }
    };
    
    fetchNotifications();
    
    // Subscribe to new notifications
    const subscription = supabase
      .channel('notifications-channel')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
      }, (payload: { 
        new: Notification;
        old: null;
        eventType: 'INSERT';
        schema: string;
        table: string;
        commit_timestamp: string;
      }) => {
        // Add new notification to state
        const newNotification = payload.new;
        setNotifications(prev => [newNotification, ...prev].slice(0, 15));
        
        // Show toast notification
        toast({
          title: newNotification.title,
          description: newNotification.message,
          variant: newNotification.type === 'alert' ? 'destructive' : 'default',
        });
        
        // Play notification sound
        playNotificationSound();
        
        // If this is an order_ready notification, prompt the user
        if (newNotification.type === 'order_ready') {
          // Show browser notification if permitted
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(newNotification.title, {
              body: newNotification.message,
              icon: '/images/logo.png'
            });
          }
        }
      })
      .subscribe();
      
    // Request notification permission if not already granted
    if ('Notification' in window && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
      
    return () => {
      supabase.channel('notifications-channel').unsubscribe();
    };
  }, [router]);
  
  // Play notification sound
  const playNotificationSound = () => {
    try {
      const audio = new Audio('/sounds/notification.mp3');
      audio.play();
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  };
  
  // Mark notification as read
  const markAsRead = async (id: string) => {
    const supabase = getSupabaseBrowserClient();
    
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);
        
      if (error) throw error;
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };
  
  // Mark all notifications as read
  const markAllAsRead = async () => {
    const supabase = getSupabaseBrowserClient();
    
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .in('id', notifications.map(n => n.id));
        
      if (error) throw error;
      
      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };
  
  // Clear notifications from local state
  const clearNotifications = () => {
    setNotifications([]);
  };
  
  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      markAsRead,
      markAllAsRead,
      clearNotifications
    }}>
      {children}
    </NotificationContext.Provider>
  );
}
