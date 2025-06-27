'use client';

"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes"

// Constants for localstorage keys
const THEME_COLOR_KEY = 'sidehustle-color-theme';
const THEME_MODE_KEY = 'sidehustle-mode';
const THEME_STORAGE_KEY = 'sidehustle-theme';

// Get saved values from localStorage with fallbacks
const getSavedThemeValues = () => {
  if (typeof window === 'undefined') return { mode: 'light', color: 'slate' };
  
  // Get saved values
  const savedColor = localStorage.getItem(THEME_COLOR_KEY) || 'slate';
  const savedMode = localStorage.getItem(THEME_MODE_KEY) || 'light';
  
  return { color: savedColor, mode: savedMode };
};

export function ThemeProvider({ children, ...props }: { children: React.ReactNode }) {
  // Get stored theme from local storage if available
  const [mounted, setMounted] = React.useState(false)
  
  React.useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem={true}
      forcedTheme={undefined}
      storageKey={THEME_STORAGE_KEY}
      disableTransitionOnChange
      {...props}
    >
      {/* Apply saved color theme class on client-side */}
      {mounted && (
        <ThemeInitializer />
      )}
      {children}
    </NextThemesProvider>
  )
}

// Component to ensure the theme class is properly set on initialization
function ThemeInitializer() {
  // Use the useTheme hook directly to avoid TypeScript errors with the context
  const { theme, setTheme, resolvedTheme } = useTheme()
  
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // On first load, try to restore theme from localStorage
    if (!theme) {
      const { color, mode } = getSavedThemeValues();
      setTheme(mode);
      
      // Apply the color theme class
      document.documentElement.classList.add(color);
      return;
    }
    
    const root = document.documentElement
    
    // Clear any existing theme classes
    const themeClassPattern = /^theme-/
    root.classList.forEach((cls) => {
      if (themeClassPattern.test(cls)) {
        root.classList.remove(cls)
      }
    })
    
    // Extract color theme from combined theme if present
    let colorTheme = 'slate'; // Default
    
    if (theme && theme.includes('-')) {
      const [extractedColorTheme] = theme.split('-');
      colorTheme = extractedColorTheme;
    } 
    else if (theme && theme !== 'light' && theme !== 'dark' && theme !== 'system') {
      colorTheme = theme;
    }
    else {
      // Check localStorage for saved color theme
      colorTheme = localStorage.getItem(THEME_COLOR_KEY) || 'slate';
    }
    
    // Apply the color theme
    root.classList.add(colorTheme);
    
    // Save color theme to localStorage
    localStorage.setItem(THEME_COLOR_KEY, colorTheme);
    
    // Save mode to localStorage
    const currentMode = resolvedTheme || 'light';
    localStorage.setItem(THEME_MODE_KEY, currentMode);
    
    // Make sure dark/light mode is correctly applied
    if (resolvedTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme, resolvedTheme, setTheme])
  
  return null
}
