'use client';

import { useState, useEffect, useRef } from 'react';
import { useWolfpack } from '@/hooks/useWolfpack';
import { useUser } from '@/hooks/useUser';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Send, ArrowLeft, Users, MessageCircle, X } from 'lucide-react';
import WolfpackChatChannels from './WolfpackChatChannels';


interface WolfpackChatInterfaceProps {
  className?: string;
  defaultSessionId?: string;
}

export default function WolfpackChatInterface({
  className = '',
  defaultSessionId
}: WolfpackChatInterfaceProps) {
  const { user } = useUser();
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(defaultSessionId || null);
  const [currentSessionName, setCurrentSessionName] = useState<string>('');
  const [messageInput, setMessageInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showChannels, setShowChannels] = useState(!defaultSessionId);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Use the wolfpack hook for current session
  const { state, actions } = useWolfpack(
    currentSessionId,
    user?.location_id || null,
    { enableDebugLogging: true }
  );

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.messages]);

  // Focus input when session changes
  useEffect(() => {
    if (currentSessionId && !showChannels) {
      inputRef.current?.focus();
    }
  }, [currentSessionId, showChannels]);

  const handleJoinChat = (sessionId: string, sessionName: string) => {
    setCurrentSessionId(sessionId);
    setCurrentSessionName(sessionName);
    setShowChannels(false);
  };

  const handleLeaveChat = () => {
    setCurrentSessionId(null);
    setCurrentSessionName('');
    setShowChannels(true);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!messageInput.trim() || !currentSessionId || isTyping) {
      return;
    }

    const content = messageInput.trim();
    setMessageInput('');
    setIsTyping(true);

    try {
      const result = await actions.sendMessage(content);
      
      if (!result.success) {
        console.error('Failed to send message:', result.error);
        // Restore message input on failure
        setMessageInput(content);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessageInput(content);
    } finally {
      setIsTyping(false);
    }
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else {
      return date.toLocaleDateString([], { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const getAvatarFallback = (displayName: string) => {
    return displayName
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Show channel list if no session selected
  if (showChannels || !currentSessionId) {
    return (
      <div className={`flex flex-col h-full ${className}`}>
        <WolfpackChatChannels
          currentUserId={user?.id || null}
          userLocationId={user?.location_id || null}
          onJoinChat={handleJoinChat}
          className="flex-1"
        />
      </div>
    );
  }

  // Show loading state
  if (state.isLoading) {
    return (
      <Card className={`flex flex-col h-full ${className}`}>
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLeaveChat}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent mx-auto mb-2" />
            <p className="text-sm text-gray-500">Loading chat...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show error state
  if (state.error) {
    return (
      <Card className={`flex flex-col h-full ${className}`}>
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLeaveChat}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h3 className="font-semibold text-red-600">Chat Error</h3>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md">
            <X className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-600 mb-2">Failed to load chat</p>
            <p className="text-sm text-gray-500 mb-4">{state.error.message}</p>
            <div className="space-x-2">
              <Button onClick={actions.refreshData} variant="outline" size="sm">
                Try Again
              </Button>
              <Button onClick={handleLeaveChat} variant="ghost" size="sm">
                Back to Channels
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`flex flex-col h-full ${className}`}>
      {/* Chat Header */}
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-3 border-b">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLeaveChat}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h3 className="font-semibold">{currentSessionName}</h3>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <div className={`h-2 w-2 rounded-full ${state.isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                <span>{state.isConnected ? 'Connected' : 'Disconnected'}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                <span>{state.stats.memberCount} members</span>
              </div>
              <div className="flex items-center gap-1">
                <MessageCircle className="h-3 w-3" />
                <span>{state.stats.messageCount} messages</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {state.stats.onlineMembers > 0 && (
            <Badge variant="secondary" className="text-xs">
              {state.stats.onlineMembers} online
            </Badge>
          )}
        </div>
      </CardHeader>

      {/* Messages Area */}
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
        {state.messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">No messages yet</p>
              <p className="text-sm text-gray-500">Be the first to start the conversation!</p>
            </div>
          </div>
        ) : (
          <>
            {state.messages.map((message) => (
              <div key={message.id} className="flex gap-3">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {message.avatar_url ? (
                    <img
                      src={message.avatar_url}
                      alt={message.display_name}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-medium">
                      {getAvatarFallback(message.display_name)}
                    </div>
                  )}
                </div>

                {/* Message Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm text-gray-900">
                      {message.display_name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatMessageTime(message.created_at)}
                    </span>
                    {message.user_id === user?.id && (
                      <Badge variant="outline" className="text-xs px-1 py-0">
                        You
                      </Badge>
                    )}
                    {message.is_flagged && (
                      <Badge variant="destructive" className="text-xs px-1 py-0">
                        Flagged
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-gray-700 break-words">
                    {message.content}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </CardContent>

      {/* Message Input */}
      <div className="border-t p-4">
        {!user ? (
          <div className="text-center py-4">
            <p className="text-sm text-gray-500 mb-2">Sign in to participate in chat</p>
            <Button size="sm" variant="outline">
              Sign In
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              ref={inputRef}
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder={`Message ${currentSessionName}...`}
              disabled={isTyping || !state.isConnected}
              maxLength={500}
              className="flex-1"
            />
            <Button
              type="submit"
              disabled={!messageInput.trim() || isTyping || !state.isConnected}
              size="sm"
            >
              {isTyping ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        )}
        
        {messageInput.length > 450 && (
          <p className="text-xs text-gray-500 mt-1 text-right">
            {500 - messageInput.length} characters remaining
          </p>
        )}
      </div>
    </Card>
  );
}