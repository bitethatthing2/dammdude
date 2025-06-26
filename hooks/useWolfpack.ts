import { useState, useEffect } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/AuthContext';
import { 
  AuthUser, 
  SupabaseError, 
  WolfpackMembership, 
  DebugResult, 
  RealtimePayload 
} from '@/types/wolfpack-interfaces';
import { 
  ensureUserExists, 
  debugWolfPackMembership, 
  isVipUser 
} from '@/lib/utils/wolfpack-utils';

// Special VIP users who should always be wolfpack members  
const VIP_USERS = ['mkahler599@gmail.com'];

// Unified interface that provides both simple and comprehensive access
interface UseWolfpackReturn {
  // Simple interface (backward compatible with useSimpleWolfpack)
  isInPack: boolean;
  isLoading: boolean;
  error: string | null;
  joinPack: (tableLocation?: string) => Promise<void>;
  leavePack: () => Promise<void>;
  
  // Comprehensive interface (from useWolfpackMembership)
  membership: WolfpackMembership | null;
  isActive: boolean;
  checkMembership: () => Promise<void>;
  joinWolfPack: (locationId?: string, tableLocation?: string) => Promise<boolean>;
  leaveWolfPack: () => Promise<boolean>;
  debugMembership: () => Promise<DebugResult>;
}


