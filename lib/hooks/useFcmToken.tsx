"use client";

import { useEffect, useRef, useState } from 'react';
import { getToken, onMessage, Unsubscribe } from 'firebase/messaging';
import { getMessagingInstance, fetchToken, requestNotificationPermission } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { FcmMessagePayload } from '@/lib/types/firebase';
import Image from 'next/image';
import React from 'react';

// Export this function
export async function getNotificationPermissionAndToken(): Promise<string | null> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    console.warn('This browser does not support desktop notification');
    return null;
  }

  let currentPermission = Notification.permission;
  if (currentPermission === 'granted') {
    return await fetchToken();
  }

  if (currentPermission !== 'denied') {
    console.log('Requesting notification permission...');
    currentPermission = await requestNotificationPermission();
    if (currentPermission === 'granted') {
      console.log('Permission granted, fetching token...');
      return await fetchToken();
    }
    console.log('Permission not granted:', currentPermission);
  }

  console.log('Notification permission not granted or denied.');
  return null;
}

interface UseFcmTokenResult {
  token: string | null;
  notificationPermissionStatus: NotificationPermission | null;
}

export function useFcmToken(): UseFcmTokenResult {
  const router = useRouter();
  const [notificationPermissionStatus, setNotificationPermissionStatus] =
    useState<NotificationPermission | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const retryLoadToken = useRef(0);
  const isLoading = useRef(false);
  const hasFetched = useRef(false);

  const loadToken = async (): Promise<void> => {
    if (isLoading.current || hasFetched.current || typeof window === 'undefined') {
      return;
    }

    isLoading.current = true;
    console.log('Attempting to load FCM token...');
    const fetchedToken = await getNotificationPermissionAndToken();

    const currentPermission = Notification.permission;
    setNotificationPermissionStatus(currentPermission);

    if (currentPermission === 'denied') {
      console.info(
        '%cPush Notifications - Permission Denied',
        'color: red; background: #ffe0e0; padding: 4px; font-size: 14px'
      );
      isLoading.current = false;
      hasFetched.current = true;
      return;
    }

    if (!fetchedToken) {
      if (retryLoadToken.current >= 3) {
        console.error('Unable to load FCM token after 3 retries.');
        toast.error('Could not enable notifications. Please check browser settings and refresh.');
        isLoading.current = false;
        hasFetched.current = true;
        return;
      }

      retryLoadToken.current += 1;
      console.warn(`Token retrieval failed. Retrying (${retryLoadToken.current}/3)...`);
      isLoading.current = false;
      setTimeout(loadToken, 1000 * retryLoadToken.current);
      return;
    }

    console.log('FCM Token loaded successfully:', fetchedToken.substring(0, 10) + '...');
    setToken(fetchedToken);
    isLoading.current = false;
    hasFetched.current = true;
  };

  useEffect(() => {
    loadToken();
  }, []);

  useEffect(() => {
    if (token) {
      console.log(`Attempting to subscribe token ${token.substring(0, 10)}... to topic 'all_devices'`);
      fetch('/api/subscribe-to-topic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: token, topic: 'all_devices' }),
      })
        .then(async (res) => {
          if (res.ok) {
            console.log('Successfully subscribed to all_devices topic');
          } else {
            const errorData = await res.json();
            console.error('Failed to subscribe to topic:', res.status, errorData);
            toast.error(`Failed to subscribe to notifications: ${errorData.error || 'Unknown error'}`);
          }
        })
        .catch((error) => {
          console.error('Error subscribing to topic:', error);
          toast.error('Network error while subscribing to notifications.');
        });
    }
  }, [token]);

  useEffect(() => {
    let unsubscribe: Unsubscribe | undefined;

    const setupListener = async () => {
      if (!token || typeof window === 'undefined') {
        return;
      }

      console.log(`Registering foreground message listener with token ${token.substring(0, 10)}...`);
      const messagingInstance = getMessagingInstance();
      if (!messagingInstance) {
        console.error('Failed to get messaging instance for listener setup.');
        return;
      }

      unsubscribe = onMessage(messagingInstance, (payload: FcmMessagePayload) => {
        console.log('Foreground push notification received:', payload);
        if (Notification.permission !== 'granted') {
          console.log('Permission not granted, ignoring foreground message.');
          return;
        }

        const notification = payload.notification;
        const title = notification?.title || 'New Message';
        const body = notification?.body || '';
        const iconUrl = notification?.icon;
        const link = payload.fcmOptions?.link || payload.data?.link;

        // Define icon element separately
        let toastIcon: React.ReactElement | undefined = undefined;
        if (iconUrl) {
          toastIcon = (
            <Image src={iconUrl} alt="notification icon" width={20} height={20} />
          );
        }

        const toastAction = link ? {
          label: 'Visit',
          onClick: () => { if (link) router.push(link); },
        } : undefined;

        toast.info(`${title}: ${body}`, {
          icon: toastIcon,
          action: toastAction,
          duration: 10000,
        });

        try {
          const n = new Notification(title, {
            body: body,
            icon: iconUrl,
            data: link ? { url: link } : undefined,
            tag: `sidehustle-fg-${Date.now()}`
          });
  
          n.onclick = (event) => {
            event.preventDefault();
            const targetLink = (event.target as Notification)?.data?.url;
            if (targetLink) {
              router.push(targetLink);
              window.focus();
            }
            n.close();
          };
        } catch (e) {
          console.error('Error showing foreground standard notification:', e);
        }
      });

      console.log('Foreground message listener registered.');
    };

    setupListener();

    return () => {
      if (unsubscribe) {
        console.log('Unsubscribing from foreground messages.');
        unsubscribe();
      }
    };
  }, [token, router]);

  return { token, notificationPermissionStatus };
}