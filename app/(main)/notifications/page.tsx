"use client";

import { Suspense, useEffect, useState, ReactElement } from 'react';
import { Bell } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle, Info, AlertTriangle, XCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

// Define notification type
interface Notification {
  id: number;
  user_id: string;
  type: "info" | "warning" | "error";
  body: string;
  link?: string;
  dismissed: boolean;
  expires_at: string;
  created_at: string;
}

export default function NotificationsPage(): ReactElement {
  return (
    <div className="container py-8">
      <div className="flex items-center mb-8">
        <Bell className="h-6 w-6 mr-2 text-primary" />
        <h1 className="text-3xl font-bold">Notifications</h1>
      </div>
      
      <Suspense fallback={<NotificationsPageSkeleton />}>
        <div className="max-w-md mx-auto">
          <p className="text-muted-foreground mb-6">
            View and manage your notifications. Stay updated with the latest events, promotions, and updates.
          </p>
          
          <div className="border border-primary rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-4">Your Notifications</h2>
            <NotificationList />
          </div>
        </div>
      </Suspense>
    </div>
  );
}

function NotificationsPageSkeleton(): ReactElement {
  return (
    <div className="max-w-md mx-auto">
      <div className="h-4 w-3/4 bg-muted rounded mb-6 animate-pulse" />
      <div className="border border-primary rounded-lg p-4">
        <div className="h-6 w-1/2 bg-muted rounded mb-4 animate-pulse" />
        <div className="space-y-4">
          {Array(3).fill(0).map((_, i: number) => (
            <div key={i} className="flex items-start gap-3">
              <div className="h-5 w-5 rounded-full bg-muted animate-pulse" />
              <div className="flex-1">
                <div className="h-4 w-full bg-muted rounded mb-2 animate-pulse" />
                <div className="h-3 w-1/3 bg-muted rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function NotificationList(): ReactElement {
  // State for error handling
  const [error, setError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  
  // Safely get the Supabase client
  const getSupabaseBrowserClient = (): any => {
    try {
      // Dynamic import to avoid SSR issues
      const { createClientComponentClient } = require('@supabase/auth-helpers-nextjs');
      return createClientComponentClient();
    } catch (err: any) {
      console.error("Error creating Supabase client:", err);
      setError("Failed to connect to notification service");
      return null;
    }
  };
  
  // Fetch notifications directly
  useEffect(() => {
    async function fetchNotifications(): Promise<void> {
      try {
        setIsLoading(true);
        
        const supabase = getSupabaseBrowserClient();
        if (!supabase) return;
        
        // Get current user
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData?.user?.id;
        
        if (!userId) {
          setError("Please log in to view notifications");
          setIsLoading(false);
          return;
        }
        
        // Fetch notifications
        const { data, error: fetchError } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
        
        if (fetchError) throw new Error(fetchError.message);
        
        setNotifications(data || []);
        setUnreadCount(data?.filter((n: Notification) => !n.dismissed).length || 0);
      } catch (err: any) {
        console.error("Error fetching notifications:", err);
        setError("Failed to load notifications");
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchNotifications();
  }, []);
  
  // Dismiss notification function
  const dismissNotification = async (id: number): Promise<void> => {
    try {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) return;
      
      await supabase
        .from('notifications')
        .update({ dismissed: true })
        .eq('id', id);
      
      // Update local state
      setNotifications((prev: Notification[]) => 
        prev.map((n: Notification) => n.id === id ? { ...n, dismissed: true } : n)
      );
      
      setUnreadCount((prev: number) => Math.max(0, prev - 1));
    } catch (err: any) {
      console.error("Error dismissing notification:", err);
    }
  };
  
  // Dismiss all notifications
  const dismissAllNotifications = async (): Promise<void> => {
    try {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) return;
      
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      
      if (!userId) return;
      
      await supabase
        .from('notifications')
        .update({ dismissed: true })
        .eq('user_id', userId)
        .eq('dismissed', false);
      
      // Update local state
      setNotifications((prev: Notification[]) => 
        prev.map((n: Notification) => ({ ...n, dismissed: true }))
      );
      
      setUnreadCount(0);
    } catch (err: any) {
      console.error("Error dismissing all notifications:", err);
    }
  };

  /**
   * Function to render the appropriate icon based on notification type
   */
  function getNotificationIcon(type: Notification["type"]): ReactElement {
    switch (type) {
      case "info":
        return <Info className="h-4 w-4 text-blue-500" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case "error":
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  }

  /**
   * Format time for display
   */
  function formatTime(dateString: string): string {
    if (!dateString) return "";
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      
      // If it's today, show relative time (e.g., "5 minutes ago")
      if (date.toDateString() === now.toDateString()) {
        return formatDistanceToNow(date, { addSuffix: true });
      }
      
      // Otherwise show the date
      return format(date, "MMM d, yyyy");
    } catch (err: any) {
      console.error("Error formatting date:", err);
      return "Unknown date";
    }
  }

  // Show error state
  if (error) {
    return (
      <div className="text-center p-4 border border-destructive/20 rounded-md">
        <p className="text-destructive font-medium">{error}</p>
        <p className="text-sm text-muted-foreground mt-2">
          Please try again later or contact support if the problem persists.
        </p>
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i: number) => (
          <div key={i} className="flex items-start gap-2 p-4 border-b">
            <Skeleton className="h-4 w-4 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Show empty state
  if (!notifications || notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <CheckCircle className="mb-2 h-8 w-8 text-muted-foreground/50" />
        <p className="text-sm font-medium">No notifications</p>
        <p className="text-xs text-muted-foreground">
          You're all caught up!
        </p>
      </div>
    );
  }

  // Show notifications
  return (
    <div>
      {unreadCount > 0 && (
        <div className="flex justify-end mb-4">
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs"
            onClick={() => dismissAllNotifications()}
          >
            Mark all as read
          </Button>
        </div>
      )}
      
      <div className="divide-y">
        {notifications.map((notification: Notification) => (
          <div 
            key={notification.id}
            className={cn(
              "flex items-start gap-3 p-4 transition-colors",
              !notification.dismissed && "bg-muted/40"
            )}
          >
            <div className="pt-1">
              {getNotificationIcon(notification.type)}
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-sm">
                {notification.link ? (
                  <a 
                    href={notification.link}
                    className="hover:underline"
                    onClick={() => dismissNotification(notification.id)}
                  >
                    {notification.body}
                  </a>
                ) : (
                  notification.body
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatTime(notification.created_at)}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => dismissNotification(notification.id)}
            >
              <X className="h-3 w-3" />
              <span className="sr-only">Dismiss</span>
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
