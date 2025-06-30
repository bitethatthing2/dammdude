'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Music, Users, MessageSquare, Trophy, Plus, Clock, MapPin, AlertCircle, RefreshCw, Zap, TrendingUp } from 'lucide-react';
import { useDJPermissions } from '@/hooks/useDJPermissions';
import { createClient } from '@/lib/supabase/client';
import { WolfpackEnhancedService } from '@/lib/services/wolfpack-enhanced.service';
import { EventCreator } from './EventCreator';
import { MassMessageInterface } from './MassMessageInterface';

// =============================================================================
// INTERFACES
// =============================================================================

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
  dj?: {
    display_name?: string;
    first_name?: string;
    last_name?: string;
  };
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

interface LocationStats {
  activeEvents: number;
  totalPackMembers: number;
  onlineMembers: number;
  recentBroadcasts: number;
  energyLevel: number;
}

interface DJDashboardProps {
  location?: 'salem' | 'portland';
}

// =============================================================================
// LOCATION CONFIGURATION
// =============================================================================

const LOCATION_CONFIG = {
  salem: {
    id: '50d17782-3f4a-43a1-b6b6-608171ca3c7c',
    name: 'Salem',
    displayName: 'THE SIDEHUSTLE BAR Salem'
  },
  portland: {
    id: 'ec1e8869-454a-49d2-93e5-ed05f49bb932',
    name: 'Portland',
    displayName: 'THE SIDEHUSTLE BAR Portland'
  }
} as const;

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function DJDashboard({ location }: DJDashboardProps) {
  const { assignedLocation } = useDJPermissions();
  const currentLocation = location || assignedLocation || 'salem';
  
  // Core State
  const [activeEvents, setActiveEvents] = useState<ActiveEvent[]>([]);
  const [packMembers, setPackMembers] = useState<PackMember[]>([]);
  const [locationStats, setLocationStats] = useState<LocationStats>({
    activeEvents: 0,
    totalPackMembers: 0,
    onlineMembers: 0,
    recentBroadcasts: 0,
    energyLevel: 0
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
  const supabase = createClient();

  const locationConfig = useMemo(() => LOCATION_CONFIG[currentLocation], [currentLocation]);

  // =============================================================================
  // DATA FETCHING
  // =============================================================================

  const fetchDashboardData = useCallback(async (showLoadingState = false) => {
    try {
      if (showLoadingState) setIsLoading(true);
      else setIsRefreshing(true);
      
      setError(null);

      // Fetch all data in parallel using enhanced service
      const [events, members, stats] = await Promise.all([
        WolfpackEnhancedService.getActiveEvents(locationConfig.id),
        WolfpackEnhancedService.getActivePackMembers(locationConfig.id),
        WolfpackEnhancedService.getLocationStats(locationConfig.id)
      ]);

      // Transform events to include time remaining
      const eventsWithTimeRemaining: ActiveEvent[] = events.map(event => ({
        id: event.id,
        title: event.title,
        event_type: event.event_type,
        status: event.status,
        created_at: event.created_at,
        voting_ends_at: event.voting_ends_at || new Date().toISOString(),
        options: event.options ? (Array.isArray(event.options) ? event.options : []) : [],
        participantCount: 0, // TODO: Calculate from participants
        timeRemaining: event.voting_ends_at ? 
          WolfpackEnhancedService.formatTimeRemaining(event.voting_ends_at) : 0,
        dj: event.dj
      }));

      setActiveEvents(eventsWithTimeRemaining);
      setPackMembers(members);
      setLocationStats(stats);

    } catch (error: unknown) {
      console.error('Dashboard data fetch error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load dashboard data';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [locationConfig.id]);

  // =============================================================================
  // REAL-TIME SUBSCRIPTIONS
  // =============================================================================

  const setupRealtimeSubscription = useCallback(() => {
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
    }

    try {
      subscriptionRef.current = WolfpackEnhancedService.setupRealtimeSubscription(
        locationConfig.id,
        {
          onEventUpdate: () => {
            console.log('Event updated, refreshing...');
            fetchDashboardData(false);
          },
          onBroadcast: (payload) => {
            console.log('New broadcast:', payload);
            // Could show notification here
          },
          onChatMessage: (payload) => {
            console.log('New chat message:', payload);
            // Could update chat interface if visible
          },
          onMemberUpdate: () => {
            console.log('Member updated, refreshing...');
            fetchDashboardData(false);
          }
        }
      );

    } catch (error) {
      console.error('Subscription setup error:', error);
    }
  }, [locationConfig.id, fetchDashboardData]);

  // =============================================================================
  // LIFECYCLE
  // =============================================================================

  useEffect(() => {
    fetchDashboardData(true);
    setupRealtimeSubscription();

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, [fetchDashboardData, setupRealtimeSubscription]);

  // =============================================================================
  // EVENT HANDLERS
  // =============================================================================

  const handleRefresh = useCallback(() => {
    fetchDashboardData(false);
  }, [fetchDashboardData]);

  const handleEventCreated = useCallback((event: any) => {
    // Add new event to the list optimistically
    const newEvent: ActiveEvent = {
      id: event.event_id || event.id,
      title: event.title,
      event_type: event.event_type,
      status: event.status || 'active',
      created_at: event.created_at || new Date().toISOString(),
      voting_ends_at: event.voting_ends_at || new Date().toISOString(),
      options: event.options || [],
      participantCount: 0,
      timeRemaining: 0
    };
    
    setActiveEvents(prev => [newEvent, ...prev]);
    setShowEventCreator(false);
    
    // Refresh data to get accurate info
    setTimeout(() => fetchDashboardData(false), 1000);
  }, [fetchDashboardData]);

  const handleQuickPoll = useCallback(async () => {
    try {
      const response = await fetch('/api/dj/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'What song should I play next?',
          event_type: 'next_song_vote',
          location_id: locationConfig.id,
          duration: 5,
          options: ['Hip Hop', 'Electronic', 'Rock', 'Pop'],
          voting_format: 'multiple_choice'
        })
      });

      if (response.ok) {
        const result = await response.json();
        handleEventCreated(result);
      }
    } catch (error) {
      console.error('Quick poll creation failed:', error);
    }
    setShowQuickPoll(false);
  }, [locationConfig.id, handleEventCreated]);

  // =============================================================================
  // RENDER HELPERS
  // =============================================================================

  const getEventTypeEmoji = (eventType: string): string => {
    const emojis: Record<string, string> = {
      dance_battle: '💃',
      hottest_person: '🔥',
      best_costume: '👗',
      name_that_tune: '🎵',
      song_request: '🎶',
      next_song_vote: '🎧',
      trivia: '🧠',
      custom: '✨'
    };
    return emojis[eventType] || '🎉';
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'voting': return 'bg-blue-500';
      case 'paused': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  // =============================================================================
  // LOADING STATE
  // =============================================================================

  if (isLoading) {
    return (
      <div className="dj-dashboard h-screen overflow-hidden bg-gradient-to-br from-slate-900 to-purple-900 text-white p-2 lg:p-4 flex flex-col">
        <div className="space-y-4">
          <Skeleton className="h-32 w-full bg-slate-800" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-20 bg-slate-800" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // =============================================================================
  // MAIN RENDER
  // =============================================================================

  return (
    <div className="dj-dashboard h-screen overflow-hidden bg-gradient-to-br from-slate-900 to-purple-900 text-white p-2 lg:p-4 flex flex-col">
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
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-4 mb-3 shadow-2xl flex-shrink-0">
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
              className="border-slate-700 text-slate-900 hover:bg-slate-700 hover:text-white bg-white/80"
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
        
        {/* Enhanced Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
            <div className="text-3xl font-bold">{locationStats.totalPackMembers}</div>
            <div className="text-sm opacity-90">Pack Members</div>
            <div className="text-xs text-white/90 mt-1">{locationStats.onlineMembers} online</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
            <div className="text-3xl font-bold">{locationStats.activeEvents}</div>
            <div className="text-sm opacity-90">Live Events</div>
            <div className="text-xs opacity-70 mt-1">
              {activeEvents.filter(e => e.status === 'active').length} active
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center relative">
            <div className="text-3xl font-bold">{locationStats.energyLevel}%</div>
            <div className="text-sm opacity-90">Energy Level</div>
            <div className="absolute top-2 right-2">
              {locationStats.energyLevel > 80 ? <Zap className="w-4 h-4 text-yellow-400" /> : 
               locationStats.energyLevel > 50 ? <TrendingUp className="w-4 h-4 text-green-400" /> : 
               <div className="w-4 h-4" />}
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
            <div className="text-3xl font-bold">{locationStats.recentBroadcasts}</div>
            <div className="text-sm opacity-90">Recent Broadcasts</div>
            <div className="text-xs opacity-70 mt-1">Last 24h</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3 flex-shrink-0">
        <Button 
          size="lg" 
          className="h-20 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
          onClick={() => setShowMassMessage(true)}
          disabled={locationStats.totalPackMembers === 0}
        >
          <div className="text-center">
            <MessageSquare className="w-6 h-6 mx-auto mb-1" />
            <div className="font-bold text-sm">Broadcast</div>
            <div className="text-xs opacity-80">
              {locationStats.totalPackMembers > 0 ? `Send to ${locationStats.totalPackMembers}` : 'No members'}
            </div>
          </div>
        </Button>
        
        <Button 
          size="lg" 
          className="h-20 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
          onClick={() => setShowQuickPoll(true)}
        >
          <div className="text-center">
            <Trophy className="w-6 h-6 mx-auto mb-1" />
            <div className="font-bold text-sm">Quick Poll</div>
            <div className="text-xs opacity-80">What song next?</div>
          </div>
        </Button>
        
        <Button 
          size="lg" 
          className="h-20 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          onClick={() => setShowEventCreator(true)}
        >
          <div className="text-center">
            <Plus className="w-6 h-6 mx-auto mb-1" />
            <div className="font-bold text-sm">New Event</div>
            <div className="text-xs opacity-80">Create Contest</div>
          </div>
        </Button>
        
        <Button 
          size="lg" 
          className="h-20 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
        >
          <div className="text-center">
            <Users className="w-6 h-6 mx-auto mb-1" />
            <div className="font-bold text-sm">Analytics</div>
            <div className="text-xs opacity-80">View Insights</div>
          </div>
        </Button>
      </div>

      {/* Live Events & Pack Activity */}
      <div className="grid lg:grid-cols-2 gap-4 mb-3 flex-1 overflow-auto">
        <Card className="bg-slate-800 border-slate-700 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              Live Events
              <Badge variant="outline" className="ml-auto">
                {activeEvents.length} active
              </Badge>
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
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {activeEvents.map(event => (
                  <div key={event.id} className="bg-slate-700 rounded-lg p-4 hover:bg-slate-600 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getEventTypeEmoji(event.event_type)}</span>
                        <h4 className="font-bold truncate flex-1">{event.title}</h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(event.status)}`} />
                        <Badge variant={event.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                          {event.status.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-300 mb-2">
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
                      <div className="text-xs text-slate-400 mb-2">
                        Options: {event.options.slice(0, 2).join(', ')}
                        {event.options.length > 2 && '...'}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="text-xs">
                        View Details
                      </Button>
                      <Button size="sm" variant="outline" className="text-xs">
                        End Event
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Pack Activity & Energy */}
        <Card className="bg-slate-800 border-slate-700 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" />
              Pack Activity
              <Badge variant="outline" className="ml-auto">
                {locationStats.onlineMembers}/{locationStats.totalPackMembers} online
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-slate-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Energy Level</span>
                <div className="flex items-center gap-1">
                  {locationStats.energyLevel > 80 ? <Zap className="w-4 h-4 text-yellow-400" /> : 
                   locationStats.energyLevel > 50 ? <TrendingUp className="w-4 h-4 text-green-400" /> : 
                   <span className="text-2xl">🔥</span>}
                  <span className="text-lg font-bold">{locationStats.energyLevel}%</span>
                </div>
              </div>
              <div className="w-full bg-slate-600 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-orange-500 to-red-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${locationStats.energyLevel}%` }}
                />
              </div>
              <div className="text-sm text-slate-400 mt-1 flex justify-between">
                <span>{locationStats.onlineMembers} members active</span>
                <span>{locationStats.activeEvents} events live</span>
              </div>
            </div>
            
            <div className="bg-slate-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Recent Activity</span>
                <span className="text-2xl">📊</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Broadcasts sent:</span>
                  <span className="text-white">{locationStats.recentBroadcasts}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Events created:</span>
                  <span className="text-white">{locationStats.activeEvents}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Peak energy:</span>
                  <span className="text-white">{Math.max(locationStats.energyLevel, 85)}%</span>
                </div>
              </div>
            </div>

            {/* Quick Actions for Pack */}
            <div className="space-y-2">
              <Button 
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                onClick={() => setShowMassMessage(true)}
                disabled={locationStats.totalPackMembers === 0}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Send Pack Message
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleQuickPoll()}
                >
                  🎵 Song Vote
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setShowEventCreator(true)}
                >
                  🏆 Contest
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pack Members */}
      <Card className="bg-slate-800 border-slate-700 text-white max-h-64 overflow-hidden flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-green-400" />
              Pack Members ({locationStats.totalPackMembers})
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs text-white border-white/50">
                {locationStats.onlineMembers} online
              </Badge>
              <Button size="sm" variant="ghost" onClick={handleRefresh}>
                <RefreshCw className="w-3 h-3" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-auto flex-1">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
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
          
          {locationStats.totalPackMembers === 0 && (
            <div className="text-center py-8 text-slate-400">
              <Users className="w-12 h-12 mx-auto mb-4" />
              <p>No pack members online in {locationConfig.displayName}</p>
              <p className="text-xs mt-2">Members will appear here when they join the pack at this location</p>
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
                🎵 Quick Song Vote
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
                <p className="text-sm text-slate-300">
                  Create a quick poll to let the pack choose the next song!
                </p>
                <div className="bg-slate-700 rounded-lg p-3">
                  <div className="text-sm font-medium mb-2">Poll Options:</div>
                  <div className="text-xs space-y-1 text-slate-300">
                    <div>🎤 Hip Hop</div>
                    <div>🎛️ Electronic</div>
                    <div>🎸 Rock</div>
                    <div>🎼 Pop</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600"
                    onClick={handleQuickPoll}
                    disabled={locationStats.totalPackMembers === 0}
                  >
                    {locationStats.totalPackMembers > 0 
                      ? `Send to ${locationStats.totalPackMembers} Members` 
                      : 'No Members Online'
                    }
                  </Button>
                  <Button variant="outline" onClick={() => setShowQuickPoll(false)}>
                    Cancel
                  </Button>
                </div>
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
        packMemberCount={locationStats.totalPackMembers}
        location={currentLocation}
      />
    </div>
  );
}