"use client";

import { useEffect, useState } from 'react';

export default function ServiceWorkerRegister() {
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    // Feature detection for service workers
    if (!('serviceWorker' in navigator)) {
      console.warn('Service workers are not supported in this browser.');
      return;
    }

    const registerServiceWorker = async () => {
      try {
        // Wait for DOM to be fully loaded
        if (document.readyState !== 'complete') {
          await new Promise<void>((resolve) => {
            window.addEventListener('load', () => resolve(), { once: true });
          });
        }

        // Register the service worker with a more reliable approach
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
          scope: '/',
        });
        
        console.log('Service Worker registered with scope:', registration.scope);
        setSwRegistration(registration);
        
        // Ensure the service worker is activated
        if (registration.installing) {
          console.log('Service Worker installing');
          
          const installingWorker = registration.installing;
          installingWorker.addEventListener('statechange', () => {
            if (installingWorker.state === 'activated') {
              console.log('Service Worker activated');
              setSwRegistration(registration);
            }
          });
        } else if (registration.waiting) {
          console.log('Service Worker waiting');
          
          // Force waiting service worker to activate
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        } else if (registration.active) {
          console.log('Service Worker is active');
          
          // Ensure the service worker is controlling this page
          if (!navigator.serviceWorker.controller) {
            // Reload once to ensure the service worker controls this page
            window.location.reload();
            return;
          }
        }
        
        // Check for updates periodically
        setInterval(() => {
          registration.update().catch(err => {
            console.error('Error updating service worker:', err);
          });
        }, 60 * 60 * 1000); // Check every hour
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    };

    // Register service worker as soon as possible
    registerServiceWorker();
    
    // Listen for service worker updates
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('Service Worker updated and controlling the page');
    });
    
    // Listen for service worker messages
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'CACHE_UPDATED') {
        console.log('New content is available; please refresh.');
        // You could show a toast notification here if desired
      }
      
      // Handle notification actions
      if (event.data && event.data.type === 'NOTIFICATION_ACTION') {
        console.log('Notification action received:', event.data);
        // Handle notification actions here
      }
      
      // Handle offline/online status messages
      if (event.data && event.data.type === 'OFFLINE_STATUS') {
        console.log(`App is ${event.data.isOffline ? 'offline' : 'online'}`);
        // Could update UI to show offline status
      }
    });
    
    // Track PWA installation events
    const trackInstallationEvents = () => {
      // Track app installed event
      window.addEventListener('appinstalled', (event) => {
        console.log('PWA was installed');
        
        // Track installation for analytics
        try {
          if (typeof (window as any).gtag === 'function') {
            (window as any).gtag('event', 'pwa_installed', {
              event_category: 'pwa',
              event_label: 'app_installed'
            });
          }
        } catch (error) {
          console.error('Error tracking PWA installation:', error);
        }
      });
      
      // Track standalone mode
      if (window.matchMedia('(display-mode: standalone)').matches) {
        console.log('App is running in standalone mode');
        try {
          if (typeof (window as any).gtag === 'function') {
            (window as any).gtag('event', 'pwa_standalone', {
              event_category: 'pwa',
              event_label: 'standalone_mode'
            });
          }
        } catch (error) {
          console.error('Error tracking standalone mode:', error);
        }
      }
      
      // Track display mode changes
      window.matchMedia('(display-mode: standalone)').addEventListener('change', (event) => {
        console.log('Display mode changed:', event.matches ? 'standalone' : 'browser');
        try {
          if (typeof (window as any).gtag === 'function') {
            (window as any).gtag('event', 'display_mode_change', {
              event_category: 'pwa',
              event_label: event.matches ? 'standalone' : 'browser'
            });
          }
        } catch (error) {
          console.error('Error tracking display mode change:', error);
        }
      });
      
      // Track online/offline status
      window.addEventListener('online', () => {
        console.log('App is online');
        // Notify service worker about online status
        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'ONLINE_STATUS',
            isOnline: true
          });
        }
      });
      
      window.addEventListener('offline', () => {
        console.log('App is offline');
        // Notify service worker about offline status
        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'ONLINE_STATUS',
            isOnline: false
          });
        }
      });
    };
    
    trackInstallationEvents();
  }, []);

  return null;
}