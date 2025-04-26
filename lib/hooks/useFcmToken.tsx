"use client";

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { getToken, onMessage, Unsubscribe } from 'firebase/messaging';
import { getMessagingInstance, fetchToken, requestNotificationPermission } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { FcmMessagePayload } from '@/lib/types/firebase';
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

// Helper to check if service worker is active
async function isServiceWorkerActive(): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return false;
  }
  
  try {
    // Get all service worker registrations
    const registrations = await navigator.serviceWorker.getRegistrations();
    
    // Check if any of them are active
    for (const registration of registrations) {
      if (registration.active) {
        console.log('Found active service worker:', registration.scope);
        return true;
      }
    }
    
    console.warn('No active service worker found');
    return false;
  } catch (error) {
    console.error('Error checking service worker status:', error);
    return false;
  }
}

// Wait for service worker to become active
async function waitForServiceWorker(maxWaitTime = 5000): Promise<boolean> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWaitTime) {
    if (await isServiceWorkerActive()) {
      return true;
    }
    
    // Wait 200ms before checking again
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  console.error('Timed out waiting for service worker to activate');
  return false;
}

// Export this function to be used by other components that need to get permission and token
export async function getNotificationPermissionAndToken(): Promise<string | null> {
  try {
    // First check for service worker
    const hasActiveServiceWorker = await waitForServiceWorker();
    if (!hasActiveServiceWorker) {
      console.warn('No active service worker available for push notifications');
      // We can still continue, but subscription might fail
    }
    
    // Then request permission
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

    const setupFcm = async () => {
      try {
        console.log('Attempting to load FCM token...');
        
        // Only proceed if notification permission was granted
        if (notificationPermissionStatus !== 'granted') {
          console.log('Notification permission not granted, skipping FCM setup.');
          return;
        }
        
        // Wait for service worker to be active
        const isSwActive = await waitForServiceWorker(8000);
        if (!isSwActive) {
          console.warn('Service worker not active, token subscription may fail');
          // We'll still try, as sometimes the service worker can be active even if our check fails
        }

        // Set flag to prevent duplicate calls
        hasRegisteredGlobally = true;

        // Get messaging instance
        const messagingInstance = getMessagingInstance();
        if (!messagingInstance) {
          console.error('Failed to get messaging instance.');
          return;
        }

        // Get FCM token
        console.log('Requesting FCM token...');
        
        try {
          const currentToken = await getToken(messagingInstance, {
            vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
          });

          if (currentToken) {
            console.log(`FCM token loaded successfully: ${currentToken.substring(0, 10)}...`);
            setToken(currentToken);
            
            // Immediately store the token
            storeTokenInDatabase(currentToken);
          } else {
            console.log('No FCM token received.');
          }
        } catch (tokenError) {
          console.error('Error getting FCM token:', tokenError);
          // Reset flag on failure to allow retry
          hasRegisteredGlobally = false;
        }
      } catch (err) {
        console.error('Error setting up FCM:', err);
        // Reset flag on failure to allow retry
        hasRegisteredGlobally = false;
      }
    };

    setupFcm();
  }, [notificationPermissionStatus]);

  // Helper function to store token in database
  const storeTokenInDatabase = async (tokenToStore: string) => {
    if (!tokenToStore) return;
    
    try {
      console.log(`Storing FCM token in database: ${tokenToStore.substring(0, 10)}...`);
      const response = await fetch('/api/fcm-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: tokenToStore }),
      });

      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('FCM token stored in database:', data);
      
      // Now try to subscribe to the all_devices topic
      await subscribeToTopic(tokenToStore, 'all_devices');
    } catch (error) {
      console.error('Error storing FCM token:', error);
    }
  };
  
  // Helper function to subscribe to a topic
  const subscribeToTopic = async (tokenToSubscribe: string, topic: string) => {
    try {
      console.log(`Subscribing token to topic '${topic}'...`);
      const response = await fetch('/api/subscribe-to-topic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: tokenToSubscribe, topic }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Subscription failed: ${errorData.error || 'Unknown error'}`);
      }

      const data = await response.json();
      console.log(`Successfully subscribed to topic '${topic}':`, data);
    } catch (error) {
      console.error(`Error subscribing to topic '${topic}':`, error);
    }
  };

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
                     (payload.data && typeof payload.data === 'object' && 'link' in payload.data ? 
                      payload.data.link as string : undefined);

        // Show toast notification (primary notification method)
        try {
          console.log(`Showing notification - Title: "${title}", Body: "${body}"`);
          
          toast(title, {
            description: body,
            duration: 8000,
            important: true
          });
          
          // Try to also show a native notification if the page is not visible
          if (document.visibilityState !== 'visible' && Notification.permission === 'granted') {
            try {
              // Create a notification without any complex options
              new Notification(title, { 
                body: body,
                icon: iconUrl
              });
            } catch (nativeError) {
              console.warn('Native notification failed:', nativeError);
            }
          }
          
          // Handle navigation if link is present and user clicks notification
          if (link) {
            // We can't directly attach to toast events in this simplified version
            // But the user can still click the notification to follow the link
            console.log(`Notification has link: ${link}`);
          }
        } catch (toastError) {
          console.error('Error showing notification:', toastError);
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