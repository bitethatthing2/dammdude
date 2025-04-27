'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { DownloadIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ToastAction } from '@/components/ui/toast';

// BeforeInstallPromptEvent type definition
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PwaInstallGuideProps {
  className?: string;
  fullButton?: boolean;
}

export function PwaInstallGuide({ className, fullButton = false }: PwaInstallGuideProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  // Handle installation button click
  const handleInstallClick = async () => {
    console.log('Install button clicked, prompt available:', !!deferredPrompt);
    
    if (deferredPrompt) {
      try {
        // Show the installation prompt
        await deferredPrompt.prompt();
        
        // Wait for the user's choice
        const choiceResult = await deferredPrompt.userChoice;
        
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the installation prompt');
          setDeferredPrompt(null);
        } else {
          console.log('User dismissed the installation prompt');
        }
      } catch (error) {
        console.error('Error showing installation prompt:', error);
      }
    } else if (isIOS) {
      // For iOS devices, show Add to Home Screen instructions
      toast({
        title: "Install on iOS",
        description: "Tap the Share icon, then 'Add to Home Screen'",
        duration: 5000,
        action: <ToastAction altText="Dismiss">Got it</ToastAction>,
      });
    }
  };

  // Check if app is already installed or can be installed
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Detect iOS devices
    const ua = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(ua) || 
                        (ua.includes('mac') && navigator.maxTouchPoints > 0);
    setIsIOS(isIOSDevice);
    
    // Check if already installed
    if (
      ('standalone' in window.navigator && (window.navigator as any).standalone) || 
      window.matchMedia('(display-mode: standalone)').matches
    ) {
      setIsInstalled(true);
      return;
    }

    // CRITICAL: Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the browser from showing the default prompt
      e.preventDefault();
      
      // Store the event for later use
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      
      console.log('beforeinstallprompt event captured in component', promptEvent);
    };
    
    // Attach the event listener directly
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    // Listen for appinstalled event
    const handleAppInstalled = () => {
      console.log('App installed');
      setIsInstalled(true);
      setDeferredPrompt(null);
    };
    
    window.addEventListener('appinstalled', handleAppInstalled);
    
    // Cleanup
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Don't show the button if the app is already installed
  if (isInstalled) {
    return null;
  }

  return (
    <Button
      variant="default"
      size={fullButton ? "default" : "sm"}
      className={cn("gap-2", fullButton ? "w-full" : "", className)}
      onClick={handleInstallClick}
    >
      <DownloadIcon className="h-4 w-4" />
      Install App
    </Button>
  );
}
