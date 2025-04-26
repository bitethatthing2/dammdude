"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { useFcmContext, getNotificationPermissionAndToken } from '@/lib/hooks/useFcmToken';
import { toast } from "sonner";

export function FcmTokenRegistration() {
  const { token, notificationPermissionStatus, registerToken } = useFcmContext();
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Check if browser supports notifications
  const isSupported = typeof window !== 'undefined' && 'Notification' in window;
  const permission = notificationPermissionStatus || 'default';
  
  // Handle permission request and token registration
  const handleEnableNotifications = async () => {
    if (!isSupported || permission !== 'default') return;
    
    setIsRegistering(true);
    
    try {
      // This will trigger the native permission dialog
      const result = await Notification.requestPermission();
      
      if (result === 'granted') {
        // Register the token
        const fcmToken = await registerToken();
        
        if (fcmToken) {
          toast.success("Notifications enabled successfully", {
            description: "You'll receive important updates and announcements",
            duration: 5000,
          });
        } else {
          toast.error("Couldn't enable notifications", {
            description: "Please try again or check your browser settings",
            duration: 5000,
          });
        }
      } else if (result === 'denied') {
        toast.error("Notifications blocked", {
          description: "Please enable notifications in your browser settings to receive updates",
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast.error("Something went wrong", {
        description: "Couldn't enable notifications. Please try again later.",
        duration: 5000,
      });
    } finally {
      setIsRegistering(false);
    }
  };
  
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
        className={`w-full py-2 ${permission === 'granted' ? 'bg-secondary text-secondary-foreground' : 'bg-primary text-primary-foreground'}`}
        disabled={buttonDisabled || isRegistering}
        onClick={handleEnableNotifications}
      >
        <Bell className="mr-2 h-4 w-4" />
        {isRegistering ? 'Enabling...' : buttonText}
      </Button>
    </div>
  );
}
