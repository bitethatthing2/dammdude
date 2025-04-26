import '@/app/globals.css';
import type { ReactNode } from 'react';
import { ThemeProvider } from '@/components/ui/theme-provider';
import dynamic from 'next/dynamic';

// Dynamically import client-side components with SSR disabled
const ClientSideComponents = dynamic(
  () => import('@/components/shared/ClientSideComponents'),
  { ssr: false }
);

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ThemeProvider>
          <ClientSideComponents>
            {children}
          </ClientSideComponents>
        </ThemeProvider>
      </body>
    </html>
  );
}