interface ErrorContext {
  source?: string;
  context?: Record<string, any>;
  componentStack?: string;
}

interface ErrorLog {
  message: string;
  timestamp: string;
  source?: string;
  stack?: string;
  context?: Record<string, any>;
}

// Array to store error logs
const errorLogs: ErrorLog[] = [];

/**
 * Captures and logs errors with context information
 * Can be extended later to send to error tracking service
 */
export function captureError(error: Error, context?: ErrorContext) {
  // Log to console for development
  console.error('Error captured:', {
    message: error.message,
    stack: error.stack,
    ...context
  });
  
  // Store in error logs
  errorLogs.push({
    message: error.message,
    timestamp: new Date().toISOString(),
    source: context?.source,
    stack: error.stack,
    context: context?.context
  });
  
  // Limit logs to most recent 50
  if (errorLogs.length > 50) {
    errorLogs.shift();
  }
  
  // In the future, this could send to an error tracking service
  // For now, just ensure we have good console logs for debugging
  
  // Return the error for potential chaining
  return error;
}

/**
 * Sets up global error handlers for the application
 */
export function setupGlobalErrorHandlers() {
  if (typeof window === 'undefined') return;
  
  // Already set up in error-monitoring.ts
  console.log('Global error handlers initialized');
}

/**
 * Get stored error logs for debugging
 */
export function getStoredErrors(): ErrorLog[] {
  return [...errorLogs];
}

/**
 * Clear stored error logs
 */
export function clearStoredErrors(): void {
  errorLogs.length = 0;
}

/**
 * Helper to safely fetch data with error handling
 */
export async function safeFetch<T>(url: string, options?: RequestInit): Promise<{
  data: T | null;
  error: Error | null;
}> {
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      let errorData: any;
      
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }
      
      throw new Error(errorData.message || `HTTP error ${response.status}`);
    }
    
    const data = await response.json();
    return { data, error: null };
  } catch (err) {
    captureError(err instanceof Error ? err : new Error(String(err)), {
      source: 'safeFetch',
      context: { url }
    });
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}

/**
 * Formats a date string as a relative time (e.g., "5 minutes ago")
 * with appropriate error handling
 */
export function formatTimeDistance(dateString: string): string {
  try {
    const now = new Date();
    const date = new Date(dateString);
    
    // Calculate time difference in milliseconds
    const diffMs = now.getTime() - date.getTime();
    
    // Convert to seconds, minutes, hours, days
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    
    // Format the relative time
    if (diffSec < 60) {
      return `${diffSec} seconds ago`;
    } else if (diffMin < 60) {
      return diffMin === 1 ? '1 minute ago' : `${diffMin} minutes ago`;
    } else if (diffHour < 24) {
      return diffHour === 1 ? '1 hour ago' : `${diffHour} hours ago`;
    } else {
      return diffDay === 1 ? 'yesterday' : `${diffDay} days ago`;
    }
  } catch (e) {
    console.error('Invalid date in formatTimeDistance:', e);
    return 'unknown time';
  }
}

/**
 * Formats a date string for order display (e.g., "Apr 29, 7:30 PM")
 * with appropriate error handling
 */
export function formatOrderDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  } catch (e) {
    console.error('Invalid date in formatOrderDate:', e);
    return 'Invalid date';
  }
}