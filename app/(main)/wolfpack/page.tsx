"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import { BackButton } from '@/components/shared/BackButton';
import { 
  Shield, 
  Users, 
  MessageCircle, 
  MapPin, 
  Star, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  ArrowRight
} from 'lucide-react';

interface WolfpackMembership {
  id: string;
  user_id: string;
  location_id: string;
  status: 'active' | 'away' | 'offline' | 'inactive';
  table_location: string | null;
  joined_at: string;
  last_activity: string | null;
  is_active: boolean;
  latitude?: number;
  longitude?: number;
}

interface Location {
  id: string;
  name: string;
  city: string;
}

export default function WolfpackPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [membership, setMembership] = useState<WolfpackMembership | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    if (user) {
      checkMembershipStatus();
      fetchLocations();
    } else {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('id, name, city')
        .in('city', ['Salem', 'Portland']);

      if (error) throw error;
      if (data) {
        console.log('Fetched locations:', data);
        setLocations(data);
        return data;
      }
      return [];
    } catch (error) {
      console.error('Error fetching locations:', error);
      return [];
    }
  };

  const checkMembershipStatus = async () => {
    if (!user) return;

    try {
      // Check for existing membership using the correct table name
      const { data: membershipData, error } = await supabase
        .from('wolf_pack_members')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking membership:', error);
        throw error;
      }

      if (membershipData) {
        setMembership(membershipData);
      }
    } catch (error) {
      console.error('Error checking membership status:', error);
      toast({
        title: "Error",
        description: "Failed to check membership status. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const requestLocationPermission = async (availableLocations: Location[]): Promise<{ latitude: number; longitude: number; location: Location }> => {
    if (!navigator.geolocation) {
      throw new Error('Geolocation is not supported by this browser');
    }

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          console.log('Location access granted:', { latitude, longitude });
          
          // Determine which location the user is closest to
          const location = determineClosestLocation(latitude, longitude, availableLocations);
          
          resolve({ latitude, longitude, location });
        },
        (error) => {
          console.error('Geolocation error:', error);
          let errorMessage = 'Location access failed';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location permission was denied. Please enable location access in your browser settings.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information is unavailable. Please check your GPS or internet connection.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out. Please try again.';
              break;
            default:
              errorMessage = `Location error: ${error.message}`;
              break;
          }
          
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      );
    });
  };

  const determineClosestLocation = (latitude: number, longitude: number, availableLocations: Location[]): Location => {
    if (!availableLocations || availableLocations.length === 0) {
      throw new Error('No locations available. Please try again.');
    }

    // Salem coordinates (approximate downtown area)
    const salemLat = 44.9429;
    const salemLng = -123.0351;
    
    // Portland coordinates (approximate downtown area)
    const portlandLat = 45.5152;
    const portlandLng = -122.6784;
    
    // Calculate distance to each city
    const salemDistance = Math.sqrt(
      Math.pow(latitude - salemLat, 2) + Math.pow(longitude - salemLng, 2)
    );
    
    const portlandDistance = Math.sqrt(
      Math.pow(latitude - portlandLat, 2) + Math.pow(longitude - portlandLng, 2)
    );
    
    // Find the appropriate location from our fetched locations
    let closestCity: string;
    let minDistance: number;
    
    if (salemDistance < portlandDistance) {
      closestCity = 'Salem';
      minDistance = salemDistance;
    } else {
      closestCity = 'Portland';
      minDistance = portlandDistance;
    }
    
    // Check if within reasonable distance (about 0.15 degrees ~ 10 miles)
    if (minDistance > 0.15) {
      throw new Error('You must be at one of our Salem or Portland locations to join the Wolf Pack.');
    }
    
    // Find the location object
    const location = availableLocations.find(loc => loc.city === closestCity);
    if (!location) {
      throw new Error(`No active location found in ${closestCity}`);
    }
    
    return location;
  };

  const joinWolfpack = async () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to join the Wolf Pack.",
        variant: "destructive"
      });
      router.push('/login');
      return;
    }

    setJoining(true);

    try {
      // First ensure locations are loaded
      let availableLocations = locations;
      if (!availableLocations || availableLocations.length === 0) {
        console.log('No locations loaded, fetching...');
        availableLocations = await fetchLocations();
        if (!availableLocations || availableLocations.length === 0) {
          throw new Error('Unable to load locations. Please try again.');
        }
      }

      // Request location permission to verify user is at venue
      let locationData;
      try {
        locationData = await requestLocationPermission(availableLocations);
        console.log('User location determined:', locationData);
      } catch (locationError) {
        console.error('Location permission error:', locationError);
        toast({
          title: "Location Required",
          description: locationError instanceof Error ? locationError.message : 'Location access is required to join the Wolf Pack.',
          variant: "destructive"
        });
        setJoining(false);
        return;
      }

      // Use the new RPC function to join wolfpack
      console.log('Calling join_wolfpack with:', {
        location_id: locationData.location.id,
        location_name: locationData.location.name,
        location_city: locationData.location.city,
        latitude: locationData.latitude,
        longitude: locationData.longitude
      });

      const { data, error } = await supabase
        .rpc('join_wolfpack', {
          p_location_id: locationData.location.id,
          p_latitude: locationData.latitude,
          p_longitude: locationData.longitude,
          p_table_location: locationData.location.city
        });

      if (error) {
        console.error('Database error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        
        // Handle specific error cases
        if (error.code === '23505') {
          // This shouldn't happen with our new function, but just in case
          toast({
            title: "Already a Member",
            description: "You're already a member of this Wolf Pack location!",
            variant: "default"
          });
          // Refresh membership status
          await checkMembershipStatus();
          return;
        } else if (error.code === '23503') {
          throw new Error('Invalid location selected');
        } else {
          throw new Error(error.message || 'Failed to join Wolf Pack');
        }
      }

      // Check the response from the function
      if (data && data.success) {
        console.log('Successfully joined wolfpack:', data);
        
        // Fetch the updated membership data
        const { data: newMembership } = await supabase
          .from('wolf_pack_members')
          .select('*')
          .eq('id', data.member_id)
          .single();
          
        if (newMembership) {
          setMembership(newMembership);
        }
        
        const action = data.action === 'created' ? 'joined' : 'rejoined';
        toast({
          title: `🐺 Welcome to the ${locationData.location.city} Wolf Pack!`,
          description: `You've ${action} the ${locationData.location.name} pack!`,
        });

        // Redirect to welcome page
        router.push('/wolfpack/welcome');
      } else if (data && !data.success) {
        console.error('Function returned error:', data.error);
        throw new Error(data.error || 'Failed to join Wolf Pack');
      } else {
        throw new Error('No response from server');
      }

    } catch (error) {
      console.error('Error joining wolfpack:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      
      let errorMessage = "Please try again or contact support.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast({
        title: "Failed to Join",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 pb-20">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Checking your Wolf Pack status...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 pb-20">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <BackButton fallbackHref="/" />
            <div className="p-2 bg-primary/10 rounded-lg">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">Wolf Pack</h1>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please login to access Wolf Pack features.
            </AlertDescription>
          </Alert>

          <div className="mt-6">
            <Button onClick={() => router.push('/login')} className="w-full">
              Login to Continue
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // If user is already a member
  if (membership) {
    const locationInfo = locations.find(loc => loc.id === membership.location_id);
    
    return (
      <div className="container mx-auto px-4 py-8 pb-20">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <BackButton fallbackHref="/" />
            <div className="p-2 bg-primary/10 rounded-lg">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">Wolf Pack Member</h1>
              <p className="text-muted-foreground">Welcome back to the pack!</p>
            </div>
            <Badge variant="default">
              <CheckCircle className="h-3 w-3 mr-1" />
              Active Member
            </Badge>
          </div>

          {/* Member Status Card */}
          <Card className="mb-8 border-2 border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800">
                <Star className="h-5 w-5" />
                You&apos;re in the Pack!
              </CardTitle>
              <CardDescription className="text-green-700">
                Your Wolf Pack membership is active. You can now access all premium features.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-green-800">Member Since</p>
                  <p className="text-sm text-green-700">
                    {new Date(membership.joined_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-green-800">Pack Location</p>
                  <p className="text-sm text-green-700">
                    {locationInfo ? `${locationInfo.name} - ${locationInfo.city}` : membership.table_location || 'Not assigned'}
                  </p>
                </div>
              </div>
              {membership.last_activity && (
                <div className="mt-4 pt-4 border-t border-green-200">
                  <p className="text-xs text-green-600">
                    Last active: {new Date(membership.last_activity).toLocaleString()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Available Features */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Available Now
                </CardTitle>
                <CardDescription>
                  Features you can use with your membership
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Order Food & Drinks</h3>
                    <p className="text-sm text-muted-foreground">
                      Place orders directly through the bartender interface
                    </p>
                    <Button size="sm" variant="ghost" className="mt-2 p-0 h-auto" onClick={() => router.push('/menu')}>
                      Start Ordering <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <MessageCircle className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Wolf Pack Chat</h3>
                    <p className="text-sm text-muted-foreground">
                      Connect with other pack members in real-time
                    </p>
                    <Button size="sm" variant="ghost" className="mt-2 p-0 h-auto" onClick={() => router.push('/wolfpack/chat')}>
                      Join Chat <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-primary" />
                  Member Benefits
                </CardTitle>
                <CardDescription>
                  Exclusive perks for Wolf Pack members
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Priority ordering and service</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Access to Wolf Pack chat</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Exclusive event invitations</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Member-only offers and discounts</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <Button onClick={() => router.push('/menu')} className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Order Now
            </Button>
            <Button variant="outline" onClick={() => router.push('/wolfpack/chat')} className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Pack Chat
            </Button>
            <Button variant="outline" onClick={() => router.push('/events')} className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              Events
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // If user is not a member - show join form
  return (
    <div className="container mx-auto px-4 py-8 pb-20">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <BackButton fallbackHref="/" />
          <div className="p-2 bg-primary/10 rounded-lg">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Join the Wolf Pack</h1>
            <p className="text-muted-foreground">Unlock exclusive ordering and social features</p>
          </div>
        </div>

        {/* Benefits Section */}
        <Card className="mb-8 border-2 border-primary/20 bg-primary/5">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-2xl">
              <Star className="h-6 w-6 text-primary" />
              Why Join the Wolf Pack?
            </CardTitle>
            <CardDescription className="text-lg">
              Get access to exclusive features and become part of our community
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">🍽️ Ordering Benefits</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Direct ordering through bartender interface
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    No payment processing in app - pay at the bar
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Customizable orders with special instructions
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Priority service for pack members
                  </li>
                </ul>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">🐺 Social Features</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Real-time chat with other pack members
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Direct messaging to DJ for requests
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Participate in events and voting
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Member-exclusive events and offers
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location Permission Notice */}
        <Alert className="mb-6">
          <MapPin className="h-4 w-4" />
          <AlertDescription>
            To join the Wolf Pack, we need to verify you&apos;re at one of our locations (Salem or Portland).
            Location access will be requested during the joining process.
          </AlertDescription>
        </Alert>

        {/* Available Locations */}
        {locations.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Available Locations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                {locations.map((location) => (
                  <div key={location.id} className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{location.name} - {location.city}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Join Button */}
        <Card>
          <CardContent className="pt-6 text-center">
            <Button 
              onClick={joinWolfpack}
              disabled={joining}
              size="lg"
              className="w-full max-w-md"
            >
              {joining ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Joining the Pack...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-5 w-5" />
                  Join the Wolf Pack
                </>
              )}
            </Button>
            
            <p className="text-sm text-muted-foreground mt-4">
              By joining, you agree to share your location and follow community guidelines.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}