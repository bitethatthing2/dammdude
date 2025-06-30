import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

// Database row types from generated types - using proper interfaces for missing tables
interface DatabaseChatMessage {
  id: string;
  session_id: string;
  user_id: string;
  display_name?: string;
  avatar_url?: string;
  content: string;
  message_type?: string;
  image_url?: string;
  created_at: string;
  is_flagged?: boolean;
}

interface DatabaseChatReaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}
type DatabaseMember = Database['public']['Tables']['users']['Row'];
type DatabaseEvent = Database['public']['Tables']['dj_events']['Row'];

// Security and validation constants
const MAX_MESSAGE_LENGTH = 500;
const MAX_DISPLAY_NAME_LENGTH = 50;
const MAX_MESSAGES_PER_SESSION = 1000;
const RATE_LIMIT_DELAY = 1000; // 1 second between messages
const SESSION_CODE_REGEX = /^[a-zA-Z0-9]{6,12}$/;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ALLOWED_EMOJI = ['👍', '👎', '❤️', '😂', '😮', '😢', '😡', '🔥', '🎉', '🎵'];

// Authentication and user context
interface AuthenticatedUser {
  id: string;
  email: string;
  profile?: {
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  };
}

// Enhanced error types
interface WolfpackError {
  code: string;
  message: string;
  details?: any;
}

// Rate limiting state
interface RateLimitState {
  lastMessageTime: number;
  messageCount: number;
  windowStart: number;
}

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
  location_id: string | null;
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
  isLoading: boolean;
  error: WolfpackError | null;
  currentUser: AuthenticatedUser | null;
  membershipStatus: {
    isMember: boolean;
    isActive: boolean;
    locationId: string | null;
    joinedAt: string | null;
  };
  stats: {
    messageCount: number;
    memberCount: number;
    onlineMembers: number;
  };
}

interface RealtimeActions {
  sendMessage: (content: string, imageUrl?: string) => Promise<{ success: boolean; error?: string }>;
  addReaction: (messageId: string, emoji: string) => Promise<{ success: boolean; error?: string }>;
  removeReaction: (reactionId: string) => Promise<{ success: boolean; error?: string }>;
  joinWolfpack: (locationId: string, profileData?: Partial<WolfPackMember>) => Promise<{ success: boolean; error?: string }>;
  leaveWolfpack: () => Promise<{ success: boolean; error?: string }>;
  updateProfile: (updates: Partial<WolfPackMember>) => Promise<{ success: boolean; error?: string }>;
  refreshData: () => Promise<void>;
  clearError: () => void;
}

// Security and validation utilities
class SecurityValidator {
  static validateUUID(id: string): boolean {
    return UUID_REGEX.test(id);
  }

  static validateSessionCode(code: string): boolean {
    return SESSION_CODE_REGEX.test(code);
  }

  static sanitizeMessage(content: string): string {
    return content
      .trim()
      .slice(0, MAX_MESSAGE_LENGTH)
      .replace(/[<>]/g, '') // Basic XSS prevention
      .replace(/\s+/g, ' '); // Normalize whitespace
  }

  static sanitizeDisplayName(name: string): string {
    return name
      .trim()
      .slice(0, MAX_DISPLAY_NAME_LENGTH)
      .replace(/[<>]/g, '');
  }

  static validateEmoji(emoji: string): boolean {
    return ALLOWED_EMOJI.includes(emoji);
  }

  static createError(code: string, message: string, details?: any): WolfpackError {
    return { code, message, details };
  }
}

class RateLimiter {
  private state: RateLimitState = {
    lastMessageTime: 0,
    messageCount: 0,
    windowStart: Date.now()
  };

  canSendMessage(): boolean {
    const now = Date.now();
    
    // Reset window if it's been more than a minute
    if (now - this.state.windowStart > 60000) {
      this.state.windowStart = now;
      this.state.messageCount = 0;
    }

    // Check rate limit (max 10 messages per minute)
    if (this.state.messageCount >= 10) {
      return false;
    }

    // Check minimum delay between messages
    if (now - this.state.lastMessageTime < RATE_LIMIT_DELAY) {
      return false;
    }

    return true;
  }

  recordMessage(): void {
    const now = Date.now();
    this.state.lastMessageTime = now;
    this.state.messageCount++;
  }
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
    user_id: dbMember.id, // Use id as user_id since there's no separate user_id
    location_id: dbMember.location_id || null,
    status: dbMember.wolfpack_status || 'active',
    joined_at: dbMember.wolfpack_joined_at || dbMember.created_at,
    table_location: undefined, // This field doesn't exist
    display_name: dbMember.display_name || undefined,
    avatar_url: dbMember.avatar_url || undefined
  };
}

