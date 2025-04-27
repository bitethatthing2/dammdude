import '@/app/globals.css';
import type { ReactNode } from 'react';
import { ThemeProvider } from '@/components/ui/theme-provider';
import dynamic from 'next/dynamic';
import { Metadata, Viewport } from 'next';

// Dynamically import client-side components with SSR disabled
const ClientSideWrapper = dynamic(
  () => import('@/components/shared/ClientSideWrapper'),
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
  icons: {
    icon: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

// Define viewport configuration separately as recommended by Next.js
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#000000', // Moved from metadata to viewport as per Next.js recommendation
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ThemeProvider>
          <ClientSideWrapper>
            {children}
          </ClientSideWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}