"use client";

import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { StatusBadge } from '@/components/bartap/ui/StatusBadge';
import { formatOrderDate, formatTimeDistance } from '@/lib/utils/date-utils';
import { formatCurrency } from '@/lib/utils/format-utils';
import { Clock, AlertTriangle, CheckCircle2, Coffee, Bell, BellOff, Volume2, VolumeX } from 'lucide-react';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Order statuses we care about in the kitchen
type KitchenOrderStatus = 'pending' | 'preparing' | 'ready';
type OrderStatus = KitchenOrderStatus | 'delivered' | 'cancelled';

interface Order {
  id: string;
  table_id: string;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
  total_amount: number;
  notes?: string | null;
  estimated_time?: number | null;
  table_name?: string;
  table_section?: string;
  items: OrderItem[];
  customizations?: any;
  isNew?: boolean; // Flag for highlighting new orders
}

interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  menu_item_name: string;
  quantity: number;
  notes?: string | null;
  unit_price: number;
  subtotal: number;
  customizations?: any;
}

interface KitchenDisplayProps {
  initialTab?: KitchenOrderStatus;
}

// Render order card - this is defined outside the component to avoid reference errors
const renderOrderCard = (
  order: Order, 
  setEstimatedTime: (orderId: string, minutes: number) => Promise<void>,
  updateOrderStatus: (orderId: string, newStatus: OrderStatus) => Promise<void>
) => {
  const createdTime = formatOrderDate(order.created_at);
  const waitTime = formatTimeDistance(order.created_at);
  
  return (
    <Card 
      key={order.id} 
      className={`mb-4 ${order.isNew ? 'animate-pulse border-2 border-primary' : ''}`}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg flex items-center">
              Table {order.table_name}
              {order.table_section && <span className="text-sm text-muted-foreground ml-1">({order.table_section})</span>}
              {order.isNew && <Badge className="ml-2 bg-primary">New</Badge>}
            </CardTitle>
            <div className="text-sm text-muted-foreground">
              Order #{order.id.slice(-6).toUpperCase()} • {createdTime}
            </div>
          </div>
          <StatusBadge status={order.status} />
        </div>
      </CardHeader>
      
      <CardContent className="pb-2">
        <div className="space-y-2">
          {/* Wait time indicator */}
          <div className="flex items-center text-sm">
            <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
            <span>
              Waiting: <span className={`font-medium ${waitTime.includes('hour') || waitTime.includes('day') ? 'text-red-500' : ''}`}>{waitTime}</span>
            </span>
          </div>
          
          {/* Order items */}
          <div className="space-y-2 mt-3">
            {order.items.map(item => (
              <div key={item.id} className="flex justify-between">
                <div>
                  <div className="font-medium">{item.quantity}x {item.menu_item_name}</div>
                  
                  {/* Display customizations */}
                  {item.customizations && (
                    <div className="text-xs text-muted-foreground ml-4 mt-1">
                      {item.customizations.meatType && (
                        <div>Meat: {item.customizations.meatType}</div>
                      )}
                      
                      {item.customizations.extras && item.customizations.extras.length > 0 && (
                        <div>
                          Extras: {item.customizations.extras.join(', ')}
                        </div>
                      )}
                      
                      {item.customizations.preferences && item.customizations.preferences.length > 0 && (
                        <div>
                          Preferences: {item.customizations.preferences.join(', ')}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {item.notes && (
                    <div className="text-sm text-muted-foreground">
                      Note: {item.notes}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {/* Order notes */}
          {order.notes && (
            <div className="mt-3 p-2 bg-muted rounded-md">
              <div className="flex items-start">
                <AlertTriangle className="h-4 w-4 mr-1 text-amber-500 mt-0.5" />
                <div className="text-sm">{order.notes}</div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="flex flex-col space-y-2">
        {order.status === 'pending' && (
          <>
            <div className="grid grid-cols-4 gap-2 w-full mb-2">
              {[5, 10, 15, 20].map(minutes => (
                <Button 
                  key={minutes}
                  variant="outline" 
                  size="sm"
                  onClick={() => setEstimatedTime(order.id, minutes)}
                  className={order.estimated_time === minutes ? 'border-primary' : ''}
                >
                  {minutes} min
                </Button>
              ))}
            </div>
            
            <Button 
              className="w-full" 
              onClick={() => updateOrderStatus(order.id, 'preparing')}
            >
              <Coffee className="h-4 w-4 mr-2" />
              Start Preparing
            </Button>
          </>
        )}
        
        {order.status === 'preparing' && (
          <Button 
            className="w-full" 
            onClick={() => updateOrderStatus(order.id, 'ready')}
            variant="default"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Mark as Ready
          </Button>
        )}
        
        {order.status === 'ready' && (
          <Button 
            className="w-full" 
            onClick={() => {
              // Cast to any since we're transitioning to a status outside KitchenOrderStatus
              const newStatus = 'delivered' as any;
              updateOrderStatus(order.id, newStatus);
            }}
            variant="outline"
          >
            Complete Order
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

/**
 * Kitchen Display System (KDS) for managing food/drink preparation
 * Shows orders by status with real-time updates
 */
export function KitchenDisplay({ initialTab = 'pending' }: KitchenDisplayProps) {
  const [activeTab, setActiveTab] = useState<KitchenOrderStatus>(initialTab);
  const [orders, setOrders] = useState<Record<KitchenOrderStatus, Order[]>>({
    pending: [],
    preparing: [],
    ready: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [newOrderCount, setNewOrderCount] = useState(0);
  
  // Refs for audio elements
  const newOrderSoundRef = useRef<HTMLAudioElement | null>(null);
  const statusChangeSoundRef = useRef<HTMLAudioElement | null>(null);
  
  // Track seen order IDs to identify new orders
  const seenOrderIdsRef = useRef<Set<string>>(new Set());
  
  const supabase = getSupabaseBrowserClient();
  
  // Initialize audio elements
  useEffect(() => {
    if (typeof window !== 'undefined') {
      newOrderSoundRef.current = new Audio('/sounds/new-order.mp3');
      statusChangeSoundRef.current = new Audio('/sounds/status-change.mp3');
      
      // Load sounds
      newOrderSoundRef.current.load();
      statusChangeSoundRef.current.load();
    }
    
    return () => {
      // Clean up audio elements
      if (newOrderSoundRef.current) {
        newOrderSoundRef.current = null;
      }
      if (statusChangeSoundRef.current) {
        statusChangeSoundRef.current = null;
      }
    };
  }, []);
  
  // Request notification permission on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission();
      }
    }
  }, []);
  
  // Play sound for new orders
  const playNewOrderSound = () => {
    if (soundEnabled && newOrderSoundRef.current) {
      newOrderSoundRef.current.play().catch(err => {
        console.error('Error playing sound:', err);
      });
    }
  };
  
  // Play sound for status changes
  const playStatusChangeSound = () => {
    if (soundEnabled && statusChangeSoundRef.current) {
      statusChangeSoundRef.current.play().catch(err => {
        console.error('Error playing sound:', err);
      });
    }
  };
  
  // Show browser notification
  const showNotification = (title: string, body: string) => {
    if (!notificationsEnabled) return;
    
    if (typeof window !== 'undefined' && 
        'Notification' in window && 
        Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/icons/icon-192x192.png',
      });
    }
  };
  
  // Update order status
  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);
        
      if (error) throw error;
      
      toast.success(`Order status updated to ${newStatus}`);
      
      // Update will be handled by the subscription
    } catch (err: any) {
      console.error('Error updating order status:', err);
      toast.error('Failed to update order status');
    }
  };
  
  // Set estimated preparation time
  const setEstimatedTime = async (orderId: string, minutes: number) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          estimated_time: minutes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);
        
      if (error) throw error;
      
      toast.success(`Estimated time set to ${minutes} minutes`);
      
      // Update will be handled by the subscription
    } catch (err: any) {
      console.error('Error setting estimated time:', err);
      toast.error('Failed to set estimated time');
    }
  };
  
  // Count orders by status
  const orderCounts = {
    pending: orders.pending.length,
    preparing: orders.preparing.length,
    ready: orders.ready.length,
  };
  
  // Reset new order count when changing to pending tab
  useEffect(() => {
    if (activeTab === 'pending') {
      setNewOrderCount(0);
    }
  }, [activeTab]);
  
  // Fetch orders on mount and refresh every minute
  useEffect(() => {
    let interval: NodeJS.Timeout;
    let isActive = true;
    let subscription: any = null;
    
    async function fetchOrders() {
      if (!isActive) return;
      
      setIsLoading(true);
      
      try {
        // Fetch orders with relevant statuses and table information
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select(`
            id,
            table_id,
            status,
            created_at,
            updated_at,
            total_amount,
            notes,
            estimated_time,
            items,
            tables!inner (
              name,
              section
            )
          `)
          .in('status', ['pending', 'preparing', 'ready'])
          .order('created_at', { ascending: false });
          
        if (ordersError) {
          console.error('Error fetching orders:', ordersError);
          setError('Failed to load orders');
          setIsLoading(false);
          return;
        }
        
        // Process fetched orders
        const processedOrders = ordersData.map((order: any) => {
          // Parse items from the JSONB items field
          let parsedItems: OrderItem[] = [];
          try {
            const itemsJson = order.items;
            const items = typeof itemsJson === 'string' ? JSON.parse(itemsJson) : itemsJson;
            
            if (Array.isArray(items)) {
              parsedItems = items.map((item: any, index: number) => ({
                id: item.id || `${order.id}-item-${index}`,
                order_id: order.id,
                menu_item_id: item.menu_item_id || item.id,
                menu_item_name: item.name,
                quantity: item.quantity || 1,
                notes: item.notes,
                unit_price: item.price || 0,
                subtotal: (item.price || 0) * (item.quantity || 1),
                customizations: item.customizations
              }));
            }
          } catch (e) {
            console.error(`Error parsing items for order ${order.id}:`, e);
          }
          
          return {
            ...order,
            table_name: order.tables?.name || `Table ${order.table_id}`,
            table_section: order.tables?.section,
            items: parsedItems,
            // Check if this is a new order we haven't seen before
            isNew: !seenOrderIdsRef.current.has(order.id) && order.status === 'pending'
          };
        });
        
        // Update seen order IDs
        processedOrders.forEach((order: Order) => {
          seenOrderIdsRef.current.add(order.id);
        });
        
        // Group orders by status
        const grouped: Record<KitchenOrderStatus, Order[]> = {
          pending: [],
          preparing: [],
          ready: [],
        };
        
        const newOrderIds: string[] = [];
        
        processedOrders.forEach((order: Order) => {
          if (order.status in grouped) {
            grouped[order.status as KitchenOrderStatus].push(order);
          }
          
          // Check for new pending orders to notify
          if (order.isNew) {
            newOrderIds.push(order.id);
          }
        });
        
        // Update state with grouped orders
        setOrders(grouped);
        
        // Handle notifications for new orders
        if (newOrderIds.length > 0) {
          // Play sound for new orders
          playNewOrderSound();
          
          // Show browser notification
          const newOrderCount = newOrderIds.length;
          showNotification(
            `${newOrderCount} New Order${newOrderCount > 1 ? 's' : ''}`,
            `You have ${newOrderCount} new order${newOrderCount > 1 ? 's' : ''} to prepare.`
          );
          
          // Update new order count
          setNewOrderCount(prev => prev + newOrderCount);
        }
        
        setIsLoading(false);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching orders:', err);
        setError(err.message || 'Failed to load orders');
        setIsLoading(false);
      }
    }
    
    // Set up real-time subscription for order updates
    function subscribeToOrderUpdates() {
      // Clean up any existing subscription first
      if (subscription) {
        subscription.unsubscribe();
      }
      
      // Create a new subscription
      const newSubscription = supabase
        .channel('kitchen-orders')
        .on('postgres_changes', 
          { event: 'INSERT', schema: 'public', table: 'orders' },
          (payload: any) => {
            if (!isActive) return;
            // New order created
            fetchOrders();
          }
        )
        .on('postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'orders' },
          (payload: any) => {
            if (!isActive) return;
            // Order status changed
            playStatusChangeSound();
            fetchOrders();
          }
        )
        .subscribe();
        
      return newSubscription;
    }
    
    // Initialize
    fetchOrders();
    subscription = subscribeToOrderUpdates();
    
    // Refresh orders every minute
    interval = setInterval(fetchOrders, 60000);
    
    // Cleanup
    return () => {
      isActive = false;
      clearInterval(interval);
      if (subscription) {
        subscription.unsubscribe();
        subscription = null;
      }
    };
  }, [supabase, soundEnabled, notificationsEnabled]);
  
  return (
    <div className="space-y-4">
      {/* Settings panel */}
      <Card className="mb-4">
        <CardContent className="pt-6">
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                <Label htmlFor="sound-toggle">Sound Alerts</Label>
              </div>
              <Switch
                id="sound-toggle"
                checked={soundEnabled}
                onCheckedChange={setSoundEnabled}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {notificationsEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                <Label htmlFor="notification-toggle">Browser Notifications</Label>
              </div>
              <Switch
                id="notification-toggle"
                checked={notificationsEnabled}
                onCheckedChange={setNotificationsEnabled}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Notification permission alert */}
      {notificationsEnabled && 
       typeof window !== 'undefined' && 
       'Notification' in window && 
       Notification.permission !== 'granted' && (
        <Alert className="mb-4">
          <Bell className="h-4 w-4" />
          <AlertDescription>
            Please enable browser notifications to receive alerts for new orders.
            <Button 
              variant="link" 
              className="p-0 h-auto text-primary"
              onClick={() => Notification.requestPermission()}
            >
              Enable Notifications
            </Button>
          </AlertDescription>
        </Alert>
      )}
      
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as KitchenOrderStatus)}>
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="pending" className="relative">
            Pending
            {orderCounts.pending > 0 && (
              <Badge className={`ml-2 ${newOrderCount > 0 ? 'bg-primary animate-pulse' : 'bg-red-500'}`}>
                {orderCounts.pending}
                {newOrderCount > 0 && ` (${newOrderCount} new)`}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="preparing" className="relative">
            Preparing
            {orderCounts.preparing > 0 && (
              <Badge className="ml-2 bg-blue-500">{orderCounts.preparing}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="ready" className="relative">
            Ready
            {orderCounts.ready > 0 && (
              <Badge className="ml-2 bg-green-500">{orderCounts.ready}</Badge>
            )}
          </TabsTrigger>
        </TabsList>
        
        {['pending', 'preparing', 'ready'].map((status) => (
          <TabsContent key={status} value={status} className="mt-4">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="h-12 w-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                <p className="text-muted-foreground">{error}</p>
                <Button 
                  onClick={() => window.location.reload()} 
                  variant="outline" 
                  className="mt-4"
                >
                  Retry
                </Button>
              </div>
            ) : orders[status as KitchenOrderStatus].length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No {status} orders</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders[status as KitchenOrderStatus].map((order) => 
                  renderOrderCard(order, setEstimatedTime, updateOrderStatus)
                )}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
      
      {/* Hidden audio elements */}
      <audio ref={newOrderSoundRef} src="/sounds/new-order.mp3" preload="auto" />
      <audio ref={statusChangeSoundRef} src="/sounds/status-change.mp3" preload="auto" />
    </div>
  );
}
