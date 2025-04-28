"use client";

import { useState, useEffect } from 'react';
import { useLocationState } from '@/lib/hooks/useLocationState';
import { LocationToggle } from '@/components/shared/LocationToggle';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Utensils, CalendarDays, BookOpen, ShoppingBag, Download, Lock, Bell } from "lucide-react";
import dynamic from 'next/dynamic';
import { PwaInstallGuide } from '@/components/shared/PwaInstallGuide';
import { useFcmContext } from '@/lib/hooks/useFcmToken';

// Dynamically import components that use browser APIs with priority loading
const NotificationIndicator = dynamic(() => import('@/components/shared/NotificationIndicator').then(mod => mod.NotificationIndicator), { 
  ssr: false,
  loading: () => (
    <Button variant="outline" className="gap-1.5">
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

  return (
    <div className="flex flex-col pb-24 sm:pb-4 px-4"> 
      
      {/* Centered Main Title */} 
      <div className="text-center mt-4"> 
        <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
          SIDE HUSTLE
        </h1>
      </div>

      {/* Centered Location Toggle with Margin */} 
      <div className="flex justify-center mt-4 mb-6"> 
        <LocationToggle />
      </div>
      
      {/* Get Full Experience Card - Moved down with margin */} 
      <Card className="mt-4 mb-4 bg-transparent border border-primary shadow-none"> 
        <CardHeader className="pb-1 px-3 pt-3 sm:pb-2 sm:px-4 sm:pt-4">
          <CardTitle className="text-xs sm:text-sm font-semibold">Get the Full Experience</CardTitle>
          <CardDescription className="text-[11px] sm:text-xs text-muted-foreground hidden sm:block">
            Install app & enable notifications for updates
          </CardDescription>
        </CardHeader>
        <CardContent className="px-3 pb-3 pt-2 sm:px-4 sm:pb-4">
          {/* Reduced gap */}
          <div className="flex flex-col gap-2 sm:gap-4">
            {/* Installation Section */} 
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3"> 
              <div className="flex items-center gap-2 sm:gap-3 flex-grow min-w-0">
                <Download className="h-4 w-4 flex-shrink-0" />
                <div className="flex-grow min-w-0">
                  {/* Reduced text size */} 
                  <p className="text-xs font-medium">Install the App</p>
                  <p className="text-[10px] text-muted-foreground truncate">Offline access, faster loads.</p>
                </div>
              </div>
              <div className="flex-shrink-0 w-full sm:w-[140px]">
                {/* Explicit button size */} 
                <PwaInstallGuide className="w-full h-8 text-xs px-3" />
              </div>
            </div>

            <hr className="border-border/50 sm:hidden" /> 

            {/* Notification Section */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3"> 
              <div className="flex items-center gap-2 sm:gap-3 flex-grow min-w-0">
                <Bell className="h-4 w-4 flex-shrink-0" />
                <div className="flex-grow min-w-0">
                  {/* Reduced text size */} 
                  <p className="text-xs font-medium">Enable Notifications</p>
                  <p className="text-[10px] text-muted-foreground truncate">Order updates & offers.</p>
                </div>
              </div>
              <div className="flex-shrink-0 w-full sm:w-[140px]">
                {/* REMOVED size prop, ADDED explicit button size */} 
                <NotificationIndicator variant="button" className="w-full h-8 text-xs px-3" /> 
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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
