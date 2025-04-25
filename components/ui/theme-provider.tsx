"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes"

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
      storageKey="sidehustle-theme"
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
  const { theme, resolvedTheme } = useTheme()
  
  React.useEffect(() => {
    if (!theme) return // Skip execution if theme isn't available yet
    
    const root = document.documentElement
    
    // Clear any existing theme classes
    const themeClassPattern = /^theme-/
    root.classList.forEach((cls) => {
      if (themeClassPattern.test(cls)) {
        root.classList.remove(cls)
      }
    })
    
    // If theme contains a specific theme (e.g., slate-dark)
    if (theme && theme.includes('-')) {
      const [colorTheme] = theme.split('-')
      root.classList.add(colorTheme)
      
      // Save the color theme separately for persistence
      localStorage.setItem('sidehustle-color-theme', colorTheme)
    } 
    // For built-in themes or if no theme
    else if (theme && theme !== 'light' && theme !== 'dark' && theme !== 'system') {
      root.classList.add(theme)
      
      // Save the color theme for persistence
      localStorage.setItem('sidehustle-color-theme', theme)
    }
    // Default to slate if no specific theme
    else {
      // Check localStorage directly for previously saved theme
      const savedTheme = localStorage.getItem('sidehustle-color-theme') || 'slate'
      root.classList.add(savedTheme)
    }
    
    // Make sure dark/light mode is correctly applied
    if (resolvedTheme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [theme, resolvedTheme])
  
  return null
}
