/* eslint-disable */
// Cache names
const STATIC_CACHE_NAME = 'side-hustle-static-v1';
const DYNAMIC_CACHE_NAME = 'side-hustle-dynamic-v1';
const IMAGE_CACHE_NAME = 'side-hustle-images-v1';
const API_CACHE_NAME = 'side-hustle-api-v1';
const PAGE_CACHE_NAME = 'side-hustle-pages-v1';

// Assets to cache immediately on install
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/android-big-icon.png',
  '/icons/android-lil-icon-white.png'
];

// Routes that should be cached for offline access
const IMPORTANT_ROUTES = [
  '/',
  '/menu',
  '/orders',
  '/profile',
  '/locations'
];

// Cache strategies
const cacheStrategies = {
  // Cache first, falling back to network
  cacheFirst: async ({ request, fallbackUrl }) => {
    const cache = await caches.open(STATIC_CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    try {
      const networkResponse = await fetch(request);
      // Clone the response before using it
      const responseToCache = networkResponse.clone();
      
      // Only cache valid responses and GET requests
      if (responseToCache.status === 200 && request.method === 'GET') {
        cache.put(request, responseToCache);
      }
      
      return networkResponse;
    } catch (error) {
      // If network fails, try to return the fallback
      if (fallbackUrl) {
        const fallbackResponse = await cache.match(fallbackUrl);
        if (fallbackResponse) {
          return fallbackResponse;
        }
      }
      
      // Return a basic offline response if nothing else works
      return new Response('Network error occurred. You are offline.', {
        status: 503,
        headers: { 'Content-Type': 'text/plain' }
      });
    }
  },
  
  // Network first, falling back to cache
  networkFirst: async ({ request, cacheName = DYNAMIC_CACHE_NAME, fallbackUrl }) => {
    // Skip caching for non-GET requests
    if (request.method !== 'GET') {
      return fetch(request);
    }
    
    const cache = await caches.open(cacheName);
    
    try {
      const networkResponse = await fetch(request);
      // Clone the response before using it
      const responseToCache = networkResponse.clone();
      
      // Only cache valid responses
      if (responseToCache.status === 200) {
        cache.put(request, responseToCache);
      }
      
      return networkResponse;
    } catch (error) {
      const cachedResponse = await cache.match(request);
      
      if (cachedResponse) {
        return cachedResponse;
      }
      
      // If cache fails, try to return the fallback
      if (fallbackUrl) {
        const fallbackResponse = await cache.match(fallbackUrl);
        if (fallbackResponse) {
          return fallbackResponse;
        }
      }
      
      // Return a basic offline response if nothing else works
      return new Response('Network error occurred. You are offline.', {
        status: 503,
        headers: { 'Content-Type': 'text/plain' }
      });
    }
  },
  
  // Stale-while-revalidate strategy
  staleWhileRevalidate: async ({ request, fallbackUrl }) => {
    // Skip caching for non-GET requests
    if (request.method !== 'GET') {
      return fetch(request);
    }
    
    // Skip caching for certain URLs that might cause issues
    const url = new URL(request.url);
    const skipCachingPatterns = [
      // Skip API endpoints
      /\/api\//,
      // Skip Supabase URLs
      /supabase/,
      // Skip Firebase URLs
      /firebaseapp/,
      /googleapis/,
      // Skip analytics
      /analytics/,
      /\/gtag/,
      /\/ga/,
      // Skip socket connections
      /\/socket/,
      /\/ws/,
      /realtime/
    ];
    
    // Check if URL should be skipped for caching
    const shouldSkipCaching = skipCachingPatterns.some(pattern => 
      pattern.test(url.pathname) || pattern.test(url.hostname)
    );
    
    if (shouldSkipCaching) {
      try {
        return await fetch(request.clone());
      } catch (error) {
        console.log('Network request failed for non-cached URL:', url.pathname);
        return new Response('Network error', { status: 408 });
      }
    }
    
    try {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      const cachedResponse = await cache.match(request);
      
      // Return cached response immediately if available
      if (cachedResponse) {
        // Update the cache in the background without awaiting or logging errors
        setTimeout(() => {
          fetch(request.clone())
            .then(networkResponse => {
              if (networkResponse && networkResponse.ok) {
                cache.put(request, networkResponse.clone())
                  .catch(() => {}); // Silently handle cache put errors
              }
            })
            .catch(() => {}); // Silently handle network errors
        }, 1000);
        
        return cachedResponse;
      }
      
      // No cached response, try network
      try {
        const networkResponse = await fetch(request.clone());
        
        // Cache valid responses
        if (networkResponse && networkResponse.ok) {
          cache.put(request, networkResponse.clone())
            .catch(() => {}); // Silently handle cache put errors
        }
        
        return networkResponse;
      } catch (error) {
        // Network failed, try to return fallback
        if (fallbackUrl) {
          const fallbackResponse = await cache.match(fallbackUrl);
          if (fallbackResponse) {
            return fallbackResponse;
          }
        }
        
        // If we get here, both network and fallback failed
        return new Response('Network error occurred', { 
          status: 408, 
          statusText: 'Request Timeout',
          headers: new Headers({
            'Content-Type': 'text/plain'
          })
        });
      }
    } catch (error) {
      // Last resort error handling
      return new Response('Cache error occurred', { 
        status: 500, 
        statusText: 'Internal Error',
        headers: new Headers({
          'Content-Type': 'text/plain'
        })
      });
    }
  },
  
  // Network only strategy - no caching
  networkOnly: async ({ request }) => {
    return fetch(request);
  },
  
  // Cache only strategy - no network request
  cacheOnly: async ({ request, cacheName = STATIC_CACHE_NAME, fallbackUrl }) => {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If not in cache, try to return the fallback
    if (fallbackUrl) {
      const fallbackResponse = await cache.match(fallbackUrl);
      if (fallbackResponse) {
        return fallbackResponse;
      }
    }
    
    // Return offline page as last resort
    return new Response('You are offline and this content is not cached.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
};

// Helper function to determine which caching strategy to use based on the request
function getStrategy(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return {
      strategy: cacheStrategies.networkOnly,
      options: { request }
    };
  }
  
  // Handle navigation requests (HTML pages)
  if (request.mode === 'navigate') {
    // Check if it's a deep link that should be cached
    if (IMPORTANT_ROUTES.some(route => pathname === route || pathname.startsWith(`${route}/`))) {
      return {
        strategy: cacheStrategies.networkFirst,
        options: {
          request,
          cacheName: PAGE_CACHE_NAME,
          fallbackUrl: '/'
        }
      };
    }
    
    // Default navigation behavior
    return {
      strategy: cacheStrategies.networkFirst,
      options: {
        request,
        cacheName: DYNAMIC_CACHE_NAME,
        fallbackUrl: '/'
      }
    };
  }
  
  // Handle API requests
  if (pathname.includes('/api/')) {
    return {
      strategy: cacheStrategies.networkFirst,
      options: {
        request,
        cacheName: API_CACHE_NAME
      }
    };
  }
  
  // Handle image requests
  if (
    pathname.includes('.jpg') ||
    pathname.includes('.jpeg') ||
    pathname.includes('.png') ||
    pathname.includes('.gif') ||
    pathname.includes('.webp') ||
    pathname.includes('.svg') ||
    pathname.includes('/images/')
  ) {
    return {
      strategy: cacheStrategies.staleWhileRevalidate,
      options: {
        request,
        cacheName: IMAGE_CACHE_NAME
      }
    };
  }
  
  // Handle static assets
  if (
    pathname.includes('.js') ||
    pathname.includes('.css') ||
    pathname.includes('.woff') ||
    pathname.includes('.woff2') ||
    pathname.includes('.ttf') ||
    pathname.includes('/fonts/')
  ) {
    return {
      strategy: cacheStrategies.staleWhileRevalidate,
      options: {
        request,
        cacheName: STATIC_CACHE_NAME
      }
    };
  }
  
  // Default to network-first for everything else
  return {
    strategy: cacheStrategies.networkFirst,
    options: {
      request,
      cacheName: DYNAMIC_CACHE_NAME
    }
  };
}

// Background sync queue for offline operations
const syncQueue = new Map();

// Function to add an item to the sync queue
function addToSyncQueue(id, data) {
  syncQueue.set(id, {
    id,
    data,
    timestamp: Date.now()
  });
  
  // Save queue to IndexedDB
  saveQueueToIndexedDB();
  
  // Register a sync if possible
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    navigator.serviceWorker.ready.then(registration => {
      registration.sync.register('sync-data');
    });
  }
}

// Save queue to IndexedDB
function saveQueueToIndexedDB() {
  try {
    const db = openDatabase();
    if (!db) return;
    
    const transaction = db.transaction(['syncQueue'], 'readwrite');
    const store = transaction.objectStore('syncQueue');
    
    // Clear existing items
    store.clear();
    
    // Add current items
    syncQueue.forEach(item => {
      store.add(item);
    });
    
    console.log('Sync queue saved to IndexedDB');
  } catch (error) {
    console.error('Error saving sync queue to IndexedDB:', error);
  }
}

// Load queue from IndexedDB
async function loadQueueFromIndexedDB() {
  try {
    const db = await openDatabase();
    if (!db) {
      return;
    }
    
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction(['syncQueue'], 'readonly');
        const store = transaction.objectStore('syncQueue');
        const request = store.getAll();
        
        request.onsuccess = event => {
          const items = event.target.result || [];
          
          // Clear existing queue and add loaded items
          syncQueue.clear();
          if (Array.isArray(items)) {
            items.forEach(item => {
              if (item && item.id) {
                syncQueue.set(item.id, item);
              }
            });
          }
          
          console.log(`Loaded ${syncQueue.size} items from sync queue`);
          resolve();
        };
        
        request.onerror = event => {
          console.error('Error loading sync queue from IndexedDB:', event.target.error);
          reject(event.target.error);
        };
      } catch (error) {
        console.error('Error loading sync queue from IndexedDB:', error);
        reject(error);
      }
    });
  } catch (error) {
    console.error('Error in loadQueueFromIndexedDB:', error);
  }
}

