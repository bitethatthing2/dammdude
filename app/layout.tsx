import '@/app/globals.css';
import type { ReactNode } from 'react';
import { ThemeProvider } from '@/components/ui/theme-provider';
import dynamic from 'next/dynamic';
import { Metadata, Viewport } from 'next';
import { PwaInstallGuide } from '@/components/shared/PwaInstallGuide';

// Dynamically import client-side components with SSR disabled
const ClientSideWrapper = dynamic(
  () => import('@/components/shared/ClientSideWrapper').then(mod => mod.default),
  { ssr: false }
);

// Define metadata for the app, including PWA-related tags
export const metadata: Metadata = {
  title: 'Side Hustle',
  description: 'Order food and drinks at Side Hustle - A faster, app-like experience with offline access',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Side Hustle',
  },
  applicationName: "Side Hustle",
  formatDetection: {
    telephone: false,
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "mobile-web-app-capable": "yes",
  },
};

// Define viewport configuration separately as recommended by Next.js
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#000000',
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ThemeProvider>
          {/* Client-side wrapper ensures proper initialization */}
          <ClientSideWrapper>
            <div className="relative min-h-screen">
              {children}
              
              {/* REMOVED: Fixed position PwaInstallGuide */}
              {/* 
              <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
                <PwaInstallGuide />
              </div>
              */}
            </div>
          </ClientSideWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}