'use client';

import { useState, useEffect, ReactNode } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { Bell, Clock, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { OrderNotification } from './OrderNotification';
import type { Database } from '@/lib/database.types';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  modifiers?: any;
}

interface Order {
  id: string;
  status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  created_at: string;
  table_id: string;
  items: OrderItem[];
  total_price: number | null;
}

interface CustomerOrderStatusProps {
  tableId: string;
  deviceId: string;
}

export function CustomerOrderStatus({ tableId, deviceId }: CustomerOrderStatusProps) {
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasNotifications, setHasNotifications] = useState(false);
  
  // Fetch active orders for this table
  useEffect(() => {
    const fetchActiveOrders = async () => {
      try {
        setIsLoading(true);
        const supabase = getSupabaseBrowserClient();
        
        // Get orders for this table that are not completed or cancelled
        const { data, error } = await supabase
          .from('orders')
          .select(`
            *,
            order_items (*)
          `)
          .eq('table_id', tableId)
          .in('status', ['pending', 'preparing', 'ready'])
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        
        setActiveOrders(data || []);
      } catch (error) {
        console.error('Error fetching active orders:', error);
        toast({
          title: 'Error',
          description: 'Could not load your orders. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchActiveOrders();
    
    // Set up real-time subscription for order updates
    const supabase = getSupabaseBrowserClient();
    
    const orderSubscription = supabase
      .channel('orders-channel')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `table_id=eq.${tableId}`,
      }, (payload: {
        new: {
          id: string;
          status: string;
        };
        old: {
          id: string;
          status: string;
        };
      }) => {
        // Refresh orders when status changes
        fetchActiveOrders();
        
        // Show notification when order becomes ready
        if (payload.new.status === 'ready' && payload.old.status !== 'ready') {
          toast({
            title: 'Order Ready!',
            description: 'Your order is ready for pickup!',
            variant: 'default',
          });
          
          // Play notification sound
          playNotificationSound();
          
          // Show browser notification if permitted
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Order Ready!', {
              body: 'Your order is ready for pickup!',
              icon: '/images/logo.png'
            });
          }
        }
      })
      .subscribe();
      
    // Set up subscription for notifications
    const notificationSubscription = supabase
      .channel('notifications-channel')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `recipient_id=eq.${deviceId}`,
      }, (payload: {
        new: {
          id: string;
          message: string;
          type: string;
        };
      }) => {
        setHasNotifications(true);
        
        // Show toast notification
        toast({
          title: 'New Notification',
          description: payload.new.message,
          variant: 'default',
        });
        
        // Play notification sound
        playNotificationSound();
        
        // Show browser notification if permitted
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('New Notification', {
            body: payload.new.message,
            icon: '/images/logo.png'
          });
        }
        
        // Refresh orders if it's an order notification
        if (payload.new.type === 'order_ready') {
          fetchActiveOrders();
        }
      })
      .subscribe();
      
    // Request notification permission if not already granted
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
    
    return () => {
      supabase.channel('orders-channel').unsubscribe();
      supabase.channel('notifications-channel').unsubscribe();
    };
  }, [tableId, deviceId]);
  
  // Play notification sound
  const playNotificationSound = () => {
    try {
      const audio = new Audio('/sounds/notification.mp3');
      audio.play();
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  };
  
  // Format time since order
  const formatTime = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (error) {
      return 'Unknown time';
    }
  };
  
  // Get status badge
  const getStatusBadge = (status: Order['status']): ReactNode => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case 'preparing':
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Preparing
          </Badge>
        );
      case 'ready':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Ready
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Cancelled
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (activeOrders.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Active Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">You don't have any active orders at the moment.</p>
        </CardContent>
        <CardFooter>
          <Button variant="outline" className="w-full" onClick={() => window.location.href = '/menu'}>
            Browse Menu
          </Button>
        </CardFooter>
      </Card>
    );
  }
  
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Your Orders</h2>
      
      {activeOrders.map((order) => (
        <Card key={order.id} className="overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">
                Order #{order.id.slice(-6).toUpperCase()}
              </CardTitle>
              {getStatusBadge(order.status)}
            </div>
            <p className="text-xs text-muted-foreground">
              Placed {formatTime(order.created_at)}
            </p>
          </CardHeader>
          
          <CardContent>
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
            
            <div className="mt-4 flex justify-between items-center border-t pt-2">
              <span className="font-medium">Total</span>
              <span className="font-bold">${order.total_price?.toFixed(2) || '0.00'}</span>
            </div>
          </CardContent>
          
          {order.status === 'ready' && (
            <CardFooter className="bg-green-50">
              <OrderNotification 
                orderId={order.id}
                status="ready"
                createdAt={order.created_at}
              />
            </CardFooter>
          )}
        </Card>
      ))}
    </div>
  );
}
