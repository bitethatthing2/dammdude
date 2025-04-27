"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as LucideIcons from 'lucide-react';
import { QrCode, Bell, MoreHorizontal } from 'lucide-react';
import { NotificationIndicator } from './NotificationIndicator';
import { cn } from '@/lib/utils';
import { useFcmContext } from '@/lib/hooks/useFcmToken';
import { useState, useEffect, useRef } from 'react';
import { useNotifications } from '@/lib/contexts/notification-context';
import { useOnClickOutside } from '@/lib/hooks/useOnClickOutside';

export const BottomNav = () => {
  const pathname = usePathname();
  const { notificationPermissionStatus } = useFcmContext();
  const [isMounted, setIsMounted] = useState(false);
  const [fallbackUnreadCount, setFallbackUnreadCount] = useState(0);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  
  // Close more menu when clicking outside
  useOnClickOutside(moreMenuRef, () => setMoreMenuOpen(false));
  
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
    { href: '/order', icon: <QrCode className="h-5 w-5" />, label: 'BarTap' },
  ];
  
  // Secondary navigation items - shown on larger screens or in a "more" menu
  const secondaryNavItems: NavItem[] = [
    { href: '/events', iconName: 'CalendarDays', label: 'Events' },
    { href: '/merch', iconName: 'ShoppingBag', label: 'Merch' },
    { href: '/about', iconName: 'Info', label: 'About' },
    { href: '/contact', iconName: 'Phone', label: 'Contact' },
    { href: '/book', iconName: 'BookOpen', label: 'Book' },
  ];

  // Combine for medium screens
  const mediumScreenItems = [...coreNavItems, secondaryNavItems[0], secondaryNavItems[1]];
  
  // Render a navigation item
  const renderNavItem = (item: NavItem, onClick?: () => void) => {
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
        onClick={onClick}
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
  
  // Render the "More" button and dropdown
  const renderMoreMenu = () => (
    <div className="relative" ref={moreMenuRef}>
      <button
        onClick={() => setMoreMenuOpen(!moreMenuOpen)}
        className={cn(
          "flex flex-col items-center justify-center p-2",
          moreMenuOpen ? "text-foreground" : "text-muted-foreground"
        )}
        aria-label="More options"
      >
        <MoreHorizontal className="h-5 w-5" />
        <span className="text-[10px] mt-1">More</span>
      </button>
      
      {moreMenuOpen && (
        <div className="absolute bottom-16 right-0 bg-background border rounded-md shadow-lg p-2 min-w-[180px] z-50">
          <div className="grid grid-cols-1 gap-1">
            {secondaryNavItems.map((item) => (
              <div key={item.href} className="w-full">
                {renderNavItem(item, () => setMoreMenuOpen(false))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 border-t bg-transparent backdrop-blur-md z-50 flex justify-around items-center px-2">
      {/* Mobile view (3 core items + notifications + more) */}
      <div className="flex justify-between w-full md:hidden">
        {coreNavItems.map((item) => renderNavItem(item))}
        {renderNotificationItem()}
        {renderMoreMenu()}
      </div>
      
      {/* Medium screen view (6 items) */}
      <div className="hidden md:flex lg:hidden justify-between w-full">
        {mediumScreenItems.map((item) => renderNavItem(item))}
        {renderNotificationItem()}
        {renderMoreMenu()}
      </div>
      
      {/* Large screen view (all items) */}
      <div className="hidden lg:flex justify-between w-full">
        {[...coreNavItems, ...secondaryNavItems].map((item) => renderNavItem(item))}
        {renderNotificationItem()}
      </div>
    </nav>
  );
};