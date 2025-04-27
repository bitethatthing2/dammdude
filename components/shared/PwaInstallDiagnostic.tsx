'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { BugIcon } from 'lucide-react';

// Define the window type to include our custom property
declare global {
  interface Window {
    deferredPromptEvent: any;
  }
}

export function PwaInstallDiagnostic() {
  const [installabilityStatus, setInstallabilityStatus] = useState<string | null>(null);
  const [displayMode, setDisplayMode] = useState<string>('unknown');
  const [userAgent, setUserAgent] = useState<string>('unknown');
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [isChrome, setIsChrome] = useState<boolean>(false);
  const [alreadyInstalled, setAlreadyInstalled] = useState<boolean>(false);
  const [meetsCriteria, setMeetsCriteria] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Check display mode
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setDisplayMode('standalone');
      setAlreadyInstalled(true);
    } else if (window.matchMedia('(display-mode: fullscreen)').matches) {
      setDisplayMode('fullscreen');
      setAlreadyInstalled(true);
    } else if (window.matchMedia('(display-mode: minimal-ui)').matches) {
      setDisplayMode('minimal-ui');
      setAlreadyInstalled(true);
    } else if (('standalone' in window.navigator) && (window.navigator as any).standalone === true) {
      setDisplayMode('ios-standalone');
      setAlreadyInstalled(true);
    } else {
      setDisplayMode('browser');
    }
    
    // Check user agent
    const ua = window.navigator.userAgent;
    setUserAgent(ua);
    setIsIOS(/iphone|ipad|ipod/.test(ua.toLowerCase()) || (ua.includes('Mac') && navigator.maxTouchPoints > 0));
    setIsChrome(/chrome|chromium/i.test(ua));
    
    // Check installability
    if ('serviceWorker' in navigator) {
      if (navigator.serviceWorker.controller) {
        console.log('Service worker is active');
      } else {
        console.log('Service worker not controlling page');
      }
    } else {
      console.log('Service workers not supported');
    }
    
    const checkInstallability = async () => {
      try {
        if ('getInstalledRelatedApps' in navigator) {
          const relatedApps = await (navigator as any).getInstalledRelatedApps();
          if (relatedApps && relatedApps.length > 0) {
            setInstallabilityStatus('Already installed as related app');
            setAlreadyInstalled(true);
            return;
          }
        }
        
        // Check for manifest and service worker - basic PWA criteria
        const manifestLink = document.querySelector('link[rel="manifest"]');
        const hasServiceWorker = 'serviceWorker' in navigator;
        const hasHttps = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
        
        setMeetsCriteria(!!manifestLink && hasServiceWorker && hasHttps);
        setInstallabilityStatus(
          !manifestLink ? 'Missing manifest' :
          !hasServiceWorker ? 'Service worker not supported' :
          !hasHttps ? 'Not on HTTPS' :
          alreadyInstalled ? 'Already installed' :
          'Should be installable'
        );
        
        // Log to console if we're missing installability criteria
        if (!manifestLink || !hasServiceWorker || !hasHttps) {
          console.log('PWA installability criteria not met:', {
            hasManifest: !!manifestLink,
            hasServiceWorker,
            hasHttps
          });
        }
        
        // Manual trigger for the beforeinstallprompt event
        const triggerEvent = () => {
          if (window.deferredPromptEvent) {
            console.log('beforeinstallprompt event was previously captured');
          } else {
            console.log('No beforeinstallprompt event has been captured');
            // Create a temporary interaction to try to trigger the event
            const tempButton = document.createElement('button');
            tempButton.style.display = 'none';
            document.body.appendChild(tempButton);
            tempButton.click();
            document.body.removeChild(tempButton);
          }
        };
        
        setTimeout(triggerEvent, 1000);
        
      } catch (error) {
        console.error('Error checking installability:', error);
        setInstallabilityStatus('Error checking installability');
      }
    };
    
    checkInstallability();
    
  }, []);
  
  // Function to manually show iOS instructions
  const showIOSInstructions = () => {
    toast({
      title: "Install on iOS",
      description: "Tap the Share icon at the bottom of the screen, then tap 'Add to Home Screen'",
      duration: 8000,
    });
  };
  
  // Function to manually trigger installation (for Chrome)
  const triggerInstallation = async () => {
    if (window.deferredPromptEvent) {
      try {
        await window.deferredPromptEvent.prompt();
        const choiceResult = await window.deferredPromptEvent.userChoice;
        console.log('Installation choice:', choiceResult.outcome);
        if (choiceResult.outcome === 'accepted') {
          toast({
            title: "Installation successful",
            description: "Thanks for installing our app!",
            duration: 3000,
          });
        }
      } catch (error) {
        console.error('Error showing installation prompt:', error);
      }
    } else {
      toast({
        title: "Cannot install",
        description: "Installation prompt not available",
        duration: 3000,
      });
    }
  };
  
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline" size="icon">
          <BugIcon className="h-4 w-4" />
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>PWA Installation Diagnostic</DrawerTitle>
          <DrawerDescription>
            Diagnose why PWA installation might not be working
          </DrawerDescription>
        </DrawerHeader>
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="font-medium">Display Mode:</div>
            <div>{displayMode}</div>
            
            <div className="font-medium">Already Installed:</div>
            <div>{alreadyInstalled ? 'Yes' : 'No'}</div>
            
            <div className="font-medium">Browser:</div>
            <div>{isChrome ? 'Chrome' : isIOS ? 'iOS Safari' : 'Other'}</div>
            
            <div className="font-medium">Platform:</div>
            <div>{isIOS ? 'iOS' : 'Non-iOS'}</div>
            
            <div className="font-medium">Meets Criteria:</div>
            <div>{meetsCriteria ? 'Yes' : 'No'}</div>
            
            <div className="font-medium">Status:</div>
            <div>{installabilityStatus || 'Checking...'}</div>
          </div>
          
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-2">Installation Options</h4>
            <div className="flex flex-col gap-2">
              {isIOS && (
                <Button onClick={showIOSInstructions} variant="outline" size="sm">
                  Show iOS Instructions
                </Button>
              )}
              
              {isChrome && !alreadyInstalled && (
                <Button onClick={triggerInstallation} variant="outline" size="sm">
                  Force Chrome Installation
                </Button>
              )}
              
              <Button 
                onClick={() => {
                  // Log debug info
                  console.log('PWA Debug Info:', {
                    userAgent,
                    displayMode,
                    isIOS,
                    isChrome,
                    alreadyInstalled,
                    meetsCriteria,
                    installabilityStatus,
                    hasPrompt: !!window.deferredPromptEvent
                  });
                  
                  toast({
                    title: "Debug Info",
                    description: "Check console for installation debug information",
                    duration: 3000,
                  });
                }} 
                variant="outline" 
                size="sm"
              >
                Log Debug Info
              </Button>
            </div>
          </div>
        </div>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="outline">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