// New adapter for user-based members (since wolfpack_members_unified is consolidated)
function adaptUserToMember(dbUser: Database['public']['Tables']['users']['Row']): WolfPackMember {
  return {
    id: dbUser.id,
    user_id: dbUser.id,
    location_id: null, // Will be set contextually
    status: 'active',
    joined_at: dbUser.created_at,
    table_location: undefined,
    display_name: dbUser.display_name || `${dbUser.first_name || ''} ${dbUser.last_name || ''}`.trim() || dbUser.email?.split('@')[0],
    avatar_url: dbUser.avatar_url || undefined
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
    options: [] // Default to empty array since options field doesn't exist
  };
}

/**
 * Enhanced authentication helper
 */
async function getCurrentAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('❌ Authentication error:', authError);
      return null;
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('first_name, last_name, avatar_url')
      .eq('auth_id', user.id)
      .single();

    if (profileError) {
      console.warn('⚠️ Could not fetch user profile:', profileError);
    }

    return {
      id: user.id,
      email: user.email || '',
      profile: profile || undefined
    };
  } catch (error) {
    console.error('❌ Error getting authenticated user:', error);
    return null;
  }
}

/**
 * Image URL validator
 */
function isValidImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && 
           /\.(jpg|jpeg|png|gif|webp)$/i.test(parsed.pathname);
  } catch {
    return false;
  }
}

/**
 * Generate secure channel names
 */
function generateSecureChannelName(sessionId: string, type: string): string {
  const hash = btoa(sessionId + type + Date.now()).substring(0, 16);
  return `wp_${type}_${hash}`;
}

/**
 * Secure session resolver with validation
 */
async function resolveSessionId(sessionIdOrCode: string): Promise<{ id: string | null; error?: WolfpackError }> {
  try {
    // Validate input format
    if (!sessionIdOrCode || typeof sessionIdOrCode !== 'string') {
      return { 
        id: null, 
        error: SecurityValidator.createError('INVALID_INPUT', 'Session ID is required and must be a string') 
      };
    }

    // If it's already a UUID format, validate and return it
    if (SecurityValidator.validateUUID(sessionIdOrCode)) {
      return { id: sessionIdOrCode };
    }

    // If it's a session code, validate format first
    if (!SecurityValidator.validateSessionCode(sessionIdOrCode)) {
      return { 
        id: null, 
        error: SecurityValidator.createError('INVALID_SESSION_CODE', 'Invalid session code format') 
      };
    }

    // For now, treat session codes as direct session IDs
    // This can be enhanced later with proper session code lookup
    return { id: sessionIdOrCode };
  } catch (error) {
    console.error('❌ Error resolving session ID:', error);
    return { 
      id: null, 
      error: SecurityValidator.createError('RESOLVE_ERROR', 'Unexpected error resolving session', error) 
    };
  }
}

/**
 * Comprehensive, secure realtime hook for Wolfpack functionality
 * Single source of truth with authentication, validation, and performance optimizations
 */
