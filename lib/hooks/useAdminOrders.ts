import { useState, useEffect, useCallback } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled' | 'completed';

export interface AdminOrder {
  id: string;
  order_number: number;
  table_id: string;
  table_name?: string;
  status: OrderStatus;
  created_at: string;
  total_amount: number;
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    modifiers?: Array<{
      name: string;
      price: number;
    }>;
  }>;
  notes?: string;
  bartender_notes?: string;
  estimated_time?: number;
  customer_id?: string;
  bartender_id?: string;
  order_type?: string;
  ready_at?: string;
  completed_at?: string;
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
  onNewOrder,
  onOrderStatusChange
}: UseAdminOrdersOptions = {}) {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null);
  const [previousOrderIds, setPreviousOrderIds] = useState<Set<string>>(new Set());

  // Simplified fetch function
  const fetchOrders = useCallback(async () => {
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
        throw new Error(errorData.error || errorData.details || `Server returned ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.orders) {
        throw new Error('Invalid response format: missing orders array');
      }
      
      const newOrders = data.orders || [];
      
      // Detect new orders and trigger callback
      if (onNewOrder && previousOrderIds.size > 0) {
        const newOrdersDetected = newOrders.filter((order: AdminOrder) => 
          !previousOrderIds.has(order.id)
        );
        
        // Call onNewOrder for each newly detected order
        newOrdersDetected.forEach((order: AdminOrder) => {
          onNewOrder(order);
        });
      }
      
      // Update the set of previous order IDs for next comparison
      setPreviousOrderIds(new Set(newOrders.map((order: AdminOrder) => order.id)));
      
      setOrders(newOrders);
      setLastFetchTime(new Date());
      setRetryCount(0); // Reset retry count on success
    } catch (err) {
      console.error('Error fetching orders:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch orders';
      setError(errorMessage);
      
      // Implement exponential backoff for retries
      if (retryCount < 3) {
        const timeout = Math.pow(2, retryCount) * 1000;
        console.log(`Retrying in ${timeout/1000} seconds...`);
        
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          fetchOrders();
        }, timeout);
      } else {
        // Show toast notification after multiple failures
        toast.error('Failed to fetch orders after multiple attempts', {
          description: 'Please check your connection and try again',
          action: {
            label: 'Retry',
            onClick: () => {
              setRetryCount(0);
              fetchOrders();
            }
          }
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [status, retryCount, onNewOrder, previousOrderIds]);
  
  // Initial fetch and polling setup
  useEffect(() => {
    fetchOrders();
    
    // Setup polling for fresh data
    let intervalId: NodeJS.Timeout | null = null;
    if (refreshInterval > 0) {
      intervalId = setInterval(() => {
        fetchOrders();
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
      
      // Update status and set appropriate timestamp
      const updateData: Partial<{
        status: OrderStatus;
        accepted_at: string;
        ready_at: string;
        completed_at: string;
      }> = { status: newStatus };
      
      // Set timestamps based on status
      if (newStatus === 'preparing') {
        updateData.accepted_at = new Date().toISOString();
      } else if (newStatus === 'ready') {
        updateData.ready_at = new Date().toISOString();
      } else if (newStatus === 'completed' || newStatus === 'delivered') {
        updateData.completed_at = new Date().toISOString();
      }
      
      const { error } = await supabase
        .from('bartender_orders') // Fixed: using correct table name
        .update(updateData)
        .eq('id', orderId);
      
      if (error) throw error;
      
      // Optimistically update local state
      setOrders(prevOrders => {
        const oldOrder = prevOrders.find(order => order.id === orderId);
        const updatedOrders = prevOrders.map(order => {
          if (order.id === orderId) {
            const updatedOrder = { ...order, status: newStatus, ...updateData };
            
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
    } catch (err) {
      console.error('Error updating order status:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update order status';
      
      toast.error('Failed to update order status', {
        description: errorMessage
      });
      return false;
    }
  }, [status, onOrderStatusChange]);
  
  // Set estimated preparation time
  const setEstimatedTime = useCallback(async (orderId: string, minutes: number) => {
    try {
      const supabase = getSupabaseBrowserClient();
      
      // Note: bartender_orders table doesn't have estimated_time column
      // You might need to add this column or use a different approach
      const { error } = await supabase
        .from('bartender_orders')
        .update({ 
          bartender_notes: `Estimated time: ${minutes} minutes`
        })
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
    } catch (err) {
      console.error('Error setting estimated time:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to set estimated time';
      
      toast.error('Failed to set estimated time', {
        description: errorMessage
      });
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
