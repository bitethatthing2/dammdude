"use client";

import * as React from 'react';
import { useTheme } from "next-themes";
import { Check, Moon, Sun, Palette } from "lucide-react";

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
    setMounted(true);
    
    // Set initial dark mode state
    setIsDarkMode(document.documentElement.classList.contains('dark'));
    
    // Determine current color theme class
    const htmlClasses = document.documentElement.classList;
    for (const t of themes) {
      if (htmlClasses.contains(t.name)) {
        setColorTheme(t.name);
        break;
      }
    }
  }, []);
  
  // Update dark mode state when resolvedTheme changes
  React.useEffect(() => {
    if (resolvedTheme) {
      setIsDarkMode(resolvedTheme === 'dark');
    }
  }, [resolvedTheme]);

  // Close the theme selector when clicking outside
  React.useEffect(() => {
    const handleClickOutside = () => {
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
    // Toggle dark mode class directly for immediate visual feedback
    document.documentElement.classList.toggle('dark');
    
    // Update state
    const newIsDarkMode = !isDarkMode;
    setIsDarkMode(newIsDarkMode);
    
    // Apply the appropriate theme based on current color theme
    setTheme(newIsDarkMode ? 'dark' : 'light');
  };

  // Handle theme change while preserving dark/light mode
  const handleThemeChange = (newColorTheme: string) => {
    // Update color theme state
    setColorTheme(newColorTheme);
    
    // Remove all existing theme classes
    themes.forEach(t => {
      document.documentElement.classList.remove(t.name);
    });
    
    // Add the new theme class
    document.documentElement.classList.add(newColorTheme);
    
    // Apply the theme while preserving dark mode
    const themeToApply = isDarkMode ? 'dark' : 'light';
    setTheme(themeToApply);
    
    // Make sure dark class is properly set
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Close the selector
    setShowThemeSelector(false);
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="relative flex items-center gap-2">
      {/* Dark/Light mode toggle */}
      <button
        onClick={toggleMode}
        className="h-9 w-9 rounded-md bg-background text-foreground border border-primary inline-flex items-center justify-center"
        aria-label="Toggle dark mode"
      >
        {isDarkMode ? (
          <Sun className="h-4 w-4" />
        ) : (
          <Moon className="h-4 w-4" />
        )}
      </button>

      {/* Theme selector button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowThemeSelector(!showThemeSelector);
        }}
        className="h-9 px-3 rounded-md bg-background text-foreground border border-primary inline-flex items-center justify-center"
        aria-label="Select theme"
      >
        <Palette className="h-4 w-4 mr-1" />
        <div className={`theme-${colorTheme} w-4 h-4 rounded-full`} /> 
      </button>

      {/* Theme selector dropdown */}
      {showThemeSelector && (
        <div 
          className="absolute right-0 top-full mt-2 p-2 bg-background border border-input rounded-md shadow-md z-50 w-56"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="grid grid-cols-3 gap-2">
            {themes.map((t) => (
              <button
                key={t.name}
                onClick={() => handleThemeChange(t.name)}
                className="flex flex-col items-center justify-center p-2 rounded-md relative"
                title={t.title}
              >
                <div className={`theme-${t.name} w-6 h-6 rounded-full mb-1`} />
                <span className="text-xs text-foreground">{t.title}</span>
                {colorTheme === t.name && (
                  <Check className="absolute h-3 w-3 text-white" style={{top: '8px', right: '8px'}} />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
