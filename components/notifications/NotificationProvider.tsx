'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useSupabase } from '@/lib/hooks/useSupabase';
import { notificationService } from '@/lib/services/notification.service';

interface NotificationContextType {
  isEnabled: boolean;
  hasPermission: boolean;
  isInitialized: boolean;
  enableNotifications: () => Promise<boolean>;
  sendTestNotification: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const { user } = useSupabase();
  const [isEnabled, setIsEnabled] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize notifications when user is available
  useEffect(() => {
    const initialize = async () => {
      if (!user) return;

      try {
        const success = await notificationService.initialize(user.id);
        setIsInitialized(success);
        setIsEnabled(notificationService.isNotificationEnabled());
        setHasPermission(notificationService.isNotificationEnabled());
      } catch (error) {
        console.error('Failed to initialize notifications:', error);
      }
    };

    initialize();
  }, [user]);

  // Listen for notification events
  useEffect(() => {
    const handleForegroundNotification = (event: CustomEvent) => {
      console.log('Foreground notification received:', event.detail);
      // Handle in-app notification display here if needed
    };

    const handleNotificationClick = (event: CustomEvent) => {
      console.log('Notification clicked:', event.detail);
      // Handle notification click actions here
    };

    window.addEventListener('foreground-notification', handleForegroundNotification as EventListener);
    window.addEventListener('notification-clicked', handleNotificationClick as EventListener);

    return () => {
      window.removeEventListener('foreground-notification', handleForegroundNotification as EventListener);
      window.removeEventListener('notification-clicked', handleNotificationClick as EventListener);
    };
  }, []);

  const enableNotifications = async (): Promise<boolean> => {
    try {
      const permission = await notificationService.requestPermission();
      if (!permission) return false;

      const success = await notificationService.initialize(user?.id);
      setIsInitialized(success);
      setIsEnabled(success);
      setHasPermission(permission);
      
      return success;
    } catch (error) {
      console.error('Failed to enable notifications:', error);
      return false;
    }
  };

  const sendTestNotification = async (): Promise<void> => {
    if (!user) return;

    try {
      await notificationService.sendNotification(user.id, {
        title: 'Test Notification',
        body: 'This is a test notification from Side Hustle Bar!',
        type: 'general',
        priority: 'normal',
        link: '/'
      });
    } catch (error) {
      console.error('Failed to send test notification:', error);
    }
  };

  const value: NotificationContextType = {
    isEnabled,
    hasPermission,
    isInitialized,
    enableNotifications,
    sendTestNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationContext(): NotificationContextType {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
}