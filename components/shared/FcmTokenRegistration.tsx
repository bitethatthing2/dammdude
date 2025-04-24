"use client";

import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { initFirebase } from '@/lib/firebase';
import { getMessaging, getToken } from 'firebase/messaging';
import { supabase } from '@/lib/supabase/client';

// OAuth credentials from client_secret.json
const oauthCredentials = {
  clientId: "802463638703-of9ip59hbaqsrg9iu559cfvorrsp1rkh.apps.googleusercontent.com",
  clientSecret: "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"
};

export function FcmTokenRegistration() {
  const [isSupported, setIsSupported] = useState(true);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isRegistering, setIsRegistering] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if notifications are supported
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    } else {
      setIsSupported(false);
    }
  }, []);

  const registerToken = async () => {
    setIsRegistering(true);
    setError(null);
    
    try {
      // Initialize Firebase if not already initialized
      initFirebase();
      
      // Request permission if not already granted
      if (permission !== 'granted') {
        const newPermission = await Notification.requestPermission();
        setPermission(newPermission);
        
        if (newPermission !== 'granted') {
          setError('Notification permission denied');
          setIsRegistering(false);
          return;
        }
      }
      
      // Unregister existing service workers to ensure clean state
      const existingRegistrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of existingRegistrations) {
        await registration.unregister();
      }
      console.log('Unregistered existing service workers');
      
      // Register service worker manually
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      console.log('Service worker registered:', registration);
      
      // Wait for the service worker to be ready
      await navigator.serviceWorker.ready;
      
      // Get messaging instance
      const messaging = getMessaging();
      
      // Get VAPID key from environment variables
      const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
      if (!vapidKey) {
        throw new Error('VAPID key is missing');
      }
      
      // Get token with OAuth credentials
      console.log('Requesting FCM token with VAPID key and OAuth credentials');
      const currentToken = await getToken(messaging, {
        vapidKey,
        serviceWorkerRegistration: registration
      });
      
      if (!currentToken) {
        throw new Error('No registration token available');
      }
      
      // Save token to state
      setToken(currentToken);
      console.log('FCM token received:', currentToken.substring(0, 10) + '...');
      
      // Save token to database
      const { error: saveError } = await supabase.from('fcm_tokens').upsert({
        token: currentToken,
        device_info: {
          platform: navigator?.userAgent || 'unknown',
          browser: navigator?.userAgent?.match(/chrome|firefox|safari|edge|opera/i)?.[0]?.toLowerCase() || 'unknown',
          device_model: navigator?.platform || 'unknown',
          os_version: navigator?.appVersion || 'unknown'
        },
        updated_at: new Date().toISOString()
      }, { onConflict: 'token' });
      
      if (saveError) {
        throw new Error(`Error saving token: ${saveError.message}`);
      }
      
      // Subscribe to all_devices topic
      const { error: subscriptionError } = await supabase.from('topic_subscriptions').upsert({
        token: currentToken,
        topic: 'all_devices',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'token,topic' });
      
      if (subscriptionError) {
        console.error('Error subscribing to topic:', subscriptionError);
      } else {
        console.log('Successfully subscribed to all_devices topic');
      }
    } catch (err) {
      console.error('Error registering FCM token:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsRegistering(false);
    }
  };

  if (!isSupported) {
    return (
      <div className="p-4 border border-input bg-background text-foreground rounded-md">
        <p>Push notifications are not supported in this browser.</p>
      </div>
    );
  }

  return (
    <div className="p-4 border border-input bg-background text-foreground rounded-md">
      <h3 className="text-lg font-medium mb-2">Notification Registration</h3>
      
      {permission === 'granted' && token ? (
        <div>
          <p className="mb-2">✅ Notifications are enabled</p>
          <p className="text-xs text-muted-foreground break-all">
            Token: {token.substring(0, 20)}...
          </p>
        </div>
      ) : (
        <>
          <p className="mb-4">
            {permission === 'default' 
              ? 'Enable push notifications to receive updates' 
              : permission === 'denied'
                ? 'Notifications are blocked. Please update your browser settings.'
                : 'Click to complete notification registration'}
          </p>
          
          <Button
            variant="outline"
            className="bg-background text-foreground border border-input"
            onClick={registerToken}
            disabled={isRegistering || permission === 'denied'}
          >
            {isRegistering ? 'Registering...' : 'Enable Notifications'}
          </Button>
        </>
      )}
      
      {error && (
        <p className="mt-2 text-destructive text-sm">{error}</p>
      )}
    </div>
  );
}
