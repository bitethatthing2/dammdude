// Import types from menu-item-types
import type { CartItem } from './menu-item-types';
import type { BartenderOrder } from './order';
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from '@/lib/database.types';

// Define the Supabase client type using the Database generic
type SupabaseClient = ReturnType<typeof createBrowserClient<Database>>;

// Checkout Form State
export interface CheckoutFormData {
  // Customer Information
  customer: CustomerInfo;
  
  // Order Details
  orderDetails: OrderDetails;
  
  // Cart Items (from current cart state)
  items: CartItem[];
  
  // Payment Information
  payment: PaymentInfo;
  
  // Totals
  totals: OrderTotals;
}

// Customer Information Section
export interface CustomerInfo {
  id?: string;                    // Optional if guest checkout
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  isGuest: boolean;
  preferredLocationId?: string;   // User's preferred location
  notificationPreferences?: OrderNotificationPreferences;
}

// Order Notification Preferences
export interface OrderNotificationPreferences {
  orderUpdates: boolean;          // Notify when order status changes
  orderReady: boolean;            // Notify when order is ready
  smsNotifications: boolean;      // Send SMS updates (if phone provided)
  emailNotifications: boolean;    // Send email updates
}

// Order Details Section
export interface OrderDetails {
  orderType: 'pickup' | 'table_delivery';
  location: LocationInfo;
  
  // For table delivery
  tableLocation?: string;
  
  // For pickup
  pickupTime?: string;            // ISO string for scheduled pickup
  isScheduled?: boolean;          // Whether this is a scheduled order
  
  // Special instructions
  customerNotes?: string;
}

// Location Information
export interface LocationInfo {
  id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
}

// Payment Information Section
export interface PaymentInfo {
  method: PaymentMethod;
  
  // For tab payment
  tabId?: string;
  tabDetails?: TabInfo;
  
  // For tips
  tipAmount?: number;
  tipPercentage?: number;
}

export type PaymentMethod = 
  | 'pay_at_bar'
  | 'add_to_tab'
  | 'cash'
  | 'card';                      // Future: for online payments

// Tab Information (if adding to tab)
export interface TabInfo {
  id: string;
  customerName: string;
  currentBalance: number;
  status: 'open' | 'closed' | 'paid';
}

// Order Totals
export interface OrderTotals {
  subtotal: number;
  tax: number;
  tip: number;
  total: number;
  itemCount: number;
}

// Validation Rules
export interface CheckoutValidation {
  customer: CustomerValidation;
  orderDetails: OrderDetailsValidation;
  payment: PaymentValidation;
}

export interface CustomerValidation {
  email: {
    required: boolean;
    pattern: RegExp;
    message: string;
  };
  firstName: {
    required: boolean;
    minLength: number;
    message: string;
  };
  lastName: {
    required: boolean;
    minLength: number;
    message: string;
  };
  phone?: {
    pattern: RegExp;
    message: string;
  };
}

export interface OrderDetailsValidation {
  orderType: {
    required: boolean;
    message: string;
  };
  tableLocation: {
    required: boolean;
    condition: (data: CheckoutFormData) => boolean;
    message: string;
  };
}

export interface PaymentValidation {
  method: {
    required: boolean;
    message: string;
  };
  tabId: {
    required: boolean;
    condition: (data: CheckoutFormData) => boolean;
    message: string;
  };
}

// Form Step Configuration
export interface CheckoutStep {
  id: string;
  title: string;
  description?: string;
  isValid: (data: CheckoutFormData) => boolean;
  isRequired: boolean;
}

export const CHECKOUT_STEPS: CheckoutStep[] = [
  {
    id: 'cart-review',
    title: 'Review Order',
    description: 'Review your items before checkout',
    isValid: (data) => data.items.length > 0,
    isRequired: true
  },
  {
    id: 'customer-info',
    title: 'Customer Information',
    description: 'Tell us who you are',
    isValid: (data) => {
      const { customer } = data;
      return !!(customer.email && customer.firstName && customer.lastName);
    },
    isRequired: true
  },
  {
    id: 'order-details',
    title: 'Order Details',
    description: 'How would you like to receive your order?',
    isValid: (data) => {
      const { orderDetails } = data;
      if (orderDetails.orderType === 'table_delivery') {
        return !!(orderDetails.location.id && orderDetails.tableLocation);
      }
      return !!orderDetails.location.id;
    },
    isRequired: true
  },
  {
    id: 'payment',
    title: 'Payment',
    description: 'Choose your payment method',
    isValid: (data) => {
      const { payment } = data;
      if (payment.method === 'add_to_tab') {
        return !!payment.tabId;
      }
      return !!payment.method;
    },
    isRequired: true
  },
  {
    id: 'confirmation',
    title: 'Confirm Order',
    description: 'Review and place your order',
    isValid: () => true,
    isRequired: true
  }
];

