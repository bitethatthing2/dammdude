// lib/hooks/useUser.ts
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';

// Define full user type including database fields - UPDATED to match your actual users table
export interface DatabaseUser {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  role: string | null;
  location_id: string | null; // ← Added this - exists in your DB
  created_at: string;
  updated_at: string;
  permissions: any | null;
  last_login: string | null;
  is_approved: boolean | null;
  password_hash: string | null;
  auth_id: string | null;
  deleted_at: string | null;
  sensitive_data_encrypted: any | null;
  status: string | null;
  blocked_at: string | null;
  blocked_by: string | null;
  block_reason: string | null;
  notes: string | null;
  avatar_id: string | null;
  wolfpack_status: string | null;
  wolfpack_joined_at: string | null;
  wolfpack_tier: string | null;
  location_permissions_granted: boolean | null;
  phone: string | null;
  phone_verified: boolean | null;
  phone_verification_code: string | null;
  phone_verification_sent_at: string | null;
  privacy_settings: any | null;
  notification_preferences: any | null;
  is_permanent_pack_member: boolean | null;
  permanent_member_since: string | null;
  permanent_member_benefits: any | null;
  permanent_member_notes: string | null;
  is_wolfpack_member: boolean | null; // This is generated
  session_id: string | null;
  last_activity: string | null;
  is_online: boolean | null;
  display_name: string | null;
  wolf_emoji: string | null;
  bio: string | null;
  favorite_drink: string | null;
  vibe_status: string | null;
  profile_pic_url: string | null;
  instagram_handle: string | null;
  favorite_song: string | null;
  looking_for: string | null;
  is_profile_visible: boolean | null;
  profile_last_seen_at: string | null;
  custom_avatar_id: string | null;
  gender: string | null;
  pronouns: string | null;
  daily_customization: any | null;
  profile_image_url: string | null;
  allow_messages: boolean | null;
  favorite_bartender: string | null;
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
  };

  useEffect(() => {
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