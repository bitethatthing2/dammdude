import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

// =============================================================================
// TYPE DEFINITIONS - Perfect alignment with actual database schema
// =============================================================================

// Database row types - CORRECTED to match ACTUAL database schema from docs
interface DatabaseChatMessage {
  id: string;
  session_id: string;
  user_id: string | null;      // ACTUAL DB: user_id (not sender_id)
  display_name: string;        // ACTUAL DB: display_name
  avatar_url: string | null;   // ACTUAL DB: avatar_url
  content: string;             // ACTUAL DB: content (not message)
  message_type: string;
  image_url: string | null;
  created_at: string | null;
  edited_at: string | null;
  is_flagged: boolean | null;  // ACTUAL DB: is_flagged (not flagged)
  is_deleted: boolean | null;  // ACTUAL DB: is_deleted (not deleted_at)
}

// RPC function response type - includes joined user data
interface RPCChatMessageResponse {
  id: string;
  message: string;
  message_type: string;
  image_url: string | null;
  reply_to_id: string | null;
  is_pinned: boolean | null;
  created_at: string | null;
  sender: {
    id: string;
    display_name: string;
    wolf_emoji: string;
    profile_image_url: string | null;
  };
}

interface DatabaseChatReaction {
  id: string;
  message_id: string | null;
  user_id: string | null;
  emoji: string;
  created_at: string | null;
}

interface DatabaseUser {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  avatar_url: string | null;
  profile_pic_url: string | null;
  profile_image_url: string | null;
  wolf_emoji: string | null;
  role: string;
  location_id: string | null;
  is_wolfpack_member: boolean | null;
  wolfpack_status: string | null;
  wolfpack_joined_at: string | null;
  wolfpack_tier: string | null;
  is_permanent_pack_member: boolean | null;
  permanent_member_since: string | null;
  session_id: string | null;
  last_activity: string;
  is_online: boolean | null;
  status: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  auth_id: string | null;
  vibe_status: string | null;
  bio: string | null;
  favorite_drink: string | null;
}

interface DatabaseEvent {
  id: string;
  dj_id: string | null;
  location_id: string | null;
  event_type: string;
  title: string;
  description: string | null;
  status: string | null;
  voting_ends_at: string | null;
  created_at: string | null;
  started_at: string | null;
  ended_at: string | null;
  winner_id: string | null;
  winner_data: unknown | null;
  event_config: unknown | null;
  voting_format: string | null;
  options: unknown | null;
}

// =============================================================================
// SECURITY AND VALIDATION CONSTANTS
// =============================================================================

const MAX_MESSAGE_LENGTH = 500;
const MAX_DISPLAY_NAME_LENGTH = 50;
const RATE_LIMIT_DELAY = 1000;
const ALLOWED_EMOJI = ['👍', '👎', '❤️', '😂', '😮', '😢', '😡', '🔥', '🎉', '🎵'];
const SESSION_CODE_REGEX = /^[a-zA-Z0-9]{6,12}$/;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// =============================================================================
// FRONTEND INTERFACE TYPES
// =============================================================================

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
  status: 'active' | 'inactive' | 'suspended';
  joined_at: string;
  display_name?: string;
  avatar_url?: string;
  last_activity?: string;
  is_online?: boolean;
}

export interface DJEvent {
  id: string;
  dj_id: string;
  location_id: string;
  event_type: string;
  title: string;
  description?: string;
  status: 'pending' | 'active' | 'voting' | 'completed' | 'cancelled';
  voting_ends_at?: string;
  created_at: string;
  options?: unknown[];
}

interface AuthenticatedUser {
  id: string;
  email: string;
  profile?: {
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
    display_name: string | null;
  };
}

interface WolfpackError {
  code: string;
  message: string;
  details?: unknown;
}

interface RateLimitState {
  lastMessageTime: number;
  messageCount: number;
  windowStart: number;
}

// =============================================================================
// STATE AND ACTIONS INTERFACES
// =============================================================================

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

