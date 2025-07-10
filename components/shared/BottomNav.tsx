'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, MessageCircle, User, Music, UtensilsCrossed, ShoppingBag, Calendar, LogIn, BookOpen, Shield, Info, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getZIndexClass } from '@/lib/constants/z-index';
import { useWolfpackAccess } from '@/lib/hooks/useWolfpackAccess';
import { useDJPermissions } from '@/hooks/useDJPermissions';
import { useAdminAccess } from '@/lib/hooks/useAdminAccess';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { ThemeControl } from './ThemeControl';
import { DynamicLogo } from './DynamicLogo';

export const BottomNav = () => {
  const pathname = usePathname();
  const { isMember: canCheckout } = useWolfpackAccess();
  const { isActiveDJ } = useDJPermissions();
  const { isAdmin } = useAdminAccess();
  const { user } = useAuth();
  const [isMounted, setIsMounted] = useState(false);

  // Set up mounted state
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Debug logging
  useEffect(() => {
    if (isMounted) {
      console.log('BottomNav Debug:', {
        user: !!user,
        userEmail: user?.email,
        isMember: canCheckout,
        isActiveDJ,
        isAdmin
      });
    }
  }, [isMounted, user, canCheckout, isActiveDJ, isAdmin]);

  // Define the type for navigation items
  interface NavItem {
    id: string;
    href: string;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    label: string;
    requiresWolfPack?: boolean;
    requiresDJ?: boolean;
    requiresAdmin?: boolean;
    hideWhenLoggedIn?: boolean;
  }

  // Define navigation items based on Wolf Pack membership and auth status
  const getNavigationItems = (): NavItem[] => {
    // If user is a Wolf Pack member, show the full navigation
    if (canCheckout) {
      const items: NavItem[] = [
        { id: 'home', href: '/', icon: Home, label: 'Home' },
        { id: 'chat', href: '/wolfpack/chat', icon: MessageCircle, label: 'Chat', requiresWolfPack: true },
        { id: 'profile', href: '/profile', icon: User, label: 'Profile', requiresWolfPack: true },
      ];

      // Add DJ tab if user is an active DJ
      if (isActiveDJ) {
        items.push({ id: 'dj', href: '/dj', icon: Music, label: 'DJ', requiresDJ: true });
      }

      // Add admin dashboard if user is an admin
      if (isAdmin) {
        items.push({ id: 'admin', href: '/admin/dashboard', icon: Settings, label: 'Admin', requiresAdmin: true });
      }

      // Add remaining features available to Wolf Pack members
      items.push(
        { id: 'menu', href: '/menu', icon: UtensilsCrossed, label: 'Order', requiresWolfPack: true },
        { id: 'merch', href: '/merch', icon: ShoppingBag, label: 'Merch' },
        { id: 'booking', href: '/book', icon: Calendar, label: 'Booking' },
        { id: 'about', href: '/about', icon: Info, label: 'About' }
      );

      return items;
    }

    // Non-Wolf Pack members see limited navigation
    const basicItems: NavItem[] = [
      { id: 'home', href: '/', icon: Home, label: 'Home' },
    ];

    // If logged in but not Wolf Pack member, show profile and join option
    if (user) {
      basicItems.push(
        { id: 'profile', href: '/profile', icon: User, label: 'Profile' },
        { id: 'join-pack', href: '/wolfpack', icon: Shield, label: 'Join the Pack' }
      );
    } else {
      // Only show login if NOT logged in
      basicItems.push({ id: 'login', href: '/login', icon: LogIn, label: 'Log In / Sign Up' });
    }

    // Add public features
    basicItems.push(
      { id: 'merch', href: '/merch', icon: ShoppingBag, label: 'Merch' },
      { id: 'booking', href: '/book', icon: Calendar, label: 'Booking' },
      { id: 'about', href: '/about', icon: Info, label: 'About' }
    );

    return basicItems;
  };

  const navigationItems = getNavigationItems();

  // Render a navigation item
  const renderNavItem = (item: NavItem) => {
    const isActive = pathname === item.href;
    const Icon = item.icon;
    const isJoinPack = item.id === 'join-pack';
    const isAdminItem = item.id === 'admin';

    const linkClasses = cn(
      "flex flex-col items-center justify-center p-2 rounded-md transition-all duration-200 min-w-0 flex-1",
      isJoinPack
        ? "text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg shadow-purple-500/25"
        : isAdminItem
          ? "text-white bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 shadow-lg shadow-red-500/25"
          : isActive 
            ? "text-primary bg-primary/10" 
            : "text-inactive hover:text-foreground hover:bg-primary/5"
    );

    return (
      <Link
        key={item.id}
        href={item.href}
        className={linkClasses}
      >
        <Icon className={cn(
          "h-5 w-5 transition-all duration-200",
          isActive && "drop-shadow-sm",
          isJoinPack && "animate-pulse",
          isAdminItem && "animate-pulse"
        )} />
        <span className={cn(
          "text-[10px] mt-1 font-medium",
          "truncate w-full text-center",
          (isJoinPack || isAdminItem) && "font-bold"
        )}>
          {item.label}
        </span>
      </Link>
    );
  };

  if (!isMounted) {
    // Return invisible placeholder with same dimensions to prevent layout shifts
    return (
      <nav className={`fixed bottom-0 left-0 right-0 h-16 border-t bg-background/80 backdrop-blur-md ${getZIndexClass('BOTTOM_NAV')} safe-area-inset-bottom opacity-0 pointer-events-none`}>
        <div className="flex justify-around items-center h-full px-2 max-w-lg mx-auto safe-area-inset-left safe-area-inset-right">
          {/* Placeholder content */}
          <div className="flex-1" />
        </div>
      </nav>
    );
  }

  // Check if we're on the DJ dashboard page or chat pages
  const isDJDashboard = pathname === '/dj';
  const isChatPage = pathname.startsWith('/wolfpack/chat');
  const isWolfpackPage = pathname.startsWith('/wolfpack');

  // Hide BottomNav on chat pages
  if (pathname.startsWith('/wolfpack/chat')) {
    return null;
  }

  return (
    <>
      {/* Side Hustle Logo - positioned at top-left (hidden on DJ dashboard and chat) */}
      {!isDJDashboard && !isChatPage && !isWolfpackPage && (
        <div className={`absolute top-4 left-4 ${getZIndexClass('MODAL_BACKDROP')}`}>
          <DynamicLogo 
            type="brand"
            width={400}
            height={100}
            className="w-32 sm:w-48 md:w-64 h-auto" 
          />
        </div>
      )}

      {/* Floating Theme Control - positioned at top-right (hidden on DJ dashboard and chat) */}
      {!isDJDashboard && !isChatPage && !isWolfpackPage && (
        <div className={`fixed top-4 right-4 ${getZIndexClass('MODAL_BACKDROP')}`}>
          <div className="bg-background/95 backdrop-blur-md border border-border rounded-full shadow-lg p-1.5 sm:p-2">
            <ThemeControl />
          </div>
        </div>
      )}
      
      {/* Bottom Navigation */}
      <nav className={`fixed bottom-0 left-0 right-0 h-16 border-t bg-background/80 backdrop-blur-md ${getZIndexClass('BOTTOM_NAV')} safe-area-inset-bottom`}>
        <div className="flex justify-around items-center h-full px-2 max-w-lg mx-auto safe-area-inset-left safe-area-inset-right">
          {navigationItems.map((item) => renderNavItem(item))}
        </div>
        
        {/* Wolf Pack Status Indicator */}
        {canCheckout && (
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="h-1 w-12 rounded-full bg-gradient-to-r from-primary to-primary-light shadow-lg animate-pulse" style={{
              backgroundColor: 'hsl(var(--primary))',
              boxShadow: '0 0 15px hsl(var(--primary) / 0.25)'
            }} />
          </div>
        )}
      </nav>
    </>
  );
};
