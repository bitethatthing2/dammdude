"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Trophy, 
  Users, 
  Clock, 
  Vote,
  Music,
  Star,
  Crown,
  Zap,
  PartyPopper
} from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/AuthContext';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface EventContestant {
  id: string;
  user_id: string;
  display_name: string;
  avatar_url?: string;
  wolf_emoji?: string;
  votes: number;
}

interface LiveEvent {
  id: string;
  title: string;
  description: string;
  event_type: 'freestyle_friday' | 'rap_battle' | 'costume_contest' | 'karaoke' | 'dance_off' | 'trivia';
  status: 'active' | 'voting' | 'ended';
  location_id: string;
  dj_user_id: string;
  dj_name: string;
  duration_minutes: number;
  max_contestants: number;
  created_at: string;
  ends_at: string;
  contestants: EventContestant[];
  total_votes: number;
  user_voted: boolean;
  winner_id?: string;
}

interface LiveEventsDisplayProps {
  locationId: string;
  userId: string;
}

interface SupabaseEvent {
  id: string;
  title: string;
  description: string;
  event_type: string;
  status: string;
  location_id: string;
  dj_user_id: string;
  duration_minutes: number;
  max_contestants: number;
  created_at: string;
  ends_at: string;
  winner_id?: string;
  dj_profiles?: {
    display_name: string;
  };
  dj_event_contestants?: EventContestant[];
  dj_event_votes?: Array<{
    contestant_id: string;
    voter_id: string;
  }>;
}

const EVENT_EMOJIS = {
  freestyle_friday: '🎤',
  rap_battle: '⚔️',
  costume_contest: '🎭',
  karaoke: '🎵',
  dance_off: '💃',
  trivia: '🧠'
};

const EVENT_COLORS = {
  freestyle_friday: 'from-purple-500 to-pink-500',
  rap_battle: 'from-red-500 to-orange-500',
  costume_contest: 'from-blue-500 to-cyan-500',
  karaoke: 'from-green-500 to-emerald-500',
  dance_off: 'from-yellow-500 to-orange-500',
  trivia: 'from-indigo-500 to-purple-500'
};

