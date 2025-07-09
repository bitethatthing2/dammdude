// types/wolfpack-unified.ts
// Single source of truth for all Wolf Pack ordering types

import { Database, Json } from '@/types/database.types';

// Base types from Supabase - using bartender_orders table as it exists in schema
export type BartenderOrderRow = Database['public']['Tables']['bartender_orders']['Row'];
export type OrderInsert = Database['public']['Tables']['bartender_orders']['Insert'];
export type OrderUpdate = Database['public']['Tables']['bartender_orders']['Update'];

// Unified order status enum
export type OrderStatus = 
  | 'pending'
  | 'accepted'
  | 'preparing'
  | 'ready'
  | 'delivered'
  | 'completed'
  | 'cancelled';

// Order type enum
export type OrderType = 
  | 'pickup'
  | 'table_delivery';

// Payment status enum
export type PaymentStatus = 
  | 'pending'
  | 'paid_at_bar'
  | 'added_to_tab';

// Unified customization structure that handles all modifier patterns
export interface ItemCustomization {
  // Meat selection with price adjustment
  meat?: {
    id: string;
    name: string;
    price_adjustment: number;
  } | null;
  
  // Sauce selections with price adjustments
  sauces?: Array<{
    id: string;
    name: string;
    price_adjustment: number;
  }>;
  
  // Generic modifiers for future extensibility
  modifiers?: Array<{
    id: string;
    name: string;
    category?: string;
    price_adjustment?: number;
  }>;
  
  // Special instructions
  special_instructions?: string;
}

// Unified OrderItem interface - single source of truth
export interface WolfPackOrderItem {
  id: string;
  item_id: string;                    // For database compatibility
  name: string;
  quantity: number;
  price: number;
  image_url?: string;                 // For display purposes
  notes?: string;                     // Individual item notes
  customizations?: ItemCustomization; // Unified customization structure
  subtotal: number;                   // Calculated total including customizations
}

// Cart uses the same structure as OrderItem
export type CartItem = WolfPackOrderItem;

// Extended order interface with customer/bartender details
export interface WolfPackOrder {
  id: string;
  order_number?: number;
  customer_id: string;
  bartender_id?: string | null;
  status: OrderStatus;
  total_amount: number;
  items: WolfPackOrderItem[];
  notes?: string | null;
  customer_notes?: string | null;
  bartender_notes?: string | null;
  created_at: string;
  updated_at?: string;
  completed_at?: string | null;
  table_location?: string;
  tab_id?: string;
  location_id?: string;
  order_type?: OrderType;
  payment_status?: PaymentStatus;
  customer?: {
    id: string;
    first_name?: string | null;
    last_name?: string | null;
    email?: string;
  } | null;
  bartender?: {
    id: string;
    first_name?: string | null;
    last_name?: string | null;
    email?: string;
  } | null;
  location?: {
    id: string;
    name: string;
  } | null;
}

// Order request for creating new orders
export interface WolfPackOrderRequest {
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
    customizations?: ItemCustomization | null;
  }>;
  customer_notes?: string;
  estimated_time?: number;
  total_amount?: number;
}

