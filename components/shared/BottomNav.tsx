"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, MessageCircle, User, ShoppingBag, Calendar, LogIn, BookOpen, Music } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWolfpackAccess } from '@/lib/hooks/useWolfpackAccess';
import { useDJPermissions } from '@/hooks/useDJPermissions';
import { useState, useEffect } from 'react';

export const BottomNav = () => {
  const pathname = usePathname();
  const { canCheckout } = useWolfpackAccess();
  const { isActiveDJ } = useDJPermissions();
  const [isMounted, setIsMounted] = useState(false);

  // Set up mounted state
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Define the type for navigation items
  interface NavItem {
    id: string;
    href: string;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    label: string;
    requiresAuth: boolean;
  }

  // Wolf Pack Navigation - 7 items as specified in the vision, with DJ item conditionally added
  const baseNavigationItems: NavItem[] = [
    { id: 'home', href: '/', icon: Home, label: 'Home', requiresAuth: false },
    { id: 'chat', href: '/chat', icon: MessageCircle, label: 'Chat', requiresAuth: true },
    { id: 'profile', href: '/profile', icon: User, label: 'Profile', requiresAuth: true },
    { id: 'merch', href: '/merch', icon: ShoppingBag, label: 'Merch', requiresAuth: false },
    { id: 'booking', href: '/book', icon: Calendar, label: 'Booking', requiresAuth: false },
    { id: 'login', href: '/login', icon: LogIn, label: 'Login', requiresAuth: false },
    { id: 'blog', href: '/blog', icon: BookOpen, label: 'Blog', requiresAuth: false }
  ];

  // Add DJ item conditionally for authenticated DJs
  const navigationItems: NavItem[] = isActiveDJ 
    ? [
        ...baseNavigationItems.slice(0, 3), // home, chat, profile
        { id: 'dj', href: '/dj', icon: Music, label: 'DJ', requiresAuth: true },
        ...baseNavigationItems.slice(3) // merch, booking, login, blog
      ]
    : baseNavigationItems;

  // Render a navigation item with Wolf Pack access control
  const renderNavItem = (item: NavItem) => {
    const isActive = pathname === item.href;
    const isDisabled = item.requiresAuth && !canCheckout;
    const Icon = item.icon;

    const handleClick = (e: React.MouseEvent) => {
      if (isDisabled) {
        e.preventDefault();
        // Could show a toast or modal about joining Wolf Pack
        return;
      }
    };

    const linkClasses = cn(
      "flex flex-col items-center justify-center p-2 rounded-md transition-all duration-200",
      isActive 
        ? "text-purple-400 bg-purple-500/10" 
        : isDisabled 
          ? "text-muted-foreground/50 cursor-not-allowed" 
          : "text-muted-foreground hover:text-foreground hover:bg-accent/10"
    );

    const content = (
      <>
        <Icon className={cn(
          "h-5 w-5 transition-all duration-200",
          isActive && "drop-shadow-sm",
          isDisabled && "opacity-50"
        )} />
        <span className={cn(
          "text-[10px] mt-1 font-medium",
          isDisabled && "opacity-50"
        )}>
          {item.label}
        </span>
        {isDisabled && (
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        )}
      </>
    );

    if (isDisabled) {
      return (
        <div
          key={item.id}
          className={cn(linkClasses, "relative")}
          onClick={handleClick}
          title="Requires Wolf Pack membership"
        >
          {content}
        </div>
      );
    }

    return (
      <Link
        key={item.id}
        href={item.href}
        className={linkClasses}
        onClick={handleClick}
      >
        {content}
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
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className={cn(
          "h-1 w-12 rounded-full transition-all duration-300",
          canCheckout 
            ? "bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg shadow-purple-500/25" 
            : "bg-muted-foreground/20"
        )} />
      </div>
    </nav>
  );
};
