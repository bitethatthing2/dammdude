"use client";

import { useState, useEffect, useRef } from 'react';
import { Download, Share, PlusCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { toast } from "sonner";
import { cn } from '@/lib/utils';
import { IosInstallGuide } from './installation/IosInstallGuide';

// Global flag to track if the beforeinstallprompt event has been captured
// This persists across component mounts but not page reloads
let globalDeferredPrompt: Event | null = null;

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PwaInstallGuideProps {
  variant?: 'button' | 'icon' | 'minimal';
  className?: string;
}

export default function PwaInstallGuide({ 
  variant = 'button',
  className = ''
}: PwaInstallGuideProps) {
  const [platform, setPlatform] = useState<'android' | 'ios' | 'desktop' | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [dismissCount, setDismissCount] = useLocalStorage('pwa-install-dismiss-count', 0);
  const [lastDismissed, setLastDismissed] = useLocalStorage('pwa-install-last-dismissed', 0);
  const [isToastShown, setIsToastShown] = useLocalStorage('pwa-toast-shown-today', false);
  const [promptAvailable, setPromptAvailable] = useState(false);
  const installEventRegistered = useRef(false);
  
  // CRITICAL: Register the beforeinstallprompt event listener as early as possible
  // This must happen before platform detection to ensure we don't miss the event
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Avoid duplicate event listeners
    if (installEventRegistered.current) return;
    installEventRegistered.current = true;
    
    // Check if we already have a captured prompt from the global variable
    if (globalDeferredPrompt) {
      console.log('Using previously captured beforeinstallprompt event');
      setDeferredPrompt(globalDeferredPrompt as BeforeInstallPromptEvent);
      setPromptAvailable(true);
    }
    
    // Check if we have a stored flag indicating a prompt was available
    try {
      const storedPromptAvailable = localStorage.getItem('pwa-prompt-available');
      if (storedPromptAvailable === 'true') {
        console.log('Prompt was previously available according to localStorage');
        setPromptAvailable(true);
      }
    } catch (err) {
      console.error('Error accessing localStorage:', err);
    }
    
    // Listen for beforeinstallprompt event (for browsers that support it)
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      
      console.log('beforeinstallprompt event captured', e);
      
      // Store the event both in state and in the global variable
      const promptEvent = e as BeforeInstallPromptEvent;
      globalDeferredPrompt = promptEvent;
      setDeferredPrompt(promptEvent);
      setPromptAvailable(true);
      
      // Store in localStorage that a prompt is available
      try {
        localStorage.setItem('pwa-prompt-available', 'true');
      } catch (err) {
        console.error('Error writing to localStorage:', err);
      }
      
      console.log('Installation prompt is available for platforms:', 
        (promptEvent as BeforeInstallPromptEvent).platforms);
    };
    
    // Listen for appinstalled event
    const handleAppInstalled = () => {
      console.log('App was installed successfully');
      
      // Clear all installation-related state
      setIsInstalled(true);
      setDeferredPrompt(null);
      setPromptAvailable(false);
      globalDeferredPrompt = null;
      
      // Clear localStorage flag
      try {
        localStorage.removeItem('pwa-prompt-available');
      } catch (err) {
        console.error('Error removing from localStorage:', err);
      }
      
      // Show success toast
      toast.success("App installed successfully", {
        description: "You can now access Side Hustle directly from your home screen",
        duration: 5000,
      });
      
      // Track installation
      try {
        if (typeof (window as any).gtag === 'function') {
          (window as any).gtag('event', 'pwa_installed', {
            event_category: 'engagement',
            event_label: platform
          });
        }
      } catch (error) {
        console.error('Error tracking installation:', error);
      }
    };
    
    // Add event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []); // Empty dependency array to ensure this runs once and early
  
  // Detect platform and installation status - this runs AFTER event listeners are set up
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Detect platform with more robust checks
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         window.matchMedia('(display-mode: window-controls-overlay)').matches ||
                         (window.navigator as any).standalone === true;
    
    // More comprehensive device detection
    if (/iphone|ipad|ipod/.test(userAgent) || /mac/.test(userAgent) && navigator.maxTouchPoints > 1) {
      setPlatform('ios');
      // Check if running as PWA on iOS
      if ((window.navigator as any).standalone === true) {
        setIsInstalled(true);
      }
    } else if (/android/.test(userAgent)) {
      setPlatform('android');
      if (isStandalone) {
        setIsInstalled(true);
      }
    } else {
      setPlatform('desktop');
      if (isStandalone) {
        setIsInstalled(true);
      }
    }
    
    // If we're already installed, clear the prompt availability flag
    if (isStandalone) {
      setPromptAvailable(false);
      try {
        localStorage.removeItem('pwa-prompt-available');
      } catch (err) {
        console.error('Error removing from localStorage:', err);
      }
    }
    
    // Check if we should show installation reminder - ONLY FOR iOS
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const shouldRemind = !isInstalled && 
                         !isToastShown && 
                         (now - lastDismissed > oneDayMs) && 
                         dismissCount < 3 &&
                         platform === 'ios'; // Only show automatic reminders for iOS
    
    if (shouldRemind) {
      // Reset the daily toast flag at midnight
      const resetToastFlag = () => {
        const tomorrow = new Date();
        tomorrow.setHours(24, 0, 0, 0);
        const timeUntilMidnight = tomorrow.getTime() - now;
        
        setTimeout(() => {
          setIsToastShown(false);
        }, timeUntilMidnight);
      };
      
      resetToastFlag();
      
      // Show installation reminder ONLY for iOS
      setTimeout(() => {
        // For iOS, use toast notifications with specific iOS instructions
        toast((t: string) => (
          <div className="flex flex-col gap-2">
            <p className="font-medium">Install this app on your iPhone</p>
            <p className="text-sm text-muted-foreground">Tap the share icon and then "Add to Home Screen"</p>
            <div className="flex justify-end gap-2 mt-2">
              <Button size="sm" variant="outline" onClick={() => {
                toast.dismiss(t);
                setDismissCount(dismissCount + 1);
                setLastDismissed(now);
              }}>
                Later
              </Button>
              <Button size="sm" onClick={() => {
                toast.dismiss(t);
                setIsToastShown(true);
                handleInstallClick();
              }}>
                Show Me How
              </Button>
            </div>
          </div>
        ), { duration: 10000 });
      }, 3000);
    }
  }, [platform, dismissCount, lastDismissed, isToastShown, isInstalled]);
  
  // Handle install button click
  const handleInstallClick = async () => {
    if (isInstalled) return;
    
    try {
      if (platform === 'ios') {
        // Show toast instructions for iOS only
        toast(
          <div className="flex flex-col gap-2">
            <div className="font-medium">Install this app on your iPhone</div>
            <IosInstallGuide variant="compact" />
          </div>,
          {
            duration: 10000,
            icon: <PlusCircle className="h-5 w-5" />,
            action: {
              label: "Got it",
              onClick: () => {
                setDismissCount(dismissCount + 1);
                setLastDismissed(Date.now());
              }
            }
          }
        );
      } else if (deferredPrompt) {
        // For browsers with native install prompt, trigger it
        console.log('Triggering native installation prompt');
        try {
          await deferredPrompt.prompt();
          const choiceResult = await deferredPrompt.userChoice;
          
          if (choiceResult.outcome === 'dismissed') {
            console.log('User dismissed the installation prompt');
            setDismissCount(dismissCount + 1);
            setLastDismissed(Date.now());
          } else {
            console.log('User accepted the installation prompt');
          }
          
          // Clear the prompt reference
          setDeferredPrompt(null);
          globalDeferredPrompt = null;
          setPromptAvailable(false);
          
          // Clear localStorage flag
          try {
            localStorage.removeItem('pwa-prompt-available');
          } catch (err) {
            console.error('Error removing from localStorage:', err);
          }
        } catch (error) {
          console.error('Error showing install prompt:', error);
          // No toast message here - we don't want to show a message if the native prompt fails
        }
      } else if ((platform === 'android' || platform === 'desktop') && promptAvailable) {
        // This is a fallback for when we know a prompt should be available
        // but the deferredPrompt object was lost (e.g., after a page reload)
        console.log('Installation prompt should be available but object was lost');
        toast.info("Please reload the page to install", {
          description: "The installation process requires a fresh page load",
          duration: 5000
        });
      } else if (platform === 'android' || platform === 'desktop') {
        // For Android/Desktop without prompt stored, just silently return
        console.log('Native installation prompt not available at this time');
        
        // Show a more helpful message when the button is clicked but no prompt is available
        toast.info("Installation not available", {
          description: "Please use this app for a while before installing",
          duration: 5000
        });
      }
      
      // Track installation attempt
      try {
        if (typeof (window as any).gtag === 'function') {
          (window as any).gtag('event', 'pwa_install_click', {
            event_category: 'engagement',
            event_label: platform
          });
        }
      } catch (error) {
        console.error('Error tracking installation click:', error);
      }
    } catch (error) {
      console.error('Error installing app:', error);
      // No toast error message - we want silent failures as per requirements
    }
  };
  
  // Don't render anything if already installed
  if (isInstalled) return null;
  
  // IMPROVED VISIBILITY LOGIC: Show button for iOS always, and for Android/desktop
  // when promptAvailable is true OR we're on a platform that supports installation
  const shouldShowButton = platform === 'ios' || promptAvailable;
  if (!shouldShowButton) return null;
  
  // Get button text based on platform
  const getButtonText = () => {
    if (platform === 'ios') return "Install App";
    return "Install App";
  };
  
  // Render based on variant
  if (variant === 'icon') {
    return (
      <Button 
        className={cn("p-0 h-9 w-9 rounded-full", className)}
        onClick={handleInstallClick}
        aria-label="Install app"
      >
        <Download className="h-4 w-4" />
      </Button>
    );
  }
  
  if (variant === 'minimal') {
    return (
      <button
        onClick={handleInstallClick}
        className={cn(
          "inline-flex items-center gap-1.5 text-sm font-medium",
          className
        )}
      >
        <Download className="h-4 w-4" />
        {getButtonText()}
      </button>
    );
  }
  
  // Default button variant
  return (
    <Button
      className={cn("gap-1.5", className)}
      onClick={handleInstallClick}
    >
      <Download className="h-4 w-4" />
      {getButtonText()}
    </Button>
  );
}
