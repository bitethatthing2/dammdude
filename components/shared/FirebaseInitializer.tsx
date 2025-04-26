"use client";

import { useEffect } from 'react';
import { initFirebase } from '@/lib/firebase';
import { FcmProvider } from '@/lib/hooks/useFcmToken';
import { Toaster } from 'sonner'; 

export default function FirebaseInitializer({ children }: { children?: React.ReactNode }) {
  useEffect(() => {
    // Initialize Firebase as early as possible
    try {
      // Make sure service worker is ready before initializing Firebase
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', async () => {
          try {
            // Wait a moment to ensure service worker has time to register
            setTimeout(async () => {
              // Initialize Firebase
              initFirebase();
              console.log('Firebase initialized successfully');
            }, 1000);
          } catch (error) {
            console.error('Error in service worker or Firebase initialization:', error);
          }
        });
      } else {
        // No service worker support, still initialize Firebase
        initFirebase();
        console.log('Firebase initialized successfully (no service worker support)');
      }
    } catch (error) {
      console.error('Error initializing Firebase:', error);
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
        duration={5000}
        visibleToasts={3}
      />
    </FcmProvider>
  );
}
