import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { adaptWolfChatMessage, adaptWolfpackMembership } from '@/lib/types/adapters';
import { WolfpackBackendService, WOLFPACK_TABLES } from '@/lib/services/wolfpack-backend.service';
import { WolfpackErrorHandler } from '@/lib/services/wolfpack-error.service';
import type { RealtimeChannel } from '@supabase/supabase-js';

const supabase = createClient();

export interface WolfChatMessage {
  id: string;
  session_id: string;
  user_id: string;
  display_name: string;
  avatar_url?: string;
  content: string;
  message_type: 'text' | 'image' | 'dj_broadcast';
  image_url?: string;
  created_at: string;
  is_flagged: boolean;
  reactions?: MessageReaction[];
}

export interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

export interface WolfPackMember {
  id: string;
  user_id: string;
  location_id: string;
  status: string;
  joined_at: string;
  table_location?: string;
  display_name?: string;
  avatar_url?: string;
}

export interface DJEvent {
  id: string;
  dj_id: string;
  location_id: string;
  event_type: string;
  title: string;
  description?: string;
  status: string;
  voting_ends_at?: string;
  created_at: string;
  options?: string[];
}

interface RealtimeState {
  messages: WolfChatMessage[];
  members: WolfPackMember[];
  events: DJEvent[];
  isConnected: boolean;
  error: string | null;
}

interface RealtimeActions {
  sendMessage: (content: string, imageUrl?: string) => Promise<boolean>;
  addReaction: (messageId: string, emoji: string) => Promise<boolean>;
  removeReaction: (reactionId: string) => Promise<boolean>;
  refreshData: () => Promise<void>;
}

/**
 * Comprehensive realtime hook for Wolfpack chat and events
 */
