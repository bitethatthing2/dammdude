'use client';

import dynamic from 'next/dynamic';
import React from 'react';

// Define interfaces locally matching what's in ClientSideWrapper.tsx
interface ClientSideWrapperProps {
  children: React.ReactNode;
}

// Import the default export from ClientSideWrapper
const ClientSideWrapper = dynamic<ClientSideWrapperProps>(
  () => import('./ClientSideWrapper'),
  { ssr: false }
);

/**
 * Root component for all client-only components
 * This follows functional programming best practices with React
 */
export function ClientComponentRoot({ 
  className 
}: { 
  className?: string 
}): React.ReactElement | null {
  const [isMounted, setIsMounted] = React.useState(false);
  
  React.useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Avoid rendering anything before client-side hydration
  if (!isMounted) {
    return null;
  }
  
  return (
    <div id="client-components-root" className={className}>
      <ClientSideWrapper>
        <NotificationProviderLoader />
        <FirebaseLoader />
        <ServiceWorkerLoader />
      </ClientSideWrapper>
    </div>
  );
}

// Split into smaller components for better organization
function NotificationProviderLoader() {
  return <div className="notification-wrapper" />;
}

function FirebaseLoader() {
  return <div className="firebase-wrapper" />;
}

function ServiceWorkerLoader() {
  return <div className="pwa-wrapper" />;
}
