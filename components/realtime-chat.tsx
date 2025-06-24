"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Loader2 } from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/AuthContext';

export interface ChatMessage {
  id: string;
  room_name: string;
  user_id: string;
  username: string;
  avatar_url?: string;
  content: string;
  created_at: string;
}

interface DatabaseMessage {
  id: string;
  session_id: string;
  user_id: string;
  display_name: string;
  avatar_url?: string;
  content: string;
  message_type: string;
  created_at: string;
  is_deleted: boolean;
}

interface RealtimePayload {
  new: DatabaseMessage;
}

interface RealtimeChatProps {
  roomName: string;
  username: string;
  messages: ChatMessage[];
  onMessage: (messages: ChatMessage[]) => void;
  className?: string;
}

export function RealtimeChat({ roomName, username, messages, onMessage, className }: RealtimeChatProps) {
  const { user } = useAuth();
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = getSupabaseBrowserClient();

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Load messages
  const loadMessages = useCallback(async () => {
    if (!roomName) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('wolfpack_chat_messages')
        .select('*')
        .eq('session_id', roomName)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) throw error;

      const transformedMessages: ChatMessage[] = (data || []).map((msg: DatabaseMessage) => ({
        id: msg.id,
        room_name: roomName,
        user_id: msg.user_id,
        username: msg.display_name || 'Anonymous',
        avatar_url: msg.avatar_url,
        content: msg.content,
        created_at: msg.created_at
      }));

      onMessage(transformedMessages);
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setIsLoading(false);
    }
  }, [roomName, supabase, onMessage, scrollToBottom]);

  // Set up realtime subscription
  useEffect(() => {
    if (!roomName) return;

    const channel = supabase
      .channel(`chat_${roomName}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'wolfpack_chat_messages',
          filter: `session_id=eq.${roomName}`
        },
        (payload: RealtimePayload) => {
          const newMsg = payload.new;
          const transformedMessage: ChatMessage = {
            id: newMsg.id,
            room_name: roomName,
            user_id: newMsg.user_id,
            username: newMsg.display_name || 'Anonymous',
            avatar_url: newMsg.avatar_url,
            content: newMsg.content,
            created_at: newMsg.created_at
          };
          
          onMessage([...messages, transformedMessage]);
          scrollToBottom();
        }
      )
      .subscribe((status: string) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    loadMessages();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomName, supabase, loadMessages, messages, onMessage, scrollToBottom]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || !roomName) return;

    try {
      const messageData = {
        session_id: roomName,
        user_id: user.id,
        display_name: username,
        avatar_url: user.user_metadata?.avatar_url,
        content: newMessage.trim(),
        message_type: 'text',
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('wolfpack_chat_messages')
        .insert(messageData);

      if (error) throw error;
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffMins < 1440) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return date.toLocaleDateString();
  };

  return (
    <Card className={`flex flex-col ${className}`}>
      <CardContent className="flex-1 overflow-hidden flex flex-col p-4">
        <ScrollArea className="flex-1 pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading messages...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No messages yet</p>
              <p className="text-sm">Be the first to say hello! 👋</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => {
                const isOwn = message.user_id === user?.id;
                const showAvatar = index === 0 || messages[index - 1].user_id !== message.user_id;

                return (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    {showAvatar && !isOwn && (
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarImage src={message.avatar_url} />
                        <AvatarFallback>
                          {message.username?.charAt(0)?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    
                    {!showAvatar && !isOwn && <div className="w-8 flex-shrink-0" />}

                    <div className={`flex-1 max-w-[80%] ${isOwn ? 'text-right' : 'text-left'}`}>
                      {showAvatar && (
                        <div className={`flex items-center gap-2 mb-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                          <span className="text-sm font-medium">{message.username}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatTime(message.created_at)}
                          </span>
                        </div>
                      )}

                      <div className={`rounded-lg px-3 py-2 max-w-full ${
                        isOwn
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {message.content}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        <div className="flex gap-2 mt-4">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Type a message..."
            disabled={!isConnected}
            className="flex-1"
          />
          
          <Button
            onClick={sendMessage}
            disabled={!newMessage.trim() || !isConnected}
            size="sm"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        {!isConnected && (
          <p className="text-xs text-muted-foreground text-center mt-2">
            Reconnecting to chat...
          </p>
        )}
      </CardContent>
    </Card>
  );
}
