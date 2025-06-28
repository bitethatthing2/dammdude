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
  from_user_id: string;
  to_user_id: string;
  message: string;
  image_url?: string | null;
  is_read: boolean | null;
  created_at: string;
  read_at?: string | null;
  is_deleted: boolean | null;
  flagged: boolean | null;
  flag_reason?: string | null;
  flagged_by?: string | null;
  flagged_at?: string | null;
  image_id?: string | null;
  from_user?: {
    wolf_profiles?: {
      display_name: string | null;
      wolf_emoji: string | null;
      profile_image_url?: string | null;
    } | null;
  } | null;
}

// Updated interface to match users + wolf_profiles schema
interface ChatUser {
  id: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  role?: string | null;
  wolf_profiles?: {
    display_name: string | null;
    wolf_emoji: string | null;
    current_vibe: string | null;
    profile_image_url?: string | null;
    allow_messages: boolean | null;
  } | null;
}

// Updated interface to match wolf_pack_interactions schema

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
  const [isBlocked, setIsBlocked] = useState(false);  // Load chat data
  useEffect(() => {
    async function loadChatData() {
      if (!user || !otherUserId) return;

      try {
        setIsLoading(true);

        // Load other user's profile
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select(`
            *,
            wolf_profiles (
              display_name,
              wolf_emoji,
              current_vibe,
              profile_image_url,
              allow_messages
            )
          `)
          .eq('id', otherUserId)
          .single();

        if (userError) throw userError;
        // Defensive check: only assign wolf_profiles if it's an object (not an error)
        let wolfProfileObj = null;
        if (
          userData.wolf_profiles &&
          typeof userData.wolf_profiles === 'object' &&
          !('code' in userData.wolf_profiles) // not a SelectQueryError
        ) {
          wolfProfileObj = userData.wolf_profiles;
        }
        setOtherUser({
          ...userData,
          first_name: userData.first_name ?? undefined,
          last_name: userData.last_name ?? undefined,
          wolf_profiles: wolfProfileObj
        });

        // Check if messaging is allowed (handle potential query error)
        const wolfProfile = Array.isArray(userData.wolf_profiles) ? userData.wolf_profiles[0] : userData.wolf_profiles;
        if (wolfProfile && typeof wolfProfile === 'object' && 'allow_messages' in wolfProfile && !wolfProfile.allow_messages) {
          toast.error('This user has disabled private messages');
          router.back();
          return;
        }

        // Skip interaction and message checks for now - tables missing from schema
        // TODO: Backend team needs to add wolf_pack_interactions and wolf_private_messages tables
        
        setIsBlocked(false);
        setMessages([]);
        
        // Use placeholder data until backend implements private messaging tables
        console.warn('Private messaging tables not available in current schema');

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
            table: 'wolf_private_messages'
          },
          (payload: { new: PrivateMessage }) => {
            const newMsg = payload.new as PrivateMessage;
            if (
              (newMsg.from_user_id === user.id && newMsg.to_user_id === otherUserId) ||
              (newMsg.from_user_id === otherUserId && newMsg.to_user_id === user.id)
            ) {
              setMessages(prev => [...prev, newMsg]);
              
              // Mark as read if it's from the other user
              if (newMsg.from_user_id === otherUserId) {
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
          }
        )
        .subscribe();

      return () => {
        messagesSubscription.unsubscribe();
      };
    }
  }, [user, otherUserId, supabase, router]);

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
          from_user_id: user.id,
          to_user_id: otherUserId,
          message: sanitizedMessage,
          is_read: false,
          is_deleted: false,
          flagged: false,
          is_flirt_message: false
        });

      if (error) throw error;

      setNewMessage('');
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
          from_user_id: user.id,
          to_user_id: otherUserId,
          interaction_type: 'block',
          is_flirt: false
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
                <AvatarImage src={otherUser?.wolf_profiles?.profile_image_url || undefined} />
                <AvatarFallback>
                  {otherUser?.wolf_profiles?.wolf_emoji || 
                   otherUser?.wolf_profiles?.display_name?.charAt(0)?.toUpperCase() || 
                   'W'}
                </AvatarFallback>
              </Avatar>
              
              <div>
                <CardTitle className="text-lg">
                  {otherUser?.wolf_profiles?.display_name || otherUserName}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {otherUser?.wolf_profiles?.current_vibe || 'Wolf Pack Member'}
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
              <p>Start a conversation with {otherUser?.wolf_profiles?.display_name || otherUserName}!</p>
            </div>
          ) : (
            messages.map((message) => {
              const isMyMessage = message.from_user_id === user?.id;
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
                    <p className="text-sm">{message.message}</p>
                    <div className="flex justify-between items-center mt-1">
                      <p className={`text-xs ${
                        isMyMessage ? 'text-primary-foreground/70' : 'text-muted-foreground'
                      }`}>
                        {new Date(message.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
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
            />
            <Button
              onClick={sendMessage}
              disabled={!newMessage.trim() || isSending}
              size="sm"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}