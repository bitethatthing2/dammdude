"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { toast } from 'sonner';

interface TestNotificationButtonProps {
  className?: string;
}

export function TestNotificationButton({ className }: TestNotificationButtonProps) {
  const [isSending, setIsSending] = useState(false);

  const sendTestNotification = async () => {
    setIsSending(true);
    
    try {
      const response = await fetch('/api/send-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Test Notification',
          body: 'This is a test notification from the admin panel',
          sendToAll: true,
          image: '/icons/android-big-icon.png',
          link: '/',
          data: {
            type: 'test',
            timestamp: Date.now().toString()
          }
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('Notification sent successfully', {
          description: data.recipients 
            ? `Delivered to ${data.recipients} device(s)` 
            : 'Notification processed successfully',
        });
      } else {
        toast.error('Failed to send notification', {
          description: data.error || 'Unknown error occurred',
        });
        console.error('Notification error details:', data);
      }
    } catch (error) {
      toast.error('Error sending notification', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
      console.error('Error sending test notification:', error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Button 
      onClick={sendTestNotification}
      className={className}
      disabled={isSending}
    >
      <Bell className="mr-2 h-4 w-4" />
      {isSending ? 'Sending...' : 'Send Test Notification'}
    </Button>
  );
}
