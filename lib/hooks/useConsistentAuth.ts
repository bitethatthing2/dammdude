'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { AuthChangeEvent, Session, User as SupabaseUser } from '@supabase/supabase-js';

// Define the complete user type from database
export interface DatabaseUser {
  id: string;
  auth_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  wolfpack_status: 'active' | 'pending' | 'inactive' | 'suspended' | null;
  location_permissions_granted: boolean | null;
  is_permanent_pack_member: boolean | null;
  role: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  user: DatabaseUser | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

export function useConsistentAuth(): AuthState {
  const [user, setUser] = useState<DatabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch user data from database based on auth user
  const fetchDatabaseUser = async (authUser: SupabaseUser): Promise<DatabaseUser | null> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', authUser.id)
        .single();

      if (error) {
        console.error('Error fetching user data:', error);
        setError(new Error(error.message));
        return null;
      }

      return data as DatabaseUser;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch user data';
      console.error('Error fetching user:', errorMessage);
      setError(new Error(errorMessage));
      return null;
    }
  };

  // Refresh user data
  const refresh = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (authUser) {
        const dbUser = await fetchDatabaseUser(authUser);
        setUser(dbUser);
      } else {
        setUser(null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh user';
      console.error('Error refreshing user:', errorMessage);
      setError(new Error(errorMessage));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    // Get initial user
    const initializeAuth = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        
        if (mounted) {
          if (authUser) {
            const dbUser = await fetchDatabaseUser(authUser);
            setUser(dbUser);
          } else {
            setUser(null);
          }
          setLoading(false);
        }
      } catch (err) {
        if (mounted) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to initialize auth';
          console.error('Error initializing auth:', errorMessage);
          setError(new Error(errorMessage));
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        if (!mounted) return;

        console.log('Auth state changed:', event);
        
        if (session?.user) {
          const dbUser = await fetchDatabaseUser(session.user);
          setUser(dbUser);
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return { user, loading, error, refresh };
}