/**
 * Common type definitions for the application
 */

// Table data interface used across components
export interface TableData {
  id: string;
  name: string;
  section?: string;
}

// Cart item interface for BarTap
export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
  image_url?: string | null;
  description?: string | null;
  category_id?: string | null;
  available?: boolean;
  customizations?: {
    meatType?: string;
    extras?: string[];
    preferences?: string[];
  };
}
