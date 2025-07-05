'use client';

import { WolfpackProfileManager } from '@/components/wolfpack/WolfpackProfileManager';
import { ThemeControl } from '@/components/shared/ThemeControl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Palette, Monitor } from 'lucide-react';

export default function ProfilePage() {
  return (
    <div className="main-content">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">My Profile</h1>
        
        {/* Theme Settings Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Theme Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Monitor className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Customize your app appearance
                </span>
              </div>
              <ThemeControl />
            </div>
          </CardContent>
        </Card>

        <WolfpackProfileManager />
      </div>
    </div>
  );
}