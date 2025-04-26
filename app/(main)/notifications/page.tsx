"use client";

import { Suspense } from 'react';
import { Bell } from 'lucide-react';
import { NotificationPopover } from '@/components/shared/NotificationPopover';

export default function NotificationsPage() {
  return (
    <div className="container py-8">
      <div className="flex items-center mb-8">
        <Bell className="h-6 w-6 mr-2 text-primary" />
        <h1 className="text-3xl font-bold">Notifications</h1>
      </div>
      
      <Suspense fallback={<NotificationsPageSkeleton />}>
        <div className="max-w-md mx-auto">
          <p className="text-muted-foreground mb-6">
            View and manage your notifications. Stay updated with the latest events, promotions, and updates from Side Hustle.
          </p>
          
          <div className="border border-primary rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-4">Your Notifications</h2>
            <NotificationList />
          </div>
        </div>
      </Suspense>
    </div>
  );
}

function NotificationsPageSkeleton() {
  return (
    <div className="max-w-md mx-auto">
      <div className="h-4 w-3/4 bg-muted rounded mb-6 animate-pulse" />
      <div className="border border-primary rounded-lg p-4">
        <div className="h-6 w-1/2 bg-muted rounded mb-4 animate-pulse" />
        <div className="space-y-4">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="h-5 w-5 rounded-full bg-muted animate-pulse" />
              <div className="flex-1">
                <div className="h-4 w-full bg-muted rounded mb-2 animate-pulse" />
                <div className="h-3 w-1/3 bg-muted rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function NotificationList() {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <NotificationPopover />
      <p className="text-sm text-muted-foreground mt-4">
        Open the notifications panel to view your notifications
      </p>
    </div>
  );
}
