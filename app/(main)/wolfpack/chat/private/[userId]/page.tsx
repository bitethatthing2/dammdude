'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  ArrowLeft, 
  Send, 
  Shield, 
  UserX, 
  WifiOff, 
  Wifi, 
  Loader2,
  AlertTriangle
} from 'lucide-react';
// Try one of these toast imports:
// import { toast } from 'sonner';
// import { toast } from '@/components/ui/toast';
// import { useToast } from '@/components/ui/use-toast';

// Temporary simple toast for testing
const toast = {
  success: (message: string) => alert(`✅ ${message}`),
  error: (message: string) => alert(`❌ ${message}`),
};
import { AvatarWithFallback } from '@/components/shared/ImageWithFallback';
import { useChat, ConnectionState } from '@/hooks/useChat';

export default function OptimizedPrivateChatPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const otherUserId = params.userId as string;
  const otherUserName = searchParams.get('name') || 'Wolf';
  
  const [newMessage, setNewMessage] = useState('');
  const [replyingTo, setReplyingTo] = useState<any>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Use the chat hook
  const {
    messages,
    otherUser,
    currentUser,
    isLoading,
    isSending,
    isBlocked,
    connectionState,
    unreadCount,
    isTyping,
    error,
    sendMessage,
    blockUser,
    reportMessage,
    toggleReaction,
    updateTypingIndicator,
    setTypingStatus,
    formatMessageTime,
    groupMessages
  } = useChat({ 
    otherUserId,
    enableTypingIndicator: true,
    enableOptimisticUpdates: true,
    messageLimit: 50
  });

  // Memoized display name
  const displayName = useMemo(() => {
    return otherUser?.display_name || 
           `${otherUser?.first_name || ''} ${otherUser?.last_name || ''}`.trim() ||
           otherUserName;
  }, [otherUser, otherUserName]);

  // Memoized grouped messages for better performance
  const groupedMessages = useMemo(() => {
    return groupMessages(messages);
  }, [messages, groupMessages]);

  // Auto-scroll to top (since newest messages are now at top)
  const scrollToTop = () => {
    const messagesContainer = messagesEndRef.current?.parentElement;
    if (messagesContainer) {
      messagesContainer.scrollTop = 0;
    }
  };

  // Scroll to top when messages change (to show newest)
  useEffect(() => {
    const timer = setTimeout(scrollToTop, 100);
    return () => clearTimeout(timer);
  }, [messages]);

  // Handle send message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || isSending) return;

    const messageText = newMessage.trim();
    setNewMessage(''); // Clear input immediately for better UX
    
    const success = await sendMessage(messageText, replyingTo?.id);
    
    if (success) {
      setReplyingTo(null); // Clear reply state on success
    } else {
      setNewMessage(messageText); // Restore message on failure
    }
  };

  // Handle typing indicator with debouncing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewMessage(value);
    
    // Trigger typing indicator
    if (value.length > 0) {
      setTypingStatus(true);
      updateTypingIndicator(); // Send real-time typing indicator
    } else {
      setTypingStatus(false);
    }
  };

  // Handle report message (simplified)
  const handleReportMessage = async (messageId: string) => {
    const reason = prompt('Please provide a reason for reporting this message:');
    if (!reason) return;

    const success = await reportMessage(messageId, reason);
    if (success) {
      toast.success('Message reported');
    }
  };

  // Handle block user (simplified)
  const handleBlockUser = async () => {
    if (!confirm(`Are you sure you want to block ${displayName}?`)) return;
    
    const success = await blockUser();
    if (success) {
      router.back();
    }
  };

  // Request notification permission on mount
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto p-4 max-w-2xl">
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Loading chat...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto p-4 max-w-2xl">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Error Loading Chat
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Blocked state
  if (isBlocked) {
    return (
      <div className="container mx-auto p-4 max-w-2xl">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <CardTitle>Chat Unavailable</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="text-center py-8">
            <Shield className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              This chat is not available. One of you may have blocked the other.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <Card className="h-[80vh] flex flex-col">
        {/* Chat Header */}
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Button variant="ghost" size="sm" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              
              <AvatarWithFallback
                src={otherUser?.profile_image_url}
                name={displayName}
                emoji={otherUser?.wolf_emoji}
                size="md"
                className="flex-shrink-0"
              />
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg truncate">
                    {displayName}
                  </CardTitle>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {otherUser?.is_online && (
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    )}
                    {connectionState !== ConnectionState.CONNECTED && (
                      <WifiOff className="h-3 w-3 text-muted-foreground" />
                    )}
                    {unreadCount > 0 && (
                      <span className="bg-primary text-primary-foreground text-xs rounded-full px-2 py-0.5 min-w-[1.25rem] text-center">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {isTyping ? (
                    <span className="text-sm">Typing...</span>
                  ) : (
                    otherUser?.vibe_status || 
                    otherUser?.bio || 
                    (otherUser?.is_online ? 'Online' : (
                      otherUser?.last_activity ? 
                        `Last seen ${formatMessageTime(otherUser.last_activity)}` : 
                        'Offline'
                    ))
                  )}
                </p>
              </div>
            </div>

            {/* Simple block button */}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleBlockUser}
              className="text-destructive hover:text-destructive"
            >
              <UserX className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        {/* Messages */}
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {groupedMessages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-lg mb-2">Start a conversation with {displayName}!</p>
              {otherUser?.favorite_drink && (
                <p className="text-sm opacity-75">🍹 Their favorite drink: {otherUser.favorite_drink}</p>
              )}
              {otherUser?.bio && (
                <p className="text-sm opacity-75 mt-1">&quot;{otherUser.bio}&quot;</p>
              )}
            </div>
          ) : (
            <>
              <div ref={messagesEndRef} />
              {groupedMessages.map((group) => (
                <div key={`${group.senderId}_${group.timestamp}`} className="space-y-2">
                  <div className={`flex items-start gap-3 ${
                    group.senderId === otherUserId ? 'flex-row' : 'flex-row-reverse'
                  }`}>
                    {group.senderId === otherUserId && (
                      <AvatarWithFallback
                        src={group.senderAvatar || otherUser?.profile_image_url}
                        name={group.senderName}
                        emoji={otherUser?.wolf_emoji}
                        size="sm"
                        className="mt-1 flex-shrink-0"
                      />
                    )}
                    
                    <div className={`flex flex-col space-y-1 max-w-[70%] ${
                      group.senderId === otherUserId ? 'items-start' : 'items-end'
                    }`}>
                      {group.messages.map((message, index) => (
                        <div
                          key={message.id}
                          className={`group relative p-3 rounded-2xl ${
                            group.senderId === otherUserId
                              ? 'bg-muted text-muted-foreground'
                              : 'bg-primary text-primary-foreground'
                          } ${
                            index === 0 ? (
                              group.senderId === otherUserId 
                                ? 'rounded-tl-md' 
                                : 'rounded-tr-md'
                            ) : ''
                          } ${
                            index === group.messages.length - 1 ? (
                              group.senderId === otherUserId 
                                ? 'rounded-bl-md' 
                                : 'rounded-br-md'
                            ) : ''
                          }`}
                        >
                          {/* Reply Context */}
                          {message.reply_to_message_id !== null && message.reply_to_message_id !== undefined && (
                            <div className="mb-2 p-2 bg-background/50 rounded border-l-2 border-primary/30">
                              <div className="text-xs text-muted-foreground">
                                Replying to:
                              </div>
                              <div className="text-xs text-muted-foreground truncate">
                                {/* This would be populated from the actual reply message */}
                                Previous message content...
                              </div>
                            </div>
                          )}
                          
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {message.message}
                          </p>
                          
                          <div className="flex items-center justify-between mt-1 gap-2">
                            <span className={`text-xs opacity-70`}>
                              {formatMessageTime(message.created_at || '')}
                            </span>
                            
                            {group.senderId !== otherUserId && (
                              <span className={`text-xs opacity-70`}>
                                {message.is_read ? '✓✓' : '✓'}
                              </span>
                            )}
                          </div>

                          {/* Message Reactions */}
                          {message.reactions && message.reactions.length > 0 && (
                            <div className="flex gap-1 mt-2 flex-wrap">
                              {message.reactions.map((reaction) => {
                                const userReacted = currentUser && reaction.user_ids.includes(currentUser.id);
                                return (
                                  <button
                                    key={reaction.emoji}
                                    onClick={() => toggleReaction(message.id, reaction.emoji)}
                                    className={`text-xs rounded-full px-2 py-1 transition-colors touch-manipulation ${
                                      userReacted
                                        ? 'bg-primary/20 text-primary border border-primary/30'
                                        : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                                    }`}
                                  >
                                    {reaction.emoji} {reaction.reaction_count}
                                  </button>
                                );
                              })}
                            </div>
                          )}

                          {/* Quick Reaction Buttons */}
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity mt-1 flex gap-1">
                            {['❤️', '👍', '😄', '😮', '😢'].map((emoji) => (
                              <button
                                key={emoji}
                                onClick={() => toggleReaction(message.id, emoji)}
                                className="text-xs bg-muted/50 hover:bg-muted active:bg-muted/80 rounded-full px-2 py-1 transition-colors touch-manipulation"
                              >
                                {emoji}
                              </button>
                            ))}
                            
                            {/* Reply Button */}
                            <button
                              onClick={() => setReplyingTo(message)}
                              className="text-xs bg-muted/50 hover:bg-muted active:bg-muted/80 rounded-full px-2 py-1 transition-colors touch-manipulation"
                            >
                              ↩️ Reply
                            </button>
                          </div>

                          {/* Simple report button for other user's messages */}
                          {group.senderId === otherUserId && (
                            <div className="absolute top-0 right-0 translate-x-full opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                                onClick={() => handleReportMessage(message.id)}
                              >
                                <AlertTriangle className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </CardContent>

        {/* Connection Status Bar */}
        {connectionState !== ConnectionState.CONNECTED && (
          <div className={`px-4 py-2 flex items-center gap-2 border-t ${
            connectionState === ConnectionState.RECONNECTING 
              ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' 
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
          }`}>
            {connectionState === ConnectionState.RECONNECTING ? (
              <Loader2 className="h-4 w-4 animate-spin text-yellow-600 dark:text-yellow-400" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-600 dark:text-red-400" />
            )}
            <p className={`text-xs ${
              connectionState === ConnectionState.RECONNECTING 
                ? 'text-yellow-600 dark:text-yellow-400'
                : 'text-red-600 dark:text-red-400'
            }`}>
              {connectionState === ConnectionState.RECONNECTING 
                ? 'Reconnecting...' 
                : 'Connection lost. Messages will be sent when reconnected.'
              }
            </p>
          </div>
        )}

        {/* Reply Preview */}
        {replyingTo && (
          <div className="px-4 py-2 bg-muted/30 border-t flex justify-between items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="text-xs text-muted-foreground mb-1">
                Replying to {replyingTo.sender_id === otherUserId ? displayName : 'You'}:
              </div>
              <div className="text-sm text-muted-foreground truncate">
                {replyingTo.content}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReplyingTo(null)}
              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
            >
              ×
            </Button>
          </div>
        )}

        {/* Message Input */}
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={handleInputChange}
              placeholder={
                connectionState === ConnectionState.CONNECTED 
                  ? "Type your message..." 
                  : "Reconnecting..."
              }
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              disabled={isSending || connectionState !== ConnectionState.CONNECTED}
              maxLength={500}
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={
                !newMessage.trim() || 
                isSending || 
                connectionState !== ConnectionState.CONNECTED
              }
              size="sm"
              className="px-3"
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          <div className="flex justify-between items-center mt-2">
            <p className="text-xs text-muted-foreground">
              {newMessage.length}/500 characters
            </p>
            {connectionState === ConnectionState.CONNECTED && (
              <div className="flex items-center gap-1">
                <Wifi className="h-3 w-3 text-green-500" />
                <span className="text-xs text-muted-foreground">Connected</span>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}