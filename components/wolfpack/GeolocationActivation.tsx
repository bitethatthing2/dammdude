"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MapPin, Shield, AlertTriangle, Check, X, Users } from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/useUser';
import { toast } from 'sonner';

interface Location {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  radius_miles: number;
}

interface GeolocationState {
  permission: 'prompt' | 'granted' | 'denied';
  position: GeolocationPosition | null;
  error: string | null;
  isLoading: boolean;
}

interface WolfPackInvitation {
  show: boolean;
  location: Location | null;
  distance: number;
}

// Fixed joinWolfPackFromLocation with proper error handling
const joinWolfPackFromLocation = async (
  locationId: string, 
  user: { id: string; first_name?: string; email?: string }, 
  supabase: ReturnType<typeof getSupabaseBrowserClient>
) => {
  if (!user) {
    throw new Error('User not authenticated');
  }

  try {
    // Step 1: Check if profile already exists
    console.log('Step 1: Checking for existing profile for user:', user.id);
    
    const { error: checkError } = await supabase
      .from('wolf_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    // Handle 409 conflict by updating instead of creating
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing profile:', checkError);
    }

    // Step 2: Prepare profile data
    const profileData = {
      user_id: user.id,
      display_name: user.first_name || user.email?.split('@')[0] || 'Wolf',
      wolf_emoji: '🐺',
      vibe_status: 'Ready to party! 🎉',
      is_visible: true,
      looking_for: 'New friends',
      bio: null,
      favorite_drink: null,
      favorite_song: null,
      instagram_handle: null,
      gender: null,
      pronouns: null,
      profile_pic_url: null,
      custom_avatar_id: null
    };

    console.log('Step 2: Profile data prepared');

    // Step 3: Upsert profile (insert or update)
    const { data: profileResult, error: profileError } = await supabase
      .from('wolf_profiles')
      .upsert(profileData, { 
        onConflict: 'user_id',
        ignoreDuplicates: false 
      })
      .select()
      .single();

    if (profileError) {
      console.error('Profile upsert error:', profileError);
      throw new Error(`Failed to save profile: ${profileError.message}`);
    }

    console.log('Profile saved successfully:', profileResult);

    // Step 4: Check if already a pack member
    const { data: existingMember, error: memberCheckError } = await supabase
      .from('wolfpack_memberships')
      .select('*')
      .eq('user_id', user.id)
      .eq('location_id', locationId)
      .maybeSingle();

    if (memberCheckError && memberCheckError.code !== 'PGRST116') {
      console.error('Error checking pack membership:', memberCheckError);
    }

    // Step 5: Create or update pack membership
    if (!existingMember) {
      const memberData = {
        user_id: user.id,
        location_id: locationId,
        status: 'active',
        joined_at: new Date().toISOString(),
        last_active: new Date().toISOString()
      };

      const { data: memberEntry, error: memberError } = await supabase
        .from('wolfpack_memberships')
        .insert(memberData)
        .select()
        .single();

      if (memberError) {
        console.error('Wolf pack member creation error:', memberError);
        // Don't throw - profile was created successfully
      } else {
        console.log('Successfully joined wolf pack:', memberEntry);
      }
    } else {
      // Update existing membership
      const { error: updateError } = await supabase
        .from('wolfpack_memberships')
        .update({ 
          status: 'active', 
          last_active: new Date().toISOString() 
        })
        .eq('id', existingMember.id);

      if (updateError) {
        console.error('Error updating pack membership:', updateError);
      }
    }

    return { success: true };

  } catch (error) {
    console.error('Unexpected error in joinWolfPackFromLocation:', error);
    throw error;
  }
};

// Fixed query functions to use correct column names
export async function checkWolfPackStatus(userId: string) {
  const supabase = getSupabaseBrowserClient();
  
  try {
    // Fix 1: Query wolfpack_status from users table correctly
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('wolfpack_status, wolfpack_joined_at')
      .eq('id', userId)
      .single();

    if (userError && userError.code !== 'PGRST116') {
      console.error('Error checking user wolfpack status:', userError);
    }

    // Fix 2: Query wolfpack_memberships with correct columns
    const { data: memberData, error: memberError } = await supabase
      .from('wolfpack_memberships')
      .select(`
        id,
        user_id,
        location_id,
        status,
        joined_at,
        last_active
      `)
      .eq('user_id', userId)
      .eq('status', 'active');

    if (memberError) {
      console.error('Error checking pack membership:', memberError);
    }

    return {
      isWolfpackMember: userData?.wolfpack_status === 'active' || (memberData && memberData.length > 0),
      memberData: memberData || [],
      userStatus: userData?.wolfpack_status
    };
  } catch (error) {
    console.error('Error in checkWolfPackStatus:', error);
    return {
      isWolfpackMember: false,
      memberData: [],
      userStatus: null
    };
  }
}

// Fixed location query with proper join syntax
export async function getWolfPackLocations(userId: string) {
  const supabase = getSupabaseBrowserClient();
  
  try {
    // Fix 3: Correct join syntax for locations
    const { data, error } = await supabase
      .from('wolfpack_memberships')
      .select(`
        id,
        location_id,
        status,
        joined_at,
        locations (
          id,
          name,
          address,
          city,
          state
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'active');

    if (error) {
      console.error('Error fetching wolfpack locations:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getWolfPackLocations:', error);
    return [];
  }
}

// Add this to your auth configuration to fix cookie issues
export function clearCorruptedAuthCookies() {
  // Clear all Supabase cookies
  document.cookie.split(";").forEach(function(c) { 
    if (c.trim().startsWith('sb-') || c.includes('supabase')) {
      const eqPos = c.indexOf('=');
      const name = eqPos > -1 ? c.substr(0, eqPos).trim() : c.trim();
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname};`;
    }
  });
  
  console.log('Cleared corrupted auth cookies');
}

