"use client";

import { useState, useEffect } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { Bell, CheckCircle2 } from "lucide-react";
import { onAppInstalled } from '@/lib/pwa/pwaEventHandler';

export function PwaStatusToast() {
  const { toast } = useToast();
  const [hasShownNotificationToast, setHasShownNotificationToast] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Register for appinstalled events - but don't show a toast here
    // The PwaInstallGuide component will handle showing the installation success toast
    const unregisterAppInstalled = onAppInstalled(() => {
      // Just update localStorage to prevent showing again
      try {
        localStorage.setItem('pwa-install-toast-shown', 'true');
      } catch (error) {
        console.error('[PwaStatusToast] Error updating localStorage:', error);
      }
    });

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
        try {
          localStorage.setItem('pwa-notification-toast-shown', 'true');
        } catch (error) {
          console.error('[PwaStatusToast] Error updating localStorage:', error);
        }
      }
    };

    // Check notification permission on mount and when it changes
    checkNotificationPermission();
    
    // Listen for permission changes
    const handlePermissionChange = () => {
      checkNotificationPermission();
    };
    
    // Add event listener if supported
    if ('Notification' in window && 'onchange' in Notification) {
      // @ts-ignore - TypeScript doesn't recognize onchange on the Notification object
      Notification.onchange = handlePermissionChange;
    }

    return () => {
      unregisterAppInstalled();
      if ('Notification' in window && 'onchange' in Notification) {
        // @ts-ignore
        Notification.onchange = null;
      }
    };
  }, [toast, hasShownNotificationToast]);

  return null; // This component doesn't render anything
}
