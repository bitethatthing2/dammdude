"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, MessageCircle, User, Music, UtensilsCrossed, ShoppingBag, Calendar, LogIn, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWolfpackAccess } from '@/lib/hooks/useWolfpackAccess';
import { useDJPermissions } from '@/hooks/useDJPermissions';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';

export const BottomNav = () => {
  const pathname = usePathname();
  const { canCheckout } = useWolfpackAccess();
  const { isActiveDJ } = useDJPermissions();
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
        canCheckout,
        isActiveDJ
      });
    }
  }, [isMounted, user, canCheckout, isActiveDJ]);

  // Define the type for navigation items
  interface NavItem {
    id: string;
    href: string;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    label: string;
    requiresWolfPack?: boolean;
    requiresDJ?: boolean;
    hideWhenLoggedIn?: boolean;
  }

  // Define navigation items based on Wolf Pack membership and auth status
  const getNavigationItems = (): NavItem[] => {
    // If user is a Wolf Pack member, show the full navigation
    if (canCheckout) {
      const items: NavItem[] = [
        { id: 'home', href: '/', icon: Home, label: 'Home' },
        { id: 'chat', href: '/chat', icon: MessageCircle, label: 'Chat', requiresWolfPack: true },
        { id: 'profile', href: '/profile', icon: User, label: 'Profile', requiresWolfPack: true },
      ];

      // Add DJ tab if user is an active DJ
      if (isActiveDJ) {
        items.push({ id: 'dj', href: '/dj', icon: Music, label: 'DJ', requiresDJ: true });
      }

      // Add remaining features available to Wolf Pack members
      items.push(
        { id: 'menu', href: '/menu', icon: UtensilsCrossed, label: 'Order', requiresWolfPack: true },
        { id: 'merch', href: '/merch', icon: ShoppingBag, label: 'Merch' },
        { id: 'booking', href: '/book', icon: Calendar, label: 'Booking' },
        { id: 'blog', href: '/blog', icon: BookOpen, label: 'Blog' }
      );

      return items;
    }

    // Non-Wolf Pack members see limited navigation
    const basicItems: NavItem[] = [
      { id: 'home', href: '/', icon: Home, label: 'Home' },
    ];

    // If logged in but not Wolf Pack member, show profile
    if (user) {
      basicItems.push({ id: 'profile', href: '/profile', icon: User, label: 'Profile' });
    } else {
      // Only show login if NOT logged in
      basicItems.push({ id: 'login', href: '/login', icon: LogIn, label: 'Log In / Sign Up' });
    }

    // Add public features
    basicItems.push(
      { id: 'merch', href: '/merch', icon: ShoppingBag, label: 'Merch' },
      { id: 'booking', href: '/book', icon: Calendar, label: 'Booking' },
      { id: 'blog', href: '/blog', icon: BookOpen, label: 'Blog' }
    );

    return basicItems;
  };

  const navigationItems = getNavigationItems();

  // Render a navigation item
  const renderNavItem = (item: NavItem) => {
    const isActive = pathname === item.href;
    const Icon = item.icon;

    const linkClasses = cn(
      "flex flex-col items-center justify-center p-2 rounded-md transition-all duration-200 min-w-0 flex-1",
      isActive 
        ? "text-purple-400 bg-purple-500/10" 
        : "text-muted-foreground hover:text-foreground hover:bg-accent/10"
    );

    return (
      <Link
        key={item.id}
        href={item.href}
        className={linkClasses}
      >
        <Icon className={cn(
          "h-5 w-5 transition-all duration-200",
          isActive && "drop-shadow-sm"
        )} />
        <span className={cn(
          "text-[10px] mt-1 font-medium",
          "truncate w-full text-center"
        )}>
          {item.label}
        </span>
      </Link>
    );
  };

  if (!isMounted) {
    return null; // Prevent hydration mismatch
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 border-t bg-background/80 backdrop-blur-md z-50">
      <div className="flex justify-around items-center h-full px-2 max-w-lg mx-auto">
        {navigationItems.map((item) => renderNavItem(item))}
      </div>
      
      {/* Wolf Pack Status Indicator */}
      {canCheckout && (
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="h-1 w-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg shadow-purple-500/25 animate-pulse" />
        </div>
      )}
    </nav>
  );
};
