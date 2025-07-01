'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send, Shield, UserX, WifiOff, Wifi } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useUser } from '@/hooks/useUser';
import { toast } from 'sonner';
import { sanitizeMessage, detectSpam, checkRateLimit } from '@/lib/utils/input-sanitization';
import { AvatarWithFallback, preloadImages } from '@/components/shared/ImageWithFallback';

// Fixed interface to match actual wolf_private_messages table schema
interface PrivateMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  image_url?: string | null;
  is_read: boolean | null;
  created_at: string | null;
  read_at?: string | null;
  is_deleted: boolean | null;
  flagged: boolean | null;
  flag_reason?: string | null;
  flagged_by?: string | null;
  flagged_at?: string | null;
  image_id?: string | null;
  // Fixed: Use sender_user instead of from_user to match actual foreign key
  sender_user?: {
    display_name: string | null;
    wolf_emoji: string | null;
    profile_image_url?: string | null;
  } | null;
}

interface ChatUser {
  id: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  role?: string | null;
  display_name?: string | null;
  wolf_emoji?: string | null;
  vibe_status?: string | null;
  profile_image_url?: string | null;
  allow_messages?: boolean | null;
  bio?: string | null;
  favorite_drink?: string | null;
  is_profile_visible?: boolean | null;
}

// Debounce helper for real-time updates
function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay]
  ) as T;

  return debouncedCallback;
}

