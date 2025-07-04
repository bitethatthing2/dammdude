'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Users, MapPin, Globe } from 'lucide-react';

// Types matching the actual database schema
interface ChatSession {
  id: string;
  location_id: string | null;
  display_name: string;
  description: string | null;
  icon: string | null;
  is_active: boolean;
  created_at: string;
  current_participants?: number;
  recent_message_count?: number;
}

interface WolfpackChatChannelsProps {
  currentUserId: string | null;
  userLocationId: string | null;
  onJoinChat: (sessionId: string, sessionName: string) => void;
  className?: string;
}

export default function WolfpackChatChannels({
  currentUserId,
  userLocationId,
  onJoinChat,
  className = ''
}: WolfpackChatChannelsProps) {
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joiningSession, setJoiningSession] = useState<string | null>(null);

  // Load available chat sessions
  useEffect(() => {
    loadChatSessions();
  }, []);

  const loadChatSessions = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get all active chat sessions
      const { data: sessions, error: sessionsError } = await supabase
        .from('wolfpack_chat_sessions')
        .select('*')
        .eq('is_active', true)
        .order('display_name');

      if (sessionsError) {
        throw sessionsError;
      }

      // For each session, get participant count and recent message count
      const sessionsWithStats = await Promise.all(
        (sessions || []).map(async (session) => {
          try {
            // Get recent message count (last 24 hours)
            const { count: messageCount } = await supabase
              .from('wolfpack_chat_messages')
              .select('*', { count: 'exact', head: true })
              .eq('session_id', session.id)
              .eq('is_deleted', false)
              .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

            return {
              ...session,
              recent_message_count: messageCount || 0
            };
          } catch (err) {
            console.warn(`Failed to get stats for session ${session.id}:`, err);
            return {
              ...session,
              recent_message_count: 0
            };
          }
        })
      );

      setChatSessions(sessionsWithStats);
    } catch (err) {
      console.error('Error loading chat sessions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load chat sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinChat = async (session: ChatSession) => {
    if (!currentUserId) {
      setError('Authentication required to join chat');
      return;
    }

    try {
      setJoiningSession(session.id);
      setError(null);

      // Call the parent handler to join the chat
      onJoinChat(session.id, session.display_name);
      
    } catch (err) {
      console.error('Error joining chat:', err);
      setError(err instanceof Error ? err.message : 'Failed to join chat');
    } finally {
      setJoiningSession(null);
    }
  };

  const getSessionIcon = (session: ChatSession) => {
    if (session.icon) {
      return session.icon;
    }
    
    // Default icons based on session type
    if (session.id === 'general') return '🌐';
    if (session.location_id) return '📍';
    return '💬';
  };

  const getSessionType = (session: ChatSession) => {
    if (session.id === 'general') return 'Global';
    if (session.location_id === userLocationId) return 'Your Location';
    if (session.location_id) return 'Location';
    return 'Public';
  };

  const getSessionTypeColor = (session: ChatSession) => {
    if (session.id === 'general') return 'bg-blue-100 text-blue-800';
    if (session.location_id === userLocationId) return 'bg-green-100 text-green-800';
    if (session.location_id) return 'bg-orange-100 text-orange-800';
    return 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Wolfpack Chat Channels
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-gray-200 rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Wolfpack Chat Channels
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-red-600 mb-4">Failed to load chat channels</p>
            <p className="text-sm text-gray-500 mb-4">{error}</p>
            <Button onClick={loadChatSessions} variant="outline" size="sm">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (chatSessions.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Wolfpack Chat Channels
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <MessageCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 mb-2">No chat channels available</p>
            <p className="text-sm text-gray-500">Check back later for active channels</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Wolfpack Chat Channels
          <Badge variant="secondary" className="ml-auto">
            {chatSessions.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {chatSessions.map((session) => (
            <div
              key={session.id}
              className="border rounded-lg p-4 hover:border-blue-300 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="text-2xl">{getSessionIcon(session)}</div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {session.display_name}
                      </h3>
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${getSessionTypeColor(session)}`}
                      >
                        {getSessionType(session)}
                      </Badge>
                    </div>
                    
                    {session.description && (
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {session.description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      {session.recent_message_count !== undefined && (
                        <div className="flex items-center gap-1">
                          <MessageCircle className="h-3 w-3" />
                          <span>
                            {session.recent_message_count} message{session.recent_message_count !== 1 ? 's' : ''} today
                          </span>
                        </div>
                      )}
                      
                      {session.location_id && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span>Location-based</span>
                        </div>
                      )}
                      
                      {session.id === 'general' && (
                        <div className="flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          <span>All locations</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <Button
                  onClick={() => handleJoinChat(session)}
                  disabled={joiningSession === session.id || !currentUserId}
                  size="sm"
                  className="ml-3"
                >
                  {joiningSession === session.id ? (
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Joining...
                    </div>
                  ) : (
                    'Join Chat'
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
        
        {!currentUserId && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              🔐 Sign in to join Wolfpack chat channels
            </p>
          </div>
        )}
        
        <div className="mt-4 pt-3 border-t">
          <Button 
            onClick={loadChatSessions} 
            variant="ghost" 
            size="sm" 
            className="w-full"
          >
            Refresh Channels
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}