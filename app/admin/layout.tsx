import type { ReactNode } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="h-14 border-b flex items-center px-4 justify-between">
        <div>Admin</div>
        <Link href="/">
          <Button 
            variant="outline" 
            className="bg-background text-foreground border border-input"
          >
            Back to Home
          </Button>
        </Link>
      </header>
      <main className="flex-1 p-4">{children}</main>
    </div>
  );
}