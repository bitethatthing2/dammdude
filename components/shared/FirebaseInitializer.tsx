"use client";

import { useEffect, useRef } from 'react';
import { initFirebase } from '@/lib/firebase';
import { FcmProvider } from '@/lib/hooks/useFcmToken';
import { Toaster } from 'sonner'; 

// Global flag to prevent multiple initializations - must be outside component
let hasInitializedFirebase = false;
// Global flag to track if event listener was attached
let hasAttachedListener = false;

export default function FirebaseInitializer({ children }: { children?: React.ReactNode }) {
  const initTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Skip if already initialized
    if (hasInitializedFirebase) {
      console.log('Firebase already initialized, skipping initialization');
      return;
    }
    
    // Skip if event listener was already attached
    if (hasAttachedListener) {
      console.log('Load event listener already attached, skipping');
      return;
    }
    
    // Set flag to prevent multiple initializations
    hasInitializedFirebase = true;
    hasAttachedListener = true;
    
    // Initialize Firebase as early as possible
    try {
      // Make sure service worker is ready before initializing Firebase
      if ('serviceWorker' in navigator) {
        // Use a safer approach to attach the load event
        const handleLoad = () => {
          // Clear any previous timeout
          if (initTimeoutRef.current) {
            clearTimeout(initTimeoutRef.current);
          }
          
          // Set a new timeout
          initTimeoutRef.current = setTimeout(() => {
            try {
              // Initialize Firebase
              initFirebase();
              console.log('Firebase initialized successfully');
            } catch (error) {
              console.error('Error initializing Firebase:', error);
              hasInitializedFirebase = false;
            }
          }, 1000);
        };
        
        if (document.readyState === 'complete') {
          // Document already loaded, call handler directly
          handleLoad();
        } else {
          // Document still loading, attach event listener
          window.addEventListener('load', handleLoad, { once: true });
        }
      } else {
        // No service worker support, still initialize Firebase
        initFirebase();
        console.log('Firebase initialized successfully (no service worker support)');
      }
    } catch (error) {
      console.error('Error in Firebase initialization setup:', error);
      hasInitializedFirebase = false;
      hasAttachedListener = false;
    }
    
    // Cleanup function
    return () => {
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
        initTimeoutRef.current = null;
      }
      // We intentionally don't reset hasInitializedFirebase or hasAttachedListener
      // to prevent multiple initializations across component remounts
    };
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
