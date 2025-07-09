'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSupabase } from '@/lib/hooks/useSupabase';
import { notificationService } from '@/lib/services/notification.service';

interface UseNotificationsReturn {
  isEnabled: boolean;
  isInitialized: boolean;
  hasPermission: boolean;
  isLoading: boolean;
  error: string | null;
  enableNotifications: () => Promise<boolean>;
  sendNotification: (userId: string, payload: any) => Promise<boolean>;
  subscribeToTopic: (topicKey: string) => Promise<boolean>;
  unsubscribeFromTopic: (topicKey: string) => Promise<boolean>;
}

export function useNotifications(): UseNotificationsReturn {
  const { user } = useSupabase();
  const [isEnabled, setIsEnabled] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check initial state
  useEffect(() => {
    const checkInitialState = () => {
      const enabled = notificationService.isNotificationEnabled();
      const initialized = notificationService.getIsInitialized();
      
      setIsEnabled(enabled);
      setIsInitialized(initialized);
      setHasPermission(enabled);
    };

    checkInitialState();
  }, []);

  // Initialize notifications when user is available
  useEffect(() => {
    const initializeNotifications = async () => {
      if (!user || isInitialized) return;

      setIsLoading(true);
      setError(null);

      try {
        const success = await notificationService.initialize(user.id);
        setIsInitialized(success);
        setIsEnabled(success);
        setHasPermission(success);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize notifications');
      } finally {
        setIsLoading(false);
      }
    };

    initializeNotifications();
  }, [user, isInitialized]);

  // Enable notifications (request permission and initialize)
  const enableNotifications = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      // Request permission first
      const permissionGranted = await notificationService.requestPermission();
      if (!permissionGranted) {
        throw new Error('Notification permission denied');
      }

      // Initialize service
      const success = await notificationService.initialize(user?.id);
      
      setIsEnabled(success);
      setIsInitialized(success);
      setHasPermission(permissionGranted);
      
      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to enable notifications';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Send notification
  const sendNotification = useCallback(async (userId: string, payload: any): Promise<boolean> => {
    try {
      setError(null);
      return await notificationService.sendNotification(userId, payload);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send notification';
      setError(errorMessage);
      return false;
    }
  }, []);

  // Subscribe to topic
  const subscribeToTopic = useCallback(async (topicKey: string): Promise<boolean> => {
    try {
      setError(null);
      return await notificationService.subscribeToTopic(topicKey);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to subscribe to topic';
      setError(errorMessage);
      return false;
    }
  }, []);

  // Unsubscribe from topic
  const unsubscribeFromTopic = useCallback(async (topicKey: string): Promise<boolean> => {
    try {
      setError(null);
      return await notificationService.unsubscribeFromTopic(topicKey);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to unsubscribe from topic';
      setError(errorMessage);
      return false;
    }
  }, []);

  return {
    isEnabled,
    isInitialized,
    hasPermission,
    isLoading,
    error,
    enableNotifications,
    sendNotification,
    subscribeToTopic,
    unsubscribeFromTopic
  };
}