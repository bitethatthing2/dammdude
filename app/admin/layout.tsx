import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { UnifiedNotificationProvider } from '@/components/unified';

/**
 * Layout for the unified admin pages
 * Provides navigation and context for the new components
 */
export default async function UnifiedAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Get the session from cookies
  const supabase = await createServerClient();
  
  // Get authenticated user
  const { data } = await supabase.auth.getSession();
  const session = data?.session;
  const userId = session?.user?.id;
  
  // Redirect to login if not authenticated
  if (!session) {
    redirect('/admin/login');
  }
  
  return (
    <UnifiedNotificationProvider recipientId={userId} role="admin">
      <div className="flex min-h-screen flex-col">
        <header className="bg-white dark:bg-gray-900 border-b dark:border-gray-800">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link 
                href="/admin/dashboard" 
                className="text-lg font-medium hover:underline dark:text-white"
              >
                Admin Dashboard
              </Link>
              <span className="text-gray-300 dark:text-gray-600">|</span>
              <Link 
                href="/admin/unified" 
                className="text-lg font-medium text-blue-600 dark:text-blue-400"
              >
                Unified Components
              </Link>
            </div>
            
            <nav>
              <ul className="flex space-x-6">
                <li>
                  <Link 
                    href="/admin/dashboard" 
                    className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                  >
                    Back to Original
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/admin/orders" 
                    className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                  >
                    Orders
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/admin/tables" 
                    className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                  >
                    Tables
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </header>
        
        <main className="flex-1 bg-gray-50 dark:bg-gray-950">
          {children}
        </main>
        
        <footer className="bg-white dark:bg-gray-900 border-t dark:border-gray-800 py-4">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Unified Components Implementation
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Using refactored architecture
              </p>
            </div>
          </div>
        </footer>
      </div>
    </UnifiedNotificationProvider>
  );
}
