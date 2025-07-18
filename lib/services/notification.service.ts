// Notification Service for Push Notifications
import { getFCMToken, onForegroundMessage, getPlatform, getDeviceInfo } from '@/lib/config/firebase.config';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/supabase/types';

interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  link?: string;
  type?: 'event' | 'order' | 'chat' | 'social' | 'announcement' | 'general';
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

interface DeviceToken {
  id: string;
  token: string;
  platform: string;
  is_active: boolean;
}

class NotificationService {
  private supabase: ReturnType<typeof createClient<Database>>;
  private currentToken: string | null = null;
  private isInitialized = false;

  constructor() {
    this.supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  // Initialize notification service
  async initialize(userId?: string): Promise<boolean> {
    try {
      if (typeof window === 'undefined') {
        console.log('Notification service: Running on server, skipping initialization');
        return false;
      }

      // Check if notifications are supported
      if (!('Notification' in window) || !('serviceWorker' in navigator)) {
        console.log('Notification service: Browser does not support notifications');
        return false;
      }

      // Get FCM token
      const token = await getFCMToken();
      if (!token) {
        console.log('Notification service: Failed to get FCM token');
        return false;
      }

      this.currentToken = token;

      // Store token if user is authenticated
      if (userId) {
        await this.storeDeviceToken(token);
      }

      // Set up foreground message listener
      this.setupForegroundListener();

      // Set up service worker message listener
      this.setupServiceWorkerListener();

      this.isInitialized = true;
      console.log('Notification service: Initialized successfully');
      return true;

    } catch (error) {
      console.error('Notification service: Initialization failed:', error);
      return false;
    }
  }

  // Store device token on server
  private async storeDeviceToken(token: string): Promise<void> {
    try {
      const deviceInfo = getDeviceInfo();
      const platform = getPlatform();

      const response = await fetch('/api/supabase/functions/store-fcm-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await this.supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          token,
          platform,
          device_name: deviceInfo.name,
          device_model: deviceInfo.model,
          app_version: deviceInfo.version
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to store token: ${response.statusText}`);
      }

      console.log('Notification service: Token stored successfully');
    } catch (error) {
      console.error('Notification service: Failed to store token:', error);
    }
  }

  // Set up foreground message listener
  private setupForegroundListener(): void {
    onForegroundMessage((payload) => {
      console.log('Notification service: Foreground message received:', payload);

      // Show in-app notification
      this.showInAppNotification({
        title: payload.notification?.title || 'New Notification',
        body: payload.notification?.body || '',
        data: payload.data,
        link: payload.data?.link,
        type: (payload.data?.type as 'event' | 'order' | 'chat' | 'social' | 'announcement' | 'general') || 'general'
      });

      // Dispatch custom event for app to handle
      window.dispatchEvent(new CustomEvent('foreground-notification', {
        detail: payload
      }));
    });
  }

  // Set up service worker message listener
  private setupServiceWorkerListener(): void {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'NOTIFICATION_CLICKED') {
          console.log('Notification service: Notification clicked:', event.data);
          
          // Handle notification click
          this.handleNotificationClick(event.data.data);
        }
      });
    }
  }

  // Show in-app notification
  private showInAppNotification(payload: NotificationPayload): void {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `
      fixed top-4 right-4 z-50 max-w-sm bg-card border border-primary rounded-lg shadow-lg p-4
      transform transition-all duration-300 ease-in-out translate-x-full opacity-0
    `;
    
    notification.innerHTML = `
      <div class="flex items-start gap-3">
        <div class="flex-shrink-0">
          <div class="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <svg class="w-4 h-4 text-primary-foreground" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.9 1 3 1.9 3 3V21C3 22.1 3.9 23 5 23H19C20.1 23 21 22.1 21 21V9Z"/>
            </svg>
          </div>
        </div>
        <div class="flex-1 min-w-0">
          <h4 class="font-medium text-sm text-foreground truncate">${payload.title}</h4>
          <p class="text-sm text-muted-foreground mt-1 line-clamp-2">${payload.body}</p>
          ${payload.link ? `
            <button class="mt-2 text-xs text-primary hover:underline" onclick="window.location.href='${payload.link}'">
              View Details
            </button>
          ` : ''}
        </div>
        <button class="flex-shrink-0 text-muted-foreground hover:text-foreground" onclick="this.parentElement.parentElement.remove()">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      </div>
    `;

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
      notification.classList.remove('translate-x-full', 'opacity-0');
    }, 100);

    // Auto remove after 5 seconds
    setTimeout(() => {
      notification.classList.add('translate-x-full', 'opacity-0');
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 5000);
  }

  // Handle notification click
  private handleNotificationClick(data: any): void {
    if (data?.link) {
      window.location.href = data.link;
    }

    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('notification-clicked', {
      detail: data
    }));
  }

  // Send notification to user
  async sendNotification(userId: string, payload: NotificationPayload): Promise<boolean> {
    try {
      const response = await fetch('/api/supabase/functions/send-push-notifications-secure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await this.supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          user_id: userId,
          ...payload
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to send notification: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Notification service: Notification sent:', result);
      return result.success;

    } catch (error) {
      console.error('Notification service: Failed to send notification:', error);
      return false;
    }
  }

  // Subscribe to topic
  async subscribeToTopic(topicKey: string): Promise<boolean> {
    try {
      const response = await fetch('/api/supabase/functions/subscribe-to-topic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await this.supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          topic_key: topicKey,
          subscribe: true
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to subscribe: ${response.statusText}`);
      }

      console.log(`Notification service: Subscribed to topic: ${topicKey}`);
      return true;

    } catch (error) {
      console.error('Notification service: Failed to subscribe to topic:', error);
      return false;
    }
  }

  // Unsubscribe from topic
  async unsubscribeFromTopic(topicKey: string): Promise<boolean> {
    try {
      const response = await fetch('/api/supabase/functions/subscribe-to-topic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await this.supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          topic_key: topicKey,
          subscribe: false
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to unsubscribe: ${response.statusText}`);
      }

      console.log(`Notification service: Unsubscribed from topic: ${topicKey}`);
      return true;

    } catch (error) {
      console.error('Notification service: Failed to unsubscribe from topic:', error);
      return false;
    }
  }

  // Check if notifications are enabled
  isNotificationEnabled(): boolean {
    return typeof window !== 'undefined' && 
           'Notification' in window && 
           Notification.permission === 'granted';
  }

  // Request notification permission
  async requestPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  // Get current token
  getCurrentToken(): string | null {
    return this.currentToken;
  }

  // Check if service is initialized
  getIsInitialized(): boolean {
    return this.isInitialized;
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
export default notificationService;