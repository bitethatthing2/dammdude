/**
 * Shared type definitions for orders across the application
 * Consolidated from multiple components for consistency
 */

// Order status enum to ensure consistency across components
export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'delivered' | 'completed' | 'cancelled' | 'in_progress';

// Order item definition
export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price?: number;      // Optional in response for flexibility
  order_id?: string;   // Reference to parent order
  menu_item_id?: string; // Reference to menu item
  notes?: string;      // Per-item notes
  customizations?: {
    meatType?: string;
    extras?: string[];
    preferences?: string[];
  } | Record<string, any>; // Support for different customization formats
}

// Main Order interface
export interface Order {
  id: string;
  table_id: string;
  table_name?: string; // For display purposes
  location?: string;   // Added location field
  status: OrderStatus;
  items: OrderItem[];
  order_items?: OrderItem[]; // Alternative name in some components
  
  // Time fields
  inserted_at?: string; // ISO string - original field
  created_at?: string;  // For display - used in some components
  updated_at?: string;  // From database - main timestamp field
  completed_at?: string; // Optional completion timestamp
  
  // Notes and amounts
  notes?: string;       // Optional order notes
  customer_notes?: string; // Alternative name in some components
  total_amount?: number;  // Optional calculated total
  total_price?: number;   // Alternative name in some components
  
  estimated_time?: number; // Time to prepare/deliver in minutes
  metadata?: Record<string, unknown>; // Additional flexible data
}

// Table interface for reference
export interface Table {
  id: string;
  name: string;
  section?: string;
  active: boolean;
}

// Order request payload for creating orders
export interface OrderRequest {
  table_id: string;
  location?: string;
  items: {
    menu_item_id: string;
    quantity: number;
    notes?: string;
    customizations?: Record<string, any>;
  }[];
  customer_notes?: string;
  estimated_time?: number;
  metadata?: Record<string, unknown>;
}

// Order update payload
export interface OrderStatusUpdate {
  id: string;
  status: OrderStatus;
  estimated_time?: number;
  metadata?: Record<string, unknown>;
}