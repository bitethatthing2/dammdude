"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BackButton } from '@/components/shared/BackButton';
import { WolfpackRealTimeChat } from '@/components/wolfpack/WolfpackRealTimeChat';
import { 
  Users, 
  MessageCircle, 
  Calendar, 
  MapPin, 
  Sparkles, 
  Shield,
  Settings,
  Trophy,
  Brain,
  Music,
  Star,
  Heart,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useSimpleWolfpack } from '@/hooks/useSimpleWolfpack';
import { useWolfpackQuery, WolfpackMembershipWithProfile } from '@/hooks/useWolfpackQuery';
import { WolfpackDevWarning } from '@/components/wolfpack/WolfpackDevWarning';
import { trackFallbackUsage, trackDatabaseError } from '@/lib/utils/monitoring';
import { applyLocationFilter } from '@/lib/utils/supabaseHelpers';

interface WolfPackMember {
  id: string;
  user_id: string;
  display_name: string;
  avatar_url?: string;
  status: string;
  favorite_drink?: string;
  current_vibe?: string;
  looking_for?: string;
  table_location?: string;
  joined_at: string;
  location_name: string;
}

interface WolfpackEvent {
  id: string;
  title: string;
  type: 'contest' | 'trivia' | 'special';
  description: string;
  is_active: boolean;
  participant_count: number;
  location: string;  // Changed from location_id to location
  created_at: string;
  created_by?: string;
  ends_at?: string;
}

interface LocationData {
  id: string;
  name: string;
  address: string;
}

interface MembershipData {
  id: string;
  user_id: string;
  location_id: string;
  table_location: string | null;
  joined_at: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  locations: LocationData;
}

interface MemberQueryResult {
  id: string;
  user_id: string;
  table_location: string | null;
  joined_at: string;
  status: 'active' | 'inactive';
  locations: LocationData;
  wolf_profiles: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
    wolfpack_status: string | null;
    favorite_drink: string | null;
    current_vibe: string | null;
    looking_for: string | null;
  };
}

interface SimpleMemberResult {
  id: string;
  user_id: string;
  table_location: string | null;
  joined_at: string;
  status: 'active' | 'inactive';
  location_id: string | null;
  locations: LocationData;
}

