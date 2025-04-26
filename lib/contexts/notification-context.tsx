"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

// Define notification types
export interface Notification {
  id: number;
  user_id: string;
  type: "info" | "warning" | "error";
  body: string;
  link?: string;
  dismissed: boolean;
  expires_at: string;
  created_at: string;
}

// Define payload type for realtime changes
interface PostgresChangesPayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: Notification;
  old: Notification;
}

// Define auth response type
interface AuthUserResponse {
  data: {
    user: {
      id: string;
      [key: string]: any;
    } | null;
  };
}

// Define context shape
interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: Error | null;
  dismissNotification: (id: number) => Promise<void>;
  dismissAllNotifications: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

// Create the context
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

/**
 * Provider component for managing in-app notifications
 * Handles fetching, dismissing, and real-time updates for user notifications
 */
export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  
  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.dismissed).length;
  
  // Get current user
  useEffect(() => {
    async function getCurrentUser() {
      try {
        const { data } = await supabase.auth.getUser();
        setUserId(data.user?.id || null);
      } catch (err) {
        console.error('Error getting user:', err);
        setUserId(null);
      }
    }
    
    getCurrentUser();
  }, [supabase]);
  
  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (!userId) {
        setNotifications([]);
        return;
      }
      
      const { data: notificationsData, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw new Error(error.message);
      
      setNotifications(notificationsData || []);
      
      // Dispatch custom event for other components to use
      const event = new CustomEvent('notification-update', { 
        detail: { unreadCount: notificationsData?.filter((n: Notification) => !n.dismissed).length || 0 } 
      });
      window.dispatchEvent(event);
      
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch notifications'));
    } finally {
      setIsLoading(false);
    }
  };
  
  // Dismiss a notification
  const dismissNotification = async (id: number) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ dismissed: true })
        .eq('id', id);
      
      if (error) throw new Error(error.message);
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, dismissed: true } : n)
      );
      
      // Dispatch custom event for other components to use
      const updatedUnreadCount = notifications
        .filter((n: Notification) => n.id !== id && !n.dismissed)
        .length;
        
      const event = new CustomEvent('notification-update', { 
        detail: { unreadCount: updatedUnreadCount } 
      });
      window.dispatchEvent(event);
      
    } catch (err) {
      console.error('Error dismissing notification:', err);
      throw err;
    }
  };
  
  // Dismiss all notifications
  const dismissAllNotifications = async () => {
    try {
      if (!userId || notifications.length === 0) return;
      
      const { error } = await supabase
        .from('notifications')
        .update({ dismissed: true })
        .eq('user_id', userId)
        .eq('dismissed', false);
      
      if (error) throw new Error(error.message);
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => ({ ...n, dismissed: true }))
      );
      
      // Dispatch custom event for other components to use
      const event = new CustomEvent('notification-update', { 
        detail: { unreadCount: 0 } 
      });
      window.dispatchEvent(event);
      
    } catch (err) {
      console.error('Error dismissing all notifications:', err);
      throw err;
    }
  };
  
  // Fetch notifications when userId changes
  useEffect(() => {
    if (userId) {
      fetchNotifications();
    } else {
      setNotifications([]);
      setIsLoading(false);
    }
  }, [userId]);
  
  // Set up real-time subscription
  useEffect(() => {
    if (!userId) return;
    
    // Set up real-time subscription
    const channel = supabase
      .channel('notification_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload: any) => {
          console.log('Notification change received:', payload);
          
          // Handle different change types
          if (payload.eventType === 'INSERT') {
            setNotifications(prev => [payload.new as Notification, ...prev]);
            
            // Dispatch custom event for other components to use
            const updatedUnreadCount = unreadCount + 1;
            const event = new CustomEvent('notification-update', { 
              detail: { unreadCount: updatedUnreadCount } 
            });
            window.dispatchEvent(event);
            
          } else if (payload.eventType === 'UPDATE') {
            setNotifications(prev => 
              prev.map(n => n.id === payload.new.id ? payload.new as Notification : n)
            );
            
            // Update unread count if dismissed status changed
            if (payload.old.dismissed !== payload.new.dismissed) {
              const updatedUnreadCount = payload.new.dismissed ? unreadCount - 1 : unreadCount + 1;
              const event = new CustomEvent('notification-update', { 
                detail: { unreadCount: updatedUnreadCount } 
              });
              window.dispatchEvent(event);
            }
            
          } else if (payload.eventType === 'DELETE') {
            setNotifications(prev => 
              prev.filter(n => n.id !== payload.old.id)
            );
            
            // Update unread count if deleted notification was not dismissed
            if (!payload.old.dismissed) {
              const updatedUnreadCount = unreadCount - 1;
              const event = new CustomEvent('notification-update', { 
                detail: { unreadCount: updatedUnreadCount } 
              });
              window.dispatchEvent(event);
            }
          }
        }
      )
      .subscribe();
    
    // Cleanup subscription
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, supabase, unreadCount]);
  
  // Context value
  const value: NotificationContextType = {
    notifications,
    unreadCount,
    isLoading,
    error,
    dismissNotification,
    dismissAllNotifications,
    refreshNotifications: fetchNotifications,
  };
  
  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

// Custom hook to use the notification context
export function useNotifications() {
  const context = useContext(NotificationContext);
  
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  
  return context;
}
