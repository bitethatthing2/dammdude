// Unified Wolfpack Types - Central source of truth
import type { Database } from '@/types/database.types';

// Base Wolfpack types from database
export type BartenderOrderRow = Database['public']['Tables']['bartender_orders']['Row'];
export type OrderInsert = Database['public']['Tables']['bartender_orders']['Insert'];
export type OrderUpdate = Database['public']['Tables']['bartender_orders']['Update'];

// Core Wolfpack Order Types
export interface WolfPackOrder extends BartenderOrderRow {
  items?: WolfPackOrderItem[];
  customer?: {
    id: string;
    name: string;
    email?: string;
  };
}

export interface WolfPackOrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  customizations?: ItemCustomization[];
  special_instructions?: string;
}

export interface ItemCustomization {
  type: string;
  value: string;
  price_modifier?: number;
}

// Cart and Order Management
export interface CartItem extends WolfPackOrderItem {
  category_id?: string;
  image_url?: string;
  description?: string;
}

export interface WolfPackOrderSummary {
  id: string;
  order_number: number;
  total_amount: number;
  status: string;
  created_at: string;
  items: WolfPackOrderItem[];
}

export interface WolfPackOrderRequest {
  customer_id?: string;
  location_id: string;
  items: CartItem[];
  total_amount: number;
  customer_notes?: string;
  payment_status: 'pending' | 'paid' | 'refunded';
  status: 'pending' | 'accepted' | 'preparing' | 'ready' | 'delivered' | 'completed' | 'cancelled';
}

// User and Membership Types
export interface WolfPackUser {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  display_name?: string;
  wolf_emoji?: string;
  is_wolfpack_member?: boolean;
  wolfpack_status?: 'active' | 'inactive' | 'pending' | 'banned';
  location_id?: string;
  avatar_url?: string;
  created_at: string;
}

// Location and Access Types
export interface WolfPackLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius_miles?: number;
  is_active?: boolean;
}

// Social and Content Types
export interface WolfPackVideo {
  id: string;
  user_id: string;
  title?: string;
  description?: string;
  video_url: string;
  thumbnail_url?: string;
  like_count?: number;
  comment_count?: number;
  created_at: string;
}

// Export aliases for backward compatibility
export type { WolfPackOrder as BartenderOrder };
export type { WolfPackOrderItem as OrderItem };
export type { WolfPackOrder as OrderWithDetails };
export type { WolfPackOrderSummary as OrderSummary };
export type { WolfPackOrderRequest as OrderRequest };
export type { ItemCustomization as OrderItemCustomization };