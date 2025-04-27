'use client';

import { useEffect, useState } from 'react';
import { NotificationProvider } from '@/lib/contexts/notification-context';
import ServiceWorkerRegister from '@/components/shared/ServiceWorkerRegister';
import FirebaseInitializer from '@/components/shared/FirebaseInitializer';
import { PwaStatusToast } from '@/components/shared/PwaStatusToast';
import { TooltipProvider } from '@/components/ui/tooltip';

// This is to prevent "window is not defined" errors during server-side rendering
interface ClientSideWrapperProps {
  children: React.ReactNode;
}

export default function ClientSideWrapper({ children }: ClientSideWrapperProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    console.log('[ClientSideWrapper] Client-side wrapper mounted');
  }, []);

  // During SSR and initial hydration, render only children to avoid "window is not defined" errors
  if (!isMounted) {
    return <>{children}</>;
  }

  return (
    <TooltipProvider>
      <NotificationProvider>
        <FirebaseInitializer>
          {children}
          <ServiceWorkerRegister />
          <PwaStatusToast />
        </FirebaseInitializer>
      </NotificationProvider>
    </TooltipProvider>
  );
}
