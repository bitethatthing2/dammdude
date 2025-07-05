'use client';

import * as React from 'react';
import { useTheme } from "next-themes";
import { Check, Moon, Sun, Monitor } from "lucide-react";

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

// Single localStorage key for color theme
const THEME_COLOR_KEY = 'sidehustle-color-theme';

// Theme control component with mode toggle and theme selector
export const ThemeControl = () => {
  const { theme, setTheme, resolvedTheme } = useTheme(); 
  const [mounted, setMounted] = React.useState(false);
  const [showThemeSelector, setShowThemeSelector] = React.useState(false);
  const [colorTheme, setColorTheme] = React.useState('slate');
  
  // Initialize component
  React.useEffect(() => {
    setMounted(true);
    
    // Get saved color theme from localStorage
    const savedColorTheme = localStorage.getItem(THEME_COLOR_KEY) || 'slate';
    setColorTheme(savedColorTheme);
    
    // Apply the saved color theme class
    document.documentElement.classList.add(savedColorTheme);
  }, []);
  
  // Apply color theme class when it changes
  React.useEffect(() => {
    if (!mounted) return;
    
    // Remove all existing theme classes
    themes.forEach(t => {
      document.documentElement.classList.remove(t.name);
    });
    
    // Add the current color theme class
    document.documentElement.classList.add(colorTheme);
    
    // Save to localStorage
    localStorage.setItem(THEME_COLOR_KEY, colorTheme);
  }, [colorTheme, mounted]);

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

  // Toggle between light, dark, and system modes
  const toggleMode = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
  };

  // Handle color theme change
  const handleThemeChange = (newColorTheme: string) => {
    setColorTheme(newColorTheme);
    setShowThemeSelector(false);
  };

  // Get the appropriate icon for current theme
  const getThemeIcon = () => {
    if (theme === 'light') return <Sun size={18} />;
    if (theme === 'dark') return <Moon size={18} />;
    return <Monitor size={18} />;
  };

  // Get theme label
  const getThemeLabel = () => {
    if (theme === 'light') return 'Switch to dark mode';
    if (theme === 'dark') return 'Switch to system mode';
    return 'Switch to light mode';
  };

  if (!mounted) {
    // Avoid hydration mismatch
    return null;
  }

  return (
    <div className="relative inline-flex items-center gap-1 z-10">
      {/* Dark/light/system mode toggle */}
      <button
        onClick={toggleMode}
        className="p-2 text-muted-foreground hover:text-foreground transition-colors"
        aria-label={getThemeLabel()}
      >
        {getThemeIcon()}
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
        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: 'hsl(var(--primary))' }} /> 
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
                <div className={`${t.name} w-3 h-3 rounded-full flex-shrink-0`} style={{
                  backgroundColor: t.name === 'slate' ? 'hsl(var(--primary))' :
                                  t.name === 'red' ? 'hsl(0 72.2% 50.6%)' :
                                  t.name === 'rose' ? 'hsl(346.8 77.2% 49.8%)' :
                                  t.name === 'orange' ? 'hsl(24.6 95% 53.1%)' :
                                  t.name === 'green' ? 'hsl(142.1 76.2% 36.3%)' :
                                  t.name === 'blue' ? 'hsl(221.2 83.2% 53.3%)' :
                                  t.name === 'violet' ? 'hsl(262.1 83.3% 57.8%)' :
                                  'hsl(var(--primary))'
                }} />
                <span className="whitespace-nowrap overflow-hidden text-ellipsis">
                  {t.title}
                </span>
                {colorTheme === t.name && (
                  <Check size={12} className="ml-auto" style={{ color: 'hsl(var(--primary))' }} />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
