"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SimpleHeader } from '@/components/shared/AppHeader';
import { DynamicLogo } from '@/components/shared/DynamicLogo';
import { useConsistentAuth } from '@/lib/hooks/useConsistentAuth';
import { useConsistentWolfpackAccess } from '@/lib/hooks/useConsistentWolfpackAccess';
import { wolfpackAPI } from '@/lib/api/wolfpack-client';
import { WolfpackLocationService, SIDE_HUSTLE_LOCATIONS } from '@/lib/services/wolfpack-location.service';
import { 
  Shield, 
  UtensilsCrossed,
  Loader2,
  CheckCircle
} from 'lucide-react';

// Type definitions based on your Supabase schema
type LocationStatus = 'checking' | 'verified' | 'denied' | 'error';

interface DetectedLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

interface JoinPackParams {
  location_id: string;
  display_name: string;
  wolf_emoji?: string;
  vibe_status?: string;
}

export default function WolfpackWelcomePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useConsistentAuth();
  const { isMember: isInPack, isLoading: packLoading } = useConsistentWolfpackAccess();
  const [isJoining, setIsJoining] = useState(false);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>('checking');
  const [detectedLocation, setDetectedLocation] = useState<DetectedLocation | null>(null);
  
  // Combined loading state
  const isLoading = authLoading || packLoading;

  useEffect(() => {
    // If already in pack, redirect immediately
    if (isInPack && !isLoading) {
      router.push('/wolfpack');
    }
  }, [isInPack, isLoading, router]);

  // Quick join without additional form
  const handleQuickJoin = useCallback(async () => {
    if (isJoining || !detectedLocation || !user) return;
    
    setIsJoining(true);
    try {
      // Generate display name from user data
      const displayName = user.first_name || user.email?.split('@')[0] || 'Wolf';
      
      const joinParams: JoinPackParams = {
        location_id: detectedLocation.id,
        display_name: displayName,
        wolf_emoji: '🐺',
        vibe_status: 'Ready to party!'
      };
      
      const result = await wolfpackAPI.joinPack(joinParams);
      
      if (result.success) {
        router.push('/wolfpack');
      } else {
        console.error('Failed to join pack:', result.error);
        setLocationStatus('error');
      }
    } catch (error) {
      console.error('Failed to join pack:', error);
      setLocationStatus('error');
    } finally {
      setIsJoining(false);
    }
  }, [isJoining, detectedLocation, user, router]);

  // Auto location verification using the location service
  const verifyLocation = useCallback(async () => {
    setLocationStatus('checking');
    
    try {
      const result = await WolfpackLocationService.verifyUserLocation();
      
      if (result.isAtLocation && result.locationId && result.locationName) {
        const locationData = result.nearestLocation ? 
          SIDE_HUSTLE_LOCATIONS[result.nearestLocation] : null;
        
        if (locationData) {
          setDetectedLocation({
            id: locationData.id,
            name: locationData.name,
            lat: locationData.lat,
            lng: locationData.lng
          });
          setLocationStatus('verified');
          // Auto-join pack after brief delay
          setTimeout(() => {
            handleQuickJoin();
          }, 1500);
        } else {
          setLocationStatus('denied');
        }
      } else {
        setLocationStatus('denied');
      }
    } catch (error) {
      console.error('Location verification failed:', error);
      setLocationStatus('error');
    }
  }, [handleQuickJoin]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 pb-20">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Checking pack status...</p>
          </div>
        </div>
      </div>
    );
  }

  // If already in pack, this will redirect above, but showing loading state just in case
  if (isInPack) {
    return (
      <div className="container mx-auto px-4 py-8 pb-20">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <p className="text-muted-foreground">Redirecting to pack...</p>
          </div>
        </div>
      </div>
    );
  }

  // Render different states based on location verification
  if (locationStatus === 'checking') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
        <SimpleHeader />
        <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="animate-pulse mb-6">
              <DynamicLogo type="wolf" width={64} height={64} className="mx-auto mb-4" />
            </div>
            <h1 className="text-2xl font-bold mb-4">🐺 Detecting Your Location</h1>
            <p className="text-muted-foreground mb-6">
              Checking if you&apos;re at Side Hustle Bar...
            </p>
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
              <span className="text-sm text-purple-600">Verifying location...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (locationStatus === 'verified') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 pb-20">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-green-600 to-emerald-600 mb-4">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-2">🎉 Welcome to {detectedLocation?.name}!</h1>
          <p className="text-muted-foreground mb-6">
            Automatically joining the Wolf Pack...
          </p>
          <div className="bg-white rounded-lg p-4 shadow-sm border border-green-200">
            <div className="flex items-center justify-center gap-2 text-green-600">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm font-medium">Setting up your pack access...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (locationStatus === 'denied') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50 pb-20">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-orange-500 to-red-500 mb-4">
              <UtensilsCrossed className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-4">📍 Location Required</h1>
          <p className="text-muted-foreground mb-6">
            You need to be at Side Hustle Bar to join the Wolf Pack.
          </p>
          <div className="space-y-4">
            <Card className="border-orange-200">
              <CardContent className="p-4">
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                    <span>Salem: {SIDE_HUSTLE_LOCATIONS.salem.address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                    <span>Portland: {SIDE_HUSTLE_LOCATIONS.portland.address}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Button 
              onClick={verifyLocation}
              className="w-full"
              variant="outline"
            >
              Try Again
            </Button>
            
            {/* Manual location selection for development */}
            {process.env.NODE_ENV === 'development' && (
              <>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Development Mode
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Select a location manually:
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={() => {
                        setDetectedLocation({
                          id: SIDE_HUSTLE_LOCATIONS.salem.id,
                          name: SIDE_HUSTLE_LOCATIONS.salem.name,
                          lat: SIDE_HUSTLE_LOCATIONS.salem.lat,
                          lng: SIDE_HUSTLE_LOCATIONS.salem.lng
                        });
                        setLocationStatus('verified');
                        setTimeout(() => handleQuickJoin(), 500);
                      }}
                      variant="secondary"
                      size="sm"
                    >
                      Salem
                    </Button>
                    <Button
                      onClick={() => {
                        setDetectedLocation({
                          id: SIDE_HUSTLE_LOCATIONS.portland.id,
                          name: SIDE_HUSTLE_LOCATIONS.portland.name,
                          lat: SIDE_HUSTLE_LOCATIONS.portland.lat,
                          lng: SIDE_HUSTLE_LOCATIONS.portland.lng
                        });
                        setLocationStatus('verified');
                        setTimeout(() => handleQuickJoin(), 500);
                      }}
                      variant="secondary"
                      size="sm"
                    >
                      Portland
                    </Button>
                  </div>
                </div>
              </>
            )}
            
            <Button 
              onClick={() => router.push('/')}
              className="w-full"
              variant="ghost"
            >
              Back to Menu
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-50 pb-20">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-red-500 to-pink-500 mb-4">
            <Shield className="h-8 w-8 text-white" />
          </div>
        </div>
        <h1 className="text-2xl font-bold mb-4">⚠️ Location Error</h1>
        <p className="text-muted-foreground mb-6">
          We couldn&apos;t access your location. Please enable location services and try again.
        </p>
        <div className="space-y-3">
          <Button 
            onClick={verifyLocation}
            className="w-full"
          >
            Enable Location & Retry
          </Button>
          <Button 
            onClick={() => router.push('/')}
            variant="outline"
            className="w-full"
          >
            Back to Menu
          </Button>
        </div>
      </div>
    </div>
  );
}