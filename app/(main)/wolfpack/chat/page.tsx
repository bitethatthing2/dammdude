'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
  display_name?: string;
  avatar_url?: string;
  is_online?: boolean;
}

interface ChatMessage {
  id: string;
  user_id: string;
  display_name: string;
  avatar_url?: string;
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
  const [sessionMessages, setSessionMessages] = useState<ChatMessage[]>([]);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '' });
  const [draggedMember, setDraggedMember] = useState<string | null>(null);
  const [memberPositions, setMemberPositions] = useState<Map<string, { x: string; y: string }>>(new Map());
  const [profilePopup, setProfilePopup] = useState<{ show: boolean; user: any; position: { x: number; y: number } }>({ 
    show: false, 
    user: null, 
    position: { x: 0, y: 0 } 
  });
  const [privateMessageTarget, setPrivateMessageTarget] = useState<{ id: string; name: string; avatar: string } | null>(null);
  const [isPrivateMode, setIsPrivateMode] = useState(false);
  const [viewingProfile, setViewingProfile] = useState<{ show: boolean; member: SpatialMember | null }>({ show: false, member: null });
  
  // Refs
  const typingTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const bubbleTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Convert members to spatial format - optimized with memoization
  const spatialMembersData = useMemo(() => {
    if (!state.members || !Array.isArray(state.members) || !user?.id) {
      return [];
    }
    
    return state.members.map((member: WolfpackMember, index: number) => {
      const customPosition = memberPositions.get(member.id || `member_${index}`);
      const defaultPosition = SPATIAL_POSITIONS[index % SPATIAL_POSITIONS.length];
      const position = customPosition || defaultPosition;
      
      return {
        id: member.id || `member_${index}`,
        display_name: member.display_name || 'Wolf Member',
        avatar_url: member.avatar_url || `/icons/wolf-icon.png`, // Use local icon instead of external API
        role: member.id === user.id ? 'current' : 'user',
        is_online: member.is_online || false,
        position
      };
    });
  }, [state.members, user?.id, memberPositions]);
  
  // Update spatial members only when base data changes
  useEffect(() => {
    setSpatialMembers(spatialMembersData);
  }, [spatialMembersData]);

  // Memoize processed messages to avoid unnecessary re-calculations
  const processedMessages = useMemo(() => {
    if (!state.messages || !Array.isArray(state.messages)) {
      return { sessionMessages: [], recentMessages: [] };
    }
    
    console.log('💬 [DEBUG] Processing messages:', state.messages.slice(-10));
    return {
      sessionMessages: state.messages.slice(-50), // Keep last 50 messages for session area
      recentMessages: state.messages.slice(-15)   // Last 15 for bubbles
    };
  }, [state.messages]);
  
  // Update session messages when processed data changes
  useEffect(() => {
    setSessionMessages(processedMessages.sessionMessages);
  }, [processedMessages.sessionMessages]);
  
  // Clear stale message bubbles when component mounts
  useEffect(() => {
    console.log('🧹 [DEBUG] CHAT PAGE v2.3 - Clearing any stale message bubbles...');
    setMessageBubbles(new Map());
  }, []);
  
  // Handle message bubbles with debouncing
  useEffect(() => {
    const updateBubbles = () => {
      processedMessages.recentMessages.forEach((msg: ChatMessage) => {
        console.log('🎈 [DEBUG] Creating bubble for message:', {
          id: msg.id,
          user_id: msg.user_id,
          content: msg.content,
          display_name: msg.display_name
        });
        
        setMessageBubbles(prev => {
          const existingBubble = prev.get(msg.user_id);
          
          // Don't overwrite recent optimistic bubbles (within 2 seconds)
          if (existingBubble && existingBubble.id.startsWith('temp-')) {
            const bubbleAge = Date.now() - existingBubble.timestamp;
            if (bubbleAge < 2000) {
              console.log('🎈 [DEBUG] Protecting optimistic bubble from overwrite:', existingBubble);
              return prev;
            }
          }
          
          if (!existingBubble || existingBubble.id !== msg.id) {
            const newBubble: MessageBubble = {
              userId: msg.user_id,
              message: msg.content,
              timestamp: Date.now(),
              id: msg.id
            };
            
            console.log('🎈 [DEBUG] New bubble created:', newBubble);
            
            const newMap = new Map(prev);
            newMap.set(msg.user_id, newBubble);
            
            // Show profile popup for the user who sent the message
            const member = spatialMembers.find(m => m.id === msg.user_id);
            if (member && msg.user_id !== user?.id) {
              const memberElement = document.querySelector(`[data-member-id="${msg.user_id}"]`);
              if (memberElement) {
                const rect = memberElement.getBoundingClientRect();
                setProfilePopup({
                  show: true,
                  user: {
                    id: msg.user_id,
                    display_name: msg.display_name,
                    avatar_url: member.avatar_url,
                    message: msg.content
                  },
                  position: {
                    x: rect.left + rect.width / 2,
                    y: rect.top - 10
                  }
                });
                
                // Hide popup after 4 seconds
                setTimeout(() => {
                  setProfilePopup(prev => prev.user?.id === msg.user_id ? { show: false, user: null, position: { x: 0, y: 0 } } : prev);
                }, 4000);
              }
            }
            
            // Clear existing timeout
            const existingTimeout = bubbleTimeoutsRef.current.get(msg.user_id);
            if (existingTimeout) {
              clearTimeout(existingTimeout);
            }
            
            // Set timeout to remove bubble after 3 seconds (reduced from 5)
            const timeout = setTimeout(() => {
              setMessageBubbles(currentBubbles => {
                const updatedMap = new Map(currentBubbles);
                if (updatedMap.get(msg.user_id)?.id === newBubble.id) {
                  updatedMap.delete(msg.user_id);
                }
                return updatedMap;
              });
              bubbleTimeoutsRef.current.delete(msg.user_id);
            }, 3000);
            
            bubbleTimeoutsRef.current.set(msg.user_id, timeout);
            return newMap;
          }
          return prev;
        });
      });
    };
    
    // Debounce bubble updates
    const timeoutId = setTimeout(updateBubbles, 100);
    return () => clearTimeout(timeoutId);
  }, [processedMessages.recentMessages, spatialMembers, user?.id]);

  // Send message
  const sendMessage = async () => {
    if (!chatMessage.trim() || !user || isSendingMessage) return;

    console.log('🚀 [DEBUG] Sending message:', chatMessage.trim(), isPrivateMode ? 'PRIVATE' : 'PUBLIC');
    setIsSendingMessage(true);

    // Clear typing
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    const userName = user?.first_name || user?.email?.split('@')[0] || 'Wolf Member';
    sendTyping(user.id, userName, false);

    try {
      // For private messages, we'll prefix the message with @username
      const messageToSend = isPrivateMode && privateMessageTarget 
        ? `@${privateMessageTarget.name} [PRIVATE]: ${chatMessage.trim()}`
        : chatMessage.trim();
        
      const result = await actions.sendMessage(messageToSend);
      console.log('📤 [DEBUG] Send result:', result);
      
      if (result.success) {
        setChatMessage('');
        showToast(isPrivateMode ? 'Private message sent!' : 'Message sent!');
        
        // Immediately add our own message bubble
        const myBubble: MessageBubble = {
          userId: user.id,
          message: isPrivateMode ? `Private to ${privateMessageTarget?.name}: ${chatMessage.trim()}` : chatMessage.trim(),
          timestamp: Date.now(),
          id: `temp-${Date.now()}`
        };
        
        console.log('✨ [DEBUG] Creating optimistic bubble:', myBubble);
        
        setMessageBubbles(prev => {
          const newMap = new Map(prev);
          newMap.set(user.id, myBubble);
          console.log('✨ [DEBUG] Optimistic bubble set, map size:', newMap.size);
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
        
        // Clear private mode after sending
        if (isPrivateMode) {
          cancelPrivateMessage();
        }
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

    const userName = user?.first_name || user?.email?.split('@')[0] || 'Wolf Member';
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

  // Drag handlers for moving pack members
  const handleDragStart = (e: React.DragEvent, memberId: string) => {
    setDraggedMember(memberId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleAvatarClick = (member: SpatialMember) => {
    if (member.id === user?.id) return; // Can't message yourself
    
    setPrivateMessageTarget({
      id: member.id,
      name: member.display_name,
      avatar: member.avatar_url
    });
    setIsPrivateMode(true);
  };

  const cancelPrivateMessage = () => {
    setPrivateMessageTarget(null);
    setIsPrivateMode(false);
  };

  const handleAvatarRightClick = (e: React.MouseEvent, member: SpatialMember) => {
    e.preventDefault(); // Prevent context menu
    setViewingProfile({ show: true, member });
  };

  const closeProfile = () => {
    setViewingProfile({ show: false, member: null });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedMember) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setMemberPositions(prev => {
      const newPositions = new Map(prev);
      newPositions.set(draggedMember, { 
        x: `${Math.max(5, Math.min(95, x))}%`, 
        y: `${Math.max(5, Math.min(95, y))}%` 
      });
      return newPositions;
    });

    setDraggedMember(null);
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
      <div className="absolute inset-0">
        <Image
          src="/icons/wolfpack-chat.gif"
          alt="Side Hustle Bar Interior"
          fill
          className="object-cover opacity-40"
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/40 to-black/60" />
      </div>

      {/* Spatial View */}
      <div 
        className="relative z-10 h-[calc(100vh-6rem)] p-6 pb-48"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {spatialMembers.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <div className="text-4xl mb-4">🐺</div>
              <p>No pack members online</p>
            </div>
          </div>
        )}

        {spatialMembers.map((member, index) => {
          const memberBubble = messageBubbles.get(member.id);
          return (
            <div
              key={member.id}
              className="member-position"
              data-index={index}
              data-member-id={member.id}
              style={{ 
                left: member.position.x, 
                top: member.position.y,
                cursor: 'grab'
              }}
              draggable
              onDragStart={(e) => handleDragStart(e, member.id)}
            >
              {/* Avatar Container - this is what the bubble positions relative to */}
              <div 
                className={`relative w-16 h-16 rounded-full border-2 overflow-hidden ${
                  member.role === 'current' ? 'border-blue-400' : 'border-white'
                } ${member.role !== 'current' ? 'cursor-pointer hover:border-yellow-400' : ''}`}
                onClick={() => member.role !== 'current' && handleAvatarClick(member)}
                onContextMenu={(e) => handleAvatarRightClick(e, member)}
                title={member.role !== 'current' ? 'Left-click: Private message | Right-click: View profile' : 'Your profile'}
              >
                {/* Message Bubble - positioned relative to this container */}
                {memberBubble && (
                  <div className={`message-bubble ${member.role === 'current' ? 'own-message' : ''}`}>
                    {memberBubble.message}
                  </div>
                )}
                
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
              
              {/* Name label below avatar */}
              <div className="absolute top-full left-1/2 mt-1 px-2 py-1 bg-black/80 rounded text-xs whitespace-nowrap transform -translate-x-1/2">
                {member.display_name}
              </div>
            </div>
          );
        })}

        {/* Red Box Message Area - positioned in top-right area */}
        <div className="absolute top-4 right-4 max-w-xs">
          {Array.from(messageBubbles.values())
            .filter(bubble => bubble.userId !== user?.id) // Only show others' messages here
            .slice(-3) // Show last 3 messages
            .map((bubble, index) => {
              const member = spatialMembers.find(m => m.id === bubble.userId);
              return (
                <div 
                  key={bubble.id}
                  className="mb-2 bg-red-600/20 border border-red-500/50 rounded-lg p-3 backdrop-blur-sm"
                  style={{ 
                    animation: `fadeInUp 0.3s ease-out ${index * 0.1}s both` 
                  }}
                >
                  <div className="text-xs text-red-300 mb-1">
                    {member?.display_name || 'Wolf Member'}
                  </div>
                  <div className="text-sm text-white">
                    {bubble.message}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {new Date(bubble.timestamp).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Session Area - bottom-left showing chat history */}
      <div className="fixed left-4 top-16 w-80 h-96 bg-black/60 backdrop-blur-md border border-white/20 rounded-lg overflow-hidden z-30">
        <div className="p-3 border-b border-white/20">
          <div className="flex items-center gap-2 text-sm">
            <div className={`w-2 h-2 rounded-full ${state.isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span>Session: {sessionId}</span>
            <span className="text-gray-400">• {sessionMessages.length} messages</span>
          </div>
        </div>
        <div 
          className="h-80 overflow-y-scroll overflow-x-hidden p-2 space-y-2 relative" 
          style={{ 
            scrollbarWidth: 'thin',
            scrollbarColor: '#4B5563 #1F2937',
            maxHeight: '320px',
            minHeight: '320px',
            pointerEvents: 'auto',
            position: 'relative',
            zIndex: 1
          }}
        >
          {sessionMessages.map((msg) => {
            // Use avatar from message first, then try to find from members, then fallback
            const member = spatialMembers.find(m => m.id === msg.user_id);
            const avatarUrl = msg.avatar_url || member?.avatar_url || '/icons/wolf-icon.png';
            
            const isPrivate = msg.content.includes('[PRIVATE]:');
            
            return (
              <div key={msg.id} className={`flex gap-3 py-2 px-3 rounded-lg transition-colors ${
                isPrivate ? 'bg-purple-900/20 border border-purple-500/20 hover:bg-purple-900/30' : 'bg-white/5 hover:bg-white/10'
              }`}>
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <Image 
                    src={avatarUrl}
                    alt={msg.display_name}
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded-full object-cover"
                    unoptimized={avatarUrl.includes('dicebear.com')}
                  />
                </div>
                
                {/* Message content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`font-semibold text-xs truncate ${isPrivate ? 'text-purple-400' : 'text-blue-400'}`}>
                      {msg.display_name}
                    </span>
                    {isPrivate && (
                      <span className="text-purple-300 text-xs bg-purple-500/20 px-1.5 py-0.5 rounded">Private</span>
                    )}
                    <span className="text-gray-500 text-xs flex-shrink-0">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="text-white text-sm leading-relaxed break-words">{msg.content}</div>
                </div>
              </div>
            );
          })}
          {sessionMessages.length === 0 && (
            <div className="text-xs text-gray-400 text-center py-2">
              No messages yet
            </div>
          )}
        </div>
      </div>

      {/* Connection Status */}
      {!state.isConnected && (
        <div className="fixed top-16 left-4 right-4 z-40 bg-yellow-500/90 text-black px-4 py-2 rounded-lg text-sm text-center">
          Connection lost. Attempting to reconnect...
        </div>
      )}

      {/* Chat Input */}
      <div className="fixed left-0 right-0 z-10 p-4 bg-white/10 backdrop-blur-md border-t border-white/20" style={{ bottom: '80px', marginBottom: 'env(safe-area-inset-bottom)' }}>
        {/* Private Message Indicator */}
        {isPrivateMode && privateMessageTarget && (
          <div className="mb-2 flex items-center justify-between bg-purple-600/20 rounded-lg px-3 py-2 border border-purple-500/30">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
              <span className="text-sm text-purple-300">Private message to:</span>
              <Image 
                src={privateMessageTarget.avatar}
                alt={privateMessageTarget.name}
                width={20}
                height={20}
                className="w-5 h-5 rounded-full"
                unoptimized={privateMessageTarget.avatar.includes('dicebear.com')}
              />
              <span className="text-sm font-medium text-white">{privateMessageTarget.name}</span>
            </div>
            <button 
              onClick={cancelPrivateMessage}
              className="text-gray-400 hover:text-white transition-colors"
              type="button"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        
        <div className="flex gap-2">
          <input 
            type="text" 
            className={`flex-1 ${isPrivateMode ? 'bg-purple-900/30' : 'bg-white/20'} border ${isPrivateMode ? 'border-purple-500/50' : 'border-white/30'} rounded-full px-4 py-2 text-white placeholder-gray-300`}
            placeholder={
              isPrivateMode 
                ? `Private message to ${privateMessageTarget?.name}...` 
                : (typingUsers.length > 0 ? `${typingUsers.join(', ')} typing...` : "Type a message...")
            }
            value={chatMessage}
            onChange={(e) => setChatMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={isSendingMessage}
          />
          <button 
            onClick={sendMessage}
            disabled={!chatMessage.trim() || isSendingMessage}
            className={`${isPrivateMode ? 'bg-purple-600' : 'bg-blue-600'} text-white px-6 py-2 rounded-full disabled:opacity-50 transition-colors`}
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

      {/* User Profile Modal */}
      {viewingProfile.show && viewingProfile.member && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeProfile}
          />
          
          {/* Profile Card */}
          <div className="relative bg-gradient-to-br from-gray-900 to-black rounded-3xl border border-white/20 p-6 max-w-md w-full shadow-2xl animate-profile-popup">
            {/* Close button */}
            <button 
              onClick={closeProfile}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
              type="button"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            {/* Profile Header */}
            <div className="text-center mb-6">
              <div className="relative inline-block mb-4">
                <Image 
                  src={viewingProfile.member.avatar_url}
                  alt={viewingProfile.member.display_name}
                  width={120}
                  height={120}
                  className="w-30 h-30 rounded-full object-cover border-4 border-white/20"
                  unoptimized={viewingProfile.member.avatar_url.includes('dicebear.com')}
                />
                <div className={`absolute bottom-2 right-2 w-4 h-4 rounded-full border-2 border-gray-900 ${
                  viewingProfile.member.is_online ? 'bg-green-500' : 'bg-gray-400'
                }`} />
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-1">{viewingProfile.member.display_name}</h2>
              <p className="text-gray-400">
                {viewingProfile.member.is_online ? '🟢 Online' : '⚫ Offline'}
              </p>
            </div>
            
            {/* Profile Info */}
            <div className="space-y-4 mb-6">
              <div className="bg-white/5 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-400 mb-2">Wolf Pack Status</h3>
                <p className="text-white">Active Member</p>
              </div>
              
              <div className="bg-white/5 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-400 mb-2">Favorite Drink</h3>
                <p className="text-white">🍺 Wolf's Brew Special</p>
              </div>
              
              <div className="bg-white/5 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-400 mb-2">Vibe Status</h3>
                <p className="text-white">🎉 Ready to party!</p>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-3">
              {viewingProfile.member.id !== user?.id && (
                <button 
                  onClick={() => {
                    handleAvatarClick(viewingProfile.member!);
                    closeProfile();
                  }}
                  className="flex-1 bg-purple-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                  type="button"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Send Private Message
                </button>
              )}
              <button 
                onClick={closeProfile}
                className="flex-1 bg-white/10 text-white px-4 py-3 rounded-lg font-medium hover:bg-white/20 transition-colors"
                type="button"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Popup */}
      {profilePopup.show && profilePopup.user && (
        <div 
          className="fixed z-50 bg-white/95 backdrop-blur-lg rounded-2xl p-4 shadow-2xl transform -translate-x-1/2 animate-profile-popup"
          style={{ 
            left: profilePopup.position.x,
            top: profilePopup.position.y - 200,
            minWidth: '280px'
          }}
        >
          {/* Arrow pointing down */}
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
            <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[10px] border-t-white/95"></div>
          </div>
          
          {/* Profile content */}
          <div className="flex items-center gap-3 mb-3">
            <Image 
              src={profilePopup.user.avatar_url} 
              alt={profilePopup.user.display_name}
              width={56}
              height={56}
              className="w-14 h-14 rounded-full object-cover"
              unoptimized={profilePopup.user.avatar_url.includes('dicebear.com')}
            />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">{profilePopup.user.display_name}</h3>
              <p className="text-sm text-gray-600">Just sent a message</p>
            </div>
          </div>
          
          {/* Latest message */}
          <div className="bg-gray-100 rounded-lg p-3">
            <p className="text-sm text-gray-800 font-medium">Latest message:</p>
            <p className="text-sm text-gray-600 mt-1">{profilePopup.user.message}</p>
          </div>
          
          {/* Action buttons */}
          <div className="flex gap-2 mt-3">
            <button 
              className="flex-1 bg-blue-500 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
              onClick={() => setProfilePopup({ show: false, user: null, position: { x: 0, y: 0 } })}
            >
              View Profile
            </button>
            <button 
              className="flex-1 bg-gray-200 text-gray-800 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
              onClick={() => setProfilePopup({ show: false, user: null, position: { x: 0, y: 0 } })}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed right-4 text-xs text-gray-400 bg-black/80 p-2 rounded" style={{ bottom: '200px' }}>
          <p>Session: {sessionId}</p>
          <p>Messages: {state.messages?.length || 0}</p>
          <p>Bubbles: {messageBubbles.size}</p>
          <p>Connected: {state.isConnected ? 'Yes' : 'No'}</p>
        </div>
      )}
    </div>
  );
}