// Barrel export file for unified components
// Allows for cleaner imports in consuming components

// Core wrappers
export { ClientComponentWrapper, createClientComponent } from './ClientComponentWrapper';

// Import React for JSX in loading states
import React from 'react';

// Create pre-wrapped client components for easy consumption
import { createClientComponent } from './ClientComponentWrapper';

// OrderManagement with dynamic import and error boundary
export const OrderManagement = createClientComponent(
  () => import('./OrderManagement'),
  'OrderManagement',
  <div className="flex items-center justify-center h-32 w-full">
    <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
    <span className="ml-3 text-gray-700">Loading order management...</span>
  </div>
);

// Export UI components
export { StatusBadge } from './ui/StatusBadge';

// Export drop-in replacement components
export { OrdersManagement } from './OrdersManagement';

// Export menu components
export {
  MenuItem,
  MenuGrid
} from './menu';

// Export notification components
export {
  NotificationIndicator,
  NotificationPopover,
  useNotifications,
  UnifiedNotificationProvider
} from './notifications';

// Export layout components
export {
  Header
} from './layout';

// Export table components
export {
  TableManagement
} from './tables';