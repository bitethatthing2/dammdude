'use client';

// Barrel export file for unified components
// Allows for cleaner imports in consuming components

// Core wrappers
export { ClientComponentWrapper, createClientComponent } from './ClientComponentWrapper';

// Import React for JSX in loading states
import React from 'react';
import dynamic from 'next/dynamic';

// OrderManagement with dynamic import and error boundary
export const OrderManagement = dynamic(() => import('./OrderManagement'), {
  loading: () => (
    <div className="flex items-center justify-center h-32 w-full">
      <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      <span className="ml-3 text-gray-700">Loading order management...</span>
    </div>
  ),
  ssr: false
});

// Export UI components
export { StatusBadge } from './ui/StatusBadge';

// Export notification components
export { NotificationIndicator } from './notifications/NotificationIndicator';
export { NotificationPopover } from './notifications/NotificationPopover';
export { useNotifications, useSafeNotifications, NotificationProvider } from './notifications/index';

// Export layout components
export {
  Header
} from './layout';

// Export table components
// Note: Table management components integrated into WolfPack system
