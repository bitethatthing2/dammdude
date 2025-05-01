'use client';

import { useState, useEffect } from 'react';
import { Bell, Check, Clock, Coffee, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/components/ui/use-toast';
import { Database } from '@/lib/database.types';

// Define order status types
type OrderStatus = 'pending' | 'preparing' | 'ready' | 'completed';

// Define order interface with proper types
interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  modifiers?: any;
}

interface Order {
  id: string;
  table_id: string;
  table_name?: string;
  status: OrderStatus;
  created_at: string;
  total_price: number | null;
  customer_notes: string | null;
  items: OrderItem[];
}

export function OrderManagement() {
  const [isLoading, setIsLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<OrderStatus>('pending');
  const [processingOrders, setProcessingOrders] = useState<Record<string, boolean>>({});
  
  // Fetch orders on mount and set up real-time subscription
  useEffect(() => {
    const fetchOrders = async () => {
      const supabase = getSupabaseBrowserClient();
      
      try {
        setIsLoading(true);
        
        // Fetch all orders with their items
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select(`
            *,
            order_items (*)
          `)
          .order('created_at', { ascending: false });
          
        if (ordersError) throw ordersError;
        
        // Fetch table information to get names
        const { data: tablesData, error: tablesError } = await supabase
          .from('tables')
          .select('id, name');
          
        if (tablesError) throw tablesError;
        
        // Create a map of table IDs to names
        const tableMap = tablesData.reduce((acc: Record<string, string>, table) => {
          acc[table.id] = table.name;
          return acc;
        }, {});
        
        // Format orders with table names
        const formattedOrders = ordersData.map((order: any) => ({
          id: order.id,
          table_id: order.table_id,
          table_name: tableMap[order.table_id] || `Table ${order.table_id}`,
          status: order.status || 'pending',
          created_at: order.created_at,
          total_price: order.total_price,
          customer_notes: order.customer_notes,
          items: order.order_items || []
        }));
        
        setOrders(formattedOrders);
      } catch (error) {
        console.error('Error fetching orders:', error);
        toast({
          title: 'Error fetching orders',
          description: 'Please try again later.',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchOrders();
    
    // Set up real-time subscription
    const supabase = getSupabaseBrowserClient();
    
    const subscription = supabase
      .channel('orders-channel')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'orders'
      }, (payload) => {
        // Refresh orders when changes occur
        fetchOrders();
        
        // Play notification sound for new orders
        if (payload.eventType === 'INSERT') {
          playNotificationSound();
          
          // Show toast notification for new order
          toast({
            title: 'New Order Received',
            description: `A new order has been placed for ${payload.new.table_id}`,
            variant: 'default'
          });
        }
      })
      .subscribe();
      
    return () => {
      supabase.channel('orders-channel').unsubscribe();
    };
  }, []);
  
  // Update order status
  const updateOrderStatus = async (order: Order, newStatus: OrderStatus) => {
    try {
      // Set processing state
      setProcessingOrders(prev => ({ ...prev, [order.id]: true }));
      
      const supabase = getSupabaseBrowserClient();
      
      // Update order status in database
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', order.id);
        
      if (error) throw error;
      
      // If order is marked as ready, send notification to customer
      if (newStatus === 'ready') {
        await sendOrderReadyNotification(order);
      }
      
      // Update local state
      setOrders(prevOrders => 
        prevOrders.map(o => 
          o.id === order.id 
            ? { ...o, status: newStatus } 
            : o
        )
      );
      
      toast({
        title: 'Order Updated',
        description: `Order for ${order.table_name} is now ${newStatus}`,
        variant: 'default'
      });
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        title: 'Error Updating Order',
        description: 'Please try again later.',
        variant: 'destructive'
      });
    } finally {
      // Clear processing state
      setProcessingOrders(prev => ({ ...prev, [order.id]: false }));
    }
  };
  
  // Send notification to customer that order is ready
  const sendOrderReadyNotification = async (order: Order) => {
    try {
      const response = await fetch('/api/notifications/order-ready', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: order.id,
          tableId: order.table_id,
        }),
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to send notification');
      }
      
      toast({
        title: 'Notification Sent',
        description: `Customer at ${order.table_name} has been notified that their order is ready`,
        variant: 'default'
      });
    } catch (error) {
      console.error('Error sending order ready notification:', error);
      toast({
        title: 'Notification Error',
        description: 'Could not notify customer. Order status updated anyway.',
        variant: 'destructive'
      });
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
    completed: orders.filter(order => order.status === 'completed').length,
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Order Management</h2>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => playNotificationSound()}
        >
          <Bell className="mr-2 h-4 w-4" />
          Test Sound
        </Button>
      </div>
      
      <Tabs defaultValue="pending" value={activeTab} onValueChange={(value) => setActiveTab(value as OrderStatus)}>
        <TabsList className="grid grid-cols-4">
          <TabsTrigger value="pending" className="relative">
            Pending
            {orderCounts.pending > 0 && (
              <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0">
                {orderCounts.pending}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="preparing" className="relative">
            Preparing
            {orderCounts.preparing > 0 && (
              <Badge variant="secondary" className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0">
                {orderCounts.preparing}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="ready" className="relative">
            Ready
            {orderCounts.ready > 0 && (
              <Badge variant="default" className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0">
                {orderCounts.ready}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed
          </TabsTrigger>
        </TabsList>
        
        {['pending', 'preparing', 'ready', 'completed'].map((status) => (
          <TabsContent key={status} value={status} className="mt-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <Coffee className="h-12 w-12 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No {status} orders</p>
              </div>
            ) : (
              <ScrollArea className="h-[calc(100vh-220px)]">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredOrders.map((order) => (
                    <Card key={order.id} className="overflow-hidden">
                      <CardHeader className="bg-muted/50 pb-2">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-lg flex items-center">
                            {order.table_name}
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            <Badge variant={
                              order.status === 'pending' ? 'destructive' : 
                              order.status === 'preparing' ? 'secondary' : 
                              order.status === 'ready' ? 'default' : 
                              'outline'
                            }>
                              {order.status}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {getTimeSinceOrder(order.created_at)}
                            </span>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="pt-4">
                        <ScrollArea className="h-48">
                          <ul className="space-y-2">
                            {order.items.map((item) => (
                              <li key={item.id} className="flex justify-between text-sm">
                                <div>
                                  <span className="font-medium">{item.quantity}x</span> {item.name}
                                  {item.modifiers && Object.keys(item.modifiers).length > 0 && (
                                    <ul className="ml-6 text-xs text-muted-foreground">
                                      {Object.entries(item.modifiers).map(([key, value]) => (
                                        <li key={key}>
                                          {key}: {value}
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                </div>
                                <span>${(item.price * item.quantity).toFixed(2)}</span>
                              </li>
                            ))}
                          </ul>
                          
                          {order.customer_notes && (
                            <div className="mt-4 p-2 bg-muted rounded-md">
                              <p className="text-xs font-medium">Customer Notes:</p>
                              <p className="text-sm">{order.customer_notes}</p>
                            </div>
                          )}
                        </ScrollArea>
                        
                        <div className="mt-4 flex justify-between items-center border-t pt-2">
                          <span className="font-medium">Total</span>
                          <span className="font-bold">${order.total_price?.toFixed(2) || '0.00'}</span>
                        </div>
                      </CardContent>
                      
                      <CardFooter className="bg-muted/30 flex gap-2 justify-end">
                        {order.status === 'pending' && (
                          <Button 
                            onClick={() => updateOrderStatus(order, 'preparing')}
                            disabled={processingOrders[order.id]}
                            className="w-full"
                          >
                            {processingOrders[order.id] ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Clock className="h-4 w-4 mr-2" />
                            )}
                            Start Preparing
                          </Button>
                        )}
                        
                        {order.status === 'preparing' && (
                          <Button 
                            onClick={() => updateOrderStatus(order, 'ready')}
                            disabled={processingOrders[order.id]}
                            className="w-full"
                          >
                            {processingOrders[order.id] ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Bell className="h-4 w-4 mr-2" />
                            )}
                            Mark Ready & Notify
                          </Button>
                        )}
                        
                        {order.status === 'ready' && (
                          <Button 
                            onClick={() => updateOrderStatus(order, 'completed')}
                            disabled={processingOrders[order.id]}
                            className="w-full"
                          >
                            {processingOrders[order.id] ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4 mr-2" />
                            )}
                            Mark Completed
                          </Button>
                        )}
                        
                        {order.status === 'ready' && (
                          <Button 
                            variant="outline"
                            onClick={() => sendOrderReadyNotification(order)}
                            disabled={processingOrders[order.id]}
                          >
                            <Bell className="h-4 w-4" />
                          </Button>
                        )}
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
