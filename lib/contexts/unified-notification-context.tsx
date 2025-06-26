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
  metadata?: Record<string, unknown>;
}

// Define Supabase real-time payload type
interface SupabasePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new?: Notification;
  old?: { id: string };
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
}

/**
 * Unified notification provider component
 * Handles notifications for all user types (customer, staff, admin)
 */
export function UnifiedNotificationProvider({
  children,
  recipientId
}: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [supabase, setSupabase] = useState<ReturnType<typeof getSupabaseBrowserClient> | null>(null);
  
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
    // IMPORTANT: Only fetch if we have a valid UUID recipientId
    // This prevents the 'customer' string from being used
    if (!supabase || !recipientId || recipientId === 'customer' || recipientId === 'admin') {
      console.log('[NotificationContext] Skipping fetch - no valid recipient ID', { recipientId });
      setNotifications([]);
      setIsLoading(false);
      return;
    }
    
    // Validate that recipientId looks like a UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(recipientId)) {
      console.warn('[NotificationContext] Invalid recipient ID format:', recipientId);
      setNotifications([]);
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('[NotificationContext] Fetching notifications for:', recipientId);
      
      // Fetch notifications for this recipient
      const { data, error: fetchError } = await supabase
        .from('announcements')
        .select('*')
        .eq('recipient_id', recipientId)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (fetchError) {
        console.error('[NotificationContext] Fetch error:', fetchError);
        throw fetchError;
      }
      
      console.log('[NotificationContext] Fetched notifications:', data?.length || 0);
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
    // Only fetch if we have a valid recipient ID
    if (recipientId && supabase && recipientId !== 'customer' && recipientId !== 'admin') {
      fetchNotifications();
    } else {
      // Clear notifications if no valid recipient
      setNotifications([]);
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipientId, supabase]);
  
  // Play notification sound
  const playNotificationSound = (soundType: 'notification' | 'new-order' | 'status-change' = 'notification') => {
    try {
      // Only try to play sounds in browser environment
      if (typeof window === 'undefined') {
        return;
      }
      
      const soundMap = {
        'notification': '/sounds/notification.mp3',
        'new-order': '/sounds/new-order.mp3',
        'status-change': '/sounds/status-change.mp3'
      };
      
      const soundUrl = soundMap[soundType];
      
      // Check if audio is supported
      if (!window.Audio) {
        console.warn('Audio not supported in this browser');
        return;
      }
      
      const audio = new Audio(soundUrl);
      
      // Set up error handling before attempting to play
      audio.addEventListener('error', (err) => {
        console.warn(`Could not load sound file: ${soundUrl}`, err);
      });
      
      // Attempt to play with proper error handling
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          // This is normal - browsers often block autoplay
          console.debug(`Sound play blocked or failed for ${soundType}:`, err.name);
        });
      }
    } catch (err) {
      console.warn('Error setting up notification sound:', err);
    }
  };
  
  // Set up real-time subscription
  useEffect(() => {
    // Only subscribe if we have a valid recipient ID
    if (!supabase || !recipientId || recipientId === 'customer' || recipientId === 'admin') {
      return;
    }
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(recipientId)) {
      return;
    }
    
    console.log('[NotificationContext] Setting up real-time subscription for:', recipientId);
    
    // Create channel for notifications
    const channel = supabase.channel(`notifications-${recipientId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `recipient_id=eq.${recipientId}`
      }, (payload: SupabasePayload) => {
        console.log('Notification change received:', payload);
        
        // Handle different change types
        if (payload.eventType === 'INSERT' && payload.new) {
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
        } else if (payload.eventType === 'UPDATE' && payload.new) {
          setNotifications(prev => 
            prev.map(n => n.id === payload.new!.id ? payload.new as Notification : n)
          );
        } else if (payload.eventType === 'DELETE' && payload.old) {
          setNotifications(prev => 
            prev.filter(n => n.id !== payload.old!.id)
          );
        }
      })
      .subscribe();
    
    // Cleanup subscription
    return () => {
      console.log('[NotificationContext] Cleaning up subscription for:', recipientId);
      channel.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipientId, supabase]);
  
  // Dismiss a notification
  const dismissNotification = async (id: string) => {
    if (!supabase) return;
    
    try {
      // Update in database
      const { error: updateError } = await supabase
        .from('announcements')
        .update({ status: 'dismissed' as const })
        .eq('id', id);
      
      if (updateError) throw updateError;
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, status: 'dismissed' as const } : n)
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
      const { error: updateError } = await supabase
        .from('announcements')
        .update({ status: 'dismissed' as const })
        .eq('recipient_id', recipientId)
        .eq('status', 'unread');
      
      if (updateError) throw updateError;
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => ({ ...n, status: 'dismissed' as const }))
      );
    } catch (err) {
      console.error('Error dismissing all notifications:', err);
      throw err;
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

/**
 * Safe hook to use the notification context
 * Returns null if context is not available instead of throwing an error
 */
export function useSafeNotifications(): NotificationContextType | null {
  const context = useContext(NotificationContext);
  return context || null;
}
