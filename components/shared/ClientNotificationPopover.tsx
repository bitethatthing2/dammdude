"use client";

import { useEffect, useState } from 'react';
import { NotificationPopover } from '@/components/shared/NotificationPopover';

/**
 * Client-side wrapper for the NotificationPopover component
 * Ensures the component is only rendered on the client side
 * to prevent "useNotifications must be used within a NotificationProvider" errors
 */
export function ClientNotificationPopover() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return <NotificationPopover />;
}
