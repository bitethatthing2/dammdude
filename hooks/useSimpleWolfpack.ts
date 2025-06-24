import { useState, useEffect } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/AuthContext';

interface SimpleWolfpackStatus {
  isInPack: boolean;
  isLoading: boolean;
  error: string | null;
  joinPack: () => Promise<void>;
  leavePack: () => Promise<void>;
}

interface RealtimePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: Record<string, unknown>;
  old: Record<string, unknown>;
  errors: unknown[] | null;
}

export function useSimpleWolfpack(): SimpleWolfpackStatus {
  const { user } = useAuth();
  const [isInPack, setIsInPack] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check membership status
  const checkMembership = async () => {
    if (!user) {
      setIsInPack(false);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const supabase = getSupabaseBrowserClient();
      
      // Check wolfpack_memberships table (the new simplified table)
      const { data, error: queryError } = await supabase
        .from('wolfpack_memberships')
        .select('status')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (queryError && queryError.code !== 'PGRST116') {
        throw queryError;
      }

      setIsInPack(!!data);
    } catch (err) {
      console.error('Error checking membership:', err);
      setError(err instanceof Error ? err.message : 'Failed to check membership');
      setIsInPack(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Join the pack - uses UPSERT to prevent conflicts
  const joinPack = async () => {
    if (!user) {
      setError('You must be logged in to join the Wolf Pack');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const supabase = getSupabaseBrowserClient();
      
      // First, ensure the user exists in public.users
      // This handles cases where auth.users exists but public.users doesn't
      const { error: userError } = await supabase.rpc('ensure_user_exists', {
        p_user_id: user.id
      });

      if (userError) {
        console.warn('Error ensuring user exists:', userError);
        // Continue anyway - the join function will handle it
      }
      
      // UPSERT membership - this prevents 409 conflicts
      // Always ensure location_id is set to prevent null location errors
      const { error: upsertError } = await supabase
        .from('wolfpack_memberships')
        .upsert({
          user_id: user.id,
          status: 'active',
          joined_at: new Date().toISOString(),
          last_active: new Date().toISOString(),
          location_id: '550e8400-e29b-41d4-a716-446655440000' // Default location - always set this
        }, {
          onConflict: 'user_id'
        });

      if (upsertError) {
        // If it's a foreign key error, try using the RPC function
        if (upsertError.code === '23503') {
          const { data: rpcResult, error: rpcError } = await supabase.rpc('join_wolfpack_simple');
          
          if (rpcError) {
            throw rpcError;
          }
          
          if (rpcResult && !rpcResult.success) {
            throw new Error(rpcResult.error || 'Failed to join pack');
          }
        } else {
          throw upsertError;
        }
      }

      setIsInPack(true);
    } catch (err) {
      console.error('Error joining pack:', err);
      setError(err instanceof Error ? err.message : 'Failed to join pack');
    } finally {
      setIsLoading(false);
    }
  };

  // Leave the pack (set status to inactive)
  const leavePack = async () => {
    if (!user) {
      setError('You must be logged in');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const supabase = getSupabaseBrowserClient();
      
      // Update status to inactive
      const { error: updateError } = await supabase
        .from('wolfpack_memberships')
        .update({
          status: 'inactive',
          last_active: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (updateError) {
        throw updateError;
      }

      setIsInPack(false);
    } catch (err) {
      console.error('Error leaving pack:', err);
      setError(err instanceof Error ? err.message : 'Failed to leave pack');
    } finally {
      setIsLoading(false);
    }
  };

  // Check membership when user changes
  useEffect(() => {
    checkMembership();
  }, [user]);

  // Subscribe to membership changes
  useEffect(() => {
    if (!user) return;

    const supabase = getSupabaseBrowserClient();
    
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

  return {
    isInPack,
    isLoading,
    error,
    joinPack,
    leavePack
  };
}
