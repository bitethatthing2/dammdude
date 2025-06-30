// lib/types/wolfpack-strict.ts
// Strict TypeScript types with no 'any' usage

// =============================================================================
// CORE ENUM-LIKE TYPES
// =============================================================================

export type WolfpackStatusValue = 'pending' | 'active' | 'inactive' | 'suspended';
export type UserRole = 'admin' | 'bartender' | 'dj' | 'user';
export type WolfpackTier = 'basic' | 'premium' | 'vip' | 'permanent';
export type MembershipStatus = 'active' | 'inactive' | 'suspended';
export type MessageType = 'text' | 'image' | 'dj_broadcast' | 'system';
export type InteractionType = 'wink' | 'message' | 'block' | 'like' | 'super_like' | 'report' | 'view_profile';

// =============================================================================
// DATABASE SCHEMA TYPES
// =============================================================================

export interface DatabaseUser {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  avatar_url: string | null;
  profile_image_url: string | null;
  role: UserRole | null;
  location_id: string | null;
  wolfpack_status: WolfpackStatusValue | null;
  wolfpack_joined_at: string | null;
  wolfpack_tier: WolfpackTier | null;
  is_permanent_pack_member: boolean | null;
  is_wolfpack_member: boolean | null;
  location_permissions_granted: boolean | null;
  is_online: boolean | null;
  last_activity: string | null;
  auth_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface DatabaseLocation {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  latitude: number;
  longitude: number;
  radius_miles: number | null;
  is_active: boolean | null;
  timezone: string | null;
  hours: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface DatabaseWolfPackMember {
  id: string;
  user_id: string;
  location_id: string;
  status: MembershipStatus;
  last_activity: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface DatabaseChatMessage {
  id: string;
  session_id: string;
  user_id: string | null;
  display_name: string;
  avatar_url: string | null;
  content: string;
  message_type: MessageType;
  image_url: string | null;
  created_at: string | null;
  edited_at: string | null;
  is_flagged: boolean | null;
  is_deleted: boolean | null;
}

export interface DatabaseInteraction {
  id: string;
  sender_id: string;
  receiver_id: string;
  interaction_type: InteractionType;
  location_id: string | null;
  message_content: string | null;
  metadata: Record<string, unknown> | null;
  status: 'active' | 'deleted' | 'expired';
  read_at: string | null;
  expires_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

// =============================================================================
// FRONTEND INTERFACE TYPES
// =============================================================================

export interface WolfpackStatusType {
  isActive: boolean;
  isPending: boolean;
  isInactive: boolean;
  isSuspended: boolean;
  status: WolfpackStatusValue | null;
}

export interface LocationStatus {
  isAtLocation: boolean;
  isNearLocation: boolean;
  distanceFromLocation: number | null;
  locationId: string | null;
  locationName: string | null;
}

export interface UserProfile {
  id: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  role: UserRole | null;
  tier: WolfpackTier | null;
  joinedAt: string | null;
}

export interface WolfpackStats {
  messageCount: number;
  memberCount: number;
  onlineMembers: number;
}

export interface WolfChatMessage {
  id: string;
  session_id: string;
  user_id: string;
  display_name: string;
  avatar_url?: string;
  content: string;
  message_type: MessageType;
  image_url?: string;
  created_at: string;
  is_flagged: boolean;
  reactions?: MessageReaction[];
}

export interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

export interface WolfPackMember {
  id: string;
  user_id: string;
  location_id: string | null;
  status: MembershipStatus;
  joined_at: string;
  display_name?: string;
  avatar_url?: string;
  last_activity?: string;
  is_online?: boolean;
}

// =============================================================================
// SPATIAL CHAT TYPES
// =============================================================================

export interface SpatialMember {
  id: string;
  display_name: string;
  avatar_url: string;
  role: UserRole | 'current';
  wolfpack_status: string;
  is_online: boolean;
  position: { x: string; y: string };
}

export interface InteractionPopup {
  member: SpatialMember;
  position: { left: string; top: string };
  show: boolean;
}

export interface ToastMessage {
  show: boolean;
  message: string;
}

// =============================================================================
// HOOK RETURN TYPES
// =============================================================================

export interface WolfpackAccessReturn {
  // Core state
  isMember: boolean;
  isLoading: boolean;
  error: string | null;
  wolfpackStatus: WolfpackStatusType;
  locationStatus: LocationStatus;
  locationName: string | null;
  hasLocationPermission: boolean;
  canJoinWolfpack: boolean;
  canCheckout: boolean;
  userProfile: UserProfile | null;
  lastChecked: string | null;
  memberCount: number;
  
  // Actions
  refreshData: () => Promise<void>;
  
  // Derived state for backwards compatibility
  isInPack: boolean;
  
  // Location helpers
  userLocation: { latitude: number; longitude: number } | null;
  getCurrentLocation: () => Promise<{ latitude: number; longitude: number } | null>;
  
  // Permission helpers
  checkLocationPermission: () => Promise<boolean>;
}

export interface ConsistentWolfpackAccess {
  isMember: boolean;
  isLoading: boolean;
  locationName: string | null;
  error?: string | null;
  canCheckout?: boolean;
  wolfpackStatus?: WolfpackStatusValue | null;
  hasLocationPermission?: boolean;
  refreshData?: () => Promise<void>;
}

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

export interface WolfpackError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

export interface GeolocationCoordinates {
  latitude: number;
  longitude: number;
}

export interface SessionConfig {
  sessionId: string | null;
  locationId: string | null;
  isActive: boolean;
}

// =============================================================================
// CONSTANTS
// =============================================================================

export const WOLFPACK_ROLES = {
  ADMIN: 'admin',
  BARTENDER: 'bartender',
  DJ: 'dj',
  USER: 'user'
} as const;

export const WOLFPACK_STATUSES = {
  PENDING: 'pending',
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended'
} as const;

export const INTERACTION_TYPES = {
  WINK: 'wink',
  MESSAGE: 'message',
  BLOCK: 'block',
  LIKE: 'like',
  SUPER_LIKE: 'super_like',
  REPORT: 'report',
  VIEW_PROFILE: 'view_profile'
} as const;

export const MESSAGE_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  DJ_BROADCAST: 'dj_broadcast',
  SYSTEM: 'system'
} as const;

// =============================================================================
// TYPE GUARDS
// =============================================================================

export function isWolfpackStatus(value: string): value is WolfpackStatusValue {
  return ['pending', 'active', 'inactive', 'suspended'].includes(value);
}

export function isUserRole(value: string): value is UserRole {
  return ['admin', 'bartender', 'dj', 'user'].includes(value);
}

export function isMessageType(value: string): value is MessageType {
  return ['text', 'image', 'dj_broadcast', 'system'].includes(value);
}

export function isInteractionType(value: string): value is InteractionType {
  return ['wink', 'message', 'block', 'like', 'super_like', 'report', 'view_profile'].includes(value);
}

// =============================================================================
// ADAPTER FUNCTIONS
// =============================================================================

export function adaptDatabaseUser(dbUser: DatabaseUser): UserProfile {
  return {
    id: dbUser.id,
    displayName: dbUser.display_name || 
      `${dbUser.first_name || ''} ${dbUser.last_name || ''}`.trim() || 
      dbUser.email.split('@')[0] || 'Wolf Member',
    avatarUrl: dbUser.profile_image_url || dbUser.avatar_url,
    role: dbUser.role,
    tier: dbUser.wolfpack_tier,
    joinedAt: dbUser.wolfpack_joined_at
  };
}

export function adaptDatabaseMember(
  dbMember: DatabaseWolfPackMember, 
  userInfo?: DatabaseUser
): WolfPackMember {
  return {
    id: dbMember.id,
    user_id: dbMember.user_id,
    location_id: dbMember.location_id,
    status: dbMember.status,
    joined_at: dbMember.created_at || new Date().toISOString(),
    display_name: userInfo ? adaptDatabaseUser(userInfo).displayName || undefined : undefined,
    avatar_url: userInfo?.profile_image_url || userInfo?.avatar_url || undefined,
    last_activity: dbMember.last_activity || undefined,
    is_online: userInfo?.is_online ?? false
  };
}

export default {
  WOLFPACK_ROLES,
  WOLFPACK_STATUSES,
  INTERACTION_TYPES,
  MESSAGE_TYPES,
  isWolfpackStatus,
  isUserRole,
  isMessageType,
  isInteractionType,
  adaptDatabaseUser,
  adaptDatabaseMember
};