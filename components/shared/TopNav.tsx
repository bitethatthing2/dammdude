"use client";

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LocationSwitcher } from '@/components/shared/LocationSwitcher';
import { usePathname } from 'next/navigation';

export function TopNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const menuItems = [
    { href: '/', label: 'Home' },
    { href: '/menu', label: 'Menu' },
    { href: '/wolfpack/feed', label: 'Wolf Pack' },
    { href: '/events', label: 'Events' },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black border-b border-zinc-800">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/icons/wolf-icon.png"
              alt="Side Hustle"
              width={40}
              height={40}
              className="w-10 h-10"
            />
            <span className="text-xl font-bold text-white hidden sm:block">Side Hustle</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-6">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-white hover:text-red-500 transition-colors ${
                  isActive(item.href) ? 'text-red-500' : ''
                }`}
              >
                {item.label}
              </Link>
            ))}
            
            {/* More Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="text-white hover:text-red-500 gap-1">
                  More <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-zinc-900 border-zinc-800">
                <DropdownMenuItem asChild>
                  <Link href="/about" className="text-white hover:text-red-500">
                    About Us
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/contact" className="text-white hover:text-red-500">
                    Contact
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/careers" className="text-white hover:text-red-500">
                    Careers
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <LocationSwitcher />
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-white"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-zinc-800">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`block py-2 text-white hover:text-red-500 transition-colors ${
                  isActive(item.href) ? 'text-red-500' : ''
                }`}
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/about"
              className="block py-2 text-white hover:text-red-500"
              onClick={() => setIsOpen(false)}
            >
              About Us
            </Link>
            <Link
              href="/contact"
              className="block py-2 text-white hover:text-red-500"
              onClick={() => setIsOpen(false)}
            >
              Contact
            </Link>
            <Link
              href="/careers"
              className="block py-2 text-white hover:text-red-500"
              onClick={() => setIsOpen(false)}
            >
              Careers
            </Link>
            <div className="pt-4">
              <LocationSwitcher />
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}