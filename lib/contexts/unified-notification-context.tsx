"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

// Define notification type
export type NotificationType = "info" | "warning" | "error" | "order_new" | "order_ready";

// Define notification interface
export interface Notification {
  id: string;
  recipient_id: string;
  message: string;
  type: NotificationType;
  status: "unread" | "read" | "dismissed";
  created_at: string;
  link?: string;
  metadata?: Record<string, any>;
}

// Context type definition
interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: Error | null;
  dismissNotification: (id: string) => Promise<void>;
  dismissAllNotifications: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  playNotificationSound: (soundType?: 'notification' | 'new-order' | 'status-change') => void;
}

// Create context
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Provider props
interface NotificationProviderProps {
  children: ReactNode;
  recipientId?: string;
  role?: 'customer' | 'staff' | 'admin';
}

/**
 * Unified notification provider component
 * Handles notifications for all user types (customer, staff, admin)
 */
export function UnifiedNotificationProvider({
  children,
  recipientId,
  role = 'customer'
}: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [supabase, setSupabase] = useState<any>(null);
  
  // Calculate unread count
  const unreadCount = notifications.filter(n => n.status === 'unread').length;
  
  // Initialize Supabase on client side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSupabase(getSupabaseBrowserClient());
    }
  }, []);
  
  // Fetch notifications
  const fetchNotifications = async () => {
    if (!supabase || !recipientId) {
      setNotifications([]);
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch notifications for this recipient
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id', recipientId)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      
      setNotifications(data || []);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch notifications'));
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load notifications when recipientId or supabase changes
  useEffect(() => {
    if (recipientId && supabase) {
      fetchNotifications();
    }
  }, [recipientId, supabase]);
  
  // Set up real-time subscription
  useEffect(() => {
    if (!supabase || !recipientId) return;
    
    // Create channel for notifications
    const channel = supabase.channel(`notifications-${recipientId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `recipient_id=eq.${recipientId}`
      }, (payload: any) => {
        console.log('Notification change received:', payload);
        
        // Handle different change types
        if (payload.eventType === 'INSERT') {
          const newNotification = payload.new as Notification;
          setNotifications(prev => [newNotification, ...prev]);
          
          // Play sound for new notifications
          playNotificationSound(
            newNotification.type === 'order_new' 
              ? 'new-order' 
              : newNotification.type === 'order_ready'
                ? 'status-change'
                : 'notification'
          );
        } else if (payload.eventType === 'UPDATE') {
          setNotifications(prev => 
            prev.map(n => n.id === payload.new.id ? payload.new as Notification : n)
          );
        } else if (payload.eventType === 'DELETE') {
          setNotifications(prev => 
            prev.filter(n => n.id !== payload.old.id)
          );
        }
      })
      .subscribe();
    
    // Cleanup subscription
    return () => {
      supabase.channel(`notifications-${recipientId}`).unsubscribe();
    };
  }, [recipientId, supabase]);
  
  // Dismiss a notification
  const dismissNotification = async (id: string) => {
    if (!supabase) return;
    
    try {
      // Update in database
      const { error } = await supabase
        .from('notifications')
        .update({ status: 'dismissed' })
        .eq('id', id);
      
      if (error) throw error;
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, status: 'dismissed' } : n)
      );
    } catch (err) {
      console.error('Error dismissing notification:', err);
      throw err;
    }
  };
  
  // Dismiss all notifications
  const dismissAllNotifications = async () => {
    if (!supabase || !recipientId) return;
    
    try {
      // Update all unread notifications
      const { error } = await supabase
        .from('notifications')
        .update({ status: 'dismissed' })
        .eq('recipient_id', recipientId)
        .eq('status', 'unread');
      
      if (error) throw error;
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => ({ ...n, status: 'dismissed' }))
      );
    } catch (err) {
      console.error('Error dismissing all notifications:', err);
      throw err;
    }
  };
  
  // Play notification sound
  const playNotificationSound = (soundType: 'notification' | 'new-order' | 'status-change' = 'notification') => {
    try {
      const soundMap = {
        'notification': '/sounds/notification.mp3',
        'new-order': '/sounds/new-order.mp3',
        'status-change': '/sounds/status-change.mp3'
      };
      
      const audio = new Audio(soundMap[soundType]);
      audio.play().catch(err => {
        console.error(`Error playing ${soundType} sound:`, err);
      });
    } catch (err) {
      console.error('Error with notification sound:', err);
    }
  };
  
  // Create context value
  const contextValue: NotificationContextType = {
    notifications,
    unreadCount,
    isLoading,
    error,
    dismissNotification,
    dismissAllNotifications,
    refreshNotifications: fetchNotifications,
    playNotificationSound
  };
  
  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
}

/**
 * Hook to use the notification context
 */
export function useNotifications() {
  const context = useContext(NotificationContext);
  
  if (context === undefined) {
    throw new Error('useNotifications must be used within a UnifiedNotificationProvider');
  }
  
  return context;
}