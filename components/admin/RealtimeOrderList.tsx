"use client";

import { useEffect, useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import type { BartenderOrder, OrderItem } from '@/lib/types/order';
import { parseOrderItems } from '@/lib/types/order';
import type { OrderRealtimePayload, ApiResponse } from '@/lib/types/api';

export default function RealtimeOrderList() {
  const [orders, setOrders] = useState<BartenderOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    const fetchOrders = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const { data, error: fetchError } = await supabase
          .from('bartender_orders')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20);

        if (fetchError) {
          console.error('Error fetching orders:', fetchError);
          setError(fetchError.message || 'Failed to fetch orders');
          setOrders([]);
        } else {
          setOrders(data || []);
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
        console.error('Failed to fetch orders:', errorMessage);
        setError('An unexpected error occurred');
        setOrders([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();

    const channel = supabase
      .channel('bartender-orders-stream')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bartender_orders' },
        (payload: OrderRealtimePayload) => {
          console.log('Realtime Change received:', payload);
          if (payload.eventType === 'INSERT') {
            setOrders((prev) => [payload.new as BartenderOrder, ...prev]);
          }
        }
      )
      .subscribe((status: 'SUBSCRIBED' | 'TIMED_OUT' | 'CLOSED' | 'CHANNEL_ERROR', err?: unknown) => {
        if (status === 'SUBSCRIBED') {
          console.log('Subscribed to orders table changes');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Error subscribing to orders table changes:', err);
          setError(`Subscription error: ${err instanceof Error ? err.message : 'Unknown error'}`);
        } else if (status === 'TIMED_OUT') {
          console.warn('Supabase subscription timed out.');
          setError('Realtime connection timed out. Please refresh.');
        }
      });

    return () => {
      console.log('Removing Supabase channel subscription');
      supabase.removeChannel(channel).catch((err: unknown) => {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred during subscription removal';
        console.error('Error removing Supabase channel:', errorMessage);
      });
    };

  }, []);

  return (
    <div className="space-y-2 p-4 border rounded-md bg-card">
      <h2 className="text-lg font-semibold">Realtime Orders</h2>
      
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading orders...</p>
      ) : error ? (
        <div className="p-4 border border-destructive/20 rounded-md bg-destructive/10">
          <p className="text-sm text-destructive">{error}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Please ensure your database is properly set up with an &apos;orders&apos; table.
          </p>
        </div>
      ) : orders.length === 0 ? (
        <p className="text-sm text-muted-foreground">No orders yet.</p>
      ) : (
        <ul className="space-y-2 max-h-96 overflow-y-auto pr-2">
          {Array.isArray(orders) && orders.map((o) => (
            <li
              key={o.id}
              className="border rounded p-2 bg-background flex flex-col"
            >
              <div className="flex justify-between text-sm font-medium">
                <span>Table {o.tab_id || o.table_location || 'N/A'}</span>
                <span>{o.created_at ? new Date(o.created_at).toLocaleTimeString() : 'Unknown time'}</span>
              </div>
              <ul className="text-xs ml-2 list-disc">
                {parseOrderItems(o.items).map((it: OrderItem, index: number) => (
                  <li key={it.id || `${o.id}-item-${index}`}>
                    {it.quantity}x {it.name} {it.price ? `($${it.price.toFixed(2)})` : ''}
                  </li>
                ))}
              </ul>
              <div className="text-xs text-muted-foreground mt-1">
                Status: <span className="font-medium">{o.status}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
