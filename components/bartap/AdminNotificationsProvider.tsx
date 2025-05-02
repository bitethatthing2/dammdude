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
  total_amount?: number;
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
  
  // Load initial orders data
  useEffect(() => {
    async function loadInitialOrders() {
      try {
        // Get pending orders with table information
        const { data: pendingOrdersData, error: pendingError } = await supabase
          .from('orders')
          .select(`
            id,
            table_id,
            status,
            created_at,
            total_amount,
            tables!inner (
              name,
              section
            )
          `)
          .eq('status', 'pending')
          .order('created_at', { ascending: false });
        
        // Get ready orders with table information
        const { data: readyOrdersData, error: readyError } = await supabase
          .from('orders')
          .select(`
            id,
            table_id,
            status,
            created_at,
            total_amount,
            tables!inner (
              name,
              section
            )
          `)
          .eq('status', 'ready')
          .order('created_at', { ascending: false });
          
        if (pendingError) {
          console.error('Error fetching pending orders:', pendingError);
          setPendingOrders([]);
          return;
        }
        
        if (readyError) {
          console.error('Error fetching ready orders:', readyError);
          setReadyOrders([]);
          return;
        }
        
        // Format orders with table names
        const formattedPendingOrders = pendingOrdersData?.map((order: any) => ({
          id: order.id,
          table_id: order.table_id,
          table_name: order.tables?.name || `Table ${order.table_id}`,
          status: order.status,
          created_at: order.created_at,
          total_amount: order.total_amount || 0
        })) || [];
        
        const formattedReadyOrders = readyOrdersData?.map((order: any) => ({
          id: order.id,
          table_id: order.table_id,
          table_name: order.tables?.name || `Table ${order.table_id}`,
          status: order.status,
          created_at: order.created_at,
          total_amount: order.total_amount || 0
        })) || [];
        
        setPendingOrders(formattedPendingOrders);
        setReadyOrders(formattedReadyOrders);
        setNewOrdersCount(formattedPendingOrders.length);
      } catch (error) {
        console.error('Error loading initial orders:', error);
        // Don't let this error break the component
        setPendingOrders([]);
        setReadyOrders([]);
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
          
          // Get table name
          const { data: tableData } = await supabase
            .from('tables')
            .select('name')
            .eq('id', newOrder.table_id)
            .single();
            
          const orderWithTableName = {
            ...newOrder,
            table_name: tableData?.name || `Table ${newOrder.table_id}`,
          };
          
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
