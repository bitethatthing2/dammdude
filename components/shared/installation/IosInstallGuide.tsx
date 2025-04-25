"use client";

import { Button } from "@/components/ui/button";
import { Share, PlusCircle, Bell } from "lucide-react";
import Image from "next/image";

interface IosInstallGuideProps {
  onInstallComplete?: () => void;
  variant?: 'full' | 'compact'; // full for modal, compact for toast
}

export function IosInstallGuide({ 
  onInstallComplete,
  variant = 'full'
}: IosInstallGuideProps) {
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

  // Compact version for toast notifications
  if (variant === 'compact') {
    return (
      <div className="space-y-2 text-sm">
        <p>1. Tap <Share className="h-3 w-3 inline mr-1" /> share</p>
        <p>2. Select <PlusCircle className="h-3 w-3 inline mr-1" /> Add to Home Screen</p>
        <p>3. Tap <span className="font-medium">Add</span></p>
      </div>
    );
  }

  // Full version for modal dialogs
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
          <div className="relative h-24 w-full rounded-md bg-muted/50 overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <Share className="h-8 w-8 text-primary" />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
            <span className="flex items-center justify-center rounded-full bg-primary text-primary-foreground w-5 h-5 text-xs">2</span>
            Select "Add to Home Screen"
          </h3>
          <p className="text-xs text-muted-foreground">
            Scroll down and tap on "Add to Home Screen" in the share menu options.
          </p>
          <div className="relative h-24 w-full rounded-md bg-muted/50 overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <PlusCircle className="h-8 w-8 text-primary" />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
          <span className="flex items-center justify-center rounded-full bg-primary text-primary-foreground w-5 h-5 text-xs">3</span>
          Tap "Add" in the top right
        </h3>
        <p className="text-xs text-muted-foreground">
          Review the app details and tap "Add" in the top right corner of the screen.
        </p>
      </div>

      <Button 
        className="w-full" 
        onClick={handleInstallClick}
        size="sm"
      >
        I've Added to Home Screen
      </Button>
    </div>
  );
}
