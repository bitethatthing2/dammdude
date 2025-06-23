import { Metadata } from 'next';
import { Suspense } from 'react';
import { OrdersManagement } from '@/components/unified/OrdersManagement';

export const metadata: Metadata = {
  title: 'Side Hustle Admin - Bartender',
  description: 'Manage drink orders for bartender station'
};

/**
 * Bartender page for managing drink orders
 * Uses the same unified OrdersManagement component as the main orders page
 */
export default function BartenderPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Bartender Station</h1>
        <p className="text-muted-foreground">
          View and manage drink orders in real-time
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