/* eslint-disable */
importScripts('https://www.gstatic.com/firebasejs/10.5.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.5.2/firebase-messaging-compat.js');
importScripts('/sw-cache.js');

// Firebase configuration - using compat mode for service worker
const firebaseConfig = {
  apiKey: "AIzaSyAUWCAf5xHLMitmAgI5gfy8d2o48pnjXeo",
  authDomain: "sidehustle-22a6a.firebaseapp.com",
  projectId: "sidehustle-22a6a",
  storageBucket: "sidehustle-22a6a.firebasestorage.app",
  messagingSenderId: "993911155207",
  appId: "1:993911155207:web:610f19ac354d69540bd8a2",
  measurementId: "G-RHT2310KWW"
};

// Check if Firebase configuration is complete
function isFirebaseConfigValid() {
  return firebaseConfig.apiKey && 
         firebaseConfig.authDomain && 
         firebaseConfig.projectId && 
         firebaseConfig.messagingSenderId && 
         firebaseConfig.appId;
}

// Validate configuration on load
if (!isFirebaseConfigValid()) {
  console.warn('[firebase-messaging-sw.js] Firebase configuration is incomplete. Some features may not work.');
}

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
  const url = new URL(event.request.url);
  
  // Skip React Server Component requests (_rsc parameter)
  if (url.searchParams.has('_rsc')) {
    return; // Let Next.js handle RSC requests directly
  }
  
  // Skip Next.js development server requests (HMR, static files, etc.)
  if (event.request.url.includes('/_next/') || 
      event.request.url.includes('__nextjs') ||
      event.request.url.includes('_buildManifest') ||
      event.request.url.includes('webpack-hmr') ||
      event.request.url.includes('hot-update') ||
      event.request.url.includes('__webpack') ||
      event.request.url.includes('_devPagesManifest')) {
    return; // Let Next.js handle these directly
  }

  // Skip cross-origin requests except for specific trusted domains
  if (!event.request.url.startsWith(self.location.origin) && 
      !event.request.url.includes('googleapis.com') && 
      !event.request.url.includes('gstatic.com') &&
      !event.request.url.includes('supabase.co')) {
    return;
  }
  
  // Skip Firebase messaging requests
  if (event.request.url.includes('firebase-messaging') ||
      event.request.url.includes('fcm/send')) {
    return;
  }
  
  // Skip non-GET requests - only GET requests can be safely cached
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip requests with cache-control: no-cache
  if (event.request.headers.get('cache-control') === 'no-cache') {
    return;
  }

  // Only handle requests if we have the cache utility loaded
  if (!self.sideHustleCache) {
    return;
  }
  
  // Handle requests with proper error responses
  event.respondWith(
    (async () => {
      try {
        // Only use cache utility if available, otherwise use normal fetch
        if (self.sideHustleCache && typeof self.sideHustleCache.getStrategy === 'function') {
          try {
            // Get the appropriate caching strategy for this request
            const { strategy, options } = self.sideHustleCache.getStrategy(event.request);
            
            // Apply the strategy with reasonable timeout (reduced from 30s to 10s)
            const response = await Promise.race([
              strategy(options),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Service worker timeout')), 10000)
              )
            ]);
            
            return response;
          } catch (cacheError) {
            console.warn('[Service Worker] Cache strategy failed, falling back to fetch:', cacheError);
            // Fall through to normal fetch
          }
        }
        
        // Fallback to normal fetch with shorter timeout
        return await Promise.race([
          fetch(event.request),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Fetch timeout')), 8000)
          )
        ]);
        
      } catch (error) {
        console.error('[Service Worker] Error in fetch handler:', error);
        
        // Return proper error response instead of throwing
        if (event.request.mode === 'navigate') {
          // For navigation requests, try to return cached offline page
          try {
            const offlineResponse = await caches.match('/offline.html');
            if (offlineResponse) {
              return offlineResponse;
            }
          } catch (offlineError) {
            console.warn('[Service Worker] Offline page not available:', offlineError);
          }
          
          // Return basic offline HTML if no cached page
          return new Response(
            `<!DOCTYPE html>
            <html>
            <head><title>Offline</title></head>
            <body><h1>You're offline</h1><p>Please check your internet connection.</p></body>
            </html>`,
            {
              status: 200,
              statusText: 'OK',
              headers: { 'Content-Type': 'text/html' }
            }
          );
        }
        
        // For other requests, try to return cached version if available
        try {
          const cachedResponse = await caches.match(event.request);
          if (cachedResponse) {
            console.log('[Service Worker] Returning cached response for failed request');
            return cachedResponse;
          }
        } catch (cacheError) {
          console.warn('[Service Worker] Cache lookup failed:', cacheError);
        }
        
        // Return appropriate error response as last resort
        return new Response(
          JSON.stringify({ error: 'Service unavailable', message: error.message }),
          {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
    })()
  );
});

