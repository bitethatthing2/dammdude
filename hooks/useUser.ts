// lib/hooks/useUser.ts
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';

// Define full user type including database fields
export interface DatabaseUser {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  wolfpack_status: string | null;
  location_permissions_granted: boolean | null;
  is_permanent_pack_member: boolean | null;
  role: string | null;
  created_at: string;
  updated_at: string;
}

// Define auth user type for initial auth response
interface AuthUser {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
  app_metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

export function useUser() {
  const [user, setUser] = useState<DatabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Fetch full user data from database
  const fetchUserData = async (authUser: AuthUser) => {
    try {
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', authUser.id)
        .single();
      
      if (error) {
        console.error('Error fetching user data:', error);
        return null;
      }
      
      return userData as DatabaseUser;
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  };  useEffect(() => {
    // Get initial user
    supabase.auth.getUser().then(async ({ data }) => {
      const authUser = data.user as AuthUser | null;
      if (authUser) {
        const fullUser = await fetchUserData(authUser);
        setUser(fullUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        const authUser = session?.user ? {
          ...session.user,
          id: session.user.id,
          email: session.user.email,
          user_metadata: session.user.user_metadata,
          app_metadata: session.user.app_metadata
        } as AuthUser : null;
        
        if (authUser) {
          const fullUser = await fetchUserData(authUser);
          setUser(fullUser);
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase]);

  return { user, loading };
}
