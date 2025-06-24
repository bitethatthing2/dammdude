"use client";

import { useEffect, useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  MessageCircle, 
  Send, 
  Image as ImageIcon, 
  Smile, 
  Flag, 
  Loader2,
  AlertTriangle,
  X
} from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/AuthContext';
import { toast } from 'sonner';

interface ChatMessage {
  id: string;
  session_id: string;
  user_id: string;
  display_name: string;
  avatar_url?: string;
  content: string;
  message_type: 'text' | 'image' | 'system';
  image_url?: string;
  created_at: string;
  edited_at?: string;
  is_flagged: boolean;
  reactions: MessageReaction[];
}

interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

interface TypingUser {
  user_id: string;
  display_name: string;
  timestamp: number;
}

interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  isConnected: boolean;
  error: string | null;
  typingUsers: TypingUser[];
  currentSessionId: string | null;
}

const EMOJI_REACTIONS = ['❤️', '👍', '😂', '😮', '😢', '😡'];

export function WolfpackRealTimeChat({ sessionId }: { sessionId: string | null }) {
  const { user } = useAuth();
  const [state, setState] = useState<ChatState>({
    messages: [],
    isLoading: true,
    isConnected: false,
    error: null,
    typingUsers: [],
    currentSessionId: sessionId
  });
  
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  interface SupabaseChannel {
    unsubscribe: () => void;
    send: (options: { type: string; event: string; payload: Record<string, unknown> }) => void;
  }
  
  const channelRef = useRef<{ messagesChannel: SupabaseChannel; typingChannel: SupabaseChannel } | null>(null);
  
  const supabase = getSupabaseBrowserClient();

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Load chat history
  const loadMessages = useCallback(async () => {
    if (!sessionId) {
      setState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const { data: messages, error } = await supabase
        .from('wolfpack_chat_messages')
        .select(`
          *,
          wolfpack_chat_reactions (
            id,
            message_id,
            user_id,
            emoji,
            created_at
          )
        `)
        .eq('session_id', sessionId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) throw error;

      setState(prev => ({
        ...prev,
        messages: messages?.map((msg: { wolfpack_chat_reactions?: MessageReaction[]; [key: string]: unknown }) => ({
          ...msg,
          reactions: msg.wolfpack_chat_reactions || []
        })) || [],
        isLoading: false
      }));

      // Scroll to bottom after loading
      setTimeout(scrollToBottom, 100);

    } catch (error) {
      console.error('Error loading messages:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to load chat messages',
        isLoading: false
      }));
    }
  }, [sessionId, supabase, scrollToBottom]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!sessionId) return;

    // Subscribe to new messages
    const messagesChannel = supabase
      .channel(`chat_${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'wolfpack_chat_messages',
          filter: `session_id=eq.${sessionId}`
        },
        (payload: { new: ChatMessage }) => {
          const newMessage = payload.new;
          setState(prev => ({
            ...prev,
            messages: [...prev.messages, { ...newMessage, reactions: [] }]
          }));
          scrollToBottom();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'wolfpack_chat_reactions'
        },
        (payload: { new: MessageReaction }) => {
          const newReaction = payload.new;
          setState(prev => ({
            ...prev,
            messages: prev.messages.map(msg =>
              msg.id === newReaction.message_id
                ? { ...msg, reactions: [...msg.reactions, newReaction] }
                : msg
            )
          }));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'wolfpack_chat_reactions'
        },
        (payload: { old: MessageReaction }) => {
          const deletedReaction = payload.old;
          setState(prev => ({
            ...prev,
            messages: prev.messages.map(msg =>
              msg.id === deletedReaction.message_id
                ? { 
                    ...msg, 
                    reactions: msg.reactions.filter(r => r.id !== deletedReaction.id) 
                  }
                : msg
            )
          }));
        }
      )
      .subscribe((status: string) => {
        setState(prev => ({ 
          ...prev, 
          isConnected: status === 'SUBSCRIBED' 
        }));
      });

    // Subscribe to typing indicators
    const typingChannel = supabase
      .channel(`typing_${sessionId}`)
      .on('broadcast', { event: 'typing' }, (payload: { 
        payload: { 
          user_id: string; 
          display_name: string; 
          isTyping: boolean; 
        } 
      }) => {
        if (payload.payload.user_id === user?.id) return;
        
        setState(prev => {
          const existingIndex = prev.typingUsers.findIndex(
            u => u.user_id === payload.payload.user_id
          );
          
          if (payload.payload.isTyping) {
            const newTypingUser = {
              user_id: payload.payload.user_id,
              display_name: payload.payload.display_name,
              timestamp: Date.now()
            };
            
            if (existingIndex >= 0) {
              const updated = [...prev.typingUsers];
              updated[existingIndex] = newTypingUser;
              return { ...prev, typingUsers: updated };
            } else {
              return { 
                ...prev, 
                typingUsers: [...prev.typingUsers, newTypingUser] 
              };
            }
          } else {
            return {
              ...prev,
              typingUsers: prev.typingUsers.filter(u => u.user_id !== payload.payload.user_id)
            };
          }
        });
      })
      .subscribe();

    channelRef.current = { messagesChannel, typingChannel };

    // Load initial messages
    loadMessages();

    // Cleanup typing indicators
    const cleanupTyping = setInterval(() => {
      setState(prev => ({
        ...prev,
        typingUsers: prev.typingUsers.filter(u => Date.now() - u.timestamp < 3000)
      }));
    }, 1000);

    return () => {
      messagesChannel.unsubscribe();
      typingChannel.unsubscribe();
      clearInterval(cleanupTyping);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [sessionId, user?.id, supabase, loadMessages, scrollToBottom]);

  // Handle typing indicators
  const handleTyping = useCallback(() => {
    if (!sessionId || !user || !channelRef.current) return;

    if (!isTyping) {
      setIsTyping(true);
      channelRef.current.typingChannel.send({
        type: 'broadcast',
        event: 'typing',
        payload: {
          user_id: user.id,
          display_name: user.user_metadata?.display_name || user.email?.split('@')[0],
          isTyping: true
        }
      });
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      if (channelRef.current) {
        channelRef.current.typingChannel.send({
          type: 'broadcast',
          event: 'typing',
          payload: {
            user_id: user.id,
            display_name: user.user_metadata?.display_name || user.email?.split('@')[0],
            isTyping: false
          }
        });
      }
    }, 2000);
  }, [sessionId, user, isTyping]);

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() || !sessionId || !user) return;

    try {
      const messageData = {
        session_id: sessionId,
        user_id: user.id,
        display_name: user.user_metadata?.display_name || user.email?.split('@')[0] || 'Anonymous',
        avatar_url: user.user_metadata?.avatar_url,
        content: newMessage.trim(),
        message_type: 'text' as const,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('wolfpack_chat_messages')
        .insert(messageData);

      if (error) throw error;

      setNewMessage('');
      setIsTyping(false);

      // Stop typing indicator
      if (channelRef.current) {
        channelRef.current.typingChannel.send({
          type: 'broadcast',
          event: 'typing',
          payload: {
            user_id: user.id,
            display_name: messageData.display_name,
            isTyping: false
          }
        });
      }

    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  // Handle image upload
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !sessionId || !user) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    try {
      setIsUploading(true);

      // Upload to Supabase Storage
      const fileName = `chat/${sessionId}/${Date.now()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('chat-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('chat-images')
        .getPublicUrl(uploadData.path);

      // Send message with image
      const messageData = {
        session_id: sessionId,
        user_id: user.id,
        display_name: user.user_metadata?.display_name || user.email?.split('@')[0] || 'Anonymous',
        avatar_url: user.user_metadata?.avatar_url,
        content: 'Shared an image',
        message_type: 'image' as const,
        image_url: urlData.publicUrl,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('wolfpack_chat_messages')
        .insert(messageData);

      if (error) throw error;

      toast.success('Image shared successfully');

    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  // Add reaction to message
  const addReaction = async (messageId: string, emoji: string) => {
    if (!user) return;

    try {
      // Check if user already reacted with this emoji
      const existingReaction = state.messages
        .find(m => m.id === messageId)
        ?.reactions.find(r => r.user_id === user.id && r.emoji === emoji);

      if (existingReaction) {
        // Remove reaction
        const { error } = await supabase
          .from('wolfpack_chat_reactions')
          .delete()
          .eq('id', existingReaction.id);

        if (error) throw error;
      } else {
        // Add reaction
        const { error } = await supabase
          .from('wolfpack_chat_reactions')
          .insert({
            message_id: messageId,
            user_id: user.id,
            emoji,
            created_at: new Date().toISOString()
          });

        if (error) throw error;
      }

      setShowEmojiPicker(null);

    } catch (error) {
      console.error('Error managing reaction:', error);
      toast.error('Failed to update reaction');
    }
  };

  // Flag message
  const flagMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('wolfpack_chat_messages')
        .update({ is_flagged: true })
        .eq('id', messageId);

      if (error) throw error;

      toast.success('Message flagged for review');

    } catch (error) {
      console.error('Error flagging message:', error);
      toast.error('Failed to flag message');
    }
  };

  // Format time for messages
  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return date.toLocaleDateString();
  };

  if (!sessionId) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">Join a WolfPack to start chatting</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col h-full max-h-[70vh]">
      {state.error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {/* Messages Container */}
      <div className="flex-1 overflow-hidden flex flex-col bg-background border rounded-lg">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            <h3 className="font-semibold">Pack Chat</h3>
            {!state.isConnected && (
              <Badge variant="destructive" className="text-xs">Disconnected</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Real-time chat with your WolfPack members
          </p>
        </div>
        <div className="flex-1 overflow-y-auto space-y-4 p-4">
          {state.isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading messages...</span>
            </div>
          ) : state.messages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No messages yet</p>
              <p className="text-sm">Be the first to say hello! 👋</p>
            </div>
          ) : (
            state.messages.map((message, index) => {
              const isOwn = message.user_id === user?.id;
              const showAvatar = index === 0 || 
                state.messages[index - 1].user_id !== message.user_id;

              return (
                <div
                  key={message.id}
                  className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {showAvatar && !isOwn && (
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarImage src={message.avatar_url} />
                      <AvatarFallback>
                        {message.display_name?.charAt(0)?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  {!showAvatar && !isOwn && (
                    <div className="w-8 flex-shrink-0" />
                  )}

                  <div className={`flex-1 max-w-[80%] ${isOwn ? 'text-right' : 'text-left'}`}>
                    {showAvatar && (
                      <div className={`flex items-center gap-2 mb-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                        <span className="text-sm font-medium">{message.display_name}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatMessageTime(message.created_at)}
                        </span>
                      </div>
                    )}

                    <div className={`relative group ${isOwn ? 'flex justify-end' : 'flex justify-start'}`}>
                      <div
                        className={`rounded-lg px-3 py-2 max-w-full ${
                          isOwn
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        } ${message.is_flagged ? 'opacity-50' : ''}`}
                      >
                        {message.message_type === 'image' && message.image_url ? (
                          <div className="space-y-2">
                            <div className="relative w-full max-w-[300px] h-[200px]">
                              <Image
                                src={message.image_url}
                                alt="Shared image"
                                fill
                                className="rounded object-cover"
                                sizes="300px"
                              />
                            </div>
                            {message.content !== 'Shared an image' && (
                              <p className="text-sm">{message.content}</p>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {message.content}
                          </p>
                        )}

                        {message.is_flagged && (
                          <div className="text-xs text-yellow-600 mt-1">
                            ⚠️ Flagged for review
                          </div>
                        )}
                      </div>

                      {/* Message actions */}
                      <div className={`absolute top-0 ${isOwn ? 'left-0 -translate-x-full' : 'right-0 translate-x-full'} opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 pl-2 pr-2`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowEmojiPicker(
                            showEmojiPicker === message.id ? null : message.id
                          )}
                          className="h-6 w-6 p-0"
                          title="Add reaction"
                          aria-label="Add reaction"
                        >
                          <Smile className="h-3 w-3" />
                        </Button>
                        
                        {!isOwn && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => flagMessage(message.id)}
                            className="h-6 w-6 p-0"
                            title="Flag message"
                            aria-label="Flag message for review"
                          >
                            <Flag className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Reactions */}
                    {message.reactions.length > 0 && (
                      <div className={`flex flex-wrap gap-1 mt-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                        {Object.entries(
                          message.reactions.reduce((acc, reaction) => {
                            acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
                            return acc;
                          }, {} as Record<string, number>)
                        ).map(([emoji, count]) => (
                          <button
                            key={emoji}
                            onClick={() => addReaction(message.id, emoji)}
                            className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                              message.reactions.some(r => r.emoji === emoji && r.user_id === user?.id)
                                ? 'bg-primary/20 border-primary'
                                : 'bg-muted border-muted-foreground/20 hover:bg-muted/80'
                            }`}
                          >
                            {emoji} {count}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Emoji picker */}
                    {showEmojiPicker === message.id && (
                      <div className={`mt-2 p-2 bg-background border rounded-lg shadow-lg ${isOwn ? 'text-right' : 'text-left'}`}>
                        <div className="flex gap-1">
                          {EMOJI_REACTIONS.map(emoji => (
                            <button
                              key={emoji}
                              onClick={() => addReaction(message.id, emoji)}
                              className="p-1 hover:bg-muted rounded text-lg"
                            >
                              {emoji}
                            </button>
                          ))}
                            <button
                              onClick={() => setShowEmojiPicker(null)}
                              className="p-1 hover:bg-muted rounded"
                              title="Close emoji picker"
                              aria-label="Close emoji picker"
                            >
                              <X className="h-4 w-4" />
                            </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {/* Typing indicators */}
          {state.typingUsers.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce bounce-delay-100" />
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce bounce-delay-200" />
              </div>
              <span>
                {state.typingUsers.length === 1
                  ? `${state.typingUsers[0].display_name} is typing...`
                  : `${state.typingUsers.length} people are typing...`
                }
              </span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="border-t p-4">
          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Input
                  ref={inputRef}
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    handleTyping();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Type a message..."
                  disabled={!state.isConnected}
                  className="pr-12"
                />
                
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                    disabled={isUploading}
                  />
                  <label htmlFor="image-upload">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      disabled={isUploading}
                      asChild
                    >
                      <span className="cursor-pointer" title="Upload image" aria-label="Upload image">
                        {isUploading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <ImageIcon className="h-4 w-4" />
                        )}
                      </span>
                    </Button>
                  </label>
                </div>
              </div>
              
              <Button
                onClick={sendMessage}
                disabled={!newMessage.trim() || !state.isConnected}
                size="sm"
                title="Send message"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>

            {!state.isConnected && (
              <p className="text-xs text-muted-foreground text-center">
                Reconnecting to chat...
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