// Checkout State Management
export interface CheckoutState {
  currentStep: number;
  formData: CheckoutFormData;
  validationErrors: ValidationErrors;
  isSubmitting: boolean;
  submitError: string | null;
}

export interface ValidationErrors {
  [key: string]: string | undefined;
}

// API Request/Response Types
export interface CreateOrderRequest {
  customer_id?: string;
  location_id: string;
  status: 'pending';
  order_type: 'pickup' | 'table_delivery';
  table_location?: string;
  items: CartItem[];
  total_amount: number;
  customer_notes?: string;
  payment_status: 'pending' | 'paid_at_bar' | 'added_to_tab';
  tab_id?: string;
}

export interface CreateOrderResponse {
  order: BartenderOrder | null;
  success: boolean;
  message?: string;
}

// Helper Functions for Checkout
export const calculateOrderTotals = (items: CartItem[], tipAmount = 0): OrderTotals => {
const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.0825; // Example: 8.25% tax rate
  const total = subtotal + tax + tipAmount;
  const itemCount = items.reduce((count, item) => count + item.quantity, 0);

  return {
    subtotal,
    tax,
    tip: tipAmount,
    total,
    itemCount
  };
};

export const calculateTipAmount = (subtotal: number, percentage: number): number => {
  return subtotal * (percentage / 100);
};

export const suggestedTipPercentages = [15, 18, 20, 25] as const;

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[\+\-\(\)\s0-9]{7,20}$/;
  return phoneRegex.test(phone);
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

// Initial Checkout Form State
export const initialCheckoutState: CheckoutFormData = {
  customer: {
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    isGuest: true,
    notificationPreferences: {
      orderUpdates: true,
      orderReady: true,
      smsNotifications: false,
      emailNotifications: true
    }
  },
  orderDetails: {
    orderType: 'pickup',
    location: {
      id: '',
      name: ''
    },
    customerNotes: ''
  },
  items: [],
  payment: {
    method: 'pay_at_bar',
    tipAmount: 0,
    tipPercentage: 0
  },
  totals: {
    subtotal: 0,
    tax: 0,
    tip: 0,
    total: 0,
    itemCount: 0
  }
};

// Type Guards
export const isValidPaymentMethod = (method: string): method is PaymentMethod => {
  return ['pay_at_bar', 'add_to_tab', 'cash', 'card'].includes(method);
};

export const isTableDelivery = (orderType: string): orderType is 'table_delivery' => {
  return orderType === 'table_delivery';
};

// React Hook Types for Checkout Form
export interface UseCheckoutForm {
  formData: CheckoutFormData;
  currentStep: number;
  validationErrors: ValidationErrors;
  isSubmitting: boolean;
  
  // Actions
  updateCustomerInfo: (info: Partial<CustomerInfo>) => void;
  updateOrderDetails: (details: Partial<OrderDetails>) => void;
  updatePaymentInfo: (payment: Partial<PaymentInfo>) => void;
  updateCartItems: (items: CartItem[]) => void;
  
  // Navigation
  nextStep: () => boolean;
  previousStep: () => void;
  goToStep: (step: number) => void;
  
  // Validation
  validateCurrentStep: () => boolean;
  validateForm: () => boolean;
  
  // Submission
  submitOrder: () => Promise<CreateOrderResponse>;
  resetForm: () => void;
}

// Checkout Context Type
export interface CheckoutContextType {
  state: CheckoutState;
  actions: CheckoutActions;
}

export interface CheckoutActions {
  updateFormData: (updates: Partial<CheckoutFormData>) => void;
  setCurrentStep: (step: number) => void;
  setValidationErrors: (errors: ValidationErrors) => void;
  setSubmitting: (isSubmitting: boolean) => void;
  setSubmitError: (error: string | null) => void;
}

