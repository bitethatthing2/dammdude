"use client";

import { Bell, BellOff, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useFcmToken } from '@/lib/hooks/useFcmToken';
import type { FirebaseMessagingError } from '@/lib/types/firebase';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export const NotificationStatus = () => {
  const [permissionState, setPermissionState] = useState<NotificationPermission>('default');
  const [permissionBlocked, setPermissionBlocked] = useState(false);
  const token = useFcmToken();

  useEffect(() => {
    if ('Notification' in window) {
      // Defer the initial state check slightly
      const timerId = setTimeout(() => {
        setPermissionState(Notification.permission);
      }, 0);

      // Listen for changes in permission
      const checkPermission = () => {
        setPermissionState(Notification.permission);
      };
      
      document.addEventListener('visibilitychange', checkPermission);
      
      // Cleanup function
      return () => {
        clearTimeout(timerId); // Clear the timeout if component unmounts
        document.removeEventListener('visibilitychange', checkPermission);
      };
    }
  }, []);

  const requestPermission = async () => {
    if ('Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        setPermissionState(permission);
        setPermissionBlocked(false);
      } catch (error) {
        console.error('Error requesting notification permission:', error as FirebaseMessagingError);
        // Check if error is permission-blocked
        const fcmError = error as FirebaseMessagingError;
        if (fcmError.code === 'messaging/permission-blocked') {
          setPermissionBlocked(true);
        }
      }
    }
  };

  // Determine if notifications are enabled
  const isEnabled = permissionState === 'granted' && !!token;
  const isDenied = permissionState === 'denied' || permissionBlocked;

  // Instructions for enabling notifications if blocked
  const getInstructions = () => {
    const browser = navigator.userAgent.includes('Chrome') ? 'Chrome' : 
                   navigator.userAgent.includes('Firefox') ? 'Firefox' : 
                   navigator.userAgent.includes('Safari') ? 'Safari' : 'your browser';
    
    return `To enable notifications, click the lock icon in your address bar, then change the notification permission for this site in ${browser} settings.`;
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon"
            className="h-9 w-9 relative border border-primary"
            onClick={requestPermission}
            disabled={isDenied}
          >
            {isEnabled ? (
              <>
                <Bell className="h-5 w-5" />
                <span className="absolute h-2 w-2 rounded-full bg-green-500 top-1.5 right-1.5"></span>
              </>
            ) : isDenied ? (
              <AlertCircle className="h-5 w-5 text-muted-foreground" />
            ) : (
              <BellOff className="h-5 w-5" />
            )}
            <span className="sr-only">
              {isEnabled ? 'Notifications enabled' : isDenied ? 'Notifications blocked' : 'Enable notifications'}
            </span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {isEnabled ? (
            <p>Notifications are enabled</p>
          ) : isDenied ? (
            <p className="max-w-xs">{getInstructions()}</p>
          ) : (
            <p>Enable push notifications</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};