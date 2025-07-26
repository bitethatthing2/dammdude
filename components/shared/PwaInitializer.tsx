'use client';

import { useEffect } from 'react';
import { initPwaEventListeners } from '@/lib/pwa/pwaEventHandler';

export function PwaInitializer() {
  useEffect(() => {
    // Initialize PWA functionality early to prevent duplicate handlers
    try {
      initPwaEventListeners();
    } catch (error) {
      console.error('Failed to initialize PWA:', error);
    }
  }, []);

  return null; // This component doesn't render anything
}
