"use client";

import { useEffect } from 'react';
import { initFirebase } from '@/lib/firebase';
import { FcmProvider } from '@/lib/hooks/useFcmToken';
import { Toaster } from 'sonner'; 

// Global flag to prevent multiple initializations
let hasInitializedFirebase = false;

export default function FirebaseInitializer({ children }: { children?: React.ReactNode }) {
  useEffect(() => {
    // Skip if already initialized to prevent duplicate initialization
    if (hasInitializedFirebase) {
      console.log('Firebase already initialized in a previous instance');
      return;
    }
    
    // Set the flag immediately to prevent race conditions
    hasInitializedFirebase = true;
    
    // Initialize Firebase as early as possible
    try {
      // Make sure service worker is ready before initializing Firebase
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
          // Simple approach - just initialize Firebase after load
          setTimeout(() => {
            initFirebase();
            console.log('Firebase initialized successfully');
          }, 1000);
        }, { once: true }); // Use once to prevent multiple registrations
      } else {
        // No service worker support, still initialize Firebase
        initFirebase();
        console.log('Firebase initialized successfully (no service worker support)');
      }
    } catch (error) {
      console.error('Error initializing Firebase:', error);
      // Don't reset the flag - it's still considered initialized even with error
    }
  }, []);

  return (
    <FcmProvider>
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
