// PWA installation handler script
// This script gets loaded as early as possible to capture the beforeinstallprompt event
window.deferredPromptEvent = null;

window.addEventListener('beforeinstallprompt', function(e) {
  console.log('[PWA Install Handler] beforeinstallprompt event captured!', e);
  
  // Prevent Chrome from automatically showing the prompt
  e.preventDefault();
  
  // Store the event for later use
  window.deferredPromptEvent = e;
});

console.log('[PWA Install Handler] Script loaded and listening for installation events');
