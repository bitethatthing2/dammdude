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
  const [supabase, setSupabase] = useState<any>(null);
  
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

  // Initialize Supabase client on the client side only
  useEffect(() => {
    // Only import the Supabase client on the client side
    if (typeof window !== 'undefined') {
      setSupabase(getSupabaseBrowserClient());
    }
  }, []);

  // Load initial orders data
  useEffect(() => {
    // Skip if Supabase client isn't initialized yet
    if (!supabase) return;
    
    async function loadInitialOrders() {
      try {
        console.log('Fetching orders via API...');
        
        // Add error handling timeouts to prevent hanging requests
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        // Use the API endpoint with proper error handling, following the pattern from useAdminOrders.ts
        const pendingQueryParams = new URLSearchParams();
        pendingQueryParams.append('status', 'pending');
        
        const readyQueryParams = new URLSearchParams();
        readyQueryParams.append('status', 'ready');
        
        // Use Promise.all to fetch both endpoints in parallel, with better error handling
        try {
          const [pendingResponsePromise, readyResponsePromise] = await Promise.all([
            fetch(`/api/admin/orders?${pendingQueryParams.toString()}`, {
              signal: controller.signal,
              headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
              }
            }).catch(err => {
              console.error('Network error fetching pending orders:', err);
              throw err; // Rethrow to be caught by the outer try/catch
            }),
            
            fetch(`/api/admin/orders?${readyQueryParams.toString()}`, {
              signal: controller.signal,
              headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
              }
            }).catch(err => {
              console.error('Network error fetching ready orders:', err);
              throw err; // Rethrow to be caught by the outer try/catch
            })
          ]);
          
          clearTimeout(timeoutId);
          
          // Process responses
          console.log('Pending orders response status:', pendingResponsePromise.status);
          console.log('Ready orders response status:', readyResponsePromise.status);
          
          // Parse responses with improved error handling
          const pendingData = pendingResponsePromise.ok 
            ? await pendingResponsePromise.json().catch(err => {
                console.error('Error parsing pending orders JSON:', err);
                return { orders: [] };
              }) 
            : { orders: [] };
          
          const readyData = readyResponsePromise.ok 
            ? await readyResponsePromise.json().catch(err => {
                console.error('Error parsing ready orders JSON:', err);
                return { orders: [] };
              }) 
            : { orders: [] };
          
          // Log response details for debugging
          if (!pendingResponsePromise.ok) {
            console.error('Error fetching pending orders:', {
              status: pendingResponsePromise.status,
              statusText: pendingResponsePromise.statusText,
              body: await pendingResponsePromise.text().catch(() => 'Failed to read response text')
            });
          }
          
          if (!readyResponsePromise.ok) {
            console.error('Error fetching ready orders:', {
              status: readyResponsePromise.status,
              statusText: readyResponsePromise.statusText,
              body: await readyResponsePromise.text().catch(() => 'Failed to read response text')
            });
          }
          
          // Debug data structure
          if (pendingData.orders && pendingData.orders.length > 0) {
            console.log('Sample pending order structure:', JSON.stringify(pendingData.orders[0], null, 2));
          }
          
          // Safely check and set orders with proper defaults
          const validPendingOrders = Array.isArray(pendingData.orders) ? pendingData.orders : [];
          const validReadyOrders = Array.isArray(readyData.orders) ? readyData.orders : [];
          
          // Set orders safely with defaults and proper typing
          setPendingOrders(validPendingOrders);
          setReadyOrders(validReadyOrders);
          setNewOrdersCount(validPendingOrders.length);
          
          console.log(`Successfully loaded ${validPendingOrders.length} pending orders and ${validReadyOrders.length} ready orders`);
          
        } catch (fetchError) {
          console.error('API fetch error:', fetchError);
          setPendingOrders([]);
          setReadyOrders([]);
          setNewOrdersCount(0);
          
          // Re-throw to the outer catch for proper error logging
          throw fetchError;
        }
        
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
          try {
            // New order created
            const newOrder = payload.new as Order;
            
            // Try to get table name using API call instead of direct query
            let orderWithTableName = { ...newOrder };
            
            try {
              // Add controller to prevent hanging requests
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
              
              // More robust fetch
              const response = await fetch(`/api/admin/tables/${newOrder.table_id}`, {
                signal: controller.signal,
                headers: {
                  'Cache-Control': 'no-cache'
                }
              });
              
              clearTimeout(timeoutId);
              
              if (response.ok) {
                try {
                  const tableData = await response.json();
                  orderWithTableName.table_name = tableData.name || `Table ${newOrder.table_id}`;
                } catch (jsonError) {
                  console.error('Error parsing table JSON:', jsonError);
                  orderWithTableName.table_name = `Table ${newOrder.table_id}`;
                }
              } else {
                console.error('Error fetching table data:', {
                  status: response.status, 
                  statusText: response.statusText,
                  body: await response.text().catch(() => 'Could not read response body')
                });
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
          } catch (error) {
            console.error('Error processing new order notification:', error);
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
  }, [supabase]); // Only run this effect when supabase client is available
  
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