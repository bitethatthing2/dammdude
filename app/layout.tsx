import '@/app/globals.css';
import type { ReactNode } from 'react';
import { ThemeProvider } from '@/components/ui/theme-provider';
import ServiceWorkerRegister from '@/components/shared/ServiceWorkerRegister';
import FirebaseInitializer from '@/components/shared/FirebaseInitializer';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ThemeProvider>
          {children}
          <ServiceWorkerRegister />
          <FirebaseInitializer />
        </ThemeProvider>
      </body>
    </html>
  );
}