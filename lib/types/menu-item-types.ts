/**
 * Menu item types for the application
 */

import type { Database } from '@/lib/database.types';

// Base types from database
export type MenuItem = Database['public']['Tables']['food_drink_items']['Row'];
export type MenuCategory = Database['public']['Tables']['food_drink_categories']['Row'];

// Extended types
export interface MenuItemWithCategory extends MenuItem {
  category?: MenuCategory;
}

// Cart item type
export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
  customizations?: {
    meatType?: string;
    extras?: string[];
    preferences?: string[];
  };
}

// Order item type for submission
export interface OrderItemJson {
  id: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
  customizations?: {
    meatType?: string;
    extras?: string[];
    preferences?: string[];
  };
}

// Menu modifier types
export interface MenuModifier {
  id: string;
  name: string;
  modifier_type: string;
  price_adjustment: number;
  is_available: boolean;
}

export interface MenuItemOption {
  id: string;
  name: string;
  price: number;
}

// Menu API response types
export interface MenuResponse {
  categories: MenuCategory[];
  items: MenuItemWithCategory[];
}

// Category display types
export interface CategoryWithItems extends MenuCategory {
  items: MenuItem[];
}