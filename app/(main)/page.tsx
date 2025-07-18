"use client";

import { useState, useEffect } from 'react';
import { useLocationState } from '@/lib/hooks/useLocationState';
import { LocationSwitcher } from '@/components/shared/LocationSwitcher';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Utensils, Download, Bell, Star, Users, MapPin, Truck, ExternalLink } from "lucide-react";
import dynamic from 'next/dynamic';
import { PwaInstallGuide } from '@/components/shared/PwaInstallGuide';
import { NotificationErrorBoundary } from '@/components/shared/NotificationErrorBoundary';
import { DynamicLogo } from '@/components/shared/DynamicLogo';
import { DynamicGoogleMaps, InstagramEmbed } from '@/components/shared/DynamicGoogleMaps';
import React, { Suspense } from 'react';
import { MainPageThemeControl } from '@/components/shared/MainPageThemeControl';
import { ThemeControl } from '@/components/shared/ThemeControl';

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


export default function Page() {
  const [mounted, setMounted] = useState(false);
  const { location } = useLocationState();

  // Wait for component to mount to ensure client-side rendering
  useEffect(() => {
    setMounted(true);
  }, []);

  // Theme-based images are handled by DynamicLogo component

  return (
    <div className="main-content bg-gradient-to-br from-background to-muted">
      {/* Side Hustle Logo - top-left */}
      <div className="absolute top-0 left-4 z-10">
        <DynamicLogo type="brand" width={160} height={60} className="rounded-md" />
      </div>
      
      {/* Theme Control - top-right */}
      <div className="absolute top-0 right-4 z-10">
        <ThemeControl />
      </div>

      <div className="container mx-auto px-4 py-2 sm:py-3 space-y-2 sm:space-y-3">
        {/* Original Home Page Content */}
        <div className="flex flex-col items-center relative">


          {/* Wolf Icon - centered */}
          <div className="w-full flex justify-center items-center px-4 mt-4 sm:mt-8"> 
            {mounted ? (
              <DynamicLogo type="wolf" width={1000} height={1000} className="w-[28rem] h-[28rem] sm:w-[32rem] sm:h-[32rem] md:w-[36rem] md:h-[36rem] lg:w-[42rem] lg:h-[42rem] xl:w-[48rem] xl:h-[48rem] object-contain" alt="Side Hustle Wolf Icon" />
            ) : (
              <div className="w-[28rem] h-[28rem] sm:w-[32rem] sm:h-[32rem] md:w-[36rem] md:h-[36rem] bg-muted animate-pulse rounded-full" />
            )}
          </div>
          
          {/* Centered Location Switcher - Constrained width */}
          <div className="flex justify-center mt-0 mb-1 w-full max-w-md sm:max-w-lg px-4"> 
            <LocationSwitcher />
          </div>
          
          {/* Enhanced Bar Description Card - Wrapped for padding */}
          <div className="w-full max-w-md sm:max-w-lg px-4 mt-1 mb-1 sm:mt-2 sm:mb-2"> 
            <Card className="bg-card/90 backdrop-blur-sm border border-primary shadow-lg"> 
              <CardContent className="p-3 sm:p-4 text-center space-y-1 sm:space-y-2"> 
                <h2 className="text-lg font-semibold tracking-tight text-card-foreground"> 
                  High Energy Sports Bar
                </h2>
                {/* Location Display */}
                {location && (
                  <p className="text-sm text-card-foreground/80 font-medium">
                    📍 {location}
                  </p>
                )}
                {/* Chef Section with Stars */}
                <div className="flex items-center justify-center gap-1.5 text-sm text-card-foreground/80"> 
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
          <div className="w-full max-w-md sm:max-w-lg px-4 mt-2 mb-1"> 
            <Card className="bg-card/90 backdrop-blur-sm border border-primary shadow-lg"> 
              <CardHeader className="pb-1 px-3 pt-3 sm:pb-2 sm:px-4 sm:pt-4">
                <CardTitle className="text-sm sm:text-base font-semibold text-card-foreground">Get the Full Experience</CardTitle>
                <CardDescription className="text-xs sm:text-sm text-card-foreground/70 hidden sm:block">
                  Install app & enable notifications for updates
                </CardDescription>
              </CardHeader>
              <CardContent className="px-3 pb-3 pt-2 sm:px-4 sm:pb-4">
                <div className="flex flex-col gap-3 sm:gap-4">
                  {/* Installation Section */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3"> 
                    <div className="flex items-center gap-2 sm:gap-3 flex-grow min-w-0">
                      <Download className="h-5 w-5 flex-shrink-0 text-card-foreground" />
                      <div className="flex-grow min-w-0">
                        <p className="text-sm font-medium text-card-foreground">Install the App</p>
                        <p className="text-xs text-card-foreground/70">Offline access, faster loads.</p>
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
                      <Bell className="h-5 w-5 flex-shrink-0 text-card-foreground" />
                      <div className="flex-grow min-w-0">
                        <p className="text-sm font-medium text-card-foreground">Enable Notifications</p>
                        <p className="text-xs text-card-foreground/70">Order updates & offers.</p>
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

          {/* Order Online Section */}
          <div className="w-full max-w-md px-4 mt-4 mb-32">
            <h2 className="text-lg font-semibold mb-3 text-center text-foreground">Order Online</h2>
            <div className="space-y-2">
              {/* DoorDash Button */}
              <button
                onClick={() => window.open('https://www.doordash.com/store/side-hustle-bar-salem-25388462/27964950/?rwg_token=ACgRB3exS_UE0v2-5IhbmqYOfovUT1i9W1wAY2C48dJqakkaWX27DmNOgUyGwJNV1F7TdH9ezS8mhE5LxjaxGq-Evp9grjMhmA==&utm_campaign=gpa', '_blank', 'noopener,noreferrer')}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-4 px-6 rounded-lg transition-colors duration-200 flex items-center justify-between group"
                aria-label="Order food on DoorDash"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white rounded p-0 flex items-center justify-center overflow-hidden">
                    <Image 
                      src="/icons/doordash_icon.png" 
                      alt="DoorDash" 
                      width={32} 
                      height={32} 
                      className="object-contain"
                      style={{ width: 'auto', height: 'auto' }}
                    />
                  </div>
                  <span className="text-base">Order on DoorDash</span>
                </div>
                <ExternalLink className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              {/* Uber Eats Button */}
              <button
                onClick={() => window.open('https://www.ubereats.com/store/side-hustle-bar/n5ak1cjlRvuf0Hefn7Iddw?utm_campaign=CM2508147-search-free-nonbrand-google-pas_e_all_acq_Global&utm_medium=search-free-nonbrand&utm_source=google-pas', '_blank', 'noopener,noreferrer')}
                className="w-full bg-black hover:bg-gray-800 text-white font-medium py-4 px-6 rounded-lg transition-colors duration-200 flex items-center justify-between group"
                aria-label="Order food on Uber Eats"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white rounded p-0 flex items-center justify-center overflow-hidden">
                    <Image 
                      src="/icons/uber-eats.png" 
                      alt="Uber Eats" 
                      width={32} 
                      height={32} 
                      className="w-8 h-8 object-contain"
                    />
                  </div>
                  <span className="text-base">Order on Uber Eats</span>
                </div>
                <ExternalLink className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              {/* Postmates Button */}
              <button
                onClick={() => window.open('https://postmates.com/store/side-hustle-bar/n5ak1cjlRvuf0Hefn7Iddw?utm_campaign=CM2508147-search-free-nonbrand-google-pas_e_all_acq_Global&utm_medium=search-free-nonbrand&utm_source=google-pas', '_blank', 'noopener,noreferrer')}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-medium py-4 px-6 rounded-lg transition-colors duration-200 flex items-center justify-between group"
                aria-label="Order food on Postmates"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white rounded p-0 flex items-center justify-center overflow-hidden">
                    <Image 
                      src="/icons/postmates.png" 
                      alt="Postmates" 
                      width={32} 
                      height={32} 
                      className="object-contain"
                      style={{ width: 'auto', height: 'auto' }}
                    />
                  </div>
                  <span className="text-base">Order on Postmates</span>
                </div>
                <ExternalLink className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* Additional Quick Actions */}
            <div className="grid grid-cols-2 gap-2 mt-4">
              <Link href="/menu">
                <Card className="bg-card/90 backdrop-blur-sm border border-primary shadow-lg cursor-pointer hover:bg-card/95 transition-colors">
                  <CardContent className="p-3 flex flex-col items-center justify-center">
                    <Utensils className="h-5 w-5 text-primary mb-1" />
                    <span className="text-sm font-medium text-card-foreground">View Menu</span>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/wolfpack">
                <Card className="bg-card/90 backdrop-blur-sm border border-primary shadow-lg cursor-pointer hover:bg-card/95 transition-colors">
                  <CardContent className="p-3 flex flex-col items-center justify-center">
                    <Users className="h-5 w-5 text-primary mb-1" />
                    <span className="text-sm font-medium text-card-foreground">Join Wolf Pack</span>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>

          {/* Google Maps Section */}
          <div className="w-full max-w-4xl px-4 mt-6 mb-4">
            <h2 className="text-xl font-semibold text-center mb-3 text-foreground">Find Us</h2>
            <DynamicGoogleMaps 
              className="w-full" 
              height="400px" 
              showLocationSwitcher={true}
            />
          </div>

          {/* Instagram Section */}
          <div className="w-full max-w-2xl px-4 mt-4 mb-6">
            <h2 className="text-xl font-semibold text-center mb-3 text-foreground">Follow @sidehustle_bar</h2>
            <InstagramEmbed className="w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}