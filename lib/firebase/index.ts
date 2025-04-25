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

const getFirebaseApp = () => {
  const apps = getApps();
  if (apps.length) return apps[0];
  return initializeApp(firebaseConfig);
};

export const initFirebase = () => {
  if (!getApps().length) {
    try {
      initializeApp(firebaseConfig);
      console.log('Firebase initialized successfully');
    } catch (error) {
      console.error('Error initializing Firebase:', error);
      throw error;
    }
  }
};

/**
 * Get Firebase messaging instance
 * @returns Firebase messaging instance
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
 * Request notification permission
 * @returns Permission status
 */
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  try {
    // Check if notification API is supported
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return 'denied';
    }
    
    // Request permission
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return 'denied';
  }
};

/**
 * Get FCM token for push notifications
 * @returns FCM token
 */
export const fetchToken = async (): Promise<string | null> => {
  try {
    const messaging = getMessagingInstance();
    if (!messaging) return null;
    
    // Use the VAPID key from environment variable
    const vapidKey = VAPID_KEY;
    if (!vapidKey) {
      console.error('VAPID key is missing in environment variables (NEXT_PUBLIC_FIREBASE_VAPID_KEY)');
      return null;
    }
    
    console.log('Using VAPID key:', vapidKey.substring(0, 10) + '...');
    
    try {
      // First try with existing service worker
      const existingRegistration = await navigator.serviceWorker.ready;
      if (existingRegistration && existingRegistration.active) {
        try {
          // Try to get token with existing registration
          const token = await getToken(messaging, {
            vapidKey,
            serviceWorkerRegistration: existingRegistration
          });
          
          if (token) {
            console.log('FCM token received successfully with existing service worker');
            return token;
          }
        } catch (existingError) {
          console.warn('Could not get token with existing service worker, will try clean registration', existingError);
        }
      }
      
      // If we get here, we need to try a clean registration
      console.log('Attempting clean service worker registration');
      
      // Force a clean registration by unregistering existing service workers
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (let registration of registrations) {
        await registration.unregister();
      }
      console.log('Unregistered existing service workers');
      
      // Re-register the service worker
      await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
        scope: '/'
      });
      console.log('Re-registered service worker');
      
      // Wait for the service worker to be ready again
      const newRegistration = await navigator.serviceWorker.ready;
      
      // Get token with the new registration
      const currentToken = await getToken(messaging, {
        vapidKey,
        serviceWorkerRegistration: newRegistration
      });
      
      if (!currentToken) {
        console.warn('No FCM token available after clean registration');
        return null;
      }
      
      console.log('FCM token received successfully after clean registration');
      return currentToken;
    } catch (swError) {
      console.error('Service worker registration error:', swError);
      
      // Last resort - try without specifying service worker registration
      try {
        const fallbackToken = await getToken(messaging, {
          vapidKey
        });
        
        if (fallbackToken) {
          console.log('FCM token received with fallback method');
          return fallbackToken;
        }
      } catch (fallbackError) {
        console.error('Fallback token method failed:', fallbackError);
      }
      
      return null;
    }
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
};

// Handle foreground messages
export const setupForegroundMessageHandler = (messaging: Messaging, callback?: (payload: FcmMessagePayload) => void) => {
  return onMessage(messaging, (payload: FcmMessagePayload) => {
    console.log('Foreground message received:', payload);
    
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
  });
};

export { onMessage };