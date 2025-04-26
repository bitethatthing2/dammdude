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
          '/icons/logo.png',
          '/icons/badge-icon.png'
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
              console.warn(`[Service Worker] Failed to cache ${url}: ${error.message}`);
              // Continue despite the failure
              return Promise.resolve();
            });
        });
        
        return Promise.all(cachePromises);
      })
      .catch(error => {
        console.error('[Service Worker] Error during pre-caching:', error);
      })
  );
});

self.addEventListener('activate', event => {
  console.log(`[Service Worker] Activating version ${SW_VERSION}`);
  
  // Claim control immediately
  event.waitUntil(self.clients.claim());
  
  // Clean up old caches
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cacheName => {
          return cacheName.startsWith('side-hustle-') && 
                 cacheName !== self.sideHustleCache.STATIC_CACHE_NAME;
        }).map(cacheName => {
          console.log(`[Service Worker] Deleting old cache: ${cacheName}`);
          return caches.delete(cacheName);
        })
      );
    })
  );
});

self.addEventListener('fetch', event => {
  // Skip Next.js development server requests (HMR, static files, etc.)
  if (event.request.url.includes('/_next/')) {
    return; // Let Next.js handle these directly
  }
  
  // Check if the request is for an icon
  if (event.request.url.includes('/icons/')) {
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        if (cachedResponse) {
          // Return cached icon
          return cachedResponse;
        }
        
        // Fetch and cache icon on the fly
        return fetch(event.request).then(response => {
          // Check if we received a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clone the response as it can only be consumed once
          const responseToCache = response.clone();
          
          caches.open(self.sideHustleCache.STATIC_CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
          
          return response;
        }).catch(() => {
          // If fetch fails, try to return a default icon
          return caches.match('/icons/logo.png');
        });
      })
    );
    return;
  }
  
  // For other requests, use our network-first strategy
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Only cache successful responses from our origin
        if (response.ok && response.url.startsWith(self.location.origin)) {
          const responseToCache = response.clone();
          caches.open(self.sideHustleCache.DYNAMIC_CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            })
            .catch(error => {
              console.warn(`[Service Worker] Failed to cache ${event.request.url}: ${error.message}`);
            });
        }
        return response;
      })
      .catch(() => {
        // If network request fails, try to serve from cache
        return caches.match(event.request);
      })
  );
});

// Initialize Firebase and handle background notifications
if (firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.messagingSenderId) {
  try {
    // Initialize Firebase
    // --- MODIFICATION START ---
    // Use the standard Firebase config defined earlier (firebaseConfig)
    firebase.initializeApp(firebaseConfig);
    
    // Get messaging and register a callback for background messages
    const messaging = firebase.messaging();

    // Define icon paths for notifications
    const DEFAULT_ICON = '/icons/android-big-icon.png';
    const SMALL_ICON = '/icons/android-lil-icon-white.png';
    
    // Override the default notification handler
    messaging.onBackgroundMessage(async (payload) => {
      console.log('[firebase-messaging-sw.js] Received background message', payload);
      
      // Extract notification data
      const notificationData = payload.notification || {};
      const dataPayload = payload.data || {};
      
      // Extract data from payload with fallbacks
      const title = notificationData.title || dataPayload.title || 'New Notification';
      const body = notificationData.body || dataPayload.body || '';
      const icon = notificationData.icon || dataPayload.icon || DEFAULT_ICON;
      const image = notificationData.image || dataPayload.image;
      const tag = dataPayload.tag || 'default';
      const clickAction = dataPayload.click_action || dataPayload.link || '/';
      
      // Prepare vibration pattern - important for Android notifications
      const vibrate = [200, 100, 200];
      
      try {
        // Show notification with proper icons
        const notificationOptions = {
          body,
          icon, // This is the large icon 
          badge: SMALL_ICON, // This is the small icon in the status bar
          vibrate,
          tag,
          data: {
            click_action: clickAction,
            ...dataPayload
          },
          actions: [
            {
              action: 'open',
              title: 'View',
              icon: SMALL_ICON
            }
          ]
        };
        
        if (image) {
          notificationOptions.image = image;
        }
        
        // Check if we have a valid registration and permission
        // This is needed for a service worker to show notifications on Android
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          console.log('[firebase-messaging-sw.js] Showing notification');
          
          // Actually show the notification
          await registration.showNotification(title, notificationOptions);
        } else {
          console.error('[firebase-messaging-sw.js] No service worker registration found');
        }
      } catch (error) {
        console.error('[firebase-messaging-sw.js] Error showing notification:', error);
      }
    });
    
    // Handle notification click
    self.addEventListener('notificationclick', (event) => {
      console.log('[firebase-messaging-sw.js] Notification clicked', event);
      
      // Close the notification
      event.notification.close();
      
      // Get action or default to 'open'
      const action = event.action || 'open';
      
      // Get data from the notification
      const notificationData = event.notification.data || {};
      
      // Determine URL to open
      let url = '/';
      
      if (action === 'open') {
        // Use click_action or link from data
        url = notificationData.click_action || notificationData.link || '/';
      }
      
      // If URL is relative, prepend origin
      if (url.startsWith('/')) {
        url = `${self.location.origin}${url}`;
      }
      
      console.log(`[firebase-messaging-sw.js] Opening URL: ${url}`);
      
      // Open the URL in an existing window/tab if possible
      event.waitUntil(
        self.clients.matchAll({
          type: 'window',
          includeUncontrolled: true
        })
        .then((clientList) => {
          // Check if there's already a window/tab open with the target URL
          for (const client of clientList) {
            if (client.url === url && 'focus' in client) {
              return client.focus();
            }
          }
          // If no window/tab is open with the URL, open a new one
          if (self.clients.openWindow) {
            return self.clients.openWindow(url);
          }
        })
        .catch((error) => {
          console.error('[firebase-messaging-sw.js] Error handling click:', error);
        })
      );
    });

    console.log('[firebase-messaging-sw.js] Firebase Messaging initialized successfully');
  } catch (error) {
    console.error("[firebase-messaging-sw.js] Error initializing Firebase:", error);
  }
} else {
  console.warn("[firebase-messaging-sw.js] Firebase configuration is incomplete. Skipping initialization.");
}