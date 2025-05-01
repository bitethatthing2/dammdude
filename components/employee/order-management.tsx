'use client';

import { useState, useEffect } from 'react';
import { Bell, Check, Clock, Coffee } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Database } from '@/lib/database.types';

// Define order status types
type OrderStatus = 'pending' | 'preparing' | 'ready' | 'completed';

// Define order interface
interface OrderItem {
  id: number;
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: number;
  table_number: number;
  status: OrderStatus;
  order_time: string;
  total_amount: number;
  items: OrderItem[];
}

export function OrderManagement() {
  const [isLoading, setIsLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<OrderStatus>('pending');
  
  // Fetch orders on mount and set up real-time subscription
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    let isActive = true; // Flag to prevent state updates after unmount
    
    const fetchOrders = async () => {
      if (!isActive) return;
      
      try {
        setIsLoading(true);
        
        // Fetch all orders with their items
        const { data, error } = await supabase
          .from('orders')
          .select(`
            *,
            order_items:order_items(*)
          `)
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        
        // Format orders
        const formattedOrders = data?.map((order: Database['public']['Tables']['orders']['Row'] & { order_items: Database['public']['Tables']['order_items']['Row'][] }) => ({
          id: order.id,
          table_number: order.table_id,
          status: order.status || 'pending',
          order_time: new Date(order.created_at).toLocaleString(),
          total_amount: order.total_price || 0,
          items: order.order_items || []
        })) || [];
        
        if (isActive) {
          setOrders(formattedOrders);
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };
    
    fetchOrders();
    
    // Set up real-time subscription
    const channel = supabase.channel('orders-channel');
    
    channel
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'orders'
      }, (payload: {
        eventType: string;
        new: Database['public']['Tables']['orders']['Row'];
        old: Database['public']['Tables']['orders']['Row'] | null;
      }) => {
        // Refresh orders when changes occur
        fetchOrders();
        
        // Play notification sound for new orders
        if (payload.eventType === 'INSERT' && isActive) {
          playNotificationSound();
        }
      })
      .subscribe();
      
    return () => {
      isActive = false; // Prevent state updates after unmount
      channel.unsubscribe();
    };
  }, []);
  
  // Update order status
  const updateOrderStatus = async (orderId: number, newStatus: OrderStatus) => {
    try {
      const supabase = getSupabaseBrowserClient();
      
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);
        
      if (error) throw error;
      
      // If order is marked as ready, send notification to customer
      if (newStatus === 'ready') {
        await sendOrderReadyNotification(orderId);
      }
      
      // Update local state
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId 
            ? { ...order, status: newStatus } 
            : order
        )
      );
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };
  
  // Send notification to customer that order is ready
  const sendOrderReadyNotification = async (orderId: number) => {
    try {
      const supabase = getSupabaseBrowserClient();
      
      // Get the order details
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('table_id')
        .eq('id', orderId)
        .single();
        
      if (orderError) throw orderError;
      
      // Create notification in the database
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          title: 'Order Ready',
          message: `Your order for Table ${order.table_id} is ready for pickup at the bar!`,
          type: 'order_ready',
          target_id: orderId,
          target_type: 'order'
        });
        
      if (notificationError) throw notificationError;
      
    } catch (error) {
      console.error('Error sending order ready notification:', error);
    }
  };
  
  // Play notification sound for new orders
  const playNotificationSound = () => {
    try {
      const audio = new Audio('/sounds/notification.mp3');
      audio.play();
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  };
  
  // Format time since order was placed
  const getTimeSinceOrder = (orderTime: string) => {
    const orderDate = new Date(orderTime);
    const now = new Date();
    const diffMs = now.getTime() - orderDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins === 1) return '1 minute ago';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return '1 hour ago';
    return `${diffHours} hours ago`;
  };
  
  // Filter orders by status
  const filteredOrders = orders.filter(order => order.status === activeTab);
  
  // Count orders by status for badges
  const orderCounts = {
    pending: orders.filter(order => order.status === 'pending').length,
    preparing: orders.filter(order => order.status === 'preparing').length,
    ready: orders.filter(order => order.status === 'ready').length,
    completed: orders.filter(order => order.status === 'completed').length
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Order Management</h1>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => window.location.reload()}>
            Refresh
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="pending" onValueChange={(value) => setActiveTab(value as OrderStatus)}>
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="pending" className="relative">
            Pending
            {orderCounts.pending > 0 && (
              <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center">
                {orderCounts.pending}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="preparing" className="relative">
            Preparing
            {orderCounts.preparing > 0 && (
              <Badge variant="secondary" className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center">
                {orderCounts.preparing}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="ready" className="relative">
            Ready
            {orderCounts.ready > 0 && (
              <Badge variant="default" className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center">
                {orderCounts.ready}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed
          </TabsTrigger>
        </TabsList>
        
        <ScrollArea className="h-[calc(100vh-220px)] mt-6">
          {['pending', 'preparing', 'ready', 'completed'].map((status) => (
            <TabsContent key={status} value={status} className="space-y-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="text-center py-12 bg-muted/30 rounded-lg">
                  <div className="flex justify-center mb-4">
                    {status === 'pending' && <Bell className="h-12 w-12 text-muted-foreground" />}
                    {status === 'preparing' && <Coffee className="h-12 w-12 text-muted-foreground" />}
                    {status === 'ready' && <Check className="h-12 w-12 text-muted-foreground" />}
                    {status === 'completed' && <Clock className="h-12 w-12 text-muted-foreground" />}
                  </div>
                  <p className="text-muted-foreground">No {status} orders</p>
                </div>
              ) : (
                filteredOrders.map((order) => (
                  <Card key={order.id} className="bg-card">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>Table #{order.table_number}</CardTitle>
                          <div className="text-sm text-muted-foreground mt-1">
                            Order #{order.id} • {getTimeSinceOrder(order.order_time)}
                          </div>
                        </div>
                        <Badge
                          variant={
                            order.status === 'pending' ? 'destructive' :
                            order.status === 'preparing' ? 'secondary' :
                            order.status === 'ready' ? 'default' : 'outline'
                          }
                        >
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="space-y-1">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex justify-between text-sm">
                            <span>{item.quantity}x {item.name}</span>
                            <span>${(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                        <div className="pt-2 mt-2 border-t flex justify-between font-medium">
                          <span>Total</span>
                          <span>${order.total_amount.toFixed(2)}</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-0">
                      <div className="flex gap-2 w-full">
                        {order.status === 'pending' && (
                          <Button 
                            onClick={() => updateOrderStatus(order.id, 'preparing')}
                            className="w-full"
                          >
                            Start Preparing
                          </Button>
                        )}
                        
                        {order.status === 'preparing' && (
                          <Button 
                            onClick={() => updateOrderStatus(order.id, 'ready')}
                            className="w-full"
                          >
                            Mark as Ready
                          </Button>
                        )}
                        
                        {order.status === 'ready' && (
                          <Button 
                            onClick={() => updateOrderStatus(order.id, 'completed')}
                            className="w-full"
                          >
                            Complete Order
                          </Button>
                        )}
                        
                        {/* Cancel button for non-completed orders */}
                        {order.status !== 'completed' && (
                          <Button 
                            variant="outline"
                            onClick={() => updateOrderStatus(order.id, 'completed')}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </CardFooter>
                  </Card>
                ))
              )}
            </TabsContent>
          ))}
        </ScrollArea>
      </Tabs>
    </div>
  );
}
