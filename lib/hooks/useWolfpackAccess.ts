/**
 * Hook for managing Wolfpack access and permissions
 * Add this to your hooks directory
 */

import { useState, useEffect } from 'react';
import { useUser } from '@/hooks/useUser';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { 
  WolfpackStatus, 
  WolfpackStatusType, 
  LocationStatus 
} from '@/types/wolfpack-interfaces';

interface UseWolfpackAccessReturn {
  wolfpack: WolfpackStatusType;
  location: LocationStatus;
  canAccessBarTab: boolean;
  canCheckout: boolean;
  requiresAuth: boolean;
  retryLocationCheck: () => void;
  retryMembershipCheck: () => void;
  
  // Additional methods that were missing
  wolfpackStatus: WolfpackStatusType;
  checkFeatureAccess: (feature: string) => boolean;
  requestLocationAccess: () => Promise<void>;
  joinWolfpack: () => Promise<void>;
}

export function useWolfpackAccess(): UseWolfpackAccessReturn & WolfpackStatus {
  const { user, loading: userLoading } = useUser();
  const [wolfpackStatus, setWolfpackStatus] = useState<WolfpackStatusType>('loading');
  const [locationStatus, setLocationStatus] = useState<LocationStatus>('loading');

  // Check Wolfpack membership status
  useEffect(() => {
    if (userLoading) return;
    
    if (!user) {
      setWolfpackStatus('not_member');
      return;
    }

    // Check user's wolfpack_status field
    const status = user.wolfpack_status;
    if (status === 'active') {
      setWolfpackStatus('active');
    } else if (status === 'pending') {
      setWolfpackStatus('pending');
    } else if (status === 'inactive') {
      setWolfpackStatus('inactive');
    } else if (status === 'suspended') {
      setWolfpackStatus('suspended');
    } else {
      setWolfpackStatus('not_member');
    }
  }, [user, userLoading]);

  // Check location permissions
  useEffect(() => {
    if (!user) {
      setLocationStatus('not_requested');
      return;
    }

    // Check if user has granted location permissions
    if (user.location_permissions_granted) {
      setLocationStatus('granted');
    } else {
      setLocationStatus('not_requested');
    }
  }, [user]);

  const retryLocationCheck = () => {
    setLocationStatus('loading');
    // Re-trigger the location check
    if (user?.location_permissions_granted) {
      setLocationStatus('granted');
    } else {
      setLocationStatus('not_requested');
    }
  };

  const retryMembershipCheck = () => {
    setWolfpackStatus('loading');
    // Re-trigger the membership check
    if (!user) {
      setWolfpackStatus('not_member');
      return;
    }
    
    const status = user.wolfpack_status;
    if (status === 'active') {
      setWolfpackStatus('active');
    } else if (status === 'pending') {
      setWolfpackStatus('pending');
    } else {
      setWolfpackStatus('not_member');
    }
  };

  const checkFeatureAccess = (feature: string): boolean => {
    // Check if user has access to a specific feature
    if (feature === 'bar_tab') {
      return wolfpackStatus === 'active' && locationStatus === 'granted';
    }
    if (feature === 'checkout') {
      return wolfpackStatus === 'active';
    }
    return false;
  };

  const requestLocationAccess = async (): Promise<void> => {
    setLocationStatus('loading');
    
    if (!user) {
      setLocationStatus('not_requested');
      return;
    }

    try {
      const supabase = getSupabaseBrowserClient();
      
      // Request location permissions (this would trigger browser API in real implementation)
      if ('geolocation' in navigator) {
        await new Promise<void>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            async () => {
              // Update user's location permissions in database
              const { error } = await supabase
                .from('users')
                .update({ location_permissions_granted: true })
                .eq('id', user.id);
              
              if (!error) {
                setLocationStatus('granted');
                resolve();
              } else {
                reject(error);
              }
            },
            () => {
              setLocationStatus('denied');
              reject(new Error('Location permission denied'));
            }
          );
        });
      } else {
        setLocationStatus('denied');
      }
    } catch (error) {
      console.error('Failed to request location access:', error);
      setLocationStatus('denied');
    }
  };

  const joinWolfpack = async (): Promise<void> => {
    if (!user) {
      throw new Error('User must be authenticated to join Wolfpack');
    }

    setWolfpackStatus('loading');
    
    try {
      const supabase = getSupabaseBrowserClient();
      
      // Update user's wolfpack status to pending
      const { error } = await supabase
        .from('users')
        .update({ 
          wolfpack_status: 'pending',
          wolfpack_joined_at: new Date().toISOString()
        })
        .eq('id', user.id);
      
      if (error) throw error;
      
      setWolfpackStatus('pending');
    } catch (error) {
      console.error('Failed to join Wolfpack:', error);
      setWolfpackStatus('not_member');
      throw error;
    }
  };

  // Determine access permissions
  const canAccessBarTab = wolfpackStatus === 'active' && locationStatus === 'granted';
  const canCheckout = wolfpackStatus === 'active';
  const requiresAuth = !user;

  return {
    wolfpack: wolfpackStatus,
    location: locationStatus,
    canAccessBarTab,
    canCheckout,
    requiresAuth,
    retryLocationCheck,
    retryMembershipCheck,
    
    // Additional properties for compatibility
    wolfpackStatus,
    checkFeatureAccess,
    requestLocationAccess,
    joinWolfpack,
    
    // WolfpackStatus interface properties
    isWolfpackMember: wolfpackStatus === 'active',
    isLocationVerified: locationStatus === 'granted',
    isLoading: wolfpackStatus === 'loading' || locationStatus === 'loading',
    isChecking: wolfpackStatus === 'loading',
    isMember: wolfpackStatus === 'active'
  };
}
