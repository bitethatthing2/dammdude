"use client";

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, ArrowRight, Bell, Clock, Home, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { formatOrderDate } from '@/lib/utils/date-utils';
import { useOrderSubscription } from '@/lib/hooks/useOrderSubscription';
import { StatusBadge } from '@/components/bartap/ui/StatusBadge';
import { formatCurrency } from '@/lib/utils/format-utils';

interface TableData {
  id: string;
  name: string;
  section?: string;
}

interface OrderConfirmationProps {
  orderId: string;
  tableData: TableData;
}

export function OrderConfirmation({ orderId, tableData }: OrderConfirmationProps) {
  // Use our custom hook for order data and real-time updates
  const { 
    order,
    orderItems,
    isLoading,
    error,
    isReady 
  } = useOrderSubscription(orderId, {
    // Show notifications for important status changes
    showNotifications: true
  });
  
  // Format date
  const formattedDate = order?.created_at 
    ? formatOrderDate(order.created_at)
    : '';
  
  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="h-12 w-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            <p>Loading order details...</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (error || !order) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">
              {error || 'Order not found'}
            </p>
            <Link href="/menu">
              <Button>Back to Menu</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3 text-center">
          <div className="mx-auto mb-2">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <CheckCircle className="h-10 w-10 text-primary" />
            </div>
          </div>
          <CardTitle>Order Placed!</CardTitle>
          <p className="text-muted-foreground">Order <span className="font-mono font-medium">#{orderId.slice(-6).toUpperCase()}</span></p>
        </CardHeader>
        
        <CardContent>
          <div className="flex justify-center mb-6">
            <StatusBadge status={order.status} className="px-3 py-1 text-sm" />
          </div>
          
          <div className="bg-muted/20 rounded-lg p-4 mb-6 text-center">
            <h3 className="font-medium mb-2 flex items-center justify-center">
              <Bell className="h-4 w-4 mr-2 text-primary" />
              Notification Status
            </h3>
            <p className="text-sm text-muted-foreground mb-2">
              We'll notify you when your order is ready!
            </p>
            <p className="text-xs">
              {Notification.permission === 'granted' 
                ? '✅ Notifications enabled' 
                : '⚠️ Enable notifications for order updates'}
            </p>
          </div>
          
          {order.estimated_time && (
            <div className="text-center mb-6 bg-primary/10 rounded-lg p-4">
              <h3 className="font-medium mb-1 flex items-center justify-center">
                <Clock className="h-4 w-4 mr-2 text-primary" />
                Estimated Preparation Time
              </h3>
              <p className="text-2xl font-bold text-primary">
                {order.estimated_time} minutes
              </p>
            </div>
          )}
          
          <div className="space-y-4 border-t border-border pt-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Table</span>
              <span>{tableData.name}</span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Time</span>
              <span>{formattedDate}</span>
            </div>
            
            <hr className="my-2" />
            
            <h3 className="font-medium">Items</h3>
            <div className="space-y-2">
              {orderItems.map(item => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>
                    {item.quantity}x {item.menu_item_name}
                    {item.notes && (
                      <p className="text-xs text-muted-foreground">{item.notes}</p>
                    )}
                  </span>
                  <span>{formatCurrency(item.unit_price * item.quantity)}</span>
                </div>
              ))}
            </div>
            
            <hr className="my-2" />
            
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span>{formatCurrency(order.total_amount)}</span>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex-col space-y-2">
          <p className="text-sm text-center text-muted-foreground w-full">
            {order.status === 'ready' ? (
              'Your order is ready! Please pick it up at the counter.'
            ) : order.status === 'delivered' ? (
              'Enjoy your meal!'
            ) : (
              'We\'ll notify you when your order is ready.'
            )}
          </p>
          
          <div className="grid grid-cols-2 gap-4 mt-6">
            <Link href="/menu">
              <Button variant="outline" className="w-full gap-2 h-12">
                <Home className="h-4 w-4" />
                <span>Menu</span>
              </Button>
            </Link>
            
            <Link href="/cart">
              <Button className="w-full gap-2 h-12">
                <ShoppingBag className="h-4 w-4" />
                <span>New Order</span>
              </Button>
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
