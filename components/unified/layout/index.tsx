// Barrel file for layout components
import { createClientComponent } from '../ClientComponentWrapper';
import React from 'react';

// Export client components with dynamic imports
export const Header = createClientComponent(
  () => import('./Header'),
  'Header',
  <div className="h-16 border-b animate-pulse bg-muted/20"></div>
);