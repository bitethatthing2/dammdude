'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { ReactNode } from 'react';

interface ThemeProviderWrapperProps {
  children: ReactNode;
}

export function ThemeProviderWrapper({ children }: ThemeProviderWrapperProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"  // Default to system preference
      enableSystem
      disableTransitionOnChange
      storageKey="sidehustle-theme"
    >
      {children}
    </NextThemesProvider>
  );
}