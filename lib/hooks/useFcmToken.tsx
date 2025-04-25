"use client";

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { getToken, onMessage, Unsubscribe } from 'firebase/messaging';
import { getMessagingInstance, fetchToken, requestNotificationPermission } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { FcmMessagePayload } from '@/lib/types/firebase';
import Image from 'next/image';
import React from 'react';

// Global flag to prevent multiple registrations
let hasRegisteredGlobally = false;

// Create a Context to share token across components
interface FcmContextType {
  token: string | null;
  notificationPermissionStatus: NotificationPermission | null;
}

const FcmContext = createContext<FcmContextType>({
  token: null,
  notificationPermissionStatus: null
});

// Export hook to use the FCM Context
export const useFcmContext = () => useContext(FcmContext);

// Export this function to be used by other components that need to get permission and token
export async function getNotificationPermissionAndToken(): Promise<string | null> {
  try {
    // First request permission
    const permissionResult = await requestNotificationPermission();
    if (permissionResult !== 'granted') {
      console.log('Notification permission was not granted.');
      return null;
    }

    // Then get token
    console.log('Notification permission granted, fetching token...');
    const token = await fetchToken();
    if (!token) {
      console.log('No FCM token received.');
      return null;
    }

    console.log(`FCM token received: ${token.substring(0, 10)}...`);
    return token;
  } catch (error) {
    console.error('Error getting notification permission or token:', error);
    return null;
  }
}

interface UseFcmTokenResult {
  token: string | null;
  notificationPermissionStatus: NotificationPermission | null;
}

