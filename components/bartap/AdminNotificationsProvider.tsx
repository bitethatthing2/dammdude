"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Bell } from 'lucide-react';

interface Order {
  id: string;
  table_id: string;
  table_name?: string;
  status: 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  created_at: string;
  total_price?: number;
  customer_notes?: string;
}

interface AdminNotificationsContextType {
  pendingOrders: Order[];
  readyOrders: Order[];
  markOrderAsViewed: (orderId: string) => void;
  newOrdersCount: number;
}

// Types for Supabase real-time payloads
interface RealtimePayload<T> {
  new: T;
  old: T;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
}

const AdminNotificationsContext = createContext<AdminNotificationsContextType | undefined>(undefined);

/**
 * Provides real-time notifications for staff about order updates
 * Uses Supabase real-time subscriptions to monitor order status changes
 */
export function AdminNotificationsProvider({ children }: { children: ReactNode }) {
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [readyOrders, setReadyOrders] = useState<Order[]>([]);
  const [viewedOrders, setViewedOrders] = useState<Set<string>>(new Set());
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const supabase = getSupabaseBrowserClient();
  
  // Helper function to get value from different possible field names
  function getFieldValue(obj: any, fieldNames: string[], defaultValue: any = null): any {
    if (!obj) return defaultValue;
    
    for (const field of fieldNames) {
      if (obj[field] !== undefined) {
        return obj[field];
      }
    }
    
    return defaultValue;
  }

  // Load initial orders data
  useEffect(() => {
    async function loadInitialOrders() {
      try {
        console.log('Fetching orders via API...');
        
        // Use the API endpoint instead of direct Supabase queries
        const pendingResponse = await fetch('/api/admin/orders?status=pending');
        const readyResponse = await fetch('/api/admin/orders?status=ready');
        
        // Log any HTTP errors
        if (!pendingResponse.ok) {
          console.error('Error fetching pending orders:', 
            pendingResponse.status, pendingResponse.statusText);
        }
        
        if (!readyResponse.ok) {
          console.error('Error fetching ready orders:', 
            readyResponse.status, readyResponse.statusText);
        }
        
        // Parse the responses
        const pendingData = pendingResponse.ok ? await pendingResponse.json() : { orders: [] };
        const readyData = readyResponse.ok ? await readyResponse.json() : { orders: [] };
        
        // Log the first order structure for debugging
        if (pendingData.orders && pendingData.orders.length > 0) {
          console.log('Sample pending order structure:', JSON.stringify(pendingData.orders[0], null, 2));
        }
        
        setPendingOrders(pendingData.orders || []);
        setReadyOrders(readyData.orders || []);
        setNewOrdersCount(pendingData.orders?.length || 0);
      } catch (error) {
        console.error('Error loading initial orders:', error);
        setPendingOrders([]);
        setReadyOrders([]);
        setNewOrdersCount(0);
      }
    }
    
    // Load initial data
    loadInitialOrders();
    
    // Set up real-time subscriptions for order updates
    const ordersSubscription = supabase
      .channel('admin-orders')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'orders' },
        async (payload: RealtimePayload<Order>) => {
          // New order created
          const newOrder = payload.new as Order;
          
          // Try to get table name using API call instead of direct query
          let orderWithTableName = { ...newOrder };
          
          try {
            const response = await fetch(`/api/admin/tables/${newOrder.table_id}`);
            if (response.ok) {
              const tableData = await response.json();
              orderWithTableName.table_name = tableData.name || `Table ${newOrder.table_id}`;
            } else {
              orderWithTableName.table_name = `Table ${newOrder.table_id}`;
            }
          } catch (err) {
            console.error('Error fetching table name:', err);
            orderWithTableName.table_name = `Table ${newOrder.table_id}`;
          }
          
          if (newOrder.status === 'pending') {
            setPendingOrders(prev => [orderWithTableName, ...prev]);
            setNewOrdersCount(prev => prev + 1);
            
            // Show notification for new order
            toast.message(
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                <span>New Order</span>
              </div>,
              {
                description: `New order from ${orderWithTableName.table_name}`,
                duration: 5000,
                action: {
                  label: 'View',
                  onClick: () => window.location.href = `/admin/orders/${orderWithTableName.id}`,
                },
              }
            );
            
            // Play sound if browser supports it
            if (typeof Audio !== 'undefined') {
              const audio = new Audio('/sounds/notification.mp3');
              audio.play().catch(error => {
                console.error('Error playing notification sound:', error);
              });
            }
          }
        }
      )
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        (payload: RealtimePayload<Order>) => {
          const updatedOrder = payload.new as Order;
          
          // Handle status transitions
          if (updatedOrder.status === 'pending') {
            // Added to pending
            setPendingOrders(prev => {
              if (!prev.some(order => order.id === updatedOrder.id)) {
                return [updatedOrder, ...prev];
              }
              return prev.map(order => 
                order.id === updatedOrder.id ? {...order, ...updatedOrder} : order
              );
            });
            
            // Remove from ready if it was there
            setReadyOrders(prev => 
              prev.filter(order => order.id !== updatedOrder.id)
            );
          } else if (updatedOrder.status === 'ready') {
            // Move from pending to ready
            setPendingOrders(prev => 
              prev.filter(order => order.id !== updatedOrder.id)
            );
            
            setReadyOrders(prev => {
              if (!prev.some(order => order.id === updatedOrder.id)) {
                return [updatedOrder, ...prev];
              }
              return prev.map(order => 
                order.id === updatedOrder.id ? {...order, ...updatedOrder} : order
              );
            });
          } else if (['delivered', 'cancelled'].includes(updatedOrder.status)) {
            // Remove from both lists
            setPendingOrders(prev => 
              prev.filter(order => order.id !== updatedOrder.id)
            );
            
            setReadyOrders(prev => 
              prev.filter(order => order.id !== updatedOrder.id)
            );
          }
        }
      )
      .subscribe();
      
    // Cleanup subscription on unmount
    return () => {
      ordersSubscription.unsubscribe();
    };
  }, [supabase]);
  
  // Mark an order as viewed to reduce notification count
  const markOrderAsViewed = (orderId: string) => {
    setViewedOrders(prev => {
      const newSet = new Set(prev);
      newSet.add(orderId);
      return newSet;
    });
    
    // Recalculate unviewed orders count
    const unviewedOrders = pendingOrders.filter(order => !viewedOrders.has(order.id));
    setNewOrdersCount(unviewedOrders.length);
  };
  
  // Context value
  const contextValue = {
    pendingOrders,
    readyOrders,
    markOrderAsViewed,
    newOrdersCount
  };
  
  return (
    <AdminNotificationsContext.Provider value={contextValue}>
      {children}
    </AdminNotificationsContext.Provider>
  );
}

/**
 * Hook to use admin notifications context
 */
export function useAdminNotifications() {
  const context = useContext(AdminNotificationsContext);
  
  if (context === undefined) {
    throw new Error('useAdminNotifications must be used within an AdminNotificationsProvider');
  }
  
  return context;
}