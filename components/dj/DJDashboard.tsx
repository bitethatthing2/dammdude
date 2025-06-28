'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Music, Users, MessageSquare, Trophy, Plus, Clock, MapPin, AlertCircle, RefreshCw } from 'lucide-react';
import { useDJPermissions } from '@/hooks/useDJPermissions';
import { supabase } from '@/lib/supabase/client';
import { EventCreator } from './EventCreator';
import { MassMessageInterface } from './MassMessageInterface';

// Database response types
interface DatabaseEvent {
  id: string;
  title: string;
  event_type: string;
  status: string | null;
  created_at: string | null;
  voting_ends_at: string | null;
  options: unknown;
}

interface DatabaseMember {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  emoji: string | null;
  current_vibe: string | null;
  last_active: string | null;
  is_active: boolean | null;
  status: string | null;
}
type LocationName = 'salem' | 'portland';
type EventStatus = 'active' | 'paused' | 'ended' | 'voting';

interface DJDashboardProps {
  location?: 'salem' | 'portland';
}

interface ActiveEvent {
  id: string;
  title: string;
  event_type: string;
  status: string;
  created_at: string;
  voting_ends_at: string;
  options: string[];
  participantCount: number;
  timeRemaining: number;
}

interface PackMember {
  id: string;
  user_id: string;
  displayName: string;
  profilePicture: string;
  vibeStatus: string;
  isOnline: boolean;
  lastSeen: string;
}

interface VibeMetrics {
  energy: number;
  dance: number;
  requests: number;
}

// Location configuration
const LOCATION_CONFIG = {
  salem: {
    id: '50d17782-3f4a-43a1-b6b6-608171ca3c7c',
    name: 'Salem',
    displayName: 'Salem Location'
  },
  portland: {
    id: 'ec1e8869-454a-49d2-93e5-ed05f49bb932',
    name: 'Portland',
    displayName: 'Portland Location'
  }
} as const;

