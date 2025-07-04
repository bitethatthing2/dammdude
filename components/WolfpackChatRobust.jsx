// Enhanced version with better session management
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase-singleton';

export default function WolfpackChatRobust({ sessionId = 'general' }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const messagesEndRef = useRef(null);
  const channelRef = useRef(null);

  // Session configuration for different chat rooms
  const sessionConfig = {
    general: { name: '🌍 General Chat', description: 'Main wolfpack chat' },
    salem: { name: '📍 Salem', description: 'Salem location chat' },
    portland: { name: '📍 Portland', description: 'Portland location chat' },
    events: { name: '🎉 Events', description: 'Event discussions' },
    music: { name: '🎵 Music', description: 'DJ requests and music chat' }
  };

  const currentSession = sessionConfig[sessionId] || { 
    name: sessionId, 
    description: 'Chat room' 
  };

  // Check authentication with better error handling
  const checkUser = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('Auth error:', error);
        if (error.message.includes('token') || error.message.includes('session')) {
          console.log('Clearing corrupted auth data...');
          if (window.clearCorruptedCookies) {
            window.clearCorruptedCookies();
          }
          // Don't auto-reload, just show login prompt
          setUser(null);
          setError('Authentication expired. Please log in again.');
          return;
        }
      }
      
      setUser(user);
      if (!user) {
        setError('Please log in to use chat');
      } else {
        setError(null);
      }
    } catch (err) {
      console.error('Check user error:', err);
      setError('Authentication check failed');
    }
  };

  // Load messages with multiple fallback methods
  const loadMessages = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Method 1: Try the working get_wolfpack_chat_messages function
      const { data: messagesData, error: getError } = await supabase
        .rpc('get_wolfpack_chat_messages', {
          p_session_id: sessionId,
          p_limit: 50,
          p_offset: 0
        });

      if (!getError && messagesData) {
        setMessages(Array.isArray(messagesData) ? messagesData : []);
        return;
      }

      console.warn('RPC method failed, trying direct query:', getError);
      
      // Method 2: Direct table query as fallback
      const { data: directMessages, error: directError } = await supabase
        .from('wolfpack_chat_messages')
        .select(`
          id,
          content,
          message_type,
          image_url,
          created_at,
          user_id,
          display_name,
          avatar_url
        `)
        .eq('session_id', sessionId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true })
        .limit(50);

      if (!directError && directMessages) {
        // Transform to match expected format
        const transformedMessages = directMessages.map(msg => ({
          id: msg.id,
          message: msg.content,
          message_type: msg.message_type,
          image_url: msg.image_url,
          created_at: msg.created_at,
          sender: {
            id: msg.user_id,
            display_name: msg.display_name,
            profile_image_url: msg.avatar_url,
            wolf_emoji: '🐺'
          }
        }));
        setMessages(transformedMessages);
      } else {
        console.error('Direct query failed:', directError);
        setError('Failed to load messages');
      }
    } catch (err) {
      console.error('Load messages error:', err);
      setError('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  // Send message with comprehensive fallback chain
  const sendMessage = async () => {
    if (!newMessage.trim() || !user || sending) return;
    
    const messageText = newMessage.trim();
    setSending(true);
    setError(null);
    
    // Clear input optimistically
    setNewMessage('');
    
    try {
      let success = false;
      
      // Method 1: Try send_wolfpack_chat_message (the one that should work)
      try {
        const { data: result1, error: error1 } = await supabase
          .rpc('send_wolfpack_chat_message', {
            p_session_id: sessionId,
            p_content: messageText,
            p_message_type: 'text'
          });

        if (!error1) {
          if (result1 && typeof result1 === 'object' && 'error' in result1) {
            throw new Error(result1.error);
          }
          success = true;
          console.log('✅ Method 1 (send_wolfpack_chat_message) succeeded');
        } else {
          throw error1;
        }
      } catch (err1) {
        console.warn('Method 1 failed:', err1.message);
        
        // Method 2: Try send_chat_message_simple
        try {
          const { data: result2, error: error2 } = await supabase
            .rpc('send_chat_message_simple', {
              p_content: messageText,
              p_session_id: sessionId
            });

          if (!error2) {
            if (result2 && result2.success) {
              success = true;
              console.log('✅ Method 2 (send_chat_message_simple) succeeded');
            } else if (result2 && result2.error) {
              throw new Error(result2.error);
            } else {
              success = true;
            }
          } else {
            throw error2;
          }
        } catch (err2) {
          console.warn('Method 2 failed:', err2.message);
          
          // Method 3: Direct insert (most reliable)
          try {
            const { data: profile, error: profileError } = await supabase
              .from('users')
              .select('id, display_name, avatar_url, profile_image_url')
              .eq('auth_id', user.id)
              .single();

            if (profileError || !profile) {
              throw new Error('User profile not found');
            }

            const { error: insertError } = await supabase
              .from('wolfpack_chat_messages')
              .insert({
                session_id: sessionId,
                user_id: profile.id,
                display_name: profile.display_name || user.email?.split('@')[0] || 'Anonymous',
                avatar_url: profile.profile_image_url || profile.avatar_url,
                content: messageText,
                message_type: 'text',
                is_deleted: false,
                is_flagged: false
              });

            if (!insertError) {
              success = true;
              console.log('✅ Method 3 (direct insert) succeeded');
            } else {
              throw insertError;
            }
          } catch (err3) {
            console.error('Method 3 failed:', err3.message);
            throw new Error('All send methods failed');
          }
        }
      }

      if (success) {
        // Reload messages after successful send
        await loadMessages();
      }
      
    } catch (err) {
      console.error('Send error:', err);
      setError(`Failed to send message: ${err.message}`);
      // Restore message on error
      setNewMessage(messageText);
    } finally {
      setSending(false);
    }
  };

  // Setup real-time subscription with connection status
  const setupRealtimeSubscription = () => {
    if (!user || channelRef.current) return;

    setConnectionStatus('connecting');
    
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
          console.log('🔄 New message received via real-time:', payload.new);
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
          console.log('🔄 Message updated via real-time:', payload.new);
          loadMessages();
        }
      )
      .subscribe((status) => {
        console.log(`Real-time status for ${sessionId}:`, status);
        setConnectionStatus(status === 'SUBSCRIBED' ? 'connected' : 'disconnected');
      });

    channelRef.current = channel;
  };

  // Cleanup real-time subscription
  const cleanupSubscription = () => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
      setConnectionStatus('disconnected');
    }
  };

  // Auth state listener
  useEffect(() => {
    checkUser();
    
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event);
      if (event === 'SIGNED_IN') {
        checkUser();
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setError('Please log in to use chat');
        cleanupSubscription();
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // Load messages when user or session changes
  useEffect(() => {
    if (user) {
      loadMessages();
    }
  }, [sessionId, user]);

  // Setup real-time when user is ready
  useEffect(() => {
    if (user) {
      setupRealtimeSubscription();
    }
    
    return cleanupSubscription;
  }, [sessionId, user]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-md">
          <div className="text-6xl mb-4">🐺</div>
          <h3 className="text-xl font-semibold mb-2">Join the Wolfpack</h3>
          <p className="text-gray-600 mb-4">Please log in to use chat</p>
          <button 
            onClick={() => window.location.href = '/login'}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Log In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header with status */}
      <div className="bg-white border-b px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg">{currentSession.name}</h3>
            <p className="text-sm text-gray-500">{currentSession.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-500' : 
              connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
            }`}></div>
            <span className="text-xs text-gray-500 capitalize">{connectionStatus}</span>
          </div>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 m-3 rounded-lg">
          <div className="flex items-center justify-between">
            <span>{error}</span>
            <button 
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading && messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <div className="animate-pulse">Loading messages...</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <div className="text-4xl mb-2">💬</div>
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="flex items-start gap-3 hover:bg-white hover:bg-opacity-50 p-2 rounded-lg transition-colors">
              <img 
                src={msg.sender?.profile_image_url || `/api/avatar?name=${encodeURIComponent(msg.sender?.display_name || 'User')}`}
                alt="Avatar"
                className="w-10 h-10 rounded-full border border-gray-200"
                onError={(e) => {
                  e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.sender?.id || 'default'}`;
                }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="font-semibold text-gray-900">
                    {msg.sender?.display_name || 'Anonymous'}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(msg.created_at).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-gray-800 break-words">{msg.message}</p>
                {msg.image_url && (
                  <img 
                    src={msg.image_url} 
                    alt="Shared image" 
                    className="mt-2 max-w-xs rounded-lg border"
                  />
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t bg-white p-4">
        <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={`Message ${currentSession.name.replace(/[🌍📍🎉🎵]/g, '').trim()}...`}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={sending}
            maxLength={500}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {sending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Sending...
              </>
            ) : (
              'Send'
            )}
          </button>
        </form>
        <div className="text-xs text-gray-500 mt-1">
          {newMessage.length}/500 characters
        </div>
      </div>
    </div>
  );
}