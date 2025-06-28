'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import {
  OrderStatus,
  WolfPackOrder,
  WolfPackOrderItem,
  parseOrderItems,
  normalizeOrderItem
} from '@/types/wolfpack-unified';

// Type aliases for this hook
export type UnifiedOrder = WolfPackOrder;
export type OrderItem = WolfPackOrderItem;

// Re-export types that components need
export type { OrderStatus } from '@/types/wolfpack-unified';

interface UseUnifiedOrdersOptions {
  status?: OrderStatus[];
  customerId?: string;
  refreshInterval?: number;
  enableRealtime?: boolean;
  onNewOrder?: (order: UnifiedOrder) => void;
  onOrderStatusChange?: (order: UnifiedOrder, previousStatus: OrderStatus) => void;
}

interface ProcessingState {
  [orderId: string]: boolean;
}

// Define the database row type
interface BartenderOrderRow {
  id: string;
  order_number?: number;
  customer_id: string;
  bartender_id?: string;
  status: string;
  total_amount: string | number;
  items: unknown;
  notes?: string;
  customer_notes?: string;
  bartender_notes?: string;
  created_at: string;
  updated_at?: string;
  completed_at?: string;
  table_location?: string;
  tab_id?: string;
  location_id?: string;
  customer?: {
    id: string;
    first_name?: string;
    last_name?: string;
    email?: string;
  };
  bartender?: {
    id: string;
    first_name?: string;
    last_name?: string;
    email?: string;
  };
}

// Define realtime payload type
interface RealtimePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: BartenderOrderRow | null;
  old: BartenderOrderRow | null;
  schema: string;
  table: string;
  commit_timestamp: string;
  errors: string[] | null;
}

/**
 * Unified hook for all order management needs
 * Works with bartender_orders table
 */
