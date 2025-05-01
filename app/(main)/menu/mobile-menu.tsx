"use client";

import { Suspense } from 'react';
import { getCategories } from '@/lib/menu-data';
import dynamic from 'next/dynamic';

// Use the menu page skeleton from our components
function MenuPageSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="h-8 w-full max-w-md mx-auto">
          <div className="h-16 bg-muted/30 rounded-lg animate-pulse mb-4" />
          <div className="flex overflow-x-auto py-2 gap-4">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-16 h-16 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
        <div className="h-32 bg-muted/30 rounded-lg animate-pulse mb-4 mx-4" />
        <div className="grid grid-cols-2 gap-4 p-4">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="rounded-lg bg-muted/30 h-48 animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}

// Dynamically import the consolidated menu component
const ConsolidatedMenu = dynamic(
  () => import('@/components/shared/menu-display').then(mod => ({ default: mod.MenuDisplay })),
  { ssr: false }
);

export default async function MenuPage() {
  // Fetch categories directly in the server component
  const categories = await getCategories();
  
  return (
    <div className="h-full">
      <Suspense fallback={<MenuPageSkeleton />}>
        <ConsolidatedMenu initialCategories={categories} mode="info" />
      </Suspense>
    </div>
  );
}