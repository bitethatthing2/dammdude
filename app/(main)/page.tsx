"use client";

import { useLocationState } from '@/lib/hooks/useLocationState';
import { LocationToggle } from '@/components/shared/LocationToggle';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Utensils, CalendarDays, BookOpen, ShoppingBag, Download } from "lucide-react";
import { Lock } from "lucide-react"; 
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

// Dynamically import components that use browser APIs
const NotificationIndicator = dynamic(() => import('@/components/shared/NotificationIndicator').then(mod => mod.NotificationIndicator), { ssr: false });
const PwaInstallGuide = dynamic(() => import('@/components/shared/PwaInstallGuide'), { ssr: false });

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

// Fallback install button in case the dynamic import fails
const FallbackInstallButton = () => {
  return (
    <Button 
      className="gap-1.5 bg-primary text-primary-foreground border-0"
      onClick={() => console.log('Fallback install button clicked')}
      data-testid="fallback-pwa-install-button"
    >
      <Download className="h-4 w-4" />
      Install App
    </Button>
  );
};

export default function HomePage() {
  const { location } = useLocationState();
  const [showFallback, setShowFallback] = useState(false);
  
  // If PwaInstallGuide doesn't load within 3 seconds, show the fallback button
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowFallback(true);
    }, 3000);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4 animate-in">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center">
          <h1 className="text-xl font-bold">SIDE HUSTLE</h1>
        </div>
        <div className="flex items-center gap-3">
          <LocationToggle />
          <Link href="/admin">
            <Button variant="outline" size="icon" className="h-9 w-9 bg-primary text-primary-foreground border-0">
              <Lock className="h-5 w-5" />
              <span className="sr-only">Admin Login</span>
            </Button>
          </Link>
        </div>
      </div>

      <Card className="mb-8 bg-transparent border-0 shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl">Welcome to our {location === 'portland' ? 'Portland' : 'Salem'} location!</CardTitle>
          <CardDescription className="text-muted-foreground text-base">
            Enjoy great food, drinks, and sports in our high-energy atmosphere.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p>
              Order from your table or book a reservation for your next visit.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* App Installation and Notification Card */}
      <Card className="mb-8 bg-transparent border border-primary shadow-none">
        <CardHeader className="pb-2">
          <CardTitle>Get the Full Experience</CardTitle>
          <CardDescription className="text-muted-foreground">
            Install our app for offline access and enable notifications for updates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-4 justify-center sm:justify-start">
              {/* Use the dynamic component with a fallback */}
              {!showFallback ? (
                <PwaInstallGuide variant="button" className="bg-primary text-primary-foreground border-0" />
              ) : (
                <FallbackInstallButton />
              )}
              <NotificationIndicator variant="button" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <QuickLink 
          href="/menu" 
          icon={<Utensils className="h-10 w-10" />} 
          label="Menu" 
        />
        <QuickLink 
          href="/events" 
          icon={<CalendarDays className="h-10 w-10" />} 
          label="Events" 
        />
        <QuickLink 
          href="/book" 
          icon={<BookOpen className="h-10 w-10" />} 
          label="Book Table" 
        />
        <QuickLink 
          href="/merch" 
          icon={<ShoppingBag className="h-10 w-10" />} 
          label="Merch" 
        />
      </div>

      <Card className="mb-8 bg-transparent border-0 shadow-none">
        <CardHeader className="pb-2">
          <CardTitle>Order from your Table</CardTitle>
          <CardDescription className="text-muted-foreground">
            Scan your table's QR code or enter your table number to place an order
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button 
            asChild 
            variant="outline"
            className="bg-primary text-primary-foreground border-0"
          >
            <Link href="/order/1">
              Table #1 (Demo)
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
