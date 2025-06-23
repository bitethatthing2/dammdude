/**
 * PWA Install Helper
 * This script is designed to be loaded as early as possible to maximize
 * chances of capturing the beforeinstallprompt event.
 */

// Create a global variable to store the installation prompt
window.deferredPromptEvent = null;

// Track if the app is installed
window.pwaIsInstalled = false;

// Check if app is already installed
function checkIfInstalled() {
  // Check if in standalone mode (iOS)
  if ('standalone' in navigator && navigator.standalone === true) {
    window.pwaIsInstalled = true;
    return true;
  }
  
  // Check if in standalone mode (other browsers)
  if (window.matchMedia('(display-mode: standalone)').matches || 
      window.matchMedia('(display-mode: fullscreen)').matches ||
      window.matchMedia('(display-mode: minimal-ui)').matches ||
      window.matchMedia('(display-mode: window-controls-overlay)').matches) {
    window.pwaIsInstalled = true;
    return true;
  }
  
  return false;
}

// Function to manually show installation instructions for iOS
function showIOSInstructions() {
  if (!checkIfInstalled() && /iphone|ipad|ipod|mac/i.test(navigator.userAgent) && 
      navigator.maxTouchPoints > 0 && !window.MSStream) {
    console.log('[PWA Installer] Showing iOS installation instructions');
    
    // Create a notification element
    const notification = document.createElement('div');
    notification.style.position = 'fixed';
    notification.style.bottom = '20px';
    notification.style.left = '50%';
    notification.style.transform = 'translateX(-50%)';
    notification.style.backgroundColor = '#000000';
    notification.style.color = 'white';
    notification.style.padding = '12px 20px';
    notification.style.borderRadius = '8px';
    notification.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
    notification.style.zIndex = '9999';
    notification.style.maxWidth = '90%';
    notification.style.width = '350px';
    notification.style.fontFamily = 'system-ui, -apple-system, sans-serif';
    notification.style.fontSize = '14px';
    notification.style.display = 'flex';
    notification.style.alignItems = 'center';
    notification.style.justifyContent = 'space-between';
    
    notification.innerHTML = `
      <div>
        <div style="font-weight: bold; margin-bottom: 4px;">Install Side Hustle App</div>
        <div>Tap <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: middle;"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg> then "Add to Home Screen"</div>
      </div>
      <button style="background: none; border: none; color: #4facfe; cursor: pointer; font-size: 14px; margin-left: 8px;">Got it</button>
    `;
    
    // Add to document
    document.body.appendChild(notification);
    
    // Add close button functionality
    const closeButton = notification.querySelector('button');
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        document.body.removeChild(notification);
        
        // Store in localStorage that we've shown the instructions
        try {
          localStorage.setItem('pwa-ios-instructions-shown', 'true');
        } catch (_e) {
          console.error('[PWA Installer] Error storing in localStorage:', e);
        }
      });
    }
    
    // Automatically remove after 10 seconds
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 10000);
  }
}

// Listen for the beforeinstallprompt event
window.addEventListener('beforeinstallprompt', function(e) {
  // Prevent Chrome from automatically showing the prompt
  e.preventDefault();
  
  // Store the event for later use
  window.deferredPromptEvent = e;
  
  console.log('[PWA Installer] beforeinstallprompt event captured!');
  
  // Dispatch a custom event that components can listen for
  const capturedEvent = new CustomEvent('pwainstallpromptcaptured', { detail: e });
  window.dispatchEvent(capturedEvent);
});

// Listen for the appinstalled event
window.addEventListener('appinstalled', function(e) {
  console.log('[PWA Installer] App was installed!');
  
  window.pwaIsInstalled = true;
  window.deferredPromptEvent = null;
  
  // Dispatch a custom event
  const installedEvent = new CustomEvent('pwainstalled');
  window.dispatchEvent(installedEvent);
  
  // Store in localStorage that the app is installed
  try {
    localStorage.setItem('pwa-app-installed', 'true');
  } catch (_e) {
    console.error('[PWA Installer] Error storing in localStorage:', e);
  }
});

// Initialize on load
window.addEventListener('load', function() {
  console.log('[PWA Installer] Page loaded, checking installability');
  
  // Check if already installed
  if (checkIfInstalled()) {
    console.log('[PWA Installer] App appears to be already installed');
    
    // Dispatch an event to notify components
    const installedEvent = new CustomEvent('pwainstalled');
    window.dispatchEvent(installedEvent);
    
    return;
  }
  
  // Check if should show iOS instructions
  // Don't show too often - check if we've shown them recently
  if (/iphone|ipad|ipod|mac/i.test(navigator.userAgent) && navigator.maxTouchPoints > 0) {
    console.log('[PWA Installer] iOS device detected');
    
    try {
      const instructionsShown = localStorage.getItem('pwa-ios-instructions-shown');
      if (!instructionsShown) {
        // Wait a bit before showing instructions
        setTimeout(showIOSInstructions, 3000);
      }
    } catch (_e) {
      console.error('[PWA Installer] Error accessing localStorage:', e);
      // Show instructions anyway
      setTimeout(showIOSInstructions, 3000);
    }
  }
  
  // For Chrome, sometimes we need to create a user interaction to trigger the event
  setTimeout(function() {
    if (!window.deferredPromptEvent && 
        /chrome|chromium|crios/i.test(navigator.userAgent) && 
        !window.pwaIsInstalled) {
      console.log('[PWA Installer] No prompt captured yet, creating temporary interaction');
      
      // Create a temporary button and click it to try to trigger the event
      const tempButton = document.createElement('button');
      tempButton.style.display = 'none';
      document.body.appendChild(tempButton);
      tempButton.click();
      document.body.removeChild(tempButton);
    }
  }, 1000);
});
