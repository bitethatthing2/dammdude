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
  
  // Load initial orders data
  useEffect(() => {
    async function loadInitialOrders() {
      try {
        // Get pending orders - simple query
        const { data: pendingOrdersData, error: pendingError } = await supabase
          .from('orders')
          .select('*')
          .eq('status', 'pending')
          .order('created_at', { ascending: false });
        
        // Get ready orders - simple query
        const { data: readyOrdersData, error: readyError } = await supabase
          .from('orders')
          .select('*')
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
        
        // Get all table IDs from orders
        const tableIds = [...new Set([
          ...(pendingOrdersData?.map((order: Order) => order.table_id) || []),
          ...(readyOrdersData?.map((order: Order) => order.table_id) || [])
        ])].filter(Boolean);
        
        // Fetch table information if we have table IDs
        let tableInfo: Record<string, { name: string, section?: string }> = {};
        
        if (tableIds.length > 0) {
          try {
            const { data: tablesData } = await supabase
              .from('tables')
              .select('id, name, section')
              .in('id', tableIds);
              
            if (tablesData && tablesData.length > 0) {
              // Create a lookup object for tables
              tableInfo = tablesData.reduce((acc: Record<string, { name: string, section?: string }>, table: { id: string, name: string, section?: string }) => {
                acc[table.id] = { name: table.name, section: table.section };
                return acc;
              }, {} as Record<string, { name: string, section?: string }>);
            }
          } catch (tableError) {
            console.error('Error fetching tables:', tableError);
            // Continue with default table names
          }
        }
        
        // Format orders with table names
        const formattedPendingOrders = pendingOrdersData?.map((order: Order) => ({
          id: order.id,
          table_id: order.table_id,
          table_name: tableInfo[order.table_id]?.name || `Table ${order.table_id}`,
          status: order.status,
          created_at: order.created_at,
          total_price: order.total_price || 0,
          customer_notes: order.customer_notes || ''
        })) || [];
        
        const formattedReadyOrders = readyOrdersData?.map((order: Order) => ({
          id: order.id,
          table_id: order.table_id,
          table_name: tableInfo[order.table_id]?.name || `Table ${order.table_id}`,
          status: order.status,
          created_at: order.created_at,
          total_price: order.total_price || 0,
          customer_notes: order.customer_notes || ''
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
