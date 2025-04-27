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
      // This check is causing issues - the permission state might be correct but not updating properly
      // Let's check the permission directly from the Notification API
      if (window.Notification && Notification.permission === 'granted') {
        console.log('Permission is actually granted according to Notification API, proceeding with FCM setup');
        // Update our state to match reality
        setNotificationPermissionStatus('granted');
      } else {
        console.log('Notification permission not granted, skipping FCM setup.');
        return;
      }
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
        
        // Extract data from both notification object and data field
        // This ensures we handle both notification+data messages and data-only messages
        const notificationObject = payload.notification || {};
        const dataObject = payload.data || {};
        
        // Prioritize data fields over notification fields for consistency with service worker
        const title = dataObject.title || notificationObject.title || 'New Message';
        const body = dataObject.body || notificationObject.body || '';
        const iconUrl = dataObject.icon || notificationObject.icon || '/icons/android-lil-icon.png';
        
        // Extract link from various possible locations
        const link = 
          dataObject.link || 
          payload.fcmOptions?.link || 
          // @ts-ignore - clickAction may exist in some notification payloads
          notificationObject.clickAction || 
          '/';
        
        // Extract image if available
        const image = dataObject.image || notificationObject.image;
        
        // Extract action buttons if available
        const actionButton = dataObject.actionButton;
        const actionButtonText = dataObject.actionButtonText;
        
        // Extract any additional custom data
        const customData: Record<string, any> = {};
        Object.keys(dataObject).forEach(key => {
          if (!['title', 'body', 'link', 'icon', 'image', 'actionButton', 'actionButtonText'].includes(key)) {
            try {
              // Try to parse JSON strings
              customData[key] = JSON.parse(dataObject[key]);
            } catch (e) {
              // If not JSON, use the raw value
              customData[key] = dataObject[key];
            }
          }
        });
        
        console.log(`Showing notification - Title: "${title}", Body: "${body}", Link: "${link}"`, customData);
        
        // Show toast notification (primary notification method)
        try {
          toast(title, {
            description: body,
            duration: 8000,
            important: true,
            icon: image ? undefined : <img src={iconUrl} alt="" className="w-6 h-6" />,
            // Show image if available
            ...(image && {
              style: {
                backgroundImage: `url(${image})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                paddingTop: '56px', // Make room for the image
              }
            }),
            action: {
              label: actionButtonText || 'View',
              onClick: () => {
                const targetUrl = actionButton || link;
                // Handle internal vs external links
                if (targetUrl.startsWith('http')) {
                  window.open(targetUrl, '_blank');
                } else {
                  router.push(targetUrl);
                }
              }
            }
          });
          
          // Try to also show a native notification if the page is not visible
          if (document.visibilityState !== 'visible' && Notification.permission === 'granted') {
            try {
              const notificationOptions: NotificationOptions = { 
                body: body,
                icon: iconUrl,
                requireInteraction: true,
                // @ts-ignore - vibrate is valid in modern browsers
                vibrate: [100, 50, 100],
                // @ts-ignore - badge is valid in modern browsers
                badge: '/icons/badge-icon.png',
                data: {
                  url: link,
                  actionButton,
                  ...customData
                }
              };
              
              // Add image if available
              if (image) {
                // @ts-ignore - image is valid in modern browsers
                notificationOptions.image = image;
              }
              
              // Add actions if available
              if (actionButton && actionButtonText) {
                // @ts-ignore - actions is valid in modern browsers
                notificationOptions.actions = [
                  {
                    action: 'action-button',
                    title: actionButtonText,
                    icon: '/icons/action-icon.png'
                  }
                ];
              }
              
              const notification = new Notification(title, notificationOptions);
              
              // Add click handler for native notification
              notification.onclick = (event) => {
                event.preventDefault(); // Prevent default action
                
                // Handle action button clicks
                if (event instanceof NotificationEvent && event.action === 'action-button' && actionButton) {
                  if (actionButton.startsWith('http')) {
                    window.open(actionButton, '_blank');
                  } else {
                    router.push(actionButton);
                    window.focus();
                  }
                } else {
                  // Default click behavior
                  if (link.startsWith('http')) {
                    window.open(link, '_blank');
                  } else {
                    router.push(link);
                    window.focus();
                  }
                }
                
                notification.close();
              };
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