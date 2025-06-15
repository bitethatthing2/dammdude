"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { verifyAndStoreTableSession } from '@/lib/utils/table-utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  MapPin, 
  Users, 
  Crown, 
  Shield, 
  AlertCircle, 
  CheckCircle, 
  Loader2,
  Star 
} from 'lucide-react';

/**
 * Wolfpack verification component that replaces QR scanner functionality
 * Checks for Wolfpack membership and location proximity for bar tab access
 */
export function WolfpackVerification() {
  const [isVerifying, setIsVerifying] = useState(false);
  const [wolfpackStatus, setWolfpackStatus] = useState<'checking' | 'member' | 'non-member' | 'error'>('checking');
  const [locationStatus, setLocationStatus] = useState<'checking' | 'granted' | 'denied' | 'error'>('checking');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  
  // Initialize verification on component mount
  useEffect(() => {
    initializeVerification();
  }, []);
  
  const initializeVerification = async () => {
    try {
      // Check Wolfpack membership status
      await checkWolfpackMembership();
      
      // Check location if needed
      await checkLocationAccess();
    } catch (err) {
      console.error('Verification initialization error:', err);
      setError('Failed to initialize verification. Please try again.');
    }
  };
  
  const checkWolfpackMembership = async () => {
    try {
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        setWolfpackStatus('non-member');
        return;
      }
      
      // Check user's Wolfpack status from database
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('wolfpack_status, wolfpack_joined_at, wolfpack_tier')
        .eq('id', user.id)
        .single();
      
      if (profileError || !userProfile) {
        setWolfpackStatus('non-member');
        return;
      }
      
      // Check if user is an active Wolfpack member
      if (userProfile.wolfpack_status === 'active') {
        setWolfpackStatus('member');
      } else {
        setWolfpackStatus('non-member');
      }
    } catch (err) {
      console.error('Wolfpack membership check error:', err);
      setWolfpackStatus('error');
    }
  };
  
  const checkLocationAccess = async () => {
    try {
      // Request location permission
      if (!navigator.geolocation) {
        setLocationStatus('error');
        return;
      }
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          
          // Verify location is within establishment boundaries
          verifyLocationProximity(latitude, longitude);
        },
        (error) => {
          console.error('Location access error:', error);
          setLocationStatus('denied');
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    } catch (err) {
      console.error('Location check error:', err);
      setLocationStatus('error');
    }
  };
  
  const verifyLocationProximity = async (lat: number, lng: number) => {
    try {
      // Fetch establishment locations from database
      const { data: locations, error: locationsError } = await supabase
        .from('locations')
        .select('id, name, latitude, longitude, radius_miles, is_active')
        .eq('is_active', true);

      if (locationsError) {
        console.error('Error fetching locations:', locationsError);
        setLocationStatus('error');
        return;
      }

      if (!locations || locations.length === 0) {
        console.error('No active locations found');
        setLocationStatus('error');
        return;
      }

      // Check if user is within any establishment's geofence
      let isWithinBounds = false;
      let nearestLocation = null;
      let shortestDistance = Infinity;

      for (const location of locations) {
        const distance = calculateDistance(
          lat, 
          lng, 
          location.latitude, 
          location.longitude
        );

        // Convert radius from miles to kilometers (1 mile = 1.60934 km)
        const radiusKm = location.radius_miles * 1.60934;

        if (distance <= radiusKm) {
          isWithinBounds = true;
          nearestLocation = location;
          break;
        }

        // Track nearest location for debugging
        if (distance < shortestDistance) {
          shortestDistance = distance;
          nearestLocation = location;
        }
      }

      if (isWithinBounds) {
        setLocationStatus('granted');
        toast.success(`Location verified at ${nearestLocation?.name}`, {
          description: 'You are within the establishment boundaries.',
        });
      } else {
        setLocationStatus('denied');
        const distanceInMiles = (shortestDistance * 0.621371).toFixed(2);
        toast.error('Location verification failed', {
          description: `You are ${distanceInMiles} miles from the nearest location.`,
        });
      }
    } catch (err) {
      console.error('Location proximity verification error:', err);
      setLocationStatus('error');
    }
  };
  
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };
  
  const handleAccessBarTab = async () => {
    if (wolfpackStatus !== 'member') {
      toast.error('Wolfpack membership required', {
        description: 'You need to be a Wolfpack member to access the bar tab feature.',
      });
      return;
    }
    
    if (locationStatus !== 'granted') {
      toast.error('Location verification required', {
        description: 'You need to be at the establishment to access the bar tab.',
      });
      return;
    }
    
    setIsVerifying(true);
    
    try {
      // Create a session for Wolfpack member access
      // Use a default table ID for Wolfpack members (they don't need specific table assignment)
      const result = await verifyAndStoreTableSession('wolfpack-access', supabase);
      
      if (result.success) {
        toast.success('Bar Tab Access Granted', {
          description: 'Welcome to the Wolfpack experience!',
        });
        
        // Redirect to bar-tap page
        router.push('/bar-tap');
      } else {
        setError(result.error || 'Failed to grant access. Please try again.');
      }
    } catch (err) {
      console.error('Bar tab access error:', err);
      setError('Failed to access bar tab. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };
  
  const handleJoinWolfpack = () => {
    // Redirect to Wolfpack membership page
    router.push('/wolfpack/join');
  };
  
  const renderWolfpackStatus = () => {
    switch (wolfpackStatus) {
      case 'checking':
        return (
          <div className="flex items-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Checking Wolfpack status...</span>
          </div>
        );
      case 'member':
        return (
          <div className="flex items-center space-x-2">
            <Crown className="h-4 w-4 text-yellow-500" />
            <Badge variant="default" className="bg-yellow-500">
              Wolfpack Member
            </Badge>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </div>
        );
      case 'non-member':
        return (
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-gray-500" />
            <Badge variant="outline">Not a Member</Badge>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <span className="text-red-500">Status Check Failed</span>
          </div>
        );
    }
  };
  
  const renderLocationStatus = () => {
    switch (locationStatus) {
      case 'checking':
        return (
          <div className="flex items-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Verifying location...</span>
          </div>
        );
      case 'granted':
        return (
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4 text-green-500" />
            <Badge variant="default" className="bg-green-500">
              Location Verified
            </Badge>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </div>
        );
      case 'denied':
        return (
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4 text-red-500" />
            <Badge variant="destructive">Location Required</Badge>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <span className="text-red-500">Location Check Failed</span>
          </div>
        );
    }
  };
  
  const canAccessBarTab = wolfpackStatus === 'member' && locationStatus === 'granted';
  
  return (
    <div className="max-w-md mx-auto space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <CardTitle>Wolfpack Bar Tab</CardTitle>
          <CardDescription>
            Exclusive bar tab access for Wolfpack members
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Wolfpack Status */}
          <div className="space-y-2">
            <h3 className="font-medium">Membership Status</h3>
            {renderWolfpackStatus()}
          </div>
          
          {/* Location Status */}
          <div className="space-y-2">
            <h3 className="font-medium">Location Verification</h3>
            {renderLocationStatus()}
          </div>
          
          {/* Action Buttons */}
          <div className="space-y-3">
            {canAccessBarTab ? (
              <Button 
                onClick={handleAccessBarTab} 
                disabled={isVerifying}
                className="w-full"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Opening Bar Tab...
                  </>
                ) : (
                  <>
                    <Crown className="h-4 w-4 mr-2" />
                    Access Bar Tab
                  </>
                )}
              </Button>
            ) : wolfpackStatus === 'non-member' ? (
              <div className="space-y-3">
                <Button onClick={handleJoinWolfpack} className="w-full">
                  <Star className="h-4 w-4 mr-2" />
                  Join the Wolfpack
                </Button>
                <p className="text-sm text-muted-foreground text-center">
                  Unlock exclusive bar tab access and more benefits
                </p>
              </div>
            ) : (
              <Button disabled className="w-full">
                <Shield className="h-4 w-4 mr-2" />
                Verifying Access...
              </Button>
            )}
          </div>
          
          {/* Benefits Display for Non-Members */}
          {wolfpackStatus === 'non-member' && (
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-3 flex items-center">
                <Crown className="h-4 w-4 mr-2 text-yellow-500" />
                Wolfpack Benefits
              </h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Skip the line with instant bar tab access</li>
                <li>• Exclusive member pricing and promotions</li>
                <li>• Priority seating and reservations</li>
                <li>• Members-only events and experiences</li>
                <li>• Loyalty rewards and points</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
