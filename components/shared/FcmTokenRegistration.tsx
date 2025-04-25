"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useFcmContext } from '@/lib/hooks/useFcmToken';

export function FcmTokenRegistration() {
  const { token, notificationPermissionStatus } = useFcmContext();
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Check if browser supports notifications
  const isSupported = typeof window !== 'undefined' && 'Notification' in window;
  const permission = notificationPermissionStatus || 'default';
  
  // Determine the button state and text
  let buttonText = 'Enable Notifications';
  let buttonDisabled = false;
  let statusText = '';
  
  if (!isSupported) {
    buttonText = 'Notifications Not Supported';
    buttonDisabled = true;
    statusText = 'Your browser does not support notifications';
  } else if (permission === 'granted' && token) {
    buttonText = 'Notifications Enabled';
    buttonDisabled = true;
    statusText = 'You will receive notifications for new updates';
  } else if (permission === 'denied') {
    buttonText = 'Notifications Blocked';
    buttonDisabled = true;
    statusText = 'Please enable notifications in your browser settings';
  }
  
  return (
    <div className="p-4 bg-card rounded-lg border shadow-sm">
      <h3 className="text-lg font-semibold mb-2">Push Notifications</h3>
      
      <div className="mb-4">
        <p className="text-sm text-muted-foreground">
          {statusText || 'Get notified about new announcements and updates'}
        </p>
      </div>
      
      <Button 
        variant={permission === 'granted' ? 'outline' : 'default'} 
        size="sm"
        disabled={buttonDisabled || isRegistering}
        className="w-full"
        onClick={() => {
          // Just trigger a permission request, our context system will handle token registration
          if (isSupported && permission === 'default') {
            setIsRegistering(true);
            Notification.requestPermission().finally(() => {
              setIsRegistering(false);
            });
          }
        }}
      >
        {isRegistering ? 'Setting up...' : buttonText}
      </Button>
    </div>
  );
}
