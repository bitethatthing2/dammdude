"use client";

import { useEffect, useState } from 'react';
import { BottomNav } from './BottomNav';
import { UnifiedNotificationProvider } from '@/components/unified/notifications';

/**
 * Client-side wrapper for the BottomNav component
 * Ensures the component is only rendered on the client side
 * and provides the NotificationProvider context
 */
const ClientBottomNav = () => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    // Return a placeholder with the same dimensions to avoid layout shift
    return (
      <nav className="fixed bottom-0 left-0 right-0 h-16 border-t bg-transparent backdrop-blur-md z-50 flex justify-around items-center px-2">
        {/* Placeholder content */}
      </nav>
    );
  }

  // Wrap BottomNav with UnifiedNotificationProvider to ensure notifications work
  return (
    <UnifiedNotificationProvider recipientId='customer' role='customer'>
      <BottomNav />
    </UnifiedNotificationProvider>
  );
};

export default ClientBottomNav;