// Error Messages
export const CHECKOUT_ERROR_MESSAGES = {
  customer: {
    emailRequired: 'Email is required',
    emailInvalid: 'Please enter a valid email address',
    firstNameRequired: 'First name is required',
    lastNameRequired: 'Last name is required',
    phoneInvalid: 'Please enter a valid phone number'
  },
  orderDetails: {
    orderTypeRequired: 'Please select pickup or table delivery',
    locationRequired: 'Please select a location',
    tableLocationRequired: 'Please enter your table location'
  },
  payment: {
    methodRequired: 'Please select a payment method',
    tabRequired: 'Please select a tab to add this order to'
  },
  general: {
    cartEmpty: 'Your cart is empty',
    minimumOrder: 'Minimum order amount not met',
    serverError: 'An error occurred. Please try again.'
  }
};

// Example Usage with Supabase
export const createOrderFromCheckout = async (
  supabase: SupabaseClient,
  checkoutData: CheckoutFormData
): Promise<CreateOrderResponse> => {
  try {
    // Prepare order data
    const orderData: CreateOrderRequest = {
      customer_id: checkoutData.customer.id,
      location_id: checkoutData.orderDetails.location.id,
      status: 'pending',
      order_type: checkoutData.orderDetails.orderType,
      table_location: checkoutData.orderDetails.tableLocation,
      items: checkoutData.items,
      total_amount: checkoutData.totals.total,
      customer_notes: checkoutData.orderDetails.customerNotes,
      payment_status: checkoutData.payment.method === 'add_to_tab' ? 'added_to_tab' : 'pending',
      tab_id: checkoutData.payment.tabId
    };

    // Create order
    const { data: order, error } = await supabase
      .from('bartender_orders')
      .insert(orderData)
      .select()
      .single();

    if (error) throw error;

    // Send notifications if enabled
    if (checkoutData.customer.notificationPreferences?.orderUpdates) {
      // Trigger notification logic
    }

    return {
      order,
      success: true,
      message: 'Order placed successfully!'
    };
  } catch (error) {
    return {
      order: null,
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create order'
    };
  }
};

// Order Status Tracking
export interface OrderStatusUpdate {
  orderId: string;
  status: BartenderOrder['status'];
  timestamp: string;
  message?: string;
}

export const ORDER_STATUS_MESSAGES: Record<NonNullable<BartenderOrder['status']>, string> = {
  pending: 'Your order has been received',
  accepted: 'Your order has been accepted by the bartender',
  preparing: 'Your order is being prepared',
  ready: 'Your order is ready!',
  delivered: 'Your order has been delivered',
  completed: 'Order completed - thank you!',
  cancelled: 'Your order has been cancelled'
};

// Example Form Validation
export const validateCheckoutStep = (
  step: string,
  data: CheckoutFormData
): ValidationErrors => {
  const errors: ValidationErrors = {};

  switch (step) {
    case 'customer-info':
      if (!data.customer.email) {
        errors.email = CHECKOUT_ERROR_MESSAGES.customer.emailRequired;
      } else if (!validateEmail(data.customer.email)) {
        errors.email = CHECKOUT_ERROR_MESSAGES.customer.emailInvalid;
      }
      
      if (!data.customer.firstName) {
        errors.firstName = CHECKOUT_ERROR_MESSAGES.customer.firstNameRequired;
      }
      
      if (!data.customer.lastName) {
        errors.lastName = CHECKOUT_ERROR_MESSAGES.customer.lastNameRequired;
      }
      
      if (data.customer.phone && !validatePhone(data.customer.phone)) {
        errors.phone = CHECKOUT_ERROR_MESSAGES.customer.phoneInvalid;
      }
      break;

    case 'order-details':
      if (!data.orderDetails.orderType) {
        errors.orderType = CHECKOUT_ERROR_MESSAGES.orderDetails.orderTypeRequired;
      }
      
      if (!data.orderDetails.location.id) {
        errors.location = CHECKOUT_ERROR_MESSAGES.orderDetails.locationRequired;
      }
      
      if (data.orderDetails.orderType === 'table_delivery' && !data.orderDetails.tableLocation) {
        errors.tableLocation = CHECKOUT_ERROR_MESSAGES.orderDetails.tableLocationRequired;
      }
      break;

    case 'payment':
      if (!data.payment.method) {
        errors.paymentMethod = CHECKOUT_ERROR_MESSAGES.payment.methodRequired;
      }
      
      if (data.payment.method === 'add_to_tab' && !data.payment.tabId) {
        errors.tabId = CHECKOUT_ERROR_MESSAGES.payment.tabRequired;
      }
      break;
  }

  return errors;
};
