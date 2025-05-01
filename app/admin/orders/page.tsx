import { Metadata } from 'next';
import { OrdersManagement } from '@/components/bartap/OrdersManagement';

export const metadata: Metadata = {
  title: 'BarTap Admin - Orders',
  description: 'Manage customer orders'
};

/**
 * Admin orders page for managing all customer orders
 * Uses server-side rendering for initial data load
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
      
      <OrdersManagement />
    </div>
  );
}
