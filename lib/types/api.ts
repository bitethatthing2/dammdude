import { Order, OrderItem } from './order';
import { MenuItem, MenuCategory } from './menu';

// Generic API response types
export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: unknown;
}

// Database table types
export interface FcmToken {
  token: string;
  device_info?: {
    platform?: string;
    os_version?: string;
    browser?: string;
    device_model?: string;
    [key: string]: unknown;
  };
  created_at: string;
  updated_at: string;
}

export interface SentNotification {
  id: string;
  title: string;
  body: string;
  image_url?: string;
  action_url?: string;
  topic?: string;
  platform?: string;
  android_config?: Record<string, unknown>;
  ios_config?: Record<string, unknown>;
  web_config?: Record<string, unknown>;
  recipient_count: number;
  delivered_count?: number;
  opened_count?: number;
  created_at: string;
  created_by?: string;
  metadata?: Record<string, unknown>;
}

// Supabase query response types
export interface OrdersResponse {
  id: string;
  table_id: string;
  location: string;
  status: 'pending' | 'in_progress' | 'completed';
  items: OrderItem[];
  inserted_at: string;
}

// Edge function request/response types
export interface SendNotificationRequest {
  title: string;
  body: string;
  token?: string;
  topic?: string;
  sendToAll?: boolean;
  orderId?: string;
  link?: string;
  linkButtonText?: string;
  image?: string;
  icon?: string;
  actionButton?: string;
  actionButtonText?: string;
  androidConfig?: {
    channelId?: string;
    priority?: string;
    [key: string]: unknown;
  };
  iosConfig?: {
    sound?: string;
    badge?: number;
    [key: string]: unknown;
  };
  webConfig?: {
    [key: string]: unknown;
  };
}

export interface SendNotificationResponse {
  success: boolean;
  messageId?: string;
  recipients?: number;
  errors?: {
    code: string;
    message: string;
  }[];
}

// Realtime subscription types
export interface RealtimePayload<T> {
  schema: string;
  table: string;
  commit_timestamp: string;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: T;
  old: T | null;
  errors: null | unknown;
}

export type OrderRealtimePayload = RealtimePayload<Order>;
export type FcmTokenRealtimePayload = RealtimePayload<FcmToken>;
export type NotificationRealtimePayload = RealtimePayload<SentNotification>;