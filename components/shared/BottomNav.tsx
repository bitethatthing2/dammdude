"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as LucideIcons from 'lucide-react';
import { QrCode, Bell } from 'lucide-react';
import { NotificationIndicator } from './NotificationIndicator';
import { cn } from '@/lib/utils';
import { useFcmContext } from '@/lib/hooks/useFcmToken';
import { useState, useEffect } from 'react';

export const BottomNav = () => {
  const pathname = usePathname();
  const { notificationPermissionStatus } = useFcmContext();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMounted, setIsMounted] = useState(false);

  // Safely get unread count from notification context if available
  useEffect(() => {
    setIsMounted(true);
    
    // Try to get unread count from localStorage as fallback
    const storedCount = localStorage.getItem('unread-notification-count');
    if (storedCount) {
      setUnreadCount(parseInt(storedCount, 10));
    }
    
    // Listen for custom events from notification context
    const handleNotificationUpdate = (e: CustomEvent) => {
      if (e.detail && typeof e.detail.unreadCount === 'number') {
        setUnreadCount(e.detail.unreadCount);
        localStorage.setItem('unread-notification-count', e.detail.unreadCount.toString());
      }
    };
    
    window.addEventListener('notification-update' as any, handleNotificationUpdate as any);
    
    return () => {
      window.removeEventListener('notification-update' as any, handleNotificationUpdate as any);
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
        {notificationPermissionStatus === 'granted' ? 'Enabled' : 'Enable Notifications'}
      </span>
    </Link>
  );
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 border-t bg-transparent backdrop-blur-md z-50 flex justify-around items-center px-2">
      {/* Mobile view (4 core items + more) */}
      <div className="flex justify-between w-full md:hidden">
        {coreNavItems.map(renderNavItem)}
        
        {/* More dropdown for mobile */}
        <div className="relative group">
          <button 
            className="flex flex-col items-center justify-center p-2 text-muted-foreground"
            aria-label="More options"
          >
            <LucideIcons.MoreHorizontal className="h-5 w-5" />
            <span className="text-[10px] mt-1">More</span>
          </button>
          
          <div className="absolute bottom-full mb-2 right-0 hidden group-hover:flex flex-col bg-background border border-primary rounded-md p-1 min-w-40">
            {secondaryNavItems.map((item) => {
              const Icon = item.icon || (item.iconName ? LucideIcons[item.iconName as keyof typeof LucideIcons] : null);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-sm hover:bg-muted",
                    pathname === item.href ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {item.icon || (Icon && <Icon className="h-4 w-4" />)}
                  <span className="text-sm">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
        
        {/* Notification indicator for mobile */}
        {renderNotificationItem()}
      </div>
      
      {/* Medium screen view (6 items) */}
      <div className="hidden md:flex lg:hidden justify-between w-full">
        {mediumScreenItems.map(renderNavItem)}
        
        {/* More dropdown for medium screens */}
        <div className="relative group">
          <button 
            className="flex flex-col items-center justify-center p-2 text-muted-foreground"
            aria-label="More options"
          >
            <LucideIcons.MoreHorizontal className="h-5 w-5" />
            <span className="text-[10px] mt-1">More</span>
          </button>
          
          <div className="absolute bottom-full mb-2 right-0 hidden group-hover:flex flex-col bg-background border border-primary rounded-md p-1 min-w-40">
            {secondaryNavItems.slice(2).map((item) => {
              const Icon = item.icon || (item.iconName ? LucideIcons[item.iconName as keyof typeof LucideIcons] : null);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-sm hover:bg-muted",
                    pathname === item.href ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {item.icon || (Icon && <Icon className="h-4 w-4" />)}
                  <span className="text-sm">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
        
        {/* Notification indicator for medium screens */}
        {renderNotificationItem()}
      </div>
      
      {/* Large screen view (all items) */}
      <div className="hidden lg:flex justify-between w-full">
        {[...coreNavItems, ...secondaryNavItems].map(renderNavItem)}
        
        {/* Notification indicator for large screens */}
        {renderNotificationItem()}
      </div>
    </nav>
  );
  
  function renderNavItem(item: NavItem) {
    const Icon = item.icon || (item.iconName ? LucideIcons[item.iconName as keyof typeof LucideIcons] : null);
    
    return (
      <Link 
        key={item.href}
        href={item.href} 
        className={cn(
          "flex flex-col items-center justify-center p-2",
          pathname === item.href ? "text-foreground" : "text-muted-foreground"
        )}
      >
        {item.icon || (Icon && <Icon className="h-5 w-5" />)}
        <span className="text-[10px] mt-1">{item.label}</span>
      </Link>
    );
  }
};