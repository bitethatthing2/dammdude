"use client";

import dynamic from 'next/dynamic';
import React from 'react';

// Export client components with dynamic imports
export const TableManagement = dynamic(() => import('@/components/bartap/TableManagement').then(mod => ({ default: mod.TableManagement })), {
  loading: () => (
    <div className="animate-pulse space-y-4">
      <div className="h-12 bg-muted rounded w-full"></div>
      <div className="h-64 bg-muted rounded w-full"></div>
    </div>
  ),
  ssr: false
});
