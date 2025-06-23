'use client';

import React, { useEffect, useState, createContext, useContext } from 'react';
import { UnifiedNotificationProvider } from '@/components/unified';
import ServiceWorkerRegister from '@/components/shared/ServiceWorkerRegister';
import FirebaseInitializer from '@/components/shared/FirebaseInitializer';
import { PwaStatusToast } from '@/components/shared/PwaStatusToast';
import { TooltipProvider } from '@/components/ui/tooltip';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

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

interface AuthSubscription {
  unsubscribe: () => void;
}

export default function ClientSideWrapper({ children }: ClientSideWrapperProps): React.ReactElement {
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [userId, setUserId] = useState<string | undefined>();
  const [authChecked, setAuthChecked] = useState<boolean>(false);

  useEffect(() => {
    setIsMounted(true);
    console.log('[ClientSideWrapper] Client-side wrapper mounted');

    // Get the actual user ID
    const initializeAuth = async (): Promise<() => void> => {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data: { session } }: { data: { session: { user?: { id: string } } | null } } = await supabase.auth.getSession();
        
        if (session?.user?.id) {
          setUserId(session.user.id);
        }
        
        // Mark auth as checked even if no user
        setAuthChecked(true);
        
        // Listen for auth state changes
        const { data: { subscription } }: { data: { subscription: AuthSubscription } } = supabase.auth.onAuthStateChange(
          (_event: string, session: { user?: { id: string } } | null) => {
            setUserId(session?.user?.id);
          }
        );
        
        // Store cleanup function
        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('[ClientSideWrapper] Error initializing auth:', error);
        setAuthChecked(true); // Mark as checked even on error
        return () => {};
      }
    };

    // Initialize auth and store cleanup
    const cleanup: Promise<() => void> = initializeAuth();

    // Cleanup on unmount
    return () => {
      cleanup.then((unsubscribe: () => void) => unsubscribe?.());
    };
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event): void => {
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
  if (!isMounted || !authChecked) {
    return <>{children}</>;
  }

  // If auth is checked but no userId, render without notification provider
  if (!userId) {
    return (
      <PwaInstallContext.Provider value={{ deferredPrompt, setDeferredPrompt }}>
        <TooltipProvider>
          <FirebaseInitializer>
            {children}
            <ServiceWorkerRegister />
            <PwaStatusToast />
          </FirebaseInitializer>
        </TooltipProvider>
      </PwaInstallContext.Provider>
    );
  }

  // User is authenticated, render with notification provider
  return (
    <PwaInstallContext.Provider value={{ deferredPrompt, setDeferredPrompt }}>
      <TooltipProvider>
        <UnifiedNotificationProvider recipientId={userId}>
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