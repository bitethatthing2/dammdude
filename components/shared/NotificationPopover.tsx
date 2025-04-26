"use client";

import { useState } from "react";
import { Bell, CheckCircle, Info, AlertTriangle, XCircle, X } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/lib/contexts/notification-context";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Component for displaying in-app notifications in a popover
 * Shows notification count badge and list of notifications with dismiss functionality
 */
export function NotificationPopover() {
  const [open, setOpen] = useState(false);
  const { 
    notifications, 
    unreadCount, 
    isLoading, 
    dismissNotification, 
    dismissAllNotifications 
  } = useNotifications();

  /**
   * Function to render the appropriate icon based on notification type
   * @param type - The type of notification (info, warning, error)
   * @returns The corresponding icon component
   */
  function getNotificationIcon(type: "info" | "warning" | "error") {
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
   * @param dateString - The date string to format
   * @returns The formatted time string
   */
  function formatTime(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    
    // If it's today, show relative time (e.g., "5 minutes ago")
    if (date.toDateString() === now.toDateString()) {
      return formatDistanceToNow(date, { addSuffix: true });
    }
    
    // Otherwise show the date
    return format(date, "MMM d, yyyy");
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative h-5 w-5 p-0"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span 
              className="absolute -right-1 -top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-destructive text-[0.625rem] font-medium text-destructive-foreground"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        align="end" 
        className="w-80 p-0"
        sideOffset={8}
      >
        <div className="flex items-center justify-between px-4 py-2">
          <h3 className="font-medium">Notifications</h3>
          {notifications.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-auto px-2 text-xs"
              onClick={() => dismissAllNotifications()}
            >
              Mark all as read
            </Button>
          )}
        </div>
        <Separator />
        
        <ScrollArea className="h-[min(calc(100vh-10rem),24rem)]">
          {isLoading ? (
            <div className="space-y-4 p-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-start gap-2">
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle className="mb-2 h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm font-medium">No notifications</p>
              <p className="text-xs text-muted-foreground">
                You're all caught up!
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
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
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
