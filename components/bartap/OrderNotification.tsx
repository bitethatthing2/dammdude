"use client";

import { useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';
import { Bell, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatTimeDistance } from '@/lib/utils/date-utils';

interface OrderNotificationProps {
  orderId: string;
  status: 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  createdAt: string;
  estimatedTime?: number | null;
}

/**
 * Component to display order notifications with appropriate styling and actions
 */
export function OrderNotification({
  orderId,
  status,
  createdAt,
  estimatedTime
}: OrderNotificationProps) {
  const router = useRouter();
  const shortOrderId = orderId.slice(-6).toUpperCase();
  
  // Navigate to order details
  const viewOrderDetails = () => {
    router.push(`/orders/${orderId}`);
  };
  
  // Get appropriate icon based on order status
  const getStatusIcon = () => {
    switch (status) {
      case 'ready':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'preparing':
        return <Clock className="h-5 w-5 text-amber-500" />;
      case 'cancelled':
        return <Bell className="h-5 w-5 text-red-500" />;
      default:
        return <Bell className="h-5 w-5 text-primary" />;
    }
  };
  
  // Get appropriate title based on order status
  const getStatusTitle = () => {
    switch (status) {
      case 'ready':
        return 'Order Ready for Pickup!';
      case 'preparing':
        return 'Order Being Prepared';
      case 'cancelled':
        return 'Order Cancelled';
      case 'delivered':
        return 'Order Delivered';
      default:
        return 'Order Received';
    }
  };
  
  // Get appropriate description based on order status
  const getStatusDescription = () => {
    switch (status) {
      case 'ready':
        return `Your order #${shortOrderId} is ready for pickup!`;
      case 'preparing':
        return `Your order #${shortOrderId} is being prepared. ${
          estimatedTime ? `Estimated time: ${estimatedTime} minutes` : ''
        }`;
      case 'cancelled':
        return `Your order #${shortOrderId} has been cancelled.`;
      case 'delivered':
        return `Your order #${shortOrderId} has been delivered.`;
      default:
        return `Your order #${shortOrderId} has been received and will be prepared soon.`;
    }
  };
  
  return (
    <div className="flex flex-col space-y-2 w-full">
      <div className="flex items-start gap-3">
        <div className={cn(
          "flex-shrink-0 rounded-full p-2",
          status === 'ready' ? "bg-green-100" : 
          status === 'preparing' ? "bg-amber-100" : 
          status === 'cancelled' ? "bg-red-100" : 
          "bg-primary/10"
        )}>
          {getStatusIcon()}
        </div>
        
        <div className="flex-1 space-y-1">
          <p className="font-medium text-sm">{getStatusTitle()}</p>
          <p className="text-xs text-muted-foreground">{getStatusDescription()}</p>
          <p className="text-xs text-muted-foreground/70">
            {formatTimeDistance(createdAt)}
          </p>
        </div>
      </div>
      
      <Button 
        variant="outline" 
        size="sm" 
        className="w-full text-xs" 
        onClick={viewOrderDetails}
      >
        View Order Details
      </Button>
    </div>
  );
}
