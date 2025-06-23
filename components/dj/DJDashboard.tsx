'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Music, Users, MessageSquare, Trophy, Plus, Clock, MapPin } from 'lucide-react';
import { useWolfpackMembership } from '@/hooks/useWolfpackMembership';
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
  const [packMemberCount, setPackMemberCount] = useState(0);

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
    <div className="dj-dashboard space-y-6 p-4">
      {/* DJ Status Header */}
      <Card className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music className="w-6 h-6" />
            DJ Control Center
          </CardTitle>
          <div className="flex items-center gap-2 text-sm opacity-90">
            <MapPin className="w-4 h-4" />
            {currentLocation.charAt(0).toUpperCase() + currentLocation.slice(1)} Location
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{packMemberCount}</div>
              <div className="text-sm opacity-90">Active Pack Members</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{activeEvents.length}</div>
              <div className="text-sm opacity-90">Live Events</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">🔥</div>
              <div className="text-sm opacity-90">Energy Level</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <Button 
          size="lg" 
          className="h-20 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
          onClick={handleCreateEvent}
        >
          <div className="text-center">
            <Plus className="w-6 h-6 mx-auto mb-1" />
            <div>Create Event</div>
          </div>
        </Button>
        
        <Button 
          size="lg" 
          className="h-20 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
          onClick={handleSendMassMessage}
        >
          <div className="text-center">
            <MessageSquare className="w-6 h-6 mx-auto mb-1" />
            <div>Mass Message</div>
          </div>
        </Button>
      </div>

      {/* Active Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Active Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeEvents.length === 0 ? (
            <div className="text-center py-8">
              <Trophy className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">
                No active events. Create one to get the pack engaged!
              </p>
              <Button onClick={handleCreateEvent} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Event
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {activeEvents.map(event => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pack Members Available for Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Available Pack Members
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {mockMembers.map(member => (
              <div key={member.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent transition-colors">
                <img 
                  src={member.profilePicture} 
                  alt={member.displayName}
                  className="w-10 h-10 rounded-full bg-muted"
                />
                <div className="flex-1">
                  <div className="font-medium text-sm">{member.displayName}</div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Online now
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {member.vibeStatus}
                </Badge>
              </div>
            ))}
          </div>
          
          {mockMembers.length === 0 && (
            <div className="text-center py-6 text-muted-foreground">
              <Users className="w-8 h-8 mx-auto mb-2" />
              <p>No pack members online at this location</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No recent activity to display
            </p>
          ) : (
            <div className="space-y-2">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center gap-3 p-2 text-sm">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span>
                    {activity.type === 'member_joined' && `${activity.user} joined the pack`}
                    {activity.type === 'event_ended' && `${activity.event} event completed`}
                  </span>
                  <span className="text-muted-foreground ml-auto">
                    {new Date(activity.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Event Creator Modal */}
      <EventCreator
        isOpen={showEventCreator}
        onClose={() => setShowEventCreator(false)}
        onEventCreated={handleEventCreated}
        availableMembers={mockMembers}
        location={currentLocation}
      />

      {/* Mass Message Interface Modal */}
      <MassMessageInterface
        isOpen={showMassMessage}
        onClose={() => setShowMassMessage(false)}
        packMemberCount={packMemberCount}
        location={currentLocation}
      />
    </div>
  );
}
