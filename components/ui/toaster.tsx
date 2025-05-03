"use client"

import { useEffect, useState } from "react";
import { useTheme } from "next-themes"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { useToast } from "@/components/ui/use-toast"

// Constants for localstorage keys (matching theme-provider.tsx)
const THEME_COLOR_KEY = 'sidehustle-color-theme';
const THEME_MODE_KEY = 'sidehustle-mode';

export function Toaster() {
  const { toasts } = useToast()
  const { theme, resolvedTheme } = useTheme()
  // Track the current color theme
  const [colorTheme, setColorTheme] = useState<string>('slate')
  
  // Sync with localStorage on mount and when theme changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const updateColorTheme = () => {
      // First try to get from localStorage
      const savedColorTheme = localStorage.getItem(THEME_COLOR_KEY);
      
      if (savedColorTheme) {
        setColorTheme(savedColorTheme);
        return;
      }
      
      // Try to get from document classes
      const htmlClasses = Array.from(document.documentElement.classList);
      const themeClass = htmlClasses.find(cls => 
        !cls.includes('-') && 
        !['dark', 'light'].includes(cls) && 
        !['slate', 'red', 'rose', 'orange', 'green', 'blue', 'violet'].includes(cls) === false
      );
      
      if (themeClass) {
        setColorTheme(themeClass);
      }
    };
    
    // Update initially and whenever localStorage changes
    updateColorTheme();
    
    // Listen for storage events to update in real-time across tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === THEME_COLOR_KEY) {
        updateColorTheme();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [theme]);

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        // Apply the current theme to the toast
        const themeClass = `theme-toast theme-${colorTheme}`

        return (
          <Toast key={id} {...props} className={`${props.className || ""} ${themeClass}`}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}