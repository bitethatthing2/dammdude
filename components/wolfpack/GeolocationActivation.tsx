"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MapPin, Shield, AlertTriangle, Check, X } from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/AuthContext';
import { toast } from 'sonner';

interface BarLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  geofence_radius: number;
}

interface GeolocationState {
  permission: 'prompt' | 'granted' | 'denied';
  position: GeolocationPosition | null;
  error: string | null;
  isLoading: boolean;
}

interface WolfPackInvitation {
  show: boolean;
  barLocation: BarLocation | null;
  distance: number;
}

export function GeolocationActivation() {
  const { user } = useAuth();
  const [geoState, setGeoState] = useState<GeolocationState>({
    permission: 'prompt',
    position: null,
    error: null,
    isLoading: false
  });
  const [invitation, setInvitation] = useState<WolfPackInvitation>({
    show: false,
    barLocation: null,
    distance: 0
  });
  const [isWolfPackMember, setIsWolfPackMember] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);

  const supabase = getSupabaseBrowserClient();

  // Check if user is already a WolfPack member
  useEffect(() => {
    async function checkMembershipStatus() {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('is_wolfpack_member')
          .eq('user_id', user.id)
          .single();

        if (!error && data) {
          setIsWolfPackMember(data.is_wolfpack_member || false);
        }
      } catch (error) {
        console.error('Error checking WolfPack membership:', error);
      }
    }

    checkMembershipStatus();
  }, [user, supabase]);

  // Request location permission
  const requestLocationPermission = async () => {
    if (!navigator.geolocation) {
      setGeoState(prev => ({ ...prev, error: 'Geolocation is not supported by this browser' }));
      return;
    }

    setGeoState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      setGeoState(prev => ({ ...prev, permission: permission.state as 'prompt' | 'granted' | 'denied' }));

      if (permission.state === 'granted') {
        startLocationMonitoring();
      } else if (permission.state === 'prompt') {
        // Request permission by trying to get position
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setGeoState(prev => ({ 
              ...prev, 
              position, 
              permission: 'granted',
              isLoading: false 
            }));
            startLocationMonitoring();
          },
          (error) => {
            setGeoState(prev => ({ 
              ...prev, 
              error: error.message,
              permission: 'denied',
              isLoading: false 
            }));
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
        );
      } else {
        setGeoState(prev => ({ 
          ...prev, 
          error: 'Location permission denied',
          isLoading: false 
        }));
      }
    } catch (error) {
      setGeoState(prev => ({ 
        ...prev, 
        error: 'Failed to request location permission',
        isLoading: false 
      }));
    }
  };

  // Start monitoring location
  const startLocationMonitoring = () => {
    if (!navigator.geolocation) return;

    const id = navigator.geolocation.watchPosition(
      (position) => {
        setGeoState(prev => ({ ...prev, position, error: null }));
        checkProximityToBar(position);
      },
      (error) => {
        setGeoState(prev => ({ ...prev, error: error.message }));
      },
      {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 60000 // Cache position for 1 minute
      }
    );

    setWatchId(id);
  };

  // Stop location monitoring
  const stopLocationMonitoring = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
  };

  // Check proximity to bar locations
  const checkProximityToBar = async (position: GeolocationPosition) => {
    try {
      const { data: barLocations, error } = await supabase
        .from('bar_locations')
        .select('*')
        .eq('is_active', true);

      if (error || !barLocations) return;

      const userLat = position.coords.latitude;
      const userLng = position.coords.longitude;

      for (const bar of barLocations) {
        const distance = calculateDistance(userLat, userLng, bar.latitude, bar.longitude);
        
        // Check if user is within geofence (distance in meters)
        if (distance <= bar.geofence_radius && !isWolfPackMember) {
          setInvitation({
            show: true,
            barLocation: bar,
            distance: Math.round(distance)
          });
          
          // Show notification
          toast.info(`You're near ${bar.name}!`, {
            description: 'Join the WolfPack to unlock exclusive features'
          });
          break;
        }
      }
    } catch (error) {
      console.error('Error checking bar proximity:', error);
    }
  };

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  };

  // Join WolfPack from geolocation invitation
  const joinWolfPackFromLocation = async () => {
    if (!user || !invitation.barLocation) return;

    try {
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          is_wolfpack_member: true,
          wolfpack_joined_at: new Date().toISOString(),
          location_permissions_granted: true,
          joined_from_location: invitation.barLocation.id
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      setIsWolfPackMember(true);
      setInvitation({ show: false, barLocation: null, distance: 0 });
      
      toast.success('Welcome to the WolfPack!', {
        description: `You've joined from ${invitation.barLocation.name}`
      });

    } catch (error) {
      console.error('Error joining WolfPack:', error);
      toast.error('Failed to join WolfPack');
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopLocationMonitoring();
    };
  }, []);

  return (
    <div className="space-y-4">
      {/* Location Permission Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Location Services
          </CardTitle>
          <CardDescription>
            Enable location access to automatically join WolfPack when you visit Side Hustle
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {geoState.permission === 'prompt' && (
            <div className="space-y-3">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Location permission is required for automatic WolfPack activation
                </AlertDescription>
              </Alert>
              <Button 
                onClick={requestLocationPermission}
                disabled={geoState.isLoading}
                className="w-full"
              >
                {geoState.isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Requesting Permission...
                  </>
                ) : (
                  <>
                    <MapPin className="mr-2 h-4 w-4" />
                    Enable Location Services
                  </>
                )}
              </Button>
            </div>
          )}

          {geoState.permission === 'granted' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Location services enabled</span>
                <Badge variant="secondary">Active</Badge>
              </div>
              {geoState.position && (
                <p className="text-xs text-muted-foreground">
                  Monitoring your location for nearby Side Hustle locations
                </p>
              )}
              <Button
                variant="outline"
                onClick={stopLocationMonitoring}
                size="sm"
              >
                <X className="mr-2 h-3 w-3" />
                Disable
              </Button>
            </div>
          )}

          {geoState.permission === 'denied' && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Location permission denied. Please enable it in your browser settings to use automatic WolfPack activation.
              </AlertDescription>
            </Alert>
          )}

          {geoState.error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{geoState.error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* WolfPack Invitation */}
      {invitation.show && invitation.barLocation && (
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              WolfPack Invitation
            </CardTitle>
            <CardDescription>
              You&apos;re {invitation.distance}m from {invitation.barLocation.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm">
              Join the WolfPack to unlock exclusive features while you&apos;re here!
            </p>
            <div className="flex gap-2">
              <Button onClick={joinWolfPackFromLocation} className="flex-1">
                <Shield className="mr-2 h-4 w-4" />
                Join WolfPack
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setInvitation({ show: false, barLocation: null, distance: 0 })}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* WolfPack Status */}
      {isWolfPackMember && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              <span className="font-medium">You&apos;re a WolfPack member!</span>
              <Badge variant="secondary">Active</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Enjoying exclusive benefits and automatic bar access
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
