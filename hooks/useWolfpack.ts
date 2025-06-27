import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase/client'; // Use shared instance
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

// Database row types from generated types
type DatabaseChatMessage = Database['public']['Tables']['wolfpack_chat_messages']['Row'];
type DatabaseChatReaction = Database['public']['Tables']['wolfpack_chat_reactions']['Row'];
type DatabaseMember = Database['public']['Tables']['wolfpack_members_unified']['Row'];
type DatabaseEvent = Database['public']['Tables']['dj_events']['Row'];

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

// Adapter functions to convert database types to frontend types
function adaptDatabaseChatMessage(dbMessage: DatabaseChatMessage): WolfChatMessage {
  return {
    id: dbMessage.id,
    session_id: dbMessage.session_id,
    user_id: dbMessage.user_id || '',
    display_name: dbMessage.display_name || 'Anonymous',
    avatar_url: dbMessage.avatar_url || undefined,
    content: dbMessage.content,
    message_type: (dbMessage.message_type as 'text' | 'image' | 'dj_broadcast') || 'text',
    image_url: dbMessage.image_url || undefined,
    created_at: dbMessage.created_at || new Date().toISOString(),
    is_flagged: dbMessage.is_flagged || false,
    reactions: []
  };
}

function adaptDatabaseReaction(dbReaction: DatabaseChatReaction): MessageReaction {
  return {
    id: dbReaction.id,
    message_id: dbReaction.message_id || '',
    user_id: dbReaction.user_id || '',
    emoji: dbReaction.emoji,
    created_at: dbReaction.created_at || new Date().toISOString()
  };
}

function adaptDatabaseMember(dbMember: DatabaseMember): WolfPackMember {
  return {
    id: dbMember.id,
    user_id: dbMember.user_id,
    location_id: dbMember.location_id || '',
    status: dbMember.status || 'active',
    joined_at: dbMember.joined_at,
    table_location: dbMember.table_location || undefined,
    display_name: dbMember.display_name || dbMember.username || undefined,
    avatar_url: dbMember.avatar_url || undefined
  };
}

function adaptDatabaseEvent(dbEvent: DatabaseEvent): DJEvent {
  return {
    id: dbEvent.id,
    dj_id: dbEvent.dj_id || '',
    location_id: dbEvent.location_id || '',
    event_type: dbEvent.event_type,
    title: dbEvent.title,
    description: dbEvent.description || undefined,
    status: dbEvent.status || 'active',
    voting_ends_at: dbEvent.voting_ends_at || undefined,
    created_at: dbEvent.created_at || new Date().toISOString(),
    options: dbEvent.options 
      ? Array.isArray(dbEvent.options) 
        ? dbEvent.options as string[]
        : (dbEvent.options as { options?: string[] })?.options || []
      : []
  };
}

/**
 * Helper function to resolve session code to session UUID
 * Handles both session codes (like "ece45f") and UUIDs
 */
async function resolveSessionId(sessionIdOrCode: string): Promise<string | null> {
  // If it's already a UUID format, return it
  if (sessionIdOrCode.length === 36 && sessionIdOrCode.includes('-')) {
    return sessionIdOrCode;
  }

  // If it's a session code, look up the UUID
  try {
    const { data } = await supabase
      .from('wolfpack_sessions')
      .select('id')
      .eq('session_code', sessionIdOrCode)
      .eq('is_active', true)
      .single();
    
    return data?.id || null;
  } catch (error) {
    console.error('Error resolving session ID:', error);
    return null;
  }
}

/**
 * Comprehensive realtime hook for Wolfpack chat and events
 * Updated to work with consolidated backend schema
 */