// =============================================================================
// SECURITY AND VALIDATION UTILITIES
// =============================================================================

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
      .replace(/[<>]/g, '')
      .replace(/\s+/g, ' ');
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

  static createError(code: string, message: string, details?: unknown): WolfpackError {
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
    
    if (now - this.state.windowStart > 60000) {
      this.state.windowStart = now;
      this.state.messageCount = 0;
    }

    if (this.state.messageCount >= 10) return false;
    if (now - this.state.lastMessageTime < RATE_LIMIT_DELAY) return false;

    return true;
  }

  recordMessage(): void {
    const now = Date.now();
    this.state.lastMessageTime = now;
    this.state.messageCount++;
  }
}

// =============================================================================
// ADAPTER FUNCTIONS - Perfect database alignment
// =============================================================================

// Adapter for RPC function responses
function adaptRPCChatMessage(rpcMessage: RPCChatMessageResponse, sessionId: string): WolfChatMessage {
  return {
    id: rpcMessage.id,
    session_id: sessionId,
    user_id: rpcMessage.sender.id,
    display_name: rpcMessage.sender.display_name,
    avatar_url: rpcMessage.sender.profile_image_url || undefined,
    content: rpcMessage.message,
    message_type: (rpcMessage.message_type as 'text' | 'image' | 'dj_broadcast') || 'text',
    image_url: rpcMessage.image_url || undefined,
    created_at: rpcMessage.created_at || new Date().toISOString(),
    is_flagged: false,  // RPC doesn't return flag status
    reactions: []
  };
}

// Adapter for direct database rows (for realtime subscriptions) - ACTUAL DB SCHEMA
function adaptDatabaseChatMessage(dbMessage: any): WolfChatMessage {
  return {
    id: dbMessage.id,
    session_id: dbMessage.session_id,
    user_id: dbMessage.user_id || '',           // CORRECTED: DB uses 'user_id'
    display_name: dbMessage.display_name || 'Unknown User',
    avatar_url: dbMessage.avatar_url || undefined,
    content: dbMessage.content || '',           // CORRECTED: DB uses 'content' field
    message_type: (dbMessage.message_type as 'text' | 'image' | 'dj_broadcast') || 'text',
    image_url: dbMessage.image_url || undefined,
    created_at: dbMessage.created_at || new Date().toISOString(),
    is_flagged: dbMessage.is_flagged ?? false,  // CORRECTED: DB uses 'is_flagged'
    reactions: []
  };
}

function adaptDatabaseReaction(dbReaction: Partial<DatabaseChatReaction> & { id: string; emoji: string; }): MessageReaction {
  return {
    id: dbReaction.id,
    message_id: dbReaction.message_id || '',
    user_id: dbReaction.user_id || '',
    emoji: dbReaction.emoji,
    created_at: dbReaction.created_at || new Date().toISOString()
  };
}

function adaptDatabaseMember(dbUser: Partial<DatabaseUser> & { id: string; created_at: string; }): WolfPackMember {
  return {
    id: dbUser.id,
    user_id: dbUser.id,
    location_id: dbUser.location_id || null,
    status: (dbUser.wolfpack_status === 'active' ? 'active' : 'inactive') as 'active' | 'inactive' | 'suspended',
    joined_at: dbUser.wolfpack_joined_at || dbUser.created_at,
    display_name: dbUser.display_name || `${dbUser.first_name || ''} ${dbUser.last_name || ''}`.trim() || undefined,
    avatar_url: dbUser.profile_image_url || dbUser.profile_pic_url || dbUser.avatar_url || undefined,
    last_activity: dbUser.last_activity || undefined,
    is_online: dbUser.is_online ?? false
  };
}

function adaptDatabaseEvent(dbEvent: Partial<DatabaseEvent> & { id: string; event_type: string; title: string; }): DJEvent {
  return {
    id: dbEvent.id,
    dj_id: dbEvent.dj_id || '',
    location_id: dbEvent.location_id || '',
    event_type: dbEvent.event_type,
    title: dbEvent.title,
    description: dbEvent.description || undefined,
    status: (dbEvent.status as 'pending' | 'active' | 'voting' | 'completed' | 'cancelled') || 'active',
    voting_ends_at: dbEvent.voting_ends_at || undefined,
    created_at: dbEvent.created_at || new Date().toISOString(),
    options: Array.isArray(dbEvent.options) ? dbEvent.options : []
  };
}

