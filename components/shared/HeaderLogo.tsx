"use client";

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import Image from 'next/image';

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
      {/* Use Next.js Image component for optimization */}
      <Image 
        src={logoSrc}
        alt="Side Hustle Logo"
        width={150} // Original width
        height={24} // Original height
        style={{
          height: 'auto', // Allow height to adjust based on width
          maxWidth: '150px' // Match original width
        }}
        priority // Prioritize loading the logo
      />
    </div>
  );
}
