"use client";

import { Bell, BellOff, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useFcmContext } from '@/lib/hooks/useFcmToken';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface NotificationIndicatorProps {
  className?: string;
  variant?: 'icon' | 'button';
}

export function NotificationIndicator({ className, variant = 'icon' }: NotificationIndicatorProps) {
  const router = useRouter();
  const [permissionBlocked, setPermissionBlocked] = useState(false);
  const { 
    token,
    notificationPermissionStatus: permissionState, 
    error: tokenError,
    isLoading,
    registerToken
  } = useFcmContext();

  useEffect(() => {
    if ('Notification' in window) {
      setPermissionBlocked(Notification.permission === 'denied');
    }
  }, [permissionState]);

  // Return null if notifications are already granted
  if (permissionState === 'granted') {
    return null;
  }

  // Handle enabling notifications
  const handleToggleNotifications = async () => {
    if (permissionBlocked) {
      // If blocked, guide user to settings
      toast.error('Notifications are blocked', {
        description: 'Please enable notifications in your browser settings',
        duration: 5000,
      });
      return;
    }

    // Request permission and register token
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        console.log('Requesting notification permission...');
        toast.loading('Requesting notification permission...');
        
        const permission = await Notification.requestPermission();
        
        toast.dismiss();
        
        if (permission === 'granted') {
          toast.loading('Setting up notifications...');
          const token = await registerToken();
          
          toast.dismiss();
          
          if (token) {
            toast.success('Notifications enabled', {
              description: 'You will now receive important updates',
              duration: 3000,
            });
          } else {
            toast.error('Could not enable notifications', {
              description: 'Please try again later',
              duration: 3000,
            });
          }
        } else if (permission === 'denied') {
          setPermissionBlocked(true);
          toast.error('Notifications blocked', {
            description: 'Please enable notifications in your browser settings',
            duration: 3000,
          });
        }
      } catch (error) {
        console.error('Error requesting notification permission:', error);
        toast.error('Something went wrong', {
          duration: 3000,
        });
      }
    }
  };

  // Handle click on notification icon or button
  const handleClick = () => {
    handleToggleNotifications();
  };

  // Determine the status and tooltip content
  const getStatusInfo = () => {
    if (!('Notification' in window)) {
      return {
        icon: <Bell className="h-5 w-5 text-muted-foreground" />,
        tooltip: 'Your browser does not support notifications'
      };
    }

    if (permissionBlocked) {
      return {
        icon: (
          <div className="relative">
            <BellOff className="h-5 w-5 text-red-500" />
            <span className="absolute -right-1 -top-1 flex h-3 w-3 rounded-full bg-red-500 ring-1 ring-white" />
          </div>
        ),
        tooltip: 'Notifications are blocked. Please update your browser settings.'
      };
    }

    if (tokenError) {
      return {
        icon: (
          <div className="relative">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <span className="absolute -right-1 -top-1 flex h-3 w-3 rounded-full bg-red-500 ring-1 ring-white" />
          </div>
        ),
        tooltip: `Error enabling notifications: ${tokenError}`
      };
    }

    if (isLoading) {
      return {
        icon: <Bell className="h-5 w-5 animate-pulse" />,
        tooltip: 'Setting up notifications...'
      };
    }

    return {
      icon: (
        <div className="relative">
          {/* REMOVED text-muted-foreground to inherit from button */}
          <Bell className="h-5 w-5" /> 
          <span className="absolute -right-1 -top-1 flex h-3 w-3 rounded-full bg-red-500 ring-1 ring-white" />
        </div>
      ),
      tooltip: 'Enable notifications'
    };
  };

  const statusInfo = getStatusInfo();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {variant === 'icon' ? (
            <button
              type="button"
              onClick={handleClick}
              className={cn(
                "inline-flex items-center justify-center p-0 rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                className
              )}
              aria-label={statusInfo.tooltip}
            >
              {statusInfo.icon}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleClick}
              disabled={isLoading}
              className={cn(
                "inline-flex items-center gap-2 justify-center rounded-md px-4 py-2 text-sm font-medium",
                "bg-primary text-primary-foreground hover:bg-primary/90 dark:text-white",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                className
              )}
              aria-label={statusInfo.tooltip}
            >
              {statusInfo.icon} 
              <span>Enable Notifications</span>
            </button>
          )}
        </TooltipTrigger>
        <TooltipContent>
          <p>{statusInfo.tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
