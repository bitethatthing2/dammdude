
"use client";

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useLocationState } from '@/lib/hooks/useLocationState';
import { LocationToggle } from '@/components/shared/LocationToggle';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Utensils, CalendarDays, BookOpen, ShoppingBag, Download, Lock, Bell, Star } from "lucide-react";
import dynamic from 'next/dynamic';
import { PwaInstallGuide } from '@/components/shared/PwaInstallGuide';
import { useFcmContext } from '@/lib/hooks/useFcmToken';
import React, { Suspense } from 'react';

// Dynamically import components that use browser APIs with priority loading
const NotificationIndicator = dynamic(() => import('@/components/shared/NotificationIndicator').then(mod => mod.NotificationIndicator), { 
  ssr: false,
  loading: () => (
    <Button className="gap-1.5">
      <span className="h-4 w-4 animate-pulse bg-muted rounded-full"></span>
      <span>Loading...</span>
    </Button>
  )
});

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

export default function HomePage() {
  const { location } = useLocationState();
  const { resolvedTheme } = useTheme();

  // Determine image source based on theme
  const wolfIconSrc = resolvedTheme === 'dark' 
    ? '/icons/wolf-icon-main-page.png' 
    : '/icons/wolf-icon-main-page-light-screen.png';

  return (
    <div className="flex flex-col items-center pb-24 sm:pb-4 pt-2"> 

      {/* Theme-aware Wolf Icon - Takes full width with minimal side padding */}
      <div className="mb-0 w-full px-2"> 
        <img 
          src={wolfIconSrc} 
          alt="Side Hustle Wolf Icon" 
          className="mx-auto h-auto w-full md:max-w-lg" 
        />
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
            {/* Chef Section with Stars */}
            <div className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground"> 
              <span>Featuring</span>
              <Star className="h-4 w-4 text-amber-400 fill-amber-400" /> 
              <span>5 Star Chef Rebecca Sanchez</span>
            </div>
            {/* Tacos Section */}
            <p className="text-sm font-medium text-primary"> 
              🔥 Home of the Best Tacos in Salem! 🔥
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
                  <NotificationIndicator variant="button" className="w-full sm:w-auto h-9 text-sm px-4" /> 
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
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
  );
}
