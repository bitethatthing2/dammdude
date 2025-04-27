"use client";

import { useState } from 'react';
import { X, Download, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AndroidInstallGuide } from './AndroidInstallGuide';
import { IosInstallGuide } from './IosInstallGuide';
import { cn } from '@/lib/utils';

interface InstallPopupProps {
  platform: 'android' | 'desktop' | null;
  hasNativePrompt: boolean;
  onInstallAction: () => void;
  onDismissAction: () => void;
  open: boolean;
  onOpenChangeAction: (open: boolean) => void;
}

export function InstallPopup({
  platform,
  hasNativePrompt,
  onInstallAction,
  onDismissAction,
  open,
  onOpenChangeAction
}: InstallPopupProps) {
  const handleDismiss = () => {
    onOpenChangeAction(false);
    onDismissAction();
  };

  const handleInstall = () => {
    // Call the parent's installation action which triggers the native prompt
    console.log('Install button clicked - triggering installation');
    onInstallAction();
    
    // For manual installation (no native prompt), keep the dialog open
    // so the user can follow the instructions
    if (!hasNativePrompt) {
      console.log('Manual installation flow - keeping dialog open');
    } else {
      console.log('Native installation prompt triggered');
      // We don't close the dialog here - it will be closed in the parent component
      // after the user responds to the native prompt
    }
  };

  if (!open) return null;

  return (
    <>
      {/* Custom overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-50"
        onClick={() => onOpenChangeAction(false)}
      />
      
      {/* Custom dialog */}
      <div 
        className={cn(
          "fixed z-50 bg-background rounded-lg shadow-lg border overflow-hidden",
          "w-[90vw] max-w-md max-h-[90vh]",
          "left-[50%] top-[50%] -translate-x-1/2 -translate-y-1/2"
        )}
      >
        <div className="flex flex-col h-full max-h-[90vh]">
          {/* Header */}
          <div className="sticky top-0 bg-background z-10 px-6 py-4 border-b">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <PlusCircle className="h-5 w-5 text-primary" />
                  Install App
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {platform === 'android' 
                    ? "Install our app for a better experience on your Android device" 
                    : "Install our app for a better experience on your device"}
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 rounded-full" 
                onClick={() => onOpenChangeAction(false)}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-4 overflow-y-auto flex-grow">
            {platform === 'android' && (
              <AndroidInstallGuide 
                onInstallAction={handleInstall} 
                hasNativePrompt={hasNativePrompt}
                onInstallComplete={() => onOpenChangeAction(false)}
              />
            )}

            {platform === 'desktop' && (
              <div className="space-y-4">
                <div className="rounded-md bg-muted/30 p-3 text-xs text-muted-foreground mb-4">
                  <p className="font-medium mb-1">Why install as an app?</p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Faster access from your desktop</li>
                    <li>Works offline when you have no internet</li>
                    <li>Get important notifications</li>
                    <li>Full-screen experience without browser controls</li>
                  </ul>
                </div>

                {hasNativePrompt ? (
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="bg-muted p-4 rounded-lg w-full max-w-xs mx-auto">
                      <p className="text-sm font-medium mb-2">Click the install button below</p>
                      <Button 
                        type="button" 
                        onClick={handleInstall}
                        className="relative overflow-hidden"
                      >
                        <span className="relative z-10 flex items-center">
                          <Download className="mr-2 h-4 w-4" />
                          Install Now
                        </span>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex flex-col space-y-2">
                      <p className="font-medium">Install from your browser menu:</p>
                      <div className="space-y-2 text-sm">
                        <p>1. Click the install icon in your browser's address bar</p>
                        <p>2. Or select "Install" from the browser's menu</p>
                        <p>3. Follow the on-screen instructions</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-background z-10 px-6 py-4 border-t">
            <div className="flex flex-col-reverse sm:flex-row sm:justify-between sm:space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleDismiss}
                className="mt-2 sm:mt-0"
              >
                Maybe Later
              </Button>
              
              {hasNativePrompt && (
                <Button 
                  type="button" 
                  onClick={handleInstall}
                  className="relative overflow-hidden"
                >
                  <span className="relative z-10 flex items-center">
                    <Download className="mr-2 h-4 w-4" />
                    Install Now
                  </span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
