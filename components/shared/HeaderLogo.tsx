"use client";

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export default function HeaderLogo() {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();
  
  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) {
    // Render a placeholder with a fixed height to prevent layout shift
    return <div className="h-6 w-32"></div>; // Adjust height/width as needed
  }
  
  const logoSrc = resolvedTheme === 'dark' 
    ? '/icons/sidehustle-font-darkscreen.png' 
    : '/icons/sidehustle-font-lightscreen.png';
    
  return (
    <div className="flex items-center">
      {/* Use Next.js Image component with correct aspect ratio handling */}
      <Image 
        src={logoSrc}
        alt="Side Hustle Logo"
        width={150}
        height={24}
        style={{
          width: 'auto',
          height: 'auto',
          maxWidth: '150px'
        }}
        priority // Prioritize loading the logo
      />
    </div>
  );
}
