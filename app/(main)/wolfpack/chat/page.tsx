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
        // Navigate to profile
        router.push(`/wolfpack/profile/${popup.member.id}`);
      } else if (actionType === 'message') {
        // Navigate to private chat
        router.push(`/wolfpack/chat/private/${popup.member.id}?name=${encodeURIComponent(popup.member.display_name)}`);
      } else if (actionType === 'wink') {
        // Send wink interaction
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

  // Send message using your comprehensive hook
  const sendMessage = async () => {
    if (!chatMessage.trim() || !user) return;

    // Send typing indicator stop
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

  // Cleanup typing timeout on unmount
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
    <div className="chat-fullscreen bg-black text-white font-sans">
      {/* Background Pattern - Matching HTML demo exactly */}
      <div 
        className="absolute top-0 left-0 w-full h-full"
        style={{
          background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)'
        }}
      />
      <div 
        className="absolute top-0 left-0 w-full h-full animate-float"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 30%, rgba(255, 255, 255, 0.1) 1px, transparent 1px),
            radial-gradient(circle at 80% 70%, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
            radial-gradient(circle at 40% 80%, rgba(255, 255, 255, 0.08) 1px, transparent 1px)
          `,
          backgroundSize: '100px 100px, 150px 150px, 200px 200px'
        }}
      />
      <div className="absolute top-0 left-0 w-full h-full bg-black/60" />

      {/* Header - Fixed position with proper responsive spacing */}
      <div className="chat-header-fixed bg-white/95 backdrop-blur-xl rounded-b-3xl p-4 shadow-2xl text-black">
        <div className="flex items-center justify-center relative">
          <button 
            className="absolute left-0 p-2 hover:bg-gray-100 rounded-full transition-colors text-2xl bg-transparent border-none cursor-pointer"
            onClick={() => router.back()}
            aria-label="Go back"
            title="Go back"
          >
            ←
          </button>
          <div className="text-center">
            <h1 className="text-xl font-bold">Wolfpack Chat</h1>
            <p className="text-sm text-gray-600">{locationName?.toUpperCase() || 'THE SIDE HUSTLE BAR'}</p>
          </div>
        </div>
      </div>

      {/* Main Spatial View - Using responsive content area */}
      <div className="chat-content-area p-8" ref={spatialViewRef}>
        {/* Hexagonal Connection Lines - Matching HTML demo */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
          <defs>
            <pattern id="hexPattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
              <polygon 
                points="50,15 85,35 85,65 50,85 15,65 15,35" 
                fill="none" 
                stroke="rgba(255,255,255,0.1)" 
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hexPattern)"/>
          
          {/* Connection lines with flowing animation */}
          <line 
            x1="50%" y1="25%" x2="25%" y2="45%" 
            stroke="rgba(255,255,255,0.15)" 
            strokeWidth="1" 
            strokeDasharray="5,5" 
            className="animate-pulse"
            style={{ animation: 'hexLineFlow 3s linear infinite' }}
          />
          <line 
            x1="25%" y1="45%" x2="40%" y2="65%" 
            stroke="rgba(255,255,255,0.15)" 
            strokeWidth="1" 
            strokeDasharray="5,5" 
            className="animate-pulse"
            style={{ animation: 'hexLineFlow 3s linear infinite' }}
          />
          <line 
            x1="40%" y1="65%" x2="65%" y2="65%" 
            stroke="rgba(255,255,255,0.15)" 
            strokeWidth="1" 
            strokeDasharray="5,5" 
            className="animate-pulse"
            style={{ animation: 'hexLineFlow 3s linear infinite' }}
          />
          <line 
            x1="65%" y1="65%" x2="75%" y2="45%" 
            stroke="rgba(255,255,255,0.15)" 
            strokeWidth="1" 
            strokeDasharray="5,5" 
            className="animate-pulse"
            style={{ animation: 'hexLineFlow 3s linear infinite' }}
          />
          <line 
            x1="75%" y1="45%" x2="50%" y2="25%" 
            stroke="rgba(255,255,255,0.15)" 
            strokeWidth="1" 
            strokeDasharray="5,5" 
            className="animate-pulse"
            style={{ animation: 'hexLineFlow 3s linear infinite' }}
          />
        </svg>

        {/* Members - Matching HTML demo styling exactly */}
        <div className="relative z-10 w-full h-full">
          {spatialMembers.map((member, index) => (
            <div
              key={member.id}
              className="absolute cursor-pointer transition-all duration-300 ease-out transform -translate-x-1/2 -translate-y-1/2 hover:scale-110 hover:z-20 animate-fade-in member"
              style={{ 
                left: member.position.x, 
                top: member.position.y,
                animationDelay: `${index * 0.1}s`
              }}
              onClick={(e) => handleMemberClick(member, e)}
            >
              <div 
                className={`
                  w-20 h-20 rounded-full border-4 border-white overflow-hidden relative
                  ${member.role === 'dj' ? 'shadow-purple-500/60' : ''}
                  ${member.role === 'bartender' ? 'shadow-green-500/60' : ''}
                  ${member.role === 'current' ? 'shadow-blue-500/60 animate-pulse' : ''}
                `}
                style={{
                  boxShadow: member.role === 'dj' ? '0 0 20px rgba(147, 51, 234, 0.6)' :
                            member.role === 'bartender' ? '0 0 20px rgba(34, 197, 94, 0.6)' :
                            member.role === 'current' ? '0 0 20px rgba(59, 130, 246, 0.6)' :
                            '0 8px 32px rgba(0, 0, 0, 0.3)'
                }}
              >
                <img 
                  src={member.avatar_url} 
                  alt={member.display_name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.id}`;
                  }}
                />
                {member.role === 'dj' && (
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center border-2 border-white text-xs font-bold text-white">
                    DJ
                  </div>
                )}
                {member.role === 'bartender' && (
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-600 rounded-full flex items-center justify-center border-2 border-white text-xs font-bold text-white">
                    BAR
                  </div>
                )}
                <div className={`absolute -bottom-1 -right-1 w-4 h-4 border-2 border-white rounded-full ${
                  member.is_online ? 'bg-green-500' : 'bg-gray-400'
                }`}></div>
              </div>
            </div>
          ))}
        </div>

        {/* Interaction Popup - Matching HTML demo exactly */}
        {popup && popup.show && (
          <div 
            ref={popupRef}
            className="absolute bg-white/95 backdrop-blur-xl border border-white/20 rounded-xl p-4 min-w-[200px] shadow-2xl text-black z-50 animate-scale-in"
            style={{ 
              left: popup.position.left, 
              top: popup.position.top,
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)'
            }}
          >
            <div className="flex items-center gap-3 mb-3">
              <img 
                className="w-10 h-10 rounded-full" 
                src={popup.member.avatar_url} 
                alt={popup.member.display_name}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${popup.member.id}`;
                }}
              />
              <div>
                <h3 className="font-semibold text-sm mb-1">
                  {popup.member.display_name}
                </h3>
                <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                  {popup.member.role === 'dj' ? 'DJ' : popup.member.role === 'bartender' ? 'Bartender' : popup.member.role === 'current' ? 'You' : 'Wolf'}
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <button 
                className="flex items-center gap-2 p-2 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors text-sm"
                onClick={() => handleAction('profile')}
              >
                👤 View Profile
              </button>
              <button 
                className="flex items-center gap-2 p-2 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors text-sm"
                onClick={() => handleAction('message')}
              >
                💬 Send Message
              </button>
              <button 
                className="flex items-center gap-2 p-2 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors text-sm"
                onClick={() => handleAction('wink')}
              >
                ❤️ Send Wink
              </button>
            </div>
          </div>
        )}

        {/* Bartender Card - Positioned in content area */}
        <div className="absolute right-8 bg-black/80 backdrop-blur-xl border border-white/20 rounded-2xl p-4 animate-float"
             style={{ bottom: `calc(50% - 8rem)` }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center text-2xl">
              🐺
            </div>
            <div>
              <h3 className="font-bold">Bartender</h3>
              <span className="bg-yellow-500 text-black px-2 py-1 rounded text-xs font-bold">
                BARTENDER
              </span>
            </div>
          </div>
          <p className="text-sm mb-2">Food & Drink Menu</p>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center">
              🍺
            </div>
            <span className="text-red-500">❤️</span>
          </div>
        </div>
      </div>

      {/* Page Indicators - Positioned above input area */}
      <div className="fixed left-1/2 transform -translate-x-1/2 flex gap-2 z-10"
           style={{ bottom: `calc(var(--bottom-nav-height) + 7rem)` }}>
        {[0, 1, 2].map((page) => (
          <div 
            key={page}
            className={`w-2 h-2 rounded-full cursor-pointer transition-all duration-300 ${
              currentPage === page ? 'bg-white scale-125' : 'bg-white/40'
            }`}
            onClick={() => setCurrentPage(page)}
          />
        ))}
      </div>

      {/* Bottom Chat Interface - Using responsive input area */}
      <div className="chat-input-area">
        <div className="bg-white/95 backdrop-blur-xl rounded-full p-2 flex items-center gap-3 border border-white/30"
             style={{ boxShadow: '0 -10px 30px rgba(0, 0, 0, 0.2)' }}>
          <input 
            type="text" 
            className="flex-1 bg-gray-100/80 border-none outline-none rounded-full px-4 py-2 text-gray-700 placeholder-gray-500"
            placeholder={typingUsers.length > 0 ? `${typingUsers.join(', ')} typing...` : "Quick Replies"}
            value={chatMessage}
            onChange={(e) => setChatMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={state.isLoading}
          />
          <button 
            className="bg-gray-600 text-white rounded-full px-4 py-2 hover:bg-gray-700 transition-colors disabled:opacity-50"
            onClick={sendMessage}
            disabled={state.isLoading || !chatMessage.trim()}
          >
            Send
          </button>
          <div 
            className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white cursor-pointer hover:bg-gray-800 transition-colors"
            onClick={() => router.push('/profile')}
          >
            👤
          </div>
        </div>
      </div>

      {/* AI Assistant Button - Positioned above bottom nav */}
      <button 
        className="fixed right-4 w-12 h-12 bg-gray-600/90 backdrop-blur-xl border border-white/20 rounded-full flex items-center justify-center text-white cursor-pointer transition-all duration-300 hover:bg-gray-600 hover:scale-110 z-10"
        style={{ bottom: `calc(var(--bottom-nav-height) + 1.25rem)` }}
        title="AI Assistant"
      >
        ai
      </button>

      {/* Floating Menu - Matching HTML demo exactly */}
      <div className="fixed top-4 right-4 z-50 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full p-2 flex gap-2">
        <button 
          className="text-white p-2 rounded-full hover:bg-white/20 transition-colors bg-transparent border-none cursor-pointer"
          title="Security"
        >
          🛡️
        </button>
        <button 
          className="text-white p-2 rounded-full hover:bg-white/20 transition-colors bg-transparent border-none cursor-pointer"
          onClick={() => router.push('/profile')}
          title="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* Status Indicator - Matching HTML demo exactly */}
      <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-40 bg-green-500/20 backdrop-blur-xl border border-green-500/30 rounded-full px-4 py-2">
        <div className="flex items-center gap-2 text-green-400 text-sm">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span>Connected to {locationName || 'The Side Hustle Bar'} Pack</span>
        </div>
      </div>

      {/* Toast Notification - Positioned above input area */}
      {toast.show && (
        <div className="fixed left-1/2 transform -translate-x-1/2 z-50 bg-green-500 text-white px-4 py-2 rounded-full shadow-2xl animate-slide-up"
             style={{ bottom: `calc(var(--bottom-nav-height) + 8rem)` }}>
          {toast.message}
        </div>
      )}

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(-10px, -5px); }
          50% { transform: translate(5px, -10px); }
          75% { transform: translate(-5px, 5px); }
        }

        @keyframes hexLineFlow {
          0% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: 20; }
        }

        @keyframes fade-in {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0);
          }
          100% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }

        @keyframes scale-in {
          0% {
            opacity: 0;
            transform: scale(0.8) translateY(20px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @keyframes slide-up {
          0% {
            opacity: 0;
            transform: translateX(-50%) translateY(50px);
          }
          100% {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }

        .animate-float {
          animation: float 20s ease-in-out infinite;
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }

        .animate-scale-in {
          animation: scale-in 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}