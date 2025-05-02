"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { formatTimeDistance } from '@/lib/utils/date-utils';

// Define types for order data
export interface Order {
  id: string;
  table_id: string;
  status: 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  created_at: string;
  updated_at: string;
  total_amount: number;
  notes?: string | null;
  estimated_time?: number | null;
  items: any;
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  menu_item_name?: string;
  quantity: number;
  price: number;
  unit_price: number;
  subtotal: number;
}

// Interface for Supabase real-time payload
interface RealtimePayload {
  new: Record<string, any>;
  old: Record<string, any>;
  commit_timestamp: string;
  errors: any[] | null;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  schema: string;
  table: string;
}

type OrderUpdateHandler = (order: Order) => void;

interface UseOrderSubscriptionOptions {
  onUpdate?: OrderUpdateHandler;
  onStatusChange?: (oldStatus: Order['status'], newStatus: Order['status']) => void;
  showNotifications?: boolean;
}

/**
 * Custom hook for subscribing to real-time order updates
 * 
 * @param orderId - The ID of the order to subscribe to
 * @param options - Optional configuration options
 * @returns Object containing order data and loading state
 */
export function useOrderSubscription(
  orderId: string,
  options: UseOrderSubscriptionOptions = {}
) {
  const [order, setOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  
  const { onUpdate, onStatusChange, showNotifications = true } = options;
  
  // Use refs to prevent infinite loops
  const dataFetchedRef = useRef(false);
  const subscriptionSetupRef = useRef(false);
  const orderRef = useRef<Order | null>(null);
  
  // Memoize callbacks to prevent dependency changes
  const memoizedOnUpdate = useCallback(onUpdate || (() => {}), []);
  const memoizedOnStatusChange = useCallback(onStatusChange || (() => {}), []);
  
  useEffect(() => {
    if (!orderId) return;
    
    const supabase = getSupabaseBrowserClient();
    let subscription: any;
    let isActive = true;
    
    // Fetch initial order data
    async function fetchOrderData() {
      if (!isActive || dataFetchedRef.current) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Get order details
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .single();
          
        if (orderError) {
          console.error(`Error fetching order with ID ${orderId}:`, orderError);
          throw new Error(`Failed to fetch order: ${orderError.message || JSON.stringify(orderError)}`);
        }
        
        if (!orderData) {
          console.error(`No order found with ID ${orderId}`);
          throw new Error(`No order found with ID ${orderId}`);
        }
        
        // Parse items from the JSONB items field
        let formattedItems: OrderItem[] = [];
        try {
          const itemsJson = orderData.items;
          const parsedItems = typeof itemsJson === 'string' ? JSON.parse(itemsJson) : itemsJson;
          
          if (Array.isArray(parsedItems)) {
            formattedItems = parsedItems.map((item: any, index: number) => ({
              id: item.id || `${orderId}-item-${index}`,
              order_id: orderId,
              menu_item_id: item.menu_item_id || item.id,
              menu_item_name: item.name,
              quantity: item.quantity || 1,
              price: item.price || 0,
              unit_price: item.unit_price || item.price || 0,
              subtotal: (item.price || 0) * (item.quantity || 1)
            }));
          } else {
            console.warn(`Items field for order ${orderId} is not an array:`, parsedItems);
          }
        } catch (parseError) {
          console.error(`Error parsing items JSON for order ${orderId}:`, parseError);
        }
        
        if (isActive) {
          console.log(`Successfully fetched order ${orderId} with ${formattedItems.length} items`);
          setOrder(orderData);
          orderRef.current = orderData;
          setOrderItems(formattedItems);
          dataFetchedRef.current = true;
          setIsReady(true);
        }
      } catch (err: any) {
        const errorMessage = err.message || 'Unknown error fetching order data';
        console.error(`Error fetching order data for ${orderId}:`, err);
        if (isActive) {
          setError(errorMessage);
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }
    
    // Initialize
    fetchOrderData();
    
    // Set up real-time subscription only if not already set up
    const setupSubscription = () => {
      if (!isActive || subscriptionSetupRef.current) return;
      subscriptionSetupRef.current = true;
      
      try {
        subscription = supabase
          .channel(`order=${orderId}`)
          .on('postgres_changes', 
            { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
            (payload: RealtimePayload) => {
              if (!isActive) return;
              
              const updatedOrder = payload.new as Order;
              
              // Only update if there's an actual change
              if (!orderRef.current || 
                  JSON.stringify(orderRef.current) === JSON.stringify(updatedOrder)) {
                return;
              }
              
              // Handle status change notification/callback
              if (orderRef.current.status !== updatedOrder.status) {
                try {
                  memoizedOnStatusChange(orderRef.current.status, updatedOrder.status);
                } catch (err) {
                  console.error('Error in status change handler:', err);
                }
                
                // Show notification if enabled
                if (showNotifications && 
                    typeof window !== 'undefined' && 
                    'Notification' in window && 
                    Notification.permission === 'granted') {
                  
                  try {
                    // Special notification for order ready
                    if (updatedOrder.status === 'ready') {
                      new Notification('Your Order is Ready!', {
                        body: 'Please pick up your order at the counter.',
                        icon: '/icons/icon-192x192.png',
                      });
                    } else {
                      new Notification(`Order Status: ${updatedOrder.status.toUpperCase()}`, {
                        body: `Your order has been updated to ${updatedOrder.status} ${formatTimeDistance(updatedOrder.updated_at)}.`,
                        icon: '/icons/icon-192x192.png',
                      });
                    }
                  } catch (err) {
                    console.error('Error showing notification:', err);
                  }
                }
              }
              
              // Update refs and state
              orderRef.current = updatedOrder;
              setOrder(updatedOrder);
              
              // Call update handler if provided
              try {
                memoizedOnUpdate(updatedOrder);
              } catch (err) {
                console.error('Error in update handler:', err);
              }
            }
          )
          .subscribe();
      } catch (err) {
        console.error('Error setting up subscription:', err);
      }
    };
    
    // Set up subscription after a short delay to ensure initial data is loaded
    const subscriptionTimer = setTimeout(setupSubscription, 1000);
    
    // Cleanup subscription on unmount
    return () => {
      isActive = false;
      clearTimeout(subscriptionTimer);
      
      if (subscription) {
        try {
          subscription.unsubscribe();
        } catch (err) {
          console.error('Error unsubscribing:', err);
        }
      }
    };
  }, [orderId, showNotifications]); // Remove dependencies that could change
  
  return {
    order,
    orderItems,
    isLoading,
    error,
    // Helper computed properties
    isReady: order?.status === 'ready',
    isPending: order?.status === 'pending',
    isPreparing: order?.status === 'preparing',
    isDelivered: order?.status === 'delivered',
    isCancelled: order?.status === 'cancelled',
  };
}
