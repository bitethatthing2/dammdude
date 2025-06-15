import React, { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client'; // Use your centralized client
import { Database } from '@/types/supabase'; // Use the generated types from your local DB

// Type definitions based on your actual database schema
type BartenderOrder = Database['public']['Tables']['bartender_orders']['Row'];
type OrderStatus = 'pending' | 'accepted' | 'preparing' | 'ready' | 'delivered' | 'completed' | 'cancelled';

// Since items is JSONB in the database, it's already parsed
type OrderItem = {
  id: string;
  name: string;
  quantity: number;
  price: number;
  notes?: string;
  customizations?: Record<string, unknown>;
};

// Extended order type with typed items
interface OrderWithDetails extends Omit<BartenderOrder, 'items'> {
  items: OrderItem[];
}

// Props interface for the component
interface CustomerOrderStatusProps {
  customerId: string;
  onOrderUpdate?: (order: OrderWithDetails) => void;
}

// Status display configuration
const STATUS_CONFIG: Record<OrderStatus, {
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
  delivered: {
    label: 'Delivered',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    icon: '✨'
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
  }
};

// Define the realtime payload structure
interface RealtimePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: BartenderOrder;
  old: BartenderOrder;
  errors: string[] | null;
  schema: string;
  table: string;
  commit_timestamp: string;
}

export const CustomerOrderStatus: React.FC<CustomerOrderStatusProps> = ({ 
  customerId, 
  onOrderUpdate 
}) => {
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Get the Supabase client
  const supabase = createClient();

  const handleRealtimeUpdate = useCallback((payload: RealtimePayload) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    switch (eventType) {
      case 'INSERT':
        if (newRecord) {
          const newOrder: OrderWithDetails = {
            ...newRecord,
            items: (newRecord.items as OrderItem[]) || []
          };
          setOrders(prev => [newOrder, ...prev]);
          onOrderUpdate?.(newOrder);
        }
        break;

      case 'UPDATE':
        if (newRecord) {
          const updatedOrder: OrderWithDetails = {
            ...newRecord,
            items: (newRecord.items as OrderItem[]) || []
          };
          setOrders(prev => 
            prev.map((order: OrderWithDetails) => 
              order.id === newRecord.id ? updatedOrder : order
            )
          );
          onOrderUpdate?.(updatedOrder);
        }
        break;

      case 'DELETE':
        if (oldRecord) {
          setOrders(prev => prev.filter(order => order.id !== oldRecord.id));
        }
        break;
    }
  }, [onOrderUpdate]);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('bartender_orders')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Since items is JSONB, it's already parsed - just ensure it's typed correctly
      const ordersWithTypedItems: OrderWithDetails[] = (data || []).map((order: BartenderOrder) => ({
        ...order,
        items: (order.items as OrderItem[]) || []
      }));

      setOrders(ordersWithTypedItems);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  }, [customerId, supabase]);

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
        (payload: RealtimePayload) => {
          handleRealtimeUpdate(payload);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [customerId, fetchOrders, handleRealtimeUpdate, supabase]);

  const formatTime = (dateString: string | null) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const calculateProgress = (status: OrderStatus | null): number => {
    const progressMap: Record<OrderStatus, number> = {
      'pending': 20,
      'accepted': 35,
      'preparing': 50,
      'ready': 75,
      'delivered': 90,
      'completed': 100,
      'cancelled': 0
    };
    return progressMap[status as OrderStatus] || 0;
  };

  // Progress bar width classes
  const getProgressClass = (progress: number): string => {
    if (progress === 0) return 'w-0';
    if (progress <= 20) return 'w-1/5';
    if (progress <= 35) return 'w-1/3';
    if (progress <= 50) return 'w-1/2';
    if (progress <= 75) return 'w-3/4';
    if (progress <= 90) return 'w-11/12';
    return 'w-full';
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
      {orders.map((order: OrderWithDetails) => {
        const currentStatus = (order.status || 'pending') as OrderStatus;
        const statusConfig = STATUS_CONFIG[currentStatus];
        const progress = calculateProgress(currentStatus);
        const progressClass = getProgressClass(progress);

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
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div 
                  className={`bg-blue-600 h-2 rounded-full transition-all duration-500 ${progressClass}`}
                />
              </div>
            </div>

            {/* Order Items */}
            <div className="mb-4">
              <h4 className="font-medium mb-2">Items:</h4>
              <ul className="space-y-1">
                {order.items?.map((item, index) => (
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

            {/* Total and Payment Status */}
            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total:</span>
                <span className="text-lg font-semibold">
                  ${Number(order.total_amount).toFixed(2)}
                </span>
              </div>
              {order.payment_status && order.payment_status !== 'pending' && (
                <div className="text-sm text-gray-500 mt-1">
                  Payment: {order.payment_status === 'paid_at_bar' ? 'Paid at Bar' : 'Added to Tab'}
                </div>
              )}
            </div>

            {/* Customer Notes */}
            {order.customer_notes && (
              <div className="mt-3 p-3 bg-gray-50 rounded">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Note:</span> {order.customer_notes}
                </p>
              </div>
            )}

            {/* Bartender Notes (if any) */}
            {order.bartender_notes && (
              <div className="mt-3 p-3 bg-blue-50 rounded">
                <p className="text-sm text-blue-600">
                  <span className="font-medium">From Bartender:</span> {order.bartender_notes}
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};