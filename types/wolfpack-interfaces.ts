// types/wolfpack-interfaces.ts
// Consolidated interfaces from all wolfpack components and hooks
import { Database } from '@/lib/database.types';

export interface AuthUser {
  id: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
}

export interface SupabaseError {
  message?: string;
  code?: string;
  details?: string;
  hint?: string;
  stack?: string;
}

// Wolfpack membership interface matching the database schema
export interface WolfpackMembership {
  id: string;
  user_id: string;
  status: 'active' | 'inactive';
  table_location: string | null;
  joined_at: string | null;
  last_active: string | null;
  location_id: string | null;
}

// Wolf profile interface - unified from useWolfpackQuery
export interface WolfProfile {
  id?: string;
  user_id: string;
  display_name: string;
  wolf_emoji: string;
  bio?: string;
  favorite_drink?: string;
  vibe_status: string;
  profile_image_url?: string;
  instagram_handle?: string;
  looking_for?: string;
  is_visible: boolean;
  allow_messages: boolean;
  phone?: string;
}

// Location interface - unified from GeolocationActivation
export interface Location {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string | null;
  radius_miles: number | null;
  city?: string | null;
  state?: string | null;
}

// Extended membership with profile data
export interface WolfpackMembershipWithProfile {
  id: string;
  user_id: string;
  status: string;
  joined_at: string;
  location_id: string;
  table_location?: string;
  user: {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
    wolf_profile?: WolfProfile;
  };
  locations?: Location;
}

// Geolocation state
export interface GeolocationState {
  permission: 'prompt' | 'granted' | 'denied';
  position: GeolocationPosition | null;
  error: string | null;
  isLoading: boolean;
}

// Wolfpack invitation
export interface WolfPackInvitation {
  show: boolean;
  location: Location | null;
  distance: number;
}

// Debug result interface
export interface DebugResult {
  authWorking?: boolean;
  tableAccessible?: boolean;
  totalMemberships?: number;
  userMemberships?: number;
  errors?: {
    authError?: SupabaseError;
    tableError?: SupabaseError;
    countError?: SupabaseError;
    userError?: SupabaseError;
  };
  error?: unknown;
}

// Realtime payload interface
export interface RealtimePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: Record<string, unknown>;
  old: Record<string, unknown>;
  errors: unknown[] | null;
}

// Wolfpack status types
export type WolfpackStatusType = 'loading' | 'not_member' | 'pending' | 'active' | 'inactive' | 'suspended';
export type LocationStatus = 'loading' | 'granted' | 'denied' | 'not_requested';

// Wolfpack access status
export interface WolfpackStatus {
  isWolfpackMember: boolean;
  isLocationVerified: boolean;
  isLoading: boolean;
  isChecking: boolean;
  isMember: boolean;
}

// Default wolf profile factory
export const createDefaultWolfProfile = (user: {
  id: string;
  first_name?: string;
  avatar_url?: string;
}): WolfProfile => ({
  user_id: user.id,
  display_name: user.first_name || 'Anonymous Wolf',
  wolf_emoji: '🐺',
  vibe_status: 'Just joined the pack!',
  profile_image_url: user.avatar_url,
  is_visible: true,
  allow_messages: true,
  bio: '',
});

// API Request/Response types for wolfpack-client.ts
export interface JoinPackParams {
  location_id: string;
  display_name: string;
  wolf_emoji?: string;
  vibe_status?: string;
  bio?: string;
}

export interface JoinPackResponse {
  success: boolean;
  error?: string;
  data?: {
    user_id: string;
    wolf_profile_id: string;
    status: string;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  error?: string;
  data?: T;
}

// Use actual Supabase types for wolfpack members
export type WolfpackMemberRow = Database['public']['Tables']['wolfpack_members_unified']['Row'];
export type WolfpackMemberInsert = Database['public']['Tables']['wolfpack_members_unified']['Insert'];
export type WolfpackMemberUpdate = Database['public']['Tables']['wolfpack_members_unified']['Update'];

// Map to our component interface for backward compatibility
export interface WolfpackMemberProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  wolf_emoji: string | null; // Maps to 'emoji' in database
  vibe_status: string | null; // Maps to 'current_vibe' in database
  bio?: string | null;
  is_visible?: boolean; // Not in database, will be handled at app level
  allow_messages?: boolean; // Not in database, will be handled at app level
  location_permissions_granted?: boolean;
  last_active?: string | null;
  avatar_url?: string | null;
  instagram_handle?: string | null;
  looking_for?: string | null;
  favorite_drink?: string | null;
  location_id?: string | null;
  status?: string | null;
  joined_at?: string;
}

export interface LocationVerificationResult {
  isValid: boolean;
  error?: string;
  location?: DetectedLocation;
}

export interface DetectedLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  distance?: number;
}

// Helper function to transform data
export const transformMembershipData = (membership: unknown): WolfpackMembershipWithProfile => {
  const typedMembership = membership as WolfpackMembershipWithProfile;
  if (typedMembership.user && !typedMembership.user.wolf_profile) {
    typedMembership.user.wolf_profile = createDefaultWolfProfile(typedMembership.user);
  }
  return typedMembership;
};
