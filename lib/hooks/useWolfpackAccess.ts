// lib/hooks/useWolfpackAccess.ts
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';

// =============================================================================
// TYPE DEFINITIONS - Matching your exact database schema
// =============================================================================

type WolfpackStatusValue = 'pending' | 'active' | 'inactive' | 'suspended';
type UserRole = 'admin' | 'bartender' | 'dj' | 'user';
type WolfpackTier = 'basic' | 'premium' | 'vip' | 'permanent';

interface DatabaseUser {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  avatar_url: string | null;
  profile_image_url: string | null;
  role: UserRole | null;
  location_id: string | null;
  wolfpack_status: WolfpackStatusValue | null;
  wolfpack_joined_at: string | null;
  wolfpack_tier: WolfpackTier | null;
  is_permanent_pack_member: boolean | null;
  is_wolfpack_member: boolean | null;
  location_permissions_granted: boolean | null;
  is_online: boolean | null;
  last_activity: string | null;
  auth_id: string | null;
  created_at: string;
  updated_at: string;
}

interface DatabaseLocation {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  latitude: number;
  longitude: number;
  radius_miles: number | null;
  is_active: boolean | null;
  timezone: string | null;
  created_at: string;
  updated_at: string;
}

interface DatabaseWolfPackMember {
  id: string;
  id: string;
  location_id: string;
  status: 'active' | 'inactive' | 'suspended';
  last_activity: string | null;
  created_at: string | null;
  updated_at: string | null;
}

// Frontend interface types
export interface WolfpackStatusType {
  isActive: boolean;
  isPending: boolean;
  isInactive: boolean;
  isSuspended: boolean;
  status: WolfpackStatusValue | null;
}

export interface LocationStatus {
  isAtLocation: boolean;
  isNearLocation: boolean;
  distanceFromLocation: number | null;
  locationId: string | null;
  locationName: string | null;
}

export interface WolfpackAccessState {
  // Core status
  isMember: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Wolfpack status details
  wolfpackStatus: WolfpackStatusType;
  
  // Location information
  locationStatus: LocationStatus;
  locationName: string | null;
  
  // Permission states
  hasLocationPermission: boolean;
  canJoinWolfpack: boolean;
  canCheckout: boolean;
  
  // User information
  userProfile: {
    id: string | null;
    displayName: string | null;
    avatarUrl: string | null;
    role: UserRole | null;
    tier: WolfpackTier | null;
    joinedAt: string | null;
  } | null;
  
  // Metadata
  lastChecked: string | null;
  memberCount: number;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 3959; // Earth's radius in miles
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

const parseWolfpackStatus = (status: string | null): WolfpackStatusType => {
  const statusValue = status as WolfpackStatusValue | null;
  
  return {
    isActive: statusValue === 'active',
    isPending: statusValue === 'pending',
    isInactive: statusValue === 'inactive',
    isSuspended: statusValue === 'suspended',
    status: statusValue
  };
};

const getUserDisplayName = (user: DatabaseUser): string => {
  if (user.display_name) return user.display_name;
  if (user.first_name || user.last_name) {
    return `${user.first_name || ''} ${user.last_name || ''}`.trim();
  }
  return user.email.split('@')[0] || 'Wolf Member';
};

// =============================================================================
// MAIN HOOK
// =============================================================================

export function useWolfpackAccess(
  options: {
    autoRefresh?: boolean;
    refreshInterval?: number;
    enableLocationTracking?: boolean;
  } = {}
): {
  // Core state
  isMember: boolean;
  isLoading: boolean;
  error: string | null;
  wolfpackStatus: WolfpackStatusType;
  locationStatus: LocationStatus;
  locationName: string | null;
  hasLocationPermission: boolean;
  canJoinWolfpack: boolean;
  canCheckout: boolean;
  userProfile: {
    id: string | null;
    displayName: string | null;
    avatarUrl: string | null;
    role: UserRole | null;
    tier: WolfpackTier | null;
    joinedAt: string | null;
  } | null;
  lastChecked: string | null;
  memberCount: number;
  
  // Actions
  refreshData: () => Promise<void>;
  
  // Derived state for backwards compatibility
  isInPack: boolean;
  
  // Location helpers
  userLocation: { latitude: number; longitude: number } | null;
  getCurrentLocation: () => Promise<{ latitude: number; longitude: number } | null>;
  
  // Permission helpers
  checkLocationPermission: () => Promise<boolean>;
} {
  const {
    autoRefresh = true,
    refreshInterval = 30000, // 30 seconds
    enableLocationTracking = true
  } = options;

  const [state, setState] = useState<WolfpackAccessState>({
    isMember: false,
    isLoading: true,
    error: null,
    wolfpackStatus: {
      isActive: false,
      isPending: false,
      isInactive: false,
      isSuspended: false,
      status: null
    },
    locationStatus: {
      isAtLocation: false,
      isNearLocation: false,
      distanceFromLocation: null,
      locationId: null,
      locationName: null
    },
    locationName: null,
    hasLocationPermission: false,
    canJoinWolfpack: false,
    canCheckout: false,
    userProfile: null,
    lastChecked: null,
    memberCount: 0
  });

  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  // =============================================================================
  // CORE FUNCTIONS
  // =============================================================================

  const checkLocationPermission = useCallback(async (): Promise<boolean> => {
    if (!enableLocationTracking || !navigator.geolocation) {
      return false;
    }

    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      return permission.state === 'granted';
    } catch (error) {
      console.warn('Could not check location permission:', error);
      return false;
    }
  }, [enableLocationTracking]);

