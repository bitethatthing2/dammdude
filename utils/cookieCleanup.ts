// Emergency cookie cleanup utility
// Fixes corrupted Supabase auth cookies that cause JSON parse errors

/**
 * Clear all corrupted Supabase cookies and storage
 */
export function emergencyCookieCleanup() {
  if (typeof window === 'undefined') return;
  
  console.log('🧹 Starting emergency cookie cleanup...');
  
  try {
    // Clear all cookies
    document.cookie.split(";").forEach(cookie => {
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      
      // Clear from multiple possible paths and domains
      const clearPaths = ['/', '/auth', '/chat'];
      const domains = [window.location.hostname, `.${window.location.hostname}`];
      
      clearPaths.forEach(path => {
        domains.forEach(domain => {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; domain=${domain}`;
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}`;
        });
      });
      
      // Also clear without domain
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
    });
    
    // Clear all localStorage
    Object.keys(localStorage).forEach(key => {
      localStorage.removeItem(key);
    });
    
    // Clear all sessionStorage
    Object.keys(sessionStorage).forEach(key => {
      sessionStorage.removeItem(key);
    });
    
    console.log('✅ Emergency cleanup complete');
    
    // Show user notification
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #10b981;
      color: white;
      padding: 16px;
      border-radius: 8px;
      z-index: 10000;
      font-family: system-ui;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    notification.textContent = '✅ Cookies cleared! Please refresh the page.';
    document.body.appendChild(notification);
    
    setTimeout(() => notification.remove(), 3000);
    
  } catch (error) {
    console.error('❌ Cookie cleanup failed:', error);
  }
}

/**
 * Check if cookies are corrupted and auto-clean if needed
 */
export function checkAndCleanCorruptedCookies() {
  if (typeof window === 'undefined') return false;
  
  try {
    // Check for corrupted base64 values in localStorage
    let hasCorruption = false;
    
    Object.keys(localStorage).forEach(key => {
      if (key.includes('supabase') || key.includes('sb-')) {
        const value = localStorage.getItem(key);
        
        // Check for the specific corruption pattern
        if (value && value.startsWith('base64-eyJ')) {
          console.warn(`🔧 Detected corrupted cookie: ${key}`);
          hasCorruption = true;
        }
        
        // Try to parse as JSON
        if (value && value.startsWith('{')) {
          try {
            JSON.parse(value);
          } catch {
            console.warn(`🔧 Detected unparseable cookie: ${key}`);
            hasCorruption = true;
          }
        }
      }
    });
    
    if (hasCorruption) {
      console.log('🔧 Auto-cleaning corrupted cookies...');
      emergencyCookieCleanup();
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('❌ Corruption check failed:', error);
    return false;
  }
}

/**
 * Make functions available globally for debugging
 */
if (typeof window !== 'undefined') {
  window.emergencyCookieCleanup = emergencyCookieCleanup;
  window.checkCorruptedCookies = checkAndCleanCorruptedCookies;
  
  // Auto-check on load
  setTimeout(() => {
    if (checkAndCleanCorruptedCookies()) {
      setTimeout(() => window.location.reload(), 2000);
    }
  }, 1000);
}