// Base Menu Item from food_drink_items table (matches database schema)
export interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  menu_category_id: string | null; // Database field name
  price: number;
  available: boolean; // Database field name
  image_id: string | null;
  image_url?: string | null; // For backward compatibility
  created_by: string | null;
  created_at: string;
  updated_at: string;
  display_order: number;
}

// Menu Item Modifier from menu_item_modifiers table
export interface MenuItemModifier {
  id: string;
  name: string;
  modifier_type: 'meat' | 'sauce' | 'salsa' | 'addon' | 'side';
  price_adjustment: number;
  is_available: boolean;
  created_at: string;
  display_order: number;
}

// Food & Drink Category (matches database schema)
export interface FoodDrinkCategory {
  id: string;
  name: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  icon?: string; // Add icon property for UI
}

// Extended interfaces for component use
export interface MenuCategory extends FoodDrinkCategory {
  items?: MenuItem[];
  icon: string; // Required for UI components
}

export interface MenuItemWithCategory extends MenuItem {
  category?: MenuCategory;
}

// Image reference (from images table)
export interface MenuItemImage {
  id: string;
  name: string;
  url: string;
  size: number | null;
  mime_type: string | null;
}

// Cart Item structure (stored in bartender_orders.items JSONB)
export interface CartItem {
  id: string;                    // menu item id (NOT item_id)
  name: string;
  price: number;
  quantity: number;
  menu_category_id?: string | null;
  modifiers?: CartItemModifier[];
  notes?: string;
  subtotal?: number;             // price * quantity + modifier adjustments
  image_url?: string | null;     // for display purposes
}

export interface CartItemModifier {
  id: string;                    // modifier id
  name: string;
  modifier_type: 'meat' | 'sauce' | 'salsa' | 'addon' | 'side';
  price_adjustment: number;
}

// Complete Menu Item with relations
export interface MenuItemWithRelations extends MenuItem {
  category?: FoodDrinkCategory;
  image?: MenuItemImage;
  available_modifiers?: MenuItemModifier[];
}

// Order/Cart State (from bartender_orders table)
export interface BartenderOrder {
  id: string;
  order_number: number;
  customer_id: string | null;
  bartender_id: string | null;
  tab_id: string | null;
  location_id: string | null;
  status: 'pending' | 'accepted' | 'preparing' | 'ready' | 'delivered' | 'completed' | 'cancelled';
  order_type: 'pickup' | 'table_delivery';
  table_location: string | null;
  items: CartItem[];             // JSONB array of cart items
  total_amount: number;
  customer_notes: string | null;
  bartender_notes: string | null;
  created_at: string;
  accepted_at: string | null;
  ready_at: string | null;
  completed_at: string | null;
  payment_status: 'pending' | 'paid_at_bar' | 'added_to_tab';
  paid_at: string | null;
  payment_handled_by: string | null;
}

// Tab structure (from bartender_tabs table)
export interface BartenderTab {
  id: string;
  bartender_id: string | null;
  customer_name: string | null;
  status: 'open' | 'closed' | 'paid';
  total_amount: number;
  created_at: string;
  closed_at: string | null;
  notes: string | null;
}

// Helper types for creating/updating
export type CreateMenuItem = Omit<MenuItem, 'id' | 'created_at' | 'updated_at'>;
export type UpdateMenuItem = Partial<CreateMenuItem>;

export type CreateMenuItemModifier = Omit<MenuItemModifier, 'id' | 'created_at'>;
export type UpdateMenuItemModifier = Partial<CreateMenuItemModifier>;

export type CreateBartenderOrder = Omit<BartenderOrder, 'id' | 'order_number' | 'created_at' | 'accepted_at' | 'ready_at' | 'completed_at' | 'paid_at'>;
export type UpdateBartenderOrder = Partial<CreateBartenderOrder>;

// Response types for Supabase queries
export type MenuItemResponse = MenuItem & {
  food_drink_categories?: FoodDrinkCategory;
  images?: MenuItemImage;
};

// Cart management types
export interface CartState {
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  customer_notes?: string;
  order_type: 'pickup' | 'table_delivery';
  table_location?: string;
}

// Type guards
export const isMenuItemModifier = (modifier: unknown): modifier is MenuItemModifier => {
  return (
    typeof modifier === 'object' &&
    modifier !== null &&
    'id' in modifier &&
    'modifier_type' in modifier &&
    ['meat', 'sauce', 'salsa', 'addon', 'side'].includes((modifier as MenuItemModifier).modifier_type)
  );
};

export const isValidOrderStatus = (status: string): status is BartenderOrder['status'] => {
  return ['pending', 'accepted', 'preparing', 'ready', 'delivered', 'completed', 'cancelled'].includes(status);
};

export const isValidPaymentStatus = (status: string): status is BartenderOrder['payment_status'] => {
  return ['pending', 'paid_at_bar', 'added_to_tab'].includes(status);
};

// Legacy compatibility aliases
export type MenuModifier = MenuItemModifier;
export type CartItemData = CartItem;