  const getCurrentLocation = useCallback((): Promise<{
    latitude: number;
    longitude: number;
  } | null> => {
    if (!enableLocationTracking || !navigator.geolocation) {
      return Promise.resolve(null);
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          setUserLocation(coords);
          resolve(coords);
        },
        (error) => {
          console.warn('Could not get current location:', error);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  }, [enableLocationTracking]);

  const fetchWolfpackData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Get current authenticated user
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !authUser) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Authentication required',
          isMember: false,
          userProfile: null
        }));
        return;
      }

      // Get user profile data
      const { data: userProfile, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', authUser.id)
        .single();

      if (userError) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Could not fetch user profile',
          isMember: false
        }));
        return;
      }

      const user = userProfile as DatabaseUser;

      // Get location permission status
      const hasLocationPermission = await checkLocationPermission();
      let currentLocation = userLocation;
      
      if (hasLocationPermission && !currentLocation) {
        currentLocation = await getCurrentLocation();
      }

      // Get active locations
      const { data: locations, error: locationsError } = await supabase
        .from('locations')
        .select('*')
        .eq('is_active', true);

      if (locationsError) {
        console.warn('Could not fetch locations:', locationsError);
      }

      // Determine location status
      let locationStatus: LocationStatus = {
        isAtLocation: false,
        isNearLocation: false,
        distanceFromLocation: null,
        locationId: null,
        locationName: null
      };

      let nearestLocation: DatabaseLocation | null = null;

      if (currentLocation && locations) {
        let minDistance = Infinity;
        
        for (const location of locations as DatabaseLocation[]) {
          const distance = calculateDistance(
            currentLocation.latitude,
            currentLocation.longitude,
            location.latitude,
            location.longitude
          );

          if (distance < minDistance) {
            minDistance = distance;
            nearestLocation = location;
          }
        }

        if (nearestLocation) {
          const radiusMiles = nearestLocation.radius_miles || 0.25;
          const isAtLocation = minDistance <= radiusMiles;
          const isNearLocation = minDistance <= radiusMiles * 2; // Within 2x radius

          locationStatus = {
            isAtLocation,
            isNearLocation,
            distanceFromLocation: minDistance,
            locationId: nearestLocation.id,
            locationName: nearestLocation.name
          };
        }
      }

      // Check wolfpack membership
      const { data: membership, error: membershipError } = await supabase
        .from('wolf_pack_members')
        .select('*')
        .eq('id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1);

      if (membershipError) {
        console.warn('Could not fetch wolfpack membership:', membershipError);
      }

      const activeMembership = membership?.[0] as DatabaseWolfPackMember | undefined;

      // Get member count for current location
      let memberCount = 0;
      if (locationStatus.locationId) {
        const { count } = await supabase
          .from('wolf_pack_members')
          .select('*', { count: 'exact', head: true })
          .eq('location_id', locationStatus.locationId)
          .eq('status', 'active');
        
        memberCount = count || 0;
      }

      // Parse wolfpack status
      const wolfpackStatus = parseWolfpackStatus(user.wolfpack_status);
      const isMember = user.is_wolfpack_member || user.is_permanent_pack_member || false;

      // Determine permissions
      const canJoinWolfpack = 
        !isMember && 
        hasLocationPermission && 
        locationStatus.isAtLocation &&
        wolfpackStatus.status !== 'suspended';

      const canCheckout = 
        isMember && 
        wolfpackStatus.isActive && 
        activeMembership !== undefined;

      // Update state
      setState({
        isMember,
        isLoading: false,
        error: null,
        wolfpackStatus,
        locationStatus,
        locationName: nearestLocation?.name || null,
        hasLocationPermission,
        canJoinWolfpack,
        canCheckout,
        userProfile: {
          id: user.id,
          displayName: getUserDisplayName(user),
          avatarUrl: user.profile_image_url || user.avatar_url,
          role: user.role,
          tier: user.wolfpack_tier,
          joinedAt: user.wolfpack_joined_at
        },
        lastChecked: new Date().toISOString(),
        memberCount
      });

    } catch (error) {
      console.error('Error fetching wolfpack data:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }));
    }
  }, [checkLocationPermission, getCurrentLocation, userLocation]);

  const refreshData = useCallback(() => {
    return fetchWolfpackData();
  }, [fetchWolfpackData]);

  // =============================================================================
  // EFFECTS
  // =============================================================================

  // Initial data load
  useEffect(() => {
    fetchWolfpackData();
  }, [fetchWolfpackData]);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchWolfpackData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchWolfpackData]);

  // =============================================================================
  // RETURN INTERFACE
  // =============================================================================

  return {
    // Core state
    ...state,
    
    // Actions
    refreshData,
    
    // Derived state for backwards compatibility
    isInPack: state.isMember,
    
    // Location helpers
    userLocation,
    getCurrentLocation,
    
    // Permission helpers
    checkLocationPermission
  };
}

// Default export for compatibility
export default useWolfpackAccess;