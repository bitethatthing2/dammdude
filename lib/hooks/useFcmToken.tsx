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
      const token = await fetchToken();
      if (!token) {
        return null;
      }

      
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
          setNotificationPermissionStatus('denied');
          return;
        }
        
        // Get current permission state
        const permissionState = Notification.permission as NotificationPermission;
        setNotificationPermissionStatus(permissionState);
      } catch (err) {
        console.error('Error checking notification permission:', err);
      }
    };
    
    checkPermission();
  }, []);

  // Setup message handlers if permission is granted
  useEffect(() => {
    // Skip setup if not in browser or already registered
    if (typeof window === 'undefined' || hasRegisteredLocallyRef.current) return;
    
    // Only proceed if notification permission is granted or if Notification API directly reports granted
    if (notificationPermissionStatus !== 'granted' && 
        !(window.Notification && Notification.permission === 'granted')) {
      return;
    }
    
    // Set up foreground message handler
    const setupMessageHandler = async () => {
      try {
        const messaging = getMessagingInstance();
        if (!messaging) return;
        
        // Clear previous handler if it exists
        if (messageHandlerRef.current) {
          messageHandlerRef.current();
          messageHandlerRef.current = null;
        }
        
        // Create new handler
        messageHandlerRef.current = setupForegroundMessageHandler(messaging, (payload) => {
          console.log('Foreground message received:', payload);
          
          // Extract data from payload
          const data = payload.data || {};
          const title = data.title || 'New Notification';
          const body = data.body || '';
          const link = data.link || '/';
          
          // Show toast notification for foreground messages
          toast(
            <div className="flex flex-col gap-1">
              <div className="font-medium">{title}</div>
              <div className="text-sm text-muted-foreground">{body}</div>
            </div>,
            {
              duration: 8000,
              action: {
                label: "View",
                onClick: () => {
                  if (link) {
                    if (link.startsWith('http')) {
                      window.open(link, '_blank');
                    } else {
                      router.push(link);
                    }
                  }
                }
              }
            }
          );
        });
        
      } catch (error) {
        console.error('Error setting up foreground message handler:', error);
      }
    };
    
    // Mark as registered to prevent duplicate registrations
    hasRegisteredLocallyRef.current = true;
    
    // Set up the handler
    setupMessageHandler();
    
    // Cleanup on unmount
    return () => {
      if (messageHandlerRef.current) {
        messageHandlerRef.current();
        messageHandlerRef.current = null;
      }
    };
  }, [notificationPermissionStatus, router]);

  // Handle token registration
  const registerToken = async (): Promise<string | null> => {
    // Prevent multiple registrations
    if (isLoading) return null;
    if (token) return token;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Check if browser supports notifications
      if (typeof window === 'undefined' || !('Notification' in window)) {
        throw new Error('This browser does not support notifications');
      }
      
      // Request permission if not already granted
      let permissionStatus = Notification.permission;
      if (permissionStatus !== 'granted') {
        permissionStatus = await Notification.requestPermission();
        setNotificationPermissionStatus(permissionStatus);
      }
      
      if (permissionStatus !== 'granted') {
        // Permission denied
        return null;
      }
      
      // Get FCM token using the centralized implementation
      const newToken = await getNotificationPermissionAndToken();
      if (!newToken) {
        throw new Error('Failed to get FCM token');
      }
      
      // Update state with new token
      setToken(newToken);
      return newToken;
    } catch (err) {
      console.error('Error registering FCM token:', err);
      setError(err instanceof Error ? err.message : 'Failed to register for notifications');
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
