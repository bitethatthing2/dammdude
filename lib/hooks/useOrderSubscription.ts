"use client";

import { useEffect, useState } from 'react';
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
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  menu_item_name?: string;
  quantity: number;
  notes?: string | null;
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
  
  const { onUpdate, onStatusChange, showNotifications = true } = options;
  
  useEffect(() => {
    if (!orderId) return;
    
    const supabase = getSupabaseBrowserClient();
    let subscription: any;
    let isActive = true;
    
    // Fetch initial order data
    async function fetchOrderData() {
      if (!isActive) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Get order details
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .single();
          
        if (orderError) throw orderError;
        
        // Get order items with menu item details
        const { data: itemsData, error: itemsError } = await supabase
          .from('order_items')
          .select(`
            id,
            order_id,
            menu_item_id,
            menu_items(name),
            quantity,
            notes,
            unit_price,
            subtotal
          `)
          .eq('order_id', orderId);
          
        if (itemsError) throw itemsError;
        
        // Format items with menu item names
        const formattedItems = (itemsData || []).map((item: any) => ({
          id: item.id,
          order_id: item.order_id,
          menu_item_id: item.menu_item_id,
          menu_item_name: item.menu_items?.name,
          quantity: item.quantity,
          notes: item.notes,
          unit_price: item.unit_price,
          subtotal: item.subtotal,
        }));
        
        if (isActive) {
          setOrder(orderData);
          setOrderItems(formattedItems);
          
          // Call update handler if provided
          if (onUpdate && orderData) {
            onUpdate(orderData);
          }
        }
      } catch (err: any) {
        console.error('Error fetching order data:', err);
        if (isActive) {
          setError(err.message || 'Failed to load order data');
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }
    
    // Set up real-time subscription
    function setupSubscription() {
      subscription = supabase
        .channel(`order=${orderId}`)
        .on('postgres_changes', 
          { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
          (payload: RealtimePayload) => {
            const updatedOrder = payload.new as Order;
            const previousOrder = payload.old as Order;
            
            // Update local state
            setOrder((prev) => {
              // Handle status change notification/callback
              if (prev && prev.status !== updatedOrder.status) {
                // Call status change handler if provided
                if (onStatusChange) {
                  onStatusChange(prev.status, updatedOrder.status);
                }
                
                // Show notification if enabled
                if (showNotifications && 
                    typeof window !== 'undefined' && 
                    'Notification' in window && 
                    Notification.permission === 'granted') {
                  
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
                }
              }
              
              // Call update handler if provided
              if (onUpdate) {
                onUpdate(updatedOrder);
              }
              
              return updatedOrder;
            });
          }
        )
        .subscribe();
    }
    
    // Initialize
    fetchOrderData();
    setupSubscription();
    
    // Cleanup subscription on unmount
    return () => {
      isActive = false;
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [orderId, onUpdate, onStatusChange, showNotifications]);
  
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