// =============================================================================
// AUTHENTICATION HELPER
// =============================================================================

async function getCurrentAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('❌ Authentication error:', authError);
      return null;
    }

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('first_name, last_name, avatar_url, display_name')
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

// =============================================================================
// SESSION RESOLVER
// =============================================================================

async function resolveSessionId(sessionIdOrCode: string): Promise<{ id: string | null; error?: WolfpackError }> {
  try {
    if (!sessionIdOrCode || typeof sessionIdOrCode !== 'string') {
      return { 
        id: null, 
        error: SecurityValidator.createError('INVALID_INPUT', 'Session ID is required and must be a string') 
      };
    }

    // Valid session IDs are: 'general', 'salem', 'portland', or any UUID
    const validSessionIds = ['general', 'salem', 'portland'];
    
    // If it's a known session ID, return it directly
    if (validSessionIds.includes(sessionIdOrCode)) {
      return { id: sessionIdOrCode };
    }

    // If it's a UUID, validate and return
    if (SecurityValidator.validateUUID(sessionIdOrCode)) {
      return { id: sessionIdOrCode };
    }

    // For any other string, accept it as a valid session ID (for dynamic sessions)
    // This allows event-specific sessions like 'event-123' or 'music-requests'
    return { id: sessionIdOrCode };
  } catch (error) {
    console.error('❌ Error resolving session ID:', error);
    return { 
      id: null, 
      error: SecurityValidator.createError('RESOLVE_ERROR', 'Unexpected error resolving session', error) 
    };
  }
}

