"use client";

import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Send, Shield, UserX } from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/useUser';
import { toast } from 'sonner';

interface PrivateMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  created_at: string;
  is_read: boolean;
  sender_profile?: {
    display_name: string;
    wolf_emoji: string;
    profile_image_url?: string;
  };
}

interface ChatUser {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: string;
  wolf_profiles?: {
    display_name: string;
    wolf_emoji: string;
    vibe_status: string;
    profile_image_url?: string;
    allow_messages: boolean;
  };
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

  const supabase = getSupabaseBrowserClient();

  // Load chat data
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
              vibe_status,
              profile_image_url,
              allow_messages
            )
          `)
          .eq('id', otherUserId)
          .single();

        if (userError) throw userError;
        setOtherUser(userData);

        // Check if messaging is allowed
        if (!userData.wolf_profiles?.allow_messages) {
          toast.error('This user has disabled private messages');
          router.back();
          return;
        }

        // Check if blocked
        const { data: blockData } = await supabase
          .from('wolf_pack_interactions')
          .select('id')
          .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId},interaction_type.eq.block),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id},interaction_type.eq.block)`)
          .limit(1);

        if (blockData && blockData.length > 0) {
          setIsBlocked(true);
          toast.error('Unable to message this user');
          return;
        }

        // Load messages
        const { data: messageData, error: messageError } = await supabase
          .from('wolf_pack_messages')
          .select(`
            *,
            sender:users!wolf_pack_messages_sender_id_fkey (
              wolf_profiles (
                display_name,
                wolf_emoji,
                profile_image_url
              )
            )
          `)
          .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
          .eq('message_type', 'private')
          .order('created_at', { ascending: true });

        if (messageError) throw messageError;
        setMessages(messageData || []);

        // Mark messages as read
        await supabase
          .from('wolf_pack_messages')
          .update({ is_read: true })
          .eq('receiver_id', user.id)
          .eq('sender_id', otherUserId)
          .eq('is_read', false);

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
            table: 'wolf_pack_messages',
            filter: `message_type=eq.private`
          },
          (payload: { new: PrivateMessage }) => {
            const newMsg = payload.new as PrivateMessage;
            if (
              (newMsg.sender_id === user.id && newMsg.receiver_id === otherUserId) ||
              (newMsg.sender_id === otherUserId && newMsg.receiver_id === user.id)
            ) {
              setMessages(prev => [...prev, newMsg]);
              
              // Mark as read if it's from the other user
              if (newMsg.sender_id === otherUserId) {
                supabase
                  .from('wolf_pack_messages')
                  .update({ is_read: true })
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

  // Send message
  const sendMessage = async () => {
    if (!user || !newMessage.trim() || isSending || isBlocked) return;

    try {
      setIsSending(true);

      const { error } = await supabase
        .from('wolf_pack_messages')
        .insert({
          sender_id: user.id,
          receiver_id: otherUserId,
          message: newMessage.trim(),
          message_type: 'private',
          created_at: new Date().toISOString()
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

  // Block user
  const blockUser = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('wolf_pack_interactions')
        .upsert({
          sender_id: user.id,
          receiver_id: otherUserId,
          interaction_type: 'block',
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
                <AvatarImage src={otherUser?.wolf_profiles?.profile_image_url} />
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
                  {otherUser?.wolf_profiles?.vibe_status || 'Wolf Pack Member'}
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
                    <p className="text-sm">{message.message}</p>
                    <p className={`text-xs mt-1 ${
                      isMyMessage ? 'text-primary-foreground/70' : 'text-muted-foreground'
                    }`}>
                      {new Date(message.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
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
