# BarTap Component Migration Guide

This guide provides instructions for migrating from the original component implementations to the new unified architecture.

## Order Management Component Migration

### Why Migrate?

The new unified OrderManagement component offers significant improvements:

- Proper code splitting for better performance
- Type safety with standardized interfaces
- Improved error handling with error boundaries
- Consistent UI with proper loading states
- Real-time updates with Supabase subscriptions
- Better handling of edge cases
- Dark mode support out of the box
- Sound notifications for important events
- Responsive design for all devices

### Migration Steps

#### Option 1: Simple Drop-in Replacement

For the quickest migration with minimal changes, use the drop-in replacement:

```diff
- import { OrdersManagement } from '@/components/bartap/OrdersManagement';
+ import { OrdersManagement } from '@/components/unified/OrdersManagement';
```

This approach maintains the same component name and interface, but uses the new unified implementation under the hood.

#### Option 2: Full Migration with Suspense

For the best user experience, migrate to the new component with proper Suspense boundaries:

```diff
- import { OrdersManagement } from '@/components/bartap/OrdersManagement';
+ import { Suspense } from 'react';
+ import { OrderManagement } from '@/components/unified';

  export default function OrdersPage() {
    return (
      <div>
        <h1>Orders</h1>
-       <OrdersManagement />
+       <Suspense fallback={<OrdersSkeleton />}>
+         <OrderManagement />
+       </Suspense>
      </div>
    );
  }

+ /**
+  * Skeleton UI for loading state
+  */
+ function OrdersSkeleton() {
+   return (
+     <div className="animate-pulse">
+       {/* Skeleton content */}
+     </div>
+   );
+ }
```

### Example: Updated Admin Orders Page

```tsx
import { Metadata } from 'next';
import { Suspense } from 'react';
import { OrderManagement } from '@/components/unified';

export const metadata: Metadata = {
  title: 'BarTap Admin - Orders',
  description: 'Manage customer orders'
};

export default function OrdersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
        <p className="text-muted-foreground">
          View and manage customer orders from all tables
        </p>
      </div>
      
      <Suspense fallback={<OrdersSkeleton />}>
        <OrderManagement />
      </Suspense>
    </div>
  );
}

function OrdersSkeleton() {
  // Skeleton UI implementation
}
```

## Working with the useOrderManagement Hook

The new `useOrderManagement` hook provides a flexible API for accessing order data:

### Basic Usage

```tsx
const { orders, updateOrderStatus } = useOrderManagement();
```

### Advanced Usage

```tsx
const {
  orders,
  pendingOrders,
  preparingOrders,
  readyOrders,
  completedOrders,
  isLoading,
  error,
  processingOrders,
  updateOrderStatus,
  fetchOrders
} = useOrderManagement({
  status: ['pending', 'preparing', 'ready'],
  refreshInterval: 30000,
  enableRealtime: true,
  onNewOrder: (order) => {
    // Custom notification logic
    toast({
      title: 'New Order',
      description: `Table ${order.table_name || order.table_id}`
    });
  },
  onOrderStatusChange: (order, previousStatus) => {
    // Handle status change events
    console.log(`Order ${order.id} changed from ${previousStatus} to ${order.status}`);
  }
});
```

## Using StatusBadge Component

The unified StatusBadge component provides consistent status display:

```tsx
import { StatusBadge } from '@/components/unified';

function OrderItem({ order }) {
  return (
    <div>
      <h3>Order #{order.id}</h3>
      <StatusBadge status={order.status} />
    </div>
  );
}
```

## Testing the Migration

After migrating components, test the following:

1. **Basic Functionality**:
   - Order display and filtering
   - Status updates
   - Order details view

2. **Real-time Updates**:
   - Create a new order to test real-time updates
   - Verify that status changes update in real-time

3. **Error Handling**:
   - Temporarily disconnect from the database
   - Verify error states render correctly

4. **Responsive Design**:
   - Test on mobile, tablet, and desktop viewports
   - Verify that the UI adapts correctly

## Rollback Plan

If issues are encountered during migration:

1. Revert the import changes to use the original components
2. Report any issues found in the unified components
3. Consider a phased migration approach for more complex pages

## Additional Resources

- Unified Component Documentation: `/REFACTORING_GUIDE.md`
- Implementation Status: `/IMPLEMENTATION_STATUS.md`
- Integration Testing Page: `/app/admin/unified/page.tsx`