// Call this when you detect cookie errors
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    if (event.message?.includes('Failed to parse cookie')) {
      clearCorruptedAuthCookies();
      window.location.reload();
    }
  });
}

export function GeolocationActivation() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const [geoState, setGeoState] = useState<GeolocationState>({
    permission: 'prompt',
    position: null,
    error: null,
    isLoading: false
  });
  const [invitation, setInvitation] = useState<WolfPackInvitation>({
    show: false,
    location: null,
    distance: 0
  });
  const [isWolfPackMember, setIsWolfPackMember] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<string | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);

  const supabase = getSupabaseBrowserClient();

  // Check if user is already an active WolfPack member
  useEffect(() => {
    async function checkMembershipStatus() {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('wolfpack_memberships')
          .select(`
            id,
            location_id,
            locations!inner(name)
          `)
          .eq('user_id', user.id)
          .eq('status', 'active')
          .maybeSingle();

        if (!error && data) {
          setIsWolfPackMember(true);
          setCurrentLocation(data.locations?.name || null);
        } else {
          setIsWolfPackMember(false);
          setCurrentLocation(null);
        }
      } catch (error) {
        console.error('Error checking WolfPack membership:', error);
        setIsWolfPackMember(false);
        setCurrentLocation(null);
      }
    }

    if (!userLoading) {
      checkMembershipStatus();
    }
  }, [user, userLoading, supabase]);

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
    } catch {
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
  const stopLocationMonitoring = useCallback(() => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
  }, [watchId]);

  // Check proximity to Side Hustle locations
  const checkProximityToBar = async (position: GeolocationPosition) => {
    try {
      // Check if wolfpack is available (11 AM - 2:30 AM)
      const now = new Date();
      const hour = now.getHours();
      const isWolfpackActive = hour >= 11 || hour < 2 || (hour === 2 && now.getMinutes() < 30);
      
      if (!isWolfpackActive) return;

      const { data: locations, error } = await supabase
        .from('locations')
        .select('*');

      if (error || !locations) return;

      const userLat = position.coords.latitude;
      const userLng = position.coords.longitude;

      for (const location of locations) {
        const distance = calculateDistance(userLat, userLng, location.latitude, location.longitude);
        const radiusInMeters = location.radius_miles * 1609.34; // Convert miles to meters
        
        // Check if user is within geofence and not already a member
        if (distance <= radiusInMeters && !isWolfPackMember) {
          setInvitation({
            show: true,
            location: location,
            distance: Math.round(distance)
          });
          
          // Show notification
          toast.info(`You're near ${location.name}!`, {
            description: 'Join the WolfPack to unlock exclusive features'
          });
          break;
        }
      }
    } catch (error) {
      console.error('Error checking location proximity:', error);
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
  const handleJoinWolfPack = async () => {
    if (!user || !invitation.location) {
      toast.error('Authentication error');
      return;
    }

    try {
      await joinWolfPackFromLocation(invitation.location.id, user, supabase);
      
      // Update local state
      setIsWolfPackMember(true);
      setCurrentLocation(invitation.location.name);
      setInvitation({ show: false, location: null, distance: 0 });
      
      toast.success('Welcome to the WolfPack!', {
        description: `You've joined the ${invitation.location.name} pack`
      });

      // Navigate to welcome page
      router.push('/wolfpack/welcome');
    } catch (error) {
      console.error('Error joining wolf pack:', error);
      
      let errorMessage = 'Failed to join WolfPack';
      if (error instanceof Error) {
        if (error.message.includes('Permission denied')) {
          errorMessage = 'Permission error. Please try logging out and back in.';
        } else if (error.message.includes('Invalid user reference')) {
          errorMessage = 'Authentication error. Please try logging out and back in.';
        } else {
          errorMessage = error.message;
        }
      }
      
      toast.error(errorMessage);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopLocationMonitoring();
    };
  }, [stopLocationMonitoring]);

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
      {invitation.show && invitation.location && (
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              WolfPack Invitation
            </CardTitle>
            <CardDescription>
              You&apos;re {invitation.distance}m from {invitation.location.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm">
              Join the WolfPack to unlock exclusive features while you&apos;re here!
            </p>
            <div className="flex gap-2">
              <Button onClick={handleJoinWolfPack} className="flex-1">
                <Shield className="mr-2 h-4 w-4" />
                Join WolfPack
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setInvitation({ show: false, location: null, distance: 0 })}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* WolfPack Status */}
      {isWolfPackMember && currentLocation && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              <span className="font-medium">You&apos;re in the {currentLocation} WolfPack!</span>
              <Badge variant="secondary">Active</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Enjoying exclusive features: chat, profile, and menu access
            </p>
            <div className="flex gap-2 mt-3">
              <Button size="sm" onClick={() => router.push('/chat')}>
                <Users className="mr-2 h-3 w-3" />
                Open Chat
              </Button>
              <Button size="sm" variant="outline" onClick={() => router.push('/wolfpack/profile')}>
                Edit Profile
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