// =============================================================================
// MAIN HOOK - Perfect Implementation
// =============================================================================

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

  const log = useCallback((message: string, ...args: unknown[]) => {
    if (enableDebugLogging) {
      console.log(`🐺 [useWolfpack] ${message}`, ...args);
    }
  }, [enableDebugLogging]);

  const handleError = useCallback((error: WolfpackError) => {
    console.error('❌ Wolfpack error:', error);
    setState(prev => ({ ...prev, error, isLoading: false }));
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Authentication management
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

  // Load initial data with perfect database queries
  const loadInitialData = useCallback(async () => {
    if (!sessionId || !locationId) return;

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const resolvedSession = await resolveSessionId(sessionId);
      if (!resolvedSession.id) {
        if (resolvedSession.error) {
          handleError(resolvedSession.error);
        }
        return;
      }
      resolvedSessionIdRef.current = resolvedSession.id;

      // First ensure the chat session exists
      const { data: sessionData, error: sessionError } = await supabase
        .from('wolfpack_chat_sessions')
        .select('id')
        .eq('session_id', sessionId)
        .single();
      
      if (sessionError && sessionError.code === 'PGRST116') {
        // Session doesn't exist, create it
        const { error: createError } = await supabase
          .from('wolfpack_chat_sessions')
          .insert({
            session_id: sessionId,
            display_name: `${sessionId.charAt(0).toUpperCase() + sessionId.slice(1)} Chat`,
            description: `Chat session for ${sessionId}`,
            location_id: locationId,
            is_active: true
          });
        
        if (createError) {
          console.warn('Could not create chat session:', createError);
        }
      }

      // Skip RPC and use direct table access (RPC functions may not exist)
      console.log('📨 [DEBUG] Loading messages directly from table...');
      let messagesData = [];
      
      try {
        console.log('🔍 [DEBUG] WOLFPACK HOOK v2.2 - Loading messages with CORRECT FIELDS for session:', sessionId);
        console.log('🔍 [DEBUG] Current user auth state...');
        
        // Check authentication first
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        console.log('🔍 [DEBUG] Auth user:', user?.id, 'Error:', authError);
        
        // Load messages without deleted_at filter (column doesn't exist)
        const { data: directData, error: directError } = await supabase
          .from('wolfpack_chat_messages')
          .select('*')
          .eq('session_id', sessionId)
          .order('created_at', { ascending: false })
          .limit(100);
          
        if (directError) {
          console.error('❌ [DEBUG] Direct table access failed:', {
            error: directError,
            code: directError.code,
            message: directError.message,
            details: directError.details,
            hint: directError.hint
          });
          messagesData = [];
        } else {
          // Filter out any deleted messages in JavaScript (in case there are different delete columns)
          const rawData = directData || [];
          messagesData = rawData.filter(msg => 
            !msg.deleted_at && !msg.is_deleted && !msg.deleted
          );
          
          console.log('✅ [DEBUG] Raw messages loaded:', rawData.length);
          console.log('✅ [DEBUG] Filtered messages:', messagesData.length);
          if (messagesData.length > 0) {
            console.log('📨 [DEBUG] Sample message structure:', messagesData[0]);
            console.log('📨 [DEBUG] Message keys:', Object.keys(messagesData[0]));
            console.log('📨 [DEBUG] Sender ID field:', messagesData[0].sender_id);
          }
        }
      } catch (tableError) {
        console.error('❌ [DEBUG] Table access threw exception:', tableError);
        messagesData = [];
      }

      // Load reactions for messages
      const messageIds = messagesData?.map(m => m.id) || [];
      const { data: reactionsData } = messageIds.length > 0 ? await supabase
        .from('wolfpack_chat_reactions')
        .select('id, message_id, user_id, emoji, created_at')
        .in('message_id', messageIds) : { data: [] };

      // Load active wolfpack members from users table
      const { data: membersData, error: membersError } = await supabase
        .from('users')
        .select(`
          id,
          email,
          display_name,
          first_name,
          last_name,
          avatar_url,
          profile_pic_url,
          profile_image_url,
          wolf_emoji,
          role,
          location_id,
          is_wolfpack_member,
          wolfpack_status,
          wolfpack_joined_at,
          wolfpack_tier,
          is_permanent_pack_member,
          is_online,
          last_activity,
          vibe_status,
          bio,
          favorite_drink,
          status,
          created_at
        `)
        .eq('location_id', locationId)
        .eq('is_wolfpack_member', true)
        .eq('wolfpack_status', 'active')
        .eq('status', 'active');

      if (membersError) throw membersError;

      // Load active events
      const { data: eventsData, error: eventsError } = await supabase
        .from('dj_events')
        .select('*')
        .eq('location_id', locationId)
        .in('status', ['active', 'voting'])
        .order('created_at', { ascending: false });

      if (eventsError) throw eventsError;

      // Get unique sender IDs to fetch user data
      console.log('🔍 [DEBUG] Extracting sender IDs from messages...');
      console.log('🔍 [DEBUG] Messages array length:', messagesData?.length);
      console.log('🔍 [DEBUG] First message sender_id:', messagesData?.[0]?.sender_id);
      
      const senderIds = [...new Set((messagesData || []).map(m => {
        console.log('🔍 [DEBUG] Message user_id:', m.user_id);
        return m.user_id;
      }).filter(Boolean))];
      
      console.log('👥 [DEBUG] Loading user data for sender IDs:', senderIds);
      
      // Load user data for all message senders
      const { data: usersData, error: usersError } = senderIds.length > 0 ? await supabase
        .from('users')
        .select('id, display_name, first_name, last_name, avatar_url, profile_image_url')
        .in('id', senderIds) : { data: [], error: null };
        
      if (usersError) {
        console.warn('⚠️ [DEBUG] Error loading user data:', usersError);
      } else {
        console.log('👥 [DEBUG] Loaded user data for', usersData?.length || 0, 'users');
      }
      
      // Create a lookup map for user data
      const usersMap = new Map((usersData || []).map(user => [user.id, user]));
      
      // Process messages with reactions and user data
      const messagesWithReactions = (messagesData || []).map((message: any) => {
        const messageReactions = (reactionsData || [])
          .filter(r => typeof r === 'object' && r !== null && 'message_id' in r && (r as DatabaseChatReaction).message_id === message.id)
          .map(r => adaptDatabaseReaction(r as DatabaseChatReaction));
        
        // Get user info from lookup map or use embedded data
        const userData = usersMap.get(message.user_id);
        const messageWithUser = {
          ...message,
          display_name: message.display_name || userData?.display_name || userData?.first_name || 'Wolf Member',
          avatar_url: message.avatar_url || userData?.profile_image_url || userData?.avatar_url
        };
        
        return {
          ...adaptDatabaseChatMessage(messageWithUser),
          reactions: messageReactions
        };
      });

      // Process members from users table
      const processedMembers = (membersData || []).map(member => adaptDatabaseMember(member as DatabaseUser));

      // Calculate stats
      const onlineMembers = processedMembers.filter(m => m.is_online).length;

      setState(prev => ({
        ...prev,
        messages: messagesWithReactions.reverse(), // Reverse to show oldest first
        members: processedMembers,
        events: (eventsData || []).map(adaptDatabaseEvent),
        isLoading: false,
        stats: {
          messageCount: messagesWithReactions.length,
          memberCount: processedMembers.length,
          onlineMembers
        }
      }));

      log('Initial data loaded successfully', {
        messages: messagesWithReactions.length,
        members: processedMembers.length,
        events: eventsData?.length || 0
      });

    } catch (error) {
      console.error('Error loading initial data:', error);
      console.error('Session ID:', sessionId);
      console.error('Location ID:', locationId);
      
      // Log specific error details
      if (error && typeof error === 'object') {
        console.error('Error details:', {
          message: (error as any).message,
          code: (error as any).code,
          details: (error as any).details,
          hint: (error as any).hint,
          stack: (error as any).stack,
          name: (error as any).name
        });
      }
      
      // Special handling for JSON parse errors
      if (error instanceof SyntaxError && error.message.includes('JSON')) {
        console.error('🚨 JSON Parse Error - this suggests RPC response format issue');
        console.error('Try using direct table access instead of RPC functions');
      }
      
      handleError(SecurityValidator.createError(
        'LOAD_ERROR', 
        error instanceof Error ? error.message : 'Failed to load data'
      ));
    }
  }, [sessionId, locationId, handleError, log]);

  // Realtime subscriptions with perfect channel management
  useEffect(() => {
    if (!sessionId || !locationId || !autoConnect) return;

    // Clean up existing channels
    channelsRef.current.forEach(channel => channel.unsubscribe());
    channelsRef.current = [];

    // Chat messages subscription
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
        async (payload) => {
          console.log('📨 [REALTIME] New message received:', payload.new);
          
          // Message already has display_name and avatar_url embedded
          const newMessage = adaptDatabaseChatMessage(payload.new);
          setState(prev => ({
            ...prev,
            messages: [newMessage, ...prev.messages]
          }));
          log('New message received', newMessage);
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
        async (payload) => {
          console.log('📨 [REALTIME] Message updated:', payload.new);
          
          // Message already has display_name and avatar_url embedded
          const updatedMessage = adaptDatabaseChatMessage(payload.new);
          setState(prev => ({
            ...prev,
            messages: prev.messages.map(msg =>
              msg.id === updatedMessage.id ? { ...updatedMessage, reactions: msg.reactions } : msg
            )
          }));
        }
      )
      .subscribe((status) => {
        setState(prev => ({ ...prev, isConnected: status === 'SUBSCRIBED' }));
        log('Chat channel status:', status);
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
          const newReaction = adaptDatabaseReaction(payload.new as Partial<DatabaseChatReaction> & { id: string; emoji: string; });
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
          const deletedReaction = adaptDatabaseReaction(payload.old as Partial<DatabaseChatReaction> & { id: string; emoji: string; });
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

    // Members subscription - watch users table
    const membersChannel = supabase
      .channel(`wolf-pack-members_${locationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users',
          filter: `location_id=eq.${locationId}`
        },
        () => {
          // Reload members data when membership changes
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
            const newEvent = adaptDatabaseEvent(payload.new as Partial<DatabaseEvent> & { id: string; event_type: string; title: string; });
            setState(prev => ({
              ...prev,
              events: [newEvent, ...prev.events]
            }));
          } else if (payload.eventType === 'UPDATE') {
            const updatedEvent = adaptDatabaseEvent(payload.new as Partial<DatabaseEvent> & { id: string; event_type: string; title: string; });
            setState(prev => ({
              ...prev,
              events: prev.events.map(event =>
                event.id === updatedEvent.id ? updatedEvent : event
              )
            }));
          } else if (payload.eventType === 'DELETE') {
            const deletedEvent = adaptDatabaseEvent(payload.old as Partial<DatabaseEvent> & { id: string; event_type: string; title: string; });
            setState(prev => ({
              ...prev,
              events: prev.events.filter(event => event.id !== deletedEvent.id)
            }));
          }
        }
      )
      .subscribe();

    channelsRef.current = [chatChannel, reactionsChannel, membersChannel, eventsChannel];
    loadInitialData();

  }, [sessionId, locationId, autoConnect, loadInitialData, log]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      channelsRef.current.forEach(channel => channel.unsubscribe());
      channelsRef.current = [];
    };
  }, []);

  // =============================================================================
  // ACTIONS - Perfect implementation with proper error handling
  // =============================================================================

  const sendMessage = useCallback(async (content: string, imageUrl?: string): Promise<{ success: boolean; error?: string }> => {
    console.log('🚀 [DEBUG] sendMessage called with content:', content);
    if (!sessionId) return { success: false, error: 'No session ID provided' };

    try {
      const authUser = await getCurrentAuthenticatedUser();
      if (!authUser) {
        return { success: false, error: 'Authentication required' };
      }

      if (!rateLimiterRef.current.canSendMessage()) {
        return { success: false, error: 'Rate limit exceeded. Please wait before sending another message.' };
      }

      const sanitizedContent = SecurityValidator.sanitizeMessage(content);
      console.log('🧼 [DEBUG] sanitized content:', sanitizedContent);
      if (!sanitizedContent.trim()) {
        return { success: false, error: 'Message cannot be empty' };
      }

      // CRITICAL: Check if we need to send display_name and avatar_url directly
      // Since actual DB has these fields, we might need to provide them
      
      // Get user profile for display_name and avatar_url
      const { data: userProfile } = await supabase
        .from('users')
        .select('display_name, first_name, last_name, avatar_url, profile_image_url')
        .eq('auth_id', authUser.id)
        .single();
      
      const displayName = userProfile?.display_name || 
                         `${userProfile?.first_name || ''} ${userProfile?.last_name || ''}`.trim() || 
                         'Anonymous User';
      const avatarUrl = userProfile?.profile_image_url || userProfile?.avatar_url;

      // Try direct insert since actual DB schema doesn't match migration RPC functions
      // First get the user's internal ID from their auth_id
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', authUser.id)
        .single();
        
      if (userError || !userData) {
        return { success: false, error: 'User profile not found' };
      }

      const insertData = {
        session_id: sessionId,
        user_id: userData.id,         // CORRECTED: DB uses 'user_id'
        display_name: displayName,    // Include display name
        avatar_url: avatarUrl,        // Include avatar URL  
        content: sanitizedContent,    // CORRECTED: DB uses 'content'
        message_type: imageUrl ? 'image' : 'text',
        image_url: imageUrl || null,
        is_flagged: false,
        is_deleted: false
      };
      console.log('📥 [DEBUG] Inserting message data:', insertData);
      
      // Use direct table insert (skip RPC since it may not exist)
      console.log('📤 [DEBUG] Inserting message directly to table...');
      const { data: result, error } = await supabase
        .from('wolfpack_chat_messages')
        .insert(insertData)
        .select()
        .single();
        
      console.log('📤 [DEBUG] Insert result:', result, 'Error:', error);

      if (error) {
        console.error('❌ Database insert error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          insertData
        });
        return { success: false, error: error.message };
      }

      // Check if RPC returned an error in the response
      if (result && typeof result === 'object' && 'error' in result) {
        return { success: false, error: result.error as string };
      }

      rateLimiterRef.current.recordMessage();
      return { success: true, data: result };
    } catch (error) {
      console.error('Send message error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to send message' };
    }
  }, [sessionId]);

  const addReaction = useCallback(async (messageId: string, emoji: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!SecurityValidator.validateEmoji(emoji)) {
        return { success: false, error: 'Invalid emoji' };
      }

      if (!SecurityValidator.validateUUID(messageId)) {
        return { success: false, error: 'Invalid message ID' };
      }

      const authUser = await getCurrentAuthenticatedUser();
      if (!authUser) {
        return { success: false, error: 'Authentication required' };
      }

      // Check for existing reaction
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

  const removeReaction = useCallback(async (reactionId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!SecurityValidator.validateUUID(reactionId)) {
        return { success: false, error: 'Invalid reaction ID' };
      }

      const authUser = await getCurrentAuthenticatedUser();
      if (!authUser) {
        return { success: false, error: 'Authentication required' };
      }

      const { error } = await supabase
        .from('wolfpack_chat_reactions')
        .delete()
        .eq('id', reactionId)
        .eq('user_id', authUser.id);

      return { success: !error, error: error?.message };
    } catch (error) {
      console.error('Remove reaction error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to remove reaction' };
    }
  }, []);

  const joinWolfpack = useCallback(async (locationId: string, profileData?: Partial<WolfPackMember>): Promise<{ success: boolean; error?: string }> => {
    try {
      const authUser = await getCurrentAuthenticatedUser();
      if (!authUser) {
        return { success: false, error: 'Authentication required' };
      }

      if (!SecurityValidator.validateUUID(locationId)) {
        return { success: false, error: 'Invalid location ID' };
      }

      // Update user to be a wolfpack member
      const { error } = await supabase
        .from('users')
        .update({
          is_wolfpack_member: true,
          wolfpack_status: 'active',
          wolfpack_joined_at: new Date().toISOString(),
          location_id: locationId,
          display_name: profileData?.display_name ? 
            SecurityValidator.sanitizeDisplayName(profileData.display_name) : undefined
        })
        .eq('auth_id', authUser.id);

      if (error) {
        return { success: false, error: error.message };
      }

      setState(prev => ({
        ...prev,
        membershipStatus: {
          isMember: true,
          isActive: true,
          locationId,
          joinedAt: new Date().toISOString()
        }
      }));

      return { success: true };
    } catch (error) {
      console.error('Join wolfpack error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to join wolfpack' };
    }
  }, []);

  const leaveWolfpack = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const authUser = await getCurrentAuthenticatedUser();
      if (!authUser) {
        return { success: false, error: 'Authentication required' };
      }

      const { error } = await supabase
        .from('users')
        .update({ 
          wolfpack_status: 'inactive',
          is_wolfpack_member: false 
        })
        .eq('auth_id', authUser.id);

      return { success: !error, error: error?.message };
    } catch (error) {
      console.error('Leave wolfpack error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to leave wolfpack' };
    }
  }, []);

  const updateProfile = useCallback(async (updates: Partial<WolfPackMember>): Promise<{ success: boolean; error?: string }> => {
    try {
      const authUser = await getCurrentAuthenticatedUser();
      if (!authUser) {
        return { success: false, error: 'Authentication required' };
      }

      const { error } = await supabase
        .from('users')
        .update({
          display_name: updates.display_name ? SecurityValidator.sanitizeDisplayName(updates.display_name) : undefined
        })
        .eq('auth_id', authUser.id);

      return { success: !error, error: error?.message };
    } catch (error) {
      console.error('Update profile error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to update profile' };
    }
  }, []);

  const refreshData = useCallback(async () => {
    await loadInitialData();
  }, [loadInitialData]);

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

// =============================================================================
// TYPING INDICATORS HOOK
// =============================================================================

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
          
          if (typingTimeoutRef.current[user_id]) {
            clearTimeout(typingTimeoutRef.current[user_id]);
          }
          
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

export default useWolfpack;