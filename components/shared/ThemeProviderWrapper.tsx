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
      defaultTheme="dark"  // Default to dark instead of system
      enableSystem        // Still allow system preference if user wants
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}