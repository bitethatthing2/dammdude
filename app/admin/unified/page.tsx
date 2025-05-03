import { Suspense } from 'react';
import { OrderManagement } from '@/components/unified';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * New unified admin page using the refactored components
 * This serves as an integration test for the new architecture
 */
export default function UnifiedAdminPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Unified Admin Dashboard</h1>
      
      <div className="mb-8">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <p className="text-yellow-700">
            <strong>Integration Test Page:</strong> This page uses the new unified components
            to demonstrate the refactored architecture. Compare this functionality with the
            original admin pages to ensure feature parity.
          </p>
        </div>
        
        <div className="grid grid-cols-1 gap-6">
          <div className="bg-white rounded-lg shadow overflow-hidden dark:bg-gray-950">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Order Management</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                This component uses the unified OrderManagement implementation with proper
                code splitting, type definitions, and error boundaries.
              </p>
              
              <Suspense fallback={<OrderManagementSkeleton />}>
                <OrderManagement />
              </Suspense>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton loader for OrderManagement component
 * Uses the Shadcn UI Skeleton component for consistent loading states
 */
function OrderManagementSkeleton() {
  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Main orders list skeleton */}
      <div className="flex-1">
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-6">
            <Skeleton className="h-8 w-[180px]" />
            <Skeleton className="h-8 w-[100px]" />
          </div>
          
          <Skeleton className="h-10 w-full mb-6" />
          
          <div className="flex space-x-2 mb-8">
            <Skeleton className="h-10 w-1/4" />
            <Skeleton className="h-10 w-1/4" />
            <Skeleton className="h-10 w-1/4" />
            <Skeleton className="h-10 w-1/4" />
          </div>
          
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="border rounded-lg p-4">
                <div className="flex justify-between mb-2">
                  <Skeleton className="h-5 w-[120px]" />
                  <Skeleton className="h-5 w-[80px]" />
                </div>
                <Skeleton className="h-4 w-[200px] mb-4" />
                <div className="flex justify-between items-center pt-2 border-t">
                  <Skeleton className="h-4 w-[100px]" />
                  <Skeleton className="h-8 w-[120px]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Order details sidebar skeleton */}
      <div className="w-full lg:w-[400px]">
        <div className="border rounded-lg p-4 h-full">
          <div className="flex flex-col items-center justify-center h-[500px]">
            <Skeleton className="h-16 w-16 rounded-full mb-4" />
            <Skeleton className="h-6 w-[150px] mb-2" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
      </div>
    </div>
  );
}