// lib/types/adapters.ts
// Type adapters to handle null/undefined mismatches between database and frontend

import type { Database } from '@/lib/database.types';

// Database types (with null)
type DatabaseUser = Database['public']['Tables']['users']['Row'];
type DatabaseWolfpackMember = Database['public']['Views']['wolfpack_memberships']['Row'];
type DatabaseLocation = Database['public']['Tables']['locations']['Row'];

// Frontend types (with undefined)
export interface FrontendUser {
  id: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  phone?: string;
  role?: string;
  created_at: string;
  updated_at: string;
}

export interface FrontendWolfpackMembership {
  id: string;
  user_id: string;
  location_id: string;
  status: string;
  display_name?: string;
  emoji?: string;
  current_vibe?: string;
  favorite_drink?: string;
  looking_for?: string;
  instagram_handle?: string;
  table_location?: string;
  joined_at: string;
  last_active?: string;
  is_visible: boolean;
  allow_messages: boolean;
  user?: FrontendUser;
  location?: FrontendLocation;
}

export interface FrontendLocation {
  id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  latitude: number;
  longitude: number;
  radius_miles?: number;
  created_at: string;
}

export interface FrontendWolfChatMessage {
  id: string;
  session_id: string;
  user_id: string;
  display_name: string;
  avatar_url?: string;
  content: string;
  message_type: 'text' | 'image' | 'dj_broadcast';
  image_url?: string;
  created_at: string;
  is_flagged: boolean;
  reactions?: Array<{
    id: string;
    user_id: string;
    emoji: string;
    created_at: string;
  }>;
}

// Utility function to convert null to undefined
function nullToUndefined<T>(value: T | null): T | undefined {
  return value === null ? undefined : value;
}

// User adapter
export function adaptUserType(dbUser: DatabaseUser): FrontendUser {
  return {
    id: dbUser.id,
    email: nullToUndefined(dbUser.email),
    first_name: nullToUndefined(dbUser.first_name),
    last_name: nullToUndefined(dbUser.last_name),
    avatar_url: nullToUndefined(dbUser.avatar_url),
    phone: nullToUndefined(dbUser.phone),
    role: nullToUndefined(dbUser.role),
    created_at: dbUser.created_at,
    updated_at: dbUser.updated_at,
  };
}

// Wolfpack membership adapter
export function adaptWolfpackMembership(dbMembership: DatabaseWolfpackMember): FrontendWolfpackMembership {
  return {
    id: dbMembership.id,
    user_id: dbMembership.user_id,
    location_id: dbMembership.location_id,
    status: dbMembership.status,
    display_name: nullToUndefined(dbMembership.display_name),
    emoji: nullToUndefined(dbMembership.emoji),
    current_vibe: nullToUndefined(dbMembership.current_vibe),
    favorite_drink: nullToUndefined(dbMembership.favorite_drink),
    looking_for: nullToUndefined(dbMembership.looking_for),
    instagram_handle: nullToUndefined(dbMembership.instagram_handle),
    table_location: nullToUndefined(dbMembership.table_location),
    joined_at: dbMembership.joined_at,
    last_active: nullToUndefined(dbMembership.last_active),
    is_visible: dbMembership.is_visible ?? true,
    allow_messages: dbMembership.allow_messages ?? true,
    // Nested user data will be adapted if present
    user: dbMembership.user ? adaptUserType(dbMembership.user as any) : undefined,
    location: dbMembership.location ? adaptLocation(dbMembership.location as any) : undefined,
  };
}

// Location adapter
export function adaptLocation(dbLocation: DatabaseLocation): FrontendLocation {
  return {
    id: dbLocation.id,
    name: dbLocation.name,
    address: nullToUndefined(dbLocation.address),
    city: nullToUndefined(dbLocation.city),
    state: nullToUndefined(dbLocation.state),
    latitude: dbLocation.latitude,
    longitude: dbLocation.longitude,
    radius_miles: nullToUndefined(dbLocation.radius_miles),
    created_at: dbLocation.created_at,
  };
}

// Chat message adapter
export function adaptWolfChatMessage(dbMessage: any): FrontendWolfChatMessage {
  return {
    id: dbMessage.id,
    session_id: dbMessage.session_id,
    user_id: dbMessage.user_id,
    display_name: dbMessage.display_name,
    avatar_url: nullToUndefined(dbMessage.avatar_url),
    content: dbMessage.content,
    message_type: dbMessage.message_type,
    image_url: nullToUndefined(dbMessage.image_url),
    created_at: dbMessage.created_at,
    is_flagged: dbMessage.is_flagged ?? false,
    reactions: dbMessage.reactions?.map((reaction: any) => ({
      id: reaction.id,
      user_id: reaction.user_id,
      emoji: reaction.emoji,
      created_at: reaction.created_at,
    })) || [],
  };
}

// API Response adapter for consistency
export function adaptAPIResponse<T>(response: any): {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
} {
  return {
    success: response.success ?? true,
    data: response.data,
    error: response.error?.error || response.error,
    code: response.error?.code || response.code,
  };
}

// Generic array adapter
export function adaptArray<TDb, TFrontend>(
  dbArray: TDb[] | null | undefined,
  adapter: (item: TDb) => TFrontend
): TFrontend[] {
  if (!dbArray) return [];
  return dbArray.map(adapter);
}

// Pagination adapter
export function adaptPaginatedResponse<TDb, TFrontend>(
  response: any,
  adapter: (item: TDb) => TFrontend
): {
  data: TFrontend[];
  meta: {
    total_count: number;
    has_more: boolean;
    next_cursor?: string;
  };
} {
  return {
    data: adaptArray(response.data, adapter),
    meta: {
      total_count: response.meta?.total_count || 0,
      has_more: response.meta?.has_more || false,
      next_cursor: response.meta?.next_cursor,
    },
  };
}

// Type guards
export function isValidUser(user: any): user is FrontendUser {
  return user && typeof user.id === 'string' && typeof user.created_at === 'string';
}

export function isValidWolfpackMembership(membership: any): membership is FrontendWolfpackMembership {
  return membership && 
         typeof membership.id === 'string' && 
         typeof membership.user_id === 'string' && 
         typeof membership.location_id === 'string';
}

// Error type adapter
export function adaptError(error: any): {
  message: string;
  code?: string;
  details?: unknown;
} {
  if (typeof error === 'string') {
    return { message: error };
  }
  
  if (error?.error) {
    return {
      message: error.error,
      code: error.code,
      details: error.details,
    };
  }
  
  return {
    message: error?.message || 'An unexpected error occurred',
    code: error?.code,
    details: error?.details,
  };
}