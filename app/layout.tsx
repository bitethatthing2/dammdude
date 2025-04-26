import '@/app/globals.css';
import type { ReactNode } from 'react';
import { ThemeProvider } from '@/components/ui/theme-provider';
import ServiceWorkerRegister from '@/components/shared/ServiceWorkerRegister';
import FirebaseInitializer from '@/components/shared/FirebaseInitializer';
import { NotificationProvider } from '@/lib/contexts/notification-context';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ThemeProvider>
          <FirebaseInitializer>
            <NotificationProvider>
              {children}
              <ServiceWorkerRegister />
            </NotificationProvider>
          </FirebaseInitializer>
        </ThemeProvider>
      </body>
    </html>
  );
}