'use client';

import { OrderManagement } from './index';

/**
 * Drop-in replacement for the original OrdersManagement component
 * Uses the new unified OrderManagement component with the same interface
 * This makes migration easier by providing a compatible API
 */
export function OrdersManagement() {
  return <OrderManagement />;
}

export default OrdersManagement;