export function useWolfpackRealtime(
  sessionId: string | null,
  locationId: string | null
): { state: RealtimeState; actions: RealtimeActions } {
  const [state, setState] = useState<RealtimeState>({
    messages: [],
    members: [],
    events: [],
    isConnected: false,
    error: null
  });

  const channelsRef = useRef<RealtimeChannel[]>([]);

  // Cleanup channels on unmount
  useEffect(() => {
    return () => {
      channelsRef.current.forEach(channel => {
        channel.unsubscribe();
      });
      channelsRef.current = [];
    };
  }, []);

  // Load initial data
  const loadInitialData = useCallback(async () => {
    if (!sessionId || !locationId) return;

    try {
      setState(prev => ({ ...prev, error: null }));

      // Load messages, members, and events in parallel
      const [messagesResult, membersResult, eventsResult] = await Promise.all([
        WolfpackBackendService.getChatMessages(sessionId, 100),
        WolfpackBackendService.getActiveMembers(locationId),
        WolfpackBackendService.getActiveEvents(locationId)
      ]);

      setState(prev => ({
        ...prev,
        messages: messagesResult.data?.map(adaptWolfChatMessage) || [],
        members: membersResult.data?.map(adaptWolfpackMembership) || [],
        events: eventsResult.data || []
      }));

    } catch (error) {
      const userError = WolfpackErrorHandler.handleSupabaseError(error, {
        operation: 'load_realtime_data'
      });
      setState(prev => ({ ...prev, error: userError.message }));
    }
  }, [sessionId, locationId]);

  // Set up realtime subscriptions
  useEffect(() => {
    if (!sessionId || !locationId) return;

    // Clean up existing channels
    channelsRef.current.forEach(channel => channel.unsubscribe());
    channelsRef.current = [];

    // Chat messages subscription
    const chatChannel = supabase
      .channel(`wolf_chat_${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: WOLFPACK_TABLES.WOLF_CHAT,
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          const newMessage = adaptWolfChatMessage(payload.new);
          setState(prev => ({
            ...prev,
            messages: [...prev.messages, newMessage]
          }));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: WOLFPACK_TABLES.WOLF_CHAT,
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          const updatedMessage = adaptWolfChatMessage(payload.new);
          setState(prev => ({
            ...prev,
            messages: prev.messages.map(msg =>
              msg.id === updatedMessage.id ? updatedMessage : msg
            )
          }));
        }
      )
      .subscribe((status) => {
        setState(prev => ({ ...prev, isConnected: status === 'SUBSCRIBED' }));
      });

    // Reactions subscription
    const reactionsChannel = supabase
      .channel(`wolf_reactions_${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: WOLFPACK_TABLES.WOLF_REACTIONS
        },
        (payload) => {
          const newReaction = payload.new as MessageReaction;
          setState(prev => ({
            ...prev,
            messages: prev.messages.map(msg =>
              msg.id === newReaction.message_id
                ? { ...msg, reactions: [...(msg.reactions || []), newReaction] }
                : msg
            )
          }));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: WOLFPACK_TABLES.WOLF_REACTIONS
        },
        (payload) => {
          const deletedReaction = payload.old as MessageReaction;
          setState(prev => ({
            ...prev,
            messages: prev.messages.map(msg =>
              msg.id === deletedReaction.message_id
                ? {
                    ...msg,
                    reactions: (msg.reactions || []).filter(r => r.id !== deletedReaction.id)
                  }
                : msg
            )
          }));
        }
      )
      .subscribe();

    // Members subscription
    const membersChannel = supabase
      .channel(`wolf_members_${locationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: WOLFPACK_TABLES.WOLFPACK_MEMBERSHIPS,
          filter: `location_id=eq.${locationId}`
        },
        () => {
          // Reload members when membership changes
          loadInitialData();
        }
      )
      .subscribe();

    // Events subscription
    const eventsChannel = supabase
      .channel(`wolf_events_${locationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: WOLFPACK_TABLES.DJ_EVENTS,
          filter: `location_id=eq.${locationId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newEvent = payload.new as DJEvent;
            setState(prev => ({
              ...prev,
              events: [newEvent, ...prev.events]
            }));
          } else if (payload.eventType === 'UPDATE') {
            const updatedEvent = payload.new as DJEvent;
            setState(prev => ({
              ...prev,
              events: prev.events.map(event =>
                event.id === updatedEvent.id ? updatedEvent : event
              )
            }));
          } else if (payload.eventType === 'DELETE') {
            const deletedEvent = payload.old as DJEvent;
            setState(prev => ({
              ...prev,
              events: prev.events.filter(event => event.id !== deletedEvent.id)
            }));
          }
        }
      )
      .subscribe();

    // Store channels for cleanup
    channelsRef.current = [chatChannel, reactionsChannel, membersChannel, eventsChannel];

    // Load initial data
    loadInitialData();

  }, [sessionId, locationId, loadInitialData]);

  // Send message action
  const sendMessage = useCallback(async (content: string, imageUrl?: string): Promise<boolean> => {
    if (!sessionId) return false;

    try {
      const result = await WolfpackBackendService.insert(
        WOLFPACK_TABLES.WOLF_CHAT,
        {
          session_id: sessionId,
          content,
          image_url: imageUrl,
          message_type: imageUrl ? 'image' : 'text',
          created_at: new Date().toISOString(),
          is_flagged: false
        }
      );

      return !result.error;
    } catch (error) {
      console.error('Send message error:', error);
      return false;
    }
  }, [sessionId]);

  // Add reaction action
  const addReaction = useCallback(async (messageId: string, emoji: string): Promise<boolean> => {
    try {
      const result = await WolfpackBackendService.insert(
        WOLFPACK_TABLES.WOLF_REACTIONS,
        {
          message_id: messageId,
          emoji,
          created_at: new Date().toISOString()
        }
      );

      return !result.error;
    } catch (error) {
      console.error('Add reaction error:', error);
      return false;
    }
  }, []);

  // Remove reaction action
  const removeReaction = useCallback(async (reactionId: string): Promise<boolean> => {
    try {
      const result = await WolfpackBackendService.delete(
        WOLFPACK_TABLES.WOLF_REACTIONS,
        { id: reactionId }
      );

      return result.success;
    } catch (error) {
      console.error('Remove reaction error:', error);
      return false;
    }
  }, []);

  // Refresh data action
  const refreshData = useCallback(async () => {
    await loadInitialData();
  }, [loadInitialData]);

  const actions: RealtimeActions = {
    sendMessage,
    addReaction,
    removeReaction,
    refreshData
  };

  return { state, actions };
}

// Typing indicator hook
export function useTypingIndicators(sessionId: string | null) {
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({});
  const typingTimeoutRef = useRef<Record<string, NodeJS.Timeout>>({});

  useEffect(() => {
    if (!sessionId) return;

    const channel = supabase
      .channel(`typing_${sessionId}`)
      .on('broadcast', { event: 'typing' }, (payload) => {
        const { user_id, display_name, isTyping } = payload.payload as {
          user_id: string;
          display_name: string;
          isTyping: boolean;
        };

        if (isTyping) {
          setTypingUsers(prev => ({ ...prev, [user_id]: display_name }));
          
          // Clear existing timeout
          if (typingTimeoutRef.current[user_id]) {
            clearTimeout(typingTimeoutRef.current[user_id]);
          }
          
          // Set new timeout
          typingTimeoutRef.current[user_id] = setTimeout(() => {
            setTypingUsers(prev => {
              const { [user_id]: removed, ...rest } = prev;
              return rest;
            });
            delete typingTimeoutRef.current[user_id];
          }, 3000);
        } else {
          setTypingUsers(prev => {
            const { [user_id]: removed, ...rest } = prev;
            return rest;
          });
          
          if (typingTimeoutRef.current[user_id]) {
            clearTimeout(typingTimeoutRef.current[user_id]);
            delete typingTimeoutRef.current[user_id];
          }
        }
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
      Object.values(typingTimeoutRef.current).forEach(clearTimeout);
      typingTimeoutRef.current = {};
    };
  }, [sessionId]);

  const sendTyping = useCallback((userId: string, displayName: string, isTyping: boolean) => {
    if (!sessionId) return;

    supabase
      .channel(`typing_${sessionId}`)
      .send({
        type: 'broadcast',
        event: 'typing',
        payload: { user_id: userId, display_name: displayName, isTyping }
      });
  }, [sessionId]);

  return { typingUsers: Object.values(typingUsers), sendTyping };
}