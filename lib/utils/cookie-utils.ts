// Cookie utility functions to handle Supabase auth cookie issues

/**
 * Decode base64 with proper error handling for corrupted cookies
 */
export function safeBase64Decode(str: string): string | null {
  try {
    // Handle URL-safe base64
    const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    
    // Add padding if needed
    const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);
    
    return atob(padded);
  } catch (error) {
    console.warn('Failed to decode base64 string:', error);
    return null;
  }
}

/**
 * Check if a cookie value is corrupted
 */
export function isCookieCorrupted(cookieValue: string): boolean {
  try {
    // Check if it looks like a base64 encoded JWT
    if (cookieValue.includes('.')) {
      const parts = cookieValue.split('.');
      for (const part of parts) {
        if (part && safeBase64Decode(part) === null) {
          return true;
        }
      }
    } else if (cookieValue.startsWith('base64-')) {
      // Check if base64 encoded cookie is valid
      const base64Part = cookieValue.replace('base64-', '');
      return safeBase64Decode(base64Part) === null;
    }
    
    return false;
  } catch {
    return true;
  }
}

/**
 * Clear all cookies for the current domain
 */
export function clearAllCookies(): void {
  if (typeof document === 'undefined') return;
  
  try {
    const cookies = document.cookie.split(';');
    
    for (const cookie of cookies) {
      const eqPos = cookie.indexOf('=');
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      
      if (name) {
        // Clear cookie for current path
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
        
        // Clear cookie for root path
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;`;
        
        // Clear cookie with domain
        if (window.location.hostname !== 'localhost') {
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${window.location.hostname}`;
        }
      }
    }
    
    console.log('All cookies cleared');
  } catch (error) {
    console.error('Error clearing cookies:', error);
  }
}

/**
 * Clear specific Supabase auth cookies
 */
export function clearSupabaseCookies(): void {
  if (typeof document === 'undefined') return;
  
  const supabaseCookieNames = [
    'sb-access-token',
    'sb-refresh-token',
    'supabase-auth-token',
    'supabase.auth.token',
    'sb-tvnpgbjypnezoasbhbwx-auth-token',
    'sb-tvnpgbjypnezoasbhbwx-auth-token-code-verifier'
  ];
  
  for (const cookieName of supabaseCookieNames) {
    // Clear cookie for current path
    document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    
    // Clear cookie for root path
    document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;`;
    
    // Clear cookie with domain
    if (window.location.hostname !== 'localhost') {
      document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
      document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${window.location.hostname}`;
    }
  }
  
  console.log('Supabase cookies cleared');
}

/**
 * Check and clear corrupted Supabase cookies
 */
export function checkAndClearCorruptedCookies(): boolean {
  if (typeof document === 'undefined') return false;
  
  let foundCorrupted = false;
  const cookies = document.cookie.split(';');
  
  for (const cookie of cookies) {
    const [name, value] = cookie.split('=').map(s => s.trim());
    
    // Check Supabase-related cookies
    if (name && value && (name.includes('sb-') || name.includes('supabase'))) {
      if (isCookieCorrupted(value)) {
        console.warn(`Corrupted cookie detected: ${name}`);
        foundCorrupted = true;
      }
    }
  }
  
  if (foundCorrupted) {
    console.log('Clearing corrupted Supabase cookies...');
    clearSupabaseCookies();
    return true;
  }
  
  return false;
}

/**
 * Auto-check and clear corrupted cookies on page load
 */
export function initCookieHealthCheck(): void {
  if (typeof window === 'undefined') return;
  
  // Check cookies when the page loads
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => checkAndClearCorruptedCookies(), 100);
    });
  } else {
    setTimeout(() => checkAndClearCorruptedCookies(), 100);
  }
  
  // Also check when the page becomes visible (useful for SPA navigation)
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      setTimeout(() => checkAndClearCorruptedCookies(), 100);
    }
  });
}

// Extend Window interface for cookie utilities
declare global {
  interface Window {
    clearAllCookies?: () => void;
    clearSupabaseCookies?: () => void;
    checkAndClearCorruptedCookies?: () => boolean;
  }
}

/**
 * Browser console utility to manually clear cookies
 */
export function exposeCookieUtils(): void {
  if (typeof window === 'undefined') return;
  
  // Expose utilities to window for manual debugging
  window.clearAllCookies = clearAllCookies;
  window.clearSupabaseCookies = clearSupabaseCookies;
  window.checkAndClearCorruptedCookies = checkAndClearCorruptedCookies;
  
  console.log('Cookie utilities exposed to window: clearAllCookies(), clearSupabaseCookies(), checkAndClearCorruptedCookies()');
}
