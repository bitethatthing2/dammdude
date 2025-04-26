"use client";

import { useState, useEffect, useCallback } from 'react';
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
    
    // Detect platform
    const userAgent = window.navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setPlatform('ios');
    } else if (/android/.test(userAgent)) {
      setPlatform('android');
    } else {
      setPlatform('desktop');
    }
    
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches || 
        window.matchMedia('(display-mode: window-controls-overlay)').matches ||
        (window.navigator as any).standalone === true) {
      setIsInstalled(true);
    }
    
    // Listen for beforeinstallprompt event (Android)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    
    // Listen for appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      
      // Show success toast
      toast.success("App installed successfully", {
        description: "You can now access PDX Sports Bar directly from your home screen",
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
  }, [platform]);
  
  // Show installation toast based on platform
  const showInstallToast = useCallback(() => {
    if (isInstalled || !platform) return;
    
    if (platform === 'ios') {
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
    } else if (platform === 'android' && !deferredPrompt) {
      toast(
        <div className="flex flex-col gap-2">
          <div className="font-medium">Install this app on your Android device</div>
          <div className="space-y-2 text-sm">
            <p>1. Tap the menu button in your browser</p>
            <p>2. Select "Install app" or "Add to Home Screen"</p>
            <p>3. Follow the on-screen instructions</p>
          </div>
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
    }
    
    setIsToastShown(true);
  }, [platform, isInstalled, deferredPrompt, dismissCount, setDismissCount, setLastDismissed, setIsToastShown]);
  
  // Show installation toast when appropriate
  useEffect(() => {
    // Don't show toast if already installed or no platform detected
    if (isInstalled || !platform) return;
    
    // Check if we should show the toast based on dismiss count and time
    const shouldShowToast = () => {
      // Reset toast shown flag at the start of a new day
      const now = new Date();
      const lastShownDate = new Date(lastDismissed);
      if (lastShownDate.getDate() !== now.getDate() || 
          lastShownDate.getMonth() !== now.getMonth() || 
          lastShownDate.getFullYear() !== now.getFullYear()) {
        setIsToastShown(false);
      }
      
      // Don't show if already shown today
      if (isToastShown) return false;
      
      // Show immediately for first-time visitors
      if (dismissCount === 0) return true;
      
      // For repeat dismissals, gradually increase delay
      const hoursSinceLastDismiss = (Date.now() - lastDismissed) / (1000 * 60 * 60);
      const requiredHours = Math.min(dismissCount * 24, 168); // Cap at 7 days
      
      return hoursSinceLastDismiss >= requiredHours;
    };
    
    // Show toast after a short delay if conditions are met
    if (shouldShowToast()) {
      const timer = setTimeout(() => {
        showInstallToast();
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [platform, isInstalled, dismissCount, lastDismissed, isToastShown, showInstallToast, setIsToastShown]);
  
  // Handle install button click
  const handleInstall = async () => {
    if (isInstalled) return;
    
    try {
      if (platform === 'android' && deferredPrompt) {
        // Show native install prompt for Android
        await deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        
        if (choiceResult.outcome === 'accepted') {
          setIsInstalled(true);
          setDeferredPrompt(null);
        } else {
          setDismissCount(dismissCount + 1);
          setLastDismissed(Date.now());
        }
      } else {
        // Show toast instructions for iOS or Android without native prompt
        showInstallToast();
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
        description: "Please try again or install manually from your browser menu",
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
        onClick={handleInstall}
        aria-label="Install app"
      >
        <Download className="h-4 w-4" />
      </Button>
    );
  }
  
  if (variant === 'minimal') {
    return (
      <button
        onClick={handleInstall}
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
      onClick={handleInstall}
    >
      <Download className="h-4 w-4" />
      Install App
    </Button>
  );
}
