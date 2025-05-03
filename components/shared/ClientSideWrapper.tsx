'use client';

import { useEffect, useState, useRef, createContext, useContext } from 'react';
import { UnifiedNotificationProvider } from '@/components/unified/notifications';
import ServiceWorkerRegister from '@/components/shared/ServiceWorkerRegister';
import FirebaseInitializer from '@/components/shared/FirebaseInitializer';
import { PwaStatusToast } from '@/components/shared/PwaStatusToast';
import { TooltipProvider } from '@/components/ui/tooltip';

// This is to prevent "window is not defined" errors during server-side rendering
// Define the event type for beforeinstallprompt as it's not standard TS yet
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed', platform: string }>;
  prompt(): Promise<void>;
}

interface ClientSideWrapperProps {
  /**
   * The children to be rendered within the ClientSideWrapper
   */
  children: React.ReactNode;
}

interface PwaInstallContextProps {
  deferredPrompt: BeforeInstallPromptEvent | null;
  setDeferredPrompt: (deferredPrompt: BeforeInstallPromptEvent | null) => void;
}

const PwaInstallContext = createContext<PwaInstallContextProps>({
  deferredPrompt: null,
  setDeferredPrompt: () => {},
});

export const usePwaInstall = () => useContext(PwaInstallContext);

export default function ClientSideWrapper({ children }: ClientSideWrapperProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    setIsMounted(true);
    console.log('[ClientSideWrapper] Client-side wrapper mounted');
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      console.log('[ClientSideWrapper] beforeinstallprompt event captured');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // During SSR and initial hydration, render only children to avoid "window is not defined" errors
  if (!isMounted) {
    return <>{children}</>;
  }

  return (
    <PwaInstallContext.Provider value={{ deferredPrompt, setDeferredPrompt }}>
      <TooltipProvider>
        <UnifiedNotificationProvider recipientId='customer' role='customer'>
          <FirebaseInitializer>
            {children}
            <ServiceWorkerRegister />
            <PwaStatusToast />
          </FirebaseInitializer>
        </UnifiedNotificationProvider>
      </TooltipProvider>
    </PwaInstallContext.Provider>
  );
}
