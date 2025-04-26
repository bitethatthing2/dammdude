"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as LucideIcons from 'lucide-react';
import { QrCode, Bell } from 'lucide-react';
import { NotificationIndicator } from './NotificationIndicator';
import { cn } from '@/lib/utils';
import { useFcmContext } from '@/lib/hooks/useFcmToken';
import { useState, useEffect } from 'react';
import { useNotifications } from '@/lib/contexts/notification-context';

export const BottomNav = () => {
  const pathname = usePathname();
  const { notificationPermissionStatus } = useFcmContext();
  const [isMounted, setIsMounted] = useState(false);
  const [fallbackUnreadCount, setFallbackUnreadCount] = useState(0);
  
  // Try to use the notification context if available
  let notificationContext;
  try {
    notificationContext = useNotifications();
  } catch (error) {
    // Context not available, will use fallback
    notificationContext = null;
  }

  // Get unread count from context or fallback
  const unreadCount = notificationContext?.unreadCount ?? fallbackUnreadCount;

  // Set up mounted state and listen for notification updates
  useEffect(() => {
    setIsMounted(true);
    
    // Try to get unread count from localStorage as fallback
    const storedCount = localStorage.getItem('unread-notification-count');
    if (storedCount) {
      setFallbackUnreadCount(parseInt(storedCount, 10));
    }
    
    // Listen for custom events from notification context
    const handleNotificationUpdate = (e: CustomEvent<{ unreadCount: number }>) => {
      if (e.detail && typeof e.detail.unreadCount === 'number') {
        setFallbackUnreadCount(e.detail.unreadCount);
        localStorage.setItem('unread-notification-count', e.detail.unreadCount.toString());
      }
    };
    
    window.addEventListener('notification-update', handleNotificationUpdate as EventListener);
    
    return () => {
      window.removeEventListener('notification-update', handleNotificationUpdate as EventListener);
    };
  }, []);
  
  // Define the type for navigation items
  interface NavItem {
    href: string;
    iconName?: string;
    icon?: React.ReactNode;
    label: string;
  }
  
  // Core navigation items - always visible
  const coreNavItems: NavItem[] = [
    { href: '/', iconName: 'Home', label: 'Home' },
    { href: '/menu', iconName: 'UtensilsCrossed', label: 'Menu' },
    { href: '/events', iconName: 'CalendarDays', label: 'Events' },
    { href: '/order', icon: <QrCode className="h-5 w-5" />, label: 'BarTap' },
  ];
  
  // Secondary navigation items - shown on larger screens or in a "more" menu
  const secondaryNavItems: NavItem[] = [
    { href: '/book', iconName: 'BookOpen', label: 'Book' },
    { href: '/merch', iconName: 'ShoppingBag', label: 'Merch' },
    { href: '/about', iconName: 'Info', label: 'About' },
    { href: '/contact', iconName: 'Phone', label: 'Contact' },
  ];

  // Combine for medium screens
  const mediumScreenItems = [...coreNavItems, ...secondaryNavItems.slice(0, 2)];
  
  // Render a navigation item
  const renderNavItem = (item: NavItem) => {
    const isActive = pathname === item.href;
    const Icon = item.iconName ? (LucideIcons as Record<string, React.ComponentType<any>>)[item.iconName] : null;
    
    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          "flex flex-col items-center justify-center p-2",
          isActive ? "text-foreground" : "text-muted-foreground"
        )}
      >
        {Icon ? <Icon className="h-5 w-5" /> : item.icon}
        <span className="text-[10px] mt-1">{item.label}</span>
      </Link>
    );
  };
  
  // Render notification item with badge
  const renderNotificationItem = () => (
    <Link
      href="/notifications"
      className={cn(
        "flex flex-col items-center justify-center p-2",
        pathname === '/notifications' ? "text-foreground" : "text-muted-foreground"
      )}
    >
      <div className="relative">
        {isMounted ? (
          <NotificationIndicator />
        ) : (
          <Bell className="h-5 w-5" />
        )}
        {unreadCount > 0 && (
          <span className="absolute -right-2 -top-2 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-destructive text-[0.625rem] font-medium text-destructive-foreground">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </div>
      <span className="text-[10px] mt-1">
        {notificationPermissionStatus === 'granted' ? 'Alerts' : 'Notifications'}
      </span>
    </Link>
  );
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 border-t bg-transparent backdrop-blur-md z-50 flex justify-around items-center px-2">
      {/* Mobile view (4 core items + more) */}
      <div className="flex justify-between w-full md:hidden">
        {coreNavItems.map(renderNavItem)}
        {renderNotificationItem()}
      </div>
      
      {/* Medium screen view (6 items) */}
      <div className="hidden md:flex lg:hidden justify-between w-full">
        {mediumScreenItems.map(renderNavItem)}
        {renderNotificationItem()}
        {/* More dropdown for remaining items */}
      </div>
      
      {/* Large screen view (all items) */}
      <div className="hidden lg:flex justify-between w-full">
        {[...coreNavItems, ...secondaryNavItems].map(renderNavItem)}
        {renderNotificationItem()}
      </div>
    </nav>
  );
};