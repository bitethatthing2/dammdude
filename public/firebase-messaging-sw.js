/* eslint-disable */
importScripts('https://www.gstatic.com/firebasejs/10.5.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.5.2/firebase-messaging-compat.js');
importScripts('/sw-cache.js');

// Service worker version
const SW_VERSION = '1.0.8';

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
          '/icons/android-lil-icon-white.png'
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
    // --- MODIFICATION START ---
    // Use the standard Firebase config defined earlier (firebaseConfig)
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

      // Extract notification data
      const notificationTitle = payload.notification?.title || 'Side Hustle';
      const notificationBody = payload.notification?.body || '';
      
      // Extract any custom data
      const link = payload.fcmOptions?.link || payload.data?.link || '/';
      const orderId = payload.data?.orderId || null;
      const image = payload.notification?.image || payload.data?.image || null;
      const linkButtonText = payload.data?.linkButtonText || null;
      const actionButton = payload.data?.actionButton || null;
      const actionButtonText = payload.data?.actionButtonText || null;
      
      console.log('[firebase-messaging-sw.js] Preparing to show notification:', {
        title: notificationTitle,
        body: notificationBody,
        link,
        orderId,
        hasImage: !!image
      });
      
      // Configure notification options
      const notificationOptions = {
        body: notificationBody,
        // Large icon for notification drawer (full color)
        icon: payload.notification?.icon || '/icons/android-big-icon.png',
        // Badge icon for Android (monochrome)
        badge: '/icons/android-lil-icon-white.png',
        // Add image if provided
        ...(image && { image }),
        // Add actions based on context
        ...((orderId || (link && linkButtonText) || (actionButton && actionButtonText)) && {
          actions: [
            ...(orderId ? [{
              action: 'view-order',
              title: 'View Order',
              icon: '/icons/android-big-icon.png'
            }] : []),
            ...(link && linkButtonText ? [{
              action: 'open-link',
              title: linkButtonText,
              icon: '/icons/android-lil-icon-white.png'
            }] : []),
            ...(actionButton && actionButtonText ? [{
              action: actionButton,
              title: actionButtonText,
              icon: '/icons/android-lil-icon-white.png'
            }] : [])
          ]
        }),
        // Store data for when notification is clicked
        data: {
          url: link,
          orderId,
          ...payload.data
        },
        // Ensure notification is shown even if app is in foreground
        requireInteraction: true,
        // Add vibration pattern
        vibrate: [200, 100, 200],
        // Add a tag to group similar notifications
        tag: `sidehustle-${Date.now()}`
      };
      
      // Show the notification
      self.registration.showNotification(notificationTitle, notificationOptions);
    });
    
    // Handle notification click
    self.addEventListener('notificationclick', (event) => {
      console.log('[firebase-messaging-sw.js] Notification clicked', event);
      
      // Close the notification
      event.notification.close();
      
      // Get stored data from the notification
      const data = event.notification.data || {};
      
      // Handle specific actions
      if (event.action === 'view-order' && data.orderId) {
        // Navigate to order details
        const orderUrl = `/orders/${data.orderId}`;
        console.log(`[firebase-messaging-sw.js] Navigating to order: ${orderUrl}`);
        
        // Focus or open a window and navigate to the order
        event.waitUntil(
          self.clients.matchAll({ type: 'window' })
            .then(clientList => {
              // Try to focus an existing window
              for (const client of clientList) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                  return client.focus().then(focusedClient => {
                    return focusedClient.navigate(orderUrl);
                  });
                }
              }
              
              // If no existing window, open a new one
              if (self.clients.openWindow) {
                return self.clients.openWindow(orderUrl);
              }
            })
        );
      } else if (event.action === 'open-link' && data.link) {
        // Navigate to the specified link
        console.log(`[firebase-messaging-sw.js] Navigating to link: ${data.link}`);
        
        event.waitUntil(
          self.clients.matchAll({ type: 'window' })
            .then(clientList => {
              // Try to focus an existing window
              for (const client of clientList) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                  return client.focus().then(focusedClient => {
                    return focusedClient.navigate(data.link);
                  });
                }
              }
              
              // If no existing window, open a new one
              if (self.clients.openWindow) {
                return self.clients.openWindow(data.link);
              }
            })
        );
      } else if (event.action && event.action === data.actionButton) {
        // Handle custom action button
        console.log(`[firebase-messaging-sw.js] Custom action: ${event.action}`);
        
        // For now, just navigate to the link if provided
        if (data.link) {
          event.waitUntil(
            self.clients.matchAll({ type: 'window' })
              .then(clientList => {
                // Try to focus an existing window
                for (const client of clientList) {
                  if (client.url.includes(self.location.origin) && 'focus' in client) {
                    return client.focus().then(focusedClient => {
                      return focusedClient.navigate(data.link);
                    });
                  }
                }
                
                // If no existing window, open a new one
                if (self.clients.openWindow) {
                  return self.clients.openWindow(data.link);
                }
              })
          );
        }
      } else {
        // Default action - navigate to the URL stored in the notification
        const url = data.url || '/';
        console.log(`[firebase-messaging-sw.js] Default navigation to: ${url}`);
        
        event.waitUntil(
          self.clients.matchAll({ type: 'window' })
            .then(clientList => {
              // Try to focus an existing window
              for (const client of clientList) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                  return client.focus().then(focusedClient => {
                    return focusedClient.navigate(url);
                  });
                }
              }
              
              // If no existing window, open a new one
              if (self.clients.openWindow) {
                return self.clients.openWindow(url);
              }
            })
        );
      }
    });
  } catch (error) {
    console.error("[firebase-messaging-sw.js] Error initializing Firebase:", error);
  }
} else {
  console.warn("[firebase-messaging-sw.js] Firebase configuration is incomplete. Skipping initialization.");
}