export function LiveEventsDisplay({ locationId, userId }: LiveEventsDisplayProps) {
  const { user } = useAuth();
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [votingFor, setVotingFor] = useState<string | null>(null);

  const supabase = getSupabaseBrowserClient();

  // Load active events
  useEffect(() => {
    async function loadEvents() {
      try {
        setIsLoading(true);

        // Get active events for this location
        const { data: eventsData, error: eventsError } = await supabase
          .from('dj_events')
          .select(`
            *,
            dj_profiles!dj_events_dj_user_id_fkey (
              display_name
            ),
            dj_event_contestants (
              id,
              user_id,
              display_name,
              avatar_url,
              wolf_emoji,
              votes
            ),
            dj_event_votes!left (
              contestant_id,
              voter_id
            )
          `)
          .eq('location_id', locationId)
          .in('status', ['active', 'voting'])
          .order('created_at', { ascending: false });

        if (eventsError) throw eventsError;

        // Process events data
        const processedEvents: LiveEvent[] = (eventsData || []).map((event: SupabaseEvent) => {
          const eventVotes = Array.isArray(event.dj_event_votes) ? event.dj_event_votes : [];
          const eventContestants = Array.isArray(event.dj_event_contestants) ? event.dj_event_contestants : [];
          
          const userVoted = eventVotes.some((vote) => vote.voter_id === userId) || false;
          const totalVotes = eventContestants.reduce((sum: number, contestant) => sum + (contestant.votes || 0), 0) || 0;

          return {
            id: event.id,
            title: event.title,
            description: event.description,
            event_type: event.event_type as LiveEvent['event_type'],
            status: event.status as LiveEvent['status'],
            location_id: event.location_id,
            dj_user_id: event.dj_user_id,
            dj_name: event.dj_profiles?.display_name || 'DJ',
            duration_minutes: event.duration_minutes,
            max_contestants: event.max_contestants,
            created_at: event.created_at,
            ends_at: event.ends_at,
            contestants: eventContestants,
            total_votes: totalVotes,
            user_voted: userVoted,
            winner_id: event.winner_id
          };
        });

        setEvents(processedEvents);

      } catch (error) {
        console.error('Error loading events:', error);
        toast.error('Failed to load live events');
      } finally {
        setIsLoading(false);
      }
    }

    if (locationId) {
      loadEvents();

      // Set up real-time subscription for events
      const eventsSubscription = supabase
        .channel(`live_events_${locationId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'dj_events',
            filter: `location_id=eq.${locationId}`
          },
          () => {
            loadEvents(); // Reload when events change
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'dj_event_votes'
          },
          () => {
            loadEvents(); // Reload when votes change
          }
        )
        .subscribe();

      return () => {
        eventsSubscription.unsubscribe();
      };
    }
  }, [locationId, userId, supabase]);

  // Vote for contestant
  const voteForContestant = async (eventId: string, contestantId: string) => {
    if (!user || votingFor) return;

    try {
      setVotingFor(contestantId);

      const { error } = await supabase
        .from('dj_event_votes')
        .insert({
          event_id: eventId,
          contestant_id: contestantId,
          voter_id: user.id,
          location_id: locationId,
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      // Update local state optimistically
      setEvents(prev => prev.map(event => {
        if (event.id === eventId) {
          return {
            ...event,
            user_voted: true,
            contestants: event.contestants.map(c => 
              c.id === contestantId 
                ? { ...c, votes: c.votes + 1 }
                : c
            ),
            total_votes: event.total_votes + 1
          };
        }
        return event;
      }));

      toast.success('Vote cast! 🗳️');

    } catch (error) {
      console.error('Error voting:', error);
      toast.error('Failed to cast vote');
    } finally {
      setVotingFor(null);
    }
  };

  // Format time remaining
  const getTimeRemaining = (endsAt: string) => {
    const now = new Date();
    const end = new Date(endsAt);
    const diffMs = end.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins <= 0) return 'Ending soon';
    if (diffMins < 60) return `${diffMins}m left`;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}h ${mins}m left`;
  };

  // Get event status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'voting': return 'bg-blue-500';
      case 'ended': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-muted-foreground">Loading live events...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (events.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Live Events & Contests
          </CardTitle>
          <CardDescription>
            No live events right now. Check back later for DJ-hosted contests!
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <PartyPopper className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-4">
            The DJ will create interactive events throughout the night
          </p>
          <div className="text-sm text-muted-foreground">
            <p>• Freestyle Fridays</p>
            <p>• Rap Battles</p>
            <p>• Costume Contests</p>
            <p>• And more!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Trophy className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Live Events & Contests</h2>
        <Badge variant="destructive" className="animate-pulse">LIVE</Badge>
      </div>

      <AnimatePresence>
        {events.map((event, index) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card className={`overflow-hidden border-2 ${event.status === 'active' ? 'border-green-500/50' : 'border-blue-500/50'}`}>
              {/* Event Header */}
              <div className={`bg-gradient-to-r ${EVENT_COLORS[event.event_type]} p-4 text-white`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">
                      {EVENT_EMOJIS[event.event_type]}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{event.title}</h3>
                      <p className="text-sm opacity-90">{event.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary" className="mb-2">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(event.status)} mr-2`}></div>
                      {event.status.toUpperCase()}
                    </Badge>
                    <div className="text-sm opacity-90">
                      <div className="flex items-center gap-1">
                        <Music className="h-3 w-3" />
                        DJ {event.dj_name}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {getTimeRemaining(event.ends_at)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <CardContent className="p-6">
                {/* Event Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{event.contestants.length}</div>
                    <div className="text-sm text-muted-foreground">Contestants</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{event.total_votes}</div>
                    <div className="text-sm text-muted-foreground">Total Votes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{event.duration_minutes}m</div>
                    <div className="text-sm text-muted-foreground">Duration</div>
                  </div>
                </div>

                {/* Contestants & Voting */}
                {event.contestants.length > 0 ? (
                  <div className="space-y-4">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Contestants
                      {event.status === 'voting' && !event.user_voted && (
                        <Badge variant="outline" className="animate-pulse">Vote Now!</Badge>
                      )}
                    </h4>

                    <div className="grid gap-4">
                      {event.contestants
                        .sort((a, b) => b.votes - a.votes)
                        .map((contestant, contestantIndex) => {
                          const votePercentage = event.total_votes > 0 
                            ? (contestant.votes / event.total_votes) * 100 
                            : 0;
                          const isWinner = event.winner_id === contestant.id;
                          const isLeading = contestantIndex === 0 && contestant.votes > 0;

                          return (
                            <div
                              key={contestant.id}
                              className={`p-4 border rounded-lg transition-all hover:scale-102 ${
                                isWinner 
                                  ? 'border-yellow-500 bg-yellow-50 shadow-lg' 
                                  : isLeading 
                                    ? 'border-green-500 bg-green-50' 
                                    : 'border-border hover:border-primary/50'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  {isWinner && <Crown className="h-5 w-5 text-yellow-500" />}
                                  {isLeading && !isWinner && <Star className="h-5 w-5 text-green-500" />}
                                  
                                  <Avatar className="h-10 w-10">
                                    <AvatarImage src={contestant.avatar_url} />
                                    <AvatarFallback>
                                      {contestant.wolf_emoji || contestant.display_name?.charAt(0)?.toUpperCase() || 'W'}
                                    </AvatarFallback>
                                  </Avatar>
                                  
                                  <div>
                                    <div className="font-medium flex items-center gap-2">
                                      {contestant.display_name}
                                      {isWinner && <span className="text-yellow-500">👑</span>}
                                      {isLeading && !isWinner && <span className="text-green-500">🔥</span>}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      {contestant.votes} votes ({votePercentage.toFixed(1)}%)
                                    </div>
                                  </div>
                                </div>

                                {event.status === 'voting' && !event.user_voted && !isWinner && (
                                  <Button
                                    onClick={() => voteForContestant(event.id, contestant.id)}
                                    disabled={votingFor === contestant.id}
                                    size="sm"
                                    className="ml-4"
                                  >
                                    {votingFor === contestant.id ? (
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    ) : (
                                      <>
                                        <Vote className="h-4 w-4 mr-1" />
                                        Vote
                                      </>
                                    )}
                                  </Button>
                                )}
                              </div>

                              {/* Simple Vote Progress Bar */}
                              {event.total_votes > 0 && (
                                <div className="mt-3">
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                      className="bg-primary h-2 rounded-full transition-all duration-300"
                                      style={{ width: `${votePercentage}%` }}
                                    ></div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>

                    {/* Voting Status */}
                    {event.user_voted ? (
                      <Alert>
                        <Zap className="h-4 w-4" />
                        <AlertDescription>
                          Thanks for voting! Results will be announced when the event ends.
                        </AlertDescription>
                      </Alert>
                    ) : event.status === 'voting' ? (
                      <Alert>
                        <Vote className="h-4 w-4" />
                        <AlertDescription>
                          Voting is open! Cast your vote for your favorite contestant.
                        </AlertDescription>
                      </Alert>
                    ) : null}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Waiting for contestants to join...</p>
                    <p className="text-sm">The DJ will select participants from the Wolf Pack</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
