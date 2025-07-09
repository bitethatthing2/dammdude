'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronUp, ChevronDown, Send, Smile, Plus, MessageCircle, Users, Maximize2, Minimize2, Mail, MessageSquare, ArrowLeft, ImageIcon } from 'lucide-react';
import Image from 'next/image';
import { EmojiPicker } from '@/components/chat/EmojiPicker';

interface Message {
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

interface Member {
  id: string;
  display_name: string;
  avatar_url: string;
  is_online: boolean;
  favorite_drink?: string;
  vibe_status?: string;
  bio?: string;
  favorite_song?: string;
  wolf_emoji?: string;
}

interface MobileOptimizedChatProps {
  messages: Message[];
  members: Member[];
  spatialViewContent: React.ReactNode;
  currentUser: any;
  onSendMessage: (message: string) => void;
  onMemberSelect: (memberId: string) => void;
  onReactionAdd: (messageId: string, emoji: string) => void;
  onReactionRemove: (reactionId: string) => void;
  isConnected: boolean;
  isTyping: boolean;
  typingUsers: string[];
  onShowMessages?: () => void;
  onStartPrivateChat?: (userId: string, userName: string) => void;
  onBack?: () => void;
}

type ViewMode = 'spatial' | 'messages' | 'members';

export default function MobileOptimizedChat({
  messages,
  members,
  spatialViewContent,
  currentUser,
  onSendMessage,
  onMemberSelect,
  onReactionAdd,
  onReactionRemove,
  isConnected,
  isTyping,
  typingUsers,
  onShowMessages,
  onStartPrivateChat,
  onBack
}: MobileOptimizedChatProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('spatial');
  const [messageInput, setMessageInput] = useState('');
  const [isMessagesExpanded, setIsMessagesExpanded] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMediaOptions, setShowMediaOptions] = useState(false);
  const [messagesHeight, setMessagesHeight] = useState(40); // 40% of screen
  
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to top when new messages arrive (since newest are at top)
  useEffect(() => {
    if (messageContainerRef.current) {
      const container = messageContainerRef.current;
      container.scrollTop = 0;
    }
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    if (inputRef.current && viewMode === 'spatial') {
      inputRef.current.focus();
    }
  }, [viewMode]);

  const handleSendMessage = () => {
    if (messageInput.trim()) {
      onSendMessage(messageInput.trim());
      setMessageInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value);
    // TODO: Add typing indicator logic here if needed
  };

