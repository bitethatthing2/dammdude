import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';
import { 
  OrderWithDetails, 
  OrderFilters, 
  parseOrderItems,
  isOrderActive 
} from '@/types/order';

// Initialize Supabase client with proper typing
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
) as ReturnType<typeof createClient<Database>>;

// Types for user data from joins
interface UserBasicInfo {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
}

interface UseOrdersOptions {
  customerId?: string;
  bartenderId?: string;
  filters?: OrderFilters;
  realtime?: boolean;
  activeOnly?: boolean;
}

interface UseOrdersReturn {
  orders: OrderWithDetails[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  cancelOrder: (orderId: string) => Promise<boolean>;
}

export function useOrders({
  customerId,
  bartenderId,
  filters = {},
  realtime = true,
  activeOnly = false
}: UseOrdersOptions = {}): UseOrdersReturn {
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('bartender_orders')
        .select(`
          *,
          customer:users!bartender_orders_customer_id_fkey(
            id,
            first_name,
            last_name,
            email
          ),
          bartender:users!bartender_orders_bartender_id_fkey(
            id,
            first_name,
            last_name
          )
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (customerId) {
        query = query.eq('customer_id', customerId);
      }
      
      if (bartenderId) {
        query = query.eq('bartender_id', bartenderId);
      }

      if (filters.status?.length) {
        query = query.in('status', filters.status);
      }

      if (filters.order_type?.length) {
        query = query.in('order_type', filters.order_type);
      }

      if (filters.location_id) {
        query = query.eq('location_id', filters.location_id);
      }

      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from.toISOString());
      }

      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to.toISOString());
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      // Parse orders with items and proper typing
      let parsedOrders: OrderWithDetails[] = (data || []).map(order => ({
        ...order,
        items: parseOrderItems(order.items),
        customer: order.customer as UserBasicInfo | null,
        bartender: order.bartender as UserBasicInfo | null
      }));

      // Filter active orders if requested
      if (activeOnly) {
        parsedOrders = parsedOrders.filter(order => isOrderActive(order.status));
      }

      setOrders(parsedOrders);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  }, [customerId, bartenderId, filters, activeOnly]);

  const cancelOrder = useCallback(async (orderId: string): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('bartender_orders')
        .update({ 
          status: 'cancelled',
          completed_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (updateError) throw updateError;

      // Update local state
      setOrders(prev => 
        prev.map(order => 
          order.id === orderId 
            ? { ...order, status: 'cancelled', completed_at: new Date().toISOString() }
            : order
        )
      );

      return true;
    } catch (err) {
      console.error('Error cancelling order:', err);
      setError(err instanceof Error ? err.message : 'Failed to cancel order');
      return false;
    }
  }, []);

  const fetchSingleOrder = useCallback(async (orderId: string): Promise<OrderWithDetails | null> => {
    try {
      const { data, error } = await supabase
        .from('bartender_orders')
        .select(`
          *,
          customer:users!bartender_orders_customer_id_fkey(
            id,
            first_name,
            last_name,
            email
          ),
          bartender:users!bartender_orders_bartender_id_fkey(
            id,
            first_name,
            last_name
          )
        `)
        .eq('id', orderId)
        .single();

      if (error) throw error;

      return {
        ...data,
        items: parseOrderItems(data.items),
        customer: data.customer as UserBasicInfo | null,
        bartender: data.bartender as UserBasicInfo | null
      };
    } catch (err) {
      console.error('Error fetching single order:', err);
      return null;
    }
  }, []);

  const handleRealtimeUpdate = useCallback(async (payload: any) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    switch (eventType) {
      case 'INSERT':
        // Fetch full order with relations
        const newOrder = await fetchSingleOrder(newRecord.id);
        if (newOrder) {
          setOrders(prev => [newOrder, ...prev]);
        }
        break;

      case 'UPDATE':
        // Fetch updated order with relations
        const updatedOrder = await fetchSingleOrder(newRecord.id);
        if (updatedOrder) {
          setOrders(prev => 
            prev.map(order => 
              order.id === updatedOrder.id ? updatedOrder : order
            )
          );
        }
        break;

      case 'DELETE':
        setOrders(prev => prev.filter(order => order.id !== oldRecord.id));
        break;
    }
  }, [fetchSingleOrder]);

  // Initial fetch
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Real-time subscription
  useEffect(() => {
    if (!realtime) return;

    // Clean up previous subscription
    if (channelRef.current) {
      channelRef.current.unsubscribe();
    }

    // Create new channel with unique name
    const channelName = `orders-${customerId || 'all'}-${Date.now()}`;
    const channel = supabase.channel(channelName);

    // Build subscription configuration
    const subscriptionConfig: any = {
      event: '*',
      schema: 'public',
      table: 'bartender_orders'
    };

    // Add filters if specified
    if (customerId) {
      subscriptionConfig.filter = `customer_id=eq.${customerId}`;
    } else if (bartenderId) {
      subscriptionConfig.filter = `bartender_id=eq.${bartenderId}`;
    }

    // Subscribe to changes
    channel
      .on('postgres_changes', subscriptionConfig, handleRealtimeUpdate)
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Subscribed to order updates');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Subscription error');
          setError('Failed to subscribe to real-time updates');
        }
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
    };
  }, [customerId, bartenderId, realtime, handleRealtimeUpdate]);

  return {
    orders,
    loading,
    error,
    refetch: fetchOrders,
    cancelOrder
  };
}

// Hook for single order
export function useOrder(orderId: string) {
  const [order, setOrder] = useState<OrderWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const fetchOrder = useCallback(async () => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('bartender_orders')
        .select(`
          *,
          customer:users!bartender_orders_customer_id_fkey(
            id,
            first_name,
            last_name,
            email
          ),
          bartender:users!bartender_orders_bartender_id_fkey(
            id,
            first_name,
            last_name
          )
        `)
        .eq('id', orderId)
        .single();

      if (fetchError) throw fetchError;

      setOrder({
        ...data,
        items: parseOrderItems(data.items),
        customer: data.customer as UserBasicInfo | null,
        bartender: data.bartender as UserBasicInfo | null
      });
    } catch (err) {
      console.error('Error fetching order:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch order');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  // Initial fetch
  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  // Real-time subscription for single order
  useEffect(() => {
    if (!orderId) return;

    // Clean up previous subscription
    if (channelRef.current) {
      channelRef.current.unsubscribe();
    }

    // Real-time subscription for single order
    const channel = supabase
      .channel(`order-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bartender_orders',
          filter: `id=eq.${orderId}`
        },
        async (payload) => {
          // Fetch updated order with relations
          const { data, error } = await supabase
            .from('bartender_orders')
            .select(`
              *,
              customer:users!bartender_orders_customer_id_fkey(
                id,
                first_name,
                last_name,
                email
              ),
              bartender:users!bartender_orders_bartender_id_fkey(
                id,
                first_name,
                last_name
              )
            `)
            .eq('id', orderId)
            .single();

          if (!error && data) {
            setOrder({
              ...data,
              items: parseOrderItems(data.items),
              customer: data.customer as UserBasicInfo | null,
              bartender: data.bartender as UserBasicInfo | null
            });
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Subscribed to order ${orderId} updates`);
        }
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
    };
  }, [orderId]);

  return { order, loading, error, refetch: fetchOrder };
}