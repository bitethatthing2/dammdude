'use client';

import { useState } from 'react';
import { Bell, Check, Clock, Coffee, Loader2, X, FileText, Search, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { useOrderManagement } from '@/lib/hooks/useUnifiedOrders';
import { formatDistanceToNow } from 'date-fns/formatDistanceToNow';
import { StatusBadge } from './ui/StatusBadge';
import { toast } from '@/components/ui/use-toast';
import type { OrderStatus, UnifiedOrder as Order, OrderItem } from '@/lib/hooks/useUnifiedOrders';

/**
 * Unified Order Management Component
 * Standardized order management UI for both admin and employee interfaces
 * Supports both admin dashboard and employee view with the same codebase
 */
export default function OrderManagement() {
  const [activeTab, setActiveTab] = useState<OrderStatus>('pending');
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [filterText, setFilterText] = useState('');
  
  // Use the unified hook with real-time updates enabled
  const {
    orders,
    isLoading,
    processingOrders,
    updateOrderStatus,
    fetchOrders,
    pendingOrders,
    preparingOrders,
    readyOrders,
    completedOrders,
    lastFetchTime
  } = useOrderManagement({
    status: ['pending', 'preparing', 'ready', 'completed'],
    refreshInterval: 30000,
    enableRealtime: true,
    onNewOrder: (order) => {
      toast({
        title: "New Order",
        description: `New order from Table ${order.tab_id || order.table_location || 'N/A'}`,
        variant: "default"
      });
    },
    onOrderStatusChange: (order, previousStatus) => {
      if (previousStatus === 'preparing' && order.status === 'ready') {
        // Play notification sound for ready orders
        try {
          const audio = new Audio('/sounds/status-change.mp3');
          audio.play().catch(err => console.error('Error playing sound:', err));
        } catch (err) {
          console.error('Error with notification sound:', err);
        }
      }
    }
  });

  // Handler for manual refresh
  const handleRefresh = async () => {
    const refreshButton = document.getElementById('refresh-button');
    if (refreshButton) {
      refreshButton.classList.add('animate-spin');
    }
    
    await fetchOrders();
    
    setTimeout(() => {
      if (refreshButton) {
        refreshButton.classList.remove('animate-spin');
      }
    }, 500);
  };
  
  // Filter orders based on search text
  const getFilteredOrders = () => {
    let filteredOrders: Order[] = [];
    
    // Select orders based on active tab
    switch (activeTab) {
      case 'pending':
        filteredOrders = pendingOrders;
        break;
      case 'preparing':
        filteredOrders = preparingOrders;
        break;
      case 'ready':
        filteredOrders = readyOrders;
        break;
      case 'completed':
        filteredOrders = completedOrders;
        break;
      default:
        filteredOrders = pendingOrders;
    }
    
    // Apply text filter if present
    if (filterText) {
      const lowerFilter = filterText.toLowerCase();
      return filteredOrders.filter(order =>
        order.id.toLowerCase().includes(lowerFilter) ||
        (order.table_location?.toLowerCase() || '').includes(lowerFilter) ||
        (order.tab_id?.toLowerCase() || '').includes(lowerFilter)
      );
    }
    
    return filteredOrders;
  };
  
  // Get current order details
  const getSelectedOrderDetails = () => {
    if (!selectedOrder) return null;
    return orders.find(order => order.id === selectedOrder);
  };
  
  // Format time display
  const formatTime = (dateString?: string | null) => {
    if (!dateString) return 'Unknown time';
    
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      console.error('Error formatting time:', error);
      return 'Invalid date';
    }
  };
  
  // Get next status based on current status
  const getNextStatus = (currentStatus: OrderStatus): OrderStatus => {
    switch (currentStatus) {
      case 'pending':
        return 'preparing';
      case 'preparing':
        return 'ready';
      case 'ready':
        return 'completed';
      case 'completed':
      case 'cancelled':
        return currentStatus;
      default:
        return 'pending';
    }
  };
  
  // Handle status update button click
  const handleStatusUpdate = async (orderId: string, newStatus: OrderStatus) => {
    await updateOrderStatus(orderId, newStatus);
    
    // If the order was the selected one and is now removed from view, clear selection
    if (selectedOrder === orderId && newStatus !== activeTab) {
      setSelectedOrder(null);
    }
  };
  
  // Calculate total amount for order (fallback if total_amount is missing)
  const calculateOrderTotal = (items?: OrderItem[]) => {
    if (!items || items.length === 0) return 0;
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };
  
  // Get filtered orders for current tab
  const filteredOrders = getFilteredOrders();
  const selectedOrderDetails = getSelectedOrderDetails();
  
  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Main orders list column */}
      <div className="flex-1">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">Order Management</CardTitle>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
                className="flex items-center gap-1"
              >
                <RefreshCw id="refresh-button" className="h-4 w-4" />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
            </div>
            
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search orders by ID or table..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                className="pl-10"
              />
              {filterText && (
                <X 
                  className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 cursor-pointer"
                  onClick={() => setFilterText('')}
                />
              )}
            </div>
            
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as OrderStatus)} className="mt-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="pending" className="relative">
                  Pending
                  {pendingOrders.length > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-white" style={{
                      backgroundColor: 'hsl(var(--primary))',
                      color: 'hsl(var(--primary-foreground))'
                    }}>
                      {pendingOrders.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="preparing" className="relative">
                  Preparing
                  {preparingOrders.length > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0" style={{
                      backgroundColor: 'hsl(var(--inactive))',
                      color: 'hsl(var(--primary-foreground))'
                    }}>
                      {preparingOrders.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="ready" className="relative">
                  Ready
                  {readyOrders.length > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0" style={{
                      backgroundColor: 'hsl(var(--active))',
                      color: 'hsl(var(--primary-foreground))'
                    }}>
                      {readyOrders.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="completed">
                  Complete
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          
          <CardContent>
            <ScrollArea className="h-[calc(100vh-250px)]">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="bg-muted/50 p-4 rounded-full mb-3">
                    {activeTab === 'pending' && <Bell className="h-8 w-8 text-muted-foreground" />}
                    {activeTab === 'preparing' && <Coffee className="h-8 w-8 text-muted-foreground" />}
                    {activeTab === 'ready' && <Check className="h-8 w-8 text-muted-foreground" />}
                    {activeTab === 'completed' && <Clock className="h-8 w-8 text-muted-foreground" />}
                  </div>
                  <p className="text-muted-foreground">No {activeTab} orders</p>
                  {!isLoading && lastFetchTime && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Last updated: {formatTime(lastFetchTime.toISOString())}
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredOrders.map((order) => (
                    <Card 
                      key={order.id}
                      className={`cursor-pointer border ${selectedOrder === order.id ? 'border-primary' : 'border-border'} hover:shadow-md transition-shadow`}
                      onClick={() => setSelectedOrder(order.id)}
                    >
                      <CardHeader className="py-3 px-4">
                        <div className="flex justify-between items-center">
                          <div className="flex flex-col">
                            <div className="font-medium flex items-center">
                              Table {order.tab_id || order.table_location || 'N/A'}
                              <Badge variant="outline" className="ml-2 text-xs">
                                #{order.id.substring(0, 6)}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground flex items-center">
                              <Clock className="h-3 w-3 mr-1 inline" />
                              {formatTime(order.created_at)}
                            </div>
                          </div>
                          <StatusBadge status={order.status} />
                        </div>
                      </CardHeader>
                      
                      <CardFooter className="py-3 px-4 flex justify-between items-center border-t">
                        <div>
                          <span className="font-medium">
                            ${order.total_amount?.toFixed(2) || calculateOrderTotal(order.items).toFixed(2) || '0.00'}
                          </span>
                          <span className="text-sm text-muted-foreground ml-2">
                            {order.items?.length || 0} items
                          </span>
                        </div>
                        
                        <Button
                          variant="default"
                          size="sm"
                          disabled={processingOrders[order.id] || order.status === 'completed' || order.status === 'cancelled'}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusUpdate(order.id, getNextStatus(order.status));
                          }}
                        >
                          {processingOrders[order.id] ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <>
                              {order.status === 'pending' && <Coffee className="h-4 w-4 mr-2" />}
                              {order.status === 'preparing' && <Bell className="h-4 w-4 mr-2" />}
                              {order.status === 'ready' && <Check className="h-4 w-4 mr-2" />}
                              {order.status === 'completed' && <Check className="h-4 w-4 mr-2" />}
                            </>
                          )}
                          {order.status === 'pending' && 'Start Preparing'}
                          {order.status === 'preparing' && 'Mark Ready'}
                          {order.status === 'ready' && 'Complete Order'}
                          {order.status === 'completed' && 'Completed'}
                          {order.status === 'cancelled' && 'Cancelled'}
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
      
      {/* Order details sidebar */}
      <div className="w-full lg:w-[400px]">
        <Card className="h-full">
          {selectedOrderDetails ? (
            <>
              <CardHeader>
                <CardTitle className="text-lg">
                  Order Details
                </CardTitle>
                <CardDescription>
                  #{selectedOrderDetails.id.substring(0, 8)}
                </CardDescription>
                <div className="flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">
                    {formatTime(selectedOrderDetails.created_at)}
                  </div>
                  <StatusBadge status={selectedOrderDetails.status} />
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="mb-4">
                  <h3 className="font-medium text-muted-foreground mb-2">Items</h3>
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-3">
                      {(selectedOrderDetails.items || []).map((item: OrderItem, index: number) => (
                        <div key={item.id || `${selectedOrderDetails.id}-${item.name}-${index}`} className="flex justify-between pb-3 border-b last:border-0 last:pb-0">
                          <div>
                            <div className="font-medium">{item.name}</div>
                            <div className="text-sm">Qty: {item.quantity}</div>
                            {item.notes && (
                              <div className="text-xs text-muted-foreground mt-1 italic">
                                &quot;{item.notes}&quot;
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <div>${(item.price * item.quantity).toFixed(2)}</div>
                            <div className="text-xs text-muted-foreground">
                              ${item.price.toFixed(2)} each
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
                
                {selectedOrderDetails.customer_notes && (
                  <div className="mb-4 p-3 bg-muted rounded-md">
                    <h3 className="font-medium text-sm mb-1">Order Notes:</h3>
                    <p className="text-sm">{selectedOrderDetails.customer_notes}</p>
                  </div>
                )}
                
                <div className="pt-3 border-t flex justify-between items-center font-medium">
                  <span>Total Amount</span>
                  <span>
                    ${selectedOrderDetails.total_amount?.toFixed(2) || 
                      calculateOrderTotal(selectedOrderDetails.items).toFixed(2) || 
                      '0.00'}
                  </span>
                </div>
              </CardContent>
              
              <CardFooter className="flex gap-2">
                {selectedOrderDetails.status !== 'completed' && selectedOrderDetails.status !== 'cancelled' && (
                  <Button
                    className="flex-1"
                    disabled={processingOrders[selectedOrderDetails.id]}
                    onClick={() => {
                      handleStatusUpdate(selectedOrderDetails.id, getNextStatus(selectedOrderDetails.status));
                    }}
                  >
                    {processingOrders[selectedOrderDetails.id] ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <>
                        {selectedOrderDetails.status === 'pending' && <Coffee className="h-4 w-4 mr-2" />}
                        {selectedOrderDetails.status === 'preparing' && <Bell className="h-4 w-4 mr-2" />}
                        {selectedOrderDetails.status === 'ready' && <Check className="h-4 w-4 mr-2" />}
                      </>
                    )}
                    {selectedOrderDetails.status === 'pending' && 'Start Preparing'}
                    {selectedOrderDetails.status === 'preparing' && 'Mark Ready'}
                    {selectedOrderDetails.status === 'ready' && 'Complete Order'}
                  </Button>
                )}
                
                {selectedOrderDetails.status !== 'completed' && selectedOrderDetails.status !== 'cancelled' && (
                  <Button
                    variant="outline"
                    disabled={processingOrders[selectedOrderDetails.id]}
                    onClick={() => handleStatusUpdate(selectedOrderDetails.id, 'cancelled')}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                )}
                
                {(selectedOrderDetails.status === 'completed' || selectedOrderDetails.status === 'cancelled') && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleRefresh}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh Orders
                  </Button>
                )}
              </CardFooter>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-[500px] text-center">
              <div className="bg-muted/50 p-4 rounded-full mb-4">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-medium mb-2">No Order Selected</h3>
              <p className="text-muted-foreground text-sm max-w-[250px]">
                Select an order from the list to view details
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
