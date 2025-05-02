"use client";

import { useCallback, useRef } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { captureError } from '@/lib/utils/error-utils';
import type { RealtimeChannel } from '@supabase/supabase-js';

// Interface for Supabase real-time payload
export interface RealtimePayload<T = Record<string, any>> {
  new: T;
  old: T;
  commit_timestamp: string;
  errors: any[] | null;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  schema: string;
  table: string;
}

interface UseOrderSubscriptionOptions {
  onInsert?: (payload: RealtimePayload) => void;
  onUpdate?: (payload: RealtimePayload) => void;
  onDelete?: (payload: RealtimePayload) => void;
  table?: string;
  schema?: string;
  filter?: string;
}

/**
 * Custom hook for subscribing to real-time order updates
 * Provides functions to set up and clear Supabase real-time subscriptions
 */
export function useOrderSubscription({
  onInsert,
  onUpdate,
  onDelete,
  table = 'orders',
  schema = 'public',
  filter = '*'
}: UseOrderSubscriptionOptions = {}) {
  // Use refs to store subscription and prevent dependency changes
  const channelRef = useRef<any>(null);
  
  // Set up subscription
  const setupSubscription = useCallback(() => {
    try {
      // Get Supabase client
      const supabase = getSupabaseBrowserClient();
      
      // Create a unique channel name
      const channelName = `${table}-changes-${Date.now()}`;
      
      // Create channel
      const channel = supabase.channel(channelName);
      
      // Set up INSERT listener if callback provided
      if (onInsert) {
        channel.on(
          'postgres_changes',
          { 
            event: 'INSERT', 
            schema, 
            table, 
            filter 
          },
          (payload: RealtimePayload) => {
            try {
              onInsert(payload);
            } catch (err) {
              console.error(`Error in ${table} INSERT handler:`, err);
              captureError(
                err instanceof Error ? err : new Error(`Error in ${table} INSERT handler`),
                {
                  source: 'useOrderSubscription.onInsert',
                  context: { payload }
                }
              );
            }
          }
        );
      }
      
      // Set up UPDATE listener if callback provided
      if (onUpdate) {
        channel.on(
          'postgres_changes',
          { 
            event: 'UPDATE', 
            schema, 
            table, 
            filter 
          },
          (payload: RealtimePayload) => {
            try {
              onUpdate(payload);
            } catch (err) {
              console.error(`Error in ${table} UPDATE handler:`, err);
              captureError(
                err instanceof Error ? err : new Error(`Error in ${table} UPDATE handler`),
                {
                  source: 'useOrderSubscription.onUpdate',
                  context: { payload }
                }
              );
            }
          }
        );
      }
      
      // Set up DELETE listener if callback provided
      if (onDelete) {
        channel.on(
          'postgres_changes',
          { 
            event: 'DELETE', 
            schema, 
            table, 
            filter 
          },
          (payload: RealtimePayload) => {
            try {
              onDelete(payload);
            } catch (err) {
              console.error(`Error in ${table} DELETE handler:`, err);
              captureError(
                err instanceof Error ? err : new Error(`Error in ${table} DELETE handler`),
                {
                  source: 'useOrderSubscription.onDelete',
                  context: { payload }
                }
              );
            }
          }
        );
      }
      
      // Subscribe to channel
      channel.subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Subscribed to ${table} changes`);
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`Error subscribing to ${table} changes`);
          captureError(
            new Error(`Supabase channel error for ${table}`),
            {
              source: 'useOrderSubscription.subscribe',
              context: { table, status }
            }
          );
        }
      });
      
      // Store channel reference
      channelRef.current = channel;
      
      return () => {
        clearSubscription();
      };
    } catch (err) {
      console.error('Error setting up subscription:', err);
      captureError(
        err instanceof Error ? err : new Error('Error setting up subscription'),
        {
          source: 'useOrderSubscription.setupSubscription',
          context: { table, schema }
        }
      );
    }
  }, [onInsert, onUpdate, onDelete, table, schema, filter]);
  
  // Clear subscription
  const clearSubscription = useCallback(() => {
    if (channelRef.current) {
      try {
        channelRef.current.unsubscribe();
        console.log(`Unsubscribed from ${table} changes`);
      } catch (err) {
        console.error('Error clearing subscription:', err);
      }
      channelRef.current = null;
    }
  }, [table]);
  
  return {
    setupSubscription,
    clearSubscription
  };
}
