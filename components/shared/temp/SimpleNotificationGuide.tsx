/**
 * @deprecated This component is deprecated and will be removed in a future release.
 * Please use NotificationGuide from '@/components/shared/NotificationGuide' instead.
 * This component exists only for backward compatibility.
 */

"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFcmContext, getNotificationPermissionAndToken } from '@/lib/hooks/useFcmToken';

interface SimpleNotificationGuideProps {
  variant?: 'button' | 'icon' | 'minimal';
  className?: string;
}

/**
 * @deprecated Use NotificationGuide from '@/components/shared/NotificationGuide' instead
 */
export function SimpleNotificationGuide({ 
  variant = 'button',
  className = ''
}: SimpleNotificationGuideProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { notificationPermissionStatus } = useFcmContext();
  
  // Check if browser supports notifications
  const isSupported = typeof window !== 'undefined' && 'Notification' in window;
  const permissionState = notificationPermissionStatus || 'default';

  // Request notification permission and register FCM token
  const handleRequestPermission = async () => {
    if (!isSupported) return;
    
    setIsLoading(true);
    try {
      const token = await getNotificationPermissionAndToken();
      if (token) {
        console.log('FCM token registered successfully');
      } else {
        console.warn('Failed to register FCM token');
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Render based on variant
  if (variant === 'button') {
    return (
      <Button 
        onClick={handleRequestPermission}
        className={cn("gap-2 bg-background text-foreground border border-input", className)}
        disabled={permissionState === 'granted' || isLoading}
      >
        <Bell className={cn("h-4 w-4", isLoading && "animate-pulse")} />
        {isLoading 
          ? 'Enabling...' 
          : permissionState === 'granted' 
            ? 'Notifications Enabled' 
            : 'Enable Notifications'}
      </Button>
    );
  } 
  
  if (variant === 'icon') {
    // Use a custom button element to avoid TypeScript issues with the Button component
    return (
      <button
        onClick={handleRequestPermission}
        className={cn(
          "inline-flex items-center justify-center rounded-md text-sm font-medium",
          "h-9 w-9 bg-transparent hover:bg-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          "disabled:pointer-events-none disabled:opacity-50",
          className
        )}
        disabled={permissionState === 'granted' || isLoading}
        type="button"
        aria-label={isLoading ? 'Enabling...' : permissionState === 'granted' ? 'Notifications Enabled' : 'Enable Notifications'}
      >
        <Bell className={cn("h-5 w-5", isLoading && "animate-pulse")} />
      </button>
    );
  }
  
  // Default minimal variant
  return (
    <span 
      onClick={handleRequestPermission}
      className={cn("cursor-pointer flex items-center gap-1 text-foreground", className)}
    >
      <Bell className={cn("h-4 w-4", isLoading && "animate-pulse")} />
      <span>
        {isLoading 
          ? 'Enabling...' 
          : permissionState === 'granted' 
            ? 'Notifications Enabled' 
            : 'Enable Notifications'}
      </span>
    </span>
  );
}
