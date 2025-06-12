"use client";

import { useState, useEffect, useCallback } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Order, OrderItem, OrderStatus } from '@/lib/types/order';
import { toast } from '@/components/ui/use-toast';

interface UseOrderManagementOptions {
  status?: OrderStatus[];
  refreshInterval?: number;
  enableRealtime?: boolean;
  onNewOrder?: (order: Order) => void;
  onOrderStatusChange?: (order: Order, previousStatus: OrderStatus) => void;
}

/**
 * Unified hook for order management functionality
 * Supports both admin and employee interfaces
 */
export function useOrderManagement({
  status = ['pending'],
  refreshInterval = 60000,
  enableRealtime = true,
  onNewOrder,
  onOrderStatusChange
}: UseOrderManagementOptions = {}) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [processingOrders, setProcessingOrders] = useState<Record<string, boolean>>({});
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null);
  
  // Fetch orders from API
  const fetchOrders = useCallback(async (forceRefresh = false) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Create query parameters from status array
      const queryParams = new URLSearchParams();
      if (status && status.length > 0) {
        status.forEach(s => queryParams.append('status', s));
      }
      
      // Fetch orders from the API
      const response = await fetch(`/api/admin/orders?${queryParams.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Server returned ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.orders) {
        throw new Error('Invalid response format: missing orders array');
      }
      
      setOrders(data.orders || []);
      setLastFetchTime(new Date());
    } catch (err: unknown) {
      console.error('Error fetching orders:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [status]);
  
  // Initial fetch and polling setup
  useEffect(() => {
    fetchOrders();
    
    // Setup polling if enabled
    let intervalId: NodeJS.Timeout | null = null;
    if (refreshInterval > 0) {
      intervalId = setInterval(() => {
        fetchOrders(true);
      }, refreshInterval);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [fetchOrders, refreshInterval]);
  
  // Setup realtime subscriptions
  useEffect(() => {
    if (!enableRealtime) return;
    
    const supabase = getSupabaseBrowserClient();
    
    // Create channel for orders table changes
    const channel = supabase.channel('orders-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders'
      }, (payload: {
        eventType: 'INSERT' | 'UPDATE' | 'DELETE';
        new?: Record<string, unknown>;
        old?: Record<string, unknown>;
      }) => {
        const { eventType, new: newRecord, old: oldRecord } = payload;
        
        // Handle new orders
        if (eventType === 'INSERT') {
          const newOrder = newRecord as unknown as Order;
          
          // Only add if status matches our filter
          if (status.includes(newOrder.status)) {
            setOrders(prev => [newOrder, ...prev]);
            
            // Call onNewOrder callback if provided
            if (onNewOrder) {
              onNewOrder(newOrder);
            }
            
            // Play notification sound
            try {
              const audio = new Audio('/sounds/new-order.mp3');
              audio.play().catch(err => console.error('Error playing sound:', err));
            } catch (err) {
              console.error('Error with notification sound:', err);
            }
          }
        }
        
        // Handle order updates
        else if (eventType === 'UPDATE') {
          const updatedOrder = newRecord as unknown as Order;
          const oldOrder = oldRecord as unknown as Order;
          
          setOrders(prev => {
            // Order not in our list but status now matches our filter - add it
            if (!prev.some(o => o.id === updatedOrder.id) && status.includes(updatedOrder.status)) {
              return [updatedOrder, ...prev];
            }
            
            // Order in our list but status no longer matches - remove it
            if (!status.includes(updatedOrder.status)) {
              return prev.filter(o => o.id !== updatedOrder.id);
            }
            
            // Order status changed but still in our filter - update it
            return prev.map(o => {
              if (o.id === updatedOrder.id) {
                // Call status change callback if provided
                if (onOrderStatusChange && o.status !== updatedOrder.status) {
                  onOrderStatusChange(updatedOrder, o.status);
                }
                
                return { ...o, ...updatedOrder };
              }
              return o;
            });
          });
        }
        
        // Handle order deletions
        else if (eventType === 'DELETE') {
          const deletedOrder = oldRecord as unknown as Order;
          setOrders(prev => prev.filter(o => o.id !== deletedOrder.id));
        }
      })
      .subscribe();
    
    // Cleanup subscription
    return () => {
      supabase.channel('orders-changes').unsubscribe();
    };
  }, [enableRealtime, status, onNewOrder, onOrderStatusChange]);
  
  // Update order status
  const updateOrderStatus = useCallback(async (orderId: string, newStatus: OrderStatus) => {
    try {
      // Mark as processing
      setProcessingOrders(prev => ({ ...prev, [orderId]: true }));
      
      // Server API call
      const response = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Server returned ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      // Optimistic update (will be overwritten by realtime subscription if needed)
      setOrders(prev => {
        // If new status isn't in our filter, remove the order
        if (!status.includes(newStatus)) {
          return prev.filter(o => o.id !== orderId);
        }
        
        // Otherwise update the status
        return prev.map(o => {
          if (o.id === orderId) {
            // If the order status is changing, track previous status for callback
            const prevStatus = o.status;
            const updatedOrder = { ...o, status: newStatus };
            
            // Call status change callback if provided
            if (onOrderStatusChange && prevStatus !== newStatus) {
              onOrderStatusChange(updatedOrder, prevStatus);
            }
            
            return updatedOrder;
          }
          return o;
        });
      });
      
      // Show success toast
      toast({
        title: 'Order Updated',
        description: `Order status changed to ${newStatus}`
      });
      
      return { success: true, ...result };
    } catch (err: unknown) {
      console.error('Error updating order status:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update order status';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
      
      return { success: false, error: errorMessage };
    } finally {
      // Clear processing state
      setProcessingOrders(prev => ({ ...prev, [orderId]: false }));
    }
  }, [status, onOrderStatusChange]);
  
  // Helper functions to get orders by status
  const getOrdersByStatus = useCallback((orderStatus: OrderStatus) => {
    return orders.filter(order => order.status === orderStatus);
  }, [orders]);
  
  // Return hook value
  return {
    orders,
    isLoading,
    error,
    processingOrders,
    lastFetchTime,
    fetchOrders,
    updateOrderStatus,
    pendingOrders: getOrdersByStatus('pending'),
    preparingOrders: getOrdersByStatus('preparing'),
    readyOrders: getOrdersByStatus('ready'),
    completedOrders: getOrdersByStatus('completed')
  };
}
