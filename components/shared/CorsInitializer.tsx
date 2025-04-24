"use client";

import { useEffect } from 'react';
import { configureCors } from '@/lib/supabase/client';

export default function CorsInitializer() {
  useEffect(() => {
    // Initialize CORS configuration on app start
    const initCors = async () => {
      try {
        await configureCors();
      } catch (error) {
        console.error('Failed to initialize CORS:', error);
      }
    };

    initCors();
  }, []);

  // This component doesn't render anything
  return null;
}
