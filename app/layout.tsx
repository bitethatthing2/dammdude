import '@/app/globals.css';
import type { ReactNode } from 'react';
import { ThemeProvider } from '@/components/ui/theme-provider';
import dynamic from 'next/dynamic';

// Dynamically import client-side components with SSR disabled
const ClientSideWrapper = dynamic(
  () => import('@/components/shared/ClientSideWrapper'),
  { ssr: false }
);

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