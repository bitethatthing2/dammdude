'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Music, Users, MessageSquare, Trophy, Plus, Clock, MapPin } from 'lucide-react';
import { useWolfpack } from '@/hooks/useWolfpack';
import { useDJPermissions } from '@/hooks/useDJPermissions';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
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

interface RecentActivity {
  type: 'member_joined' | 'event_ended' | 'event_started';
  user?: string;
  event?: string;
  timestamp: string;
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

export function DJDashboard({ location }: DJDashboardProps) {
  const { assignedLocation } = useDJPermissions();
  const currentLocation = location || assignedLocation || 'salem';
  const [activeEvents, setActiveEvents] = useState<ActiveEvent[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [showEventCreator, setShowEventCreator] = useState(false);
  const [showMassMessage, setShowMassMessage] = useState(false);
  const [showQuickPoll, setShowQuickPoll] = useState(false);
  const [packMemberCount, setPackMemberCount] = useState(0);
  const [isLive, setIsLive] = useState(true);
  const [currentVibes, setCurrentVibes] = useState({
    energy: 75,
    dance: 60,
    requests: 12
  });

  // Mock data for now - in real implementation this would come from useWolfpackMembership
  const mockMembers = [
    {
      id: '1',
      displayName: 'Wolf Alpha',
      profilePicture: '/images/avatar-placeholder.png',
      vibeStatus: '🔥',
      isOnline: true,
      lastSeen: new Date().toISOString()
    },
    {
      id: '2', 
      displayName: 'Pack Leader',
      profilePicture: '/images/avatar-placeholder.png',
      vibeStatus: '🎵',
      isOnline: true,
      lastSeen: new Date().toISOString()
    },
    {
      id: '3',
      displayName: 'Night Howler',
      profilePicture: '/images/avatar-placeholder.png', 
      vibeStatus: '🐺',
      isOnline: true,
      lastSeen: new Date().toISOString()
    }
  ];

  useEffect(() => {
    // Fetch active events and pack data
    const fetchDashboardData = async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        
        // Fetch active events (mock for now)
        setActiveEvents([]);
        
        // Set mock pack member count
        setPackMemberCount(mockMembers.length);
        
        // Fetch recent activity (mock for now)
        setRecentActivity([
          { type: 'member_joined', user: 'Wolf Alpha', timestamp: new Date().toISOString() },
          { type: 'event_ended', event: 'Freestyle Friday', timestamp: new Date().toISOString() }
        ]);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };

    fetchDashboardData();
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
    setRecentActivity(prev => [{
      type: 'event_started',
      event: event.title,
      timestamp: new Date().toISOString()
    }, ...prev.slice(0, 4)]);
  };

  const EventCard = ({ event }: { event: ActiveEvent }) => (
    <Card className="mb-3">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium">{event.title}</h4>
          <Badge variant={event.status === 'active' ? 'default' : 'secondary'}>
            {event.status.toUpperCase()}
          </Badge>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {event.contestants.length} contestants
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {event.duration}min
          </div>
        </div>
      </CardContent>
    </Card>
  );

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

      {/* Pack Members Grid - Tablet Optimized */}
      <Card className="bg-slate-800 border-slate-700 text-white">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-green-400" />
              Pack Members ({mockMembers.length})
            </div>
            <Button 
              variant="outline" 
              size="sm"
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {mockMembers.map(member => (
              <div key={member.id} className="bg-slate-700 rounded-lg p-3 hover:bg-slate-600 transition-colors cursor-pointer">
                <div className="flex items-center gap-2 mb-2">
                  <div className="relative">
                    <img 
                      src={member.profilePicture} 
                      alt={member.displayName}
                      className="w-8 h-8 rounded-full bg-slate-600"
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
          
          {mockMembers.length === 0 && (
            <div className="text-center py-8 text-slate-400">
              <Users className="w-12 h-12 mx-auto mb-4" />
              <p>No pack members online</p>
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
        availableMembers={mockMembers}
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
