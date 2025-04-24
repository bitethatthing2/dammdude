"use client";

import { Button } from "@/components/ui/button";
import { Share, PlusCircle, Bell, ArrowRight } from "lucide-react";
import Image from "next/image";

interface IosInstallGuideProps {
  onInstallComplete?: () => void;
}

export function IosInstallGuide({ onInstallComplete }: IosInstallGuideProps = {}) {
  // Handle completion action
  const handleInstallClick = () => {
    // Track installation attempt
    try {
      if (typeof (window as any).gtag === 'function') {
        (window as any).gtag('event', 'ios_install_click', {
          event_category: 'engagement',
          event_label: 'ios'
        });
      }
    } catch (error) {
      console.error('Error tracking iOS installation click:', error);
    }
    
    // Call completion handler if provided
    if (onInstallComplete) {
      onInstallComplete();
    }
  };

  return (
    <div className="space-y-6">
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
            Tap the Share button
          </h3>
          <p className="text-xs text-muted-foreground">
            Open Safari's share menu by tapping the share icon at the bottom of the screen.
          </p>
          
          <div className="relative h-36 w-full border border-input rounded-md flex items-center justify-center bg-muted overflow-hidden">
            <div className="flex flex-col items-center">
              <div className="w-full max-w-[180px] h-24 bg-background border border-input rounded-lg mb-2 relative">
                <div className="absolute bottom-0 left-0 right-0 h-8 border-t border-input flex items-center justify-center">
                  <Share className="h-5 w-5 text-primary animate-pulse" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Tap the Share icon</p>
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
            <span className="flex items-center justify-center rounded-full bg-primary text-primary-foreground w-5 h-5 text-xs">2</span>
            Tap "Add to Home Screen"
          </h3>
          <p className="text-xs text-muted-foreground">
            Scroll down in the share menu and tap "Add to Home Screen".
          </p>
          
          <div className="relative h-36 w-full border border-input rounded-md flex items-center justify-center bg-muted overflow-hidden">
            <div className="flex flex-col items-center">
              <div className="w-full max-w-[180px] h-24 bg-background border border-input rounded-lg mb-2 relative">
                <div className="absolute top-0 left-0 right-0 bottom-0 flex flex-col items-center justify-center">
                  <div className="flex items-center gap-2 py-2 px-4 bg-muted/20 rounded-md mb-2">
                    <PlusCircle className="h-4 w-4 text-primary" />
                    <span className="text-xs font-medium text-foreground">Add to Home Screen</span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Select "Add to Home Screen"</p>
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
            <span className="flex items-center justify-center rounded-full bg-primary text-primary-foreground w-5 h-5 text-xs">3</span>
            Tap "Add"
          </h3>
          <p className="text-xs text-muted-foreground">
            You can edit the name if you want, then tap "Add" in the top-right corner.
          </p>
          
          <div className="relative h-36 w-full border border-input rounded-md flex items-center justify-center bg-muted overflow-hidden">
            <div className="flex flex-col items-center">
              <div className="w-full max-w-[180px] h-24 bg-background border border-input rounded-lg mb-2 relative">
                <div className="absolute top-0 left-0 right-0 h-8 border-b border-input flex items-center justify-between px-4">
                  <span className="text-xs">Cancel</span>
                  <span className="text-xs font-medium text-primary">Add</span>
                </div>
                <div className="absolute top-8 left-0 right-0 bottom-0 flex flex-col items-center justify-center p-4">
                  <div className="w-10 h-10 bg-primary rounded-xl mb-2 flex items-center justify-center">
                    <span className="text-xs text-primary-foreground font-bold">SH</span>
                  </div>
                  <span className="text-xs">Side Hustle</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Tap "Add"</p>
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
      
      <div className="border-t border-input pt-4">
        <div className="text-center">
          <p className="text-sm font-medium mb-2">After installation:</p>
          <p className="text-xs text-muted-foreground mb-4">
            When you first open the app, you'll be prompted to enable notifications for important updates.
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2 mx-auto bg-background text-foreground border border-input"
            onClick={handleInstallClick}
            aria-label="Add to Home Screen Now"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Add to Home Screen Now</span>
            <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
