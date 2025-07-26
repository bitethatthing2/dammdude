// types/user.types.ts - Centralized user types

/**
 * Auth User - From Supabase Auth (auth.users table)
 */
export interface AuthUser {
  id: string; // This is the auth.users.id (auth_id in public.users)
  email: string;
  // ... other auth fields
}

/**
 * Public User Profile - From public.users table
 */
export interface PublicUser {
  id: string; // This is the public.users.id (used in all foreign keys)
  auth_id: string; // References auth.users.id
  email: string;
  first_name?: string;
  last_name?: string;
  display_name?: string;
  username?: string;
  avatar_url?: string;
  profile_image_url?: string;
  wolfpack_status?: string;
  wolf_emoji?: string;
  created_at?: string;
  updated_at?: string;
  // ... other profile fields
}

/**
 * Current User Context - Combines both for easy access
 */
export interface CurrentUser {
  authUser: AuthUser;
  publicUser: PublicUser;
}