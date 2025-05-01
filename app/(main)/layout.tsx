import '@/app/globals.css';
import { QueryStateProvider } from '@/app/providers';
import type { ReactNode } from 'react';
import React from 'react';
import { Metadata, Viewport } from 'next';
import dynamic from 'next/dynamic';
import { PwaInstallGuide } from '@/components/shared/PwaInstallGuide';
import { NotificationProvider } from '@/components/shared/notification-provider';
import { Suspense } from 'react';
import { ThemeProviderWrapper } from '@/components/shared/ThemeProviderWrapper';

// Group related dynamic imports to improve bundling
const ClientComponents = {
  // Navigation components
  BottomNav: dynamic(
    () => import('@/components/shared/ClientBottomNav').then(mod => mod.default),
    { loading: () => <div className="h-16 bg-muted animate-pulse" /> }
  ),
  
  // Header components
  HeaderLogo: dynamic(
    () => import('@/components/shared/HeaderLogo').then(mod => mod.default),
    { loading: () => <div className="h-6 w-24 bg-muted animate-pulse rounded" /> }
  ),
  
  NotificationBell: dynamic(
    () => import('@/components/shared/NotificationIndicator').then(mod => mod.NotificationIndicator),
    { loading: () => <div className="h-8 w-8 rounded-full bg-muted animate-pulse" /> }
  )
};

// Client components that need ssr: false
import { ClientOnlyRoot } from '@/components/shared/ClientOnlyRoot';

// Use regular imports with 'use client' directive
import { ThemeControl } from '@/components/shared/ThemeControl';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' }
  ]
};

export const metadata: Metadata = {
  title: {
    template: '%s | Salem PDX',
    default: 'Salem PDX | Sports Bar & Restaurant in Portland'
  },
  description: 'A modern sports bar and restaurant in Portland, Oregon. Watch sports, enjoy great food and drinks.',
  icons: {
    icon: '/icons/favicon.ico',
    apple: '/icons/apple-touch-icon.png'
  },
  manifest: '/manifest.json',
  applicationName: 'Salem PDX',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Salem PDX',
  },
  formatDetection: {
    telephone: true
  }
};

interface MainLayoutProps {
  children: React.ReactNode;
}

// Header component extracted for better organization
function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center px-4">
        <div className="mr-4">
          <ClientComponents.HeaderLogo />
        </div>
        <div className="flex flex-1 items-center justify-end">
          <nav className="flex items-center gap-3 pr-1">
            <ThemeControl />
            <ClientComponents.NotificationBell />
          </nav>
        </div>
      </div>
    </header>
  );
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <ThemeProviderWrapper>
      <QueryStateProvider>
        <NotificationProvider>
          <div className="relative flex min-h-screen flex-col">
            <Header />
            <div className="flex-1">
              <main className="pb-16">{children}</main>
            </div>
            <PwaInstallGuide />
            <ClientComponents.BottomNav />
          </div>
          <Suspense fallback={null}>
            {/* Client component with ssr: false */}
            <ClientOnlyRoot />
          </Suspense>
        </NotificationProvider>
      </QueryStateProvider>
    </ThemeProviderWrapper>
  );
}
