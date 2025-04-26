"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as LucideIcons from 'lucide-react';
import { Bell, Info, Phone, QrCode } from 'lucide-react';

export const BottomNav = () => {
  const pathname = usePathname();
  
  const navItems = [
    { href: '/', iconName: 'Home', label: 'Home' },
    { href: '/menu', iconName: 'UtensilsCrossed', label: 'Menu' },
    { href: '/events', iconName: 'CalendarDays', label: 'Events' },
    { href: '/book', iconName: 'BookOpen', label: 'Book' },
    { href: '/merch', iconName: 'ShoppingBag', label: 'Merch' },
    { href: '/order', icon: <QrCode className="h-5 w-5" />, label: 'BarTap' },
    { href: '/about', iconName: 'Info', label: 'About Us' },
    { href: '/contact', iconName: 'Phone', label: 'Contact' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 border-t bg-transparent backdrop-blur-md z-50 flex justify-around items-center px-2">
      {navItems.map((item) => {
        const Icon = item.icon || (item.iconName ? LucideIcons[item.iconName as keyof typeof LucideIcons] : null);
        
        return (
          <Link 
            key={item.href}
            href={item.href} 
            className={`flex flex-col items-center justify-center p-2 border border-primary rounded-md ${pathname === item.href ? 'text-foreground' : 'text-muted-foreground'}`}
          >
            {item.icon || (Icon && <Icon className="h-5 w-5" />)}
            <span className="text-[10px] mt-1">{item.label}</span>
          </Link>
        );
      })}
      
      <Link 
        href="/notifications" 
        className={`flex flex-col items-center justify-center p-2 border border-primary rounded-md ${pathname === '/notifications' ? 'text-foreground' : 'text-muted-foreground'}`}
      >
        <Bell className="h-5 w-5" />
        <span className="text-[10px] mt-1">Notifications</span>
      </Link>
    </nav>
  );
};