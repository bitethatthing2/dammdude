"use client";

import { useState, useEffect, useCallback } from 'react';
import { 
  getOfflineStatus, 
  initOfflineManager, 
  createOfflineOrder,
  updateOfflineProfile,
  submitOfflineFeedback,
  getPendingSyncItems,
  registerPeriodicSync
} from '@/lib/utils/offlineManager';
import type { Database } from '@/lib/database.types';

// Type definitions for offline data
type OrderData = Database['public']['Tables']['bartender_orders']['Insert'];
type ProfileData = Database['public']['Tables']['users']['Update'];

interface FeedbackData {
  rating: number;
  comment: string;
  category: string;
  user_id?: string;
  order_id?: string;
  location_id?: string;
}

interface SyncItem {
  id: string;
  type: 'order' | 'profile' | 'feedback';
  data: unknown;
  timestamp: number;
}

interface UseOfflineOptions {
  autoInit?: boolean;
  enablePeriodicSync?: boolean;
}

interface UseOfflineReturn {
  isOnline: boolean;
  lastOnline: number | null;
  syncPending: boolean;
  syncItems: number;
  createOrder: (orderData: OrderData) => Promise<string>;
  updateProfile: (profileData: ProfileData) => Promise<string>;
  submitFeedback: (feedbackData: FeedbackData) => Promise<string>;
  getPendingItems: () => Promise<SyncItem[]>;
  registerPeriodicUpdate: () => Promise<boolean>;
}

/**
 * React hook for offline functionality
 */
export function useOffline(options: UseOfflineOptions = {}): UseOfflineReturn {
  const { autoInit = true, enablePeriodicSync = false } = options;
  
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [lastOnline, setLastOnline] = useState<number | null>(null);
  const [syncPending, setSyncPending] = useState<boolean>(false);
  const [syncItems, setSyncItems] = useState<number>(0);
  
  // Initialize offline manager
  useEffect(() => {
    if (!autoInit) return;
    
    // Initialize the offline manager
    initOfflineManager();
    
    // Get initial status
    getOfflineStatus().then(status => {
      setIsOnline(status.isOnline);
      setLastOnline(status.lastOnline);
      setSyncPending(status.syncPending);
      setSyncItems(status.syncItems);
    });
    
    // Set up event listeners for connectivity changes
    const handleConnectivityChange = (event: CustomEvent) => {
      setIsOnline(event.detail.isOnline);
      
      // Update status when connectivity changes
      getOfflineStatus().then(status => {
        setLastOnline(status.lastOnline);
        setSyncPending(status.syncPending);
        setSyncItems(status.syncItems);
      });
    };
    
    // Set up event listeners for sync queue changes
    const handleSyncQueueUpdate = () => {
      getOfflineStatus().then(status => {
        setSyncPending(status.syncPending);
        setSyncItems(status.syncItems);
      });
    };
    
    // Register for periodic sync if enabled
    if (enablePeriodicSync) {
      registerPeriodicSync().catch(console.error);
    }
    
    // Add event listeners
    window.addEventListener('connectivity-changed', handleConnectivityChange as EventListener);
    window.addEventListener('sync-queue-updated', handleSyncQueueUpdate);
    
    // Remove event listeners on cleanup
    return () => {
      window.removeEventListener('connectivity-changed', handleConnectivityChange as EventListener);
      window.removeEventListener('sync-queue-updated', handleSyncQueueUpdate);
    };
  }, [autoInit, enablePeriodicSync]);
  
  // Create an order that works offline
  const createOrder = useCallback(async (orderData: OrderData): Promise<string> => {
    return createOfflineOrder(orderData);
  }, []);
  
  // Update user profile that works offline
  const updateProfile = useCallback(async (profileData: ProfileData): Promise<string> => {
    return updateOfflineProfile(profileData);
  }, []);
  
  // Submit feedback that works offline
  const submitFeedback = useCallback(async (feedbackData: FeedbackData): Promise<string> => {
    return submitOfflineFeedback(feedbackData);
  }, []);
  
  // Get pending sync items
  const getPendingItems = useCallback(async (): Promise<SyncItem[]> => {
    return getPendingSyncItems();
  }, []);
  
  // Register for periodic updates
  const registerPeriodicUpdate = useCallback(async (): Promise<boolean> => {
    return registerPeriodicSync();
  }, []);
  
  return {
    isOnline,
    lastOnline,
    syncPending,
    syncItems,
    createOrder,
    updateProfile,
    submitFeedback,
    getPendingItems,
    registerPeriodicUpdate
  };
}
