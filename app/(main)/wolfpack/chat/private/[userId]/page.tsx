'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Send, Shield, UserX } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useUser } from '@/hooks/useUser';
import { toast } from 'sonner';
import { sanitizeMessage, detectSpam, checkRateLimit } from '@/lib/utils/input-sanitization';

// Updated interface to match wolf_private_messages table schema
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
  from_user?: {
    display_name: string | null;
    wolf_emoji: string | null;
    profile_image_url?: string | null;
  } | null;
}

// Updated interface to match actual users table schema
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

export default function PrivateChatPage() {
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

  // Load chat data
  useEffect(() => {
    async function loadChatData() {
      if (!user || !otherUserId) return;

      try {
        setIsLoading(true);

        // Load other user's profile from users table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select(`
            id,
            email,
            first_name,
            last_name,
            role,
            display_name,
            wolf_emoji,
            vibe_status,
            profile_image_url,
            allow_messages,
            bio,
            favorite_drink,
            is_profile_visible
          `)
          .eq('id', otherUserId)
          .single();

        if (userError) {
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

        // Check if either user has blocked the other
        const { data: blockData, error: blockError } = await supabase
          .from('wolf_pack_interactions')
          .select('*')
          .in('interaction_type', ['block'])
          .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
          .eq('status', 'active');

        if (blockError) {
          console.error('Error checking block status:', blockError);
        }

        if (blockData && blockData.length > 0) {
          setIsBlocked(true);
          return;
        }

        // Load existing messages
        const { data: messageData, error: messageError } = await supabase
          .from('wolf_private_messages')
          .select(`
            *,
            from_user:users!wolf_private_messages_sender_id_fkey(
              display_name,
              wolf_emoji,
              profile_image_url
            )
          `)
          .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
          .eq('is_deleted', false)
          .order('created_at', { ascending: true });

        if (messageError) {
          console.error('Error loading messages:', messageError);
        } else {
          setMessages(messageData || []);
        }

        // Mark messages from other user as read
        if (messageData && messageData.length > 0) {
          const unreadMessages = messageData.filter(
            msg => msg.sender_id === otherUserId && !msg.is_read
          );

          if (unreadMessages.length > 0) {
            await supabase
              .from('wolf_private_messages')
              .update({ 
                is_read: true,
                read_at: new Date().toISOString()
              })
              .in('id', unreadMessages.map(msg => msg.id));
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

    // Set up real-time subscription for new messages
    if (user && otherUserId) {
      const messagesSubscription = supabase
        .channel(`private_chat_${user.id}_${otherUserId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'wolf_private_messages',
            filter: `or(and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id}))`
          },
          (payload: { new: PrivateMessage }) => {
            const newMsg = payload.new as PrivateMessage;
            setMessages(prev => [...prev, newMsg]);
            
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
          }
        )
        .subscribe();

      return () => {
        messagesSubscription.unsubscribe();
      };
    }
  }, [user, otherUserId, router]);

  // Send message using correct wolf_private_messages schema
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
          flagged: false
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

  // Block user using correct wolf_pack_interactions schema
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
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
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

  const avatarFallback = otherUser?.wolf_emoji || 
                        otherUser?.display_name?.charAt(0)?.toUpperCase() ||
                        otherUser?.first_name?.charAt(0)?.toUpperCase() ||
                        'W';

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
              
              <Avatar className="h-10 w-10">
                <AvatarImage src={otherUser?.profile_image_url || undefined} />
                <AvatarFallback>
                  {avatarFallback}
                </AvatarFallback>
              </Avatar>
              
              <div>
                <CardTitle className="text-lg">
                  {displayName}
                </CardTitle>
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
            messages.map((message) => {
              const isMyMessage = message.sender_id === user?.id;
              return (
                <div
                  key={message.id}
                  className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}
                >
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
            })
          )}
        </CardContent>

        {/* Message Input */}
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              disabled={isSending}
              maxLength={500}
            />
            <Button
              onClick={sendMessage}
              disabled={!newMessage.trim() || isSending}
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