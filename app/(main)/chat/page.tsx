"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useSimpleWolfpack } from '@/hooks/useSimpleWolfpack';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { 
  Shield, 
  Send, 
  Loader2,
  MessageCircle,
  Users,
  AlertCircle,
  Smile,
  Heart,
  ThumbsUp,
  Flame,
  PartyPopper,
  ArrowLeft,
  MoreVertical,
  Flag
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ChatMessage {
  id: string;
  user_id: string;
  message: string;
  created_at: string;
  user?: {
    email: string;
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
  };
  reactions?: MessageReaction[];
}

interface MessageReaction {
  id: string;
  user_id: string;
  emoji: string;
  user?: {
    first_name?: string;
    last_name?: string;
  };
}

interface ActiveMember {
  user_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  last_active: string;
}

interface UserData {
  email?: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
}

const REACTION_EMOJIS = [
  { emoji: '❤️', label: 'Love' },
  { emoji: '👍', label: 'Like' },
  { emoji: '🔥', label: 'Fire' },
  { emoji: '🎉', label: 'Party' },
  { emoji: '🐺', label: 'Wolf' },
  { emoji: '😂', label: 'Laugh' }
];

export default function WolfpackChatPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { isInPack, isLoading: packLoading } = useSimpleWolfpack();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [activeMembers, setActiveMembers] = useState<ActiveMember[]>([]);
  const [showReactions, setShowReactions] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = getSupabaseBrowserClient();

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Redirect if not in pack
  useEffect(() => {
    if (!packLoading && !isInPack) {
      router.push('/wolfpack/welcome');
    }
  }, [packLoading, isInPack, router]);

  // Load messages
  const loadMessages = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('wolfpack_chat_messages')
        .select(`
          *,
          user:users!wolfpack_chat_messages_user_id_fkey (
            email,
            first_name,
            last_name,
            avatar_url
          ),
          reactions:wolfpack_chat_reactions (
            id,
            user_id,
            emoji,
            user:users!wolfpack_chat_reactions_user_id_fkey (
              first_name,
              last_name
            )
          )
        `)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  // Load active members
  const loadActiveMembers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('wolfpack_active_members')
        .select('*')
        .order('last_active', { ascending: false })
        .limit(20);

      if (error) throw error;
      setActiveMembers(data || []);
    } catch (error) {
      console.error('Error loading active members:', error);
    }
  }, [supabase]);

  // Send message
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    setIsSending(true);
    try {
      const { error } = await supabase
        .from('wolfpack_chat_messages')
        .insert({
          user_id: user.id,
          message: newMessage.trim(),
          session_id: 'web_' + Date.now() // Simple session ID
        });

      if (error) throw error;
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  // Add reaction
  const addReaction = async (messageId: string, emoji: string) => {
    if (!user) return;

    try {
      // Check if user already reacted with this emoji
      const existingReaction = messages
        .find(m => m.id === messageId)?.reactions
        ?.find(r => r.user_id === user.id && r.emoji === emoji);

      if (existingReaction) {
        // Remove reaction
        await supabase
          .from('wolfpack_chat_reactions')
          .delete()
          .eq('id', existingReaction.id);
      } else {
        // Add reaction
        await supabase
          .from('wolfpack_chat_reactions')
          .insert({
            message_id: messageId,
            user_id: user.id,
            emoji
          });
      }
    } catch (error) {
      console.error('Error toggling reaction:', error);
    }
    setShowReactions(null);
  };

  // Report message
  const reportMessage = async (messageId: string) => {
    if (!user) return;

    try {
      await supabase
        .from('content_flags')
        .insert({
          content_type: 'chat',
          content_id: messageId,
          flagged_by: user.id,
          reason: 'Inappropriate content'
        });
      
      alert('Message reported. Thank you for helping keep the chat safe!');
    } catch (error) {
      console.error('Error reporting message:', error);
    }
  };

  // Set up real-time subscriptions
  useEffect(() => {
    if (!isInPack) return;

    loadMessages();
    loadActiveMembers();

    // Subscribe to new messages
    const messageSubscription = supabase
      .channel('wolfpack_chat')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'wolfpack_chat_messages' 
        },
        () => {
          loadMessages();
        }
      )
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'wolfpack_chat_reactions' 
        },
        () => {
          loadMessages();
        }
      )
      .subscribe();

    // Subscribe to member activity
    const memberSubscription = supabase
      .channel('wolfpack_members')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'wolfpack_memberships' 
        },
        () => {
          loadActiveMembers();
        }
      )
      .subscribe();

    return () => {
      messageSubscription.unsubscribe();
      memberSubscription.unsubscribe();
    };
  }, [isInPack, supabase, loadMessages, loadActiveMembers]);

  if (packLoading || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 pb-20">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading Wolf Pack Chat...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user || !isInPack) {
    return null; // Will redirect
  }

  // Get user display name
  const getUserName = (userData: UserData | undefined) => {
    if (userData?.first_name || userData?.last_name) {
      return `${userData.first_name || ''} ${userData.last_name || ''}`.trim();
    }
    return userData?.email?.split('@')[0] || 'Pack Member';
  };

  // Get user initials
  const getUserInitials = (userData: UserData | undefined) => {
    if (userData?.first_name && userData?.last_name) {
      return `${userData.first_name[0]}${userData.last_name[0]}`.toUpperCase();
    }
    return userData?.email?.[0]?.toUpperCase() || '?';
  };

  // Group reactions by emoji
  const groupReactions = (reactions: MessageReaction[]) => {
    const grouped: { [emoji: string]: MessageReaction[] } = {};
    reactions?.forEach(reaction => {
      if (!grouped[reaction.emoji]) {
        grouped[reaction.emoji] = [];
      }
      grouped[reaction.emoji].push(reaction);
    });
    return grouped;
  };

  return (
    <TooltipProvider>
      <div className="container mx-auto px-4 py-4 pb-20 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-8rem)]">
          {/* Main Chat Area */}
          <div className="lg:col-span-3 flex flex-col h-full">
            <Card className="flex-1 flex flex-col overflow-hidden">
              <CardHeader className="flex-shrink-0 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => router.push('/wolfpack')}
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Shield className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">Wolf Pack Chat</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {activeMembers.length} members online
                        </p>
                      </div>
                    </div>
                  </div>
                  <Badge variant="default" className="gap-1">
                    <MessageCircle className="h-3 w-3" />
                    Live
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="flex-1 p-0 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="p-4 space-y-4">
                    {messages.length === 0 ? (
                      <div className="text-center py-8">
                        <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">
                          No messages yet. Start the conversation!
                        </p>
                      </div>
                    ) : (
                      messages.map((message) => {
                        const isOwnMessage = message.user_id === user.id;
                        const groupedReactions = groupReactions(message.reactions || []);
                        
                        return (
                          <div
                            key={message.id}
                            className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : ''}`}
                          >
                            <Avatar className="flex-shrink-0">
                              <AvatarImage src={message.user?.avatar_url} />
                              <AvatarFallback>
                                {getUserInitials(message.user)}
                              </AvatarFallback>
                            </Avatar>
                            
                            <div className={`flex-1 max-w-[70%] ${isOwnMessage ? 'items-end' : ''}`}>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium">
                                  {getUserName(message.user)}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                                </span>
                              </div>
                              
                              <div className="relative group">
                                <div
                                  className={`rounded-lg px-4 py-2 ${
                                    isOwnMessage
                                      ? 'bg-primary text-primary-foreground'
                                      : 'bg-muted'
                                  }`}
                                >
                                  <p className="text-sm whitespace-pre-wrap break-words">
                                    {message.message}
                                  </p>
                                </div>
                                
                                {/* Reaction Bar */}
                                <div className="absolute -bottom-3 left-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <div className="flex items-center gap-1 bg-background border rounded-full px-1 py-0.5 shadow-sm">
                                    {REACTION_EMOJIS.slice(0, 4).map(({ emoji, label }) => (
                                      <Tooltip key={emoji}>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 w-6 p-0 hover:bg-muted"
                                            onClick={() => addReaction(message.id, emoji)}
                                          >
                                            {emoji}
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>{label}</TooltipContent>
                                      </Tooltip>
                                    ))}
                                    
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-6 w-6 p-0 hover:bg-muted"
                                        >
                                          <MoreVertical className="h-3 w-3" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="start">
                                        {REACTION_EMOJIS.map(({ emoji, label }) => (
                                          <DropdownMenuItem
                                            key={emoji}
                                            onClick={() => addReaction(message.id, emoji)}
                                          >
                                            <span className="mr-2">{emoji}</span> {label}
                                          </DropdownMenuItem>
                                        ))}
                                        {!isOwnMessage && (
                                          <>
                                            <Separator className="my-1" />
                                            <DropdownMenuItem
                                              onClick={() => reportMessage(message.id)}
                                              className="text-destructive"
                                            >
                                              <Flag className="h-3 w-3 mr-2" />
                                              Report
                                            </DropdownMenuItem>
                                          </>
                                        )}
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </div>
                                
                                {/* Display Reactions */}
                                {Object.keys(groupedReactions).length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {Object.entries(groupedReactions).map(([emoji, reactions]) => {
                                      const hasReacted = reactions.some(r => r.user_id === user.id);
                                      
                                      return (
                                        <Tooltip key={emoji}>
                                          <TooltipTrigger asChild>
                                            <Button
                                              variant={hasReacted ? "default" : "outline"}
                                              size="sm"
                                              className="h-6 px-2 text-xs"
                                              onClick={() => addReaction(message.id, emoji)}
                                            >
                                              <span className="mr-1">{emoji}</span>
                                              {reactions.length}
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <div className="text-xs">
                                              {reactions.map(r => getUserName(r.user)).join(', ')}
                                            </div>
                                          </TooltipContent>
                                        </Tooltip>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
              </CardContent>

              <CardContent className="flex-shrink-0 border-t p-4">
                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    disabled={isSending}
                    className="flex-1"
                    maxLength={500}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage(e as React.FormEvent);
                      }
                    }}
                  />
                  <Button onClick={sendMessage} disabled={isSending || !newMessage.trim()}>
                    {isSending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Messages are cleared daily at 2:38 AM
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Active Members Sidebar */}
          <div className="hidden lg:block">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Active Pack Members
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[calc(100vh-16rem)]">
                  <div className="space-y-3">
                    {activeMembers.map((member) => (
                      <div key={member.user_id} className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={member.avatar_url} />
                            <AvatarFallback className="text-xs">
                              {getUserInitials(member)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full border border-background" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {getUserName(member)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(member.last_active), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
