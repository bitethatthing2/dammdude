'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { Database } from '@/lib/database.types';
import dynamic from 'next/dynamic';
import { useConsistentAuth } from '@/lib/hooks/useConsistentAuth';
import { useConsistentWolfpackAccess, type WolfpackMembership } from '@/lib/hooks/useConsistentWolfpackAccess';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  AlertTriangle,
  ArrowLeft
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { SupabaseClient } from '@supabase/supabase-js';

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
  location: string;
  created_at: string;
  created_by?: string;
  ends_at?: string;
}

interface LocationData {
  id: string;
  name: string;
  address: string | null;
}

// Use users table for wolfpack members - wolfpack fields are already included
type WolfpackMemberUnified = Database['public']['Tables']['users']['Row'];

// Use generated Supabase types for dj_events
type DjEventRow = Database['public']['Tables']['dj_events']['Row'];

// User type from Supabase Auth
interface AuthUser {
  id: string;
  email?: string;
}

// Simple back button component
const BackButton = ({ fallbackHref }: { fallbackHref: string }) => {
  const router = useRouter();
  
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => {
        if (typeof window !== 'undefined' && window.history.length > 1) {
          router.back();
        } else {
          router.push(fallbackHref);
        }
      }}
    >
      <ArrowLeft className="h-4 w-4 mr-2" />
      Back
    </Button>
  );
};

