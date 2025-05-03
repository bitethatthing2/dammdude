import React from 'react';
import Link from 'next/link';

/**
 * Layout for the unified admin pages
 * Provides navigation and context for the new components
 */
export default function UnifiedAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link 
              href="/admin/dashboard" 
              className="text-lg font-medium hover:underline"
            >
              Admin Dashboard
            </Link>
            <span className="text-gray-300">|</span>
            <Link 
              href="/admin/unified" 
              className="text-lg font-medium text-blue-600"
            >
              Unified Components
            </Link>
          </div>
          
          <nav>
            <ul className="flex space-x-6">
              <li>
                <Link 
                  href="/admin/dashboard" 
                  className="text-gray-600 hover:text-gray-900"
                >
                  Back to Original
                </Link>
              </li>
              <li>
                <Link 
                  href="/admin/orders" 
                  className="text-gray-600 hover:text-gray-900"
                >
                  Orders
                </Link>
              </li>
              <li>
                <Link 
                  href="/admin/tables" 
                  className="text-gray-600 hover:text-gray-900"
                >
                  Tables
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </header>
      
      <main className="flex-1 bg-gray-50">
        {children}
      </main>
      
      <footer className="bg-white border-t py-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Unified Components Implementation
            </p>
            <p className="text-sm text-gray-500">
              Using refactored architecture
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}