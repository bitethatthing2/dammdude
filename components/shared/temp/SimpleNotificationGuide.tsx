"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";

interface NotificationGuideProps {
  variant?: 'button' | 'icon' | 'minimal';
  className?: string;
}

export default function NotificationGuide({ 
  variant = 'button',
  className = ''
}: NotificationGuideProps) {
  const [permissionState, setPermissionState] = useState<'default' | 'denied' | 'granted'>('default');

  // Check current notification permission on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermissionState(Notification.permission as 'default' | 'denied' | 'granted');
    }
  }, []);

  // Request notification permission
  const requestPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        setPermissionState(permission as 'default' | 'denied' | 'granted');
      } catch (error) {
        console.error('Error requesting notification permission:', error);
      }
    }
  };

  // Render based on variant
  if (variant === 'button') {
    return (
      <Button 
        onClick={requestPermission}
        className={`gap-2 bg-background text-foreground border border-input ${className}`}
        disabled={permissionState === 'granted'}
      >
        <Bell className="h-4 w-4" />
        {permissionState === 'granted' ? 'Notifications Enabled' : 'Enable Notifications'}
      </Button>
    );
  } 
  
  if (variant === 'icon') {
    return (
      <Button 
        onClick={requestPermission}
        variant="ghost" 
        size="icon"
        className={`bg-background text-foreground ${className}`}
        disabled={permissionState === 'granted'}
      >
        <Bell className="h-5 w-5" />
        <span className="sr-only">Enable Notifications</span>
      </Button>
    );
  }
  
  // Default minimal variant
  return (
    <span 
      onClick={requestPermission}
      className={`cursor-pointer flex items-center gap-1 text-foreground ${className}`}
    >
      <Bell className="h-4 w-4" />
      <span>{permissionState === 'granted' ? 'Notifications Enabled' : 'Enable Notifications'}</span>
    </span>
  );
}