// Simple chat component placeholder
const WolfpackRealTimeChat = ({ sessionId }: { sessionId: string }) => {
  return (
    <Card className="h-96">
      <CardHeader>
        <CardTitle>Pack Chat</CardTitle>
        <CardDescription>Session: {sessionId}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">Chat interface coming soon</p>
            <p className="text-sm text-muted-foreground">Connect with your pack members</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Import the hex grid component dynamically to avoid SSR issues
const DynamicWolfpackHexGrid = dynamic(
  () => import('@/components/wolfpack/WolfpackHexGrid'),
  { 
    ssr: false,
    loading: () => (
      <Card className="h-96">
        <CardContent className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    )
  }
) as unknown as React.ComponentType<{
  sessionId: string | null;
  currentUserId?: string;
  locationId: string | null;
  supabase: SupabaseClient;
}>;

// Wrapper component to handle prop mapping - simplified typing
const WolfpackHexGrid = (props: {
  sessionId: string | null;
  currentUserId?: string;
  locationId: string | null;
}) => {
  const { sessionId, currentUserId, locationId } = props;
  
  return (
    <DynamicWolfpackHexGrid 
      sessionId={sessionId}
      currentUserId={currentUserId}
      locationId={locationId}
      supabase={supabase}
    />
  );
};

// Development warning component
const WolfpackDevWarning = ({ isUsingFallback }: { isUsingFallback: boolean }) => {
  if (!isUsingFallback) return null;
  
  return (
    <Alert className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        Development mode: Some features may be limited
      </AlertDescription>
    </Alert>
  );
};

export default function WolfPackChatPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useConsistentAuth();
  const { isMember: isInPack, isLoading: packLoading, membership, locationId, locationName } = useConsistentWolfpackAccess();
  const isUsingFallback = true; // Set to true since we're using fallback components
  
  const [packMembers, setPackMembers] = useState<WolfPackMember[]>([]);
  const [activeEvents, setActiveEvents] = useState<WolfpackEvent[]>([]);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [userMembership, setUserMembership] = useState<WolfpackMembership | null>(null);
  const [selectedTab, setSelectedTab] = useState('spatial');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sentWinks, setSentWinks] = useState<Set<string>>(new Set());

  // Load wolfpack data
  useEffect(() => {
    async function loadWolfpackData() {
      // Don't load if auth is still loading or user is not in pack
      if (authLoading || packLoading) {
        console.log('[WolfpackChat] Still loading auth/pack status');
        return;
      }
      
      if (!user || !isInPack) {
        console.log('[WolfpackChat] User not authenticated or not in pack', { user: !!user, isInPack });
        setIsLoading(false);
        return;
      }
      
      console.log('[WolfpackChat] Loading wolfpack data for user:', user.id)

      try {
        setIsLoading(true);
        setError(null);

        // Get current user's wolfpack data from users table
        const { data: userProfile, error: membershipError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .eq('is_wolfpack_member', true)
          .maybeSingle();

        console.log('[WolfpackChat] Membership query result:', { data: membership, error: membershipError });
        
        if (membershipError) {
          console.error('[WolfpackChat] Error loading membership:', membershipError);
          throw membershipError;
        }

        if (!membership) {
          console.error('[WolfpackChat] No membership data found for user');
          throw new Error('No active membership found');
        }

        setUserMembership(membership);

        // Use location data from the wolfpack access hook
        let locationData: LocationData | null = null;
        if (locationId) {
          locationData = { 
            id: locationId, 
            name: locationName || 'Unknown', 
            address: null 
          };
          setCurrentLocation(locationData);
        }

        // Get all pack members at the same location from users table
        console.log('Loading members for location:', membership?.location_id);
        
        let membersQuery = supabase
          .from('users')
          .select('*');

        // Apply location filter if location_id exists
        if (membership?.location_id) {
          membersQuery = membersQuery.eq('location_id', membership.location_id);
        }
        
        membersQuery = membersQuery
          .eq('is_wolfpack_member', true)
          .not('wolfpack_status', 'is', null)
          .order('wolfpack_joined_at', { ascending: false });

        const { data: members, error: membersError } = await membersQuery;

        if (membersError) {
          console.error('Error loading members:', membersError);
          throw membersError;
        }

        // Transform members data from users table
        const transformedMembers: WolfPackMember[] = members
          ?.filter((member: WolfpackMemberUnified) => 
            // Only show users with active wolfpack status
            member.wolfpack_status === 'active'
          )
          ?.map((member: WolfpackMemberUnified) => ({
            id: member.id,
            user_id: member.id,
            display_name: member.first_name || member.last_name || (user && member.id === user.id ? 'You' : 'Pack Member'),
            avatar_url: member.avatar_url || undefined,
            status: member.wolfpack_status || 'In the pack',
            favorite_drink: undefined,
            current_vibe: undefined,
            looking_for: undefined,
            table_location: undefined,
            joined_at: member.wolfpack_joined_at || member.created_at || new Date().toISOString(),
            location_name: locationData?.name || 'Unknown'
          })) || [];

        setPackMembers(transformedMembers);

        // Get active events for this location
        if (membership.location_id) {
          try {
            const { data: events, error: eventsError } = await supabase
              .from('dj_events')
              .select('*')
              .eq('location_id', membership.location_id)
              .eq('status', 'active')
              .is('ended_at', null);
            
            if (!eventsError && events) {
              // Transform database rows to UI events with proper null handling
              const transformedEvents: WolfpackEvent[] = events.map((event: DjEventRow) => {
                // Handle nullable fields with safe defaults
                const description = event.description || 'Join this exciting event!';
                const createdAt = event.created_at || new Date().toISOString();
                
                // Determine event type with proper type casting
                let eventType: 'contest' | 'trivia' | 'special' = 'special';
                if (event.event_type === 'trivia') {
                  eventType = 'trivia';
                } else if (event.event_type === 'contest') {
                  eventType = 'contest';
                }
                
                return {
                  id: event.id,
                  title: event.title || `${event.event_type} Event`,
                  type: eventType,
                  description,
                  is_active: event.status === 'active' && !event.ended_at,
                  participant_count: 0, // Would need to count from participants table
                  location: locationData?.name || 'Unknown',
                  created_at: createdAt,
                  created_by: event.dj_id || undefined,
                  ends_at: event.ended_at || undefined
                };
              });
              
              setActiveEvents(transformedEvents);
            } else {
              console.warn('Failed to load events, setting empty array');
              setActiveEvents([]);
            }
          } catch (eventsError) {
            console.error('Error loading events:', eventsError);
            setActiveEvents([]);
          }
        }

      } catch (error) {
        console.error('Error loading wolfpack data:', error);
        setError('Failed to load wolfpack data');
      } finally {
        setIsLoading(false);
      }
    }

    loadWolfpackData();
  }, [user, isInPack, authLoading, packLoading, locationId, locationName]);

  // Handle winking at another member
  const sendWink = async (memberId: string, targetUserId: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('wolf_pack_interactions')
        .insert({
          sender_id: user.id,
          receiver_id: targetUserId,
          interaction_type: 'wink'
        })
        .select();

      if (error) {
        console.error('Error sending wink:', error);
        
        // Show user-friendly error message
        if (error.message?.includes('row-level security')) {
          alert('Can only wink at active pack members. This user may not be fully activated yet.');
        } else {
          alert('Failed to send wink. Please try again.');
        }
      } else {
        console.log('Wink insert successful:', data);
        const targetMember = packMembers.find(m => m.id === memberId);
        if (targetMember) {
          console.log(`Wink sent to ${targetMember.display_name}! 😉`);
          setSentWinks(prev => new Set([...prev, targetUserId]));
        }
      }
    } catch (error) {
      console.error('Caught error sending wink:', error);
      alert('Network error. Please check your connection and try again.');
    }
  };

  // Handle joining events
  const joinEvent = async (eventId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('dj_event_participants')
        .insert({
          event_id: eventId,
          participant_id: user.id,
        });

      if (error) {
        console.error('Error joining event:', error);
      } else {
        console.log(`Joined event ${eventId} successfully!`);
      }
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

  if (authLoading || packLoading) {
    return (
      <div className="container mx-auto p-4 pb-20 max-w-4xl">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading Wolf Pack...</p>
          </div>
        </div>
      </div>
    );
  }
  
  if (isLoading && user && isInPack) {
    return (
      <div className="container mx-auto p-4 pb-20 max-w-4xl">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading pack members...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto p-4 pb-20 max-w-md">
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
      <div className="container mx-auto p-4 pb-20 max-w-md">
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
      <div className="container mx-auto p-4 pb-20 max-w-md">
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
      <div className="container mx-auto p-4 pb-20 max-w-4xl flex-1">
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="spatial">
              <MapPin className="h-4 w-4 mr-2" />
              3D View
            </TabsTrigger>
            <TabsTrigger value="chat">
              <MessageCircle className="h-4 w-4 mr-2" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="members">
              <Users className="h-4 w-4 mr-2" />
              Members
            </TabsTrigger>
            <TabsTrigger value="events">
              <Calendar className="h-4 w-4 mr-2" />
              Events
            </TabsTrigger>
          </TabsList>

          <TabsContent value="spatial" className="space-y-4 flex-1">
            {/* 3D Hexagonal Wolf Pack View */}
            {membership && locationId && (
              <WolfpackHexGrid 
                sessionId={`location_${locationId}`}
                currentUserId={user.id}
                locationId={locationId}
              />
            )}

            {/* Show message if no location */}
            {membership && !locationId && (
              <Card className="h-96">
                <CardContent className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground">No location assigned</p>
                    <p className="text-sm text-muted-foreground">Ask staff to assign you to a location</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="chat" className="space-y-4 flex-1 flex flex-col">
            {/* Chat Interface with proper spacing */}
            <div className="flex-1 min-h-0">
              {membership && locationId && (
                <WolfpackRealTimeChat
                  sessionId={`location_${locationId}`}
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
                      {member.user_id !== user.id && member.status === 'active' && (
                        <Button
                          size="sm"
                          variant={sentWinks.has(member.user_id) ? "default" : "outline"}
                          onClick={() => sendWink(member.id, member.user_id)}
                          disabled={sentWinks.has(member.user_id)}
                          className="flex items-center gap-1"
                        >
                          <Heart className={`h-3 w-3 ${sentWinks.has(member.user_id) ? 'fill-current' : ''}`} />
                          {sentWinks.has(member.user_id) ? 'Winked! 😉' : 'Wink'}
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