"use client";

import { useState, useEffect, useRef } from 'react';
import { Download, Share, PlusCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { toast } from "sonner";
import { cn } from '@/lib/utils';
import { IosInstallGuide } from './installation/IosInstallGuide';
import { 
  BeforeInstallPromptEvent, 
  initPwaEventListeners, 
  onBeforeInstallPrompt, 
  onAppInstalled,
  isInstalled as isPwaInstalled,
  isPromptAvailable,
  showInstallPrompt
} from '@/lib/pwa/pwaEventHandler';

interface PwaInstallGuideProps {
  variant?: 'button' | 'icon' | 'minimal';
  className?: string;
}

export default function PwaInstallGuide({ 
  variant = 'button',
  className = ''
}: PwaInstallGuideProps) {
  const [platform, setPlatform] = useState<'android' | 'ios' | 'desktop' | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [dismissCount, setDismissCount] = useLocalStorage('pwa-install-dismiss-count', 0);
  const [lastDismissed, setLastDismissed] = useLocalStorage('pwa-install-last-dismissed', 0);
  const [isToastShown, setIsToastShown] = useLocalStorage('pwa-toast-shown-today', false);
  const [promptAvailable, setPromptAvailable] = useState(false);
  const componentMounted = useRef(false);
  
  // Initialize PWA event listeners as early as possible
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Initialize the centralized PWA event handler
    initPwaEventListeners();
    
    // Mark component as mounted
    componentMounted.current = true;
    
    console.log('[PwaInstallGuide] Component mounted');
  }, []);
  
  // Set up event listeners and detect platform
  useEffect(() => {
    if (typeof window === 'undefined' || !componentMounted.current) return;
    
    // Detect platform with more robust checks
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         window.matchMedia('(display-mode: window-controls-overlay)').matches ||
                         (window.navigator as any).standalone === true;
    
    // More comprehensive device detection
    if (/iphone|ipad|ipod/.test(userAgent) || /mac/.test(userAgent) && navigator.maxTouchPoints > 1) {
      setPlatform('ios');
      console.log('[PwaInstallGuide] Platform detected: iOS');
      // Check if running as PWA on iOS
      if ((window.navigator as any).standalone === true) {
        setIsInstalled(true);
        console.log('[PwaInstallGuide] App is already installed on iOS');
      }
    } else if (/android/.test(userAgent)) {
      setPlatform('android');
      console.log('[PwaInstallGuide] Platform detected: Android');
      if (isStandalone) {
        setIsInstalled(true);
        console.log('[PwaInstallGuide] App is already installed on Android');
      }
    } else {
      setPlatform('desktop');
      console.log('[PwaInstallGuide] Platform detected: Desktop');
      if (isStandalone) {
        setIsInstalled(true);
        console.log('[PwaInstallGuide] App is already installed on Desktop');
      }
    }
    
    // Check if the app is already installed using the centralized handler
    if (isPwaInstalled()) {
      setIsInstalled(true);
      console.log('[PwaInstallGuide] App is already installed according to centralized handler');
    }
    
    // Check if a prompt is available
    if (isPromptAvailable()) {
      setPromptAvailable(true);
      console.log('[PwaInstallGuide] Installation prompt is available');
    }
    
    // Listen for beforeinstallprompt events
    const unsubscribeInstallPrompt = onBeforeInstallPrompt((event) => {
      console.log('[PwaInstallGuide] Received beforeinstallprompt event from centralized handler');
      setPromptAvailable(true);
    });
    
    // Listen for appinstalled events
    const unsubscribeAppInstalled = onAppInstalled(() => {
      console.log('[PwaInstallGuide] Received appinstalled event from centralized handler');
      setIsInstalled(true);
      setPromptAvailable(false);
      
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
        console.error('[PwaInstallGuide] Error tracking installation:', error);
      }
    });
    
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
    
    // Clean up event listeners
    return () => {
      unsubscribeInstallPrompt();
      unsubscribeAppInstalled();
    };
  }, [platform, dismissCount, lastDismissed, isToastShown, isInstalled]);
  
  // Handle install button click
  const handleInstallClick = async () => {
    if (isInstalled) return;
    
    console.log('[PwaInstallGuide] Install button clicked for platform:', platform);
    console.log('[PwaInstallGuide] Prompt available:', promptAvailable);
    
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
      } else if (promptAvailable) {
        // Use the centralized handler to show the installation prompt
        console.log('[PwaInstallGuide] Triggering installation prompt via centralized handler');
        const outcome = await showInstallPrompt();
        
        if (outcome === 'dismissed') {
          console.log('[PwaInstallGuide] User dismissed the installation prompt');
          setDismissCount(dismissCount + 1);
          setLastDismissed(Date.now());
        } else if (outcome === 'accepted') {
          console.log('[PwaInstallGuide] User accepted the installation prompt');
          // The appinstalled event will handle the rest
        }
      } else if (platform === 'android' || platform === 'desktop') {
        // For Android/Desktop without prompt stored, just silently return
        console.log('[PwaInstallGuide] Installation prompt not available');
        
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
        console.error('[PwaInstallGuide] Error tracking installation click:', error);
      }
    } catch (error) {
      console.error('[PwaInstallGuide] Error installing app:', error);
      // No toast error message - we want silent failures as per requirements
    }
  };
  
  // Don't render anything if already installed
  if (isInstalled) {
    console.log('[PwaInstallGuide] App is already installed, not rendering button');
    return null;
  }
  
  // IMPROVED VISIBILITY LOGIC: Show button for iOS always, and for Android/desktop
  // when promptAvailable is true
  // const shouldShowButton = platform === 'ios' || promptAvailable;
  
  // FORCE BUTTON TO APPEAR FOR DEBUGGING
  const shouldShowButton = true;
  
  if (!shouldShowButton) {
    console.log('[PwaInstallGuide] Button should not be shown - platform:', platform, 'promptAvailable:', promptAvailable);
    return null;
  }
  
  console.log('[PwaInstallGuide] Rendering installation button for platform:', platform);
  
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
        data-testid="pwa-install-button-icon"
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
        data-testid="pwa-install-button-minimal"
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
      data-testid="pwa-install-button"
    >
      <Download className="h-4 w-4" />
      {getButtonText()}
    </Button>
  );
}
