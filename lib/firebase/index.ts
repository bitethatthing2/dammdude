import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';
import { FirebaseConfig, FcmMessagePayload } from '@/lib/types/firebase';

// Add fallback values to ensure Firebase works even if environment variables are missing
const firebaseConfig: FirebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyB0Nxf3pvW32KBc0D1o2-K6qIeKovhGWfg',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'new1-f04b3.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'new1-f04b3',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'new1-f04b3.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '802463638703',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:802463638703:web:bd0bbdaf3407d784d5205a',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || 'G-3RZEW537LN'
  // clientId and clientSecret removed - should not be exposed in client config
};

// Log a warning if environment variables are missing
if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
  console.warn('Firebase environment variables are missing. Using fallback values.');
}

// Use VAPID key from environment variable with fallback
const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || 'BPAbU0G8rhAKE7ay5RepQ7N3V_CsdCKvmflQm0FncBbx4CHL0IfmGvdbdYUN90Vjn50JB7T9jzj268KhYJ34ikU';

// Global initialization flag to prevent multiple attempts
let isInitializing = false;
let initializationError: Error | null = null;

/**
 * Get or initialize the Firebase app
 */
const getFirebaseApp = () => {
  const apps = getApps();
  if (apps.length) return apps[0];
  return initializeApp(firebaseConfig);
};

/**
 * Initialize Firebase with improved error handling and retry logic
 */
export const initFirebase = async () => {
  // Prevent multiple simultaneous initialization attempts
  if (isInitializing) {
    console.log('Firebase initialization already in progress, waiting...');
    // Wait for current initialization to complete
    await new Promise(resolve => {
      const checkInterval = setInterval(() => {
        if (!isInitializing) {
          clearInterval(checkInterval);
          resolve(null);
        }
      }, 100);
    });
    
    // If previous initialization failed, throw the error
    if (initializationError) {
      throw initializationError;
    }
    
    return;
  }
  
  // Return if already initialized
  if (getApps().length) {
    console.log('Firebase already initialized');
    return;
  }
  
  isInitializing = true;
  initializationError = null;
  
  try {
    const app = initializeApp(firebaseConfig);
    console.log('Firebase initialized successfully');
    return app;
  } catch (error) {
    console.error('Error initializing Firebase:', error);
    initializationError = error instanceof Error ? error : new Error(String(error));
    throw error;
  } finally {
    isInitializing = false;
  }
};

/**
 * Get Firebase messaging instance with improved error handling
 */
export const getMessagingInstance = (): Messaging | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const app = getFirebaseApp();
    if (!app) return null;
    
    const messaging = getMessaging(app);
    return messaging;
  } catch (error) {
    console.error('Error getting Firebase messaging:', error);
    return null;
  }
};

/**
 * Request notification permission with improved error handling
 */
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  try {
    // Check if notification API is supported
    if (typeof window === 'undefined' || !('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return 'denied';
    }
    
    // Request permission
    const permission = await Notification.requestPermission();
    console.log(`Notification permission status: ${permission}`);
    return permission;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return 'denied';
  }
};

/**
 * Check if service worker is registered and active
 */
export const isServiceWorkerActive = async (): Promise<boolean> => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return false;
  }
  
  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    
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
};

/**
 * Register the Firebase messaging service worker
 */
export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.warn('Service workers are not supported in this browser');
    return null;
  }
  
  try {
    console.log('Registering Firebase messaging service worker');
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/'
    });
    
    console.log('Service worker registered successfully:', registration.scope);
    return registration;
  } catch (error) {
    console.error('Service worker registration failed:', error);
    return null;
  }
};

/**
 * Get FCM token with improved error handling and retry logic
 */
