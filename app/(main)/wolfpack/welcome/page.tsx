"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useWolfpack } from '@/hooks/useWolfpack';
import { useAuth } from '@/lib/contexts/AuthContext';
import { 
  Shield, 
  Users, 
  UtensilsCrossed,
  Loader2,
  CheckCircle
} from 'lucide-react';

export default function WolfpackWelcomePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { isInPack, isLoading, joinPack } = useWolfpack();
  const [isJoining, setIsJoining] = useState(false);
  const [locationStatus, setLocationStatus] = useState<'checking' | 'verified' | 'denied' | 'error'>('checking');
  const [detectedLocation, setDetectedLocation] = useState<string | null>(null);

  useEffect(() => {
    // If already in pack, redirect immediately
    if (isInPack && !isLoading) {
      router.push('/wolfpack');
    }
  }, [isInPack, isLoading, router]);

  // Auto location verification on mount
  useEffect(() => {
    if (user && !isInPack) {
      verifyLocation();
    }
  }, [user, isInPack]);

  // Redirect to login if not authenticated
  if (!user && !isLoading) {
    router.push('/login');
    return null;
  }

  // Auto location verification
  const verifyLocation = async () => {
    setLocationStatus('checking');
    
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        });
      });

      const { latitude, longitude } = position.coords;
      
      // Side Hustle Bar locations (using prompt coordinates)
      const locations = {
        salem: { lat: 44.9429, lng: -123.0351, name: 'Salem' },
        portland: { lat: 45.5152, lng: -122.6784, name: 'Portland' }
      };

      let nearestLocation = null;
      let minDistance = Infinity;

      for (const [key, loc] of Object.entries(locations)) {
        const distance = calculateDistance(latitude, longitude, loc.lat, loc.lng);
        if (distance < minDistance && distance <= 100) { // 100 meter radius
          minDistance = distance;
          nearestLocation = loc.name;
        }
      }

      if (nearestLocation) {
        setDetectedLocation(nearestLocation);
        setLocationStatus('verified');
        // Auto-join pack after brief delay
        setTimeout(() => {
          handleQuickJoin();
        }, 1500);
      } else {
        setLocationStatus('denied');
      }
    } catch (error) {
      console.error('Location verification failed:', error);
      setLocationStatus('error');
    }
  };

  // Haversine formula to calculate distance
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  // Quick join without additional form
  const handleQuickJoin = async () => {
    if (isJoining) return;
    
    setIsJoining(true);
    try {
      const result = await joinPack({
        display_name: user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Wolf',
        emoji: '🐺',
        current_vibe: 'Ready to party!',
        table_location: 'Just arrived'
      });
      
      if (!result.error) {
        router.push('/wolfpack');
      }
    } catch (error) {
      console.error('Failed to join pack:', error);
    } finally {
      setIsJoining(false);
    }
  };

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="animate-pulse mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 mb-4">
              <Shield className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-4">🐺 Detecting Your Location</h1>
          <p className="text-muted-foreground mb-6">
            Checking if you're at Side Hustle Bar...
          </p>
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
            <span className="text-sm text-purple-600">Verifying location...</span>
          </div>
        </div>
      </div>
    );
  }

  if (locationStatus === 'verified') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-green-600 to-emerald-600 mb-4">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-2">🎉 Welcome to {detectedLocation}!</h1>
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50">
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
                    <span>Salem: 123 Main St</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                    <span>Portland: 456 Oak Ave</span>
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-50">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-red-500 to-pink-500 mb-4">
            <Shield className="h-8 w-8 text-white" />
          </div>
        </div>
        <h1 className="text-2xl font-bold mb-4">⚠️ Location Error</h1>
        <p className="text-muted-foreground mb-6">
          We couldn't access your location. Please enable location services and try again.
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
