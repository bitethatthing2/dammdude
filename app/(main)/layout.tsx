import type { ReactNode } from 'react';
import { BottomNav } from '@/components/shared/BottomNav';
import { NotificationStatus } from '@/components/shared/NotificationStatus';
import { ThemeControl } from '@/components/shared/ThemeControl';
import dynamic from 'next/dynamic';

// Import the client component with no SSR to avoid hydration issues
const HeaderLogo = dynamic(() => import('@/components/shared/HeaderLogo'), { ssr: false });

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="fixed top-0 left-0 right-0 h-14 border-b bg-transparent backdrop-blur-md z-50 flex items-center justify-between px-4">
        <HeaderLogo />
        <div className="flex items-center gap-2">
          <ThemeControl />
          <NotificationStatus />
        </div>
      </header>

      <main className="flex-1 pt-14 pb-16">{children}</main>

      <BottomNav />
    </div>
  );
}