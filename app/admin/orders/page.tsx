import { Metadata } from 'next';
import { Suspense } from 'react';

// Import from unified components instead of bartap
import { OrdersManagement } from '@/components/unified/OrdersManagement';

export const metadata: Metadata = {
  title: 'BarTap Admin - Orders',
  description: 'Manage customer orders'
};

/**
 * Admin orders page for managing all customer orders
 * Uses the unified OrdersManagement component
 */
export default function OrdersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
        <p className="text-muted-foreground">
          View and manage customer orders from all tables
        </p>
      </div>
      
      {/* Add Suspense boundary for better UX */}
      <Suspense fallback={<OrdersSkeleton />}>
        <OrdersManagement />
      </Suspense>
    </div>
  );
}

/**
 * Skeleton UI for orders loading state
 */
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