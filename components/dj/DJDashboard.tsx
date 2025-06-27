'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Music, Users, MessageSquare, Trophy, Plus, Clock, MapPin } from 'lucide-react';
import { useDJPermissions } from '@/hooks/useDJPermissions';
import { supabase } from '@/lib/supabase/client';
import { EventCreator } from './EventCreator';
import { MassMessageInterface } from './MassMessageInterface';

interface DJDashboardProps {
  location?: 'salem' | 'portland';
}

interface Contestant {
  id: string;
  displayName: string;
  profilePicture: string;
}

interface ActiveEvent {
  id: string;
  title: string;
  eventType: string;
  status: 'active' | 'paused' | 'ended';
  createdAt: string;
  duration: number;
  contestants: Contestant[];
  votingOptions: string[];
}

interface CreatedEventData {
  id: string;
  title: string;
  event_type: string;
  status: string;
  created_at: string;
  duration: number;
  contestants: Array<{
    id: string;
    displayName: string;
    profilePicture?: string;
  }>;
  voting_options: string[];
}

interface PackMember {
  id: string;
  displayName: string;
  profilePicture: string;
  vibeStatus: string;
  isOnline: boolean;
  lastSeen: string;
}

export function DJDashboard({ location }: DJDashboardProps) {
  const { assignedLocation } = useDJPermissions();
  const currentLocation = location || assignedLocation || 'salem';
  const [activeEvents, setActiveEvents] = useState<ActiveEvent[]>([]);
  const [showEventCreator, setShowEventCreator] = useState(false);
  const [showMassMessage, setShowMassMessage] = useState(false);
  const [showQuickPoll, setShowQuickPoll] = useState(false);
  const [packMemberCount, setPackMemberCount] = useState(0);
  const [packMembers, setPackMembers] = useState<PackMember[]>([]);
  const [isLive, setIsLive] = useState(true);
  const [currentVibes, setCurrentVibes] = useState({
    energy: 75,
    dance: 60,
    requests: 12
  });

  // Get location ID based on current location
  const getLocationId = (locationName: string) => {
    if (locationName === 'salem') {
      return '50d17782-3f4a-43a1-b6b6-608171ca3c7c';
    } else if (locationName === 'portland') {
      return 'ec1e8869-454a-49d2-93e5-ed05f49bb932';
    }
    return null;
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {        const locationId = getLocationId(currentLocation);
        
        if (!locationId) {
          console.error('Invalid location:', currentLocation);
          return;
        }

        // Fetch active events for this location
        const { data: eventsData, error: eventsError } = await supabase
          .from('dj_events')
          .select(`
            id,
            title,
            event_type,
            status,
            created_at,
            voting_ends_at,
            options,
            event_config
          `)
          .eq('location_id', locationId)
          .in('status', ['active', 'voting'])
          .gt('voting_ends_at', new Date().toISOString());

        let formattedEvents: ActiveEvent[] = [];
        if (eventsError) {
          console.error('Error fetching events:', eventsError);
        } else {
          formattedEvents = eventsData?.map(event => ({
            id: event.id,
            title: event.title,
            eventType: event.event_type,
            status: event.status as 'active' | 'paused' | 'ended',
            createdAt: event.created_at || new Date().toISOString(),
            duration: (event.event_config as { duration?: number })?.duration || 10,
            contestants: [], // You can expand this based on dj_event_participants
            votingOptions: Array.isArray(event.options) 
              ? event.options.filter((option): option is string => typeof option === 'string')
              : []
          })) || [];
          
          setActiveEvents(formattedEvents);
        }

        // Fetch wolfpack members for this location - using the unified table structure
        const { data: membersData, error: membersError } = await supabase
          .from('wolfpack_members_unified')
          .select(`
            user_id,
            display_name,
            avatar_url,
            emoji,
            current_vibe,
            last_active,
            is_active,
            status
          `)
          .eq('location_id', locationId)
          .eq('is_active', true)
          .eq('status', 'active');

        // Get user details separately to avoid relationship issues
        let userDetails: { [key: string]: { first_name: string | null; last_name: string | null; avatar_url: string | null } } = {};
        if (membersData && membersData.length > 0) {
          const userIds = membersData.map(m => m.user_id);
          const { data: usersData } = await supabase
            .from('users')
            .select('id, first_name, last_name, avatar_url')
            .in('id', userIds);
          
          if (usersData) {
            userDetails = usersData.reduce((acc, user) => {
              acc[user.id] = user;
              return acc;
            }, {} as { [key: string]: { first_name: string | null; last_name: string | null; avatar_url: string | null } });
          }
        }

        let formattedMembers: PackMember[] = [];
        if (membersError) {
          console.error('Error fetching members:', membersError);
        } else {
          formattedMembers = membersData?.map(member => {
            const userDetail = userDetails[member.user_id];
            const firstName = userDetail?.first_name || '';
            const lastName = userDetail?.last_name || '';
            return {
              id: member.user_id,
              displayName: member.display_name || 
                          `${firstName} ${lastName}`.trim() || 'Unknown User',
              profilePicture: member.avatar_url || userDetail?.avatar_url || '/images/avatar-placeholder.png',
              vibeStatus: member.emoji || '🐺',
              isOnline: true, // You can determine this based on last_active
              lastSeen: member.last_active || new Date().toISOString()
            };
          }) || [];
          
          setPackMembers(formattedMembers);
          setPackMemberCount(formattedMembers.length);
        }

        // Update vibes based on real data
        const memberCount = formattedMembers.length;
        const eventCount = formattedEvents.length;
        
        setCurrentVibes({
          energy: Math.min(100, memberCount * 15 + 25), // Calculate based on member count
          dance: Math.min(100, eventCount * 20 + 40), // Calculate based on active events
          requests: Math.floor(Math.random() * 20) + 5 // This could come from a song_requests table
        });

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };

    fetchDashboardData();
    
    // Set up real-time subscriptions    const locationId = getLocationId(currentLocation);
    
    if (locationId) {
      // Subscribe to events changes
      const eventsSubscription = supabase
        .channel('dj_events_changes')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'dj_events',
            filter: `location_id=eq.${locationId}`
          }, 
          () => {
            fetchDashboardData(); // Refresh data when events change
          }
        )
        .subscribe();

      // Subscribe to member changes
      const membersSubscription = supabase
        .channel('wolfpack_members_changes')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'wolfpack_members_unified',
            filter: `location_id=eq.${locationId}`
          }, 
          () => {
            fetchDashboardData(); // Refresh data when members change
          }
        )
        .subscribe();

      return () => {
        eventsSubscription.unsubscribe();
        membersSubscription.unsubscribe();
      };
    }
  }, [currentLocation]);

  const handleCreateEvent = () => {
    setShowEventCreator(true);
  };

  const handleSendMassMessage = () => {
    setShowMassMessage(true);
  };

  const handleEventCreated = (event: CreatedEventData) => {
    setActiveEvents(prev => [...prev, {
      id: event.id,
      title: event.title,
      eventType: event.event_type,
      status: event.status as 'active' | 'paused' | 'ended',
      createdAt: event.created_at,
      duration: event.duration,
      contestants: event.contestants.map((c) => ({
        id: c.id,
        displayName: c.displayName,
        profilePicture: c.profilePicture || '/images/avatar-placeholder.png'
      })),
      votingOptions: event.voting_options
    }]);
    // Add to recent activity
    setActiveEvents(prev => [...prev, {
      id: event.id,
      title: event.title,
      eventType: event.event_type,
      status: event.status as 'active' | 'paused' | 'ended',
      createdAt: event.created_at,
      duration: event.duration,
      contestants: event.contestants.map((c) => ({
        id: c.id,
        displayName: c.displayName,
        profilePicture: c.profilePicture || '/images/avatar-placeholder.png'
      })),
      votingOptions: event.voting_options
    }]);
  };

  return (
    <div className="dj-dashboard min-h-screen bg-gradient-to-br from-slate-900 to-purple-900 text-white p-4 lg:p-6">
      {/* Enhanced DJ Header with Live Status */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-6 mb-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Music className="w-8 h-8" />
              {isLive && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold">DJ Control Center</h1>
              <div className="flex items-center gap-2 text-sm opacity-90">
                <MapPin className="w-4 h-4" />
                <span>{currentLocation.charAt(0).toUpperCase() + currentLocation.slice(1)}</span>
                {isLive && (
                  <>
                    <span>•</span>
                    <span className="bg-red-500 px-2 py-1 rounded-full text-xs font-bold animate-pulse">
                      LIVE
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          <Button
            variant={isLive ? "destructive" : "secondary"}
            onClick={() => setIsLive(!isLive)}
            className="px-6 py-3 text-lg font-bold"
          >
            {isLive ? 'Go Offline' : 'Go Live'}
          </Button>
        </div>
        
        {/* Real-time Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
            <div className="text-3xl font-bold">{packMemberCount}</div>
            <div className="text-sm opacity-90">Pack Members</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
            <div className="text-3xl font-bold">{activeEvents.length}</div>
            <div className="text-sm opacity-90">Live Events</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
            <div className="text-3xl font-bold">{currentVibes.energy}%</div>
            <div className="text-sm opacity-90">Energy Level</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
            <div className="text-3xl font-bold">{currentVibes.requests}</div>
            <div className="text-sm opacity-90">Song Requests</div>
          </div>
        </div>
      </div>

      {/* Tablet-Optimized Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Button 
          size="lg" 
          className="h-24 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all"
          onClick={handleSendMassMessage}
        >
          <div className="text-center">
            <MessageSquare className="w-8 h-8 mx-auto mb-2" />
            <div className="font-bold">Broadcast</div>
            <div className="text-xs opacity-80">Send to Pack</div>
          </div>
        </Button>
        
        <Button 
          size="lg" 
          className="h-24 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-lg hover:shadow-xl transition-all"
          onClick={() => setShowQuickPoll(true)}
        >
          <div className="text-center">
            <Trophy className="w-8 h-8 mx-auto mb-2" />
            <div className="font-bold">Quick Poll</div>
            <div className="text-xs opacity-80">What song next?</div>
          </div>
        </Button>
        
        <Button 
          size="lg" 
          className="h-24 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all"
          onClick={handleCreateEvent}
        >
          <div className="text-center">
            <Plus className="w-8 h-8 mx-auto mb-2" />
            <div className="font-bold">New Event</div>
            <div className="text-xs opacity-80">Create Contest</div>
          </div>
        </Button>
        
        <Button 
          size="lg" 
          className="h-24 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg hover:shadow-xl transition-all"
          onClick={() => {}}
        >
          <div className="text-center">
            <Users className="w-8 h-8 mx-auto mb-2" />
            <div className="font-bold">Crowd Vibe</div>
            <div className="text-xs opacity-80">Check Energy</div>
          </div>
        </Button>
      </div>

      {/* Live Events & Real-time Controls */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Card className="bg-slate-800 border-slate-700 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              Live Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeEvents.length === 0 ? (
              <div className="text-center py-8">
                <Trophy className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                <p className="text-slate-400 mb-4">
                  No active events. Get the pack engaged!
                </p>
                <Button 
                  onClick={handleCreateEvent} 
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Event
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {activeEvents.map(event => (
                  <div key={event.id} className="bg-slate-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold">{event.title}</h4>
                      <Badge variant={event.status === 'active' ? 'default' : 'secondary'}>
                        {event.status.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-300">
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {event.contestants.length} participants
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {event.duration}min
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Real-time Pack Activity */}
        <Card className="bg-slate-800 border-slate-700 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" />
              Pack Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-slate-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Dance Floor Energy</span>
                  <span className="text-2xl">🔥</span>
                </div>
                <div className="w-full bg-slate-600 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-orange-500 to-red-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${currentVibes.energy}%` }}
                  ></div>
                </div>
                <div className="text-sm text-slate-400 mt-1">{currentVibes.energy}% energy level</div>
              </div>
              
              <div className="bg-slate-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Song Requests</span>
                  <span className="text-2xl">🎵</span>
                </div>
                <div className="text-2xl font-bold text-blue-400">{currentVibes.requests}</div>
                <div className="text-sm text-slate-400">pending requests</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pack Members Grid - Tablet Optimized - NOW WITH REAL DATA */}
      <Card className="bg-slate-800 border-slate-700 text-white">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-green-400" />
              Pack Members ({packMembers.length})
            </div>
            <Button 
              variant="outline" 
              size="sm"
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
              onClick={() => window.location.reload()}
            >
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {packMembers.map(member => (
              <div key={member.id} className="bg-slate-700 rounded-lg p-3 hover:bg-slate-600 transition-colors cursor-pointer">
                <div className="flex items-center gap-2 mb-2">
                  <div className="relative">
                    <Image
                      src={member.profilePicture} 
                      alt={member.displayName}
                      width={32}
                      height={32}
                      className="w-8 h-8 rounded-full bg-slate-600 object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/images/avatar-placeholder.png';
                      }}
                    />
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border border-slate-700 rounded-full"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{member.displayName}</div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Online</span>
                  <span className="text-lg">{member.vibeStatus}</span>
                </div>
              </div>
            ))}
          </div>
          
          {packMembers.length === 0 && (
            <div className="text-center py-8 text-slate-400">
              <Users className="w-12 h-12 mx-auto mb-4" />
              <p>No pack members online in {currentLocation}</p>
              <p className="text-xs mt-2">Switch locations or check connection</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Poll Modal */}
      {showQuickPoll && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4 bg-slate-800 border-slate-700 text-white">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Quick Poll
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowQuickPoll(false)}
                  className="text-slate-400 hover:text-white"
                >
                  ×
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Question</label>
                  <input 
                    type="text" 
                    placeholder="What song should I play next?"
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Options</label>
                  <div className="space-y-2">
                    <input 
                      type="text" 
                      placeholder="Option 1: Hip Hop"
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400"
                    />
                    <input 
                      type="text" 
                      placeholder="Option 2: Electronic"
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400"
                    />
                    <input 
                      type="text" 
                      placeholder="Option 3: Rock"
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400"
                    />
                  </div>
                </div>
                <Button 
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                  onClick={() => setShowQuickPoll(false)}
                >
                  Send Poll to Pack
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Event Creator Modal */}
      <EventCreator
        isOpen={showEventCreator}
        onClose={() => setShowEventCreator(false)}
        onEventCreated={handleEventCreated}
        availableMembers={packMembers}
        location={currentLocation}
      />

      {/* Enhanced Mass Message Interface Modal */}
      <MassMessageInterface
        isOpen={showMassMessage}
        onClose={() => setShowMassMessage(false)}
        packMemberCount={packMemberCount}
        location={currentLocation}
      />
    </div>
  );
}