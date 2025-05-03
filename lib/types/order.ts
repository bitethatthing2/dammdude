/**
 * Shared type definitions for orders across the application
 * Consolidated from multiple components for consistency
 * 
 * IMPORTANT: This is the single source of truth for order-related types.
 * All components should import these types rather than defining their own.
 */

/**
 * Order status enum to ensure consistency across components
 * All statuses supported by the system
 */
export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'delivered' | 'completed' | 'cancelled';

/**
 * Order item definition - represents a single item in an order
 */
export interface OrderItem {
  id: string;                     // Unique identifier (UUID)
  name: string;                   // Display name of the item
  quantity: number;               // Number of this item ordered
  price: number;                  // Price per item
  order_id: string;               // Reference to parent order
  menu_item_id: string;           // Reference to menu item
  notes?: string;                 // Optional per-item notes
  modifiers?: Record<string, any>; // Optional customization data
}

/**
 * Main Order interface - represents a customer order
 */
export interface Order {
  id: string;                     // Unique identifier (UUID)
  table_id: string;               // Reference to the table
  table_name?: string;            // For display purposes only
  location?: string;              // Location identifier if multi-location
  status: OrderStatus;            // Current order status
  items: OrderItem[];             // Array of order items
  
  // Standard timestamp fields
  created_at: string;             // When order was created (ISO string)
  updated_at?: string;            // When order was last updated
  completed_at?: string;          // When order was completed
  
  // Standard order fields
  notes?: string;                 // General notes for the order
  total_amount: number;           // Total price of the order
  estimated_time?: number;        // Minutes to prepare/deliver
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