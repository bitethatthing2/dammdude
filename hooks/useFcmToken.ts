"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

// Extend Window interface to include Firebase
declare global {
  interface Window {
    firebase: {
      messaging: () => {
        getToken: (options: { 
          vapidKey: string | undefined, 
          serviceWorkerRegistration: ServiceWorkerRegistration | undefined 
        }) => Promise<string>;
        onTokenRefresh: (callback: () => void) => void;
        deleteToken: (token: string) => Promise<boolean>;
      };
    };
  }
}

interface UseFcmTokenOptions {
  onTokenChange?: (token: string | null) => void;
  saveToDatabase?: boolean;
}

/**
 * Hook to manage FCM token for push notifications
 * 
 * @param options Configuration options
 * @returns Object containing token state and management functions
 */
export function useFcmToken(options: UseFcmTokenOptions = {}) {
  const { onTokenChange, saveToDatabase = true } = options;
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [platform, setPlatform] = useState<'android' | 'ios' | 'web' | null>(null);

  // Detect platform
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const userAgent = window.navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setPlatform('ios');
    } else if (/android/.test(userAgent)) {
      setPlatform('android');
    } else {
      setPlatform('web');
    }
  }, []);

  // Initialize FCM and get token
  useEffect(() => {
    let isMounted = true;
    
    const initializeFcm = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Check if Firebase is available
        if (typeof window === 'undefined' || !window.firebase) {
          throw new Error('Firebase is not available');
        }
        
        const messaging = window.firebase.messaging();
        
        // iOS requires a different approach
        if (platform === 'ios') {
          // For iOS, we need to request permission after PWA installation
          // This is handled separately in the iOS installation guide
          setIsLoading(false);
          return;
        }
        
        // Request permission for other platforms
        try {
          const permission = await Notification.requestPermission();
          if (permission !== 'granted') {
            throw new Error('Notification permission denied');
          }
        } catch (err) {
          console.warn('Error requesting notification permission:', err);
          // Continue anyway, as some browsers handle this differently
        }
        
        // Get token
        try {
          await navigator.serviceWorker.ready;
          console.log('Service worker ready, now fetching token.');
          const registration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
          const currentToken = await messaging.getToken({
            vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
            serviceWorkerRegistration: registration
          });
          
          if (!currentToken) {
            throw new Error('No FCM token available');
          }
          
          // Save token to state
          if (isMounted) {
            setToken(currentToken);
            if (onTokenChange) onTokenChange(currentToken);
          }
          
          // Save token to database if enabled
          if (saveToDatabase) {
            await saveTokenToDatabase(currentToken);
            
            // Subscribe to all_devices topic
            try {
              console.log('Attempting to subscribe token to all_devices topic...');
              const response = await fetch('/api/subscribe-to-topic', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  token: currentToken,
                  topic: 'all_devices'
                }),
              });
              
              if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Subscription failed: ${errorData.error || response.statusText}`);
              }
              
              const data = await response.json();
              console.log('Successfully subscribed to all_devices topic:', data);
            } catch (err) {
              console.error('Error subscribing to all_devices topic:', err);
              // Don't throw here to prevent blocking token retrieval
            }
          }
        } catch (err) {
          console.error('Error getting FCM token:', err);
          throw err;
        }
        
        // Set up token refresh listener
        messaging.onTokenRefresh(async () => {
          try {
            const registration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
            const refreshedToken = await messaging.getToken({
              vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
              serviceWorkerRegistration: registration
            });
            
            if (isMounted) {
              setToken(refreshedToken);
              if (onTokenChange) onTokenChange(refreshedToken);
            }
            
            if (saveToDatabase) {
              await saveTokenToDatabase(refreshedToken);
            }
          } catch (err) {
            console.error('Failed to refresh token:', err);
            if (isMounted) {
              setError(err instanceof Error ? err : new Error('Failed to refresh token'));
            }
          }
        });
      } catch (err) {
        console.error('Error initializing FCM:', err);
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to initialize FCM'));
          setToken(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    // Only initialize if we have determined the platform
    if (platform) {
      initializeFcm();
    }
    
    return () => {
      isMounted = false;
    };
  }, [onTokenChange, saveToDatabase, platform]);
  
  // Function to save token to database
  const saveTokenToDatabase = async (fcmToken: string) => {
    try {
      // Get device info
      const deviceInfo = {
        platform: platform || navigator.platform,
        userAgent: navigator.userAgent,
        language: navigator.language,
        timestamp: new Date().toISOString()
      };
      
      // Save to Supabase
      const { error } = await supabase
        .from('fcm_tokens')
        .upsert(
          { 
            token: fcmToken,
            device_info: deviceInfo,
            last_used_at: new Date().toISOString()
          },
          { onConflict: 'token' }
        );
      
      if (error) {
        throw error;
      }
      
      console.log('FCM token saved to database');
    } catch (err) {
      console.error('Failed to save FCM token to database:', err);
      // Don't throw here, just log the error
    }
  };
  
  // Function to manually request permission and get token
  const requestPermission = async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Check if Firebase is available
      if (typeof window === 'undefined' || !window.firebase) {
        throw new Error('Firebase is not available');
      }
      
      const messaging = window.firebase.messaging();
      
      // Request permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Notification permission denied');
      }
      
      // Get token
      const registration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
      const currentToken = await messaging.getToken({
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
        serviceWorkerRegistration: registration
      });
      
      if (!currentToken) {
        throw new Error('No FCM token available');
      }
      
      setToken(currentToken);
      if (onTokenChange) onTokenChange(currentToken);
      
      // Save to database if enabled
      if (saveToDatabase) {
        await saveTokenToDatabase(currentToken);
      }
      
      return true;
    } catch (err) {
      console.error('Failed to request permission:', err);
      setError(err instanceof Error ? err : new Error('Failed to request permission'));
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to delete the token
  const deleteToken = async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Check if Firebase is available
      if (typeof window === 'undefined' || !window.firebase) {
        throw new Error('Firebase is not available');
      }
      
      // Check if we have a token to delete
      if (!token) {
        setToken(null);
        if (onTokenChange) onTokenChange(null);
        return true;
      }
      
      const messaging = window.firebase.messaging();
      
      // Delete the token from Firebase
      await messaging.deleteToken(token);
      
      // Delete from database if enabled
      if (saveToDatabase) {
        const { error } = await supabase
          .from('fcm_tokens')
          .delete()
          .eq('token', token);
        
        if (error) {
          throw error;
        }
      }
      
      setToken(null);
      if (onTokenChange) onTokenChange(null);
      
      return true;
    } catch (err) {
      console.error('Failed to delete FCM token:', err);
      setError(err instanceof Error ? err : new Error('Failed to delete FCM token'));
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    token,
    isLoading,
    error,
    platform,
    requestPermission,
    deleteToken
  };
}
