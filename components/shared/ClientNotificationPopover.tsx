"use client";

import { useEffect, useState } from 'react';
import { NotificationPopover } from '@/components/unified/notifications/NotificationPopover';
import { Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

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
    return (
      <div className="flex flex-col items-center justify-center p-2 border border-primary rounded-md text-muted-foreground">
        <Bell className="h-5 w-5" />
        <span className="text-[10px] mt-1">Alerts</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-2 border border-primary rounded-md text-muted-foreground">
      <NotificationPopover />
      <span className="text-[10px] mt-1">Alerts</span>
    </div>
  );
}
