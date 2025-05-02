import { useState, useEffect, useCallback } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled' | 'completed';

export interface AdminOrder {
  id: string;
  table_id: string;
  table_name?: string;
  status: OrderStatus;
  created_at: string;
  total_amount: number;
  items: any[];
  notes?: string;
  estimated_time?: number;
}

interface UseAdminOrdersOptions {
  status?: OrderStatus[];
  refreshInterval?: number;
  enableRealtime?: boolean;
  onNewOrder?: (order: AdminOrder) => void;
  onOrderStatusChange?: (order: AdminOrder, previousStatus: OrderStatus) => void;
}

/**
 * Custom hook for managing orders in admin interfaces
 * Includes robust error handling, retry logic, and real-time updates
 */
export function useAdminOrders({
  status = ['pending'],
  refreshInterval = 60000,
  enableRealtime = true,
  onNewOrder,
  onOrderStatusChange
}: UseAdminOrdersOptions = {}) {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null);

  // Simplified fetch function
  const fetchOrders = useCallback(async (forceRefresh = false) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Use dedicated API endpoint instead of direct Supabase call
      const queryParams = new URLSearchParams();
      if (status && status.length > 0) {
        status.forEach(s => queryParams.append('status', s));
      }
      
      console.log(`Fetching orders with params: ${queryParams.toString()}`);
      
      const response = await fetch(`/api/admin/orders?${queryParams.toString()}`);
      
      // Handle HTTP errors
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
      setRetryCount(0); // Reset retry count on success
    } catch (err: any) {
      console.error('Error fetching orders:', err);
      setError(err.message || 'Failed to fetch orders');
      
      // Implement exponential backoff for retries
      if (retryCount < 3) {
        const timeout = Math.pow(2, retryCount) * 1000;
        console.log(`Retrying in ${timeout/1000} seconds...`);
        
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          fetchOrders(true);
        }, timeout);
      } else {
        // Show toast notification after multiple failures
        toast.error('Failed to fetch orders after multiple attempts', {
          description: 'Please check your connection and try again',
          action: {
            label: 'Retry',
            onClick: () => {
              setRetryCount(0);
              fetchOrders(true);
            }
          }
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [status, retryCount]);
  
  // Initial fetch and polling setup
  useEffect(() => {
    fetchOrders();
    
    // Setup polling for fresh data
    let intervalId: NodeJS.Timeout | null = null;
    if (refreshInterval > 0) {
      intervalId = setInterval(() => {
        fetchOrders(true);
      }, refreshInterval);
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [fetchOrders, refreshInterval]);
  
  // Helper functions to filter orders
  const filterOrdersByStatus = (orders: AdminOrder[], statusFilter: OrderStatus): AdminOrder[] => {
    return orders.filter(order => order.status === statusFilter);
  };
  
  // Update order status function
  const updateOrderStatus = useCallback(async (orderId: string, newStatus: OrderStatus) => {
    try {
      const supabase = getSupabaseBrowserClient();
      
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);
      
      if (error) throw error;
      
      // Optimistically update local state
      setOrders(prevOrders => {
        const oldOrder = prevOrders.find(order => order.id === orderId);
        const updatedOrders = prevOrders.map(order => {
          if (order.id === orderId) {
            const updatedOrder = { ...order, status: newStatus };
            
            // Trigger callback if provided and status actually changed
            if (onOrderStatusChange && oldOrder && oldOrder.status !== newStatus) {
              onOrderStatusChange(updatedOrder, oldOrder.status);
            }
            
            return updatedOrder;
          }
          return order;
        });
        
        // If new status is not in our filter, remove the order
        if (!status.includes(newStatus)) {
          return updatedOrders.filter(order => order.id !== orderId);
        }
        
        return updatedOrders;
      });
      
      toast.success(`Order status updated to ${newStatus}`);
      return true;
    } catch (err: any) {
      console.error('Error updating order status:', err);
      
      toast.error('Failed to update order status');
      return false;
    }
  }, [status, onOrderStatusChange]);
  
  // Set estimated preparation time
  const setEstimatedTime = useCallback(async (orderId: string, minutes: number) => {
    try {
      const supabase = getSupabaseBrowserClient();
      
      const { error } = await supabase
        .from('orders')
        .update({ estimated_time: minutes })
        .eq('id', orderId);
      
      if (error) throw error;
      
      // Optimistically update local state
      setOrders(prevOrders => {
        return prevOrders.map(order => {
          if (order.id === orderId) {
            return { ...order, estimated_time: minutes };
          }
          return order;
        });
      });
      
      toast.success(`Estimated time set to ${minutes} minutes`);
      return true;
    } catch (err: any) {
      console.error('Error setting estimated time:', err);
      
      toast.error('Failed to set estimated time');
      return false;
    }
  }, []);
  
  const pendingOrders = filterOrdersByStatus(orders, 'pending');
  const preparingOrders = filterOrdersByStatus(orders, 'preparing');
  const readyOrders = filterOrdersByStatus(orders, 'ready');
  const completedOrders = filterOrdersByStatus(orders, 'completed');
  
  return {
    orders,
    isLoading,
    error,
    fetchOrders,
    updateOrderStatus,
    setEstimatedTime,
    pendingOrders,
    preparingOrders,
    readyOrders,
    completedOrders,
    lastFetchTime
  };
}