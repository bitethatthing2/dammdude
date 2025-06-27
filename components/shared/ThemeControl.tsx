'use client';

import * as React from 'react';
import { useTheme } from "next-themes";
import { Check, Moon, Sun } from "lucide-react";

// Theme colors available in the application
const themes = [
  { name: "slate", title: "Default" },
  { name: "red", title: "Red" },
  { name: "rose", title: "Rose" },
  { name: "orange", title: "Orange" },
  { name: "green", title: "Green" },
  { name: "blue", title: "Blue" },
  { name: "violet", title: "Violet" }
];

// Constants for localstorage keys (matching theme-provider.tsx)
const THEME_COLOR_KEY = 'sidehustle-color-theme';
const THEME_MODE_KEY = 'sidehustle-mode';

// Theme control component with mode toggle and theme selector
export const ThemeControl = () => {
  const { theme, setTheme, resolvedTheme } = useTheme(); 
  const [mounted, setMounted] = React.useState(false);
  const [showThemeSelector, setShowThemeSelector] = React.useState(false);
  
  // Separate state for color theme
  const [colorTheme, setColorTheme] = React.useState('slate');
  const [isDarkMode, setIsDarkMode] = React.useState(false);
  
  // Initialize component
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    
    setMounted(true);
    
    // Get saved color theme from localStorage
    const savedColorTheme = localStorage.getItem(THEME_COLOR_KEY);
    if (savedColorTheme) {
      setColorTheme(savedColorTheme);
      // Apply the saved color theme class if not already applied
      if (!document.documentElement.classList.contains(savedColorTheme)) {
        document.documentElement.classList.add(savedColorTheme);
      }
    } else {
      // Set initial color theme state from html classes
      const htmlClasses = document.documentElement.classList;
      for (const t of themes) {
        if (htmlClasses.contains(t.name)) {
          setColorTheme(t.name);
          // Save to localStorage
          localStorage.setItem(THEME_COLOR_KEY, t.name);
          break;
        }
      }
    }
    
    // Set initial dark mode state
    const isDark = document.documentElement.classList.contains('dark');
    setIsDarkMode(isDark);
    
    // Save the initial mode
    const initialMode = isDark ? 'dark' : 'light';
    localStorage.setItem(THEME_MODE_KEY, initialMode);
  }, []);
  
  // Update dark mode state when resolvedTheme changes
  React.useEffect(() => {
    if (!mounted) return;
    
    if (resolvedTheme) {
      setIsDarkMode(resolvedTheme === 'dark');
      localStorage.setItem(THEME_MODE_KEY, resolvedTheme);
    }
  }, [resolvedTheme, mounted]);

  // Close the theme selector when clicking outside
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleClickOutside = (e: MouseEvent) => {
      setShowThemeSelector(false);
    };

    if (showThemeSelector) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showThemeSelector]);

  // Toggle between light and dark mode
  const toggleMode = () => {
    // Update state
    const newIsDarkMode = !isDarkMode;
    setIsDarkMode(newIsDarkMode);
    
    // Toggle dark mode class directly for immediate visual feedback
    const root = document.documentElement;
    
    if (newIsDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    // Apply the appropriate theme based on current color theme
    setTheme(newIsDarkMode ? 'dark' : 'light');
    
    // Save the mode to localStorage
    localStorage.setItem(THEME_MODE_KEY, newIsDarkMode ? 'dark' : 'light');
  };

  // Handle theme change while preserving dark/light mode
  const handleThemeChange = (newColorTheme: string) => {
    // Update color theme state
    setColorTheme(newColorTheme);
    
    const root = document.documentElement;
    
    // Remove all existing theme classes
    themes.forEach(t => {
      root.classList.remove(t.name);
    });
    
    // Add the new theme class
    root.classList.add(newColorTheme);
    
    // Save the theme to localStorage for persistence
    localStorage.setItem(THEME_COLOR_KEY, newColorTheme);
    
    // Apply the theme while preserving dark mode
    const themeToApply = isDarkMode ? 'dark' : 'light';
    setTheme(themeToApply);
    
    // Close the selector
    setShowThemeSelector(false);
  };

  if (!mounted) {
    // Avoid hydration mismatch
    return null;
  }

  return (
    <div className="relative inline-flex items-center gap-1 z-10">
      {/* Dark/light mode toggle */}
      <button
        onClick={toggleMode}
        className="p-2 text-muted-foreground hover:text-foreground transition-colors"
        aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
      >
        {isDarkMode ? <Moon size={18} /> : <Sun size={18} />}
      </button>
      
      {/* Theme selector button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowThemeSelector(!showThemeSelector);
        }}
        className="p-2 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Select theme"
      >
        <div className={`theme-${colorTheme} w-4 h-4 rounded-full`} /> 
      </button>
      
      {/* Theme selector dropdown */}
      {showThemeSelector && (
        <div 
          onClick={(e) => e.stopPropagation()}
          className="absolute top-full right-0 mt-1 p-1 bg-card border border-border rounded-md shadow-md"
        >
          <div className="grid grid-cols-2 gap-1">
            {themes.map((t) => (
              <button
                key={t.name}
                onClick={() => handleThemeChange(t.name)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded hover:bg-muted text-sm ${
                  colorTheme === t.name ? "bg-primary/10" : ""
                }`}
                title={t.title}
              >
                <div className={`theme-${t.name} w-3 h-3 rounded-full flex-shrink-0`} />
                <span className="whitespace-nowrap overflow-hidden text-ellipsis">
                  {t.title}
                </span>
                {colorTheme === t.name && (
                  <Check size={12} className="ml-auto text-primary" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
