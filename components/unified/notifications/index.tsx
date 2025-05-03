// Barrel file for notification-related components
import React from 'react';
import { createClientComponent } from '../ClientComponentWrapper';

// Export the notification context hook
export { useNotifications, UnifiedNotificationProvider } from '@/lib/contexts/unified-notification-context';

// Export basic components
export { NotificationIndicator } from './NotificationIndicator';

// Export client components with dynamic imports
export const NotificationPopover = createClientComponent(
  () => import('./NotificationPopover'), 
  'NotificationPopover',
  <div className="h-10 w-10 animate-pulse bg-muted rounded-full"></div>
);