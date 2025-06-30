// components/dj/BroadcastForm.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner'; // or your toast library
import { captureError } from '@/lib/utils/error-utils';

interface BroadcastFormProps {
  djId: string;
  locationId: string;
  locationName: string;
}

export function BroadcastForm({ djId, locationId, locationName }: BroadcastFormProps) {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [broadcastType, setBroadcastType] = useState('general');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/dj/broadcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message.trim(),
          broadcast_type: broadcastType,
          location_id: locationId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        // The error message from our API is already user-friendly
        toast.error(result.error || 'Failed to send broadcast');
        return;
      }

      // Success!
      toast.success('Broadcast sent successfully! 🎉');
      
      // Show additional info
      toast.info(`Notified all Wolf Pack members at ${locationName}`);

      // Clear form
      setMessage('');
      
      // Optionally redirect or refresh
      router.refresh();
      
    } catch (error) {
      // Network or unexpected errors
      const { error: userError } = await wolfpackErrorUtils.safe(
        async () => { throw error; },
        'send_broadcast'
      );
      
      toast.error(userError?.message || 'Network error. Please try again.');
      
      // If retryable, show retry option
      if (userError?.retryable) {
        toast.error('Connection failed', {
          action: {
            label: 'Retry',
            onClick: () => handleSubmit(e)
          }
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick broadcast templates
  const quickBroadcasts = [
    { 
      label: '🐺 Howl Request', 
      message: "The Wolf Pack is needed on the dance floor! Let's get this party started!",
      type: 'howl_request',
      emojiPrefix: '🐺',
      emojiSuffix: '🎵'
    },
    { 
      label: '🎉 Dance Battle', 
      message: "DANCE BATTLE starting in 5 minutes! Show us your moves!",
      type: 'contest_announcement',
      emojiPrefix: '🕺',
      emojiSuffix: '💃'
    },
    { 
      label: '🎵 Song Requests', 
      message: "Taking song requests now! Message me your favorite tracks!",
      type: 'song_request',
      emojiPrefix: '🎵',
      emojiSuffix: '🎵'
    },
    { 
      label: '🍺 Happy Hour', 
      message: "Wolf Pack Happy Hour special - Show your membership for exclusive deals!",
      type: 'general',
      emojiPrefix: '🍺',
      emojiSuffix: '🍺'
    },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Quick Templates */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Quick Templates
        </label>
        <div className="grid grid-cols-2 gap-2">
          {quickBroadcasts.map((template) => (
            <button
              key={template.label}
              type="button"
              onClick={() => {
                const fullMessage = `${template.emojiPrefix} ${template.message} ${template.emojiSuffix}`.trim();
                setMessage(fullMessage);
                setBroadcastType(template.type);
                toast.info('Template loaded');
              }}
              className="px-3 py-2 text-sm bg-secondary hover:bg-secondary/80 rounded-md transition-colors"
            >
              {template.label}
            </button>
          ))}
        </div>
      </div>

      {/* Message Input */}
      <div>
        <label htmlFor="message" className="block text-sm font-medium mb-2">
          Broadcast Message
        </label>
        <textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message to the Wolf Pack..."
          className="w-full min-h-[100px] px-3 py-2 border rounded-md resize-none focus:ring-2 focus:ring-primary"
          maxLength={500}
          required
        />
        <p className="mt-1 text-sm text-muted-foreground">
          {message.length}/500 characters
        </p>
      </div>

      {/* Broadcast Type */}
      <div>
        <label htmlFor="type" className="block text-sm font-medium mb-2">
          Broadcast Type
        </label>
        <select
          id="type"
          value={broadcastType}
          onChange={(e) => setBroadcastType(e.target.value)}
          className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary"
        >
          <option value="general">General Announcement</option>
          <option value="howl_request">Howl Request (Call to Floor)</option>
          <option value="contest_announcement">Contest/Event</option>
          <option value="song_request">Song Request</option>
        </select>
      </div>

      {/* Location Info */}
      <div className="p-3 bg-muted rounded-md">
        <p className="text-sm">
          Broadcasting to: <strong>{locationName}</strong>
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          All active Wolf Pack members at this location will be notified
        </p>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting || !message.trim()}
        className="w-full py-3 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
      >
        {isSubmitting ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Sending...
          </>
        ) : (
          <>
            <span className="mr-2">📢</span>
            Send Broadcast
          </>
        )}
      </button>

      {/* Error Handling Examples */}
      {/* The toast notifications will automatically show:
          - ✅ Success messages with confetti
          - ❌ Error messages with retry options
          - ℹ️ Info messages for context
          - ⚠️ Warnings for auth issues
      */}
    </form>
  );
}

// Example of how errors appear to users:
// 
// Network Error:
// 🔴 "Network connection failed"
//     [Retry] button
//
// Auth Error:
// ⚠️ "Please sign in to continue"
//     Redirects to login
//
// Validation Error:
// 🔴 "Message must be 500 characters or less"
//     No retry needed
//
// Success:
// ✅ "Broadcast sent successfully! 🎉"
// ℹ️ "Notified all Wolf Pack members at Side Hustle Bar"