import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase'; // Adjust path to your generated types

// Initialize Supabase client with proper typing
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Type definitions based on your database schema
type BartenderOrder = Database['public']['Tables']['bartender_orders']['Row'];
type OrderStatus = BartenderOrder['status'];

// Extended order type with items details
interface OrderWithDetails extends BartenderOrder {
  // Parse the JSON items field for better type safety
  parsedItems?: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
    notes?: string;
    customizations?: Record<string, any>;
  }>;
}

// Props interface for the component
interface CustomerOrderStatusProps {
  customerId: string;
  onOrderUpdate?: (order: OrderWithDetails) => void;
}

// Status display configuration
const STATUS_CONFIG: Record<string, {
  label: string;
  color: string;
  bgColor: string;
  icon: string;
}> = {
  pending: {
    label: 'Pending',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    icon: '⏳'
  },
  accepted: {
    label: 'Accepted',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    icon: '✅'
  },
  preparing: {
    label: 'Preparing',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    icon: '👨‍🍳'
  },
  ready: {
    label: 'Ready',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    icon: '🎉'
  },
  completed: {
    label: 'Completed',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    icon: '✔️'
  },
  cancelled: {
    label: 'Cancelled',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    icon: '❌'
  },
  expired: {
    label: 'Expired',
    color: 'text-gray-500',
    bgColor: 'bg-gray-100',
    icon: '⏰'
  }
};

export const CustomerOrderStatus: React.FC<CustomerOrderStatusProps> = ({ 
  customerId, 
  onOrderUpdate 
}) => {
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch initial orders
    fetchOrders();

    // Set up real-time subscription
    const subscription = supabase
      .channel('customer-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bartender_orders',
          filter: `customer_id=eq.${customerId}`
        },
        (payload) => {
          handleRealtimeUpdate(payload);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [customerId]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('bartender_orders')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Parse items JSON for each order
      const ordersWithParsedItems: OrderWithDetails[] = (data || []).map(order => ({
        ...order,
        parsedItems: order.items ? JSON.parse(order.items as string) : []
      }));

      setOrders(ordersWithParsedItems);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const handleRealtimeUpdate = (payload: any) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    switch (eventType) {
      case 'INSERT':
        const newOrder: OrderWithDetails = {
          ...newRecord,
          parsedItems: newRecord.items ? JSON.parse(newRecord.items) : []
        };
        setOrders(prev => [newOrder, ...prev]);
        onOrderUpdate?.(newOrder);
        break;

      case 'UPDATE':
        const updatedOrder: OrderWithDetails = {
          ...newRecord,
          parsedItems: newRecord.items ? JSON.parse(newRecord.items) : []
        };
        setOrders(prev => 
          prev.map(order => 
            order.id === newRecord.id ? updatedOrder : order
          )
        );
        onOrderUpdate?.(updatedOrder);
        break;

      case 'DELETE':
        setOrders(prev => prev.filter(order => order.id !== oldRecord.id));
        break;
    }
  };

  const formatTime = (dateString: string | null) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const calculateProgress = (status: string | null): number => {
    const progressMap: Record<string, number> = {
      'pending': 20,
      'accepted': 40,
      'preparing': 60,
      'ready': 80,
      'completed': 100,
      'cancelled': 0,
      'expired': 0
    };
    return progressMap[status || 'pending'] || 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">Error: {error}</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center p-8 text-gray-500">
        No active orders
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => {
        const statusConfig = STATUS_CONFIG[order.status || 'pending'];
        const progress = calculateProgress(order.status);

        return (
          <div key={order.id} className="bg-white rounded-lg shadow-md p-6">
            {/* Order Header */}
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold">
                  Order #{order.order_number}
                </h3>
                <p className="text-sm text-gray-500">
                  {order.order_type === 'pickup' ? '🛍️ Pickup' : '🪑 Table Service'}
                  {order.table_location && ` - ${order.table_location}`}
                </p>
              </div>
              <div className={`px-3 py-1 rounded-full ${statusConfig.bgColor}`}>
                <span className={`text-sm font-medium ${statusConfig.color}`}>
                  {statusConfig.icon} {statusConfig.label}
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Order Items */}
            <div className="mb-4">
              <h4 className="font-medium mb-2">Items:</h4>
              <ul className="space-y-1">
                {order.parsedItems?.map((item, index) => (
                  <li key={index} className="text-sm text-gray-600">
                    {item.quantity}x {item.name} 
                    {item.notes && <span className="italic"> - {item.notes}</span>}
                  </li>
                ))}
              </ul>
            </div>

            {/* Timeline */}
            <div className="text-sm text-gray-500 space-y-1">
              {order.created_at && (
                <div>Ordered: {formatTime(order.created_at)}</div>
              )}
              {order.accepted_at && (
                <div>Accepted: {formatTime(order.accepted_at)}</div>
              )}
              {order.ready_at && (
                <div>Ready: {formatTime(order.ready_at)}</div>
              )}
              {order.completed_at && (
                <div>Completed: {formatTime(order.completed_at)}</div>
              )}
            </div>

            {/* Total */}
            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total:</span>
                <span className="text-lg font-semibold">
                  ${order.total_amount.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Customer Notes */}
            {order.customer_notes && (
              <div className="mt-3 p-3 bg-gray-50 rounded">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Note:</span> {order.customer_notes}
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};