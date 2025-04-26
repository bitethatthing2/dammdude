"use client";

import { useEffect, useState } from 'react';
import { initFirebase } from '@/lib/firebase';
import { FcmProvider } from '@/lib/hooks/useFcmToken';
import { Toaster } from 'sonner'; 
import { Loader2 } from 'lucide-react';

// Global flag to prevent multiple initializations across component instances
let hasInitializedFirebase = false;

export default function FirebaseInitializer({ children }: { children?: React.ReactNode }) {
  const [isInitializing, setIsInitializing] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    // Skip if already initialized to prevent duplicate initialization
    if (hasInitializedFirebase) {
      console.log('Firebase already initialized in a previous instance');
      return;
    }
    
    // Set the flag immediately to prevent race conditions
    hasInitializedFirebase = true;
    
    // Initialize Firebase as early as possible
    const initializeFirebase = async () => {
      setIsInitializing(true);
      
      try {
        // Make sure service worker is ready before initializing Firebase
        if ('serviceWorker' in navigator) {
          // Wait for the page to fully load
          if (document.readyState !== 'complete') {
            await new Promise<void>((resolve) => {
              window.addEventListener('load', () => resolve(), { once: true });
            });
          }
          
          // Initialize Firebase with a small delay to ensure service worker has time to start
          await new Promise(resolve => setTimeout(resolve, 1000));
          await initFirebase();
          console.log('Firebase initialized successfully');
        } else {
          // No service worker support, still initialize Firebase
          await initFirebase();
          console.log('Firebase initialized successfully (no service worker support)');
        }
      } catch (error) {
        console.error('Error initializing Firebase:', error);
        setInitError(error instanceof Error ? error.message : String(error));
        // Don't reset the global flag - we'll consider it initialized even with error
        // to prevent multiple initialization attempts
      } finally {
        setIsInitializing(false);
      }
    };
    
    initializeFirebase();
  }, []);

  return (
    <FcmProvider>
      {isInitializing && (
        <div className="fixed bottom-4 right-4 bg-background border rounded-md shadow-md p-2 z-50 flex items-center gap-2 text-xs">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>Initializing notifications...</span>
        </div>
      )}
      
      {initError && (
        <div className="fixed bottom-4 right-4 bg-destructive/10 border border-destructive rounded-md shadow-md p-2 z-50 text-xs">
          <p>Notification system error</p>
          <p className="text-destructive">{initError}</p>
        </div>
      )}
      
      {children}
      <Toaster 
        theme="light"
        position="top-right"
        expand={false}
        richColors
        duration={8000}
        visibleToasts={3}
      />
    </FcmProvider>
  );
}