export default function OptimizedPrivateChatPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useUser();
  
  const otherUserId = params.userId as string;
  const otherUserName = searchParams.get('name') || 'Wolf';
  
  const [messages, setMessages] = useState<PrivateMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [otherUser, setOtherUser] = useState<ChatUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Debounced message update handler
  const handleNewMessage = useDebouncedCallback((newMsg: PrivateMessage) => {
    setMessages(prev => [...prev, newMsg]);
    scrollToBottom();
    
    // Mark as read if it's from the other user
    if (newMsg.sender_id === otherUserId) {
      supabase
        .from('wolf_private_messages')
        .update({ 
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', newMsg.id)
        .then();
    }
  }, 500);

  // Load chat data with parallel queries and timeout protection
  useEffect(() => {
    async function loadChatData() {
      if (!user || !otherUserId) return;

      try {
        setIsLoading(true);

        // Parallel queries with timeout protection
        const [userResult, blockResult, messagesResult] = await Promise.allSettled([
          // Load other user's profile
          Promise.race([
            supabase
              .from('users')
              .select(`
                id, email, first_name, last_name, role,
                display_name, wolf_emoji, vibe_status,
                profile_image_url, allow_messages, bio,
                favorite_drink, is_profile_visible
              `)
              .eq('id', otherUserId)
              .single(),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('User query timeout')), 5000)
            )
          ]),
          
          // Check block status
          Promise.race([
            supabase
              .from('wolf_pack_interactions')
              .select('*')
              .in('interaction_type', ['block'])
              .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
              .eq('status', 'active'),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Block query timeout')), 3000)
            )
          ]),
          
          // Load messages
          Promise.race([
            supabase
              .from('wolf_private_messages')
              .select(`
                *,
                sender_user:users!wolf_private_messages_sender_id_fkey(
                  display_name,
                  wolf_emoji,
                  profile_image_url
                )
              `)
              .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
              .eq('is_deleted', false)
              .order('created_at', { ascending: true })
              .limit(100),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Messages query timeout')), 5000)
            )
          ])
        ]);

        // Handle user data
        if (userResult.status === 'fulfilled') {
          const { data: userData, error: userError } = userResult.value as any;
          
          if (userError || !userData) {
            console.error('Error loading user:', userError);
            toast.error('User not found');
            router.back();
            return;
          }

          setOtherUser(userData);

          // Check if messaging is allowed
          if (userData.allow_messages === false) {
            toast.error('This user has disabled private messages');
            router.back();
            return;
          }

          // Preload user avatar if available
          if (userData.profile_image_url) {
            preloadImages([userData.profile_image_url]).catch(() => {
              console.warn('Failed to preload user avatar');
            });
          }
        } else {
          console.error('Failed to load user data');
          toast.error('Failed to load user profile');
          router.back();
          return;
        }

        // Handle block status
        if (blockResult.status === 'fulfilled') {
          const { data: blockData } = blockResult.value as any;
          if (blockData && blockData.length > 0) {
            setIsBlocked(true);
            return;
          }
        }

        // Handle messages
        if (messagesResult.status === 'fulfilled') {
          const { data: messageData } = messagesResult.value as any;
          if (messageData) {
            setMessages(messageData);
            
            // Mark unread messages as read
            const unreadMessages = messageData.filter(
              (msg: PrivateMessage) => msg.sender_id === otherUserId && !msg.is_read
            );

            if (unreadMessages.length > 0) {
              await supabase
                .from('wolf_private_messages')
                .update({ 
                  is_read: true,
                  read_at: new Date().toISOString()
                })
                .in('id', unreadMessages.map((msg: PrivateMessage) => msg.id));
            }
          }
        }

        setIsBlocked(false);

      } catch (error) {
        console.error('Error loading chat data:', error);
        toast.error('Failed to load chat');
      } finally {
        setIsLoading(false);
      }
    }

    loadChatData();

    // Set up real-time subscription with connection monitoring
    if (user && otherUserId) {
      const channel = supabase
        .channel(`private_chat_${user.id}_${otherUserId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'wolf_private_messages',
            filter: `or(and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id}))`
          },
          (payload) => {
            try {
              const newMsg = payload.new as PrivateMessage;
              handleNewMessage(newMsg);
            } catch (error) {
              console.error('Error handling real-time message:', error);
            }
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            setIsOnline(true);
            console.log('Successfully subscribed to private messages');
          } else if (status === 'CHANNEL_ERROR') {
            setIsOnline(false);
            console.error('Error subscribing to private messages');
          } else if (status === 'TIMED_OUT') {
            setIsOnline(false);
            console.error('Subscription timed out');
          }
        });

      return () => {
        channel.unsubscribe();
      };
    }
  }, [user, otherUserId, router, handleNewMessage]);

  // Send message with improved error handling
  const sendMessage = async () => {
    if (!user || !newMessage.trim() || isSending || isBlocked) return;

    try {
      setIsSending(true);

      // Rate limiting check
      if (!checkRateLimit(user.id, 10, 60000)) {
        toast.error('Please slow down - too many messages');
        return;
      }

      // Sanitize and validate the message
      const sanitizedMessage = sanitizeMessage(newMessage, {
        maxLength: 500,
        allowLineBreaks: true,
        trimWhitespace: true
      });

      if (!sanitizedMessage) {
        toast.error('Message cannot be empty');
        return;
      }

      // Check for spam content
      if (detectSpam(sanitizedMessage)) {
        toast.error('Message appears to contain spam or inappropriate content');
        return;
      }

      const { error } = await supabase
        .from('wolf_private_messages')
        .insert({
          sender_id: user.id,
          receiver_id: otherUserId,
          message: sanitizedMessage,
          is_read: false,
          is_deleted: false,
          flagged: false,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error sending message:', error);
        throw error;
      }

      setNewMessage('');
      toast.success('Message sent!');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  // Block user with proper error handling
  const blockUser = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('wolf_pack_interactions')
        .upsert({
          sender_id: user.id,
          receiver_id: otherUserId,
          interaction_type: 'block',
          status: 'active',
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      toast.success('User blocked');
      router.back();
    } catch (error) {
      console.error('Error blocking user:', error);
      toast.error('Failed to block user');
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 max-w-2xl">
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading chat...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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

  const displayName = otherUser?.display_name || 
                     `${otherUser?.first_name || ''} ${otherUser?.last_name || ''}`.trim() ||
                     otherUserName;

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <Card className="h-[80vh] flex flex-col">
        {/* Chat Header */}
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              
              <AvatarWithFallback
                src={otherUser?.profile_image_url}
                name={displayName}
                emoji={otherUser?.wolf_emoji}
                size="md"
              />
              
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg">
                    {displayName}
                  </CardTitle>
                  {!isOnline && (
                    <WifiOff className="h-3 w-3 text-muted-foreground" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {otherUser?.vibe_status || otherUser?.bio || 'Wolf Pack Member'}
                </p>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={blockUser}
              className="text-destructive hover:text-destructive"
            >
              <UserX className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        {/* Messages */}
        <CardContent className="flex-1 overflow-y-auto space-y-4 pb-4">
          {messages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Start a conversation with {displayName}!</p>
              {otherUser?.favorite_drink && (
                <p className="text-xs mt-1">🍹 Favorite drink: {otherUser.favorite_drink}</p>
              )}
            </div>
          ) : (
            <>
              {messages.map((message) => {
                const isMyMessage = message.sender_id === user?.id;
                const senderInfo = isMyMessage ? null : message.sender_user;
                
                return (
                  <div
                    key={message.id}
                    className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'} items-end gap-2`}
                  >
                    {!isMyMessage && (
                      <AvatarWithFallback
                        src={senderInfo?.profile_image_url || otherUser?.profile_image_url}
                        name={senderInfo?.display_name || displayName}
                        emoji={senderInfo?.wolf_emoji || otherUser?.wolf_emoji}
                        size="sm"
                        className="mb-1"
                      />
                    )}
                    
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        isMyMessage
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                      <div className="flex justify-between items-center mt-1">
                        <p className={`text-xs ${
                          isMyMessage ? 'text-primary-foreground/70' : 'text-muted-foreground'
                        }`}>
                          {message.created_at ? new Date(message.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : 'Unknown time'}
                        </p>
                        {isMyMessage && (
                          <span className={`text-xs ${
                            message.is_read ? 'text-primary-foreground/70' : 'text-primary-foreground/50'
                          }`}>
                            {message.is_read ? '✓✓' : '✓'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </CardContent>

        {/* Connection Status Bar */}
        {!isOnline && (
          <div className="px-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 flex items-center gap-2">
            <WifiOff className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            <p className="text-xs text-yellow-600 dark:text-yellow-400">
              Connection lost. Messages will be sent when reconnected.
            </p>
          </div>
        )}

        {/* Message Input */}
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={isOnline ? "Type your message..." : "Reconnecting..."}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              disabled={isSending || !isOnline}
              maxLength={500}
            />
            <Button
              onClick={sendMessage}
              disabled={!newMessage.trim() || isSending || !isOnline}
              size="sm"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {newMessage.length}/500 characters
          </p>
        </div>
      </Card>
    </div>
  );
}