'use client';

import { useState } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Bell, Check, CheckCheck, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useSafeNotifications, type Notification } from '@/lib/contexts/unified-notification-context';
import { NotificationIndicator } from './NotificationIndicator';

/**
 * Unified notification popover component
 * Displays notifications in a popover with tabs for unread and all notifications
 */
export function NotificationPopover() {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('unread');
  
  // Safely get notifications context - returns null if not available
  const context = useSafeNotifications();
  
  const notifications = context?.notifications || [];
  const unreadCount = context?.unreadCount || 0;
  const dismissNotification = context?.dismissNotification || (async (id: string) => {});
  const dismissAllNotifications = context?.dismissAllNotifications || (async () => {});
  const refreshNotifications = context?.refreshNotifications || (async () => {});
  const isLoading = context?.isLoading || false;
  
  // Get unread notifications
  const unreadNotifications = notifications.filter(
    notification => notification.status === 'unread'
  );
  
  // Get all notifications
  const allNotifications = notifications;
  
  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      return 'Date unknown';
    }
  };
  
  // Get icon based on notification type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order_new':
        return <Bell className="h-4 w-4 text-blue-500" />;
      case 'order_ready':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'info':
        return <Bell className="h-4 w-4 text-gray-500" />;
      case 'warning':
        return <Bell className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <Bell className="h-4 w-4 text-red-500" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };
  
  // Handle marking notifications as read
  const handleDismissAll = async () => {
    await dismissAllNotifications();
    setActiveTab('all');
  };
  
  // Handle clicking a notification
  const handleNotificationClick = async (id: string, link?: string) => {
    await dismissNotification(id);
    
    // Navigate to link if provided
    if (link) {
      window.location.href = link;
    }
    
    setOpen(false);
  };
  
  // Handle refresh
  const handleRefresh = () => {
    refreshNotifications();
  };
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div>
          <NotificationIndicator onClick={() => setOpen(!open)} />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[350px] p-0" align="end">
        <div className="flex items-center justify-between px-4 py-2 border-b">
          <h4 className="font-medium">Notifications</h4>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <Clock className="h-4 w-4" />
              <span className="sr-only">Refresh</span>
            </Button>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleDismissAll}
              >
                <CheckCheck className="h-4 w-4" />
                <span className="sr-only">Mark all as read</span>
              </Button>
            )}
          </div>
        </div>
        
        <Tabs
          defaultValue="unread"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="unread" className="relative">
              Unread
              {unreadCount > 0 && (
                <span className="ml-1.5 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  {unreadCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
          
          <TabsContent value="unread" className="p-0">
            <ScrollArea className="max-h-[300px] overflow-y-auto">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="animate-spin h-6 w-6 border-2 border-primary rounded-full border-t-transparent"></div>
                  <p className="text-sm text-muted-foreground mt-2">Loading notifications...</p>
                </div>
              ) : unreadNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="bg-muted/50 rounded-full p-3 mb-2">
                    <CheckCheck className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">All caught up!</p>
                </div>
              ) : (
                <div>
                  {unreadNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="py-2 px-4 hover:bg-muted/50 cursor-pointer border-b last:border-0"
                      onClick={() => handleNotificationClick(notification.id, notification.link)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium line-clamp-2">{notification.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDate(notification.created_at)}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-50 hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            dismissNotification(notification.id);
                          }}
                        >
                          <Check className="h-3 w-3" />
                          <span className="sr-only">Mark as read</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="all" className="p-0">
            <ScrollArea className="max-h-[300px] overflow-y-auto">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="animate-spin h-6 w-6 border-2 border-primary rounded-full border-t-transparent"></div>
                  <p className="text-sm text-muted-foreground mt-2">Loading notifications...</p>
                </div>
              ) : allNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="bg-muted/50 rounded-full p-3 mb-2">
                    <Bell className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">No notifications</p>
                </div>
              ) : (
                <div>
                  {allNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`py-2 px-4 hover:bg-muted/50 cursor-pointer border-b last:border-0 ${
                        notification.status === 'unread' ? 'bg-muted/20' : ''
                      }`}
                      onClick={() => handleNotificationClick(notification.id, notification.link)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm line-clamp-2 ${notification.status === 'unread' ? 'font-medium' : ''}`}>
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDate(notification.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}

export default NotificationPopover;
