"use client";

import { useEffect } from 'react';
import { initFirebase } from '@/lib/firebase';

export default function FirebaseInitializer() {
  useEffect(() => {
    // Initialize Firebase as early as possible
    try {
      initFirebase();
    } catch (error) {
      console.error('Error initializing Firebase:', error);
    }
  }, []);

  return null;
}
