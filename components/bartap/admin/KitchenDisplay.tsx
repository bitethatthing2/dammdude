"use client";

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/unified/ui/StatusBadge';
import { formatRelativeTime } from '@/lib/utils/date-utils';
import { formatCurrency } from '@/lib/utils/format-utils';
import { Clock, AlertTriangle, CheckCircle2, Coffee, Bell, BellOff, Volume2, VolumeX, Bug, Database } from 'lucide-react';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAdminOrders, AdminOrder, OrderStatus } from '@/lib/hooks/useAdminOrders';
import { setupGlobalErrorHandlers, captureError, getStoredErrors, clearStoredErrors } from '@/lib/utils/error-utils';
import { setupErrorMonitoring } from '@/lib/utils/error-monitoring';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { ApiDiagnosticTool as ApiDiagnostics } from '@/components/admin/ApiDiagnosticTool';

// Order statuses we care about in the kitchen
type KitchenOrderStatus = 'pending' | 'preparing' | 'ready';

interface KitchenDisplayProps {
  initialTab?: KitchenOrderStatus;
}

export function KitchenDisplay({ initialTab = 'pending' }: KitchenDisplayProps) {
  // State for active tab
  const [activeTab, setActiveTab] = useState<KitchenOrderStatus>(initialTab);
  
  // State for sound and notifications
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [newOrderCount, setNewOrderCount] = useState(0);
  
  // Refs for audio elements
  const newOrderSoundRef = useRef<HTMLAudioElement | null>(null);
  const statusChangeSoundRef = useRef<HTMLAudioElement | null>(null);
  
  // Use our custom hook to manage orders
  const { 
    orders, 
    isLoading, 
    error, 
    fetchOrders,
    updateOrderStatus: updateOrder,
    setEstimatedTime: setOrderEstimatedTime,
    pendingOrders,
    preparingOrders,
    readyOrders
  } = useAdminOrders({
    status: ['pending', 'preparing', 'ready'],
    refreshInterval: 60000,
    enableRealtime: true,
    onNewOrder: (order) => {
      if (order.status === 'pending') {
        setNewOrderCount(prev => prev + 1);
        playNewOrderSound();
        showNotification(
          'New Order',
          `New order from Table ${order.table_name || order.table_id}`
        );
      }
    },
    onOrderStatusChange: (order, previousStatus) => {
      playStatusChangeSound();
      showNotification(
        'Order Status Changed',
        `Order #${order.id.slice(-6).toUpperCase()} is now ${order.status}`
      );
    }
  });
  
  // Initialize global error handlers
  useEffect(() => {
    // Set up global error handlers
    setupGlobalErrorHandlers();
    setupErrorMonitoring();
    
    // Log component mount for debugging
    console.log('KitchenDisplay mounted');
    
    return () => {
      console.log('KitchenDisplay unmounted');
    };
  }, []);
  
  // Group orders by status for easier access
  const ordersByStatus: Record<KitchenOrderStatus, AdminOrder[]> = {
    pending: pendingOrders,
    preparing: preparingOrders,
    ready: readyOrders
  };
  
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
  
  // Render order card
  const renderOrderCard = (order: AdminOrder) => {
    // Determine if this is a new order (for highlighting)
    const isHighlighted = false;
    
    // Handle status change
    const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
      try {
        const success = await updateOrder(orderId, newStatus);
        
        if (success) {
          toast.success(`Order status updated to ${newStatus}`);
        }
      } catch (err) {
        console.error('Error updating order status:', err);
        captureError(
          err instanceof Error ? err : new Error('Error updating order status'),
          {
            source: 'KitchenDisplay.handleStatusChange',
            context: { orderId, newStatus }
          }
        );
        toast.error('Failed to update order status');
      }
    };
    
    return (
      <Card 
        key={order.id} 
        className={`mb-4 ${isHighlighted ? 'border-2 border-primary animate-pulse' : ''}`}
      >
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg flex items-center">
                Table {order.table_name || order.table_id}
              </CardTitle>
              <CardDescription>
                Order #{order.id.slice(-6).toUpperCase()} • {formatRelativeTime(order.created_at)}
              </CardDescription>
            </div>
            <StatusBadge status={order.status} />
          </div>
        </CardHeader>
        
        <CardContent className="pb-2">
          <div className="flex items-center text-sm">
            <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
            <span>
              Waiting: <span className={`font-medium`}>{formatRelativeTime(order.created_at)}</span>
            </span>
          </div>
          
          {/* Order items */}
          <div className="mt-3 space-y-2">
            {(order.items || []).map((item, index) => (
              <div key={index} className="flex justify-between">
                <div className="flex-1">
                  <div className="font-medium">{item.quantity}x {item.name}</div>
                  
                  {/* Item modifiers */}
                  {item.modifiers && typeof item.modifiers === 'object' && Object.keys(item.modifiers).length > 0 && (
                    <ul className="text-sm text-muted-foreground ml-5 list-disc">
                      {Object.entries(item.modifiers).map(([key, value], optIndex: number) => (
                        <li key={optIndex}>{key}: {String(value)}</li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="text-right">
                  {formatCurrency(item.price)}
                </div>
              </div>
            ))}
          </div>
          
          {/* Order notes */}
          {order.notes && (
            <div className="mt-3 p-2 bg-muted rounded-md">
              <div className="text-sm font-medium">Customer Notes:</div>
              <div className="text-sm">{order.notes}</div>
            </div>
          )}
          
          {/* Order total */}
          <div className="mt-3 flex justify-between font-medium">
            <span>Total:</span>
            <span>{formatCurrency(order.total_amount)}</span>
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-2">
          {/* Estimated time buttons for pending orders */}
          {order.status === 'pending' && (
            <>
              <div className="w-full">
                <Label className="mb-1 block">Estimated Time:</Label>
                <div className="flex space-x-2">
                  {[5, 10, 15, 20, 30].map(minutes => (
                    <Button 
                      key={minutes}
                      variant="outline" 
                      size="sm"
                      onClick={() => setOrderEstimatedTime(order.id, minutes)}
                      className={order.estimated_time === minutes ? 'border-primary' : ''}
                    >
                      {minutes} min
                    </Button>
                  ))}
                </div>
              </div>
              
              <Button 
                className="w-full" 
                onClick={() => handleStatusChange(order.id, 'preparing' as OrderStatus)}
              >
                <Coffee className="h-4 w-4 mr-2" />
                Start Preparing
              </Button>
            </>
          )}
          
          {order.status === 'preparing' && (
            <Button 
              className="w-full" 
              onClick={() => handleStatusChange(order.id, 'ready' as OrderStatus)}
              variant="default"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Mark as Ready
            </Button>
          )}
          
          {order.status === 'ready' && (
            <Button 
              className="w-full" 
              onClick={() => handleStatusChange(order.id, 'delivered' as OrderStatus)}
              variant="outline"
            >
              Complete Order
            </Button>
          )}
        </CardFooter>
      </Card>
    );
  };
  
  // Count orders by status
  const orderCounts = {
    pending: pendingOrders.length,
    preparing: preparingOrders.length,
    ready: readyOrders.length,
  };
  
  // Reset new order count when changing to pending tab
  useEffect(() => {
    if (activeTab === 'pending') {
      setNewOrderCount(0);
    }
  }, [activeTab]);
  
  return (
    <ErrorBoundary>
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
              
              {/* Diagnostics toggle for admins */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Bug className="h-4 w-4" />
                  <Label htmlFor="diagnostics-toggle">Diagnostics Mode</Label>
                </div>
                <Switch
                  id="diagnostics-toggle"
                  checked={false}
                  onCheckedChange={() => {}}
                />
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Diagnostics panel for admins */}
        <Card className="mb-4 bg-muted/20">
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center">
              <Database className="h-4 w-4 mr-2 text-primary" />
              System Diagnostics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 py-2">
            {/* API Diagnostics tool */}
            <ApiDiagnostics compact={true} />
            
            <div className="space-y-2">
              <h3 className="text-xs font-medium">Order Fetch Status</h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-card p-2 rounded">
                  <span className="font-medium">Loading:</span> {isLoading ? 'Yes' : 'No'}
                </div>
                <div className="bg-card p-2 rounded">
                  <span className="font-medium">Error:</span> {error ? 'Yes' : 'No'}
                </div>
                <div className="bg-card p-2 rounded">
                  <span className="font-medium">Pending Orders:</span> {pendingOrders.length}
                </div>
                <div className="bg-card p-2 rounded">
                  <span className="font-medium">Total Orders:</span> {orders.length}
                </div>
              </div>
            </div>
            
            {error && (
              <div className="bg-destructive/10 p-3 rounded-md">
                <h3 className="text-xs font-medium text-destructive mb-1">Error Details</h3>
                <p className="text-xs font-mono whitespace-pre-wrap">{error}</p>
              </div>
            )}
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-medium">Actions</h3>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-6 text-xs"
                  onClick={() => {
                    clearStoredErrors();
                    toast.success('Error logs cleared');
                  }}
                >
                  Clear Logs
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-7 text-xs"
                  onClick={() => {
                    fetchOrders();
                    toast.success('Manually refreshed orders');
                  }}
                >
                  Refresh Orders
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-7 text-xs"
                  onClick={() => {
                    window.location.reload();
                  }}
                >
                  Reload Page
                </Button>
              </div>
            </div>
            
            {getStoredErrors().length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-medium">Recent Errors</h3>
                <div className="bg-card rounded-md max-h-24 overflow-y-auto">
                  <div className="divide-y divide-border">
                    {getStoredErrors().slice(0, 3).map((errorLog, index) => (
                      <div key={index} className="p-2 text-xs">
                        <div className="font-medium">{errorLog.message}</div>
                        <div className="text-muted-foreground text-xs">{new Date(errorLog.timestamp).toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            <details className="text-xs">
              <summary className="cursor-pointer font-medium">Database Information</summary>
              <div className="mt-2 p-2 bg-card rounded-md">
                <p className="mb-1">Table schema expectations:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><code>orders</code> table: <code>notes</code>, <code>total_amount</code>, <code>location</code>, <code>items</code></li>
                  <li><code>order_items</code> table: <code>menu_item_id</code>, <code>price</code>, <code>name</code></li>
                </ul>
              </div>
            </details>
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
                    onClick={() => fetchOrders()} 
                    variant="outline" 
                    className="mt-4"
                  >
                    Retry
                  </Button>
                </div>
              ) : ordersByStatus[status as KitchenOrderStatus].length === 0 ? (
                <div className="py-8 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-4">
                    {status === 'pending' && <AlertTriangle className="h-6 w-6 text-muted-foreground" />}
                    {status === 'preparing' && <Coffee className="h-6 w-6 text-muted-foreground" />}
                    {status === 'ready' && <CheckCircle2 className="h-6 w-6 text-muted-foreground" />}
                  </div>
                  <h3 className="text-lg font-medium">No {status} orders</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {status === 'pending' && "New orders will appear here"}
                    {status === 'preparing' && "Orders being prepared will appear here"}
                    {status === 'ready' && "Orders ready for pickup will appear here"}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {ordersByStatus[status as KitchenOrderStatus].map((order) => 
                    renderOrderCard(order)
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
    </ErrorBoundary>
  );
}
