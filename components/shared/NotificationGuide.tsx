"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { useFcmToken, getNotificationPermissionAndToken } from '@/lib/hooks/useFcmToken';

interface NotificationGuideProps {
  variant?: 'button' | 'icon' | 'minimal';
  className?: string;
}

export default function NotificationGuide({ 
  variant = 'button',
  className = ''
}: NotificationGuideProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { notificationPermissionStatus: permissionState } = useFcmToken();

  // Request notification permission and register FCM token
  const handleRequestPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setIsLoading(true);
      try {
        const token = await getNotificationPermissionAndToken();
        if (token) {
          console.log('FCM token registered successfully after permission request');
        } else {
          console.warn('Failed to register FCM token after permission request');
        }
      } catch (error) {
        console.error('Error requesting notification permission:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Render based on variant
  if (variant === 'button') {
    return (
      <Button 
        onClick={handleRequestPermission}
        className={`gap-2 bg-primary text-primary-foreground border-0 ${className}`}
        disabled={permissionState === 'granted' || isLoading}
      >
        <Bell className={`h-4 w-4 ${isLoading ? 'animate-pulse' : ''}`} />
        {isLoading 
          ? 'Enabling...' 
          : permissionState === 'granted' 
            ? 'Notifications Enabled' 
            : 'Enable Notifications'}
      </Button>
    );
  } 
  
  if (variant === 'icon') {
    return (
      <Button 
        onClick={handleRequestPermission}
        variant="ghost" 
        size="icon"
        className={`bg-primary text-primary-foreground ${className}`}
        disabled={permissionState === 'granted' || isLoading}
      >
        <Bell className={`h-5 w-5 ${isLoading ? 'animate-pulse' : ''}`} />
        <span className="sr-only">{isLoading ? 'Enabling...' : permissionState === 'granted' ? 'Notifications Enabled' : 'Enable Notifications'}</span>
      </Button>
    );
  }
  
  // Default minimal variant
  return (
    <span 
      onClick={handleRequestPermission}
      className={`cursor-pointer flex items-center gap-1 text-foreground ${className}`}
    >
      <Bell className={`h-4 w-4 ${isLoading ? 'animate-pulse' : ''}`} />
      <span>{isLoading ? 'Enabling...' : permissionState === 'granted' ? 'Notifications Enabled' : 'Enable Notifications'}</span>
    </span>
  );
}