export function useWolfpack(
  sessionId: string | null,
  locationId: string | null,
  options?: { enableDebugLogging?: boolean; autoConnect?: boolean }
): { state: RealtimeState; actions: RealtimeActions } {
  const { enableDebugLogging = false, autoConnect = true } = options || {};
  
  const [state, setState] = useState<RealtimeState>({
    messages: [],
    members: [],
    events: [],
    isConnected: false,
    isLoading: false,
    error: null,
    currentUser: null,
    membershipStatus: {
      isMember: false,
      isActive: false,
      locationId: null,
      joinedAt: null
    },
    stats: {
      messageCount: 0,
      memberCount: 0,
      onlineMembers: 0
    }
  });

  const channelsRef = useRef<RealtimeChannel[]>([]);
  const resolvedSessionIdRef = useRef<string | null>(null);
  const rateLimiterRef = useRef(new RateLimiter());
  const authUserRef = useRef<AuthenticatedUser | null>(null);

  // Debug logging helper
  const log = useCallback((message: string, ...args: any[]) => {
    if (enableDebugLogging) {
      console.log(`🐺 [useWolfpack] ${message}`, ...args);
    }
  }, [enableDebugLogging]);

  // Memoized error handler
  const handleError = useCallback((error: WolfpackError) => {
    console.error('❌ Wolfpack error:', error);
    setState(prev => ({ ...prev, error, isLoading: false }));
  }, []);

  // Clear error action
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Cleanup channels on unmount
  useEffect(() => {
    return () => {
      channelsRef.current.forEach(channel => {
        channel.unsubscribe();
      });
      channelsRef.current = [];
    };
  }, []);

  // Authentication state management
  useEffect(() => {
    let mounted = true;
    
    const loadAuthUser = async () => {
      const authUser = await getCurrentAuthenticatedUser();
      if (mounted) {
        authUserRef.current = authUser;
        setState(prev => ({ ...prev, currentUser: authUser }));
      }
    };

    loadAuthUser();
    
    return () => { mounted = false; };
  }, []);

  // Load initial data directly from database
  const loadInitialData = useCallback(async () => {
    if (!sessionId || !locationId) return;

    try {
      setState(prev => ({ ...prev, error: null }));

      // Resolve session ID/code to UUID
      const resolvedSession = await resolveSessionId(sessionId);
      if (!resolvedSession.id) {
        throw new Error(`Invalid session: ${sessionId}`);
      }
      resolvedSessionIdRef.current = resolvedSession.id;

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

      // Load members from users table (wolfpack_members_unified has been consolidated)
      const { data: membersData, error: membersError } = await supabase
        .from('users')
        .select('id, first_name, last_name, email, display_name, avatar_url, is_wolfpack_member, created_at, location_id, wolfpack_status, wolfpack_joined_at')
        .eq('is_wolfpack_member', true);

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
        error: SecurityValidator.createError('LOAD_ERROR', error instanceof Error ? error.message : 'Failed to load data')
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

    // Members subscription (now using users table)
    const membersChannel = supabase
      .channel(`wolfpack_members_${locationId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: 'is_wolfpack_member=eq.true'
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
          if (payload.event === 'INSERT') {
            const newEvent = adaptDatabaseEvent(payload.new as DatabaseEvent);
            setState(prev => ({
              ...prev,
              events: [newEvent, ...prev.events]
            }));
          } else if (payload.event === 'UPDATE') {
            const updatedEvent = adaptDatabaseEvent(payload.new as DatabaseEvent);
            setState(prev => ({
              ...prev,
              events: prev.events.map(event =>
                event.id === updatedEvent.id ? updatedEvent : event
              )
            }));
          } else if (payload.event === 'DELETE') {
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

  // Send message action with enhanced security
  const sendMessage = useCallback(async (content: string, imageUrl?: string): Promise<{ success: boolean; error?: string }> => {
    if (!sessionId) return { success: false, error: 'No session ID provided' };

    try {
      // Check authentication using helper
      const authUser = await getCurrentAuthenticatedUser();
      if (!authUser) {
        return { success: false, error: 'Authentication required' };
      }

      // Apply rate limiting
      if (!rateLimiterRef.current.canSendMessage()) {
        return { success: false, error: 'Rate limit exceeded. Please wait before sending another message.' };
      }

      // Sanitize input
      const sanitizedContent = SecurityValidator.sanitizeMessage(content);
      if (!sanitizedContent.trim()) {
        return { success: false, error: 'Message cannot be empty' };
      }

      // Validate image URL if provided
      if (imageUrl && !isValidImageUrl(imageUrl)) {
        return { success: false, error: 'Invalid image URL' };
      }

      const displayName = authUser.profile 
        ? SecurityValidator.sanitizeDisplayName(
            `${authUser.profile.first_name || ''} ${authUser.profile.last_name || ''}`.trim() || 
            authUser.email.split('@')[0] || 'Anonymous'
          )
        : SecurityValidator.sanitizeDisplayName(authUser.email.split('@')[0] || 'Anonymous');

      const { error } = await supabase
        .from('wolfpack_chat_messages')
        .insert({
          session_id: sessionId,
          user_id: authUser.id,
          display_name: displayName,
          avatar_url: authUser.profile?.avatar_url,
          content: sanitizedContent,
          image_url: imageUrl,
          message_type: imageUrl ? 'image' : 'text',
          is_flagged: false
        });

      if (!error) {
        // Record successful message for rate limiting
        rateLimiterRef.current.recordMessage();
      }

      return { success: !error, error: error?.message };
    } catch (error) {
      console.error('Send message error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to send message' };
    }
  }, [sessionId]);

  // Add reaction action with validation
  const addReaction = useCallback(async (messageId: string, emoji: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Validate emoji
      if (!SecurityValidator.validateEmoji(emoji)) {
        return { success: false, error: 'Invalid emoji' };
      }

      // Validate message ID
      if (!SecurityValidator.validateUUID(messageId)) {
        return { success: false, error: 'Invalid message ID' };
      }

      // Check authentication
      const authUser = await getCurrentAuthenticatedUser();
      if (!authUser) {
        return { success: false, error: 'Authentication required' };
      }

      // Check if user already reacted with this emoji
      const { data: existingReaction } = await supabase
        .from('wolfpack_chat_reactions')
        .select('id')
        .eq('message_id', messageId)
        .eq('user_id', authUser.id)
        .eq('emoji', emoji)
        .single();

      if (existingReaction) {
        return { success: false, error: 'You have already reacted with this emoji' };
      }

      const { error } = await supabase
        .from('wolfpack_chat_reactions')
        .insert({
          message_id: messageId,
          user_id: authUser.id,
          emoji
        });

      return { success: !error, error: error?.message };
    } catch (error) {
      console.error('Add reaction error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to add reaction' };
    }
  }, []);

  // Remove reaction action with ownership check
  const removeReaction = useCallback(async (reactionId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Validate reaction ID
      if (!SecurityValidator.validateUUID(reactionId)) {
        return { success: false, error: 'Invalid reaction ID' };
      }

      // Check authentication
      const authUser = await getCurrentAuthenticatedUser();
      if (!authUser) {
        return { success: false, error: 'Authentication required' };
      }

      // Verify user owns this reaction
      const { data: reaction, error: fetchError } = await supabase
        .from('wolfpack_chat_reactions')
        .select('user_id')
        .eq('id', reactionId)
        .single();

      if (fetchError || !reaction) {
        return { success: false, error: 'Reaction not found' };
      }

      if (reaction.user_id !== authUser.id) {
        return { success: false, error: 'You can only remove your own reactions' };
      }

      const { error } = await supabase
        .from('wolfpack_chat_reactions')
        .delete()
        .eq('id', reactionId)
        .eq('user_id', authUser.id); // Double-check ownership

      return { success: !error, error: error?.message };
    } catch (error) {
      console.error('Remove reaction error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to remove reaction' };
    }
  }, []);

  // Refresh data action
  const refreshData = useCallback(async () => {
    await loadInitialData();
  }, [loadInitialData]);

  // Join wolfpack action with proper implementation
  const joinWolfpack = useCallback(async (locationId: string, profileData?: Partial<WolfPackMember>): Promise<{ success: boolean; error?: string }> => {
    try {
      const authUser = await getCurrentAuthenticatedUser();
      if (!authUser) {
        return { success: false, error: 'Authentication required' };
      }

      if (!SecurityValidator.validateUUID(locationId)) {
        return { success: false, error: 'Invalid location ID' };
      }

      // Check if already a member (now using users table)
      const { data: existingUser } = await supabase
        .from('users')
        .select('id, is_wolfpack_member')
        .eq('id', authUser.id)
        .single();

      if (existingUser?.is_wolfpack_member) {
        return { success: false, error: 'Already a member of the wolfpack' };
      }

      // Update user to be a wolfpack member
      const { error } = await supabase
        .from('users')
        .update({
          is_wolfpack_member: true,
          display_name: profileData?.display_name ? 
            SecurityValidator.sanitizeDisplayName(profileData.display_name) : 
            undefined
        })
        .eq('id', authUser.id);

      if (!error) {
        // Refresh membership status
        setState(prev => ({
          ...prev,
          membershipStatus: {
            isMember: true,
            isActive: true,
            locationId,
            joinedAt: new Date().toISOString()
          }
        }));
      }

      return { success: !error, error: error?.message };
    } catch (error) {
      console.error('Join wolfpack error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to join wolfpack' };
    }
  }, []);

  // Leave wolfpack action
  const leaveWolfpack = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    // This would need to be implemented based on your wolfpack leaving logic
    return { success: false, error: 'Leave wolfpack not implemented yet' };
  }, []);

  // Update profile action
  const updateProfile = useCallback(async (updates: Partial<WolfPackMember>): Promise<{ success: boolean; error?: string }> => {
    // This would need to be implemented based on your profile update logic
    return { success: false, error: 'Update profile not implemented yet' };
  }, []);

  const actions: RealtimeActions = {
    sendMessage,
    addReaction,
    removeReaction,
    joinWolfpack,
    leaveWolfpack,
    updateProfile,
    refreshData,
    clearError
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