// Order summary for list views
export interface WolfPackOrderSummary {
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

// Utility Functions

/**
 * Calculate the total price for a single order item including all customizations
 */
export const calculateItemTotal = (item: WolfPackOrderItem): number => {
  let total = item.price * item.quantity;
  
  if (item.customizations?.meat?.price_adjustment) {
    total += item.customizations.meat.price_adjustment * item.quantity;
  }
  
  if (item.customizations?.sauces) {
    total += item.customizations.sauces.reduce(
      (sum, sauce) => sum + (sauce.price_adjustment || 0) * item.quantity, 
      0
    );
  }
  
  if (item.customizations?.modifiers) {
    total += item.customizations.modifiers.reduce(
      (sum, modifier) => sum + (modifier.price_adjustment || 0) * item.quantity,
      0
    );
  }
  
  return total;
};

/**
 * Calculate the total price for an entire order
 */
export const calculateOrderTotal = (items: WolfPackOrderItem[]): number => {
  return items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
};

/**
 * Parse order items from various JSON formats
 */
export const parseOrderItems = (itemsJson: Json): WolfPackOrderItem[] => {
  try {
    // Handle string JSON
    if (typeof itemsJson === 'string') {
      const parsed = JSON.parse(itemsJson);
      return Array.isArray(parsed) ? parsed.map(item => normalizeOrderItem(item as Json)) : [];
    }
    
    // Handle array directly
    if (Array.isArray(itemsJson)) {
      return itemsJson.map(item => normalizeOrderItem(item as Json));
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

/**
 * Normalize an order item to the unified structure
 */
export const normalizeOrderItem = (item: Json): WolfPackOrderItem => {
  // Convert Json to a safe object type
  const itemObj = (typeof item === 'object' && item !== null && !Array.isArray(item)) 
    ? item as Record<string, unknown>
    : {};
    
  const quantity = Number(itemObj.quantity) || 1;
  const price = Number(itemObj.price) || 0;
  
  // Normalize customizations from various formats
  let customizations: ItemCustomization | undefined;
  
  if (itemObj.customizations && typeof itemObj.customizations === 'object') {
    customizations = itemObj.customizations as ItemCustomization;
  } else if (itemObj.modifiers && typeof itemObj.modifiers === 'object') {
    const modifiers = itemObj.modifiers as Record<string, unknown>;
    // Convert legacy modifiers format
    if (modifiers && 'meat' in modifiers) {
      customizations = {
        meat: modifiers.meat as ItemCustomization['meat'],
        sauces: (modifiers.sauces as ItemCustomization['sauces']) || []
      };
    } else if (Array.isArray(modifiers)) {
      customizations = {
        modifiers: modifiers as ItemCustomization['modifiers']
      };
    }
  }
  
  const orderItem: WolfPackOrderItem = {
    id: String(itemObj.id || ''),
    item_id: String(itemObj.item_id || itemObj.id || ''),
    name: String(itemObj.name || ''),
    quantity,
    price,
    image_url: typeof itemObj.image_url === 'string' ? itemObj.image_url : undefined,
    notes: typeof itemObj.notes === 'string' ? itemObj.notes : undefined,
    customizations,
    subtotal: 0 // Will be calculated below
  };
  
  // Calculate subtotal
  orderItem.subtotal = calculateItemTotal(orderItem);
  
  return orderItem;
};

/**
 * Create a cart item from menu item data
 */
export const createCartItem = (
  menuItem: {
    id: string;
    name: string;
    price: number;
    image_url?: string;
  },
  quantity: number = 1,
  customizations?: ItemCustomization,
  notes?: string
): CartItem => {
  const item: CartItem = {
    id: `${menuItem.id}_${JSON.stringify(customizations || {})}_${Date.now()}`,
    item_id: menuItem.id,
    name: menuItem.name,
    quantity,
    price: menuItem.price,
    image_url: menuItem.image_url,
    notes,
    customizations,
    subtotal: 0
  };
  
  item.subtotal = calculateItemTotal(item);
  return item;
};

// Display Utility Functions

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

// Type Guards

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

export function isOrderItem(item: unknown): item is WolfPackOrderItem {
  return (
    typeof item === 'object' &&
    item !== null &&
    'id' in item &&
    'name' in item &&
    'quantity' in item &&
    'price' in item &&
    'subtotal' in item
  );
}

export function isOrder(order: unknown): order is WolfPackOrder {
  return (
    typeof order === 'object' &&
    order !== null &&
    'id' in order &&
    'order_number' in order &&
    'items' in order &&
    'total_amount' in order
  );
}

// Legacy compatibility aliases
export type UnifiedOrder = WolfPackOrder;
export type OrderItem = WolfPackOrderItem;
export type Order = WolfPackOrder;
export type AdminOrder = WolfPackOrder;
export type BartenderOrder = WolfPackOrder;

// Re-export database types
export type { Json } from '@/types/database.types';
