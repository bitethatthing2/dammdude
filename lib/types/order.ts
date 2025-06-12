import { CartItem, CartItemModifier } from './menu'; // Add this line
import { Database } from '../supabase'; // Update the path if your supabase types are in the parent directory

// Base types from Supabase
export type BartenderOrder = Database['public']['Tables']['bartender_orders']['Row'];
export type OrderInsert = Database['public']['Tables']['bartender_orders']['Insert'];
export type OrderUpdate = Database['public']['Tables']['bartender_orders']['Update'];

// Order status enum for type safety
export enum OrderStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  PREPARING = 'preparing',
  READY = 'ready',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired'
}

// Order type enum
export enum OrderType {
  PICKUP = 'pickup',
  DINE_IN = 'dine_in',
  TABLE_SERVICE = 'table_service'
}

// Payment status enum
export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  REFUNDED = 'refunded',
  FAILED = 'failed'
}

// Order item structure (parsed from JSON)
export interface OrderItem {
  id: string;
  item_id: string;
  name: string;
  quantity: number;
  price: number;
  notes?: string;
  customizations?: {
    modifiers?: Array<{
      id: string;
      name: string;
      price_adjustment?: number;
    }>;
    special_instructions?: string;
  };
}

// Extended order type with parsed items
export interface OrderWithDetails extends Omit<BartenderOrder, 'items'> {
  items: OrderItem[];
  customer?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
  };
  bartender?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
  };
}

// Real-time update payload types
export interface OrderRealtimePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: BartenderOrder;
  old: BartenderOrder;
}

// Order summary for dashboard/list views
export interface OrderSummary {
  id: string;
  order_number: number;
  status: string | null;
  total_amount: number;
  created_at: string | null;
  customer_name?: string;
  item_count: number;
}

// Order filters for queries
export interface OrderFilters {
  status?: OrderStatus[];
  order_type?: OrderType[];
  date_from?: Date;
  date_to?: Date;
  customer_id?: string;
  bartender_id?: string;
  location_id?: string;
}

// Utility functions for order data
export const parseOrderItems = (itemsJson: string | object): OrderItem[] => {
  try {
    if (typeof itemsJson === 'string') {
      return JSON.parse(itemsJson);
    }
    return itemsJson as OrderItem[];
  } catch {
    return [];
  }
};

export const calculateOrderTotal = (items: OrderItem[]): number => {
  return items.reduce((total, item) => {
    let itemTotal = item.price * item.quantity;
    
    // Add modifier prices
    if (item.customizations?.modifiers) {
      item.customizations.modifiers.forEach(modifier => {
        if (modifier.price_adjustment) {
          itemTotal += modifier.price_adjustment * item.quantity;
        }
      });
    }
    
    return total + itemTotal;
  }, 0);
};

export const getOrderStatusDisplay = (status: string | null): string => {
  const displays: Record<string, string> = {
    [OrderStatus.PENDING]: 'Waiting for confirmation',
    [OrderStatus.ACCEPTED]: 'Order accepted',
    [OrderStatus.PREPARING]: 'Being prepared',
    [OrderStatus.READY]: 'Ready for pickup',
    [OrderStatus.COMPLETED]: 'Order completed',
    [OrderStatus.CANCELLED]: 'Order cancelled',
    [OrderStatus.EXPIRED]: 'Order expired'
  };
  
  return displays[status || ''] || 'Unknown status';
};

export const isOrderActive = (status: string | null): boolean => {
  return ![OrderStatus.COMPLETED, OrderStatus.CANCELLED, OrderStatus.EXPIRED].includes(status as OrderStatus);
};

export const canCancelOrder = (status: string | null): boolean => {
  return [OrderStatus.PENDING, OrderStatus.ACCEPTED].includes(status as OrderStatus);
};