// Background Sync
self.addEventListener('sync', event => {
  console.log(`[Service Worker] Background sync: ${event.tag}`);
  
  if (event.tag === 'sync-data') {
    event.waitUntil(self.sideHustleCache.processSyncQueue());
  }
});

// Initialize Firebase only if all required config values are present
if (isFirebaseConfigValid()) {
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

      // Extract notification data from data object first (preferred approach)
      // Fall back to notification object only if data is missing
      const notificationData = payload.data || {};
      
      // For iOS and desktop compatibility, also check the notification object
      // and merge with data to ensure consistent behavior across platforms
      if (payload.notification) {
        // Only use notification fields if they're not already in data
        Object.keys(payload.notification).forEach(key => {
          if (!notificationData[key]) {
            notificationData[key] = payload.notification[key];
          }
        });
      }
      
      // All notification content should come from payload.data
      // This ensures iOS and other platforms receive the same notification content
      const notificationTitle = notificationData.title || 'New Notification';
      const notificationBody = notificationData.body || '';
      
      // Extract any custom data for actions and UI
      const link = notificationData.link || '/';
      const orderId = notificationData.orderId || null;
      const image = notificationData.image || null;
      const linkButtonText = notificationData.linkButtonText || 'View';
      const actionButtonUrl = notificationData.actionButtonUrl || null;
      const actionButtonText = notificationData.actionButtonText || 'Action';
      
      // Use icons from payload data if available, otherwise use defaults
      // This ensures consistent icon display across all platforms
      const icon = notificationData.icon || '/icons/android-big-icon.png';
      const badge = notificationData.badge || '/icons/android-lil-icon-white.png';
      
      // Extract any additional custom data fields
      const customData = {};
      Object.keys(notificationData).forEach(key => {
        if (!['title', 'body', 'link', 'orderId', 'image', 'linkButtonText', 
              'actionButtonUrl', 'actionButtonText', 'icon', 'badge'].includes(key)) {
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
        icon: icon, // Log the exact icon path being used
        customData: Object.keys(customData)
      });
      
      // Configure notification options
      const notificationOptions = {
        body: notificationBody,
        // Use the icon from payload data or default
        icon: icon,
        // Use the badge from payload data or default
        badge: badge,
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
          actionButtonUrl,
          ...customData
        },
        // Configure actions based on provided buttons
        actions: []
      };

      // Add action buttons if provided
      if (actionButtonUrl && actionButtonText) {
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
          title: linkButtonText,
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
      
      // Log the notification data to help with debugging
      console.log('[firebase-messaging-sw.js] Notification data:', notificationData);
      
      // Default URL if none is provided
      let targetUrl = notificationData.url || '/';
      
      // Handle different action clicks
      if (event.action === 'action-button' && notificationData.actionButtonUrl) {
        targetUrl = notificationData.actionButtonUrl;
        console.log('[firebase-messaging-sw.js] Action button clicked, navigating to:', targetUrl);
      } else if (event.action === 'link-button' && notificationData.url) {
        targetUrl = notificationData.url;
        console.log('[firebase-messaging-sw.js] Link button clicked, navigating to:', targetUrl);
      } else if (event.action === 'view-order' && notificationData.orderId) {
        targetUrl = `/order/${notificationData.orderId}`;
        console.log('[firebase-messaging-sw.js] View order button clicked, navigating to:', targetUrl);
      } else {
        // Default click behavior (no specific action)
        console.log('[firebase-messaging-sw.js] Notification body clicked, navigating to:', targetUrl);
      }
      
      // Ensure URL is absolute
      if (!targetUrl.startsWith('http') && !targetUrl.startsWith('/')) {
        targetUrl = '/' + targetUrl;
      }
      
      // Focus on existing window or open a new one
      event.waitUntil(
        self.clients.matchAll({ type: 'window' })
          .then(clientList => {
            // Try to find an existing client
            for (const client of clientList) {
              if (client.url.includes(self.location.origin) && 'focus' in client) {
                // First focus the client
                client.focus();
                
                // Then navigate if it's a different URL
                if (client.url !== self.location.origin + targetUrl) {
                  return client.navigate(targetUrl);
                }
                
                return client;
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
