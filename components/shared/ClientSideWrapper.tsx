"use client";

import { useEffect, useState } from 'react';
import { NotificationProvider } from '@/lib/contexts/notification-context';
import ServiceWorkerRegister from '@/components/shared/ServiceWorkerRegister';
import FirebaseInitializer from '@/components/shared/FirebaseInitializer';

interface ClientSideWrapperProps {
  children: React.ReactNode;
}

/**
 * ClientSideWrapper component
 * Handles client-side only components and prevents "window is not defined" errors
 * during server-side rendering
 */
export function ClientSideWrapper({ children }: ClientSideWrapperProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // During SSR and initial hydration, render only children to avoid "window is not defined" errors
  if (!isMounted) {
    return <>{children}</>;
  }

  // Once mounted on the client, render the full component tree with client-side features
  return (
    <NotificationProvider>
      <FirebaseInitializer>
        {children}
        <ServiceWorkerRegister />
      </FirebaseInitializer>
    </NotificationProvider>
  );
}

export default ClientSideWrapper;