export function useFcmToken(): UseFcmTokenResult {
  const [token, setToken] = useState<string | null>(null);
  const [notificationPermissionStatus, setNotificationPermissionStatus] = useState<NotificationPermission | null>(null);
  const hasRegisteredLocally = useRef(false);
  const router = useRouter();

  // First useEffect: Check permission state and set it
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const checkPermission = async () => {
      try {
        if (!('Notification' in window)) {
          console.log('This browser does not support notifications.');
          setNotificationPermissionStatus('denied');
          return;
        }
        
        // Get current permission state
        const permissionState = Notification.permission as NotificationPermission;
        setNotificationPermissionStatus(permissionState);
        console.log(`Current notification permission status: ${permissionState}`);
      } catch (err) {
        console.error('Error checking notification permission:', err);
      }
    };
    
    checkPermission();
  }, []);

  // Second useEffect: Handle token fetching
  useEffect(() => {
    // Don't attempt on server
    if (typeof window === 'undefined') return;
    
    // Don't attempt registration multiple times globally
    if (hasRegisteredGlobally) {
      console.log('FCM registration has already occurred globally');
      return;
    }
    
    // Don't attempt registration multiple times in this component instance
    if (hasRegisteredLocally.current) {
      console.log('FCM registration has already occurred locally');
      return;
    }

    const setupFcm = async () => {
      // Set flags to prevent duplicate calls
      hasRegisteredLocally.current = true;
      hasRegisteredGlobally = true;

      try {
        console.log('Attempting to load FCM token...');
        
        // Only proceed if notification permission was granted
        if (Notification.permission !== 'granted') {
          console.log('Notification permission not granted, skipping FCM setup.');
          return;
        }

        // Get messaging instance
        const messagingInstance = getMessagingInstance();
        if (!messagingInstance) {
          console.error('Failed to get messaging instance.');
          return;
        }

        // Get FCM token
        const currentToken = await getToken(messagingInstance, {
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
        });

        if (currentToken) {
          console.log(`FCM token loaded successfully: ${currentToken.substring(0, 10)}...`);
          setToken(currentToken);
        } else {
          console.log('No FCM token received.');
        }
      } catch (err) {
        console.error('Error setting up FCM:', err);
      }
    };

    setupFcm();

    // Cleanup function to set local flag to false
    return () => {
      hasRegisteredLocally.current = false;
    };
  }, [notificationPermissionStatus]);

  // Third useEffect: Store token in Supabase
  useEffect(() => {
    // Skip if no token or already registered
    if (!token || hasRegisteredLocally.current) {
      return;
    }

    const storeTokenInSupabase = async () => {
      try {
        console.log(`Storing FCM token in database: ${token.substring(0, 10)}...`);
        const response = await fetch('/api/fcm-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        if (!response.ok) {
          throw new Error(`Network response was not ok: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('FCM token stored in database:', data);
      } catch (error) {
        console.error('Error storing FCM token:', error);
      }
      hasRegisteredLocally.current = true;
    }
  }, [token]);

  useEffect(() => {
    let unsubscribe: Unsubscribe | undefined;

    // Only set up listener if we have a token
    const setupListener = async () => {
      if (!token || typeof window === 'undefined') {
        return;
      }

      console.log(`Setting up foreground message listener with token ${token.substring(0, 10)}...`);
      const messagingInstance = getMessagingInstance();
      if (!messagingInstance) {
        console.error('Failed to get messaging instance for listener setup.');
        return;
      }

      unsubscribe = onMessage(messagingInstance, (payload: FcmMessagePayload) => {
        console.log('🔔 FOREGROUND PUSH NOTIFICATION RECEIVED:', payload);
        
        // Extract all possible data from the message payload
        const notification = payload.notification;
        const title = notification?.title || 'New Message';
        const body = notification?.body || '';
        const iconUrl = notification?.icon || '/icons/android-lil-icon.png'; // Fallback icon
        
        // Try to get the link from various possible locations in the payload
        const link = payload.fcmOptions?.link || 
                     payload.data?.link || 
                     (payload.data && typeof payload.data === 'object' && 'url' in payload.data ? payload.data.url as string : undefined);

        console.log(`Showing toast notification - Title: "${title}", Body: "${body}"`);
        
        // Define icon element with fallback
        let toastIcon: React.ReactElement | undefined = undefined;
        try {
          if (iconUrl) {
            toastIcon = (
              <Image src={iconUrl} alt="notification icon" width={24} height={24} />
            );
          }
        } catch (err) {
          console.warn('Failed to create icon element:', err);
        }

        // Create action button if we have a link
        const toastAction = link ? {
          label: 'View',
          onClick: () => { 
            console.log(`Notification clicked, navigating to: ${link}`);
            if (link) router.push(link);
          },
        } : undefined;

        // Show toast notification (primary notification method)
        toast(title, {
          description: body,
          icon: toastIcon,
          action: toastAction,
          duration: 8000,
          position: 'top-right',
          important: true, // Make sure it gets attention
          className: 'notification-toast',
        });

        // Also try to show a system notification as fallback
        try {
          // Only show if we have permission and toast might not be visible
          if (Notification.permission === 'granted' && document.visibilityState !== 'visible') {
            console.log('Creating system notification as fallback...');
            
            const options: NotificationOptions = {
              body: body,
              icon: iconUrl,
              tag: `salem-pdx-${Date.now()}`,
              requireInteraction: true
            };
            
            if (link) {
              options.data = { url: link };
            }
            
            const n = new Notification(title, options);
  
            n.onclick = (event) => {
              event.preventDefault();
              console.log('System notification clicked');
              
              if (n.data && 'url' in n.data) {
                const url = n.data.url as string;
                console.log(`Navigating to: ${url}`);
                router.push(url);
                window.focus();
              }
              
              n.close();
            };
          }
        } catch (e) {
          console.error('Error showing system notification:', e);
          // System notification failed, but toast should still work
        }
      });

      console.log('Foreground message listener registered successfully');
    };

    setupListener();

    return () => {
      if (unsubscribe) {
        console.log('Cleaning up foreground message listener');
        unsubscribe();
      }
    };
  }, [token, router]);

  return { token, notificationPermissionStatus };
}

// Provider component to wrap your app
export function FcmProvider({ children }: { children: React.ReactNode }) {
  const { token, notificationPermissionStatus } = useFcmToken();
  
  return (
    <FcmContext.Provider value={{ token, notificationPermissionStatus }}>
      {children}
    </FcmContext.Provider>
  );
}