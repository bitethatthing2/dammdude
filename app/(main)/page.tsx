"use client";

import { useState, useEffect } from 'react';
import { useLocationState } from '@/lib/hooks/useLocationState';
import { LocationToggle } from '@/components/shared/LocationToggle';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Utensils, CalendarDays, BookOpen, Download, Bell, Star, Users } from "lucide-react";
import dynamic from 'next/dynamic';
import { PwaInstallGuide } from '@/components/shared/PwaInstallGuide';
import { NotificationErrorBoundary } from '@/components/shared/NotificationErrorBoundary';
import React, { Suspense } from 'react';

// Dynamically import components that use browser APIs
const NotificationIndicator = dynamic(
  () => import('@/components/unified/notifications/NotificationIndicator').then(mod => ({ default: mod.NotificationIndicator })),
  { ssr: false }
);

// Loading fallback component
const NotificationIndicatorFallback = () => (
  <Button className="gap-1.5">
    <span className="h-4 w-4 animate-pulse bg-muted rounded-full"></span>
    <span>Loading...</span>
  </Button>
);

// Safe component without direct icon references
const QuickLink = ({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) => {
  return (
    <Card className="bg-transparent border border-primary shadow-none">
      <CardContent className="p-6 flex flex-col items-center justify-center">
        <Link href={href} className="flex flex-col items-center justify-center no-underline">
          <div className="h-10 w-10 mb-3 flex items-center justify-center">
            {icon}
          </div>
          <span className="text-base font-medium text-foreground">{label}</span>
        </Link>
      </CardContent>
    </Card>
  );
};

export default function Page() {
  const [mounted, setMounted] = useState(false);
  const { location } = useLocationState();

  // Wait for component to mount to ensure client-side rendering
  useEffect(() => {
    setMounted(true);
  }, []);

  // Use light mode images only
  const wolfIconSrc = '/icons/wolf-icon-main-page-light-screen.png';
  const sideHustleFontSrc = '/icons/sidehustle-font-lightscreen.png';

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="container mx-auto px-4 py-6 space-y-6 bottom-nav-safe">
      {/* Original Home Page Content */}
      <div className="flex flex-col items-center pt-2 relative">


      {/* Side Hustle Font Logo - Positioned in upper left */}
      <div className="absolute top-4 left-4 z-10"> 
        {mounted ? (
          <Image 
            src={sideHustleFontSrc} 
            alt="Side Hustle" 
            width={144} // Adjust based on your image dimensions
            height={64}  // Adjust based on your image dimensions
            className="h-12 w-auto md:h-14 lg:h-16" 
            priority
          />
        ) : (
          <div className="h-12 w-28 md:h-14 md:w-32 lg:h-16 lg:w-36 bg-muted animate-pulse" />
        )}
      </div>

      {/* Wolf Icon - Takes full width with minimal side padding */}
      <div className="mb-0 w-full px-2"> 
        {mounted ? (
          <Image 
            src={wolfIconSrc} 
            alt="Side Hustle Wolf Icon" 
            width={512} // Adjust based on your image dimensions
            height={512} // Adjust based on your image dimensions
            className="mx-auto h-auto w-full md:max-w-lg" 
            priority
          />
        ) : (
          <div className="mx-auto h-64 w-full md:max-w-lg bg-muted animate-pulse" />
        )}
      </div>
      
      {/* Centered Location Toggle - Constrained width */}
      <div className="flex justify-center mt-0 mb-1 w-full max-w-md px-4"> 
        <LocationToggle />
      </div>
      
      {/* Enhanced Bar Description Card - Wrapped for padding */}
      <div className="w-full max-w-md px-4 mt-4 mb-4"> 
        <Card className="bg-transparent border border-primary shadow-none"> 
          <CardContent className="p-4 text-center space-y-2"> 
            <h2 className="text-lg font-semibold tracking-tight"> 
              High Energy Sports Bar
            </h2>
            {/* Location Display */}
            {location && (
              <p className="text-sm text-muted-foreground">
                📍 {location}
              </p>
            )}
            {/* Chef Section with Stars */}
            <div className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground"> 
              <span>Featuring</span>
              <Star className="h-4 w-4 text-amber-400 fill-amber-400" /> 
              <span>5 Star Chef Rebecca Sanchez</span>
            </div>
            {/* Tacos Section */}
            <p className="text-sm font-medium text-primary"> 
              🔥 Home of the Best Tacos in {location || 'Salem'}! 🔥
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Get Full Experience Card - Wrapped for padding */}
      <div className="w-full max-w-md px-4 mt-4 mb-2"> 
        <Card className="bg-transparent border border-primary shadow-none"> 
          <CardHeader className="pb-1 px-3 pt-3 sm:pb-2 sm:px-4 sm:pt-4">
            <CardTitle className="text-sm sm:text-base font-semibold">Get the Full Experience</CardTitle>
            <CardDescription className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
              Install app & enable notifications for updates
            </CardDescription>
          </CardHeader>
          <CardContent className="px-3 pb-3 pt-2 sm:px-4 sm:pb-4">
            <div className="flex flex-col gap-3 sm:gap-4">
              {/* Installation Section */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3"> 
                <div className="flex items-center gap-2 sm:gap-3 flex-grow min-w-0">
                  <Download className="h-5 w-5 flex-shrink-0" />
                  <div className="flex-grow min-w-0">
                    <p className="text-sm font-medium">Install the App</p>
                    <p className="text-xs text-muted-foreground">Offline access, faster loads.</p>
                  </div>
                </div>
                <div className="flex-shrink-0 mt-1 sm:mt-0">
                  <PwaInstallGuide className="w-full sm:w-auto h-9 text-sm px-4" /> 
                </div>
              </div>

              <hr className="border-border/50" /> 

              {/* Notification Section */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3"> 
                <div className="flex items-center gap-2 sm:gap-3 flex-grow min-w-0">
                  <Bell className="h-5 w-5 flex-shrink-0" />
                  <div className="flex-grow min-w-0">
                    <p className="text-sm font-medium">Enable Notifications</p>
                    <p className="text-xs text-muted-foreground">Order updates & offers.</p>
                  </div>
                </div>
                <div className="flex-shrink-0 mt-1 sm:mt-0">
                  <NotificationErrorBoundary fallback={<NotificationIndicatorFallback />}>
                    <Suspense fallback={<NotificationIndicatorFallback />}>
                      <NotificationIndicator variant="outline" /> 
                    </Suspense>
                  </NotificationErrorBoundary>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links Section */}
      <div className="w-full max-w-md px-4 mt-6 mb-24">
        <h2 className="text-lg font-semibold mb-4 text-center">Quick Links</h2>
        <div className="grid grid-cols-2 gap-4">
          <QuickLink 
            href="/wolfpack" 
            icon={<Users className="h-6 w-6 text-primary" />} 
            label="Join Wolf Pack" 
          />
          <QuickLink 
            href="/table" 
            icon={<Utensils className="h-6 w-6 text-primary" />} 
            label="Order Now" 
          />
          <QuickLink 
            href="/events" 
            icon={<CalendarDays className="h-6 w-6 text-primary" />} 
            label="Events" 
          />
          <QuickLink 
            href="/notifications" 
            icon={<Bell className="h-6 w-6 text-primary" />} 
            label="Notifications" 
          />
        </div>
      </div>

      {/* Category Grid can go here or other content */}
      {/* 
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-card p-4 rounded-lg shadow">
            <p className="font-semibold">Category {i + 1}</p>
          </div>
        ))}
      </div> 
      */}
      </div>
      </div>
    </div>
  );
}
