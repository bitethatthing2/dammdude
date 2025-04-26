"use client";

import { Bell, BellOff, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useFcmContext } from '@/lib/hooks/useFcmToken';
import type { FirebaseMessagingError } from '@/lib/types/firebase';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export const NotificationStatus = () => {
  const [permissionBlocked, setPermissionBlocked] = useState(false);
  const { 
    token,
    notificationPermissionStatus: permissionState, 
    error: tokenError,
    isLoading
  } = useFcmContext();

  useEffect(() => {
    if ('Notification' in window) {
      // Check if permission is blocked by comparing the permission state
      setPermissionBlocked(Notification.permission === 'denied');
    }
  }, [permissionState]);

  // Determine the status icon and text
  const getStatusInfo = () => {
    if (!('Notification' in window)) {
      return {
        icon: <AlertCircle className="h-4 w-4 text-yellow-500" />,
        text: 'Not Supported',
        tooltip: 'Your browser does not support notifications',
        color: 'text-yellow-500'
      };
    }

    if (permissionBlocked) {
      return {
        icon: <BellOff className="h-4 w-4 text-red-500" />,
        text: 'Blocked',
        tooltip: 'Notifications are blocked. Please update your browser settings to enable them.',
        color: 'text-red-500'
      };
    }

    if (permissionState === 'granted' && token) {
      return {
        icon: <Bell className="h-4 w-4 text-green-500" />,
        text: 'Enabled',
        tooltip: 'Notifications are enabled for this device',
        color: 'text-green-500'
      };
    }

    if (tokenError) {
      return {
        icon: <AlertCircle className="h-4 w-4 text-red-500" />,
        text: 'Error',
        tooltip: `Error enabling notifications: ${tokenError}`,
        color: 'text-red-500'
      };
    }

    if (isLoading) {
      return {
        icon: <Bell className="h-4 w-4 animate-pulse" />,
        text: 'Loading',
        tooltip: 'Setting up notifications...',
        color: 'text-muted-foreground'
      };
    }

    return {
      icon: <Bell className="h-4 w-4 text-muted-foreground" />,
      text: 'Disabled',
      tooltip: 'Notifications are disabled. Click to enable.',
      color: 'text-muted-foreground'
    };
  };

  const statusInfo = getStatusInfo();

  // Function to open browser notification settings
  const openNotificationSettings = () => {
    if (navigator.permissions) {
      // This will prompt the user to change notification settings in some browsers
      void Notification.requestPermission();
    } else {
      // Fallback for browsers that don't support the Permissions API
      alert('Please update your browser notification settings to enable notifications.');
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            className={cn(
              "gap-1.5 h-8 px-2",
              statusInfo.color
            )}
            onClick={openNotificationSettings}
          >
            {statusInfo.icon}
            <span className="text-xs font-medium">
              {statusInfo.text}
            </span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{statusInfo.tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};