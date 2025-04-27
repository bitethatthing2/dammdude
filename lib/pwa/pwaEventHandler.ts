/**
 * Centralized handler for PWA-related events
 */

// Define the BeforeInstallPromptEvent interface
export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

// Global module state
let deferredPrompt: BeforeInstallPromptEvent | null = null;
let isAppInstalled = false;
let hasInitialized = false;

// Hack: To fix PWA installation on Chrome, we need to expose the
// deferredPrompt to the window object
if (typeof window !== 'undefined') {
  (window as any).deferredPromptEvent = null;
}

/**
 * Initialize PWA event listeners
 */
export function initPwaEventListeners() {
  if (typeof window === 'undefined') return;
  
  // Prevent multiple initializations
  if (hasInitialized) {
    console.log('[PWA] Event listeners already initialized, skipping');
    return;
  }
  
  console.log('[PWA] Initializing PWA event listeners');
  hasInitialized = true;
  
  // Check if the app is already installed
  if (
    ('standalone' in window.navigator && (window.navigator as any).standalone === true) || 
    (window.matchMedia && (
      window.matchMedia('(display-mode: standalone)').matches || 
      window.matchMedia('(display-mode: window-controls-overlay)').matches
    ))
  ) {
    console.log('[PWA] App is already installed');
    isAppInstalled = true;
  }

  // Listen for beforeinstallprompt event - CRITICAL for PWA installation
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    // Prevent Chrome from automatically showing the prompt
    e.preventDefault();
    
    // Store the event for later use
    deferredPrompt = e as BeforeInstallPromptEvent;
    
    // HACK: Store on window to ensure it's globally accessible
    (window as any).deferredPromptEvent = deferredPrompt;
    
    console.log('[PWA] beforeinstallprompt event captured!', deferredPrompt);
    
    // Notify all callbacks
    fireInstallPromptCallbacks(deferredPrompt);
  });
  
  // Listen for appinstalled event
  window.addEventListener('appinstalled', () => {
    console.log('[PWA] App was installed');
    isAppInstalled = true;
    deferredPrompt = null;
    (window as any).deferredPromptEvent = null;
    
    // Notify all callbacks
    fireAppInstalledCallbacks();
  });
}

// Arrays to store callbacks
const installPromptCallbacks: Array<(event: BeforeInstallPromptEvent) => void> = [];
const appInstalledCallbacks: Array<() => void> = [];

/**
 * Fire all install prompt callbacks
 */
function fireInstallPromptCallbacks(event: BeforeInstallPromptEvent) {
  installPromptCallbacks.forEach(callback => {
    try {
      callback(event);
    } catch (error) {
      console.error('[PWA] Error in beforeinstallprompt callback:', error);
    }
  });
}

/**
 * Fire all app installed callbacks
 */
function fireAppInstalledCallbacks() {
  appInstalledCallbacks.forEach(callback => {
    try {
      callback();
    } catch (error) {
      console.error('[PWA] Error in appinstalled callback:', error);
    }
  });
}

/**
 * Register a callback to be called when the beforeinstallprompt event is fired
 */
export function onBeforeInstallPrompt(callback: (event: BeforeInstallPromptEvent) => void) {
  installPromptCallbacks.push(callback);
  
  // If we already have a deferred prompt, call the callback immediately
  if (deferredPrompt) {
    callback(deferredPrompt);
  } else if ((window as any).deferredPromptEvent) {
    // Check the window object as a fallback
    callback((window as any).deferredPromptEvent);
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
  return !!deferredPrompt || !!(window as any).deferredPromptEvent;
}

/**
 * Get the deferred prompt
 */
export function getPrompt(): BeforeInstallPromptEvent | null {
  // Check both the module and window object
  return deferredPrompt || (window as any).deferredPromptEvent || null;
}

/**
 * Show the installation prompt
 */
export async function showInstallPrompt(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  // Check both the module and window object
  const prompt = deferredPrompt || (window as any).deferredPromptEvent;
  
  if (!prompt) {
    console.log('[PWA] No installation prompt available');
    return 'unavailable';
  }
  
  console.log('[PWA] Showing installation prompt');
  
  try {
    // Show the prompt
    await prompt.prompt();
    
    // Wait for the user's choice
    const choiceResult = await prompt.userChoice;
    
    console.log('[PWA] User choice:', choiceResult.outcome);
    
    if (choiceResult.outcome === 'accepted') {
      console.log('[PWA] User accepted the installation prompt');
    } else {
      console.log('[PWA] User dismissed the installation prompt');
    }
    
    // Return the outcome
    return choiceResult.outcome;
  } catch (error) {
    console.error('[PWA] Error showing installation prompt:', error);
    return 'dismissed';
  }
}
