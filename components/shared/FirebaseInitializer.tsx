"use client";

import { useEffect } from 'react';
import { initFirebase } from '@/lib/firebase';
import { FcmProvider } from '@/lib/hooks/useFcmToken';
import { Toaster } from 'sonner'; 

export default function FirebaseInitializer({ children }: { children?: React.ReactNode }) {
  useEffect(() => {
    // Initialize Firebase as early as possible
    try {
      initFirebase();
      console.log('Firebase initialized successfully');
    } catch (error) {
      console.error('Error initializing Firebase:', error);
    }
  }, []);

  return (
    <FcmProvider>
      {children}
      <Toaster position="top-right" richColors closeButton />
    </FcmProvider>
  );
}
