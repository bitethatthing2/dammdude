// ===== MENU MODULE =====
// Core menu types based on actual database tables

// From food_drink_categories table
export type FoodDrinkCategory = {
  id: string;
  name: string;
  type: 'food' | 'drink';
  description?: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  icon?: string;
  color?: string;
};

// From food_drink_items table (your main menu items)
export type FoodDrinkItem = {
  id: string;
  category_id?: string;
  name: string;
  description?: string;
  price: number;
  is_available: boolean;
  image_id?: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  display_order: number;
};

// From menu_item_modifiers table
export type MenuItemModifier = {
  id: string;
  name: string;
  modifier_type: string;
  price_adjustment?: number;
  is_available: boolean;
  created_at: string;
  display_order: number;
  description?: string;
  is_popular?: boolean;
  spice_level?: number;
};

// View type from menu_items_with_categories
export type MenuItemWithCategory = {
  id: string;
  name: string;
  description?: string;
  price: number;
  is_available: boolean;
  display_order: number;
  image_id?: string;
  created_at: string;
  updated_at: string;
  category_id?: string;
  category_name?: string;
  category_type?: 'food' | 'drink';
  category_icon?: string;
  category_color?: string;
  category_order?: number;
};

// ===== ORDER MODULE =====

// From bartender_orders table
export type BartenderOrder = {
  id: string;
  order_number: number;
  customer_id?: string;
  bartender_id?: string;
  tab_id?: string;
  location_id?: string;
  status: 'pending' | 'accepted' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  order_type: 'pickup' | 'table';
  table_location?: string;
  items: OrderItem[]; // JSONB field
  total_amount: number;
  customer_notes?: string;
  bartender_notes?: string;
  created_at: string;
  accepted_at?: string;
  ready_at?: string;
  completed_at?: string;
  paid_at?: string;
  seating_location?: string;
  modification_notes?: string;
  customer_gender?: string;
  notification_sent: boolean;
  ready_notification_sent: boolean;
  updated_at: string;
};

// Item structure within orders (stored as JSONB)
export type OrderItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  modifiers?: OrderItemModifier[];
  notes?: string;
};

export type OrderItemModifier = {
  id: string;
  name: string;
  price_adjustment: number;
};

// From bartender_tabs table
export type BartenderTab = {
  id: string;
  tab_number: string;
  bartender_id?: string;
  location_id?: string;
  status: 'open' | 'closed';
  total_amount: number;
  created_at: string;
  closed_at?: string;
  payment_method?: string;
  customer_count?: number;
  notes?: string;
};

// ===== CART MODULE (Frontend State) =====

// Cart types for frontend state management
export type CartItem = {
  id: string; // menu item id
  name: string;
  price: number;
  quantity: number;
  modifiers?: CartItemModifier[];
  notes?: string;
  category_type?: 'food' | 'drink';
};

export type CartItemModifier = {
  id: string;
  name: string;
  price_adjustment: number;
};

export type CartState = {
  items: CartItem[];
  total: number;
  itemCount: number;
};

// ===== CHECKOUT MODULE =====

export type CheckoutFormData = {
  customer: CustomerInfo;
  order: OrderDetails;
  payment: PaymentInfo;
};

export type CustomerInfo = {
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  gender?: string;
};

export type OrderDetails = {
  type: 'pickup' | 'table';
  tableLocation?: string;
  seatingLocation?: string;
  notes?: string;
};

export type PaymentInfo = {
  method: PaymentMethod;
  tip_amount?: number;
  tip_percentage?: number;
};

export type PaymentMethod = 'cash' | 'card' | 'tab';

export type OrderTotals = {
  subtotal: number;
  tax: number;
  tip: number;
  total: number;
};

export type CheckoutStep = 'cart' | 'details' | 'payment' | 'confirm';

export type CheckoutState = {
  currentStep: CheckoutStep;
  formData: CheckoutFormData;
  totals: OrderTotals;
  isProcessing: boolean;
  errors: ValidationErrors;
};

export type ValidationErrors = {
  [key: string]: string;
};

// ===== API TYPES =====

export type CreateOrderRequest = {
  customer_id?: string;
  order_type: 'pickup' | 'table';
  table_location?: string;
  seating_location?: string;
  items: OrderItem[];
  total_amount: number;
  customer_notes?: string;
  customer_gender?: string;
  payment_method?: PaymentMethod;
  tip_amount?: number;
};

export type CreateOrderResponse = {
  order: BartenderOrder;
  success: boolean;
  message?: string;
};

// ===== UTILITY FUNCTIONS =====

export function isMenuItemModifier(item: unknown): item is MenuItemModifier {
  return (
    typeof item === 'object' &&
    item !== null &&
    'modifier_type' in item &&
    'price_adjustment' in item
  );
}

export function calculateOrderTotals(
  items: CartItem[],
  taxRate: number = 0.08,
  tipAmount: number = 0
): OrderTotals {
  const subtotal = items.reduce((sum, item) => {
    const itemPrice = item.price + 
      (item.modifiers?.reduce((modSum, mod) => modSum + mod.price_adjustment, 0) || 0);
    return sum + (itemPrice * item.quantity);
  }, 0);
  
  const tax = subtotal * taxRate;
  const total = subtotal + tax + tipAmount;
  
  return {
    subtotal,
    tax,
    tip: tipAmount,
    total
  };
}

export function calculateTipAmount(subtotal: number, percentage: number): number {
  return subtotal * (percentage / 100);
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePhone(phone: string): boolean {
  const phoneRegex = /^\+?1?\d{10}$/;
  return phoneRegex.test(phone.replace(/[\s.-]/g, ''));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

export function isValidPaymentMethod(method: string): method is PaymentMethod {
  return ['cash', 'card', 'tab'].includes(method);
}

export function isTableDelivery(orderType: string): boolean {
  return orderType === 'table';
}

// ===== TYPE GUARDS =====

export function isFoodDrinkItem(item: unknown): item is FoodDrinkItem {
  return (
    typeof item === 'object' &&
    item !== null &&
    'price' in item &&
    'is_available' in item &&
    typeof (item as Record<string, unknown>).price === 'number'
  );
}

export function isBartenderOrder(order: unknown): order is BartenderOrder {
  return (
    typeof order === 'object' &&
    order !== null &&
    'order_number' in order &&
    'items' in order &&
    Array.isArray((order as Record<string, unknown>).items)
  );
}