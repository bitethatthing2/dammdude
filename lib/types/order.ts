// lib/types/order.ts
// DEPRECATED: Use @/types/wolfpack-unified instead
// This file is kept for compatibility during migration

// Re-export everything from the unified types
export * from '@/types/wolfpack-unified';

// Specific legacy aliases for components that might still use them
export type { 
  WolfPackOrder as BartenderOrder,
  WolfPackOrderItem as OrderItem,
  WolfPackOrder as OrderWithDetails,
  WolfPackOrderSummary as OrderSummary,
  WolfPackOrderRequest as OrderRequest,
  ItemCustomization as OrderItemCustomization,
  BartenderOrderRow,
  OrderInsert,
  OrderUpdate
} from '@/types/wolfpack-unified';

// Legacy modifier structure - deprecated
export interface OrderItemModifier {
  id: string;
  name: string;
  price_adjustment?: number;
}
