"use client";

import { useEffect, useState } from 'react';
import { NotificationProvider } from '@/lib/contexts/notification-context';
import ServiceWorkerRegister from '@/components/shared/ServiceWorkerRegister';
import FirebaseInitializer from '@/components/shared/FirebaseInitializer';
import { initPwaEventListeners } from '@/lib/pwa/pwaEventHandler';
import { PwaStatusToast } from '@/components/shared/PwaStatusToast';

// Initialize PWA event listeners as early as possible
if (typeof window !== 'undefined') {
  initPwaEventListeners();
}

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
    
    // Initialize PWA event listeners again to ensure they're registered
    // This is a safety measure in case the top-level initialization was missed
    initPwaEventListeners();
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
        <PwaStatusToast />
      </FirebaseInitializer>
    </NotificationProvider>
  );
}

export default ClientSideWrapper;
