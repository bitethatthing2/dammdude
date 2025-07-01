'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser } from '@/hooks/useUser';
import { useConsistentWolfpackAccess } from '@/lib/hooks/useConsistentWolfpackAccess';
import { useWolfpack } from '@/hooks/useWolfpack';
import { useTypingIndicators } from '@/hooks/useTypingIndicators';
import { useWolfpackSession } from '@/lib/hooks/useWolfpackSession';
import { useRouter } from 'next/navigation';
import { Settings, Shield } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

// Types for the spatial chat interface
interface SpatialMember {
  id: string;
  display_name: string;
  avatar_url: string;
  role: 'user' | 'dj' | 'bartender' | 'current';
  wolfpack_status: string;
  is_online: boolean;
  position: { x: string; y: string };
}

interface InteractionPopup {
  member: SpatialMember;
  position: { left: string; top: string };
  show: boolean;
}

interface ToastMessage {
  show: boolean;
  message: string;
}

// Define the member interface to match your useWolfpack hook
interface WolfPackMember {
  id: string;
  display_name?: string;
  avatar_url?: string;
  status: string;
  is_online?: boolean;
}

export default function WolfpackChatPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useUser();
  const { isMember: isInPack, isLoading: packLoading, locationName } = useConsistentWolfpackAccess();
  
  // Get session configuration with proper typing
  const wolfpackSession = useWolfpackSession(user as any, locationName);
  const { sessionId, locationId, isActive } = wolfpackSession || {};
  
  // Use your comprehensive wolfpack hook - handle nullable parameters
  const { state, actions } = useWolfpack(
    sessionId || '', 
    locationId || '', 
    {
      enableDebugLogging: true,
      autoConnect: isActive && !!user && !!sessionId
    }
  ) || { state: { members: [], isLoading: false, isConnected: false, error: null, stats: { onlineMembers: 0 } }, actions: { sendMessage: async () => ({ success: false }) } };
  
  // Use typing indicators - handle nullable sessionId
  const { typingUsers, sendTyping } = useTypingIndicators(sessionId || '');
  
  const [spatialMembers, setSpatialMembers] = useState<SpatialMember[]>([]);
  const [chatMessage, setChatMessage] = useState('');
  const [popup, setPopup] = useState<InteractionPopup | null>(null);
  const [toast, setToast] = useState<ToastMessage>({ show: false, message: '' });
  const [currentPage, setCurrentPage] = useState(0);
  
  const spatialViewRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Convert WolfPackMembers to SpatialMembers with positions
  useEffect(() => {
    const positions = [
      { x: '50%', y: '25%' },
      { x: '25%', y: '45%' },
      { x: '75%', y: '45%' },
      { x: '40%', y: '65%' },
      { x: '65%', y: '65%' },
      { x: '30%', y: '30%' },
      { x: '70%', y: '30%' },
      { x: '20%', y: '60%' },
      { x: '80%', y: '60%' },
      { x: '50%', y: '70%' }
    ];

    const spatial: SpatialMember[] = (state.members || []).map((member, index) => {
      const position = positions[index % positions.length];
      
      return {
        id: member.id || `member_${index}`,
        display_name: member.display_name || 'Wolf Member',
        avatar_url: member.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.id || member.id}`,
        role: member.id === user?.id ? 'current' : (
          // Determine role based on user data or member status
          member.display_name?.toLowerCase().includes('dj') ? 'dj' :
          member.display_name?.toLowerCase().includes('bartender') ? 'bartender' : 'user'
        ) as 'user' | 'dj' | 'bartender' | 'current',
        wolfpack_status: member.status || 'active',
        is_online: member.is_online || false,
        position
      };
    });

    setSpatialMembers(spatial);
  }, [state.members, user?.id]);

  // Handle member click for interactions
  const handleMemberClick = (member: SpatialMember, event: React.MouseEvent<HTMLDivElement>) => {
    if (!spatialViewRef.current) return;

    const memberElement = event.currentTarget;
    const containerRect = spatialViewRef.current.getBoundingClientRect();
    const rect = memberElement.getBoundingClientRect();
    
    const leftPercent = ((rect.left - containerRect.left + rect.width/2) / containerRect.width) * 100;
    const topPercent = ((rect.top - containerRect.top + rect.height/2) / containerRect.height) * 100;

    setPopup({
      member,
      position: { 
        left: `${leftPercent + 15}%`, 
        top: `${topPercent - 10}%` 
      },
      show: true
    });

    setTimeout(() => {
      document.addEventListener('click', hidePopupOnClickOutside);
    }, 100);
  };

  const hidePopupOnClickOutside = (event: MouseEvent) => {
    if (popupRef.current && !popupRef.current.contains(event.target as Node) && 
        !(event.target as Element)?.closest('.member')) {
      setPopup(null);
      document.removeEventListener('click', hidePopupOnClickOutside);
    }
  };

  // Handle popup actions using wolf_pack_interactions table
  const handleAction = async (actionType: string) => {
    if (!popup?.member || !user) return;

    setPopup(null);
    document.removeEventListener('click', hidePopupOnClickOutside);

    try {
      if (actionType === 'profile') {
        router.push('/profile');
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
            status: 'active',
            created_at: new Date().toISOString()
          });

        if (error) {
          console.error('Error sending wink:', error);
          showToast('Failed to send wink');
        } else {
          showToast(`Wink sent to ${popup.member.display_name}! 😉`);
        }
      }
      showToast('Action completed! 🎉');
    } catch (error) {
      console.error('Error handling action:', error);
      showToast('Something went wrong. Please try again.');
    }
  };

  // Send message
  const sendMessage = async () => {
    if (!chatMessage.trim() || !user) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    sendTyping(user.id, user.display_name || 'Wolf Member', false);

    try {
      const result = await actions.sendMessage(chatMessage.trim());
      
      if (result.success) {
        setChatMessage('');
        showToast('Message sent! 💬');
      } else {
        showToast(result.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      showToast('Something went wrong. Please try again.');
    }
  };

  // Handle typing indicators
  const handleTyping = () => {
    if (!user || !sessionId) return;

    sendTyping(user.id, user.display_name || 'Wolf Member', true);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      sendTyping(user.id, user.display_name || 'Wolf Member', false);
    }, 1000);
  };

  const showToast = (message: string) => {
    setToast({ show: true, message });
    setTimeout(() => {
      setToast({ show: false, message: '' });
    }, 2000);
  };

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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading Wolf Pack...</p>
          {state.error && (
            <p className="text-red-400 mt-2">Error: {state.error.message}</p>
          )}
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
          <button onClick={() => router.back()} className="text-white text-xl">←</button>
          <div className="text-center">
            <h1 className="text-lg font-bold">Wolfpack Chat</h1>
            <p className="text-sm text-gray-300">{locationName || 'Side Hustle Bar'}</p>
          </div>
          <Settings className="w-6 h-6 text-white" />
        </div>
      </div>

      {/* Spatial View */}
      <div className="relative z-10 h-[calc(100vh-200px)] p-6" ref={spatialViewRef}>
        {spatialMembers.map((member, index) => (
          <div
            key={member.id}
            className="absolute cursor-pointer transition-all duration-300 hover:scale-110 member"
            style={{ 
              left: member.position.x, 
              top: member.position.y,
              transform: 'translate(-50%, -50%)'
            }}
            onClick={(e) => handleMemberClick(member, e)}
          >
            <div className="w-16 h-16 rounded-full border-2 border-white overflow-hidden bg-gray-700">
              <img 
                src={member.avatar_url} 
                alt={member.display_name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.id}`;
                }}
              />
              <div className={`absolute -bottom-1 -right-1 w-3 h-3 border border-white rounded-full ${
                member.is_online ? 'bg-green-500' : 'bg-gray-400'
              }`} />
            </div>
          </div>
        ))}
        
        {/* Interaction Popup */}
        {popup?.show && (
          <div 
            ref={popupRef}
            className="absolute bg-white/95 backdrop-blur-md rounded-lg p-4 shadow-lg text-black z-50"
            style={{ left: popup.position.left, top: popup.position.top }}
          >
            <div className="flex items-center gap-2 mb-3">
              <img 
                className="w-8 h-8 rounded-full" 
                src={popup.member.avatar_url} 
                alt={popup.member.display_name}
              />
              <span className="font-semibold">{popup.member.display_name}</span>
            </div>
            <div className="space-y-2">
              <button 
                onClick={() => handleAction('profile')}
                className="w-full p-2 bg-gray-100 rounded hover:bg-gray-200 text-sm"
              >
                👤 View Profile
              </button>
              <button 
                onClick={() => handleAction('message')}
                className="w-full p-2 bg-gray-100 rounded hover:bg-gray-200 text-sm"
              >
                💬 Send Message
              </button>
              <button 
                onClick={() => handleAction('wink')}
                className="w-full p-2 bg-gray-100 rounded hover:bg-gray-200 text-sm"
              >
                ❤️ Send Wink
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Chat Input */}
      <div className="relative z-10 p-4 bg-white/10 backdrop-blur-md">
        <div className="flex gap-2">
          <input 
            type="text" 
            className="flex-1 bg-white/20 border border-white/30 rounded-full px-4 py-2 text-white placeholder-gray-300"
            placeholder={typingUsers.length > 0 ? `${typingUsers.join(', ')} typing...` : "Type a message..."}
            value={chatMessage}
            onChange={(e) => setChatMessage(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <button 
            onClick={sendMessage}
            disabled={!chatMessage.trim()}
            className="bg-blue-600 text-white px-6 py-2 rounded-full disabled:opacity-50"
          >
            Send
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