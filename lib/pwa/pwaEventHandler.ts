"use client";

/**
 * Centralized PWA Event Handler
 * 
 * This module provides a centralized way to handle PWA-related events
 * like beforeinstallprompt and appinstalled. It ensures that these
 * events are captured as early as possible and made available to
 * components that need them.
 */

// Types
export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

// Global state
let deferredPrompt: BeforeInstallPromptEvent | null = null;
let isAppInstalled = false;
let hasRegisteredListeners = false;

// Callbacks
const installPromptCallbacks: Array<(event: BeforeInstallPromptEvent) => void> = [];
const appInstalledCallbacks: Array<() => void> = [];

/**
 * Initialize PWA event listeners
 * This should be called as early as possible in the application lifecycle
 */
export function initPwaEventListeners() {
  if (typeof window === 'undefined' || hasRegisteredListeners) return;
  
  console.log('[PWA] Initializing PWA event listeners');
  hasRegisteredListeners = true;
  
  // Check if app is already installed
  const isStandalone = 
    window.matchMedia('(display-mode: standalone)').matches || 
    window.matchMedia('(display-mode: window-controls-overlay)').matches ||
    (window.navigator as any).standalone === true;
  
  if (isStandalone) {
    console.log('[PWA] App is already running in standalone mode');
    isAppInstalled = true;
  }
  
  // Listen for beforeinstallprompt event
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    
    console.log('[PWA] beforeinstallprompt event captured');
    
    // Store the event
    deferredPrompt = e as BeforeInstallPromptEvent;
    
    // Store in localStorage that a prompt is available
    try {
      localStorage.setItem('pwa-prompt-available', 'true');
    } catch (err) {
      console.error('[PWA] Error writing to localStorage:', err);
    }
    
    // Notify all registered callbacks
    installPromptCallbacks.forEach(callback => {
      try {
        callback(deferredPrompt as BeforeInstallPromptEvent);
      } catch (error) {
        console.error('[PWA] Error in beforeinstallprompt callback:', error);
      }
    });
  });
  
  // Listen for appinstalled event
  window.addEventListener('appinstalled', () => {
    console.log('[PWA] App was installed successfully');
    
    isAppInstalled = true;
    deferredPrompt = null;
    
    // Clear localStorage flag
    try {
      localStorage.removeItem('pwa-prompt-available');
    } catch (err) {
      console.error('[PWA] Error removing from localStorage:', err);
    }
    
    // Notify all registered callbacks
    appInstalledCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('[PWA] Error in appinstalled callback:', error);
      }
    });
  });
  
  // Check if we have a stored flag indicating a prompt was available
  try {
    const storedPromptAvailable = localStorage.getItem('pwa-prompt-available');
    if (storedPromptAvailable === 'true' && !isAppInstalled) {
      console.log('[PWA] Prompt was previously available according to localStorage');
    }
  } catch (err) {
    console.error('[PWA] Error accessing localStorage:', err);
  }
}

/**
 * Register a callback to be called when the beforeinstallprompt event is fired
 * If the event has already been captured, the callback will be called immediately
 */
export function onBeforeInstallPrompt(callback: (event: BeforeInstallPromptEvent) => void) {
  installPromptCallbacks.push(callback);
  
  // If we already have a deferred prompt, call the callback immediately
  if (deferredPrompt) {
    try {
      callback(deferredPrompt);
    } catch (error) {
      console.error('[PWA] Error in beforeinstallprompt callback:', error);
    }
  }
  
  // Return a function to unregister the callback
  return () => {
    const index = installPromptCallbacks.indexOf(callback);
    if (index !== -1) {
      installPromptCallbacks.splice(index, 1);
    }
  };
}

/**
 * Register a callback to be called when the appinstalled event is fired
 */
export function onAppInstalled(callback: () => void) {
  appInstalledCallbacks.push(callback);
  
  // Return a function to unregister the callback
  return () => {
    const index = appInstalledCallbacks.indexOf(callback);
    if (index !== -1) {
      appInstalledCallbacks.splice(index, 1);
    }
  };
}

/**
 * Check if the app is installed
 */
export function isInstalled(): boolean {
  return isAppInstalled;
}

/**
 * Check if an installation prompt is available
 */
export function isPromptAvailable(): boolean {
  return !!deferredPrompt;
}

/**
 * Get the deferred prompt event if available
 */
export function getPrompt(): BeforeInstallPromptEvent | null {
  return deferredPrompt;
}

/**
 * Show the installation prompt if available
 * Returns a promise that resolves to the user's choice
 */
export async function showInstallPrompt(): Promise<'accepted' | 'dismissed' | null> {
  if (!deferredPrompt) {
    console.log('[PWA] No installation prompt available');
    return null;
  }
  
  try {
    console.log('[PWA] Showing installation prompt');
    await deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    
    // Clear the prompt after use
    if (result.outcome === 'accepted') {
      console.log('[PWA] User accepted the installation prompt');
      // We don't clear deferredPrompt here because the appinstalled event will do it
    } else {
      console.log('[PWA] User dismissed the installation prompt');
      // We keep the deferredPrompt in case the user wants to install later
    }
    
    return result.outcome;
  } catch (error) {
    console.error('[PWA] Error showing installation prompt:', error);
    return null;
  }
}
