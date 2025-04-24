"use client";

import { Download, Menu, PlusCircle, Bell, ArrowRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import Image from 'next/image';

interface AndroidInstallGuideProps {
  onInstallAction: () => void;
  hasNativePrompt: boolean;
  onInstallComplete?: () => void;
}

export function AndroidInstallGuide({ 
  onInstallAction, 
  hasNativePrompt, 
  onInstallComplete 
}: AndroidInstallGuideProps) {
  
  // Handle manual installation completion
  const handleManualInstallClick = () => {
    // Track installation attempt
    try {
      if (typeof (window as any).gtag === 'function') {
        (window as any).gtag('event', 'android_manual_install_click', {
          event_category: 'engagement',
          event_label: 'android'
        });
      }
    } catch (error) {
      console.error('Error tracking Android installation click:', error);
    }
    
    // Call completion handler if provided
    if (onInstallComplete) {
      onInstallComplete();
    }
  };

  return (
    <div className="space-y-4">
      {hasNativePrompt ? (
        <>
          <div className="rounded-md bg-muted/30 p-3 text-xs text-muted-foreground mb-4">
            <p className="font-medium mb-1">Why install as an app?</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>Faster access from your home screen</li>
              <li>Works offline when you have no internet</li>
              <li>Get important notifications</li>
              <li>Full-screen experience without browser controls</li>
            </ul>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="relative h-48 w-64 border border-input rounded-md flex items-center justify-center bg-muted overflow-hidden mb-4">
              <div className="flex flex-col items-center">
                <div className="w-full h-full bg-background rounded-md p-4 flex flex-col items-center justify-center">
                  <div className="w-12 h-12 bg-primary rounded-xl mb-4 flex items-center justify-center">
                    <span className="text-xs text-primary-foreground font-bold">SH</span>
                  </div>
                  <p className="text-sm font-medium mb-2">Install Side Hustle?</p>
                  <p className="text-xs text-muted-foreground text-center mb-4">
                    This app will be installed on your device
                  </p>
                  <div className="flex gap-3">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-xs py-1 px-3 h-auto bg-background text-foreground border border-input"
                    >
                      Cancel
                    </Button>
                    <Button 
                      size="sm" 
                      className="text-xs py-1 px-3 h-auto bg-primary text-primary-foreground animate-pulse"
                    >
                      Install
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          
            <Button 
              className="w-full max-w-xs gap-2 bg-primary text-primary-foreground"
              onClick={onInstallAction}
              aria-label="Install app now"
            >
              <Download className="h-4 w-4" />
              Install Now
            </Button>
          </div>
          
          <div className="text-center mt-4">
            <p className="text-sm font-medium mb-2">After installation:</p>
            <p className="text-xs text-muted-foreground">
              You'll be prompted to enable notifications for important updates.
            </p>
          </div>
        </>
      ) : (
        <>
          <div className="rounded-md bg-muted/30 p-3 text-xs text-muted-foreground mb-4">
            <p className="font-medium mb-1">Why install as an app?</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>Faster access from your home screen</li>
              <li>Works offline when you have no internet</li>
              <li>Get important notifications</li>
              <li>Full-screen experience without browser controls</li>
            </ul>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                <span className="flex items-center justify-center rounded-full bg-primary text-primary-foreground w-5 h-5 text-xs">1</span>
                Tap the menu button
              </h3>
              <p className="text-xs text-muted-foreground">
                Open Chrome's menu by tapping the three dots in the top-right corner.
              </p>
              
              <div className="relative h-36 w-full border border-input rounded-md flex items-center justify-center bg-muted overflow-hidden">
                <div className="flex flex-col items-center">
                  <div className="w-full max-w-[180px] h-24 bg-background border border-input rounded-lg mb-2 relative">
                    <div className="absolute top-0 right-0 p-2">
                      <Menu className="h-5 w-5 text-primary animate-pulse" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">Tap the menu</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                <span className="flex items-center justify-center rounded-full bg-primary text-primary-foreground w-5 h-5 text-xs">2</span>
                Tap "Install app"
              </h3>
              <p className="text-xs text-muted-foreground">
                Select "Install app" or "Add to Home screen" from the menu.
              </p>
              
              <div className="relative h-36 w-full border border-input rounded-md flex items-center justify-center bg-muted overflow-hidden">
                <div className="flex flex-col items-center">
                  <div className="w-full max-w-[180px] h-24 bg-background border border-input rounded-lg mb-2 relative">
                    <div className="absolute top-0 right-0 w-32 h-full bg-background border-l border-input">
                      <div className="p-2 border-b border-input flex items-center gap-2">
                        <PlusCircle className="h-4 w-4 text-primary" />
                        <span className="text-xs font-medium text-foreground">Install app</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">Select "Install app"</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                <span className="flex items-center justify-center rounded-full bg-primary text-primary-foreground w-5 h-5 text-xs">3</span>
                Confirm installation
              </h3>
              <p className="text-xs text-muted-foreground">
                Tap "Install" on the confirmation dialog.
              </p>
              
              <div className="relative h-36 w-full border border-input rounded-md flex items-center justify-center bg-muted overflow-hidden">
                <div className="flex flex-col items-center">
                  <div className="w-full max-w-[180px] h-24 bg-background border border-input rounded-lg mb-2 relative">
                    <div className="absolute top-0 left-0 right-0 bottom-0 flex flex-col items-center justify-center p-4">
                      <div className="w-10 h-10 bg-primary rounded-xl mb-2 flex items-center justify-center">
                        <span className="text-xs text-primary-foreground font-bold">SH</span>
                      </div>
                      <p className="text-xs text-center mb-2">Install Side Hustle?</p>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="text-xs py-1 px-3 h-auto bg-background text-foreground border border-input">Cancel</Button>
                        <Button size="sm" className="text-xs py-1 px-3 h-auto bg-primary text-primary-foreground">Install</Button>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">Tap "Install"</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                <span className="flex items-center justify-center rounded-full bg-primary text-primary-foreground w-5 h-5 text-xs">4</span>
                Open from Home Screen
              </h3>
              <p className="text-xs text-muted-foreground">
                Find and tap the app icon on your home screen to open it.
              </p>
              
              <div className="relative h-36 w-full border border-input rounded-md flex items-center justify-center bg-muted overflow-hidden">
                <div className="flex flex-col items-center">
                  <div className="w-full max-w-[180px] h-24 bg-background border border-input rounded-lg mb-2 relative">
                    <div className="absolute top-0 left-0 right-0 bottom-0 flex flex-col items-center justify-center p-4">
                      <div className="grid grid-cols-4 gap-2">
                        <div className="w-10 h-10 bg-muted/30 rounded-xl"></div>
                        <div className="w-10 h-10 bg-muted/30 rounded-xl"></div>
                        <div className="w-10 h-10 bg-muted/30 rounded-xl"></div>
                        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center animate-pulse">
                          <span className="text-xs text-primary-foreground font-bold">SH</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">Tap the app icon</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-center mt-6 border-t border-input pt-4">
            <p className="text-sm font-medium mb-2">After installation:</p>
            <p className="text-xs text-muted-foreground mb-4">
              When you first open the app, you'll be prompted to enable notifications for important updates.
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2 mx-auto bg-background text-foreground border border-input"
              onClick={handleManualInstallClick}
              aria-label="Follow these steps to install"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Follow These Steps</span>
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
