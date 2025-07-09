'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useUser } from '@/hooks/useUser';
import { useConsistentWolfpackAccess } from '@/lib/hooks/useConsistentWolfpackAccess';
import { useWolfpack } from '@/hooks/useWolfpack';
import { useTypingIndicators } from '@/hooks/useTypingIndicators';
import { useWolfpackSession } from '@/lib/hooks/useWolfpackSession';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Shield, ArrowLeft, Send, Loader2, Smile, Image as ImageIcon, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { EmojiPicker } from '@/components/chat/EmojiPicker';
import { getZIndexClass } from '@/lib/constants/z-index';
import { resolveWolfpackMemberAvatar, resolveChatAvatarUrl } from '@/lib/utils/avatar-utils';
import { TIMEOUT_CONSTANTS } from '@/lib/utils/timeout-utils';
import { useImageReplacement } from '@/lib/services/image-replacement.service';
import MobileOptimizedChat from '@/components/wolfpack/MobileOptimizedChat';
import '@/styles/wolfpack-chat.css';

// Type definitions
interface WolfpackMember {
  id: string;
  display_name?: string;
  avatar_url?: string;
  is_online?: boolean;
  favorite_drink?: string;
  vibe_status?: string;
  bio?: string;
  favorite_song?: string;
  wolf_emoji?: string;
}

interface ChatMessage {
  id: string;
  user_id: string;
  display_name: string;
  avatar_url?: string;
  content: string;
  created_at: string;
  message_type: string;
  reactions?: Array<{
    id: string;
    message_id: string;
    user_id: string;
    emoji: string;
    created_at: string;
  }>;
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
  favorite_drink?: string;
  vibe_status?: string;
  bio?: string;
  favorite_song?: string;
  wolf_emoji?: string;
}

interface User {
  id: string;
  email?: string;
  first_name?: string;
  avatar_url?: string;
  [key: string]: unknown;
}

// Fixed spatial positions - optimized for mobile and 100+ members
const SPATIAL_POSITIONS = [
  // Top row
  { x: '15%', y: '60%' }, { x: '30%', y: '65%' }, { x: '45%', y: '60%' }, { x: '60%', y: '65%' }, { x: '75%', y: '60%' }, { x: '85%', y: '65%' },
  // Upper middle row
  { x: '10%', y: '75%' }, { x: '25%', y: '80%' }, { x: '40%', y: '75%' }, { x: '55%', y: '80%' }, { x: '70%', y: '75%' }, { x: '85%', y: '80%' },
  // Lower middle row  
  { x: '15%', y: '85%' }, { x: '30%', y: '90%' }, { x: '45%', y: '85%' }, { x: '60%', y: '90%' }, { x: '75%', y: '85%' }, { x: '90%', y: '90%' },
  // Bottom rows for overflow
  { x: '20%', y: '95%' }, { x: '35%', y: '92%' }, { x: '50%', y: '95%' }, { x: '65%', y: '92%' }, { x: '80%', y: '95%' },
  // Side positions for more members
  { x: '5%', y: '70%' }, { x: '95%', y: '70%' }, { x: '5%', y: '85%' }, { x: '95%', y: '85%' },
  // Additional grid positions
  { x: '12%', y: '68%' }, { x: '22%', y: '72%' }, { x: '32%', y: '68%' }, { x: '42%', y: '72%' },
  { x: '52%', y: '68%' }, { x: '62%', y: '72%' }, { x: '72%', y: '68%' }, { x: '82%', y: '72%' },
  { x: '18%', y: '88%' }, { x: '28%', y: '85%' }, { x: '38%', y: '88%' }, { x: '48%', y: '85%' },
  { x: '58%', y: '88%' }, { x: '68%', y: '85%' }, { x: '78%', y: '88%' }, { x: '88%', y: '85%' }
];

export default function EnhancedWolfpackChatPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useUser();
  const { isMember: isInPack, isLoading: packLoading, locationName } = useConsistentWolfpackAccess();
  
  // Handle user type properly
  const userWithIndex = user ? (user as User) : null;
  
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
      enableDebugLogging: false,
      autoConnect: Boolean(isActive && user && sessionId && !authLoading && !packLoading)
    }
  );
  
  // Typing indicators
  const { typingUsers, sendTyping } = useTypingIndicators(sessionId || '');
  
  // Image replacement system
  const { uploading: isUploadingImage, clearError } = useImageReplacement();
  
  // State
  const [spatialMembers, setSpatialMembers] = useState<SpatialMember[]>([]);
  const [chatMessage, setChatMessage] = useState('');
  const [messageBubbles, setMessageBubbles] = useState<Map<string, MessageBubble>>(new Map());
  const [sessionMessages, setSessionMessages] = useState<ChatMessage[]>([]);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '' });
  const [draggedMember, setDraggedMember] = useState<string | null>(null);
  const [memberPositions, setMemberPositions] = useState<Map<string, { x: string; y: string }>>(new Map());
  const [profilePopup, setProfilePopup] = useState<{ show: boolean; user: { id: string; display_name: string; avatar_url: string; message: string; } | null; position: { x: number; y: number } }>({ 
    show: false, 
    user: null, 
    position: { x: 0, y: 0 } 
  });
  const [privateMessageTarget, setPrivateMessageTarget] = useState<{ id: string; name: string; avatar: string } | null>(null);
  const [isPrivateMode, setIsPrivateMode] = useState(false);
  const [viewingProfile, setViewingProfile] = useState<{ show: boolean; member: SpatialMember | null }>({ show: false, member: null });
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showMediaOptions, setShowMediaOptions] = useState(false);
  const [isSessionPanelCollapsed, setIsSessionPanelCollapsed] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  
  // Refs
  const typingTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const bubbleTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const profilePopupTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const toastTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

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
        avatar_url: resolveWolfpackMemberAvatar(member),
        role: member.id === user.id ? 'current' : 'user',
        is_online: member.is_online || false,
        position,
        favorite_drink: member.favorite_drink,
        vibe_status: member.vibe_status,
        bio: member.bio,
        favorite_song: member.favorite_song,
        wolf_emoji: member.wolf_emoji
      };
    });
  }, [state.members, user?.id, memberPositions]);
  
  // Update spatial members only when base data changes
  useEffect(() => {
    setSpatialMembers(spatialMembersData as SpatialMember[]);
  }, [spatialMembersData]);

  // Memoize processed messages to avoid unnecessary re-calculations
  const processedMessages = useMemo(() => {
    if (!state.messages || !Array.isArray(state.messages)) {
      return { sessionMessages: [], recentMessages: [] };
    }
    
    console.log('💬 [DEBUG] Processing messages:', state.messages.slice(0, 10));
    return {
      sessionMessages: state.messages.slice(0, 50),
      recentMessages: state.messages.slice(0, 15)
    };
  }, [state.messages]);
  
  // Update session messages when processed data changes
  useEffect(() => {
    setSessionMessages(processedMessages.sessionMessages);
  }, [processedMessages.sessionMessages]);

  // Smart auto-scroll behavior
  const [isUserScrollingUp, setIsUserScrollingUp] = useState(false);
  const messageContainerRef = useRef<HTMLDivElement>(null);
  
  // Mobile detection effect
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent;
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      const isMobileViewport = window.innerWidth <= 768;
      setIsMobile(isMobileDevice || isMobileViewport);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Track user scroll behavior (updated for top-down message order)
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.target as HTMLDivElement;
    const { scrollTop } = container;
    
    // User is considered "scrolling down" if they're more than 50px from top
    const isScrolledDown = scrollTop > 50;
    setIsUserScrollingUp(isScrolledDown);
  };

  // Auto-scroll to top when new messages arrive (only if user hasn't scrolled down)
  useEffect(() => {
    if (messageContainerRef.current && !isUserScrollingUp) {
      messageContainerRef.current.scrollTop = 0;
    }
  }, [sessionMessages, isUserScrollingUp]);
  
  // Scroll to top when chat initially loads
  useEffect(() => {
    if (messageContainerRef.current && sessionMessages.length > 0) {
      messageContainerRef.current.scrollTop = 0;
    }
  }, [sessionMessages.length]);
  
  // Clear stale message bubbles when component mounts
  useEffect(() => {
    console.log('🧹 [DEBUG] CHAT PAGE v2.3 - Clearing any stale message bubbles...');
    setMessageBubbles(new Map());
  }, []);

  // Cleanup all timeouts on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      // Clear all timeout refs
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (profilePopupTimeoutRef.current) {
        clearTimeout(profilePopupTimeoutRef.current);
      }
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
      
      // Clear all bubble timeouts - Fix for ESLint warning
      const timeouts = bubbleTimeoutsRef.current;
      timeouts.forEach((timeout) => {
        clearTimeout(timeout);
      });
      timeouts.clear();
      
      console.log('🧹 [CLEANUP] All timeouts cleared on unmount');
    };
  }, []);
  
  // Track processed message IDs to prevent infinite loops
  const processedMessageIdsRef = useRef<Set<string>>(new Set());

  // Handle message bubbles with debouncing
  useEffect(() => {
    const updateBubbles = () => {
      processedMessages.recentMessages.forEach((msg: ChatMessage) => {
        // Skip if this message has already been processed
        if (processedMessageIdsRef.current.has(msg.id)) {
          return;
        }
        
        // Mark this message as processed
        processedMessageIdsRef.current.add(msg.id);
        
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
                
                // Hide popup after configured timeout
                if (profilePopupTimeoutRef.current) {
                  clearTimeout(profilePopupTimeoutRef.current);
                }
                profilePopupTimeoutRef.current = setTimeout(() => {
                  setProfilePopup(prev => prev.user?.id === msg.user_id ? { show: false, user: null, position: { x: 0, y: 0 } } : prev);
                }, TIMEOUT_CONSTANTS.PROFILE_POPUP_TIMEOUT);
              }
            }
            
            // Clear existing timeout
            const existingTimeout = bubbleTimeoutsRef.current.get(msg.user_id);
            if (existingTimeout) {
              clearTimeout(existingTimeout);
            }
            
            // Set timeout to remove bubble after configured time
            const timeout = setTimeout(() => {
              setMessageBubbles(currentBubbles => {
                const updatedMap = new Map(currentBubbles);
                if (updatedMap.get(msg.user_id)?.id === newBubble.id) {
                  updatedMap.delete(msg.user_id);
                }
                return updatedMap;
              });
              bubbleTimeoutsRef.current.delete(msg.user_id);
            }, TIMEOUT_CONSTANTS.MESSAGE_BUBBLE_TIMEOUT);
            
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

  // Cleanup old processed message IDs to prevent memory leaks
  useEffect(() => {
    const currentMessageIds = new Set(processedMessages.recentMessages.map(msg => msg.id));
    const processedIds = processedMessageIdsRef.current;
    
    // Remove IDs that are no longer in recent messages
    for (const id of processedIds) {
      if (!currentMessageIds.has(id)) {
        processedIds.delete(id);
      }
    }
  }, [processedMessages.recentMessages]);

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
        
        // Remove after configured timeout
        const existingTimeout = bubbleTimeoutsRef.current.get(user.id);
        if (existingTimeout) {
          clearTimeout(existingTimeout);
        }
        const timeout = setTimeout(() => {
          setMessageBubbles(prev => {
            const newMap = new Map(prev);
            if (newMap.get(user.id)?.id === myBubble.id) {
              newMap.delete(user.id);
            }
            return newMap;
          });
          bubbleTimeoutsRef.current.delete(user.id);
        }, TIMEOUT_CONSTANTS.OPTIMISTIC_BUBBLE_TIMEOUT);
        bubbleTimeoutsRef.current.set(user.id, timeout);
        
        // Clear private mode after sending
        if (isPrivateMode) {
          cancelPrivateMessage();
        }
      } else {
        console.error('Message send failed:', result.error);
        showToast(result.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Enhanced error handling with user-friendly messages
      let errorMessage = 'Failed to send message';
      if (error instanceof Error) {
        if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = 'Connection error. Please check your internet and try again.';
        } else if (error.message.includes('permission') || error.message.includes('unauthorized')) {
          errorMessage = 'You do not have permission to send messages. Please refresh and try again.';
        } else if (error.message.includes('rate limit')) {
          errorMessage = 'Too many messages sent. Please wait a moment before sending again.';
        }
      }
      
      showToast(errorMessage);
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Handle typing
  const handleTyping = () => {
    if (!user || !sessionId) return;

    const userName = user?.first_name || user?.email?.split('@')[0] || 'Wolf Member';
    
    // Set typing state
    setIsTyping(true);
    sendTyping(user.id, userName, true);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      sendTyping(user.id, userName, false);
    }, TIMEOUT_CONSTANTS.TYPING_INDICATOR_TIMEOUT);
  };

  // Simple toast
  const showToast = (message: string) => {
    setToast({ show: true, message });
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = setTimeout(() => setToast({ show: false, message: '' }), TIMEOUT_CONSTANTS.TOAST_TIMEOUT);
  };

  // Handle image upload - Enhanced with better validation and error handling
  const handleImageUpload = async (file: File) => {
    if (!user || !sessionId) {
      showToast('Please log in to upload images');
      return;
    }

    // Clear any previous upload errors
    clearError();

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      showToast('Please upload a JPEG, PNG, GIF, or WebP image');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      showToast('Image too large. Maximum size is 5MB');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('imageType', 'chat');

      const response = await fetch('/api/upload/images', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      // Send the image URL as a message using the correct RPC function
      if (result.image_url) {
        const imageMessage = `📷 ${result.image_url}`;
        const { error } = await supabase.rpc('send_wolfpack_chat_message', {
          p_content: imageMessage,
          p_image_url: result.image_url,
          p_session_id: sessionId
        });

        if (error) {
          console.error('Error sending image message:', error);
          showToast('Image uploaded but failed to send message');
        } else {
          showToast('Image uploaded and shared!');
          // Close media options after successful upload
          setShowMediaOptions(false);
        }
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      showToast(error instanceof Error ? error.message : 'Failed to upload image');
    }
  };

  // Trigger file upload
  const triggerImageUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        handleImageUpload(file);
      }
    };
    input.click();
  };

  // Render message content with image support
  const renderMessageContent = (content: string) => {
    // Check if the message contains an image URL
    if (content.startsWith('📷 ') && content.includes('http')) {
      const imageUrl = content.replace('📷 ', '');
      return (
        <div className="mt-2">
          <Image 
            src={imageUrl} 
            alt="Shared image" 
            className="chat-image"
            width={300}
            height={200}
            onClick={() => window.open(imageUrl, '_blank')}
            onError={(e) => {
              // Fallback to text if image fails to load
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const fallback = document.createElement('div');
              fallback.className = 'text-white text-sm bg-red-500/20 border border-red-500/50 rounded p-2';
              fallback.textContent = `🖼️ Image: ${imageUrl}`;
              target.parentNode?.appendChild(fallback);
            }}
            unoptimized
          />
        </div>
      );
    }
    
    // Regular text message
    return <span>{content}</span>;
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
    // Auto-collapse session panel in private mode to avoid overlap
    setIsSessionPanelCollapsed(true);
  };

  const cancelPrivateMessage = () => {
    setPrivateMessageTarget(null);
    setIsPrivateMode(false);
    // Restore session panel when exiting private mode
    setIsSessionPanelCollapsed(false);
  };

  const handleAvatarRightClick = (e: React.MouseEvent, member: SpatialMember) => {
    e.preventDefault(); // Prevent context menu
    setViewingProfile({ show: true, member });
    document.body.classList.add('profile-modal-open');
  };

  const closeProfile = () => {
    setViewingProfile({ show: false, member: null });
    document.body.classList.remove('profile-modal-open');
  };

  const handleEmojiSelect = (emoji: string) => {
    setChatMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const toggleEmojiPicker = () => {
    setShowEmojiPicker(!showEmojiPicker);
    setShowMediaOptions(false);
  };

  const toggleMediaOptions = () => {
    setShowMediaOptions(!showMediaOptions);
    setShowEmojiPicker(false);
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
      if (profilePopupTimeoutRef.current) {
        clearTimeout(profilePopupTimeoutRef.current);
      }
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
      // Clear all bubble timeouts - Store ref to avoid ESLint warning
      const currentBubbleTimeouts = bubbleTimeoutsRef.current;
      currentBubbleTimeouts.forEach(timeout => clearTimeout(timeout));
      currentBubbleTimeouts.clear();
      // Remove modal class if component unmounts
      document.body.classList.remove('profile-modal-open');
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

  // Mobile-optimized render
  if (isMobile) {
    return (
      <MobileOptimizedChat
        messages={sessionMessages}
        members={spatialMembers}
        spatialViewContent={
          <div className="h-full relative">
            {/* Background */}
            <div className="absolute inset-0">
              <Image
                src="/icons/wolfpack-chat.gif"
                alt="Side Hustle Bar Interior"
                fill
                className="object-cover object-center opacity-30"
                unoptimized
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/50 to-black/70" />
            </div>
            
            {/* Spatial Members */}
            <div className="relative z-10 h-full p-4">
              {spatialMembers.map((member) => {
                const memberBubble = messageBubbles.get(member.id);
                
                return (
                  <div
                    key={member.id}
                    className="member-position"
                    data-member-id={member.id}
                    style={{ 
                      left: member.position.x,
                      top: member.position.y,
                      transform: 'translate(-50%, -50%)',
                      position: 'absolute',
                      zIndex: 45
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setViewingProfile({ show: true, member });
                    }}
                  >
                    <div className="relative">
                      <Image
                        src={member.avatar_url}
                        alt={member.display_name}
                        width={48}
                        height={48}
                        className="w-12 h-12 rounded-full object-cover border-2 border-white/20 hover:border-white/40 transition-all duration-300"
                        unoptimized={member.avatar_url.includes('dicebear.com')}
                      />
                      <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-gray-900 ${
                        member.is_online ? 'bg-green-500' : 'bg-gray-500'
                      }`} />
                    </div>
                    
                    {memberBubble && (
                      <div className="message-bubble">
                        {memberBubble.message}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        }
        currentUser={user}
        onSendMessage={async (message) => {
          if (!message.trim() || !user || isSendingMessage) return;
          setIsSendingMessage(true);
          
          // Clear typing state when sending message
          setIsTyping(false);
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
          }
          const userName = user?.first_name || user?.email?.split('@')[0] || 'Wolf Member';
          sendTyping(user.id, userName, false);
          
          try {
            const result = await actions.sendMessage(message.trim());
            if (result.success) {
              showToast('Message sent!');
            } else {
              showToast(result.error || 'Failed to send message');
            }
          } catch (error) {
            console.error('Error sending message:', error);
            showToast('Failed to send message');
          } finally {
            setIsSendingMessage(false);
          }
        }}
        onMemberSelect={(memberId) => {
          const member = spatialMembers.find(m => m.id === memberId);
          if (member) {
            setViewingProfile({ show: true, member });
          }
        }}
        onReactionAdd={async (messageId, emoji) => {
          const result = await actions.addReaction(messageId, emoji);
          if (result.success) {
            showToast(`${emoji} Reaction added!`);
          } else {
            showToast(result.error || 'Failed to add reaction');
          }
        }}
        onReactionRemove={async (reactionId) => {
          const result = await actions.removeReaction(reactionId);
          if (result.success) {
            showToast('Reaction removed!');
          } else {
            showToast(result.error || 'Failed to remove reaction');
          }
        }}
        isConnected={state.isConnected}
        isTyping={isTyping}
        typingUsers={typingUsers}
        onShowMessages={() => {
          // For now, just redirect to messages view directly
          router.push('/wolfpack/chat/messages');
        }}
        onStartPrivateChat={(userId, userName) => {
          // Navigate directly to private chat with the user
          router.push(`/wolfpack/chat/private/${userId}`);
        }}
        onBack={() => {
          router.push('/wolfpack');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Exit Button */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log('Exit button clicked');
          router.push('/wolfpack');
        }}
        className="fixed top-4 left-4 z-[9999] bg-red-600/90 hover:bg-red-700 text-white p-3 rounded-full transition-colors touch-manipulation cursor-pointer"
        aria-label="Exit Chat"
        title="Exit Chat"
      >
        <ArrowLeft className="w-6 h-6" />
      </button>

      {/* Background */}
      <div className="absolute inset-0">
        <Image
          src="/icons/wolfpack-chat.gif"
          alt="Side Hustle Bar Interior"
          fill
          className="object-cover object-center sm:object-cover opacity-30 sm:opacity-40"
          unoptimized
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/50 to-black/70 sm:from-black/60 sm:via-black/40 sm:to-black/60" />
      </div>

      {/* Spatial View */}
      <div 
        className={`relative z-10 h-[calc(100vh-80px)] sm:h-[calc(100vh-80px)] p-2 sm:p-4 md:p-6 pb-24 sm:pb-20 overflow-hidden`}
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

        {/* Member Counter for Mobile */}
        {spatialMembers.length > 0 && (
          <div className={`absolute top-2 right-2 sm:hidden bg-black/80 rounded-lg px-3 py-1 text-xs text-white ${getZIndexClass('MODAL_BACKDROP')}`}>
            {spatialMembers.length} wolves online
          </div>
        )}

        {spatialMembers.map((member) => {
          const memberBubble = messageBubbles.get(member.id);
          
          return (
            <div
              key={member.id}
              className="member-position"
              data-member-id={member.id}
              style={{ 
                left: member.position.x, 
                top: member.position.y
              }}
              draggable
              onDragStart={(e) => handleDragStart(e, member.id)}
            >
              {/* Avatar Container - this is what the bubble positions relative to */}
              <div 
                className={`relative w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full border-2 overflow-hidden ${
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
                  className="w-full h-full object-cover rounded-full"
                  unoptimized={member.avatar_url.includes('dicebear.com')}
                />
                
                <div className={`absolute -bottom-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 border border-white rounded-full ${
                  member.is_online ? 'bg-green-500' : 'bg-gray-400'
                }`} />
                
                {member.role === 'current' && (
                  <div className="absolute inset-0 bg-blue-500/20 rounded-full flex items-center justify-center">
                    <span className="text-xs sm:text-xs font-bold">YOU</span>
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
                    {renderMessageContent(bubble.message)}
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

      {/* Session Area - showing chat history */}
      <div 
        className={`fixed ${isSessionPanelCollapsed ? 'left-2' : 'left-2 right-2 sm:left-4 sm:right-auto w-auto sm:w-80'} bg-black/80 backdrop-blur-md border border-white/20 rounded-lg overflow-hidden ${getZIndexClass('STICKY_ELEMENT')} transition-all duration-300 bottom-20 ${isSessionPanelCollapsed ? 'w-auto' : ''} ${!isSessionPanelCollapsed && !isPrivateMode ? 'h-40 sm:h-48' : ''}`}
      >
        <div className="p-2 sm:p-3 border-b border-white/20">
          <div className="flex items-center justify-between">
            {isSessionPanelCollapsed ? (
              <div className="flex items-center gap-2 text-sm">
                <div className={`w-2 h-2 rounded-full ${state.isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-xs">{sessionMessages.length}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm">
                <div className={`w-2 h-2 rounded-full ${state.isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-gray-400">{sessionMessages.length} messages</span>
              </div>
            )}
            {isPrivateMode && !isSessionPanelCollapsed && (
              <div className="flex items-center gap-1 text-xs text-purple-300">
                <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse" />
                <span>Private Mode</span>
              </div>
            )}
            <button
              onClick={() => setIsSessionPanelCollapsed(!isSessionPanelCollapsed)}
              className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label={isSessionPanelCollapsed ? 'Expand session panel' : 'Collapse session panel'}
              title={isSessionPanelCollapsed ? 'Expand session panel' : 'Collapse session panel'}
            >
              {isSessionPanelCollapsed ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              )}
            </button>
          </div>
        </div>
        {!isSessionPanelCollapsed && (
          <div 
            ref={messageContainerRef}
            onScroll={handleScroll}
            className={`h-32 sm:h-40 overflow-y-scroll overflow-x-hidden p-2 sm:p-3 space-y-1 sm:space-y-2 relative transition-all duration-300 ${
              isPrivateMode 
                ? 'h-24 sm:h-32' // Height when at top
                : 'h-32 sm:h-40' // Normal scrollable area
            }`}
          >
          {sessionMessages.map((msg) => {
            // Use avatar from message first, then try to find from members, then fallback
            const member = spatialMembers.find(m => m.id === msg.user_id);
            const avatarUrl = resolveChatAvatarUrl(msg.avatar_url, member?.avatar_url);
            
            const isPrivate = msg.content.includes('[PRIVATE]:');
            
            return (
              <div key={msg.id} className={`message-item group flex gap-3 py-2 sm:py-3 px-3 sm:px-4 rounded-lg transition-colors ${
                isPrivate ? 'private-message-indicator' : 'bg-white/5 hover:bg-white/10'
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
                  <div className="text-white text-sm leading-relaxed break-words">{renderMessageContent(msg.content)}</div>
                  
                  {/* Message Reactions Display */}
                  {msg.reactions && msg.reactions.length > 0 && (
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {Object.entries(
                        msg.reactions.reduce((acc: Record<string, { count: number; userReacted: boolean; reactionId?: string }>, reaction) => {
                          const isCurrentUser = reaction.user_id === user?.id;
                          if (!acc[reaction.emoji]) {
                            acc[reaction.emoji] = { count: 0, userReacted: false };
                          }
                          acc[reaction.emoji].count += 1;
                          if (isCurrentUser) {
                            acc[reaction.emoji].userReacted = true;
                            acc[reaction.emoji].reactionId = reaction.id;
                          }
                          return acc;
                        }, {})
                      ).map(([emoji, data]) => (
                        <button
                          key={emoji}
                          onClick={async () => {
                            if (data.userReacted && data.reactionId) {
                              // Remove reaction
                              const result = await actions.removeReaction(data.reactionId);
                              if (result.success) {
                                showToast(`${emoji} Reaction removed!`);
                              } else {
                                showToast(result.error || 'Failed to remove reaction');
                              }
                            } else {
                              // Add reaction
                              const result = await actions.addReaction(msg.id, emoji);
                              if (result.success) {
                                showToast(`${emoji} Reaction added!`);
                              } else {
                                showToast(result.error || 'Failed to add reaction');
                              }
                            }
                          }}
                          className={`reaction-button inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs transition-colors ${
                            data.userReacted 
                              ? 'bg-blue-600 text-white hover:bg-blue-700' 
                              : 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30'
                          }`}
                        >
                          {emoji} {data.count}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Quick Reactions - Show on hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity mt-1 flex gap-1">
                    <button
                      onClick={async () => {
                        const result = await actions.addReaction(msg.id, '👍');
                        if (result.success) {
                          showToast('👍 Reaction added!');
                        } else {
                          showToast(result.error || 'Failed to add reaction');
                        }
                      }}
                      className="text-xs bg-white/10 hover:bg-white/20 active:bg-white/30 rounded-full px-2 sm:px-3 py-1 sm:py-1.5 transition-colors touch-manipulation"
                      title="Add thumbs up reaction"
                    >
                      👍
                    </button>
                    <button
                      onClick={async () => {
                        const result = await actions.addReaction(msg.id, '❤️');
                        if (result.success) {
                          showToast('❤️ Reaction added!');
                        } else {
                          showToast(result.error || 'Failed to add reaction');
                        }
                      }}
                      className="text-xs bg-white/10 hover:bg-white/20 active:bg-white/30 rounded-full px-2 sm:px-3 py-1 sm:py-1.5 transition-colors touch-manipulation"
                      title="Add heart reaction"
                    >
                      ❤️
                    </button>
                    <button
                      onClick={async () => {
                        const result = await actions.addReaction(msg.id, '🔥');
                        if (result.success) {
                          showToast('🔥 Reaction added!');
                        } else {
                          showToast(result.error || 'Failed to add reaction');
                        }
                      }}
                      className="text-xs bg-white/10 hover:bg-white/20 active:bg-white/30 rounded-full px-2 sm:px-3 py-1 sm:py-1.5 transition-colors touch-manipulation"
                      title="Add fire reaction"
                    >
                      🔥
                    </button>
                    <button
                      onClick={async () => {
                        const result = await actions.addReaction(msg.id, '🐺');
                        if (result.success) {
                          showToast('🐺 Reaction added!');
                        } else {
                          showToast(result.error || 'Failed to add reaction');
                        }
                      }}
                      className="text-xs bg-white/10 hover:bg-white/20 active:bg-white/30 rounded-full px-2 sm:px-3 py-1 sm:py-1.5 transition-colors touch-manipulation"
                      title="Add wolf reaction"
                    >
                      🐺
                    </button>
                  </div>
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
        )}
      </div>

      {/* Connection Status */}
      {!state.isConnected && (
        <div className={`fixed top-16 left-4 right-4 ${getZIndexClass('CHAT_TOAST')} bg-yellow-500/90 text-black px-4 py-2 rounded-lg text-sm text-center`}>
          Connection lost. Attempting to reconnect...
        </div>
      )}

      {/* Private Message Modal - SEPARATE FROM CHAT INPUT */}
      {isPrivateMode && privateMessageTarget && (
        <div className="fixed left-2 right-2 sm:left-4 sm:right-4 bg-purple-600/90 rounded-lg p-3 border border-purple-500/50 backdrop-blur-md" style={{ bottom: '100px', zIndex: 999 }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-purple-200">Private Message</span>
            </div>
            <div className="flex gap-1">
              <button 
                onClick={cancelPrivateMessage}
                className="text-purple-300 hover:text-white transition-colors p-2 hover:bg-purple-500/20 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
                type="button"
                title="Close private message"
                aria-label="Close private message"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-purple-500/20 rounded-lg p-2">
            <Image 
              src={privateMessageTarget.avatar}
              alt={privateMessageTarget.name}
              width={24}
              height={24}
              className="w-6 h-6 rounded-full border border-purple-400/50 object-cover"
              unoptimized={privateMessageTarget.avatar.includes('dicebear.com')}
            />
            <div>
              <p className="text-white font-medium text-sm">{privateMessageTarget.name}</p>
              <p className="text-purple-300 text-xs">Use the input below to send a private message</p>
            </div>
          </div>
        </div>
      )}

      {/* Chat Input */}
      <div className={`fixed left-0 right-0 bottom-0 ${getZIndexClass('CHAT_INPUT')} p-3 sm:p-4 bg-white/10 backdrop-blur-md border-t border-white/20 safe-area-inset-bottom`}>
        
        <div className="relative">
          {/* Emoji Picker */}
          <EmojiPicker
            isOpen={showEmojiPicker}
            onEmojiSelect={handleEmojiSelect}
            onClose={() => setShowEmojiPicker(false)}
          />

          {/* Media Options */}
          {showMediaOptions && (
            <div className="absolute bottom-full left-0 mb-2 bg-white/95 backdrop-blur-md border border-white/20 rounded-lg shadow-lg p-3 min-w-48 w-full sm:w-auto">
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setShowMediaOptions(false);
                    triggerImageUpload();
                  }}
                  disabled={isUploadingImage}
                  className="flex items-center gap-3 w-full p-3 sm:p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
                  title="Upload an image"
                >
                  <ImageIcon className="w-5 h-5 text-blue-600" />
                  <span>{isUploadingImage ? 'Uploading...' : 'Upload Image'}</span>
                  {isUploadingImage && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 ml-auto"></div>
                  )}
                </button>
                <button
                  onClick={() => {
                    // Quick emoji reactions
                    handleEmojiSelect('🔥');
                    setShowMediaOptions(false);
                  }}
                  className="flex items-center gap-3 w-full p-3 sm:p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors min-h-[44px]"
                  title="Add fire emoji"
                >
                  <span className="text-lg">🔥</span>
                  <span>Fire Reaction</span>
                </button>
                <button
                  onClick={() => {
                    handleEmojiSelect('🐺');
                    setShowMediaOptions(false);
                  }}
                  className="flex items-center gap-3 w-full p-3 sm:p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors min-h-[44px]"
                  title="Add wolf emoji"
                >
                  <span className="text-lg">🐺</span>
                  <span>Wolf Howl</span>
                </button>
              </div>
              <div 
                className="fixed inset-0 -z-10" 
                onClick={() => setShowMediaOptions(false)}
              />
            </div>
          )}

          <div className="flex gap-2 items-center">
            {/* Media/Plus Button */}
            <button
              onClick={toggleMediaOptions}
              className={`w-11 h-11 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-colors border ${
                showMediaOptions 
                  ? 'bg-blue-600 border-blue-500 text-white' 
                  : 'bg-white/20 border-white/30 text-white hover:bg-white/30 hover:border-white/50'
              }`}
              type="button"
              title="Media options"
            >
              <Plus className="w-5 h-5" />
            </button>

            {/* Input Field */}
            <input 
              type="text" 
              className={`flex-1 ${isPrivateMode ? 'bg-purple-900/30' : 'bg-white/20'} border ${isPrivateMode ? 'border-purple-500/50' : 'border-white/30'} rounded-full px-4 py-3 sm:py-2 text-white placeholder-gray-300 text-base sm:text-sm`}
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

            {/* Emoji Button */}
            <button
              onClick={toggleEmojiPicker}
              className={`w-11 h-11 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-colors border ${
                showEmojiPicker 
                  ? 'bg-blue-600 border-blue-500 text-white' 
                  : 'bg-white/20 border-white/30 text-white hover:bg-white/30 hover:border-white/50'
              }`}
              type="button"
              title="Emoji picker"
            >
              <Smile className="w-5 h-5" />
            </button>

            {/* Send Button */}
            <button 
              onClick={sendMessage}
              disabled={!chatMessage.trim() || isSendingMessage}
              className={`w-11 h-11 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-colors border ${
                !chatMessage.trim() || isSendingMessage
                  ? 'bg-gray-600/50 border-gray-500/50 text-gray-400 cursor-not-allowed'
                  : isPrivateMode 
                    ? 'bg-purple-600 border-purple-500 text-white hover:bg-purple-700' 
                    : 'bg-blue-600 border-blue-500 text-white hover:bg-blue-700'
              }`}
              type="button"
              title="Send message"
            >
              {isSendingMessage ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast.show && (
        <div className={`toast-notification fixed top-20 left-1/2 transform -translate-x-1/2 ${getZIndexClass('TOAST')} bg-green-500 text-white px-4 py-2 rounded-full`}>
          {toast.message}
        </div>
      )}

      {/* User Profile Modal */}
      {viewingProfile.show && viewingProfile.member && (
        <div className={`fixed inset-0 ${getZIndexClass('USER_PROFILE_MODAL_OVERRIDE')} flex items-center justify-center p-4`}>
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeProfile}
          />
          
          {/* Profile Card */}
          <div className="relative bg-gradient-to-br from-gray-900 to-black rounded-3xl border border-white/20 p-4 sm:p-6 max-w-md w-full shadow-2xl animate-profile-popup max-h-[90vh] overflow-y-auto">
            {/* Close button */}
            <button 
              onClick={closeProfile}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors p-1 min-w-[44px] min-h-[44px] flex items-center justify-center"
              type="button"
              title="Close profile"
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
                  title="Send private message"
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
                title="Close profile"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Popup */}
      {profilePopup.show && profilePopup.user && !viewingProfile.show && !document.body.classList.contains('profile-modal-open') && (
        <div 
          className={`fixed ${getZIndexClass('PROFILE_POPUP')} bg-white/95 backdrop-blur-lg rounded-2xl p-4 shadow-2xl transform -translate-x-1/2 animate-profile-popup`}
          style={{ 
            left: `${profilePopup.position.x}px`,
            top: `${profilePopup.position.y - 200}px`,
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
              title="View full profile"
            >
              View Profile
            </button>
            <button 
              className="flex-1 bg-gray-200 text-gray-800 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
              onClick={() => setProfilePopup({ show: false, user: null, position: { x: 0, y: 0 } })}
              title="Close popup"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <div className={`fixed text-xs text-gray-400 bg-black/80 p-2 rounded right-4 bottom-20 ${getZIndexClass('DEBUG')}`}>
          <p>Session: {sessionId}</p>
          <p>Messages: {state.messages?.length || 0}</p>
          <p>Bubbles: {messageBubbles.size}</p>
          <p>Connected: {state.isConnected ? 'Yes' : 'No'}</p>
        </div>
      )}
    </div>
  );
}