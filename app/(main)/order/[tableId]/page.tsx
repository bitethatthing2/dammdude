"use client";

import { useState, useEffect } from 'react';
import { useCartState, CartItem } from '@/lib/hooks/useCartState';
import { useLocationState } from '@/lib/hooks/useLocationState';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { OrdersResponse, ApiResponse } from '@/lib/types/api';

interface OrderPageProps {
  params: { tableId: string };
}

export default function OrderPage({ params }: OrderPageProps) {
  const { tableId } = params;
  const { location } = useLocationState();
  const { items, removeItem, updateQuantity, clearCart, getTotalPrice } = useCartState();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const handleSubmitOrder = async () => {
    if (items.length === 0) return;
    
    setIsSubmitting(true);
    try {
      // Get client instance
      const supabase = getSupabaseBrowserClient();

      // Convert cart items to order items
      const orderItems = items.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity
      }));

      // Submit to Supabase
      const { data, error } = await supabase
        .from('orders')
        .insert({
          table_id: tableId,
          location,
          status: 'pending',
          items: orderItems
        })
        .select() as ApiResponse<OrdersResponse[]>;

      if (error) throw error;
      
      setOrderId(data?.[0]?.id || null);
      clearCart();
      // TODO: Add success toast notification
    } catch (err) {
      console.error('Failed to submit order:', err);
      // TODO: Add error toast notification
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6">Your Order - Table {tableId}</h1>
      
      {orderId ? (
        <div className="text-center py-8">
          <h2 className="text-xl font-medium mb-2">Order Submitted!</h2>
          <p className="mb-4 text-muted-foreground">Your order has been sent to the bar.</p>
          <p className="text-sm">Order ID: {orderId}</p>
          <Button 
            className="mt-6" 
            onClick={() => setOrderId(null)}
          >
            Place Another Order
          </Button>
        </div>
      ) : (
        <>
          {items.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Your cart is empty.</p>
              <Button 
                className="mt-4" 
                onClick={() => window.location.href = '/menu'}
              >
                Go to Menu
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-4 mb-6">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between border-b pb-3">
                    <div>
                      <h3 className="font-medium">{item.name}</h3>
                      <div className="flex items-center mt-1">
                        <button 
                          className="w-6 h-6 rounded-full border flex items-center justify-center text-sm"
                          onClick={() => item.quantity > 1 ? updateQuantity(item.id, item.quantity - 1) : removeItem(item.id)}
                        >
                          -
                        </button>
                        <span className="mx-2">{item.quantity}</span>
                        <button 
                          className="w-6 h-6 rounded-full border flex items-center justify-center text-sm"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div className="text-right">
                      <div>{formatPrice(item.price * item.quantity)}</div>
                      <button 
                        className="text-xs text-destructive mt-1"
                        onClick={() => removeItem(item.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 mb-6">
                <div className="flex justify-between font-bold">
                  <span>Total:</span>
                  <span>{formatPrice(getTotalPrice())}</span>
                </div>
              </div>

              <Button 
                className="w-full" 
                onClick={handleSubmitOrder}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Order'}
              </Button>
            </>
          )}
        </>
      )}
    </div>
  );
}
