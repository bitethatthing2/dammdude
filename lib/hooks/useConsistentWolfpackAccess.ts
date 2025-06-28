'use client';

import { useState, useEffect } from 'react';
import { useConsistentAuth } from './useConsistentAuth';
import { wolfpackRealtimeClient } from '@/lib/supabase/wolfpack-realtime-client';

export interface WolfpackMembership {
  id: string;
  user_id: string;
  location_id: string | null;
  display_name: string;
  status: 'active' | 'inactive' | 'suspended';
  is_active: boolean;
  session_id: string | null;
  location?: {
    id: string;
    name: string;
    address: string;
  };
}

export interface WolfpackAccessState {
  isMember: boolean;
  isActive: boolean;
  membership: WolfpackMembership | null;
  locationId: string | null;
  locationName: string | null;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

export function useConsistentWolfpackAccess(): WolfpackAccessState {
  const { user, loading: authLoading } = useConsistentAuth();
  const [membership, setMembership] = useState<WolfpackMembership | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchMembership = async (userId: string): Promise<WolfpackMembership | null> => {
    try {
      // Get current user's membership using the secure client
      const { data: userMembership, error } = await wolfpackRealtimeClient.getCurrentUserMembership();
      
      if (error) {
        console.error('Error fetching wolfpack membership:', error);
        setError(new Error(error));
        return null;
      }

      if (!userMembership) {
        return null;
      }

      // Convert to WolfpackMembership format
      return {
        id: userMembership.id,
        user_id: userMembership.user_id,
        location_id: userMembership.location_id,
        display_name: userMembership.display_name || '',
        status: (userMembership.status as 'active' | 'inactive' | 'suspended') || 'inactive',
        is_active: userMembership.is_active,
        session_id: null,
        location: userMembership.location_id ? {
          id: userMembership.location_id,
          name: 'Location', // You may need to fetch this separately if needed
          address: ''
        } : undefined
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch membership';
      console.error('Error fetching wolfpack membership:', errorMessage);
      setError(new Error(errorMessage));
      return null;
    }
  };

  const refresh = async () => {
    if (!user) {
      setMembership(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const membershipData = await fetchMembership(user.id);
      setMembership(membershipData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh membership';
      setError(new Error(errorMessage));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const checkMembership = async () => {
      if (authLoading) return;

      if (!user) {
        if (mounted) {
          setMembership(null);
          setIsLoading(false);
        }
        return;
      }

      try {
        const membershipData = await fetchMembership(user.id);
        if (mounted) {
          setMembership(membershipData);
        }
      } catch (err) {
        if (mounted) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to check membership';
          setError(new Error(errorMessage));
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    checkMembership();

    // For now, we'll skip the realtime subscription in this hook
    // The main realtime functionality will be handled by useWolfpackRealtimeFixed
    // This hook focuses on simple membership status checking

    return () => {
      mounted = false;
    };
  }, [user, authLoading]);

  const isMember = !!membership && membership.is_active && membership.status === 'active';
  const isActive = isMember;
  const locationId = membership?.location_id || null;
  const locationName = membership?.location?.name || null;

  return {
    isMember,
    isActive,
    membership,
    locationId,
    locationName,
    isLoading: authLoading || isLoading,
    error,
    refresh
  };
}