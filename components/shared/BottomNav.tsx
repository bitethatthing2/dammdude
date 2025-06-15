"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import * as LucideIcons from 'lucide-react';
import { ShoppingCart, Bell, MoreHorizontal } from 'lucide-react';
import { NotificationIndicator } from '@/components/unified';
import { cn } from '@/lib/utils';
import { useFcmContext } from '@/lib/hooks/useFcmToken';
import { useState, useEffect, useRef } from 'react';
import { useOnClickOutside } from '@/lib/hooks/useOnClickOutside';
import { useBarTap } from '@/lib/contexts/bartap-context';

export const BottomNav = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { notificationPermissionStatus } = useFcmContext();
  const [isMounted, setIsMounted] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const { resetFlow } = useBarTap();

  // Close more menu when clicking outside
  useOnClickOutside(moreMenuRef as React.RefObject<HTMLElement>, () => setMoreMenuOpen(false));

  // Set up mounted state
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Define the type for navigation items
  interface NavItem {
    href: string;
    iconName?: string;
    icon?: React.ReactNode;
    label: string;
    onClick?: () => void;
  }

  // Handle BarTap navigation
  const handleBarTapClick = () => {
    // Reset the BarTap flow and navigate to table entry
    resetFlow();
    router.push('/table');
    return false; // Prevent default Link behavior
  };

  // Core navigation items - always visible
  const coreNavItems: NavItem[] = [
    { href: '/', iconName: 'Home', label: 'Home' },
    { href: '/menu', iconName: 'UtensilsCrossed', label: 'Food Menu' },
    { 
      href: '/table', 
      icon: <ShoppingCart className="h-5 w-5" />, 
      label: 'Bar Tab',
      onClick: handleBarTapClick
    },
    { href: '/chat', iconName: 'MessageCircle', label: 'Chat' },
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
    const Icon = item.iconName
      ? (LucideIcons as Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>>)[item.iconName]
      : null;

    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          "flex flex-col items-center justify-center p-2",
          isActive ? "text-foreground" : "text-muted-foreground"
        )}
        onClick={onClick || item.onClick}
      >
        {Icon ? <Icon className="h-5 w-5" /> : item.icon}
        <span className="text-[10px] mt-1">{item.label}</span>
      </Link>
    );
  };

  // Render notification item WITHOUT badge (badge removed)
  const renderNotificationItem = () => (
    <Link
      href="/notifications"
      className={cn(
        "flex flex-col items-center justify-center p-2",
        pathname === '/notifications' ? "text-foreground" : "text-muted-foreground"
      )}
    >
      <div className="relative">
        {/* Conditionally render Bell icon or Indicator */}
        {notificationPermissionStatus === 'granted' ? (
          <Bell className="h-5 w-5" />
        ) : isMounted ? (
          <NotificationIndicator variant="subtle" />
        ) : (
          <Bell className="h-5 w-5" />
        )}
        {/* BADGE REMOVED - No more notification count badge */}
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
            <div className="w-full border-t pt-1 mt-1">
              {renderNavItem({ href: '/admin/login', iconName: 'LogIn', label: 'Login' }, () => setMoreMenuOpen(false))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Render the Login item separately for large screens
  const renderLoginItem = () => (
    <div className="w-full flex justify-center">
      {renderNavItem({ href: '/admin/login', iconName: 'LogIn', label: 'Login' })}
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

      {/* Large screen view (all items + notifications + login) */}
      <div className="hidden lg:grid lg:grid-cols-11 gap-2 items-center w-full max-w-7xl mx-auto">
        {[...coreNavItems, ...secondaryNavItems].map((item) => (
          <div key={item.href} className="flex justify-center">
            {renderNavItem(item)}
          </div>
        ))}
        <div className="flex justify-center">{renderNotificationItem()}</div>
        <div className="flex justify-center">{renderLoginItem()}</div>
      </div>
    </nav>
  );
};
