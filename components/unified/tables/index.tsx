// Barrel file for table-related components
import { createClientComponent } from '../ClientComponentWrapper';
import React from 'react';

// Export client components with dynamic imports
export const TableManagement = createClientComponent(
  () => import('./TableManagement'),
  'TableManagement',
  <div className="animate-pulse space-y-4">
    <div className="h-12 bg-muted rounded w-full"></div>
    <div className="h-64 bg-muted rounded w-full"></div>
  </div>
);