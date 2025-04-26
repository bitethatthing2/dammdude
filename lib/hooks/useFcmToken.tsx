"use client";

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { getToken, onMessage, Unsubscribe } from 'firebase/messaging';
import { getMessagingInstance, fetchToken, requestNotificationPermission, setupForegroundMessageHandler } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { FcmMessagePayload } from '@/lib/types/firebase';
import React from 'react';

// Global flags to prevent multiple operations
let hasRegisteredGlobally = false;
let isRegistrationInProgress = false;
let registrationPromise: Promise<string | null> | null = null;

// Create a Context to share token across components
interface FcmContextType {
  token: string | null;
  notificationPermissionStatus: NotificationPermission | null;
  isLoading: boolean;
  error: string | null;
  registerToken: () => Promise<string | null>;
}

const FcmContext = createContext<FcmContextType>({
  token: null,
  notificationPermissionStatus: null,
  isLoading: false,
  error: null,
  registerToken: async () => null
});

// Export hook to use the FCM Context
export const useFcmContext = () => useContext(FcmContext);

// Helper to store token in database
const storeTokenInDatabase = async (tokenToStore: string): Promise<boolean> => {
  if (!tokenToStore) return false;
  
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
    return true;
  } catch (error) {
    console.error('Error storing FCM token:', error);
    return false;
  }
};

// Helper to subscribe to a topic
const subscribeToTopic = async (tokenToSubscribe: string, topic: string): Promise<boolean> => {
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
    return true;
  } catch (error) {
    console.error(`Error subscribing to topic '${topic}':`, error);
    return false;
  }
};

// Export this function to be used by other components that need to get permission and token
export async function getNotificationPermissionAndToken(): Promise<string | null> {
  // If registration is already in progress, return the existing promise
  if (isRegistrationInProgress && registrationPromise) {
    console.log('Token registration already in progress, returning existing promise');
    return registrationPromise;
  }
  
  // Set registration in progress flag
  isRegistrationInProgress = true;
  
  // Create a new registration promise
  registrationPromise = (async () => {
    try {
      // Request permission first
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
      
      // Store token in database
      await storeTokenInDatabase(token);
      
      // Set global registration flag
      hasRegisteredGlobally = true;
      
      return token;
    } catch (error) {
      console.error('Error getting notification permission or token:', error);
      return null;
    } finally {
      // Reset registration in progress flag
      isRegistrationInProgress = false;
    }
  })();
  
  return registrationPromise;
}

export function useFcmToken() {
  const [token, setToken] = useState<string | null>(null);
  const [notificationPermissionStatus, setNotificationPermissionStatus] = useState<NotificationPermission | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messageHandlerRef = useRef<Unsubscribe | null>(null);
  const hasRegisteredLocallyRef = useRef(false);
  const router = useRouter();

  // Check permission state on mount
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

  // Handle token fetching when permission is granted
  useEffect(() => {
    // Don't attempt on server
    if (typeof window === 'undefined') return;
    
    // Only proceed if notification permission was granted
    if (notificationPermissionStatus !== 'granted') {
      console.log('Notification permission not granted, skipping FCM setup.');
      return;
    }
    
    // Don't attempt registration multiple times globally or locally
    if (hasRegisteredGlobally || hasRegisteredLocallyRef.current) {
      console.log('FCM registration has already occurred, skipping');
      return;
    }
    
    // Set local registration flag
    hasRegisteredLocallyRef.current = true;
    
    const setupFcm = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        console.log('Attempting to load FCM token...');
        
        // Get FCM token
        const fcmToken = await getNotificationPermissionAndToken();
        
        if (fcmToken) {
          setToken(fcmToken);
          console.log('FCM token loaded and stored successfully');
          
          // Set up message handler
          setupMessageHandler(fcmToken);
        } else {
          console.warn('Failed to get FCM token');
          setError('Failed to get notification token');
        }
      } catch (err) {
        console.error('Error setting up FCM:', err);
        setError(err instanceof Error ? err.message : String(err));
        
        // Reset local registration flag on failure to allow retry
        hasRegisteredLocallyRef.current = false;
      } finally {
        setIsLoading(false);
      }
    };
    
    setupFcm();
  }, [notificationPermissionStatus]);

  // Set up message handler
  const setupMessageHandler = (currentToken: string) => {
    // Clean up existing handler if any
    if (messageHandlerRef.current) {
      messageHandlerRef.current();
      messageHandlerRef.current = null;
    }
    
    // Set up new handler
    try {
      const messaging = getMessagingInstance();
      if (!messaging) {
        console.error('Failed to get messaging instance for listener setup.');
        return;
      }
      
      console.log(`Setting up foreground message listener with token ${currentToken.substring(0, 10)}...`);
      
      messageHandlerRef.current = setupForegroundMessageHandler(messaging, (payload: FcmMessagePayload) => {
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
            important: true,
            action: link ? {
              label: 'View',
              onClick: () => {
                if (link) {
                  // Handle internal vs external links
                  if (link.startsWith('http')) {
                    window.open(link, '_blank');
                  } else {
                    router.push(link);
                  }
                }
              }
            } : undefined
          });
          
          // Try to also show a native notification if the page is not visible
          if (document.visibilityState !== 'visible' && Notification.permission === 'granted') {
            try {
              const notification = new Notification(title, { 
                body: body,
                icon: iconUrl
              });
              
              // Add click handler for native notification
              if (link) {
                notification.onclick = () => {
                  if (link.startsWith('http')) {
                    window.open(link, '_blank');
                  } else {
                    router.push(link);
                    window.focus();
                  }
                };
              }
            } catch (nativeError) {
              console.warn('Native notification failed:', nativeError);
            }
          }
        } catch (toastError) {
          console.error('Error showing notification:', toastError);
        }
      });
      
      console.log('Foreground message listener registered successfully');
    } catch (error) {
      console.error('Error setting up message handler:', error);
    }
  };

  // Clean up message handler on unmount
  useEffect(() => {
    return () => {
      if (messageHandlerRef.current) {
        console.log('Cleaning up foreground message listener');
        messageHandlerRef.current();
        messageHandlerRef.current = null;
      }
    };
  }, []);

  // Function to manually register token
  const registerToken = async (): Promise<string | null> => {
    if (isLoading) return null;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Reset local registration flag to allow registration
      hasRegisteredLocallyRef.current = false;
      
      // Request permission and get token
      const newToken = await getNotificationPermissionAndToken();
      
      if (newToken) {
        setToken(newToken);
        
        // Set up message handler
        setupMessageHandler(newToken);
        
        return newToken;
      } else {
        setError('Failed to get notification token');
        return null;
      }
    } catch (err) {
      console.error('Error registering token:', err);
      setError(err instanceof Error ? err.message : String(err));
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { 
    token, 
    notificationPermissionStatus,
    isLoading,
    error,
    registerToken
  };
}

// Provider component to wrap your app
export function FcmProvider({ children }: { children: React.ReactNode }) {
  const fcmState = useFcmToken();
  
  return (
    <FcmContext.Provider value={fcmState}>
      {children}
    </FcmContext.Provider>
  );
}