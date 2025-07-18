'use client';

import React from 'react';
import Image from 'next/image';
import { ThemeControl } from './ThemeControl';
import { useTheme } from 'next-themes';

export function MainPageThemeControl() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="bg-background/95 backdrop-blur-md border border-border rounded-lg shadow-lg p-2">
        <ThemeControl />
      </div>
      <div className="flex justify-center">
        <Image
          src={isDark ? '/icons/sidehustle.png' : '/icons/sidehustle-light-screen.png'}
          alt="Side Hustle"
          width={200}
          height={60}
          className="rounded-lg"
          priority
          style={{
            width: 'auto',
            height: 'auto'
          }}
        />
      </div>
    </div>
  );
}