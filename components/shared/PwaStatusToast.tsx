"use client";

import { useState, useEffect } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { Download, Bell, CheckCircle2 } from "lucide-react";
import { onAppInstalled, isInstalled } from '@/lib/pwa/pwaEventHandler';

export function PwaStatusToast() {
  const { toast } = useToast();
  const [hasShownInstallToast, setHasShownInstallToast] = useState(false);
  const [hasShownNotificationToast, setHasShownNotificationToast] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if app was installed
    const handleAppInstalled = () => {
      if (!hasShownInstallToast) {
        toast({
          title: "App Installed Successfully",
          description: "You can now access PDX Sports Bar directly from your home screen.",
          duration: 5000,
          className: "bg-background text-foreground border border-input",
          action: (
            <div className="h-5 w-5 text-foreground">
              <CheckCircle2 className="h-full w-full" />
            </div>
          ),
        });
        setHasShownInstallToast(true);
        // Save to localStorage to prevent showing again
        localStorage.setItem('pwa-install-toast-shown', 'true');
      }
    };

    // Check if notification permission was granted
    const checkNotificationPermission = () => {
      if ('Notification' in window && 
          Notification.permission === 'granted' && 
          !hasShownNotificationToast &&
          !localStorage.getItem('pwa-notification-toast-shown')) {
        
        toast({
          title: "Notifications Enabled",
          description: "You'll now receive updates about events, promotions, and your orders.",
          duration: 5000,
          className: "bg-background text-foreground border border-input",
          action: (
            <div className="h-5 w-5 text-foreground">
              <Bell className="h-full w-full" />
            </div>
          ),
        });
        setHasShownNotificationToast(true);
        // Save to localStorage to prevent showing again
        localStorage.setItem('pwa-notification-toast-shown', 'true');
      }
    };

    // Check on initial load if we should show toasts
    if (localStorage.getItem('pwa-install-toast-shown')) {
      setHasShownInstallToast(true);
    }
    
    if (localStorage.getItem('pwa-notification-toast-shown')) {
      setHasShownNotificationToast(true);
    }

    // Check if the app is already installed
    if (isInstalled()) {
      handleAppInstalled();
    }

    // Use the centralized event handler instead of direct event listener
    const unsubscribeAppInstalled = onAppInstalled(() => {
      console.log('[PwaStatusToast] Received appinstalled event from centralized handler');
      handleAppInstalled();
    });
    
    // Check notification permission on visibility change (when user returns to the app)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        checkNotificationPermission();
      }
    });
    
    // Check notification permission on initial load
    checkNotificationPermission();

    return () => {
      unsubscribeAppInstalled();
      // No need to remove the direct event listener anymore
    };
  }, [toast, hasShownInstallToast, hasShownNotificationToast]);

  // This component doesn't render anything visible
  return null;
}
