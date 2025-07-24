"use client";

import { useState, useEffect } from 'react';
import { useLocationState } from '@/lib/hooks/useLocationState';
import { LocationSwitcher } from '@/components/shared/LocationSwitcher';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Utensils, Download, Bell, Star, Users, MapPin, Truck, ExternalLink } from "lucide-react";
import dynamic from 'next/dynamic';
import { PwaInstallGuide } from '@/components/shared/PwaInstallGuide';
import { NotificationErrorBoundary } from '@/components/shared/NotificationErrorBoundary';
import { DynamicLogo } from '@/components/shared/DynamicLogo';
import { DynamicGoogleMaps } from '@/components/shared/DynamicGoogleMaps';
import { InstagramEmbed } from '@/components/shared/InstagramEmbed';
import React, { Suspense } from 'react';
import { VideoBackground } from '@/components/shared/VideoBackground';

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
  const [showDeliveryDialog, setShowDeliveryDialog] = useState(false);
  const { location } = useLocationState();

  // Wait for component to mount to ensure client-side rendering
  useEffect(() => {
    setMounted(true);
  }, []);

  // Theme-based images are handled by DynamicLogo component

  return (
    <div className="main-content bg-black text-white min-h-screen">
      {/* Hero Section with Video Background */}
      <div className="relative h-screen w-full overflow-hidden">
        <VideoBackground 
          videoSrc="/icons/main-page-only.mp4"
          overlayOpacity={0.4}
        />
        
        {/* Hero Content */}
        <div className="absolute inset-0 flex flex-col justify-center items-center z-10 px-4 text-center">
          {/* Combined Logo with Wolf and Title */}
          <div className="mb-8 animate-fade-in">
            <Image 
              src="/icons/wolf-and-title.png"
              alt="Side Hustle Bar"
              width={400}
              height={200}
              className="mx-auto w-full max-w-[250px] md:max-w-[350px] lg:max-w-[400px] h-auto"
              priority
            />
          </div>
          
          {/* Tagline */}
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-12 max-w-4xl leading-tight">
            Salem & Portland's Premier Sports Bar & Mexican Kitchen
          </h1>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/menu">
              <Button size="lg" className="bg-red-600 hover:bg-red-700 text-white px-10 py-4 text-xl font-semibold rounded-full shadow-lg hover:shadow-xl transition-all">
                View Menu
              </Button>
            </Link>
            <button
              onClick={() => setShowDeliveryDialog(true)}
              className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white px-10 py-4 text-xl font-semibold rounded-full border-2 border-white/30 hover:border-white/50 transition-all shadow-lg hover:shadow-xl"
            >
              Order Online
            </button>
          </div>
        </div>
        
        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </div>

      {/* Featured Section */}
      <section className="py-20 px-4 bg-zinc-900">
        <div className="container mx-auto">
          <h2 className="text-4xl md:text-5xl font-serif text-center mb-12">Featured Cocktails & Dishes</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Featured Item 1 - Video */}
            <div className="group relative overflow-hidden rounded-lg cursor-pointer">
              <div className="aspect-square relative">
                <video
                  className="absolute inset-0 w-full h-full object-cover"
                  src="/icons/first-box.mp4"
                  autoPlay
                  muted
                  loop
                  playsInline
                  style={{ 
                    minWidth: '100%',
                    minHeight: '100%',
                    width: 'auto',
                    height: 'auto'
                  }}
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center p-6">
                  <div className="text-center">
                    <p className="text-white text-lg md:text-xl font-serif leading-relaxed">
                      Towering margaritas, legendary flavors. Share the moment, raise your glass, and let the good times flow.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Featured Item 2 - Video */}
            <div className="group relative overflow-hidden rounded-lg cursor-pointer">
              <div className="aspect-square relative">
                <video
                  className="absolute inset-0 w-full h-full object-cover"
                  src="/icons/video-food.mp4"
                  autoPlay
                  muted
                  loop
                  playsInline
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center p-6">
                  <div className="text-center">
                    <p className="text-white text-lg md:text-xl font-serif leading-relaxed">
                      At Side Hustle Bar, you're part of the pack. Unwind, savor, and let the energy of good food and great company take over.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Featured Item 3 */}
            <div className="group relative overflow-hidden rounded-lg cursor-pointer">
              <div className="aspect-square bg-gradient-to-br from-blue-900 to-purple-900 p-8 flex items-center justify-center">
                <div className="text-center">
                  <h3 className="text-2xl font-serif mb-2">Loaded Nachos</h3>
                  <p className="text-white/80">Perfect for sharing</p>
                </div>
              </div>
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-white text-lg">View Details</span>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* About Section with Instagram Images */}
      <section className="py-20 px-4 bg-black">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-serif mb-6">Welcome to Side Hustle</h2>
              <p className="text-xl text-white/80 mb-6">
                Experience the perfect blend of high-energy sports bar atmosphere with authentic Mexican cuisine. 
                Our 5-star Chef Rebecca Sanchez brings you the best tacos in Salem.
              </p>
              <div className="flex items-center gap-4 mb-6">
                <Star className="h-6 w-6 text-amber-400 fill-amber-400" />
                <Star className="h-6 w-6 text-amber-400 fill-amber-400" />
                <Star className="h-6 w-6 text-amber-400 fill-amber-400" />
                <Star className="h-6 w-6 text-amber-400 fill-amber-400" />
                <Star className="h-6 w-6 text-amber-400 fill-amber-400" />
              </div>
              <div className="flex justify-start mb-4">
                <LocationSwitcher />
              </div>
            </div>
            
            <div className="relative h-[500px] rounded-lg overflow-hidden">
              <Image 
                src="/icons/side-hustle-exterior.jpg"
                alt="Side Hustle Bar Food"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>
      {/* Get Full Experience Section */}
      <section className="py-20 px-4 bg-zinc-900">
        <div className="container mx-auto max-w-4xl">
          <Card className="bg-zinc-800 border-zinc-700"> 
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-serif text-white">Get the Full Experience</CardTitle>
              <CardDescription className="text-lg text-zinc-400">
                Install our app & enable notifications for exclusive offers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Installation Section */}
                <div className="flex items-center gap-4 p-6 bg-zinc-700/50 rounded-lg"> 
                  <Download className="h-8 w-8 flex-shrink-0 text-red-500" />
                  <div className="flex-grow">
                    <p className="text-lg font-medium text-white">Install the App</p>
                    <p className="text-zinc-400">Offline access, faster loads, exclusive features</p>
                  </div>
                  <PwaInstallGuide className="bg-red-600 hover:bg-red-700 text-white" />
                </div>

                {/* Notification Section */}
                <div className="flex items-center gap-4 p-6 bg-zinc-700/50 rounded-lg"> 
                  <Bell className="h-8 w-8 flex-shrink-0 text-green-500" />
                  <div className="flex-grow">
                    <p className="text-lg font-medium text-white">Enable Notifications</p>
                    <p className="text-zinc-400">Order updates & special offers</p>
                  </div>
                  <NotificationErrorBoundary fallback={<NotificationIndicatorFallback />}>
                    <Suspense fallback={<NotificationIndicatorFallback />}>
                      <NotificationIndicator className="bg-green-600 hover:bg-green-700 text-white" /> 
                    </Suspense>
                  </NotificationErrorBoundary>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Order Online Section */}
      <section className="py-20 px-4 bg-black">
        <div className="container mx-auto max-w-2xl">
          <h2 className="text-4xl font-serif mb-8 text-center">Order Online</h2>
          <div className="space-y-4">
            {/* DoorDash Button */}
            <button
              onClick={() => window.open('https://www.doordash.com/store/side-hustle-bar-salem-25388462/27964950/', '_blank')}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-5 px-8 rounded-lg transition-all duration-200 flex items-center justify-between group transform hover:scale-105"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white rounded-lg p-1 flex items-center justify-center">
                  <Image 
                    src="/icons/doordash_icon.png" 
                    alt="DoorDash" 
                    width={32} 
                    height={32} 
                    className="object-contain"
                  />
                </div>
                <span className="text-xl">Order on DoorDash</span>
              </div>
              <ExternalLink className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>

            {/* Uber Eats Button */}
            <button
              onClick={() => window.open('https://www.ubereats.com/store/side-hustle-bar/n5ak1cjlRvuf0Hefn7Iddw', '_blank')}
              className="w-full bg-black border-2 border-white hover:bg-zinc-900 text-white font-medium py-5 px-8 rounded-lg transition-all duration-200 flex items-center justify-between group transform hover:scale-105"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white rounded-lg p-1 flex items-center justify-center">
                  <Image 
                    src="/icons/uber-eats.png" 
                    alt="Uber Eats" 
                    width={32} 
                    height={32} 
                    className="object-contain"
                  />
                </div>
                <span className="text-xl">Order on Uber Eats</span>
              </div>
              <ExternalLink className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>

            {/* Postmates Button */}
            <button
              onClick={() => window.open('https://postmates.com/store/side-hustle-bar/n5ak1cjlRvuf0Hefn7Iddw', '_blank')}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-medium py-5 px-8 rounded-lg transition-all duration-200 flex items-center justify-between group transform hover:scale-105"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white rounded-lg p-1 flex items-center justify-center">
                  <Image 
                    src="/icons/postmates.png" 
                    alt="Postmates" 
                    width={32} 
                    height={32} 
                    className="object-contain"
                  />
                </div>
                <span className="text-xl">Order on Postmates</span>
              </div>
              <ExternalLink className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>
      {/* Quick Actions */}
      <section className="py-12 px-4 bg-zinc-900">
        <div className="container mx-auto max-w-4xl">
          <div className="grid grid-cols-2 gap-6">
            <Link href="/menu">
              <Card className="bg-zinc-800 border-zinc-700 cursor-pointer hover:bg-zinc-700 transition-all duration-200 group">
                <CardContent className="p-8 flex flex-col items-center justify-center">
                  <Utensils className="h-12 w-12 text-red-500 mb-4 group-hover:scale-110 transition-transform" />
                  <span className="text-xl font-medium text-white">View Menu</span>
                </CardContent>
              </Card>
            </Link>
            <Link href="/wolfpack/feed">
              <Card className="bg-zinc-800 border-zinc-700 cursor-pointer hover:bg-zinc-700 transition-all duration-200 group">
                <CardContent className="p-8 flex flex-col items-center justify-center">
                  <Users className="h-12 w-12 text-blue-500 mb-4 group-hover:scale-110 transition-transform" />
                  <span className="text-xl font-medium text-white">Join Wolf Pack</span>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </section>
      {/* Find Us Section */}
      <section className="py-20 px-4 bg-black">
        <div className="container mx-auto">
          <h2 className="text-4xl font-serif text-center mb-12">Find Us</h2>
          <div className="max-w-5xl mx-auto rounded-lg overflow-hidden">
            <DynamicGoogleMaps 
              className="w-full" 
              height="500px" 
              showLocationSwitcher={true}
            />
          </div>
        </div>
      </section>

      {/* Instagram Section */}
      <section className="py-20 px-4 bg-zinc-900">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-4xl font-serif text-center mb-12">Follow @sidehustle_bar</h2>
          <div className="bg-black p-8 rounded-lg">
            <InstagramEmbed className="w-full" />
          </div>
        </div>
      </section>

      {/* Delivery Services Dialog */}
      <Dialog open={showDeliveryDialog} onOpenChange={setShowDeliveryDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Order Online</DialogTitle>
            <DialogDescription>
              Choose your preferred delivery service
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Button
              onClick={() => {
                window.open('https://www.doordash.com/store/side-hustle-bar-salem-25388462/27964950/', '_blank');
                setShowDeliveryDialog(false);
              }}
              className="w-full justify-start bg-red-600 hover:bg-red-700 text-white"
            >
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 bg-white rounded-lg p-1 flex items-center justify-center">
                  <Image 
                    src="/icons/doordash_icon.png" 
                    alt="DoorDash" 
                    width={24} 
                    height={24} 
                    className="object-contain"
                  />
                </div>
                <span>Order on DoorDash</span>
              </div>
            </Button>
            <Button
              onClick={() => {
                window.open('https://www.ubereats.com/store/side-hustle-bar/n5ak1cjlRvuf0Hefn7Iddw', '_blank');
                setShowDeliveryDialog(false);
              }}
              className="w-full justify-start bg-black hover:bg-zinc-900 text-white border-2 border-white"
            >
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 bg-white rounded-lg p-1 flex items-center justify-center">
                  <Image 
                    src="/icons/uber-eats.png" 
                    alt="Uber Eats" 
                    width={24} 
                    height={24} 
                    className="object-contain"
                  />
                </div>
                <span>Order on Uber Eats</span>
              </div>
            </Button>
            <Button
              onClick={() => {
                window.open('https://postmates.com/store/side-hustle-bar/n5ak1cjlRvuf0Hefn7Iddw', '_blank');
                setShowDeliveryDialog(false);
              }}
              className="w-full justify-start bg-yellow-500 hover:bg-yellow-600 text-black"
            >
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 bg-white rounded-lg p-1 flex items-center justify-center">
                  <Image 
                    src="/icons/postmates.png" 
                    alt="Postmates" 
                    width={24} 
                    height={24} 
                    className="object-contain"
                  />
                </div>
                <span>Order on Postmates</span>
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}