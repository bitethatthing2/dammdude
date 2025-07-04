'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser } from '@/hooks/useUser';
import { useConsistentWolfpackAccess } from '@/lib/hooks/useConsistentWolfpackAccess';
import { useWolfpack } from '@/hooks/useWolfpack';
import { useTypingIndicators } from '@/hooks/useTypingIndicators';
import { useWolfpackSession } from '@/lib/hooks/useWolfpackSession';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Settings, Shield, ArrowLeft, Send, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import '@/styles/wolfpack-chat.css';

// Type definitions
interface WolfpackMember {
  id: string;
  display_name: string;
  avatar_url: string;
  is_online: boolean;
}

interface ChatMessage {
  id: string;
  user_id: string;
  display_name: string;
  content: string;
  created_at: string;
  message_type: string;
}

interface MessageBubble {
  userId: string;
  message: string;
  timestamp: number;
  id: string;
}

interface SpatialMember {
  id: string;
  display_name: string;
  avatar_url: string;
  role: 'user' | 'dj' | 'bartender' | 'current';
  is_online: boolean;
  position: { x: string; y: string };
  recentMessage?: MessageBubble;
}

// Fixed spatial positions
const SPATIAL_POSITIONS = [
  { x: '50%', y: '25%' },
  { x: '25%', y: '40%' },
  { x: '75%', y: '40%' },
  { x: '35%', y: '60%' },
  { x: '65%', y: '60%' },
  { x: '15%', y: '30%' },
  { x: '85%', y: '30%' },
  { x: '20%', y: '65%' },
  { x: '80%', y: '65%' },
  { x: '50%', y: '70%' }
];

export default function EnhancedWolfpackChatPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useUser();
  const { isMember: isInPack, isLoading: packLoading, locationName } = useConsistentWolfpackAccess();
  
  // Handle user type properly
  const userWithIndex = user ? Object.assign({}, user) : null;
  
  // Get session info
  const wolfpackSession = useWolfpackSession(userWithIndex, locationName);
  const { sessionId, locationId, isActive } = wolfpackSession || {
    sessionId: null,
    locationId: null,
    isActive: false
  };
  
  // Use wolfpack hook - only connect when we have valid session
  const { state, actions } = useWolfpack(
    sessionId || 'general', 
    locationId || '', 
    {
      enableDebugLogging: false, // Disable debug logs for performance
      autoConnect: Boolean(isActive && user && sessionId && !authLoading && !packLoading)
    }
  );
  
  // Typing indicators
  const { typingUsers, sendTyping } = useTypingIndicators(sessionId || '');
  
  // State
  const [spatialMembers, setSpatialMembers] = useState<SpatialMember[]>([]);
  const [chatMessage, setChatMessage] = useState('');
  const [messageBubbles, setMessageBubbles] = useState<Map<string, MessageBubble>>(new Map());
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '' });
  
  // Refs
  const typingTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const bubbleTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Convert members to spatial format - optimized
  useEffect(() => {
    if (state.members && Array.isArray(state.members)) {
      const spatial: SpatialMember[] = state.members.map((member: WolfpackMember, index: number) => {
        const position = SPATIAL_POSITIONS[index % SPATIAL_POSITIONS.length];
        
        return {
          id: member.id || `member_${index}`,
          display_name: member.display_name || 'Wolf Member',
          avatar_url: member.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.id}`,
          role: member.id === user?.id ? 'current' : 'user',
          is_online: member.is_online || false,
          position,
          recentMessage: messageBubbles.get(member.id)
        };
      });
      setSpatialMembers(spatial);
    }
  }, [state.members, user?.id]); // Removed messageBubbles dependency for performance

  // Listen for new messages and create bubbles
  useEffect(() => {
    if (state.messages && Array.isArray(state.messages)) {
      // Get the most recent messages (last 10)
      const recentMessages = state.messages.slice(-10);
      
      recentMessages.forEach((msg: ChatMessage) => {
        // Update bubbles using functional update to avoid stale closures
        setMessageBubbles(prev => {
          // Check if we already have this message bubble
          const existingBubble = prev.get(msg.user_id);
          if (!existingBubble || existingBubble.id !== msg.id) {
            
            // Create new bubble
            const newBubble: MessageBubble = {
              userId: msg.user_id,
              message: msg.content,
              timestamp: Date.now(),
              id: msg.id
            };
            
            const newMap = new Map(prev);
            newMap.set(msg.user_id, newBubble);
            
            // Clear existing timeout for this user
            const existingTimeout = bubbleTimeoutsRef.current.get(msg.user_id);
            if (existingTimeout) {
              clearTimeout(existingTimeout);
            }
            
            // Set timeout to remove bubble after 5 seconds
            const timeout = setTimeout(() => {
              setMessageBubbles(currentBubbles => {
                const updatedMap = new Map(currentBubbles);
                // Only delete if it's still the same message
                if (updatedMap.get(msg.user_id)?.id === newBubble.id) {
                  updatedMap.delete(msg.user_id);
                }
                return updatedMap;
              });
              bubbleTimeoutsRef.current.delete(msg.user_id);
            }, 5000);
            
            bubbleTimeoutsRef.current.set(msg.user_id, timeout);
            
            return newMap;
          }
          return prev;
        });
      });
    }
  }, [state.messages]);

  // Send message
  const sendMessage = async () => {
    if (!chatMessage.trim() || !user || isSendingMessage) return;

    setIsSendingMessage(true);

    // Clear typing
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    const userName = user?.display_name || user?.first_name || 'Wolf Member';
    sendTyping(user.id, userName, false);

    try {
      const result = await actions.sendMessage(chatMessage.trim());
      
      if (result.success) {
        setChatMessage('');
        showToast('Message sent!');
        
        // Immediately add our own message bubble
        const myBubble: MessageBubble = {
          userId: user.id,
          message: chatMessage.trim(),
          timestamp: Date.now(),
          id: `temp-${Date.now()}`
        };
        
        setMessageBubbles(prev => {
          const newMap = new Map(prev);
          newMap.set(user.id, myBubble);
          return newMap;
        });
        
        // Remove after 5 seconds
        setTimeout(() => {
          setMessageBubbles(prev => {
            const newMap = new Map(prev);
            if (newMap.get(user.id)?.id === myBubble.id) {
              newMap.delete(user.id);
            }
            return newMap;
          });
        }, 5000);
      } else {
        showToast('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      showToast('Failed to send message');
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Handle typing
  const handleTyping = () => {
    if (!user || !sessionId) return;

    const userName = user?.display_name || user?.first_name || 'Wolf Member';
    sendTyping(user.id, userName, true);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      sendTyping(user.id, userName, false);
    }, 1000);
  };

  // Simple toast
  const showToast = (message: string) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: '' }), 2000);
  };

  // Key press handler
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      sendMessage();
    } else {
      handleTyping();
    }
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      // Clear all bubble timeouts
      bubbleTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      bubbleTimeoutsRef.current.clear();
    };
  }, []);

  // Simplified loading state - only block on essential loading
  if (authLoading || packLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 mx-auto mb-4" />
          <p>Loading Wolf Pack...</p>
        </div>
      </div>
    );
  }

  // Auth required
  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 text-center">
          <Shield className="h-12 w-12 mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-4">Authentication Required</h1>
          <p className="mb-4">Please login to access Wolf Pack chat.</p>
          <button 
            onClick={() => router.push('/login')}
            className="bg-white text-black px-6 py-2 rounded-full font-semibold"
            type="button"
          >
            Login to Continue
          </button>
        </div>
      </div>
    );
  }

  // Pack membership required
  if (!isInPack) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 text-center">
          <div className="text-4xl mb-4">🐺</div>
          <h1 className="text-xl font-bold mb-4">Join the Wolf Pack</h1>
          <p className="mb-4">You need to be at Side Hustle Bar to join the pack</p>
          <button 
            onClick={() => router.push('/wolfpack/welcome')}
            className="bg-white text-black px-6 py-2 rounded-full font-semibold"
            type="button"
          >
            Enable Location & Join Pack
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900" />
      
      {/* Header */}
      <div className="relative z-10 bg-white/10 backdrop-blur-md border-b border-white/20 p-4">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => router.back()} 
            className="text-white text-xl"
            type="button"
            aria-label="Go back"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="text-center">
            <h1 className="text-lg font-bold">Wolfpack Chat</h1>
            <p className="text-sm text-gray-300">{locationName || 'Side Hustle Bar'}</p>
            <div className="flex items-center justify-center gap-1 text-xs">
              <div className={`w-2 h-2 rounded-full ${state.isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span>{spatialMembers.length} online • {state.messages?.length || 0} messages</span>
            </div>
          </div>
          <button 
            className="text-white"
            type="button"
            aria-label="Settings"
          >
            <Settings className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Spatial View */}
      <div className="relative z-10 h-[calc(100vh-18rem)] p-6 pb-32">
        {spatialMembers.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <div className="text-4xl mb-4">🐺</div>
              <p>No pack members online</p>
            </div>
          </div>
        )}

        {spatialMembers.map((member, index) => (
          <div
            key={member.id}
            className="member-position"
            data-index={index}
          >
            {/* Message Bubble */}
            {messageBubbles.get(member.id) && (
              <div className={`message-bubble ${member.role === 'current' ? 'own-message' : ''}`}>
                {messageBubbles.get(member.id)?.message}
              </div>
            )}
            
            {/* Avatar */}
            <div className={`relative w-16 h-16 rounded-full border-2 overflow-hidden ${
              member.role === 'current' ? 'border-blue-400' : 'border-white'
            }`}>
              <Image 
                src={member.avatar_url} 
                alt={member.display_name}
                width={64}
                height={64}
                className="w-full h-full object-cover"
                unoptimized={member.avatar_url.includes('dicebear.com')}
              />
              
              <div className={`absolute -bottom-1 -right-1 w-3 h-3 border border-white rounded-full ${
                member.is_online ? 'bg-green-500' : 'bg-gray-400'
              }`} />
              
              {member.role === 'current' && (
                <div className="absolute inset-0 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold">YOU</span>
                </div>
              )}
            </div>
            
            <div className="absolute top-full left-1/2 mt-1 px-2 py-1 bg-black/80 rounded text-xs whitespace-nowrap transform -translate-x-1/2">
              {member.display_name}
            </div>
          </div>
        ))}
      </div>

      {/* Connection Status */}
      {!state.isConnected && (
        <div className="fixed top-16 left-4 right-4 z-40 bg-yellow-500/90 text-black px-4 py-2 rounded-lg text-sm text-center">
          Connection lost. Attempting to reconnect...
        </div>
      )}

      {/* Chat Input */}
      <div className="fixed bottom-16 left-0 right-0 z-10 p-4 bg-white/10 backdrop-blur-md border-t border-white/20">
        <div className="flex gap-2">
          <input 
            type="text" 
            className="flex-1 bg-white/20 border border-white/30 rounded-full px-4 py-2 text-white placeholder-gray-300"
            placeholder={typingUsers.length > 0 ? `${typingUsers.join(', ')} typing...` : "Type a message..."}
            value={chatMessage}
            onChange={(e) => setChatMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={isSendingMessage}
          />
          <button 
            onClick={sendMessage}
            disabled={!chatMessage.trim() || isSendingMessage}
            className="bg-blue-600 text-white px-6 py-2 rounded-full disabled:opacity-50"
            type="button"
          >
            {isSendingMessage ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast.show && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-green-500 text-white px-4 py-2 rounded-full">
          {toast.message}
        </div>
      )}

      {/* Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-20 left-4 text-xs text-gray-400 bg-black/80 p-2 rounded">
          <p>Session: {sessionId}</p>
          <p>Messages: {state.messages?.length || 0}</p>
          <p>Bubbles: {messageBubbles.size}</p>
          <p>Connected: {state.isConnected ? 'Yes' : 'No'}</p>
        </div>
      )}
    </div>
  );
}