// lib/types/order.ts

import { Database, Json } from '@/lib/database.types';

// Base types from Supabase
export type BartenderOrder = Database['public']['Tables']['bartender_orders']['Row'];
export type OrderInsert = Database['public']['Tables']['bartender_orders']['Insert'];
export type OrderUpdate = Database['public']['Tables']['bartender_orders']['Update'];

// Order status based on actual database constraint for bartender_orders
export type OrderStatus = 
  | 'pending'
  | 'accepted'
  | 'preparing'
  | 'ready'
  | 'delivered'
  | 'completed'
  | 'cancelled';

// Order type based on actual database constraint
export type OrderType = 
  | 'pickup'
  | 'table_delivery';

// Payment status based on actual database constraint
export type PaymentStatus = 
  | 'pending'
  | 'paid_at_bar'
  | 'added_to_tab';

// Add the Order type alias that components are expecting
export type Order = BartenderOrder;

// Modifier structure for customizations
export interface OrderItemModifier {
  id: string;
  name: string;
  price_adjustment?: number;
}

// Customization structure
export interface OrderItemCustomization {
  modifiers?: OrderItemModifier[];
  special_instructions?: string;
}

// Order Request type for creating new orders
export interface OrderRequest {
  table_id?: string;
  customer_id?: string;
  bartender_id?: string;
  tab_id?: string;
  location_id?: string;
  order_type?: OrderType;
  table_location?: string;
  items: Array<{
    menu_item_id: string;
    quantity: number;
    notes?: string;
    customizations?: OrderItemCustomization | null;
  }>;
  customer_notes?: string;
  estimated_time?: number;
  total_amount?: number;
}

// Order item structure (parsed from JSON)
export interface OrderItem {
  id: string;
  item_id: string;
  name: string;
  quantity: number;
  price: number;
  notes?: string;
  customizations?: OrderItemCustomization;
  subtotal?: number; // Added for cart compatibility
}

// Extended order type with parsed items
export interface OrderWithDetails extends Omit<BartenderOrder, 'items'> {
  items: OrderItem[];
  customer?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
  } | null;
  bartender?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
  } | null;
  location?: {
    id: string;
    name: string;
  } | null;
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
  payment_status?: PaymentStatus[];
}

// Utility functions for order data
export const parseOrderItems = (itemsJson: Json): OrderItem[] => {
  try {
    // Handle string JSON
    if (typeof itemsJson === 'string') {
      const parsed = JSON.parse(itemsJson);
      return Array.isArray(parsed) ? parsed : [];
    }
    
    // Handle array directly
    if (Array.isArray(itemsJson)) {
      return itemsJson.map(item => {
        // Type check to ensure item is an object
        if (typeof item !== 'object' || item === null) {
          return {
            id: '',
            item_id: '',
            name: '',
            quantity: 1,
            price: 0
          };
        }
        
        // Now TypeScript knows item is an object
        const orderItem = item as Record<string, unknown>;
        
        return {
          id: String(orderItem.id || ''),
          item_id: String(orderItem.item_id || orderItem.id || ''),
          name: String(orderItem.name || ''),
          quantity: Number(orderItem.quantity) || 1,
          price: Number(orderItem.price) || 0,
          notes: orderItem.notes ? String(orderItem.notes) : undefined,
          customizations: orderItem.customizations as OrderItemCustomization | undefined,
          subtotal: Number(orderItem.subtotal) || (Number(orderItem.price || 0) * Number(orderItem.quantity || 1))
        };
      });
    }
    
    // Handle object with items property
    if (itemsJson && typeof itemsJson === 'object' && !Array.isArray(itemsJson)) {
      const obj = itemsJson as Record<string, unknown>;
      if ('items' in obj) {
        return parseOrderItems(obj.items as Json);
      }
    }
    
    return [];
  } catch (error) {
    console.error('Error parsing order items:', error);
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
    'pending': 'Waiting for confirmation',
    'accepted': 'Order accepted',
    'preparing': 'Being prepared',
    'ready': 'Ready for pickup',
    'delivered': 'Delivered',
    'completed': 'Order completed',
    'cancelled': 'Order cancelled'
  };
  
  return displays[status || ''] || 'Unknown status';
};

export const getOrderStatusColor = (status: OrderStatus | string | null): string => {
  const colors: Record<string, string> = {
    'pending': 'bg-yellow-100 text-yellow-800',
    'accepted': 'bg-blue-100 text-blue-800',
    'preparing': 'bg-orange-100 text-orange-800',
    'ready': 'bg-green-100 text-green-800',
    'delivered': 'bg-purple-100 text-purple-800',
    'completed': 'bg-gray-100 text-gray-800',
    'cancelled': 'bg-red-100 text-red-800'
  };
  
  return colors[status || ''] || 'bg-gray-100 text-gray-800';
};

export const isOrderActive = (status: string | null): boolean => {
  const activeStatuses: OrderStatus[] = ['pending', 'accepted', 'preparing', 'ready'];
  return activeStatuses.includes(status as OrderStatus);
};

export const canCancelOrder = (status: string | null): boolean => {
  const cancellableStatuses: OrderStatus[] = ['pending', 'accepted'];
  return cancellableStatuses.includes(status as OrderStatus);
};

export const formatOrderNumber = (orderNumber: number): string => {
  return `#${orderNumber.toString().padStart(4, '0')}`;
};

// Type guards
export function isValidOrderStatus(status: string): status is OrderStatus {
  const validStatuses: OrderStatus[] = [
    'pending', 'accepted', 'preparing', 'ready', 
    'delivered', 'completed', 'cancelled'
  ];
  return validStatuses.includes(status as OrderStatus);
}

export function isValidOrderType(type: string): type is OrderType {
  const validTypes: OrderType[] = ['pickup', 'table_delivery'];
  return validTypes.includes(type as OrderType);
}

export function isValidPaymentStatus(status: string): status is PaymentStatus {
  const validStatuses: PaymentStatus[] = ['pending', 'paid_at_bar', 'added_to_tab'];
  return validStatuses.includes(status as PaymentStatus);
}

export function isOrderItem(item: unknown): item is OrderItem {
  return (
    typeof item === 'object' &&
    item !== null &&
    'id' in item &&
    'name' in item &&
    'quantity' in item &&
    'price' in item
  );
}

export function isOrder(order: unknown): order is Order {
  return (
    typeof order === 'object' &&
    order !== null &&
    'id' in order &&
    'order_number' in order &&
    'items' in order &&
    'total_amount' in order
  );
}

// Re-export types that might be used elsewhere
export type { Json } from '@/lib/database.types';