export function useWolfpack(locationId?: string): UseWolfpackReturn {
  const [membership, setMembership] = useState<WolfpackMembership | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const supabase = getSupabaseBrowserClient();

  const isVipUser = user?.email && VIP_USERS.includes(user.email);

  const checkMembership = async () => {
    if (!user) {
      setMembership(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // First ensure user exists in public.users table
      const userExists = await ensureUserExists(supabase, user);
      if (!userExists) {
        throw new Error('Failed to create user record');
      }

      // Build query
      let query = supabase
        .from('wolfpack_memberships')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active');

      // Handle location filter correctly
      if (locationId === null || locationId === undefined) {
        query = query.is('location_id', null);
      } else if (locationId) {
        query = query.eq('location_id', locationId);
      }

      const { data: membershipData, error: membershipError } = await query.maybeSingle();

      if (membershipError && membershipError.code !== 'PGRST116') {
        throw membershipError;
      }

      if (membershipData) {
        setMembership(membershipData as WolfpackMembership);
      } else if (isVipUser) {
        console.log('🌟 VIP User detected, auto-creating membership...');
        
        try {
          const { data: existingVip, error: checkVipError } = await supabase
            .from('wolfpack_memberships')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();
            
          if (checkVipError && checkVipError.code !== 'PGRST116') {
            throw checkVipError;
          }
          
          if (existingVip) {
            // Reactivate existing VIP membership
            const { data: vipMembership, error: vipError } = await supabase
              .from('wolfpack_memberships')
              .update({
                status: 'active',
                table_location: 'VIP',
                location_id: locationId || null,
                last_active: new Date().toISOString()
              })
              .eq('id', existingVip.id)
              .select()
              .single();
              
            if (vipError) {
              console.error('Failed to reactivate VIP membership:', vipError);
              setMembership(null);
            } else {
              setMembership(vipMembership as WolfpackMembership);
            }
          } else {
            // Create new VIP membership
            const { data: vipMembership, error: vipError } = await supabase
              .from('wolfpack_memberships')
              .upsert({
                user_id: user.id,
                status: 'active',
                table_location: 'VIP',
                location_id: locationId || null,
                joined_at: new Date().toISOString(),
                last_active: new Date().toISOString()
              }, {
                onConflict: 'user_id',
                ignoreDuplicates: false
              })
              .select()
              .single();

            if (vipError) {
              console.error('Failed to create VIP membership:', vipError);
              setMembership(null);
            } else {
              setMembership(vipMembership as WolfpackMembership);
            }
          }
        } catch (vipErr) {
          console.error('VIP membership handling error:', vipErr);
          setMembership(null);
        }
      } else {
        setMembership(null);
      }
      
    } catch (err) {
      const error = err as SupabaseError;
      console.error('🚨 WOLFPACK MEMBERSHIP ERROR:', error);
      
      let userMessage = 'Failed to check membership';
      switch (error?.code) {
        case 'PGRST301':
          userMessage = 'Session expired. Please log in again.';
          break;
        case '42P01':
          userMessage = 'Database configuration error';
          break;
        case 'PGRST204':
          userMessage = 'Permission denied';
          break;
        default:
          userMessage = error?.message || 'Unknown error occurred';
      }
      
      setError(userMessage);
      setMembership(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Simple join function (backward compatible)
  const joinPack = async (tableLocation?: string) => {
    if (!user) {
      setError('You must be logged in to join the Wolf Pack');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const supabase = getSupabaseBrowserClient();
      
      // UPSERT membership to prevent conflicts
      const { error: upsertError } = await supabase
        .from('wolfpack_memberships')
        .upsert({
          user_id: user.id,
          status: 'active',
          joined_at: new Date().toISOString(),
          last_active: new Date().toISOString(),
          location_id: locationId || '550e8400-e29b-41d4-a716-446655440000', // Default location
          table_location: tableLocation || null
        }, {
          onConflict: 'user_id'
        });

      if (upsertError) {
        // If foreign key error, just use the default location
        if (upsertError.code === '23503') {
          console.warn('Foreign key constraint error, using default location');
          // Try again with guaranteed valid location
          const { error: retryError } = await supabase
            .from('wolfpack_memberships')
            .upsert({
              user_id: user.id,
              status: 'active',
              joined_at: new Date().toISOString(),
              last_active: new Date().toISOString(),
              location_id: '550e8400-e29b-41d4-a716-446655440000', // Force default
              table_location: tableLocation || null
            }, {
              onConflict: 'user_id'
            });
          
          if (retryError) throw retryError;
        } else {
          throw upsertError;
        }
      }

      // Refresh membership data
      await checkMembership();
    } catch (err) {
      console.error('Error joining pack:', err);
      setError(err instanceof Error ? err.message : 'Failed to join pack');
    } finally {
      setIsLoading(false);
    }
  };

  // Simple leave function (backward compatible)
  const leavePack = async () => {
    if (!user) {
      setError('You must be logged in');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { error: updateError } = await supabase
        .from('wolfpack_memberships')
        .update({
          status: 'inactive',
          last_active: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (updateError) throw updateError;
      setMembership(null);
    } catch (err) {
      console.error('Error leaving pack:', err);
      setError(err instanceof Error ? err.message : 'Failed to leave pack');
    } finally {
      setIsLoading(false);
    }
  };

  // Comprehensive join function
  const joinWolfPack = async (locationId?: string, tableLocation?: string): Promise<boolean> => {
    if (!user) {
      setError('Not authenticated');
      return false;
    }

    try {
      setError(null);
      
      const { data: existingMembership, error: checkError } = await supabase
        .from('wolfpack_memberships')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      let membershipData;

      if (existingMembership) {
        // Reactivate existing membership
        const { data, error } = await supabase
          .from('wolfpack_memberships')
          .update({
            status: 'active',
            last_active: new Date().toISOString(),
            table_location: tableLocation || existingMembership.table_location,
            location_id: locationId || existingMembership.location_id
          })
          .eq('id', existingMembership.id)
          .select()
          .single();

        if (error) throw error;
        membershipData = data;
      } else {
        // Create new membership
        const { data, error } = await supabase
          .from('wolfpack_memberships')
          .insert({
            user_id: user.id,
            status: 'active',
            table_location: tableLocation || null,
            location_id: locationId || null,
            joined_at: new Date().toISOString(),
            last_active: new Date().toISOString()
          })
          .select()
          .single();

        if (error) throw error;
        membershipData = data;
      }

      setMembership(membershipData as WolfpackMembership);
      return true;
      
    } catch (err) {
      const error = err as SupabaseError;
      console.error('Failed to join Wolf Pack:', error);
      setError('Failed to join Wolf Pack');
      return false;
    }
  };

  // Comprehensive leave function
  const leaveWolfPack = async (): Promise<boolean> => {
    if (!user || !membership) {
      setError('No active membership');
      return false;
    }

    try {
      setError(null);
      
      const { error } = await supabase
        .from('wolfpack_memberships')
        .update({
          status: 'inactive',
          last_active: new Date().toISOString()
        })
        .eq('id', membership.id);

      if (error) throw error;
      setMembership(null);
      return true;
      
    } catch (err) {
      const error = err as SupabaseError;
      console.error('Failed to leave Wolf Pack:', error);
      setError('Failed to leave Wolf Pack');
      return false;
    }
  };

  const debugMembership = async () => {
    if (!user) return { error: 'Not authenticated' };
    return debugWolfPackMembership(user.id, locationId);
  };

  // Check membership when user or location changes
  useEffect(() => {
    checkMembership();
  }, [user, locationId]);

  // Subscribe to membership changes (realtime from useSimpleWolfpack)
  useEffect(() => {
    if (!user) return;

    const subscription = supabase
      .channel('wolfpack_membership_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wolfpack_memberships',
          filter: `user_id=eq.${user.id}`
        },
        (payload: RealtimePayload) => {
          console.log('Membership change:', payload);
          checkMembership();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const isInPack = !!membership && membership.status === 'active';
  const isActive = isInPack;

  return {
    // Simple interface (backward compatible)
    isInPack,
    isLoading,
    error,
    joinPack,
    leavePack,
    
    // Comprehensive interface
    membership,
    isActive,
    checkMembership,
    joinWolfPack,
    leaveWolfPack,
    debugMembership
  };
}
