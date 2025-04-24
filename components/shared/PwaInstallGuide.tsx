"use client";

import { useState, useEffect, useCallback } from 'react';
import { Download, X, Info, Smartphone, Phone, Tablet } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useLocalStorage } from '@/hooks/useLocalStorage';
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
  const [isOpen, setIsOpen] = useState(false);
  const [platform, setPlatform] = useState<'android' | 'ios' | 'desktop' | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [dismissCount, setDismissCount] = useLocalStorage('pwa-install-dismiss-count', 0);
  const [lastDismissed, setLastDismissed] = useLocalStorage('pwa-install-last-dismissed', 0);
  const [firstVisit, setFirstVisit] = useLocalStorage('pwa-first-visit', true);
  const [installationOutcome, setInstallationOutcome] = useState<'success' | 'dismissed' | null>(null);

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
    
    // Check if already installed
    const checkInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches || 
          window.matchMedia('(display-mode: window-controls-overlay)').matches ||
          (window.navigator as any).standalone === true) {
        setIsInstalled(true);
        return true;
      }
      return false;
    };
    
    checkInstalled();
    
    // Also listen for display mode changes
    const displayModeHandler = () => {
      if (checkInstalled()) {
        console.log('App was installed and launched in standalone mode');
      }
    };
    
    window.matchMedia('(display-mode: standalone)').addEventListener('change', displayModeHandler);
    
    return () => {
      window.matchMedia('(display-mode: standalone)').removeEventListener('change', displayModeHandler);
    };
  }, []);

  // Show installation prompt based on user behavior
  useEffect(() => {
    if (typeof window === 'undefined' || isInstalled) return;
    
    // Show on first visit with delay
    if (firstVisit) {
      const timer = setTimeout(() => {
        setIsOpen(true);
        setFirstVisit(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    } else {
      // Show prompt again after 7 days if dismissed less than 3 times
      const daysSinceLastDismiss = (Date.now() - lastDismissed) / (1000 * 60 * 60 * 24);
      if (dismissCount < 3 && daysSinceLastDismiss > 7) {
        setIsOpen(true);
      }
    }
  }, [firstVisit, setFirstVisit, isInstalled, dismissCount, lastDismissed]);

  // Listen for beforeinstallprompt event
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      console.log('beforeinstallprompt event was fired and stored');
    };
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    // Listen for app install status changes
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setInstallationOutcome('success');
      console.log('PWA was installed successfully');
      
      // Track installation for analytics
      try {
        if (typeof (window as any).gtag === 'function') {
          (window as any).gtag('event', 'pwa_install', {
            event_category: 'engagement',
            event_label: platform || 'unknown'
          });
        }
      } catch (error) {
        console.error('Error tracking installation:', error);
      }
    });
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [platform]);

  // Handle installation for Android/Chrome
  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) {
      console.log('No installation prompt available');
      return;
    }
    
    try {
      // Show the install prompt
      await deferredPrompt.prompt();
      
      // Wait for the user to respond to the prompt
      const choiceResult = await deferredPrompt.userChoice;
      
      // Reset the deferred prompt variable
      setDeferredPrompt(null);
      
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
        setInstallationOutcome('success');
      } else {
        console.log('User dismissed the install prompt');
        setInstallationOutcome('dismissed');
        handleDismiss();
      }
    } catch (error) {
      console.error('Error during installation prompt:', error);
    }
  }, [deferredPrompt]);

  // Handle dismissal logic
  const handleDismiss = useCallback(() => {
    setIsOpen(false);
    setDismissCount(prev => prev + 1);
    setLastDismissed(Date.now());
  }, [setDismissCount, setLastDismissed]);

  // Don't show if already installed
  if (isInstalled) return null;

  // Render appropriate button variant
  const renderButton = () => {
    // Determine the icon based on platform
    const PlatformIcon = platform === 'ios' ? Phone : 
                         platform === 'android' ? Tablet : 
                         Smartphone;
    
    switch (variant) {
      case 'icon':
        return (
          <Button 
            variant="ghost" 
            size="icon"
            className={`h-9 w-9 ${className}`}
            onClick={() => setIsOpen(true)}
            aria-label="Install app"
          >
            <PlatformIcon className="h-5 w-5" />
            <span className="sr-only">Install App</span>
          </Button>
        );
      case 'minimal':
        return (
          <Button 
            variant="link" 
            size="sm"
            className={`p-0 h-auto ${className}`}
            onClick={() => setIsOpen(true)}
          >
            <span>Install App</span>
          </Button>
        );
      default:
        return (
          <Button 
            variant="outline" 
            size="sm" 
            className={`gap-2 whitespace-nowrap bg-background text-foreground border border-input ${className}`}
            onClick={() => setIsOpen(true)}
          >
            <PlatformIcon className="h-4 w-4 flex-shrink-0" />
            <span className="inline-block">Install App</span>
          </Button>
        );
    }
  };

  return (
    <>
      {renderButton()}
      
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={() => setIsOpen(false)}>
          <div 
            className="bg-background text-foreground rounded-lg p-6 max-w-md w-[90%] max-h-[90vh] overflow-y-auto border border-input"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-foreground">Install Side Hustle App</h2>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 rounded-full bg-background text-foreground" 
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </div>
            
            <p className="text-sm text-muted-foreground mb-4">
              Get a faster, app-like experience with offline access and notifications.
            </p>
            
            <div className="mb-6">
              <div className="flex border-b border-input">
                <button 
                  className={`flex items-center gap-1 px-4 py-2 border-b-2 ${platform === 'android' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground'} bg-background`}
                  onClick={() => setPlatform('android')}
                >
                  <Tablet className="h-3.5 w-3.5" />
                  <span>Android</span>
                </button>
                <button 
                  className={`flex items-center gap-1 px-4 py-2 border-b-2 ${platform === 'ios' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground'} bg-background`}
                  onClick={() => setPlatform('ios')}
                >
                  <Phone className="h-3.5 w-3.5" />
                  <span>iOS</span>
                </button>
              </div>
              
              <div className="mt-4">
                {platform === 'android' ? (
                  <AndroidInstallGuide 
                    onInstallAction={handleInstall}
                    hasNativePrompt={!!deferredPrompt} 
                  />
                ) : (
                  <IosInstallGuide />
                )}
              </div>
            </div>
            
            <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-2">
              <Button 
                type="button" 
                variant="outline"
                className="mt-2 sm:mt-0 bg-background text-foreground border border-input"
                onClick={handleDismiss}
              >
                Maybe Later
              </Button>
              
              {deferredPrompt && platform === 'android' && (
                <Button 
                  type="button"
                  onClick={handleInstall}
                  className="bg-primary text-primary-foreground"
                >
                  Install Now
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
