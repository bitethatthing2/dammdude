'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Download, 
  Bell, 
  Smartphone, 
  Monitor, 
  Chrome, 
  Share, 
  Plus,
  MoreHorizontal,
  ArrowRight,
  CheckCircle,
  Zap,
  Wifi
} from 'lucide-react';
import { PwaInstallGuide } from '@/components/shared/PwaInstallGuide';

export function AppInstallSection() {
  const [isInstalled, setIsInstalled] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check if app is installed
      const standaloneMode = window.matchMedia('(display-mode: standalone)').matches;
      const iosStandalone = (window.navigator as any).standalone === true;
      setIsInstalled(standaloneMode || iosStandalone);

      // Check notification permission
      if ('Notification' in window) {
        setNotificationPermission(Notification.permission);
      }
    }
  }, []);

  const InstallStep = ({ number, title, description, icon: Icon }: {
    number: number;
    title: string;
    description: string;
    icon: any;
  }) => (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
      <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">
        {number}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <Icon className="h-4 w-4 text-primary" />
          <h5 className="font-semibold text-sm">{title}</h5>
        </div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );

  return (
    <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-red-50">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mb-2">
          <Download className="h-6 w-6 text-white" />
        </div>
        <CardTitle className="text-xl font-bold text-gray-900">Get the Full Experience</CardTitle>
        <CardDescription className="text-gray-600">
          Install our app & enable notifications for exclusive offers
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* App Installation */}
        {!isInstalled && (
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2 mb-3">
              <h4 className="font-semibold text-lg">Install Side Hustle App</h4>
              <Badge variant="secondary" className="text-xs">
                Offline access • Faster loads • Push notifications
              </Badge>
            </div>
            <PwaInstallGuide fullButton className="max-w-sm mx-auto" />
          </div>
        )}

        {isInstalled && (
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span className="font-semibold">App Installed Successfully!</span>
            </div>
            <p className="text-sm text-muted-foreground">
              You're all set! Enjoy the full Side Hustle experience.
            </p>
          </div>
        )}

        <Separator />

        {/* Device-Specific Installation Guide */}
        {!isInstalled && (
          <div>
            <h4 className="font-semibold mb-4 flex items-center justify-center gap-2">
              <Monitor className="h-4 w-4" />
              Installation Guide by Device
            </h4>
            
            <Tabs defaultValue="android" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="android" className="text-xs">
                  <Chrome className="h-3 w-3 mr-1" />
                  Android
                </TabsTrigger>
                <TabsTrigger value="ios" className="text-xs">
                  <Smartphone className="h-3 w-3 mr-1" />
                  iOS
                </TabsTrigger>
                <TabsTrigger value="desktop" className="text-xs">
                  <Monitor className="h-3 w-3 mr-1" />
                  Desktop
                </TabsTrigger>
              </TabsList>

            <TabsContent value="android" className="space-y-3 mt-4">
              <div className="space-y-2">
                <InstallStep
                  number={1}
                  title="Open Chrome Menu"
                  description="Tap the three dots (⋮) in the upper right corner of Chrome"
                  icon={MoreHorizontal}
                />
                <InstallStep
                  number={2}
                  title="Find Install Option"
                  description="Look for 'Install app' or 'Add to Home screen' in the menu"
                  icon={Plus}
                />
                <InstallStep
                  number={3}
                  title="Confirm Installation"
                  description="Tap 'Install' when prompted to add Side Hustle to your home screen"
                  icon={CheckCircle}
                />
              </div>
              <div className="text-xs text-muted-foreground bg-white/50 p-2 rounded">
                💡 <strong>Tip:</strong> If you don't see the install option, try refreshing the page or visiting a few more times.
              </div>
            </TabsContent>

            <TabsContent value="ios" className="space-y-3 mt-4">
              <div className="space-y-2">
                <InstallStep
                  number={1}
                  title="Open Safari Share Menu"
                  description="Tap the Share button (square with arrow) at the bottom of Safari"
                  icon={Share}
                />
                <InstallStep
                  number={2}
                  title="Add to Home Screen"
                  description="Scroll down and tap 'Add to Home Screen' option"
                  icon={Plus}
                />
                <InstallStep
                  number={3}
                  title="Customize & Add"
                  description="Edit the name if desired, then tap 'Add' to install"
                  icon={CheckCircle}
                />
              </div>
              <div className="text-xs text-muted-foreground bg-white/50 p-2 rounded">
                💡 <strong>Note:</strong> This feature only works in Safari browser on iOS devices.
              </div>
            </TabsContent>

            <TabsContent value="desktop" className="space-y-3 mt-4">
              <div className="space-y-2">
                <InstallStep
                  number={1}
                  title="Look for Install Icon"
                  description="Check for an install icon in your browser's address bar"
                  icon={Download}
                />
                <InstallStep
                  number={2}
                  title="Click Install"
                  description="Click the install button or use the browser menu option"
                  icon={ArrowRight}
                />
                <InstallStep
                  number={3}
                  title="Launch from Desktop"
                  description="Find Side Hustle in your apps and launch like any other program"
                  icon={Monitor}
                />
              </div>
              <div className="text-xs text-muted-foreground bg-white/50 p-2 rounded">
                💡 <strong>Supported:</strong> Chrome, Edge, Opera, and other Chromium-based browsers.
              </div>
            </TabsContent>
          </Tabs>
          </div>
        )}

        <Separator />

        {/* Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div className="space-y-2">
            <div className="mx-auto w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <Wifi className="h-4 w-4 text-green-600" />
            </div>
            <h5 className="font-medium text-sm">Offline Access</h5>
            <p className="text-xs text-muted-foreground">Browse menu even without internet</p>
          </div>
          <div className="space-y-2">
            <div className="mx-auto w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <Zap className="h-4 w-4 text-blue-600" />
            </div>
            <h5 className="font-medium text-sm">Faster Loading</h5>
            <p className="text-xs text-muted-foreground">Lightning-fast app experience</p>
          </div>
          <div className="space-y-2">
            <div className="mx-auto w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <Bell className="h-4 w-4 text-purple-600" />
            </div>
            <h5 className="font-medium text-sm">Push Notifications</h5>
            <p className="text-xs text-muted-foreground">Order updates & exclusive offers</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}