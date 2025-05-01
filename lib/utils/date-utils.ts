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