export default function WolfPackChatPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { isInPack, isLoading: packLoading } = useSimpleWolfpack();
  const { queryWolfpackMembers, queryUserMembership, isUsingFallback } = useWolfpackQuery();
  
  const [packMembers, setPackMembers] = useState<WolfPackMember[]>([]);
  const [activeEvents, setActiveEvents] = useState<WolfpackEvent[]>([]);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [membershipData, setMembershipData] = useState<MembershipData | null>(null);
  const [selectedTab, setSelectedTab] = useState('chat');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = getSupabaseBrowserClient();

  // Track fallback usage for monitoring
  useEffect(() => {
    trackFallbackUsage('WolfPackChatPage', isUsingFallback);
  }, [isUsingFallback]);

  // Load wolfpack data
  useEffect(() => {
    async function loadWolfpackData() {
      if (!user || !isInPack) return;

      try {
        setIsLoading(true);
        setError(null);

        // Get current user's membership data
        const { data: membership, error: membershipError } = await supabase
          .from('wolfpack_memberships')
          .select(`
            *,
            locations(
              id,
              name,
              address
            )
          `)
          .eq('user_id', user.id)
          .eq('status', 'active')
          .maybeSingle();

        if (membershipError) {
          console.error('Error loading membership:', membershipError);
          throw membershipError;
        }

        if (!membership) {
          throw new Error('No active membership found');
        }

        setMembershipData(membership);
        setCurrentLocation(membership.locations);

        // Get all pack members at the same location
        // Use a simplified query that doesn't rely on wolf_profiles relationship
        console.log('Loading members for location:', membership.location_id);
        
        // Build the members query with proper location filtering
        let membersQuery = supabase
          .from('wolfpack_memberships')
          .select(`
            id,
            user_id,
            table_location,
            joined_at,
            status,
            location_id,
            locations(
              id,
              name,
              address
            )
          `);

        // Apply location filter correctly using the helper function
        membersQuery = applyLocationFilter(membersQuery, membership.location_id);
        membersQuery = membersQuery
          .eq('status', 'active')
          .order('joined_at', { ascending: false });

        const { data: members, error: membersError } = await membersQuery;

        if (membersError) {
          console.error('Error loading members:', membersError);
          throw membersError;
        }

        // Transform members data without wolf_profiles for now
        const transformedMembers: WolfPackMember[] = members?.map((member: SimpleMemberResult) => ({
          id: member.id,
          user_id: member.user_id,
          display_name: member.user_id === user.id ? 'You' : 'Pack Member',
          avatar_url: undefined,
          status: 'In the pack',
          favorite_drink: undefined,
          current_vibe: undefined,
          looking_for: undefined,
          table_location: member.table_location,
          joined_at: member.joined_at,
          location_name: member.locations?.name || 'Unknown'
        })) || [];

        setPackMembers(transformedMembers);

        // Get active events for this location
        // Note: wolfpack_events uses 'location' column with location name, not location_id
        if (membership.locations?.name) {
          const { data: events, error: eventsError } = await supabase
            .from('wolfpack_events')
            .select('*')
            .eq('location', membership.locations.name) // Use location name, not ID
            .eq('is_active', true)
            .order('created_at', { ascending: false });

          if (eventsError) {
            console.error('Error loading events:', eventsError);
            // Don't throw - events are optional
          } else {
            setActiveEvents(events || []);
          }
        }

      } catch (error) {
        console.error('Error loading wolfpack data:', error);
        setError('Failed to load wolfpack data');
        trackDatabaseError('WolfPackChatPage', error instanceof Error ? error : new Error('Unknown error'));
      } finally {
        setIsLoading(false);
      }
    }

    loadWolfpackData();
  }, [user, isInPack, supabase]);

  // Handle winking at another member
  const sendWink = async (memberId: string, targetUserId: string) => {
    if (!user) return;

    try {
      // In a real app, you'd store winks in the database
      // For now, just show a toast notification
      const targetMember = packMembers.find(m => m.id === memberId);
      if (targetMember) {
        // Could implement actual wink notifications here
        console.log(`Wink sent to ${targetMember.display_name}`);
        // toast.success(`Wink sent to ${targetMember.display_name}! 😉`);
      }
    } catch (error) {
      console.error('Error sending wink:', error);
    }
  };

  // Handle joining events
  const joinEvent = async (eventId: string) => {
    if (!user) return;

    try {
      // In a real app, you'd handle event participation
      console.log(`Joining event ${eventId}`);
      // toast.success('Joined event successfully!');
    } catch (error) {
      console.error('Error joining event:', error);
    }
  };

  // Format time display
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return date.toLocaleDateString();
  };

  if (packLoading || isLoading) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading Wolf Pack chat...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto p-4 max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Authentication Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Please login to access Wolf Pack chat.
            </p>
            <Button onClick={() => router.push('/login')} className="w-full">
              Login to Continue
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isInPack) {
    return (
      <div className="container mx-auto p-4 max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Join the Wolf Pack
            </CardTitle>
            <CardDescription>
              You need to be at Side Hustle Bar to join the pack
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>Location verification required</span>
            </div>
            <Button 
              className="w-full" 
              size="lg"
              onClick={() => router.push('/wolfpack/welcome')}
            >
              Enable Location & Join Pack
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 max-w-md">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button onClick={() => window.location.reload()} className="w-full">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="container mx-auto p-4 max-w-4xl flex-1">
        {/* Development Warning */}
        <WolfpackDevWarning isUsingFallback={isUsingFallback} />

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <BackButton fallbackHref="/wolfpack" />
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  🐺 Wolf Pack
                  {currentLocation && (
                    <Badge variant="secondary">{currentLocation.name.toUpperCase()}</Badge>
                  )}
                </h1>
                <p className="text-muted-foreground">
                  {packMembers.length} wolves in the pack tonight
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                Live
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/wolfpack/profile')}
              >
                <Settings className="h-4 w-4 mr-2" />
                Profile
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4 flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="chat">
              <MessageCircle className="h-4 w-4 mr-2" />
              Pack Chat
            </TabsTrigger>
            <TabsTrigger value="members">
              <Users className="h-4 w-4 mr-2" />
              Members ({packMembers.length})
            </TabsTrigger>
            <TabsTrigger value="events">
              <Calendar className="h-4 w-4 mr-2" />
              Events
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="space-y-4 flex-1 flex flex-col">
            {/* Chat Interface with proper spacing */}
            <div className="flex-1 min-h-0">
              {membershipData && (
                <WolfpackRealTimeChat
                  sessionId={`location_${membershipData.location_id}`}
                />
              )}
            </div>
            
            {/* Quick Actions positioned above chat input */}
            <div className="mt-4 mb-6">
              <h3 className="text-lg font-semibold mb-3 text-center">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Card 
                  className="cursor-pointer hover:shadow-md transition-shadow border-orange-200 hover:border-orange-300" 
                  onClick={() => router.push('/menu')}
                >
                  <CardContent className="p-3 text-center">
                    <div className="p-2 bg-orange-100 rounded-lg inline-block mb-2">
                      <span className="text-xl">🍽️</span>
                    </div>
                    <h4 className="font-semibold text-sm mb-1">Order Food & Drinks</h4>
                    <p className="text-xs text-muted-foreground">Browse menu and place orders</p>
                  </CardContent>
                </Card>

                <Card 
                  className="cursor-pointer hover:shadow-md transition-shadow border-blue-200 hover:border-blue-300" 
                  onClick={() => router.push('/wolfpack/profile')}
                >
                  <CardContent className="p-3 text-center">
                    <div className="p-2 bg-blue-100 rounded-lg inline-block mb-2">
                      <span className="text-xl">🐺</span>
                    </div>
                    <h4 className="font-semibold text-sm mb-1">Edit Wolf Profile</h4>
                    <p className="text-xs text-muted-foreground">Customize your pack persona</p>
                  </CardContent>
                </Card>

                <Card 
                  className="cursor-pointer hover:shadow-md transition-shadow border-purple-200 hover:border-purple-300" 
                  onClick={() => router.push('/events')}
                >
                  <CardContent className="p-3 text-center">
                    <div className="p-2 bg-purple-100 rounded-lg inline-block mb-2">
                      <span className="text-xl">🎉</span>
                    </div>
                    <h4 className="font-semibold text-sm mb-1">Events & Voting</h4>
                    <p className="text-xs text-muted-foreground">Join DJ events and contests</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="members" className="space-y-4 flex-1 overflow-y-auto">
            <div className="grid gap-4 pb-6">
            {packMembers.map((member) => (
              <Card key={member.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <Avatar>
                        <AvatarImage src={member.avatar_url} />
                        <AvatarFallback>
                          {member.display_name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{member.display_name}</h3>
                          <Badge variant="secondary" className="text-xs">
                            {member.status}
                          </Badge>
                          {member.user_id === user.id && (
                            <Badge variant="outline" className="text-xs">
                              You
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          {member.favorite_drink && (
                            <p className="flex items-center gap-1">
                              🍹 {member.favorite_drink}
                            </p>
                          )}
                          {member.current_vibe && (
                            <p className="flex items-center gap-1">
                              ✨ {member.current_vibe}
                            </p>
                          )}
                          {member.looking_for && (
                            <p className="flex items-center gap-1">
                              👋 {member.looking_for}
                            </p>
                          )}
                          {member.table_location && (
                            <p className="flex items-center gap-1">
                              📍 Table: {member.table_location}
                            </p>
                          )}
                          <p className="text-xs">
                            Joined: {formatTime(member.joined_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                    {member.user_id !== user.id && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => sendWink(member.id, member.user_id)}
                        className="flex items-center gap-1"
                      >
                        <Heart className="h-3 w-3" />
                        Wink
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="events" className="space-y-4 flex-1 overflow-y-auto">
          <div className="grid gap-4 pb-6">
            {activeEvents.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground">No active events right now</p>
                    <p className="text-sm text-muted-foreground">Check back later for contests and trivia!</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              activeEvents.map((event) => (
                <Card key={event.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          {event.title}
                          {event.is_active && (
                            <Badge variant="default" className="animate-pulse">
                              LIVE
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription>{event.description}</CardDescription>
                      </div>
                      <Badge variant="outline">
                        {event.type === 'contest' && (
                          <>
                            <Trophy className="h-3 w-3 mr-1" />
                            Contest
                          </>
                        )}
                        {event.type === 'trivia' && (
                          <>
                            <Brain className="h-3 w-3 mr-1" />
                            Trivia
                          </>
                        )}
                        {event.type === 'special' && (
                          <>
                            <Star className="h-3 w-3 mr-1" />
                            Special
                          </>
                        )}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {event.participant_count} participants
                      </span>
                      {event.is_active && (
                        <Button 
                          size="sm"
                          onClick={() => joinEvent(event.id)}
                        >
                          Join Event
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
        </Tabs>

        {/* DJ Announcement Banner */}
        {activeEvents.some(e => e.is_active) && (
          <Card className="mt-4 border-primary">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl animate-bounce">
                  <Music className="h-6 w-6" />
                </span>
                <div className="flex-1">
                  <p className="font-semibold">🎵 DJ Announcement</p>
                  <p className="text-sm text-muted-foreground">
                    Live events are happening now! Join the fun and connect with your pack!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
