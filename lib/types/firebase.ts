import { MessagePayload } from 'firebase/messaging';

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
  clientId?: string;
  clientSecret?: string;
}

export interface FirebaseMessagingError {
  code: string;
  message: string;
  stack?: string;
}

export interface FcmMessagePayload extends MessagePayload {
  fcmOptions?: {
    link?: string;
  };
  // Use intersection to allow specific optional props AND general string index signature
  data?: {
    link?: string;
    orderId?: string;
  } & {
    [key: string]: string;
  };
}

export interface NotificationPayload {
  title: string;
  body?: string;
  icon?: string;
  image?: string;
  badge?: string;
  vibrate?: number[];
  sound?: string;
  dir?: 'auto' | 'ltr' | 'rtl';
  tag?: string;
  data?: Record<string, unknown>;
  requireInteraction?: boolean;
  renotify?: boolean;
  silent?: boolean;
  actions?: NotificationAction[];
  timestamp?: number;
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

// Service Worker specific types
export interface ServiceWorkerRegistrationOptions {
  scope?: string;
  updateViaCache?: 'imports' | 'all' | 'none';
}

export interface ServiceWorkerConfig {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onError?: (error: Error) => void;
}