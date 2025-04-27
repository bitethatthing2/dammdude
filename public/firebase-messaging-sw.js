/* eslint-disable */
importScripts('https://www.gstatic.com/firebasejs/10.5.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.5.2/firebase-messaging-compat.js');
importScripts('/sw-cache.js');

// Service worker version
const SW_VERSION = '1.0.7';

// Firebase configuration (PUBLIC Client-Side Values)
// !! IMPORTANT !!: Replace these placeholders with your ACTUAL values from .env.local
// These values WILL be publicly visible in the browser's service worker code.
// DO NOT include sensitive keys like FIREBASE_ADMIN_* or GOOGLE_OAUTH_CLIENT_SECRET here.
const firebaseConfig = {
  apiKey: "AIzaSyB0Nxf3pvW32KBc0D1o2-K6qIeKovhGWfg",             // Replace with value from .env.local
  authDomain: "new1-f04b3.firebaseapp.com",       // Replace with value from .env.local
  projectId: "new1-f04b3",        // Replace with value from .env.local
  storageBucket: "new1-f04b3.firebasestorage.app",  // Replace with value from .env.local
  messagingSenderId: "802463638703", // Replace with value from .env.local
  appId: "1:802463638703:web:bd0bbdaf3407d784d5205a",              // Replace with value from .env.local
  measurementId: "G-3RZEW537LN" // Optional, replace if you use it
};

// Service Worker Lifecycle Events
self.addEventListener('install', event => {
  console.log(`[Service Worker] Installing version ${SW_VERSION}`);
  
  // Skip waiting to activate the new service worker immediately
  self.skipWaiting();
  
  // Pre-cache static assets with individual caching to handle missing files
  event.waitUntil(
    caches.open(self.sideHustleCache.STATIC_CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Pre-caching static assets');
        
        // List of files to cache - only include files that actually exist
        const filesToCache = [
          '/',
          '/icons/android-big-icon.png',
          '/icons/android-lil-icon-white.png',
          '/icons/view-order-icon.png',
          '/icons/link-icon.png',
          '/icons/action-icon.png'
        ];
        
        // Cache each file individually to prevent one failure from stopping all caching
        const cachePromises = filesToCache.map(url => {
          return fetch(url)
            .then(response => {
              if (!response.ok) {
                throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
              }
              return cache.put(url, response);
            })
            .catch(error => {
              console.warn(`[Service Worker] Could not cache ${url}:`, error.message);
              // Continue despite this file failing
              return Promise.resolve();
            });
        });
        
        return Promise.all(cachePromises);
      })
      .then(() => {
        console.log('[Service Worker] Pre-caching completed successfully');
      })
      .catch(error => {
        console.error('[Service Worker] Pre-caching failed:', error);
      })
  );
});

self.addEventListener('activate', event => {
  console.log(`[Service Worker] Activating version ${SW_VERSION}`);
  
  // Take control of all clients immediately
  event.waitUntil(self.clients.claim());
  
  // Clean up old caches
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            // Delete any cache that doesn't match our current cache names
            const isCurrentCache = 
              cacheName === self.sideHustleCache.STATIC_CACHE_NAME ||
              cacheName === self.sideHustleCache.DYNAMIC_CACHE_NAME ||
              cacheName === self.sideHustleCache.IMAGE_CACHE_NAME ||
              cacheName === self.sideHustleCache.API_CACHE_NAME;
            
            if (!isCurrentCache) {
              console.log(`[Service Worker] Deleting old cache: ${cacheName}`);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        // Try to load any pending sync queue from IndexedDB
        try {
          return self.sideHustleCache.loadQueueFromIndexedDB();
        } catch (error) {
          console.warn('[Service Worker] Error loading queue from IndexedDB:', error);
          return Promise.resolve();
        }
      })
  );
});

// Fetch event - handle network requests with appropriate caching strategies
self.addEventListener('fetch', event => {
  // Skip Next.js development server requests (HMR, static files, etc.)
  if (event.request.url.includes('/_next/')) {
    return; // Let Next.js handle these directly
  }

  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin) && 
      !event.request.url.includes('googleapis.com') && 
      !event.request.url.includes('gstatic.com') &&
      !event.request.url.startsWith('http://') &&
      !event.request.url.startsWith('https://')) {
    return;
  }
  
  // Skip Firebase messaging requests
  if (event.request.url.includes('firebase-messaging')) {
    return;
  }
  
  // Skip POST requests - they can't be cached
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Get the appropriate caching strategy for this request
  const { strategy, options } = self.sideHustleCache.getStrategy(event.request);
  
  // Apply the strategy
  event.respondWith(strategy(options));
});

// Background Sync
self.addEventListener('sync', event => {
  console.log(`[Service Worker] Background sync: ${event.tag}`);
  
  if (event.tag === 'sync-data') {
    event.waitUntil(self.sideHustleCache.processSyncQueue());
  }
});

