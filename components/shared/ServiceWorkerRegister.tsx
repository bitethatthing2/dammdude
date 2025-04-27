"use client";

import { useEffect, useState, useRef } from 'react';
import { initPwaEventListeners } from '@/lib/pwa/pwaEventHandler';

// Global flag to prevent multiple registrations across page reloads
let hasRegisteredServiceWorker = false;

export default function ServiceWorkerRegister() {
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const registrationAttempted = useRef(false);

  useEffect(() => {
    // Initialize PWA event listeners as early as possible
    initPwaEventListeners();
    
    // Skip if already registered or attempted
    if (hasRegisteredServiceWorker || registrationAttempted.current) {
      return;
    }
    
    // Mark as attempted immediately to prevent race conditions
    registrationAttempted.current = true;
    
    // Feature detection for service workers
    if (!('serviceWorker' in navigator)) {
      console.warn('[ServiceWorker] Service workers are not supported in this browser.');
      return;
    }

    const registerServiceWorker = async () => {
      try {
        // Check if service worker is already controlling the page
        if (navigator.serviceWorker.controller) {
          console.log('[ServiceWorker] Service Worker is already controlling this page');
          
          // Get the existing registration
          const existingReg = await navigator.serviceWorker.ready;
          setSwRegistration(existingReg);
          hasRegisteredServiceWorker = true;
          return;
        }
        
        // Wait for DOM to be fully loaded
        if (document.readyState !== 'complete') {
          await new Promise<void>((resolve) => {
            window.addEventListener('load', () => resolve(), { once: true });
          });
        }

        // Register the service worker with a more reliable approach
        console.log('[ServiceWorker] Registering service worker...');
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
          scope: '/',
          updateViaCache: 'none' // Ensure we always check for updates
        });
        
        console.log('[ServiceWorker] Service Worker registered with scope:', registration.scope);
        setSwRegistration(registration);
        hasRegisteredServiceWorker = true;
        
        // Ensure the service worker is activated
        if (registration.installing) {
          console.log('[ServiceWorker] Service Worker installing');
          
          const installingWorker = registration.installing;
          installingWorker.addEventListener('statechange', () => {
            console.log('[ServiceWorker] Service Worker state changed to:', installingWorker.state);
            if (installingWorker.state === 'activated') {
              console.log('[ServiceWorker] Service Worker activated');
              setSwRegistration(registration);
            }
          });
        } else if (registration.waiting) {
          console.log('[ServiceWorker] Service Worker waiting');
          
          // Force waiting service worker to activate
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        } else if (registration.active) {
          console.log('[ServiceWorker] Service Worker is active');
          
          // Don't force reload if the service worker is already active
          // This prevents disrupting the installation flow
        }
        
        // Check for updates periodically
        setInterval(() => {
          registration.update().catch(err => {
            console.error('[ServiceWorker] Error updating service worker:', err);
          });
        }, 60 * 60 * 1000); // Check every hour
      } catch (error) {
        console.error('[ServiceWorker] Service Worker registration failed:', error);
      }
    };

    // Register service worker as soon as possible
    registerServiceWorker();
    
    // Listen for service worker updates
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('[ServiceWorker] Service Worker updated and controlling the page');
    });
    
    // Listen for service worker messages
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'CACHE_UPDATED') {
        console.log('[ServiceWorker] New content is available; please refresh.');
        // You could show a toast notification here if desired
      }
      
      // Handle notification actions
      if (event.data && event.data.type === 'NOTIFICATION_ACTION') {
        console.log('[ServiceWorker] Notification action received:', event.data);
        // Handle notification actions here
      }
      
      // Handle offline/online status messages
      if (event.data && event.data.type === 'OFFLINE_STATUS') {
        console.log(`[ServiceWorker] App is ${event.data.isOffline ? 'offline' : 'online'}`);
        // Could update UI to show offline status
      }
    });
    
    // Track online/offline status
    window.addEventListener('online', () => {
      console.log('[ServiceWorker] App is online');
      // Notify service worker about online status
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'ONLINE_STATUS',
          isOnline: true
        });
      }
    });
    
    window.addEventListener('offline', () => {
      console.log('[ServiceWorker] App is offline');
      // Notify service worker about offline status
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'ONLINE_STATUS',
          isOnline: false
        });
      }
    });
  }, []);

  return null;
}