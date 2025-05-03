// Barrel file for menu-related components
import { createClientComponent } from '../ClientComponentWrapper';
import React from 'react';

// Export basic components
export { MenuItem } from './MenuItem';

// Export client components with dynamic imports
export const MenuGrid = createClientComponent(
  () => import('./MenuGrid'),
  'MenuGrid',
  <div className="animate-pulse space-y-4">
    <div className="h-10 bg-muted rounded-md w-full"></div>
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="h-48 bg-muted rounded-md"></div>
      ))}
    </div>
  </div>
);