export function DJDashboard({ location }: DJDashboardProps) {
  const { assignedLocation } = useDJPermissions();
  const currentLocation = location || assignedLocation || 'salem';
  
  // Core State
  const [activeEvents, setActiveEvents] = useState<ActiveEvent[]>([]);
  const [packMembers, setPackMembers] = useState<PackMember[]>([]);
  const [currentVibes, setCurrentVibes] = useState<VibeMetrics>({
    energy: 0,
    dance: 0,
    requests: 0
  });
  
  // UI State
  const [showEventCreator, setShowEventCreator] = useState(false);
  const [showMassMessage, setShowMassMessage] = useState(false);
  const [showQuickPoll, setShowQuickPoll] = useState(false);
  const [isLive, setIsLive] = useState(true);
  
  // Status State
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Refs
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);

  const locationConfig = useMemo(() => LOCATION_CONFIG[currentLocation], [currentLocation]);

  // Helper function to safely parse options
  const parseOptions = (options: unknown): string[] => {
    if (Array.isArray(options)) {
      return options.filter((opt): opt is string => typeof opt === 'string');
    }
    return [];
  };

  // Simplified data fetching
  const fetchDashboardData = useCallback(async (showLoadingState = false) => {
    try {
      if (showLoadingState) setIsLoading(true);
      else setIsRefreshing(true);
      
      setError(null);

      // Fetch active events
      const { data: eventsData, error: eventsError } = await supabase
        .from('dj_events')
        .select('id, title, event_type, status, created_at, voting_ends_at, options')
        .eq('location_id', locationConfig.id)
        .not('status', 'is', null)
        .order('created_at', { ascending: false });

      if (eventsError) throw eventsError;

      // Transform events data
      const events: ActiveEvent[] = (eventsData || [])
        .filter((event: DatabaseEvent) => {
          return event.status !== null && ['active', 'voting'].includes(event.status);
        })
        .map((event: DatabaseEvent) => {
          const votingEndsAt = event.voting_ends_at ? new Date(event.voting_ends_at) : new Date();
          const now = new Date();
          const timeRemaining = Math.max(0, Math.floor((votingEndsAt.getTime() - now.getTime()) / 1000 / 60));
          
          return {
            id: event.id,
            title: event.title,
            event_type: event.event_type,
            status: event.status!, // Non-null assertion - we know it's not null after filter
            created_at: event.created_at || new Date().toISOString(),
            voting_ends_at: event.voting_ends_at || new Date().toISOString(),
            options: parseOptions(event.options),
            participantCount: 0,
            timeRemaining
          };
        });

      setActiveEvents(events);

      // Fetch wolfpack members
      const { data: membersData, error: membersError } = await supabase
        .from('wolfpack_members_unified')
        .select(`
          id,
          user_id,
          display_name,
          avatar_url,
          emoji,
          current_vibe,
          last_active,
          is_active,
          status
        `)
        .eq('location_id', locationConfig.id)
        .eq('is_active', true)
        .not('status', 'is', null)
        .order('last_active', { ascending: false });

      if (membersError) throw membersError;

      // Transform members data
      const members: PackMember[] = (membersData || [])
        .filter((member: DatabaseMember) => member.is_active && member.status === 'active')
        .map((member: DatabaseMember) => {
          const lastActiveTime = new Date(member.last_active || new Date().toISOString());
          const isRecentlyActive = (Date.now() - lastActiveTime.getTime()) < 5 * 60 * 1000;
          
          return {
            id: member.id,
            user_id: member.user_id,
            displayName: member.display_name || 'Unknown User',
            profilePicture: member.avatar_url || '/images/avatar-placeholder.png',
            vibeStatus: member.emoji || '🐺',
            isOnline: isRecentlyActive,
            lastSeen: member.last_active || new Date().toISOString()
          };
        });

      setPackMembers(members);

      // Calculate vibes
      const onlineCount = members.filter(m => m.isOnline).length;
      const eventCount = events.length;
      
      setCurrentVibes({
        energy: Math.min(100, Math.max(10, (onlineCount * 12) + (eventCount * 15) + 25)),
        dance: Math.min(100, Math.max(20, (eventCount * 20) + (members.length * 5) + 30)),
        requests: Math.floor(Math.random() * 15) + Math.floor(members.length * 0.3)
      });

    } catch (error: unknown) {
      console.error('Dashboard data fetch error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load dashboard data';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [locationConfig.id]);

  // Real-time subscriptions
  const setupRealtimeSubscription = useCallback(() => {
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
    }

    try {
      subscriptionRef.current = supabase
        .channel(`dj_dashboard_${locationConfig.id}`)
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'dj_events',
            filter: `location_id=eq.${locationConfig.id}`
          }, 
          () => fetchDashboardData(false)
        )
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'wolfpack_members_unified',
            filter: `location_id=eq.${locationConfig.id}`
          }, 
          () => fetchDashboardData(false)
        )
        .subscribe();

    } catch (error) {
      console.error('Subscription setup error:', error);
    }
  }, [locationConfig.id, fetchDashboardData]);

  // Initialize dashboard
  useEffect(() => {
    fetchDashboardData(true);
    setupRealtimeSubscription();

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, [fetchDashboardData, setupRealtimeSubscription]);

  // Event handlers
  const handleRefresh = useCallback(() => {
    fetchDashboardData(false);
  }, [fetchDashboardData]);

  const handleEventCreated = useCallback((event: {
    id: string;
    title: string;
    event_type: string;
    status: string;
    created_at?: string;
    voting_ends_at?: string;
    options?: string[];
  }) => {
    const newEvent: ActiveEvent = {
      id: event.id,
      title: event.title,
      event_type: event.event_type,
      status: event.status,
      created_at: event.created_at || new Date().toISOString(),
      voting_ends_at: event.voting_ends_at || new Date().toISOString(),
      options: event.options || [],
      participantCount: 0,
      timeRemaining: 0
    };
    
    setActiveEvents(prev => [newEvent, ...prev]);
    setShowEventCreator(false);
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="dj-dashboard min-h-screen bg-gradient-to-br from-slate-900 to-purple-900 text-white p-4 lg:p-6">
        <div className="space-y-6">
          <Skeleton className="h-32 w-full bg-slate-800" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24 bg-slate-800" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const packMemberCount = packMembers.length;
  const activeEventCount = activeEvents.length;
  const onlineCount = packMembers.filter(m => m.isOnline).length;

  return (
    <div className="dj-dashboard min-h-screen bg-gradient-to-br from-slate-900 to-purple-900 text-white p-4 lg:p-6">
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mb-4 bg-red-900/50 border-red-500">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setError(null)}
              className="ml-2 h-auto p-1 text-xs"
            >
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
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
                <span>{locationConfig.displayName}</span>
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
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="border-white/20 text-white hover:bg-white/10"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant={isLive ? "destructive" : "secondary"}
              onClick={() => setIsLive(!isLive)}
              className="px-6 py-3 text-lg font-bold"
            >
              {isLive ? 'Go Offline' : 'Go Live'}
            </Button>
          </div>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
            <div className="text-3xl font-bold">{packMemberCount}</div>
            <div className="text-sm opacity-90">Pack Members</div>
            <div className="text-xs opacity-70 mt-1">{onlineCount} online</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
            <div className="text-3xl font-bold">{activeEventCount}</div>
            <div className="text-sm opacity-90">Live Events</div>
            <div className="text-xs opacity-70 mt-1">
              {activeEvents.filter(e => e.status === 'active').length} active
            </div>
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

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Button 
          size="lg" 
          className="h-24 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
          onClick={() => setShowMassMessage(true)}
          disabled={packMemberCount === 0}
        >
          <div className="text-center">
            <MessageSquare className="w-8 h-8 mx-auto mb-2" />
            <div className="font-bold">Broadcast</div>
            <div className="text-xs opacity-80">
              {packMemberCount > 0 ? `Send to ${packMemberCount}` : 'No members'}
            </div>
          </div>
        </Button>
        
        <Button 
          size="lg" 
          className="h-24 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
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
          className="h-24 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          onClick={() => setShowEventCreator(true)}
        >
          <div className="text-center">
            <Plus className="w-8 h-8 mx-auto mb-2" />
            <div className="font-bold">New Event</div>
            <div className="text-xs opacity-80">Create Contest</div>
          </div>
        </Button>
        
        <Button 
          size="lg" 
          className="h-24 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
        >
          <div className="text-center">
            <Users className="w-8 h-8 mx-auto mb-2" />
            <div className="font-bold">Crowd Vibe</div>
            <div className="text-xs opacity-80">Check Energy</div>
          </div>
        </Button>
      </div>

      {/* Live Events & Pack Activity */}
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
                <p className="text-slate-400 mb-4">No active events</p>
                <Button onClick={() => setShowEventCreator(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Event
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {activeEvents.map(event => (
                  <div key={event.id} className="bg-slate-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold truncate flex-1">{event.title}</h4>
                      <Badge variant={event.status === 'active' ? 'default' : 'secondary'}>
                        {event.status.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-300">
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {event.participantCount} participants
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {event.timeRemaining}min left
                      </div>
                    </div>
                    {event.options.length > 0 && (
                      <div className="mt-2 text-xs text-slate-400">
                        Options: {event.options.slice(0, 2).join(', ')}
                        {event.options.length > 2 && '...'}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Vibe Metrics */}
        <Card className="bg-slate-800 border-slate-700 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" />
              Pack Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-slate-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Energy Level</span>
                <span className="text-2xl">🔥</span>
              </div>
              <div className="w-full bg-slate-600 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-orange-500 to-red-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${currentVibes.energy}%` }}
                />
              </div>
              <div className="text-sm text-slate-400 mt-1 flex justify-between">
                <span>{currentVibes.energy}%</span>
                <span>{onlineCount} online</span>
              </div>
            </div>
            
            <div className="bg-slate-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Dance Engagement</span>
                <span className="text-2xl">💃</span>
              </div>
              <div className="w-full bg-slate-600 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${currentVibes.dance}%` }}
                />
              </div>
              <div className="text-sm text-slate-400 mt-1">{currentVibes.dance}%</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pack Members */}
      <Card className="bg-slate-800 border-slate-700 text-white">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-green-400" />
              Pack Members ({packMemberCount})
            </div>
            <Badge variant="outline" className="text-xs">
              {onlineCount} online
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {packMembers.map(member => (
              <div key={member.id} className="bg-slate-700 rounded-lg p-3 hover:bg-slate-600 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <div className="relative">
                    <Image
                      src={member.profilePicture} 
                      alt={member.displayName}
                      width={32}
                      height={32}
                      className="w-8 h-8 rounded-full bg-slate-600 object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/images/avatar-placeholder.png';
                      }}
                    />
                    <div className={`absolute -bottom-1 -right-1 w-3 h-3 border border-slate-700 rounded-full ${
                      member.isOnline ? 'bg-green-500' : 'bg-gray-500'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {member.displayName}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    {member.isOnline ? 'Online' : 'Offline'}
                  </span>
                  <span className="text-lg">{member.vibeStatus}</span>
                </div>
              </div>
            ))}
          </div>
          
          {packMemberCount === 0 && (
            <div className="text-center py-8 text-slate-400">
              <Users className="w-12 h-12 mx-auto mb-4" />
              <p>No pack members online in {locationConfig.displayName}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Poll Modal */}
      {showQuickPoll && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md bg-slate-800 border-slate-700 text-white">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Quick Poll
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowQuickPoll(false)}
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
                  </div>
                </div>
                <Button 
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600"
                  onClick={() => setShowQuickPoll(false)}
                  disabled={packMemberCount === 0}
                >
                  {packMemberCount > 0 
                    ? `Send Poll to ${packMemberCount} Members` 
                    : 'No Members Online'
                  }
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modals */}
      <EventCreator
        isOpen={showEventCreator}
        onClose={() => setShowEventCreator(false)}
        onEventCreated={handleEventCreated}
        availableMembers={packMembers}
        location={currentLocation}
      />

      <MassMessageInterface
        isOpen={showMassMessage}
        onClose={() => setShowMassMessage(false)}
        packMemberCount={packMemberCount}
        location={currentLocation}
      />
    </div>
  );
}