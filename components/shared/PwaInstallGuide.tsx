"use client";

import { useState, useEffect, useCallback } from 'react';
import { Download, X, Info, Smartphone, Share, PlusCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useToast } from "@/components/ui/use-toast";
import { ToastAction } from "@/components/ui/toast";
import NotificationGuide from './NotificationGuide';
import { AndroidInstallGuide } from './installation/AndroidInstallGuide';
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
  const { toast } = useToast();
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
    
    // Check if app is already installed (PWA mode)
    const isInStandaloneMode = 
      window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as any).standalone || 
      document.referrer.includes('android-app://');
    
    setIsInstalled(isInStandaloneMode);
    
    // Listen for install prompt event (Android/Desktop)
    window.addEventListener('beforeinstallprompt', (e) => {
      // Prevent the default mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    });
    
    // Check if we should show toast notification for iOS
    const checkToastDisplay = () => {
      // Only show once per day for iOS
      const today = new Date().toDateString();
      const lastShown = localStorage.getItem('pwa-toast-shown-date');
      
      if (platform === 'ios' && !isInstalled && (!lastShown || lastShown !== today)) {
        // If not shown today and not too many dismissals
        if (!isToastShown && dismissCount < 3) {
          const timeSinceLastDismiss = Date.now() - lastDismissed;
          // Only show if last dismissed more than 1 day ago
          if (lastDismissed === 0 || timeSinceLastDismiss > 24 * 60 * 60 * 1000) {
            setTimeout(() => {
              showIosInstallToast();
              localStorage.setItem('pwa-toast-shown-date', today);
              setIsToastShown(true);
            }, 5000); // Show after 5 seconds
          }
        }
      }
    };
    
    // Only check after a slight delay to not interfere with initial page load
    const timer = setTimeout(checkToastDisplay, 3000);
    return () => clearTimeout(timer);
  }, [dismissCount, isToastShown, lastDismissed, platform, isInstalled, setIsToastShown]);

  // Show iOS install instructions via toast
  const showIosInstallToast = () => {
    toast({
      title: "Install Side Hustle App",
      description: "Add to Home Screen for a better experience. Tap the share button and select 'Add to Home Screen'.",
      duration: 10000, // 10 seconds
      action: (
        <ToastAction altText="Show installation instructions" onClick={showIosGuide}>
          Show Me How
        </ToastAction>
      )
    });
    
    // Track dismissal manually since we can't use onDismiss
    setTimeout(() => {
      setDismissCount(dismissCount + 1);
      setLastDismissed(Date.now());
    }, 10000);
  };

  // Show iOS install guide as sheet
  const showIosGuide = () => {
    toast({
      title: "Install on iOS",
      description: (
        <IosInstallGuide variant="compact" onInstallComplete={() => {
          // Track successful installation attempt
          try {
            if (typeof (window as any).gtag === 'function') {
              (window as any).gtag('event', 'ios_install_complete', {
                event_category: 'engagement',
                event_label: 'ios_toast'
              });
            }
          } catch (error) {
            console.error('Error tracking iOS installation completion:', error);
          }
        }} />
      ),
      duration: 30000, // 30 seconds
    });
  };

  // Handle Android/Desktop install
  const handleInstall = async () => {
    if (!deferredPrompt) {
      // If no install prompt is available but on iOS, show the iOS guide
      if (platform === 'ios') {
        showIosGuide();
      }
      return;
    }

    // Show the install prompt
    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      // Track outcome
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        try {
          if (typeof (window as any).gtag === 'function') {
            (window as any).gtag('event', 'app_install_success', {
              event_category: 'engagement',
              event_label: platform
            });
          }
        } catch (error) {
          console.error('Error tracking installation:', error);
        }
      } else {
        setDismissCount(dismissCount + 1);
        setLastDismissed(Date.now());
        try {
          if (typeof (window as any).gtag === 'function') {
            (window as any).gtag('event', 'app_install_dismissed', {
              event_category: 'engagement',
              event_label: platform
            });
          }
        } catch (error) {
          console.error('Error tracking dismissal:', error);
        }
      }
    } catch (error) {
      console.error('Error showing install prompt:', error);
    }
  };

  // Don't render if already installed
  if (isInstalled) return null;

  // Render the appropriate button/trigger based on variant
  switch(variant) {
    case 'icon':
      return (
        <Button 
          variant="ghost" 
          size="icon"
          onClick={platform === 'ios' ? showIosGuide : handleInstall}
          className={`rounded-full ${className}`}
          aria-label="Install app"
        >
          <Download className="h-5 w-5" />
        </Button>
      );
    
    case 'minimal':
      return (
        <button 
          onClick={platform === 'ios' ? showIosGuide : handleInstall}
          className={`text-sm text-muted-foreground flex items-center gap-1 ${className}`}
        >
          <Download className="h-4 w-4" />
          Install App
        </button>
      );
    
    default:
      return (
        <Button 
          variant="outline" 
          size="sm"
          onClick={platform === 'ios' ? showIosGuide : handleInstall}
          className={`flex items-center gap-1 ${className}`}
        >
          <Download className="h-4 w-4" />
          Install App
        </Button>
      );
  }
}
