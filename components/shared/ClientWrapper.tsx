'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

// This component handles the loading of all components that need to be client-side only
// By consolidating them here, we follow the pattern of minimizing client-side JavaScript

// Proper typing for components
interface ClientWrapperProps {
  className?: string;
  children?: React.ReactNode;
}

// Dynamically import components that require client-side only rendering
const ClientSideWrapperComponent = dynamic(
  () => import('./ClientSideWrapper'),
  { ssr: false }
);

// Add other client-side only components as needed here
// This follows the pattern of component composition and separation of concerns

export function ClientWrapper({ className, children }: ClientWrapperProps) {
  const [isMounted, setIsMounted] = useState(false);
  
  // Use effect to handle client-side mounting
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // During SSR or before hydration, render nothing to avoid mismatches
  if (!isMounted) {
    return null;
  }
  
  // After client-side hydration, render the client-only components
  return (
    <div id="client-components-root" className={className}>
      <ClientSideWrapperComponent>
        {children}
      </ClientSideWrapperComponent>
    </div>
  );
}