export const fetchToken = async (maxRetries = 2): Promise<string | null> => {
  if (typeof window === 'undefined') return null;
  
  let retryCount = 0;
  
  while (retryCount <= maxRetries) {
    try {
      // Initialize Firebase if not already initialized
      if (!getApps().length) {
        await initFirebase();
      }
      
      const messaging = getMessagingInstance();
      if (!messaging) {
        throw new Error('Failed to get messaging instance');
      }
      
      // Use the VAPID key from environment variable
      const vapidKey = VAPID_KEY;
      if (!vapidKey) {
        throw new Error('VAPID key is missing');
      }
      
      console.log(`Attempting to get FCM token (attempt ${retryCount + 1}/${maxRetries + 1})`);
      
      // Check if service worker is active
      const hasActiveServiceWorker = await isServiceWorkerActive();
      
      if (hasActiveServiceWorker) {
        // Get the active service worker registration
        const swRegistration = await navigator.serviceWorker.ready;
        
        // Try to get token with existing registration
        const token = await getToken(messaging, {
          vapidKey,
          serviceWorkerRegistration: swRegistration
        });
        
        if (token) {
          console.log('FCM token received successfully:', token.substring(0, 10) + '...');
          return token;
        }
        
        console.warn('No token received with existing service worker, will try clean registration');
      } else {
        console.log('No active service worker found, registering new one');
      }
      
      // If we get here, we need to try a clean registration
      // Unregister existing service workers
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
      }
      
      // Register a new service worker
      const newRegistration = await registerServiceWorker();
      if (!newRegistration) {
        throw new Error('Failed to register service worker');
      }
      
      // Wait for the service worker to be ready
      await navigator.serviceWorker.ready;
      
      // Try to get token with new registration
      const token = await getToken(messaging, {
        vapidKey,
        serviceWorkerRegistration: newRegistration
      });
      
      if (token) {
        console.log('FCM token received successfully after clean registration');
        return token;
      }
      
      throw new Error('Failed to get FCM token after clean registration');
    } catch (error) {
      console.error(`Error getting FCM token (attempt ${retryCount + 1}/${maxRetries + 1}):`, error);
      
      // Last attempt, try fallback method
      if (retryCount === maxRetries) {
        try {
          console.log('Trying fallback method to get FCM token');
          const messaging = getMessagingInstance();
          if (!messaging) return null;
          
          const fallbackToken = await getToken(messaging, { vapidKey: VAPID_KEY });
          
          if (fallbackToken) {
            console.log('FCM token received with fallback method');
            return fallbackToken;
          }
        } catch (fallbackError) {
          console.error('Fallback token method failed:', fallbackError);
        }
      }
      
      retryCount++;
      
      if (retryCount <= maxRetries) {
        // Wait before retrying (exponential backoff)
        const waitTime = Math.pow(2, retryCount) * 1000;
        console.log(`Retrying in ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  console.error('Failed to get FCM token after all retry attempts');
  return null;
};

/**
 * Handle foreground messages with improved error handling
 */
export const setupForegroundMessageHandler = (messaging: Messaging, callback?: (payload: FcmMessagePayload) => void) => {
  if (!messaging) {
    console.error('Cannot set up message handler: messaging instance is null');
    return () => {}; // Return no-op unsubscribe function
  }
  
  try {
    return onMessage(messaging, (payload: FcmMessagePayload) => {
      console.log('Foreground message received:', payload);
      
      try {
        // Call the callback if provided
        if (callback) {
          callback(payload);
        }
        
        // Create and show notification for foreground messages
        if (payload.notification && 'Notification' in window && Notification.permission === 'granted') {
          const { title, body, icon } = payload.notification;
          
          // Use the Notification API to show the notification
          new Notification(title || 'New Message', {
            body: body || 'You have a new notification',
            icon: icon || '/icons/android-big-icon.png'
          });
        }
      } catch (callbackError) {
        console.error('Error processing foreground message:', callbackError);
      }
    });
  } catch (error) {
    console.error('Error setting up message handler:', error);
    return () => {}; // Return no-op unsubscribe function
  }
};

export { onMessage };