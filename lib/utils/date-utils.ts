import { formatDistanceToNow, format } from 'date-fns';

/**
 * Formats a date string as a relative time (e.g., "5 minutes ago")
 * with appropriate error handling
 */
export function formatTimeDistance(dateString: string): string {
  try {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  } catch (e) {
    console.error('Invalid date in formatTimeDistance:', e);
    return 'Invalid date';
  }
}

/**
 * Formats a date string for order display (e.g., "Apr 29, 7:30 PM")
 * with appropriate error handling
 */
export function formatOrderDate(dateString: string): string {
  try {
    return format(new Date(dateString), 'MMM d, h:mm a');
  } catch (e) {
    console.error('Invalid date in formatOrderDate:', e);
    return 'Invalid date';
  }
}

/**
 * Parses an ISO date string to a Date object with error handling
 */
export function parseISO(dateString: string): Date | null {
  try {
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return null;
    }
    
    return date;
  } catch (e) {
    console.error('Error parsing date:', e);
    return null;
  }
}

/**
 * Formats a date into a relative time string (e.g., "2 minutes ago", "1 hour ago")
 * @param date Date string or Date object
 * @returns Formatted relative time string
 */
export function formatRelativeTime(date: string | Date): string {
  if (!date) return 'unknown time';
  
  try {
    const now = new Date();
    const targetDate = typeof date === 'string' ? new Date(date) : date;
    
    // Check for invalid date
    if (isNaN(targetDate.getTime())) {
      return 'invalid date';
    }
    
    // Calculate time difference in milliseconds
    const diffMs = now.getTime() - targetDate.getTime();
    
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
      return diffDay === 1 ? '1 day ago' : `${diffDay} days ago`;
    }
  } catch (error) {
    console.error('Error formatting relative time:', error);
    return 'unknown time';
  }
}