  const toggleMessagesExpanded = () => {
    setIsMessagesExpanded(!isMessagesExpanded);
    setMessagesHeight(isMessagesExpanded ? 40 : 70);
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessageInput(prev => prev + emoji);
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

  const triggerImageUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        // Handle image upload - for now just alert, would need to implement upload logic
        alert('Image upload would be implemented here');
      }
    };
    input.click();
  };

  const renderMessage = (msg: Message) => {
    const isPrivate = msg.content.includes('[PRIVATE]:');
    
    return (
      <div key={msg.id} className={`message-item group flex gap-3 py-3 px-4 rounded-xl transition-colors w-full max-w-full box-border ${
        isPrivate ? 'bg-purple-900/20 border-l-2 border-purple-500' : 'bg-white/5 hover:bg-white/10'
      }`}>
        {/* Avatar */}
        <div className="flex-shrink-0">
          <Image 
            src={msg.avatar_url || '/default-avatar.png'}
            alt={msg.display_name}
            width={36}
            height={36}
            className="w-9 h-9 rounded-full object-cover ring-2 ring-gray-600"
            unoptimized={msg.avatar_url?.includes('dicebear.com')}
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
          
          {/* Message Reactions Display */}
          {msg.reactions && msg.reactions.length > 0 && (
            <div className="flex gap-1 mt-2 flex-wrap">
              {Object.entries(
                msg.reactions.reduce((acc: Record<string, { count: number; userReacted: boolean; reactionId?: string }>, reaction) => {
                  const isCurrentUser = reaction.user_id === currentUser?.id;
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
                  onClick={() => {
                    if (data.userReacted && data.reactionId) {
                      onReactionRemove(data.reactionId);
                    } else {
                      onReactionAdd(msg.id, emoji);
                    }
                  }}
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs transition-colors min-h-[32px] min-w-[32px] ${
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

          {/* Quick Reactions - Always visible on mobile */}
          <div className="mt-2 flex gap-1">
            {['👍', '❤️', '🔥', '🐺'].map(emoji => (
              <button
                key={emoji}
                onClick={() => onReactionAdd(msg.id, emoji)}
                className="text-xs bg-white/10 hover:bg-white/20 active:bg-white/30 rounded-full px-2 py-1 transition-colors min-h-[32px] min-w-[32px]"
                title={`Add ${emoji} reaction`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen flex flex-col bg-gray-900 overflow-hidden w-full max-w-full box-border">
      {/* Top Navigation */}
      <div className="flex-none h-16 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-4 w-full max-w-full box-border">
        <div className="flex items-center gap-4">
          {onBack && (
            <button
              onClick={onBack}
              className="p-3 bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-full text-white transition-colors min-w-[48px] min-h-[48px] flex items-center justify-center touch-manipulation shadow-lg"
              title="Exit Chat"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="flex bg-gray-700 rounded-full p-1 shadow-sm">
            <button
              onClick={() => setViewMode('spatial')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                viewMode === 'spatial' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-300 hover:text-white hover:bg-gray-600'
              }`}
            >
              <div className="w-3 h-3 bg-gradient-to-br from-blue-400 to-green-400 rounded-full" />
              <span className="hidden sm:inline">Spatial</span>
            </button>
            <button
              onClick={() => {
                if (onShowMessages) {
                  onShowMessages();
                } else {
                  setViewMode('messages');
                }
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                viewMode === 'messages' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-300 hover:text-white hover:bg-gray-600'
              }`}
            >
              <MessageCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Messages</span>
            </button>
            <button
              onClick={() => setViewMode('members')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                viewMode === 'members' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-300 hover:text-white hover:bg-gray-600'
              }`}
            >
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Members</span>
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-3 text-sm">
          <div className="flex items-center gap-2 bg-gray-700 rounded-full px-3 py-1">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-gray-300 font-medium">{messages.length}</span>
          </div>
          {onShowMessages && (
            <button
              onClick={onShowMessages}
              className="p-2 hover:bg-gray-700 rounded-full text-gray-400 hover:text-white transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
              title="View private messages"
            >
              <Mail className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 relative overflow-hidden">
        {/* Spatial View with Overlay Messages */}
        {viewMode === 'spatial' && (
          <div className="h-full flex flex-col">
            {/* Messages Overlay - Expandable */}
            <div 
              className="flex-none bg-gray-800/95 backdrop-blur-sm border-b border-gray-700 transition-all duration-300"
              style={{ height: `${messagesHeight}vh` }}
            >
              {/* Messages Header */}
              <div className="flex items-center justify-between p-2 border-b border-gray-700">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-medium text-white">Messages</span>
                  {typingUsers.length > 0 && (
                    <span className="text-xs text-gray-400">
                      {typingUsers.join(', ')} typing...
                    </span>
                  )}
                </div>
                <button
                  onClick={toggleMessagesExpanded}
                  className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors"
                >
                  {isMessagesExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
              </div>
              
              {/* Messages List */}
              <div 
                ref={messageContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-4 h-full w-full max-w-full box-border"
                style={{ maxHeight: `${messagesHeight - 8}vh` }}
              >
                {messages.map(renderMessage)}
              </div>
            </div>

            {/* Spatial View */}
            <div className="flex-1 relative">
              {spatialViewContent}
            </div>
          </div>
        )}

        {/* Full Messages View - Shows public chat messages if no private messages callback */}
        {viewMode === 'messages' && !onShowMessages && (
          <div className="h-full flex flex-col">
            <div 
              ref={messageContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 w-full max-w-full box-border"
            >
              {messages.map(renderMessage)}
            </div>
          </div>
        )}

        {/* Members List View */}
        {viewMode === 'members' && (
          <div className="h-full overflow-y-auto p-4">
            <div className="space-y-2">
              {members.map(member => (
                <div 
                  key={member.id}
                  className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <div className="relative">
                    <Image 
                      src={member.avatar_url}
                      alt={member.display_name}
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded-full object-cover"
                      unoptimized={member.avatar_url.includes('dicebear.com')}
                    />
                    <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-gray-800 ${
                      member.is_online ? 'bg-green-500' : 'bg-gray-500'
                    }`} />
                  </div>
                  <div 
                    className="flex-1 cursor-pointer"
                    onClick={() => onMemberSelect(member.id)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">{member.display_name}</span>
                      {member.wolf_emoji && (
                        <span className="text-sm">{member.wolf_emoji}</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400">
                      {member.is_online ? 'Online' : 'Offline'}
                      {member.vibe_status && ` • ${member.vibe_status}`}
                    </p>
                  </div>
                  
                  {/* Quick Actions */}
                  <div className="flex items-center gap-2">
                    {/* Quick Emoji Reactions */}
                    <div className="flex gap-1">
                      {['👋', '👍', '❤️', '🔥'].map(emoji => (
                        <button
                          key={emoji}
                          onClick={() => {
                            // For now, just show a quick reaction animation
                            // In a full implementation, you'd send this as a quick reaction
                            console.log(`Quick reaction ${emoji} to ${member.display_name}`);
                          }}
                          className="text-sm bg-gray-700 hover:bg-gray-600 active:bg-gray-500 rounded-full px-2 py-1 transition-colors min-h-[32px] min-w-[32px]"
                          title={`Send ${emoji} to ${member.display_name}`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                    
                    {/* Message Button */}
                    {onStartPrivateChat && member.id !== currentUser?.id && (
                      <button
                        onClick={() => onStartPrivateChat(member.id, member.display_name)}
                        className="p-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-full text-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
                        title={`Message ${member.display_name}`}
                      >
                        <MessageSquare className="w-6 h-6" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Media Options */}
      {showMediaOptions && (
        <div className="fixed bottom-24 left-4 right-4 bg-gray-800/95 backdrop-blur-md border border-gray-600 rounded-lg shadow-lg p-3 z-50">
          <div className="space-y-2">
            <button
              onClick={() => {
                setShowMediaOptions(false);
                triggerImageUpload();
              }}
              className="flex items-center gap-3 w-full p-3 text-white hover:bg-gray-700 rounded-lg transition-colors min-h-[44px]"
              title="Upload an image"
            >
              <ImageIcon className="w-5 h-5 text-blue-400" />
              <span>Upload Image</span>
            </button>
            <button
              onClick={() => {
                handleEmojiSelect('🔥');
                setShowMediaOptions(false);
              }}
              className="flex items-center gap-3 w-full p-3 text-white hover:bg-gray-700 rounded-lg transition-colors min-h-[44px]"
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
              className="flex items-center gap-3 w-full p-3 text-white hover:bg-gray-700 rounded-lg transition-colors min-h-[44px]"
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

      {/* Input Area - Always visible */}
      <div className="flex-none p-4 bg-gray-800 border-t border-gray-700 safe-area-inset-bottom relative">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleMediaOptions}
            className="p-3 hover:bg-gray-700 rounded-full text-gray-400 hover:text-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <Plus className="w-5 h-5" />
          </button>
          
          <div className="flex-1 relative">
            <input 
              ref={inputRef}
              type="text"
              className="w-full bg-gray-700 border border-gray-600 rounded-full px-4 py-3 text-white placeholder-gray-400 text-base focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
              placeholder={typingUsers.length > 0 ? `${typingUsers.join(', ')} typing...` : "Type a message..."}
              value={messageInput}
              onChange={handleInputChange}
              onKeyDown={handleKeyPress}
            />
          </div>
          
          <button
            onClick={toggleEmojiPicker}
            className="p-3 hover:bg-gray-700 rounded-full text-gray-400 hover:text-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <Smile className="w-5 h-5" />
          </button>
          
          <button
            onClick={handleSendMessage}
            disabled={!messageInput.trim()}
            className="p-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-full text-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center shadow-lg"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        
        {/* Emoji Picker */}
        <EmojiPicker
          isOpen={showEmojiPicker}
          onEmojiSelect={handleEmojiSelect}
          onClose={() => setShowEmojiPicker(false)}
        />
      </div>
    </div>
  );
}