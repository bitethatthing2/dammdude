"use client";

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, ArrowRight, Bell, Clock, Home, ShoppingBag, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { formatCurrency } from '@/lib/utils';
import { useBarTap } from '@/lib/contexts/bartap-context';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';

// Types based on your database schema
type OrderStatus = 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';

interface OrderItem {
  id: string;
  order_id: string;
  item_id: string;
  item_name: string;
  quantity: number;
  price_at_order: number;
  notes: string | null;
  customizations: Record<string, unknown> | null;
  created_at: string;
}

interface Order {
  id: string;
  table_id: string;
  customer_id: string | null;
  status: OrderStatus;
  customer_notes: string | null;
  total_price: number;
  created_at: string;
  updated_at: string;
}

interface TableData {
  id: string;
  name: string;
  section?: string;
}

interface OrderConfirmationProps {
  orderId: string;
  tableData: TableData;
}

// Realtime payload type - properly typed instead of using 'any'
interface RealtimePayload<T = unknown> {
  commit_timestamp?: string;
  errors?: string[] | null;
  new?: T;
  old?: T | Record<string, never>;
  schema: string;
  table: string;
  type: 'INSERT' | 'UPDATE' | 'DELETE';
}

export function OrderConfirmation({ orderId, tableData }: OrderConfirmationProps) {
  const [order, setOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  
  // Get BarTap context and router
  const barTap = useBarTap();
  const router = useRouter();
  const supabase = createClient();
  
  // Track if we've already cleared the cart
  const hasCleared = useRef(false);
  
  // Clear cart once when component mounts
  useEffect(() => {
    if (barTap && !hasCleared.current) {
      hasCleared.current = true;
      barTap.clearCart();
    }
  }, [barTap]);
  
  // Check notification permission
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);
  
  // Fetch order data
  useEffect(() => {
    const fetchOrderData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch order details
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .single();
        
        if (orderError) {
          throw orderError;
        }
        
        if (!orderData) {
          throw new Error('Order not found');
        }
        
        setOrder(orderData);
        
        // Fetch order items
        const { data: itemsData, error: itemsError } = await supabase
          .from('order_items')
          .select('*')
          .eq('order_id', orderId)
          .order('created_at', { ascending: true });
        
        if (itemsError) {
          throw itemsError;
        }
        
        setOrderItems(itemsData || []);
        
      } catch (err) {
        console.error('Error fetching order:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to load order';
        setError(errorMessage);
        
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    if (orderId) {
      fetchOrderData();
    }
  }, [orderId, supabase]);
  
  // Set up real-time subscription for order updates
  useEffect(() => {
    if (!orderId) return;
    
    const channel = supabase
      .channel(`order-${orderId}`)
      .on(
        'postgres_changes' as const,
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`,
        },
        (payload: RealtimePayload<Order>) => {
          if (payload.new) {
            setOrder(payload.new);
            
            // Show notification if order is ready
            if (payload.new.status === 'ready' && payload.old && 
                typeof payload.old === 'object' && 'status' in payload.old && 
                payload.old.status !== 'ready') {
              toast({
                title: '🎉 Order Ready!',
                description: 'Your order is ready for pickup!',
                duration: 10000,
              });
              
              // Play notification sound
              playNotificationSound();
              
              // Show browser notification
              if (notificationPermission === 'granted') {
                showBrowserNotification();
              }
            }
          }
        }
      )
      .subscribe();
    
    return () => {
      supabase.channel(`order-${orderId}`).unsubscribe();
    };
  }, [orderId, supabase, notificationPermission]);
  
  // Play notification sound
  const playNotificationSound = () => {
    try {
      const audio = new Audio('/sounds/notification.mp3');
      audio.volume = 0.7;
      audio.play().catch(() => {
        // Silently fail if audio is blocked
      });
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  };
  
  // Show browser notification
  const showBrowserNotification = () => {
    try {
      new Notification('Order Ready!', {
        body: 'Your order is ready for pickup at the counter!',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        requireInteraction: true,
      });
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  };
  
  // Request notification permission
  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      try {
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);
        
        if (permission === 'granted') {
          toast({
            title: 'Notifications Enabled',
            description: 'You\'ll be notified when your order is ready!',
          });
        }
      } catch (error) {
        console.error('Error requesting notification permission:', error);
      }
    }
  };
  
  // Handle placing a new order
  const handleNewOrder = () => {
    if (barTap) {
      const currentTableId = barTap.tableId;
      barTap.resetFlow();
      if (currentTableId) {
        barTap.setTableId(currentTableId);
      }
    }
    
    router.push('/menu');
  };
  
  // Format date
  const formatOrderDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return 'Just now';
    }
  };
  
  // Get status badge
  const getStatusBadge = (status: OrderStatus) => {
    const statusConfig: Record<OrderStatus, { label: string; className: string }> = {
      pending: {
        label: 'Order Received',
        className: 'bg-yellow-50 text-yellow-700 border-yellow-200'
      },
      preparing: {
        label: 'Preparing',
        className: 'bg-blue-50 text-blue-700 border-blue-200'
      },
      ready: {
        label: 'Ready for Pickup',
        className: 'bg-green-50 text-green-700 border-green-200 animate-pulse'
      },
      completed: {
        label: 'Completed',
        className: 'bg-gray-50 text-gray-700 border-gray-200'
      },
      cancelled: {
        label: 'Cancelled',
        className: 'bg-red-50 text-red-700 border-red-200'
      }
    };
    
    const config = statusConfig[status];
    
    return (
      <Badge variant="outline" className={config.className}>
        {config.label}
      </Badge>
    );
  };
  
  // Calculate estimated time based on status
  const getEstimatedTime = (status: OrderStatus): number | null => {
    switch (status) {
      case 'pending':
        return 15; // 15 minutes for new orders
      case 'preparing':
        return 10; // 10 minutes once preparing
      case 'ready':
      case 'completed':
      case 'cancelled':
        return null;
      default:
        return null;
    }
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center space-y-4 py-8">
            <div className="h-12 w-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            <p className="text-muted-foreground">Loading order details...</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (error || !order) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <div className="mb-4 flex flex-col items-center">
              <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mb-3">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Order Not Found</h3>
              <p className="text-muted-foreground mb-6 max-w-sm">
                {error || "We couldn't find this order. It may have been cancelled or the order ID is incorrect."}
              </p>
            </div>
            <div className="flex flex-col space-y-3 max-w-xs mx-auto">
              <Button onClick={() => router.push('/menu')} className="w-full">
                Back to Menu
              </Button>
              <Button variant="outline" onClick={handleNewOrder} className="w-full">
                Place a New Order
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const estimatedTime = getEstimatedTime(order.status);
  
  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <CardHeader className="pb-4 text-center bg-primary/5">
          <div className="mx-auto mb-3">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto animate-in zoom-in-50 duration-500">
              <CheckCircle className="h-12 w-12 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Order Confirmed!</CardTitle>
          <p className="text-muted-foreground">
            Order ID: <span className="font-mono font-semibold">#{order.id.slice(-6).toUpperCase()}</span>
          </p>
        </CardHeader>
        
        <CardContent className="pt-6">
          <div className="flex justify-center mb-6">
            {getStatusBadge(order.status)}
          </div>
          
          {/* Notification Status */}
          <div className="bg-muted/30 rounded-lg p-4 mb-6">
            <h3 className="font-medium mb-2 flex items-center justify-center text-sm">
              <Bell className="h-4 w-4 mr-2 text-primary" />
              Notification Settings
            </h3>
            {notificationPermission === 'granted' ? (
              <p className="text-sm text-center text-muted-foreground">
                ✅ You&apos;ll receive a notification when your order is ready
              </p>
            ) : (
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  Enable notifications to know when your order is ready
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={requestNotificationPermission}
                >
                  Enable Notifications
                </Button>
              </div>
            )}
          </div>
          
          {/* Estimated Time */}
          {estimatedTime && order.status !== 'ready' && (
            <div className="text-center mb-6 bg-primary/10 rounded-lg p-4">
              <h3 className="font-medium mb-2 flex items-center justify-center text-sm">
                <Clock className="h-4 w-4 mr-2 text-primary" />
                Estimated Wait Time
              </h3>
              <p className="text-3xl font-bold text-primary">
                ~{estimatedTime} minutes
              </p>
            </div>
          )}
          
          {/* Order Details */}
          <div className="space-y-4 border-t pt-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Table</span>
                <p className="font-medium">{tableData.name}</p>
              </div>
              <div className="text-right">
                <span className="text-muted-foreground">Ordered</span>
                <p className="font-medium">{formatOrderDate(order.created_at)}</p>
              </div>
            </div>
            
            {order.customer_notes && (
              <div className="bg-muted/30 rounded-md p-3">
                <p className="text-sm">
                  <span className="font-medium">Note:</span> {order.customer_notes}
                </p>
              </div>
            )}
            
            <div className="border-t pt-4">
              <h3 className="font-medium mb-3">Order Items</h3>
              <div className="space-y-2">
                {orderItems.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <div className="flex-1">
                      <span className="font-medium mr-2">{item.quantity}x</span>
                      <span>{item.item_name}</span>
                      {item.notes && (
                        <p className="text-xs text-muted-foreground ml-6 italic">
                          {item.notes}
                        </p>
                      )}
                    </div>
                    <span className="font-medium ml-4">
                      {formatCurrency(item.price_at_order * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="border-t pt-3">
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>{formatCurrency(order.total_price)}</span>
              </div>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex-col space-y-4 bg-muted/30">
          <p className="text-sm text-center text-muted-foreground w-full">
            {order.status === 'ready' ? (
              <span className="text-green-700 font-medium">
                Your order is ready! Please pick it up at the counter.
              </span>
            ) : order.status === 'completed' ? (
              'Thank you! Enjoy your meal!'
            ) : order.status === 'cancelled' ? (
              <span className="text-destructive">
                This order has been cancelled.
              </span>
            ) : (
              'We\'re preparing your order. We\'ll notify you when it\'s ready!'
            )}
          </p>
          
          <div className="grid grid-cols-2 gap-3 w-full">
            <Button 
              variant="outline" 
              onClick={() => router.push('/menu')}
              className="gap-2"
            >
              <Home className="h-4 w-4" />
              Back to Menu
            </Button>
            
            <Button 
              onClick={handleNewOrder} 
              className="gap-2"
            >
              <ShoppingBag className="h-4 w-4" />
              New Order
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}