export function useUnifiedOrders(options: UseUnifiedOrdersOptions = {}) {
  const {
    status = ['pending', 'preparing', 'ready'],
    customerId,
    refreshInterval = 30000,
    enableRealtime = true,
    onNewOrder,
    onOrderStatusChange
  } = options;

  const [orders, setOrders] = useState<UnifiedOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingOrders, setProcessingOrders] = useState<ProcessingState>({});
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null);
  
  // If you have a Database type generated, use it here:
  // const supabase = createClientComponentClient<Database>();
  
  const parseOrderItems = (items: unknown): OrderItem[] => {
    if (!items) return [];
    if (typeof items === 'string') {
      try {
        const parsed = JSON.parse(items);
        if (Array.isArray(parsed)) {
          return parsed as OrderItem[];
        }
        return [];
      } catch {
        return [];
      }
    }
    if (Array.isArray(items)) {
      return items as OrderItem[];
    }
    return [];
  };

  const fetchOrders = useCallback(async () => {
    try {
      let query = supabase
        .from('bartender_orders')
        .select(`
          *,
          customer:users!bartender_orders_customer_id_fkey (
            id,
            first_name,
            last_name,
            email
          ),
          bartender:users!bartender_orders_bartender_id_fkey (
            id,
            first_name,
            last_name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (status && status.length > 0) {
        query = query.in('status', status);
      }

      if (customerId) {
        query = query.eq('customer_id', customerId);
      }

      const { data, error: queryError } = await query;

      if (queryError) throw queryError;

      const parsedOrders: UnifiedOrder[] = (data || []).map((order: unknown) => {
        const typedOrder = order as BartenderOrderRow;
        return {
          id: typedOrder.id,
          order_number: typedOrder.order_number,
          customer_id: typedOrder.customer_id,
          bartender_id: typedOrder.bartender_id || null,
          status: typedOrder.status as OrderStatus,
          total_amount: typeof typedOrder.total_amount === 'string' 
            ? parseFloat(typedOrder.total_amount) 
            : typedOrder.total_amount || 0,
          items: parseOrderItems(typedOrder.items),
          notes: typedOrder.notes || null,
          customer_notes: typedOrder.customer_notes || null,
          bartender_notes: typedOrder.bartender_notes || null,
          created_at: typedOrder.created_at,
          updated_at: typedOrder.updated_at,
          completed_at: typedOrder.completed_at || null,
          table_location: typedOrder.table_location,
          tab_id: typedOrder.tab_id,
          location_id: typedOrder.location_id,
          customer: typedOrder.customer || null,
          bartender: typedOrder.bartender || null
        };
      });

      setOrders(parsedOrders);
      setLastFetchTime(new Date());
      setError(null);
    } catch (err) {
      console.error('Error fetching orders:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch orders';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [status, customerId, supabase]);

  const updateOrderStatus = useCallback(async (orderId: string, newStatus: OrderStatus) => {
    setProcessingOrders(prev => ({ ...prev, [orderId]: true }));
    
    try {
      const updateData: {
        status: OrderStatus;
        updated_at: string;
        completed_at?: string;
      } = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      };

      if (newStatus === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      const { error: updateError } = await supabase
        .from('bartender_orders')
        .update(updateData)
        .eq('id', orderId);

      if (updateError) throw updateError;

      setOrders(prevOrders => {
        const oldOrder = prevOrders.find(o => o.id === orderId);
        const newOrders = prevOrders.map(order => 
          order.id === orderId 
            ? { 
                ...order, 
                status: newStatus, 
                updated_at: updateData.updated_at,
                completed_at: updateData.completed_at
              }
            : order
        );

        if (oldOrder && onOrderStatusChange && oldOrder.status !== newStatus) {
          const updatedOrder = newOrders.find(o => o.id === orderId)!;
          onOrderStatusChange(updatedOrder, oldOrder.status);
        }

        return newOrders;
      });

      toast.success(`Order status updated to ${newStatus}`);
      return true;
    } catch (err) {
      console.error('Error updating order:', err);
      toast.error('Failed to update order status');
      return false;
    } finally {
      setProcessingOrders(prev => ({ ...prev, [orderId]: false }));
    }
  }, [supabase, onOrderStatusChange]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    if (refreshInterval > 0) {
      const interval = setInterval(fetchOrders, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchOrders, refreshInterval]);

  useEffect(() => {
    if (!enableRealtime) return;

    const channel = supabase
      .channel('unified-orders-changes')
      .on(
        "postgres_changes" as any,
        {
          event: '*',
          schema: 'public',
          table: 'bartender_orders',
        },
        (payload: RealtimePayload) => {
          if (payload.eventType === 'INSERT' && onNewOrder && payload.new) {
            const newOrderData = payload.new;
            const newOrder: UnifiedOrder = {
              id: newOrderData.id,
              order_number: newOrderData.order_number,
              customer_id: newOrderData.customer_id,
              bartender_id: newOrderData.bartender_id || null,
              status: newOrderData.status as OrderStatus,
              total_amount: typeof newOrderData.total_amount === 'string'
                ? parseFloat(newOrderData.total_amount)
                : newOrderData.total_amount || 0,
              items: parseOrderItems(newOrderData.items),
              notes: newOrderData.notes || null,
              customer_notes: newOrderData.customer_notes || null,
              bartender_notes: newOrderData.bartender_notes || null,
              created_at: newOrderData.created_at,
              updated_at: newOrderData.updated_at,
              completed_at: newOrderData.completed_at || null,
              table_location: newOrderData.table_location,
              tab_id: newOrderData.tab_id,
              location_id: newOrderData.location_id,
              customer: null,
              bartender: null
            };
            onNewOrder(newOrder);
          }
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, enableRealtime, fetchOrders, onNewOrder]);

  const pendingOrders = orders.filter(o => o.status === 'pending');
  const preparingOrders = orders.filter(o => o.status === 'preparing');
  const readyOrders = orders.filter(o => o.status === 'ready');
  const completedOrders = orders.filter(o => o.status === 'completed');

  return {
    orders,
    isLoading,
    error,
    processingOrders,
    fetchOrders,
    updateOrderStatus,
    pendingOrders,
    preparingOrders,
    readyOrders,
    completedOrders,
    lastFetchTime,
  };
}

// Re-export with proper typing
export const useOrderManagement = useUnifiedOrders;
export const useOrders = useUnifiedOrders;
export const useAdminOrders = useUnifiedOrders;

export const useOrder = (orderId: string) => {
  const { orders, ...rest } = useUnifiedOrders();
  const order = orders.find(o => o.id === orderId);
  return { order, ...rest };
};

export type { UnifiedOrder as Order };
export type { UnifiedOrder as AdminOrder };
export type { UnifiedOrder as BartenderOrder };
