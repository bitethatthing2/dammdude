// Export all types from the module
export * from './menu';
export * from './order';
export type { BartenderOrder } from './order';
export { isValidOrderStatus, isValidPaymentStatus } from './order';
export * from './api';

// Export specific items from checkout to avoid conflicts
export type {
  CheckoutFormData,
  CustomerInfo,
  OrderDetails,
  PaymentInfo,
  OrderTotals,
  PaymentMethod,
  CheckoutStep,
  CheckoutState,
  ValidationErrors,
  CreateOrderRequest,
  CreateOrderResponse
} from './checkout';
export { 
  calculateOrderTotals,
  calculateTipAmount,
  validateEmail,
  validatePhone,
  formatCurrency,
  isValidPaymentMethod,
  isTableDelivery
} from './checkout';
