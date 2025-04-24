"use client";

import Image from 'next/image';
import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';

export default function HeaderLogo() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) {
    // Return a placeholder with the same dimensions to avoid layout shift
    return (
      <div className="flex items-center">
        <div className="w-[30px] h-[30px] mr-2" />
        <span className="font-extrabold text-lg tracking-wider uppercase font-sans">SIDE HUSTLE</span>
      </div>
    );
  }
  
  // Determine which logo to use based on the theme
  const logoSrc = resolvedTheme === 'dark' 
    ? '/images/about/light-screen-wolf-vector-logo.png'
    : '/images/about/icon-for-nav-light-screen.png';
    
  return (
    <div className="flex items-center">
      <Image 
        src={logoSrc}
        alt="Side Hustle"
        width={30}
        height={30}
        className="mr-2"
      />
      <span className="font-extrabold text-lg tracking-wider uppercase font-sans">SIDE HUSTLE</span>
    </div>
  );
}
