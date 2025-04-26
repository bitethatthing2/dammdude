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
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  
  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.dismissed).length;
  
  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get current user
      const { data } = await supabase.auth.getUser();
      
      if (!data.user) {
        setNotifications([]);
        return;
      }
      
      const { data: notificationsData, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', data.user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw new Error(error.message);
      
      setNotifications(notificationsData || []);
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
    } catch (err) {
      console.error('Error dismissing notification:', err);
      throw err;
    }
  };
  
  // Dismiss all notifications
  const dismissAllNotifications = async () => {
    try {
      // Get current user
      const { data } = await supabase.auth.getUser();
      
      if (!data.user || notifications.length === 0) return;
      
      const { error } = await supabase
        .from('notifications')
        .update({ dismissed: true })
        .eq('user_id', data.user.id)
        .eq('dismissed', false);
      
      if (error) throw new Error(error.message);
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => ({ ...n, dismissed: true }))
      );
    } catch (err) {
      console.error('Error dismissing all notifications:', err);
      throw err;
    }
  };
  
  // Set up real-time subscription
  useEffect(() => {
    // Initial fetch
    fetchNotifications();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('notification_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
        },
        (payload: any) => {
          console.log('Notification change received:', payload);
          
          // Get current user
          supabase.auth.getUser().then((response: AuthUserResponse) => {
            const user = response.data.user;
            if (!user) return;
            
            // Only process changes for the current user
            if (payload.new && payload.new.user_id === user.id) {
              // Handle different change types
              if (payload.eventType === 'INSERT') {
                setNotifications(prev => [payload.new as Notification, ...prev]);
              } else if (payload.eventType === 'UPDATE') {
                setNotifications(prev => 
                  prev.map(n => n.id === payload.new.id ? payload.new as Notification : n)
                );
              } else if (payload.eventType === 'DELETE') {
                setNotifications(prev => 
                  prev.filter(n => n.id !== payload.old.id)
                );
              }
            }
          });
        }
      )
      .subscribe();
    
    // Cleanup subscription
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);
  
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

/**
 * Custom hook to access notification context
 * Must be used within a NotificationProvider
 */
export function useNotifications() {
  const context = useContext(NotificationContext);
  
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  
  return context;
}
