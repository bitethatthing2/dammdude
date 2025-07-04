// Direct Chat Utility - Works with existing backend
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';

interface ChatMessage {
  id: string;
  message: string;
  message_type: string;
  image_url?: string;
  created_at: string;
  edited_at?: string;
  sender: {
    id: string;
    display_name: string;
    profile_image_url?: string;
    wolf_emoji?: string;
    role?: string;
  };
}

interface ChatHookReturn {
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
  sendMessage: (content: string, imageUrl?: string) => Promise<boolean>;
  refresh: () => Promise<void>;
}

export function useWolfpackChat(sessionId: string = 'general'): ChatHookReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load messages using the working RPC function
  const loadMessages = useCallback(async () => {
    try {
      setError(null);
      
      const { data, error: rpcError } = await supabase
        .rpc('get_wolfpack_chat_messages', {
          p_session_id: sessionId,
          p_limit: 50,
          p_offset: 0
        });

      if (rpcError) {
        throw rpcError;
      }

      // The RPC returns JSON array of messages
      const parsedMessages = Array.isArray(data) ? data : [];
      setMessages(parsedMessages);
      
    } catch (err) {
      console.error('Error loading messages:', err);
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  // Send message using the working RPC function
  const sendMessage = useCallback(async (content: string, imageUrl?: string): Promise<boolean> => {
    try {
      setError(null);

      // Check authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        setError('Please log in to send messages');
        return false;
      }

      // Send message using RPC
      const { data, error: sendError } = await supabase
        .rpc('send_wolfpack_chat_message', {
          p_session_id: sessionId,
          p_content: content,
          p_message_type: imageUrl ? 'image' : 'text'
        });

      if (sendError) {
        throw sendError;
      }

      // Check if RPC returned an error
      if (data && typeof data === 'object' && 'error' in data) {
        throw new Error(data.error as string);
      }

      // Reload messages after successful send
      await loadMessages();
      return true;

    } catch (err) {
      console.error('Error sending message:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
      return false;
    }
  }, [sessionId, loadMessages]);

  // Refresh messages
  const refresh = useCallback(async () => {
    setLoading(true);
    await loadMessages();
  }, [loadMessages]);

  // Load messages on mount and session change
  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Real-time subscription for new messages
  useEffect(() => {
    if (!sessionId) return;

    const channel = supabase
      .channel(`wolfpack-chat-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'wolfpack_chat_messages',
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          console.log('New message received:', payload);
          // Reload messages when new message is inserted
          loadMessages();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'wolfpack_chat_messages',
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          console.log('Message updated:', payload);
          // Reload messages when message is updated
          loadMessages();
        }
      )
      .subscribe((status) => {
        console.log(`Real-time subscription status for ${sessionId}:`, status);
      });

    return () => {
      console.log(`Unsubscribing from ${sessionId} channel`);
      supabase.removeChannel(channel);
    };
  }, [sessionId, loadMessages]);

  return {
    messages,
    loading,
    error,
    sendMessage,
    refresh
  };
}

// Alternative direct table access (if RPC fails)
export async function sendMessageDirect(content: string, sessionId: string = 'general', imageUrl?: string) {
  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    throw new Error('Authentication required');
  }

  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('id, display_name, avatar_url, profile_image_url')
    .eq('auth_id', user.id)
    .single();

  if (profileError || !profile) {
    throw new Error('User profile not found');
  }

  // Insert message directly
  const { data, error } = await supabase
    .from('wolfpack_chat_messages')
    .insert({
      session_id: sessionId,
      user_id: profile.id,
      display_name: profile.display_name || user.email?.split('@')[0] || 'Anonymous',
      avatar_url: profile.profile_image_url || profile.avatar_url,
      content: content,
      message_type: imageUrl ? 'image' : 'text',
      image_url: imageUrl,
      is_deleted: false,
      is_flagged: false
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}