"use client";

import { useEffect, useRef } from 'react';
import { initFirebase } from '@/lib/firebase';
import { FcmProvider } from '@/lib/hooks/useFcmToken';
import { Toaster } from 'sonner'; 

// Global flag to prevent multiple initializations
let hasInitializedFirebase = false;

export default function FirebaseInitializer({ children }: { children?: React.ReactNode }) {
  const initTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Skip if already initialized
    if (hasInitializedFirebase) {
      console.log('Firebase already initialized, skipping initialization');
      return;
    }
    
    // Set flag to prevent multiple initializations
    hasInitializedFirebase = true;
    
    // Initialize Firebase as early as possible
    try {
      // Make sure service worker is ready before initializing Firebase
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
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
        }, { once: true }); // Use once to prevent multiple registrations
      } else {
        // No service worker support, still initialize Firebase
        initFirebase();
        console.log('Firebase initialized successfully (no service worker support)');
      }
    } catch (error) {
      console.error('Error in Firebase initialization setup:', error);
      hasInitializedFirebase = false;
    }
    
    // Cleanup function
    return () => {
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
        initTimeoutRef.current = null;
      }
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
        duration={5000}
        visibleToasts={3}
      />
    </FcmProvider>
  );
}
