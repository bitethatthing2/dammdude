import { Database } from "@/types/database.types";

// =============================================================================
// SHARED TYPES FOR WOLFPACK SERVICES
// =============================================================================

export type UserProfile = Database["public"]["Tables"]["users"]["Row"];
export type WolfpackVideo = Database["public"]["Tables"]["wolfpack_videos"]["Row"];
export type WolfpackComment = Database["public"]["Tables"]["wolfpack_comments"]["Row"];
export type WolfpackLike = Database["public"]["Tables"]["wolfpack_post_likes"]["Row"];
export type DJEvent = Database["public"]["Tables"]["dj_events"]["Row"];
export type DJBroadcast = Database["public"]["Tables"]["dj_broadcasts"]["Row"];

// Extended types with relations
export interface EnrichedVideo extends WolfpackVideo {
  user?: Pick<UserProfile, "id" | "first_name" | "last_name" | "avatar_url" | "display_name">;
  like_count?: number;
  comment_count?: number;
  user_liked?: boolean;
}

export interface EnrichedComment extends WolfpackComment {
  user?: Pick<UserProfile, "id" | "first_name" | "last_name" | "avatar_url" | "display_name">;
  replies?: EnrichedComment[];
  user_liked?: boolean;
}

export interface ActiveEvent extends DJEvent {
  dj?: {
    display_name?: string;
    first_name?: string;
    last_name?: string;
  };
}

export interface PackMember extends UserProfile {
  distance?: number;
  is_online?: boolean;
  last_seen?: string;
}

export interface LocationStats {
  memberCount: number;
  activeEvents: number;
  energyLevel: 'low' | 'medium' | 'high';
  lastActivity?: string;
}

// Feed types
export interface FeedItem {
  id: string;
  user_id: string;
  username: string;
  avatar_url?: string;
  caption: string;
  video_url: string | null;
  thumbnail_url?: string;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  music_name?: string;
  hashtags?: string[];
  created_at: string;
  user?: {
    id: string;
    username?: string;
    display_name?: string;
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
    profile_image_url?: string;
    wolf_emoji?: string;
  };
}

export interface FetchFeedResponse {
  items: FeedItem[];
  totalItems: number;
  hasMore: boolean;
}

// Location types
export interface LocationInfo {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number; // meters
}

export interface GeolocationResult {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: number;
}

// Social types
export interface SocialStats {
  followers: number;
  following: number;
  posts: number;
  likes: number;
}

export interface CommentReaction {
  id: string;
  comment_id: string;
  user_id: string;
  reaction_type: 'like' | 'love' | 'laugh' | 'angry';
  created_at: string;
}

// Service response types
export interface ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface SortOptions {
  field: string;
  ascending?: boolean;
}

// Authentication types
export interface WolfpackUser {
  id: string;
  auth_id: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  display_name?: string;
  avatar_url?: string;
  is_vip?: boolean;
  location_bypass?: boolean;
  created_at: string;
}

// Error types
export interface WolfpackError extends Error {
  code?: string;
  details?: any;
  statusCode?: number;
}

// Subscription types
export interface SubscriptionOptions {
  event?: string;
  table?: string;
  filter?: Record<string, any>;
  schema?: string;
}

// Constants
export const WOLFPACK_TABLES = {
  VIDEOS: 'wolfpack_videos',
  COMMENTS: 'wolfpack_comments',
  LIKES: 'wolfpack_post_likes',
  FOLLOWS: 'wolfpack_follows',
  USERS: 'users',
  DJ_EVENTS: 'dj_events',
  DJ_BROADCASTS: 'dj_broadcasts',
  MESSAGES: 'messages',
  NOTIFICATIONS: 'notifications'
} as const;

export const SIDE_HUSTLE_LOCATIONS: LocationInfo[] = [
  {
    id: 'salem-main',
    name: 'Side Hustle Bar - Salem',
    latitude: 42.5195,
    longitude: -70.8967,
    radius: 150
  }
];

export const SUBSCRIPTION_EVENTS = {
  INSERT: 'INSERT',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE'
} as const;

export const NOTIFICATION_TYPES = {
  LIKE: 'like',
  COMMENT: 'comment',
  FOLLOW: 'follow',
  DJ_EVENT: 'dj_event',
  BROADCAST: 'broadcast'
} as const;