// Initialize Firebase only if all required config values are present
if (firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.messagingSenderId) {
  try {
    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);

    // Get a Messaging instance.
    const messaging = firebase.messaging();

    console.log('[firebase-messaging-sw.js] Firebase initialized');

    /**
     * Handle background messages and show notifications
     * @param {object} payload - Push notification payload
     */
    messaging.onBackgroundMessage((payload) => {
      console.log('[firebase-messaging-sw.js] onBackgroundMessage HANDLER TRIGGERED');
      console.log('[firebase-messaging-sw.js] Received background message ', payload);

      // Extract notification data from either data or notification object
      // This handles both data-only messages and notification+data messages
      const notificationData = payload.data || {};
      const notificationObject = payload.notification || {};
      
      // Use data fields first, fall back to notification object fields
      // This ensures we prioritize custom data fields over FCM-generated notification fields
      const notificationTitle = notificationData.title || notificationObject.title || 'New Notification';
      const notificationBody = notificationData.body || notificationObject.body || '';
      
      // Extract any custom data
      const link = notificationData.link || notificationObject.link || '/';
      const orderId = notificationData.orderId || null;
      const image = notificationData.image || notificationObject.image || null;
      const linkButtonText = notificationData.linkButtonText || null;
      const actionButton = notificationData.actionButton || null;
      const actionButtonText = notificationData.actionButtonText || null;
      
      // Extract any additional custom data fields
      const customData = {};
      Object.keys(notificationData).forEach(key => {
        if (!['title', 'body', 'link', 'orderId', 'image', 'linkButtonText', 'actionButton', 'actionButtonText'].includes(key)) {
          try {
            // Try to parse JSON strings in case they contain objects
            customData[key] = JSON.parse(notificationData[key]);
          } catch (e) {
            // If not JSON, use the raw value
            customData[key] = notificationData[key];
          }
        }
      });
      
      console.log('[firebase-messaging-sw.js] Preparing to show notification:', {
        title: notificationTitle,
        body: notificationBody,
        link,
        orderId,
        hasImage: !!image,
        customData: Object.keys(customData)
      });
      
      // Configure notification options
      const notificationOptions = {
        body: notificationBody,
        // Large icon for notification drawer (full color)
        icon: '/icons/android-big-icon.png',
        // Badge icon for Android (monochrome)
        badge: '/icons/android-lil-icon-white.png',
        // Add image if provided
        ...(image && { image }),
        // Enable vibration
        vibrate: [100, 50, 100],
        // Make notification persistent until clicked
        requireInteraction: true,
        // Add data for the click handler
        data: {
          url: link,
          orderId,
          ...customData
        },
        // Configure actions based on provided buttons
        actions: []
      };

      // Add action buttons if provided
      if (actionButton && actionButtonText) {
        notificationOptions.actions.push({
          action: 'action-button',
          title: actionButtonText,
          icon: '/icons/action-icon.png'
        });
      }

      // Add link button if provided
      if (link && linkButtonText) {
        notificationOptions.actions.push({
          action: 'link-button',
          title: linkButtonText || 'View',
          icon: '/icons/link-icon.png'
        });
      }

      // Add order button if orderId is provided
      if (orderId) {
        notificationOptions.actions.push({
          action: 'view-order',
          title: 'View Order',
          icon: '/icons/view-order-icon.png'
        });
      }

      // Show the notification
      return self.registration.showNotification(notificationTitle, notificationOptions);
    });
    
    // Handle notification click
    self.addEventListener('notificationclick', (event) => {
      console.log('[firebase-messaging-sw.js] Notification clicked', event);
      
      // Close the notification
      event.notification.close();
      
      // Get notification data
      const notificationData = event.notification.data || {};
      let targetUrl = notificationData.url || '/';
      
      // Handle different action clicks
      if (event.action === 'action-button' && notificationData.actionButton) {
        targetUrl = notificationData.actionButton;
      } else if (event.action === 'link-button' && notificationData.url) {
        targetUrl = notificationData.url;
      } else if (event.action === 'view-order' && notificationData.orderId) {
        targetUrl = `/order/${notificationData.orderId}`;
      }
      
      // Ensure URL is absolute
      if (!targetUrl.startsWith('http') && !targetUrl.startsWith('/')) {
        targetUrl = '/' + targetUrl;
      }
      
      // Focus on existing window or open a new one
      event.waitUntil(
        self.clients.matchAll({ type: 'window' })
          .then(clientList => {
            // Check if there's already a window/tab open with the target URL
            for (const client of clientList) {
              if (client.url.includes(targetUrl) && 'focus' in client) {
                return client.focus();
              }
            }
            
            // If no window is open with that URL, open a new one
            if (self.clients.openWindow) {
              return self.clients.openWindow(targetUrl);
            }
          })
          .catch(error => {
            console.error('[firebase-messaging-sw.js] Error handling notification click:', error);
          })
      );
    });
  } catch (error) {
    console.error("[firebase-messaging-sw.js] Error initializing Firebase:", error);
  }
} else {
  console.warn("[firebase-messaging-sw.js] Firebase configuration is incomplete. Skipping initialization.");
}