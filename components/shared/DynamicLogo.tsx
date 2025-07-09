'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import Image from 'next/image';

interface DynamicLogoProps {
  type?: 'brand' | 'wolf';
  className?: string;
  width?: number;
  height?: number;
  alt?: string;
}

export function DynamicLogo({ 
  type = 'brand', 
  className = '', 
  width = 1600, 
  height = 400,
  alt 
}: DynamicLogoProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Avoid hydration mismatch
  if (!mounted) {
    return (
      <div 
        className={`bg-muted animate-pulse ${className}`}
        style={{ width, height }}
        aria-label="Loading logo..."
      />
    );
  }

  const isDark = resolvedTheme === 'dark';
  
  const logoSources = {
    brand: {
      light: '/icons/sidehustle-light-screen.png',
      dark: '/icons/sidehustle.png'
    },
    wolf: {
      light: '/icons/wolf-icon-light-screen.png',
      dark: '/icons/wolf-icon.png'
    }
  };

  const currentSrc = isDark ? logoSources[type].dark : logoSources[type].light;
  const logoAlt = alt || (type === 'brand' ? 'Side Hustle Bar' : 'Wolf Pack');

  return (
    <Image
      src={currentSrc}
      alt={logoAlt}
      width={width}
      height={height}
      className={`transition-opacity duration-300 ${className}`}
      priority={type === 'brand'} // Prioritize brand logo loading
      style={{
        maxWidth: '100%',
        height: 'auto'
      }}
    />
  );
}

// Preload images for smoother transitions
export function preloadLogos() {
  if (typeof window === 'undefined') return;

  const imagesToPreload = [
    '/icons/sidehustle.png',
    '/icons/sidehustle-light-screen.png',
    '/icons/wolf-icon.png',
    '/icons/wolf-icon-light-screen.png'
  ];

  imagesToPreload.forEach(src => {
    const img = new window.Image();
    img.src = src;
  });
}

// Hook to use in layout or main app component
export function useLogoPreload() {
  React.useEffect(() => {
    preloadLogos();
  }, []);
}