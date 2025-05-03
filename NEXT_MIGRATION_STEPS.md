# Next Migration Steps

Now that we've addressed the critical errors and added unified components, the following steps will complete the migration:

## 1. Replace Existing Pages with Unified Components

### Admin Order Management Page

Replace the implementation in `/app/admin/orders/page.tsx` with the unified component:

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
  return (
    <div className="rounded-md border p-8 animate-pulse">
      <div className="flex justify-between items-center mb-6">
        <div className="h-6 bg-muted rounded w-[150px]"></div>
        <div className="h-10 bg-muted rounded w-[120px]"></div>
      </div>
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 bg-muted rounded-md"></div>
        ))}
      </div>
    </div>
  );
}
```

### Admin Tables Page

Replace the implementation in `/app/admin/tables/page.tsx` with the unified component (already created as `page.tsx.updated`):

```bash
mv /app/admin/tables/page.tsx.updated /app/admin/tables/page.tsx
```

### Menu Page 

Replace the implementation in `/app/menu/page.tsx` with the unified component (already created as `page.tsx.updated`):

```bash
mv /app/menu/page.tsx.updated /app/menu/page.tsx
```

## 2. Add Header with Notification Support to Admin Layout

Enhance the admin layout with the unified header component:

```tsx
// In /app/admin/layout.tsx
import { Header } from '@/components/unified';

// Add this to the layout content
<Header 
  title="BarTap Admin" 
  subtitle="Staff Management Portal" 
  showNotifications={true}
  showSearch={false}
/>
```

## 3. Create Unified Cart Context

Replace the existing cart context with a unified implementation:

1. Create `/components/unified/cart/CartContext.tsx`
2. Create `/components/unified/cart/index.ts`
3. Update main barrel file to export the cart components
4. Update pages that use the cart context

## 4. Remove Duplicate Components

After confirming all functionality works correctly, remove the following duplicate components:

1. `/components/bartap/OrdersManagement.tsx`
2. `/components/bartap/AdminNotificationsProvider.tsx`
3. `/components/employee/order-management.tsx`
4. `/components/bartap/ui/StatusBadge.tsx`
5. `/components/shared/NotificationPopover.tsx`
6. `/components/shared/NotificationIndicator.tsx`
7. `/components/shared/notification-bell.tsx`
8. `/components/shared/NotificationStatus.tsx`
9. `/components/shared/notification-provider.tsx`
10. `/components/shared/menu-display.tsx`
11. `/components/shared/menu-item-card.tsx`
12. `/components/unified-menu/UnifiedMenuDisplay.tsx`
13. `/components/unified-menu/MenuDisplayWrapper.tsx`
14. `/components/unified-menu/BarTapWrapper.tsx`

## 5. Testing and Verification

Before removing any components, test the application thoroughly:

1. Test admin order management
2. Test admin table management
3. Test menu display
4. Test notifications
5. Verify that real-time updates work correctly
6. Test on both desktop and mobile
7. Test in both light and dark modes

## 6. Final Steps

1. Remove the original `server.ts` file after all components use `server-fixed.ts`
2. Rename `server-fixed.ts` to `server.ts` to maintain a clean API
3. Update any remaining imports that use the old server client

## 7. Documentation

1. Update the documentation to reflect the new architecture
2. Create usage examples for all unified components
3. Document the migration process for future reference

By following these steps, we'll complete the migration to the unified components and eliminate all duplications and conflicts in the codebase.