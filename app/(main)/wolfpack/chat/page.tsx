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

// Type definitions for the component
interface WolfpackMember {
  id: string;
  display_name: string;
  avatar_url: string;
  is_online: boolean;
}

// Create a type that extends Record to have index signature
type UserWithIndexSignature = Record<string, unknown> & {
  id: string;
  email: string;
  display_name?: string | null;
  first_name?: string | null;
  [key: string]: unknown;
}

interface WolfpackState {
  members: WolfpackMember[];
  isLoading: boolean;
  isConnected: boolean;
  error: Error | null;
  stats: {
    onlineMembers: number;
  };
}

interface WolfpackActions {
  sendMessage: (message: string) => Promise<{ success: boolean; error?: string }>;
}

interface WolfpackData {
  state: WolfpackState;
  actions: WolfpackActions;
}

interface WolfpackSessionData {
  sessionId: string | null;
  locationId: string | null;
  isActive: boolean;
}

interface TypingIndicatorsData {
  typingUsers: string[];
  sendTyping: (userId: string, userName: string, isTyping: boolean) => void;
}

// Simple types
interface SpatialMember {
  id: string;
  display_name: string;
  avatar_url: string;
  role: 'user' | 'dj' | 'bartender' | 'current';
  is_online: boolean;
  position: { x: string; y: string };
}

interface InteractionPopup {
  member: SpatialMember;
  position: { left: string; top: string };
  show: boolean;
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
  { x: '20%', y: '75%' },
  { x: '80%', y: '75%' },
  { x: '50%', y: '80%' }
];

export default function SimpleWolfpackChatPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useUser();
  const { isMember: isInPack, isLoading: packLoading, locationName } = useConsistentWolfpackAccess();
  
  // Convert user to a type with index signature
  const userWithIndex: UserWithIndexSignature | null = user ? 
    Object.assign({} as UserWithIndexSignature, user) : null;
  
  // Handle the user type properly - useWolfpackSession expects a user with index signature
  const wolfpackSession = useWolfpackSession(userWithIndex, locationName);
  const { sessionId, locationId, isActive } = (wolfpackSession || {
    sessionId: null,
    locationId: null,
    isActive: false
  }) as WolfpackSessionData;
  
  // Use wolfpack hook with proper typing
  const wolfpackData = useWolfpack(
    sessionId || '', 
    locationId || '', 
    {
      enableDebugLogging: false,
      autoConnect: Boolean(isActive && user && sessionId)
    }
  ) as WolfpackData | null;
  
  // Safe destructuring with fallbacks
  const state = wolfpackData?.state || { 
    members: [], 
    isLoading: false, 
    isConnected: false, 
    error: null, 
    stats: { onlineMembers: 0 } 
  };
  const actions = wolfpackData?.actions || { 
    sendMessage: async () => ({ success: false, error: 'Not connected' }) 
  };
  
  // Typing indicators with proper typing
  const typingData = useTypingIndicators(sessionId || '') as TypingIndicatorsData | null;
  const typingUsers = typingData?.typingUsers || [];
  const sendTyping = typingData?.sendTyping || (() => {});
  
  // Simple state
  const [spatialMembers, setSpatialMembers] = useState<SpatialMember[]>([]);
  const [chatMessage, setChatMessage] = useState('');
  const [popup, setPopup] = useState<InteractionPopup | null>(null);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '' });
  
  // Simple refs
  const spatialViewRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Convert members to spatial format
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
          position
        };
      });
      setSpatialMembers(spatial);
    }
  }, [state.members, user?.id]);

  // Handle member click
  const handleMemberClick = (member: SpatialMember) => {
    if (member.role === 'current') return;

    setPopup({
      member,
      position: { left: '50%', top: '30%' }, // Simple fixed position
      show: true
    });
  };

  // Hide popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setPopup(null);
      }
    };

    if (popup?.show) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [popup?.show]);

  // Handle popup actions
  const handleAction = async (actionType: string) => {
    if (!popup?.member || !user) return;

    setPopup(null);

    try {
      if (actionType === 'profile') {
        router.push(`/profile/${popup.member.id}`);
      } else if (actionType === 'message') {
        router.push(`/wolfpack/chat/private/${popup.member.id}?name=${encodeURIComponent(popup.member.display_name)}`);
      } else if (actionType === 'wink') {
        const { error } = await supabase
          .from('wolf_pack_interactions')
          .insert({
            sender_id: user.id,
            receiver_id: popup.member.id,
            interaction_type: 'wink',
            location_id: locationId || null,
            status: 'active'
          });

        if (error) {
          showToast('Failed to send wink');
        } else {
          showToast(`Wink sent to ${popup.member.display_name}! 😉`);
        }
      }
    } catch (error) {
      console.error('Error handling action:', error);
      showToast('Something went wrong');
    }
  };

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
    };
  }, []);

  // Loading state
  if (authLoading || packLoading || state.isLoading) {
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
              <span>{spatialMembers.length} online</span>
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
      <div className="relative z-10 h-[calc(100vh-16rem)] p-6" ref={spatialViewRef}>
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
            onClick={() => handleMemberClick(member)}
          >
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
        
        {/* Popup */}
        {popup?.show && (
          <div 
            ref={popupRef}
            className="interaction-popup animate-fade-in"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full overflow-hidden">
                <Image 
                  src={popup.member.avatar_url} 
                  alt={popup.member.display_name}
                  width={32}
                  height={32}
                  className="w-full h-full object-cover"
                  unoptimized={popup.member.avatar_url.includes('dicebear.com')}
                />
              </div>
              <span className="font-semibold">{popup.member.display_name}</span>
            </div>
            <div className="space-y-2">
              <button 
                onClick={() => handleAction('profile')}
                className="w-full p-2 bg-gray-100 rounded hover:bg-gray-200 text-sm"
                type="button"
              >
                👤 View Profile
              </button>
              <button 
                onClick={() => handleAction('message')}
                className="w-full p-2 bg-gray-100 rounded hover:bg-gray-200 text-sm"
                type="button"
              >
                💬 Send Message
              </button>
              <button 
                onClick={() => handleAction('wink')}
                className="w-full p-2 bg-gray-100 rounded hover:bg-gray-200 text-sm"
                type="button"
              >
                😉 Send Wink
              </button>
            </div>
          </div>
        )}
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
    </div>
  );
}
