// Simple types for order-ahead system (no payment processing)

import type { Database } from '@/lib/database.types';

// Database types
export type BartenderOrder = Database['public']['Tables']['bartender_orders']['Insert'];
export type Location = Database['public']['Tables']['locations']['Row'];
export type WolfpackTab = Database['public']['Tables']['wolfpack_bar_tabs']['Row'];

// Simple payment method - just tracking how they'll pay at the bar
export type PaymentMethod = 'pay_at_bar' | 'wolfpack_tab' | 'cash';

// Order type
export type OrderType = 'pickup' | 'table_delivery';

// Simple order status for bartender workflow
export type OrderStatus = 'pending' | 'accepted' | 'preparing' | 'ready' | 'completed' | 'cancelled';

// Cart item from BarTapContext
export interface OrderItem {
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

// Simple customer info for order
export interface CustomerInfo {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

// Order details
export interface OrderDetails {
  orderType: OrderType;
  tableLocation?: string;
  customerNotes?: string;
}

// Payment info - just method selection
export interface PaymentInfo {
  method: PaymentMethod;
  tabId?: string; // Only for Wolfpack tab
}

// Simple totals
export interface OrderTotals {
  subtotal: number;
  tax: number;
  total: number;
  itemCount: number;
}

// Helper functions
export const calculateOrderTotals = (items: OrderItem[]): OrderTotals => {
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.0825; // 8.25% tax
  const total = subtotal + tax;
  const itemCount = items.reduce((count, item) => count + item.quantity, 0);

  return {
    subtotal,
    tax,
    total,
    itemCount
  };
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

export const formatOrderNumber = (orderNumber: number): string => {
  return `#${orderNumber.toString().padStart(4, '0')}`;
};

// Order status messages for UI
export const ORDER_STATUS_MESSAGES: Record<OrderStatus, string> = {
  pending: 'Order received - waiting for bartender',
  accepted: 'Bartender is preparing your order',
  preparing: 'Your order is being made',
  ready: 'Your order is ready!',
  completed: 'Order completed - thank you!',
  cancelled: 'Order cancelled'
};

// Simple validation
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[\+\-\(\)\s0-9]{7,20}$/;
  return phoneRegex.test(phone);
};