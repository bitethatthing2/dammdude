"use client";

import { useState, useEffect } from 'react';
import { useLocationState } from '@/lib/hooks/useLocationState';
import { LocationSwitcher } from '@/components/shared/LocationSwitcher';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Utensils, Download, Bell, Star, Users, MapPin } from "lucide-react";
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
  const [orderDropdownOpen, setOrderDropdownOpen] = useState(false);
  const { location } = useLocationState();

  // Wait for component to mount to ensure client-side rendering
  useEffect(() => {
    setMounted(true);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (orderDropdownOpen && !(event.target as Element).closest('.order-dropdown')) {
        setOrderDropdownOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [orderDropdownOpen]);

  // Theme-based images are handled by DynamicLogo component

  return (
    <div className="main-content bg-black text-white min-h-screen">
      {/* Hero Section with Video Background - Full Screen */}
      <div className="relative h-screen w-full -mt-16 overflow-visible mb-16">
        <VideoBackground 
          videoSrc="/icons/main-page-only.mp4"
          overlayOpacity={0.4}
        />
        
        {/* Hero Content */}
        <div className="absolute inset-0 flex flex-col justify-center items-center z-10 px-4 text-center pt-48 md:pt-56 pb-32 overflow-visible">
          {/* Combined Logo with Wolf and Title */}
          <div className="mb-6 mt-16 md:mt-20 animate-fade-in">
            <Image 
              src={`/icons/wolf-and-title.png?v=${Date.now()}`}
              alt="Side Hustle Bar"
              width={400}
              height={200}
              className="mx-auto w-full max-w-[280px] md:max-w-[350px] lg:max-w-[450px] h-auto"
              priority
              unoptimized
            />
          </div>
          
          {/* Main Hero Text */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 max-w-4xl leading-tight drop-shadow-2xl px-4">
            Experience Salem's Best Tacos
            <br />
            <span className="text-red-500 font-serif">7 Days a Week</span>
          </h1>
          
          {/* Subtitle */}
          <p className="text-base sm:text-lg md:text-xl text-white/90 mb-8 max-w-2xl leading-relaxed drop-shadow-lg px-4">
            Authentic flavors, vibrant atmosphere, and unforgettable experiences at both locations
          </p>
          
          {/* Location & Hours Card */}
          <div className="backdrop-blur-lg bg-black/50 rounded-2xl p-4 sm:p-6 md:p-8 max-w-3xl mb-8 shadow-2xl border border-white/20 mx-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="text-white text-center sm:text-left">
                <h3 className="text-lg sm:text-xl font-bold text-red-500 mb-3">Salem Location</h3>
                <p className="text-sm sm:text-base mb-1">145 Liberty St NE Suite #101</p>
                <p className="text-sm sm:text-base mb-3">Salem, OR 97301</p>
                <p className="text-sm sm:text-base font-semibold">📞 (503) 391-9977</p>
              </div>
              
              <div className="text-white text-center sm:text-left">
                <h3 className="text-lg sm:text-xl font-bold text-red-500 mb-3">Hours</h3>
                <div className="space-y-1 text-xs sm:text-sm md:text-base">
                  <p><span className="font-medium">Mon-Thu:</span> 10AM - 12AM</p>
                  <p><span className="font-medium">Fri-Sat:</span> 10AM - 2AM</p>
                  <p><span className="font-medium">Sunday:</span> 10AM - 12AM</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 relative z-20 px-4 w-full max-w-md sm:max-w-none">
            <Link href="/menu" className="w-full sm:w-auto">
              <Button size="lg" className="w-full bg-red-600 hover:bg-red-700 text-white px-6 sm:px-10 py-3 sm:py-4 text-lg sm:text-xl font-semibold rounded-full shadow-lg hover:shadow-xl transition-all">
                View Menu
              </Button>
            </Link>
            <div className="relative order-dropdown w-full sm:w-auto">
              <div 
                onClick={() => setOrderDropdownOpen(!orderDropdownOpen)}
                className="w-full bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white px-6 sm:px-10 py-3 sm:py-4 text-lg sm:text-xl font-semibold rounded-full border-2 border-white/30 hover:border-white/50 transition-all shadow-lg hover:shadow-xl cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span>Order Online</span>
                  <svg className={`w-5 h-5 text-white transition-transform ${orderDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              {orderDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-black/90 backdrop-blur-sm rounded-lg border border-white/20 shadow-xl z-[1000]">
                  <div className="py-2">
                    <div 
                      onClick={() => {
                        window.open('https://www.doordash.com/store/side-hustle-bar-salem-25388462/27964950/', '_blank');
                        setOrderDropdownOpen(false);
                      }}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-white/10 cursor-pointer transition-colors"
                    >
                      <div className="w-6 h-6 bg-white rounded-full p-0.5 flex items-center justify-center">
                        <Image src="/icons/doordash_icon.png" alt="DoorDash" width={20} height={20} className="rounded" />
                      </div>
                      <span className="text-white">DoorDash</span>
                    </div>
                    <div 
                      onClick={() => {
                        window.open('https://www.ubereats.com/store/side-hustle-bar/n5ak1cjlRvuf0Hefn7Iddw', '_blank');
                        setOrderDropdownOpen(false);
                      }}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-white/10 cursor-pointer transition-colors"
                    >
                      <div className="w-6 h-6 bg-white rounded-full p-0.5 flex items-center justify-center">
                        <Image src="/icons/uber-eats.png" alt="Uber Eats" width={20} height={20} className="rounded" />
                      </div>
                      <span className="text-white">Uber Eats</span>
                    </div>
                    <div 
                      onClick={() => {
                        window.open('https://postmates.com/store/side-hustle-bar/n5ak1cjlRvuf0Hefn7Iddw', '_blank');
                        setOrderDropdownOpen(false);
                      }}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-white/10 cursor-pointer transition-colors"
                    >
                      <div className="w-6 h-6 bg-white rounded-full p-0.5 flex items-center justify-center">
                        <Image src="/icons/postmates.png" alt="Postmates" width={20} height={20} className="rounded" />
                      </div>
                      <span className="text-white">Postmates</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Scroll Indicator - positioned outside the content area */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 animate-bounce z-30">
          <svg className="w-6 h-6 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </div>

      {/* Featured Section */}
      <section className="pt-20 pb-20 px-4 bg-zinc-900">
        <div className="container mx-auto">
          <h2 className="text-4xl md:text-5xl font-serif text-center mb-12">Signature Tacos & Craft Cocktails</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Featured Item 1 - Video */}
            <div className="group relative overflow-hidden rounded-lg shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer">
              <div className="aspect-square relative">
                <video
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
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
              </div>
            </div>
            
            {/* Featured Item 2 - Video */}
            <div className="group relative overflow-hidden rounded-lg shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer">
              <div className="aspect-square relative">
                <video
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  src="/icons/video-food.mp4"
                  autoPlay
                  muted
                  loop
                  playsInline
                />
              </div>
            </div>
            
            {/* Featured Item 3 - Replace with third video or image */}
            <div className="group relative overflow-hidden rounded-lg shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer">
              <div className="aspect-square relative bg-black">
                <Image 
                  src="/icons/side-hustle-food.jpg"
                  alt="Side Hustle Bar Food"
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-700"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Welcome Story Section */}
      <section className="py-12 sm:py-16 lg:py-20 px-4 bg-black">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-serif mb-6 sm:mb-8 text-white leading-tight">Where High-Energy Entertainment Meets Authentic Mexican Cuisine</h2>
          <p className="text-lg sm:text-xl text-white/90 mb-8 leading-relaxed">
            Side Hustle Bar embodies the entrepreneurial spirit of the modern "side hustle" - creating a space where you can unlock your potential while enjoying exceptional food and entertainment in the heart of Oregon.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 mt-8 sm:mt-12">
            <div className="text-center p-4">
              <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Utensils className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-3 text-white">Legendary Birria Tacos</h3>
              <p className="text-sm sm:text-base text-white/80">Executive Chef Rebecca Sanchez crafts signature birria tacos that have become legendary among locals, with house-made salsas customers describe as "bomb."</p>
            </div>
            <div className="text-center p-4">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-3 text-white">Oregon's UFC House</h3>
              <p className="text-sm sm:text-base text-white/80">Multiple large screens, no cover charge, and an electric atmosphere make us the premier destination for UFC and boxing events with capacity crowds.</p>
            </div>
            <div className="text-center p-4">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-3 text-white">Two Locations</h3>
              <p className="text-sm sm:text-base text-white/80">From our flagship Salem location in historic downtown to our expanding Portland presence, each venue brings the same Wolf Pack community spirit.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Community & Atmosphere Section */}
      <section className="py-20 px-4 bg-zinc-900">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="relative h-[500px] rounded-lg overflow-hidden">
              <Image 
                src="/icons/side-hustle-exterior.jpg"
                alt="Side Hustle Bar Interior"
                fill
                className="object-cover"
              />
            </div>
            <div>
              <h2 className="text-4xl md:text-5xl font-serif mb-6 text-white">From Family-Friendly to Nightlife Destination</h2>
              <p className="text-xl text-white/80 mb-6 leading-relaxed">
                Our multi-level venue seamlessly transitions from family-friendly restaurant by day to vibrant nightclub by night. With gaming areas, outdoor parklet seating, and intimate lounges, there's a perfect spot for every occasion.
              </p>
              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-white/90">Game Night Live with trivia and R0CK'N Bingo</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-white/90">Live music Thursday through Sunday evenings</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-white/90">Notable concerts featuring Trinidad James & ILOVEMAKONNEN</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-white/90">Pool, giant Jenga, and giant Connect Four gaming area</span>
                </div>
              </div>
              <div className="flex items-center gap-4 mb-6">
                <Star className="h-6 w-6 text-amber-400 fill-amber-400" />
                <Star className="h-6 w-6 text-amber-400 fill-amber-400" />
                <Star className="h-6 w-6 text-amber-400 fill-amber-400" />
                <Star className="h-6 w-6 text-amber-400 fill-amber-400" />
                <Star className="h-6 w-6 text-amber-400 fill-amber-400" />
                <span className="text-white/80 font-medium">4.7 stars across 750+ Google reviews</span>
              </div>
              <div className="flex justify-start">
                <LocationSwitcher />
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Get Full Experience Section - Compact */}
      <section className="py-12 px-4 bg-zinc-900">
        <div className="container mx-auto max-w-4xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">Get the Full Experience</h2>
            <p className="text-zinc-400">Install our app & enable notifications for exclusive offers</p>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Install App Card */}
            <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                  <Download className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Install the App</h3>
                  <p className="text-zinc-400 text-xs">Offline access, faster loads</p>
                </div>
              </div>
              <PwaInstallGuide className="w-full bg-red-600 hover:bg-red-700 text-white py-2" />
            </div>

            {/* Enable Notifications Card */}
            <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                  <Bell className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Enable Notifications</h3>
                  <p className="text-zinc-400 text-xs">Order updates & special offers</p>
                </div>
              </div>
              <Button 
                className="w-full bg-green-600 hover:bg-green-700 text-white py-2"
                onClick={async () => {
                  try {
                    console.log('Requesting notification permission...');
                    const permission = await Notification.requestPermission();
                    console.log('Notification permission result:', permission);
                    
                    if (permission === 'granted') {
                      alert('🎉 Notifications enabled! You\'ll receive updates about your orders and special offers.');
                    } else if (permission === 'denied') {
                      alert('Notifications were blocked. You can enable them in your browser settings if you change your mind.');
                    } else {
                      alert('Notification permission was dismissed. You can try again anytime.');
                    }
                  } catch (error) {
                    console.error('Error requests notification permission:', error);
                    alert('There was an error enabling notifications. Please try again.');
                  }
                }}
              >
                <Bell className="h-4 w-4 mr-2" />
                Enable
              </Button>
            </div>
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

    </div>
  );
}