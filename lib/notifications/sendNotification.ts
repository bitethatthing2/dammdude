import { SendNotificationRequest, SendNotificationResponse } from '@/lib/types/api';

export interface SendNotificationParams {
  title: string;
  message: string;
  token?: string;
  topic?: string;
  link?: string;
}

// Simple util to call our Supabase Edge Function
export async function sendNotification({ 
  title, 
  message, 
  token, 
  topic, 
  link 
}: SendNotificationParams): Promise<SendNotificationResponse> {
  const endpoint = token ? 'token' : 'topic';
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-notification/${endpoint}`;

  const request: SendNotificationRequest = {
    title,
    body: message,
    token,
    topic,
    link
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    throw new Error('Failed to send notification');
  }

  return res.json() as Promise<SendNotificationResponse>;
} 