import { useState, useEffect } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Database } from '@/lib/database.types';

type User = Database['public']['Tables']['users']['Row'];
type Location = Database['public']['Tables']['locations']['Row'];

interface WolfpackAccessState {
  isAuthenticated: boolean;
  isWolfpackMember: boolean;
  isLocationVerified: boolean;
  locationError: string | null;
  user: User | null;
  userId: string | null;
  isLoading: boolean;
}

interface UseWolfpackAccessReturn extends WolfpackAccessState {
  verifyLocation: () => Promise<boolean>;
  checkAccess: (requireLocation?: boolean) => boolean;
}

export function useWolfpackAccess(): UseWolfpackAccessReturn {
  const [state, setState] = useState<WolfpackAccessState>({
    isAuthenticated: false,
    isWolfpackMember: false,
    isLocationVerified: false,
    locationError: null,
    user: null,
    userId: null,
    isLoading: true
  });

  const supabase = getSupabaseBrowserClient();

  // Check authentication and Wolfpack status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        
        if (!authUser) {
          setState(prev => ({
            ...prev,
            isAuthenticated: false,
            isWolfpackMember: false,
            user: null,
            userId: null,
            isLoading: false
          }));
          return;
        }

        // Fetch user data from users table
        const { data: userData, error } = await supabase
          .from('users')
          .select('*')
          .eq('auth_id', authUser.id)
          .single();

        if (error || !userData) {
          console.error('Error fetching user data:', error);
          setState(prev => ({
            ...prev,
            isAuthenticated: true,
            isWolfpackMember: false,
            user: null,
            userId: authUser.id,
            isLoading: false
          }));
          return;
        }

        // Check Wolfpack membership status
        const isWolfpack = userData.wolfpack_status === 'active';
        const hasLocationPermission = userData.location_permissions_granted || false;

        setState(prev => ({
          ...prev,
          isAuthenticated: true,
          isWolfpackMember: isWolfpack,
          isLocationVerified: isWolfpack || hasLocationPermission, // Wolfpack members auto-verified
          user: userData,
          userId: userData.id,
          isLoading: false
        }));

      } catch (error) {
        console.error('Auth check error:', error);
        setState(prev => ({
          ...prev,
          isLoading: false,
          locationError: 'Failed to check authentication'
        }));
      }
    };

    checkAuth();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkAuth();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  // Verify user location
  const verifyLocation = async (): Promise<boolean> => {
    // If already verified or is Wolfpack member, return true
    if (state.isLocationVerified || state.isWolfpackMember) {
      return true;
    }

    try {
      // Get user's current location
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });

      const { latitude, longitude } = position.coords;

      // Get active locations from database
      const { data: locations, error } = await supabase
        .from('locations')
        .select('*')
        .is('deleted_at', null);

      if (error || !locations || locations.length === 0) {
        setState(prev => ({
          ...prev,
          locationError: 'No active locations found',
          isLocationVerified: false
        }));
        return false;
      }

      // Check if user is within radius of any location
      const isNearLocation = locations.some(location => {
        const distance = calculateDistance(
          latitude,
          longitude,
          Number(location.latitude),
          Number(location.longitude)
        );
        const radiusMiles = Number(location.radius_miles) || 0.25;
        return distance <= radiusMiles;
      });

      if (isNearLocation) {
        setState(prev => ({
          ...prev,
          isLocationVerified: true,
          locationError: null
        }));

        // Update user's location permission in database if authenticated
        if (state.userId && state.isAuthenticated) {
          await supabase
            .from('users')
            .update({ 
              location_permissions_granted: true,
              updated_at: new Date().toISOString()
            })
            .eq('id', state.userId);
        }

        return true;
      } else {
        setState(prev => ({
          ...prev,
          isLocationVerified: false,
          locationError: 'You must be at the venue to place an order'
        }));
        return false;
      }

    } catch (error) {
      console.error('Location verification error:', error);
      let errorMessage = 'Location verification failed';
      
      if (error instanceof GeolocationPositionError) {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable location services.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
        }
      }

      setState(prev => ({
        ...prev,
        isLocationVerified: false,
        locationError: errorMessage
      }));
      return false;
    }
  };

  // Check if user has access (for checkout)
  const checkAccess = (requireLocation = true): boolean => {
    // Wolfpack members always have access
    if (state.isWolfpackMember) {
      return true;
    }

    // Non-members need location verification if required
    if (requireLocation && !state.isLocationVerified) {
      return false;
    }

    // Otherwise, allow access
    return true;
  };

  return {
    ...state,
    verifyLocation,
    checkAccess
  };
}

// Calculate distance between two points in miles
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Radius of the Earth in miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

// Simplified hook for checkout access
export function useCheckoutAccess() {
  const access = useWolfpackAccess();
  
  return {
    canCheckout: access.checkAccess(true),
    isWolfpackMember: access.isWolfpackMember,
    needsLocationVerification: !access.isWolfpackMember && !access.isLocationVerified,
    verifyLocation: access.verifyLocation,
    locationError: access.locationError,
    isLoading: access.isLoading
  };
}

// Hook for cart/menu access
export function useCartAccess() {
  const access = useWolfpackAccess();
  
  return {
    canAddToCart: access.checkAccess(true),
    isWolfpackMember: access.isWolfpackMember,
    needsLocationVerification: !access.isWolfpackMember && !access.isLocationVerified,
    verifyLocation: access.verifyLocation,
    locationError: access.locationError,
    isLoading: access.isLoading
  };
}