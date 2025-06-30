import React from 'react';
import { Metadata } from 'next';
import { DJAuthGuard } from '@/components/dj/DJAuthGuard';
import { DJDashboard } from '@/components/dj/DJDashboard';

// =============================================================================
// METADATA CONFIGURATION
// =============================================================================

export const metadata: Metadata = {
  title: 'DJ Control Center - Side Hustle Wolf Pack',
  description: 'DJ interface for managing Wolf Pack events and communications',
  keywords: ['DJ', 'control center', 'events', 'wolf pack', 'music', 'nightlife'],
  robots: {
    index: false, // Don't index DJ interface pages
    follow: false
  },
  openGraph: {
    title: 'DJ Control Center',
    description: 'Professional DJ interface for event management',
    type: 'website',
    siteName: 'Side Hustle Wolf Pack'
  }
};

// =============================================================================
// PAGE COMPONENT
// =============================================================================

/**
 * DJ Control Center Page
 * 
 * This page provides the main interface for DJs to:
 * - Create and manage events (polls, contests, etc.)
 * - Send broadcasts to the wolfpack
 * - Monitor pack activity and engagement
 * - View real-time analytics
 * 
 * Features:
 * - Role-based authentication (DJ/Admin only)
 * - Real-time updates via Supabase
 * - Responsive design for various screen sizes
 * - Accessibility compliance
 */
export default function DJPage() {
  return (
    <DJAuthGuard>
      <div className="dj-page min-h-screen bg-background">
        {/* Page Header */}
        <header className="bg-gradient-to-r from-purple-900 to-pink-900 border-b border-border">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  DJ Control Center
                </h1>
                <p className="text-purple-200">
                  Manage your Wolf Pack events and communications
                </p>
              </div>
              
              {/* Status Indicator */}
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-green-200 text-sm font-medium">LIVE</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-6">
          <DJDashboard />
        </main>

        {/* Footer */}
        <footer className="bg-card border-t border-border mt-auto">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <p>
                &copy; {new Date().getFullYear()} Side Hustle Wolf Pack. 
                Professional DJ Interface.
              </p>
              <div className="flex items-center space-x-4">
                <span>Version 2.0</span>
                <span className="text-xs">
                  Last updated: {new Date().toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </DJAuthGuard>
  );
}