// Open IndexedDB database
function openDatabase() {
  return new Promise((resolve, reject) => {
    try {
      if (!('indexedDB' in self)) {
        console.warn('IndexedDB not supported');
        resolve(null);
        return;
      }
      
      const request = indexedDB.open('sideHustleOfflineDB', 1);
      
      request.onupgradeneeded = event => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('syncQueue')) {
          db.createObjectStore('syncQueue', { keyPath: 'id' });
        }
      };
      
      request.onsuccess = event => {
        resolve(event.target.result);
      };
      
      request.onerror = event => {
        console.error('Error opening IndexedDB:', event.target.error);
        resolve(null);
      };
    } catch (error) {
      console.error('Error opening IndexedDB:', error);
      resolve(null);
    }
  });
}

// Process the sync queue
async function processSyncQueue() {
  if (syncQueue.size === 0) {
    console.log('No items in sync queue');
    return;
  }
  
  console.log(`Processing ${syncQueue.size} items in sync queue`);
  
  const successfulIds = [];
  
  for (const [id, item] of syncQueue.entries()) {
    try {
      // Determine the type of sync item and process accordingly
      if (item.data.type === 'order') {
        await syncOrder(item.data);
        successfulIds.push(id);
      } else if (item.data.type === 'profile') {
        await syncProfile(item.data);
        successfulIds.push(id);
      } else if (item.data.type === 'feedback') {
        await syncFeedback(item.data);
        successfulIds.push(id);
      } else {
        console.warn(`Unknown sync item type: ${item.data.type}`);
      }
    } catch (error) {
      console.error(`Error processing sync item ${id}:`, error);
    }
  }
  
  // Remove successful items from queue
  successfulIds.forEach(id => syncQueue.delete(id));
  
  // Save updated queue
  saveQueueToIndexedDB();
  
  console.log(`Processed ${successfulIds.length} items successfully, ${syncQueue.size} items remaining`);
}

// Sync functions for different data types
async function syncOrder(data) {
  const response = await fetch('/api/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    throw new Error(`Failed to sync order: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

async function syncProfile(data) {
  const response = await fetch('/api/profile', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    throw new Error(`Failed to sync profile: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

async function syncFeedback(data) {
  const response = await fetch('/api/feedback', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    throw new Error(`Failed to sync feedback: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

// Export functions for use in the main service worker
self.sideHustleCache = {
  STATIC_CACHE_NAME,
  DYNAMIC_CACHE_NAME,
  IMAGE_CACHE_NAME,
  API_CACHE_NAME,
  PAGE_CACHE_NAME,
  STATIC_ASSETS,
  getStrategy,
  addToSyncQueue,
  saveQueueToIndexedDB,
  loadQueueFromIndexedDB,
  processSyncQueue
};
