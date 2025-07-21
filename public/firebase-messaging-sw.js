// Firebase Cloud Messaging Service Worker
// This handles push notifications when the app is in the background

importScripts('https://www.gstatic.com/firebasejs/10.11.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.11.0/firebase-messaging-compat.js');

// Initialize Firebase
firebase.initializeApp({
  apiKey: "AIzaSyAUWCAf5xHLMitmAgI5gfy8d2o48pnjXeo",
  authDomain: "sidehustle-22a6a.firebaseapp.com",
  projectId: "sidehustle-22a6a",
  storageBucket: "sidehustle-22a6a.firebasestorage.app",
  messagingSenderId: "993911155207",
  appId: "1:993911155207:web:610f19ac354d69540bd8a2"
});

// Get messaging instance
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);
  
  const notificationTitle = payload.notification?.title || 'Wolfpack Notification';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new notification',
    icon: '/icons/wolf-icon.png',
    badge: '/icons/notification-small-24x24.png',
    tag: payload.data?.notificationId || 'wolfpack-notification',
    data: payload.data,
    actions: [
      {
        action: 'open',
        title: 'Open'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ],
    requireInteraction: true,
    silent: false
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', function(event) {
  console.log('[firebase-messaging-sw.js] Notification click received.');
  
  event.notification.close();
  
  if (event.action === 'dismiss') {
    return;
  }
  
  // Handle the click - open the app or navigate to specific page
  const clickAction = event.action || 'open';
  const notificationData = event.notification.data;
  
  let urlToOpen = '/';
  
  // Navigate to specific page based on notification type
  if (notificationData?.type === 'wolfpack_message') {
    urlToOpen = '/wolfpack/chat';
  } else if (notificationData?.type === 'order_update') {
    urlToOpen = '/orders';
  } else if (notificationData?.link) {
    urlToOpen = notificationData.link;
  }
  
  event.waitUntil(
    clients.matchAll({
      type: 'window'
    }).then(function(clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Handle push event (additional handler)
self.addEventListener('push', function(event) {
  if (event.data) {
    const data = event.data.json();
    console.log('[firebase-messaging-sw.js] Push event received:', data);
    
    // If not handled by onBackgroundMessage, handle manually
    if (!data.notification) {
      const notificationTitle = data.title || 'Wolfpack Notification';
      const notificationOptions = {
        body: data.message || data.body || 'You have a new notification',
        icon: '/icons/wolf-icon.png',
        badge: '/icons/notification-small-24x24.png',
        tag: data.notificationId || 'wolfpack-notification',
        data: data,
        requireInteraction: true
      };
      
      event.waitUntil(
        self.registration.showNotification(notificationTitle, notificationOptions)
      );
    }
  }
});