export function useWolfpack(
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
  const resolvedSessionIdRef = useRef<string | null>(null);

  // Cleanup channels on unmount
  useEffect(() => {
    return () => {
      channelsRef.current.forEach(channel => {
        channel.unsubscribe();
      });
      channelsRef.current = [];
    };
  }, []);

  // Load initial data directly from database
  const loadInitialData = useCallback(async () => {
    if (!sessionId || !locationId) return;

    try {
      setState(prev => ({ ...prev, error: null }));

      // Resolve session ID/code to UUID
      const resolvedSessionId = await resolveSessionId(sessionId);
      if (!resolvedSessionId) {
        throw new Error(`Invalid session: ${sessionId}`);
      }
      resolvedSessionIdRef.current = resolvedSessionId;

      // Load messages - use session_id as text (session code)
      const { data: messagesData, error: messagesError } = await supabase
        .from('wolfpack_chat_messages')
        .select('*')
        .eq('session_id', sessionId) // Use original session code for messages
        .order('created_at', { ascending: false })
        .limit(100);

      if (messagesError) {
        console.error('Error loading messages:', messagesError);
        throw messagesError;
      }

      // Load reactions for messages
      const messageIds = messagesData?.map(m => m.id) || [];
      const { data: reactionsData } = messageIds.length > 0 ? await supabase
        .from('wolfpack_chat_reactions')
        .select('*')
        .in('message_id', messageIds) : { data: [] };

      // Load members directly from the database  
      const { data: membersData, error: membersError } = await supabase
        .from('wolfpack_members_unified')
        .select('*')
        .eq('location_id', locationId)
        .eq('is_active', true);

      if (membersError) {
        console.error('Error loading members:', membersError);
        throw membersError;
      }

      // Load events directly from the database
      const { data: eventsData, error: eventsError } = await supabase
        .from('dj_events')
        .select('*')
        .eq('location_id', locationId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (eventsError) {
        console.error('Error loading events:', eventsError);
        throw eventsError;
      }

      // Process messages with reactions
      const messagesWithReactions = (messagesData || []).map(message => {
        const messageReactions = (reactionsData || [])
          .filter(r => r.message_id === message.id)
          .map(adaptDatabaseReaction);
        
        return {
          ...adaptDatabaseChatMessage(message),
          reactions: messageReactions
        };
      });

      setState(prev => ({
        ...prev,
        messages: messagesWithReactions,
        members: (membersData || []).map(adaptDatabaseMember),
        events: (eventsData || []).map(adaptDatabaseEvent)
      }));

    } catch (error) {
      console.error('Error loading initial data:', error);
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to load data'
      }));
    }
  }, [sessionId, locationId]);

  // Set up realtime subscriptions
  useEffect(() => {
    if (!sessionId || !locationId) return;

    // Clean up existing channels
    channelsRef.current.forEach(channel => channel.unsubscribe());
    channelsRef.current = [];

    // Chat messages subscription - use session code for filtering
    const chatChannel = supabase
      .channel(`wolfpack_chat_${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'wolfpack_chat_messages',
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          const newMessage = adaptDatabaseChatMessage(payload.new as DatabaseChatMessage);
          setState(prev => ({
            ...prev,
            messages: [newMessage, ...prev.messages]
          }));
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
          const updatedMessage = adaptDatabaseChatMessage(payload.new as DatabaseChatMessage);
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
      .channel(`wolfpack_reactions_${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'wolfpack_chat_reactions'
        },
        (payload) => {
          const newReaction = adaptDatabaseReaction(payload.new as DatabaseChatReaction);
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
          table: 'wolfpack_chat_reactions'
        },
        (payload) => {
          const deletedReaction = adaptDatabaseReaction(payload.old as DatabaseChatReaction);
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
      .channel(`wolfpack_members_${locationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wolfpack_members_unified',
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
      .channel(`wolfpack_events_${locationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'dj_events',
          filter: `location_id=eq.${locationId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newEvent = adaptDatabaseEvent(payload.new as DatabaseEvent);
            setState(prev => ({
              ...prev,
              events: [newEvent, ...prev.events]
            }));
          } else if (payload.eventType === 'UPDATE') {
            const updatedEvent = adaptDatabaseEvent(payload.new as DatabaseEvent);
            setState(prev => ({
              ...prev,
              events: prev.events.map(event =>
                event.id === updatedEvent.id ? updatedEvent : event
              )
            }));
          } else if (payload.eventType === 'DELETE') {
            const deletedEvent = adaptDatabaseEvent(payload.old as DatabaseEvent);
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
      // Get current user from auth
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      // Get user profile for display name and avatar
      const { data: profile } = await supabase
        .from('users')
        .select('first_name, last_name, avatar_url')
        .eq('auth_id', user.id)
        .single();

      const displayName = profile 
        ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || user.email?.split('@')[0] || 'Anonymous'
        : user.email?.split('@')[0] || 'Anonymous';

      const { error } = await supabase
        .from('wolfpack_chat_messages')
        .insert({
          session_id: sessionId, // Use session code as text
          user_id: user.id,
          display_name: displayName,
          avatar_url: profile?.avatar_url,
          content,
          image_url: imageUrl,
          message_type: imageUrl ? 'image' : 'text',
          is_flagged: false
        });

      return !error;
    } catch (error) {
      console.error('Send message error:', error);
      return false;
    }
  }, [sessionId]);

  // Add reaction action
  const addReaction = useCallback(async (messageId: string, emoji: string): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await supabase
        .from('wolfpack_chat_reactions')
        .insert({
          message_id: messageId,
          user_id: user.id,
          emoji
        });

      return !error;
    } catch (error) {
      console.error('Add reaction error:', error);
      return false;
    }
  }, []);

  // Remove reaction action
  const removeReaction = useCallback(async (reactionId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('wolfpack_chat_reactions')
        .delete()
        .eq('id', reactionId);

      return !error;
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

// Main export for useWolfpack function as default
export { useWolfpack as default };

// Typing indicator hook - simplified and working
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
              const newState = { ...prev };
              delete newState[user_id];
              return newState;
            });
            delete typingTimeoutRef.current[user_id];
          }, 3000);
        } else {
          setTypingUsers(prev => {
            const newState = { ...prev };
            delete newState[user_id];
            return newState;
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