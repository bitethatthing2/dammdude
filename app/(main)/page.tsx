"use client";

import { useState, useEffect } from 'react';
import { useLocationState } from '@/lib/hooks/useLocationState';
import { LocationToggle } from '@/components/shared/LocationToggle';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Utensils, Download, Bell, Star, Users, MapPin, Truck } from "lucide-react";
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
        <div className="flex flex-col items-center pt-16 relative">

          {/* Side Hustle Font Logo - Fixed positioning with better desktop constraints */}
          <div className="fixed top-0 left-0 z-50 bg-background/95 backdrop-blur-sm p-2 shadow-sm"> 
            {mounted ? (
              <Image 
                src={sideHustleFontSrc} 
                alt="Side Hustle" 
                width={200}
                height={40}
                className="h-6 w-auto sm:h-8 md:h-10 max-w-[150px] sm:max-w-[180px] md:max-w-[200px]" 
                priority
              />
            ) : (
              <div className="h-6 w-20 sm:h-8 sm:w-24 bg-muted animate-pulse rounded" />
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
          <div className="w-full max-w-md px-4 mt-6 mb-32">
            <h2 className="text-lg font-semibold mb-4 text-center">Quick Links</h2>
            <div className="grid grid-cols-2 gap-4">
              <QuickLink 
                href="/menu" 
                icon={<Utensils className="h-6 w-6 text-primary" />} 
                label="Food & Drink Menu" 
              />
              <div onClick={() => {
                const salemCoords = "44.9429,-123.0351";
                window.open(`https://maps.google.com/?q=${salemCoords}`, '_blank');
              }}>
                <Card className="bg-transparent border border-primary shadow-none cursor-pointer hover:bg-muted/50 transition-colors">
                  <CardContent className="p-6 flex flex-col items-center justify-center">
                    <div className="h-10 w-10 mb-3 flex items-center justify-center">
                      <MapPin className="h-6 w-6 text-primary" />
                    </div>
                    <span className="text-base font-medium text-foreground">Directions</span>
                  </CardContent>
                </Card>
              </div>
              <div onClick={() => {
                // Create a simple modal or alert for delivery options
                const deliveryOptions = [
                  { name: 'DoorDash', url: 'https://www.doordash.com/store/side-hustle-lounge-salem-23456789/' },
                  { name: 'Uber Eats', url: 'https://www.ubereats.com/store/side-hustle-lounge/abcdef123456' },
                  { name: 'Postmates', url: 'https://postmates.com/merchant/side-hustle-lounge-salem' }
                ];
                
                const choice = window.confirm(
                  'Choose delivery service:\n\n' +
                  '• DoorDash (Click OK)\n' +
                  '• Uber Eats (Click Cancel, then OK on next prompt)\n' +
                  '• Postmates (Click Cancel twice)'
                );
                
                if (choice) {
                  window.open(deliveryOptions[0].url, '_blank');
                } else {
                  const secondChoice = window.confirm('Open Uber Eats? (Cancel opens Postmates)');
                  if (secondChoice) {
                    window.open(deliveryOptions[1].url, '_blank');
                  } else {
                    window.open(deliveryOptions[2].url, '_blank');
                  }
                }
              }}>
                <Card className="bg-transparent border border-primary shadow-none cursor-pointer hover:bg-muted/50 transition-colors">
                  <CardContent className="p-6 flex flex-col items-center justify-center">
                    <div className="h-10 w-10 mb-3 flex items-center justify-center">
                      <Truck className="h-6 w-6 text-primary" />
                    </div>
                    <span className="text-base font-medium text-foreground">Order Online</span>
                  </CardContent>
                </Card>
              </div>
              <QuickLink 
                href="/wolfpack" 
                icon={<Users className="h-6 w-6 text-primary" />} 
                label="Join Wolf Pack" 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}