"use client";

import { useState, useEffect } from 'react';
import { Download, Share, PlusCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { toast } from "sonner";
import { cn } from '@/lib/utils';
import { IosInstallGuide } from './installation/IosInstallGuide';

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

  // Detect platform and installation status
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
    
    // Listen for beforeinstallprompt event (for browsers that support it)
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Store the event for later use
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      console.log('beforeinstallprompt event captured and stored');
    };
    
    // Listen for appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      
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
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [platform, dismissCount, lastDismissed, isToastShown]);
  
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
        } catch (error) {
          console.error('Error showing install prompt:', error);
          // If native prompt fails, we don't show manual instructions
          // This avoids confusing the user with redundant instructions
        }
      } else if (platform === 'android' || platform === 'desktop') {
        // For Android/Desktop without deferred prompt, show a simple message
        // This happens when the PWA criteria aren't met or the prompt was already shown
        toast.info(
          "Installation not available", 
          { 
            description: "Please ensure you're using a supported browser or the app is already installed",
            duration: 5000
          }
        );
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
      
      // Show error toast
      toast.error("Couldn't install app", {
        description: "Please try again later",
        duration: 5000,
      });
    }
  };
  
  // Don't render anything if already installed
  if (isInstalled) return null;
  
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
        Install App
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
      Install App
    </Button>
  );
}
