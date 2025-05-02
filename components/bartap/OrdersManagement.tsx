"use client";

import { useState, useEffect } from 'react';
import { useAdminNotifications } from '@/components/bartap/AdminNotificationsProvider';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Clock, 
  Search, 
  Check, 
  X,
  FileText, 
  Bell,
  Loader2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from '@/components/ui/use-toast';
import { updateOrderStatus } from '@/lib/actions/order-actions';

interface Order {
  id: string;
  table_id: string;
  table_name?: string;
  status: 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  created_at: string;
  total_amount: number;
  items_count?: number;
}

interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  quantity: number;
  notes?: string;
  unit_price: number;
  subtotal: number;
  menu_item_name?: string;
}

/**
 * Component for managing orders in the admin panel
 * Displays pending and ready orders with filtering capabilities
 */
export function OrdersManagement() {
  const { pendingOrders, readyOrders, markOrderAsViewed } = useAdminNotifications();
  const [activeTab, setActiveTab] = useState('pending');
  const [displayedOrders, setDisplayedOrders] = useState<Order[]>([]);
  const [filterText, setFilterText] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [orderDetails, setOrderDetails] = useState<OrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [processingOrders, setProcessingOrders] = useState<Record<string, boolean>>({});
  
  const supabase = getSupabaseBrowserClient();
  
  // Update displayed orders based on active tab
  useEffect(() => {
    let orders = activeTab === 'pending' ? pendingOrders : readyOrders;
    
    // Apply filter if text exists
    if (filterText) {
      const lowerFilter = filterText.toLowerCase();
      orders = orders.filter(order => 
        order.id.toLowerCase().includes(lowerFilter) ||
        order.table_name?.toLowerCase().includes(lowerFilter)
      );
    }
    
    setDisplayedOrders(orders);
  }, [activeTab, pendingOrders, readyOrders, filterText]);
  
  // Load order details when an order is selected
  useEffect(() => {
    if (!selectedOrder) {
      setOrderDetails([]);
      return;
    }
    
    async function loadOrderDetails() {
      setIsLoading(true);
      
      try {
        // Fetch the order with its items JSON
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select('*')
          .eq('id', selectedOrder)
          .single();
          
        if (orderError) throw orderError;
        if (!orderData) throw new Error('Order not found');
        
        // Parse items from the JSONB items field
        let formattedItems: OrderItem[] = [];
        try {
          const itemsJson = orderData.items;
          const parsedItems = typeof itemsJson === 'string' ? JSON.parse(itemsJson) : itemsJson;
          
          if (Array.isArray(parsedItems)) {
            formattedItems = parsedItems.map((item: any, index: number) => ({
              id: item.id || `${selectedOrder}-item-${index}`,
              order_id: selectedOrder,
              menu_item_id: item.menu_item_id || item.id,
              menu_item_name: item.name,
              quantity: item.quantity || 1,
              notes: item.notes,
              unit_price: item.unit_price || item.price || 0,
              subtotal: (item.price || 0) * (item.quantity || 1)
            }));
          } else {
            console.warn(`Items field for order ${selectedOrder} is not an array:`, parsedItems);
          }
        } catch (parseError) {
          console.error(`Error parsing items JSON for order ${selectedOrder}:`, parseError);
          throw new Error('Failed to parse order items');
        }
        
        setOrderDetails(formattedItems);
        
        // Mark as viewed in notifications
        markOrderAsViewed(selectedOrder);
      } catch (error) {
        console.error('Error loading order details:', error);
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to load order details',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    }
    
    loadOrderDetails();
  }, [selectedOrder, supabase, markOrderAsViewed]);
  
  // Format time distance
  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (e) {
      return 'Invalid date';
    }
  };
  
  // Handle order status update
  const handleUpdateOrderStatus = async (orderId: string, newStatus: 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled') => {
    try {
      // Set processing state
      setProcessingOrders(prev => ({ ...prev, [orderId]: true }));
      
      // Call server action to update status and send notifications if needed
      const result = await updateOrderStatus(orderId, newStatus === 'delivered' ? 'completed' : newStatus);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update order status');
      }
      
      // Show success toast
      toast({
        title: 'Order Updated',
        description: `Order status changed to ${newStatus}${result.notificationSent ? ' and customer notified' : ''}`,
        variant: 'default',
      });
      
      // Refresh orders (or update local state)
      if (newStatus === 'ready' || newStatus === 'delivered' || newStatus === 'cancelled') {
        // Remove from current tab's list
        setDisplayedOrders(prev => prev.filter(order => order.id !== orderId));
      } else {
        // Update in current list
        setDisplayedOrders(prev => 
          prev.map(order => order.id === orderId ? { ...order, status: newStatus } : order)
        );
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update order status',
        variant: 'destructive',
      });
    } finally {
      // Clear processing state
      setProcessingOrders(prev => ({ ...prev, [orderId]: false }));
    }
  };
  
  // View order details
  const viewOrderDetails = async (orderId: string) => {
    if (!orderId) return;
    setSelectedOrder(orderId);
  };
  
  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Orders list */}
      <div className="flex-1">
        <Card>
          <CardHeader className="space-y-2 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle>Active Orders</CardTitle>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
                <TabsList>
                  <TabsTrigger value="pending" className="flex gap-2 items-center">
                    Pending
                    {pendingOrders.length > 0 && (
                      <Badge variant="secondary">{pendingOrders.length}</Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="ready" className="flex gap-2 items-center">
                    Ready
                    {readyOrders.length > 0 && (
                      <Badge variant="secondary">{readyOrders.length}</Badge>
                    )}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search orders..."
                className="pl-8"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
              />
            </div>
          </CardHeader>
          
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsContent value="pending" className="m-0">
                {displayedOrders.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No pending orders</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {displayedOrders.map(order => (
                      <div
                        key={order.id}
                        className={`p-4 border rounded-md cursor-pointer hover:bg-muted/50 transition-colors ${
                          selectedOrder === order.id ? 'bg-muted/70 border-primary' : ''
                        }`}
                        onClick={() => viewOrderDetails(order.id)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium flex items-center gap-2">
                              Table {order.table_name || order.table_id}
                              <Badge variant="secondary" className="text-xs font-normal">
                                #{order.id.slice(-6).toUpperCase()}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                              <Clock className="h-3 w-3" />
                              {formatTime(order.created_at)}
                            </div>
                          </div>
                          {/* getStatusBadge(order.status) */}
                        </div>
                        <CardFooter className="flex justify-between pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => viewOrderDetails(order.id)}
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Details
                          </Button>
                          
                          {order.status === 'pending' && (
                            <Button
                              size="sm"
                              onClick={() => handleUpdateOrderStatus(order.id, 'preparing')}
                              disabled={processingOrders[order.id]}
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
                              size="sm"
                              onClick={() => handleUpdateOrderStatus(order.id, 'ready')}
                              disabled={processingOrders[order.id]}
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
                              size="sm"
                              onClick={() => handleUpdateOrderStatus(order.id, 'delivered')}
                              disabled={processingOrders[order.id]}
                            >
                              {processingOrders[order.id] ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <Check className="h-4 w-4 mr-2" />
                              )}
                              Mark Delivered
                            </Button>
                          )}
                        </CardFooter>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="ready" className="m-0">
                {displayedOrders.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No orders ready for pickup</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {displayedOrders.map(order => (
                      <div
                        key={order.id}
                        className={`p-4 border rounded-md cursor-pointer hover:bg-muted/50 transition-colors ${
                          selectedOrder === order.id ? 'bg-muted/70 border-primary' : ''
                        }`}
                        onClick={() => viewOrderDetails(order.id)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium flex items-center gap-2">
                              Table {order.table_name || order.table_id}
                              <Badge variant="secondary" className="text-xs font-normal">
                                #{order.id.slice(-6).toUpperCase()}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                              <Clock className="h-3 w-3" />
                              {formatTime(order.created_at)}
                            </div>
                          </div>
                          {/* getStatusBadge(order.status) */}
                        </div>
                        <CardFooter className="flex justify-between pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => viewOrderDetails(order.id)}
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Details
                          </Button>
                          
                          {order.status === 'pending' && (
                            <Button
                              size="sm"
                              onClick={() => handleUpdateOrderStatus(order.id, 'preparing')}
                              disabled={processingOrders[order.id]}
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
                              size="sm"
                              onClick={() => handleUpdateOrderStatus(order.id, 'ready')}
                              disabled={processingOrders[order.id]}
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
                              size="sm"
                              onClick={() => handleUpdateOrderStatus(order.id, 'delivered')}
                              disabled={processingOrders[order.id]}
                            >
                              {processingOrders[order.id] ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <Check className="h-4 w-4 mr-2" />
                              )}
                              Mark Delivered
                            </Button>
                          )}
                        </CardFooter>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      
      {/* Order details panel */}
      <div className="w-full lg:w-[450px]">
        <Card>
          {selectedOrder ? (
            <>
              <CardHeader>
                <CardTitle>Order Details</CardTitle>
                <CardDescription>
                  #{selectedOrder.slice(-6).toUpperCase()}
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <>
                    {orderDetails.length === 0 ? (
                      <div className="text-center py-4">
                        <p className="text-muted-foreground">No items found</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {orderDetails.map(item => (
                          <div key={item.id} className="flex justify-between pb-3 border-b last:border-0 last:pb-0">
                            <div>
                              <div className="font-medium">{item.menu_item_name}</div>
                              <div className="text-sm">Qty: {item.quantity}</div>
                              {item.notes && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  Note: {item.notes}
                                </div>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="font-medium">${(item.subtotal).toFixed(2)}</div>
                              <div className="text-xs text-muted-foreground">
                                ${(item.unit_price).toFixed(2)} each
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        <div className="mt-4 pt-4 border-t">
                          <div className="flex justify-between font-bold">
                            <span>Total</span>
                            <span>
                              ${orderDetails.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
              
              <CardFooter className="flex flex-wrap gap-2">
                {/* Show different action buttons based on current status */}
                {displayedOrders.find(o => o.id === selectedOrder)?.status === 'pending' && (
                  <>
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => handleUpdateOrderStatus(selectedOrder, 'preparing')}
                      disabled={processingOrders[selectedOrder]}
                    >
                      {processingOrders[selectedOrder] ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <FileText className="h-4 w-4 mr-2" />
                      )}
                      Start Preparing
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border-red-200"
                      onClick={() => handleUpdateOrderStatus(selectedOrder, 'cancelled')}
                      disabled={processingOrders[selectedOrder]}
                    >
                      {processingOrders[selectedOrder] ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <X className="h-4 w-4 mr-2" />
                      )}
                      Cancel
                    </Button>
                  </>
                )}
                
                {displayedOrders.find(o => o.id === selectedOrder)?.status === 'preparing' && (
                  <Button 
                    className="w-full"
                    onClick={() => handleUpdateOrderStatus(selectedOrder, 'ready')}
                    disabled={processingOrders[selectedOrder]}
                  >
                    {processingOrders[selectedOrder] ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Bell className="h-4 w-4 mr-2" />
                    )}
                    Mark Ready for Pickup
                  </Button>
                )}
                
                {displayedOrders.find(o => o.id === selectedOrder)?.status === 'ready' && (
                  <Button 
                    className="w-full"
                    onClick={() => handleUpdateOrderStatus(selectedOrder, 'delivered')}
                    disabled={processingOrders[selectedOrder]}
                  >
                    {processingOrders[selectedOrder] ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4 mr-2" />
                    )}
                    Mark as Delivered
                  </Button>
                )}
              </CardFooter>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-[400px] text-center p-4">
              <div className="rounded-full bg-muted p-3 mb-3">
                <FileText className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="font-medium text-lg mb-1">No Order Selected</h3>
              <p className="text-muted-foreground text-sm max-w-[250px]">
                Select an order from the list to view its details and take actions
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
