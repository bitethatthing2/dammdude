

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Music, 
  Users, 
  MessageSquare, 
  Trophy, 
  AlertCircle, 
  RefreshCw, 
  Zap, 
  TrendingUp,
  Clock,
  MapPin,
  BarChart3,
  Radio,
  Sparkles,
  Send
} from 'lucide-react';
import { useDJPermissions } from '@/hooks/useDJPermissions';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';

// Import existing components
import { BroadcastForm } from './BroadcastForm';
import { EventCreator } from './EventCreator';
import { MassMessageInterface } from './MassMessageInterface';

// Import types from actual database
import type { Database } from '@/lib/database.types';

type RealtimeChannel = ReturnType<typeof supabase.channel>;

// Define missing interfaces that the component expects
interface BroadcastAnalytics {
  timeframe: string;
  start_date: string;
  broadcasts: number;
  broadcast_types_used: number;
  avg_interactions: number;
  max_participants: number;
  total_responses: number;
  unique_responders: number;
  avg_response_time_seconds: number;
  broadcasts_by_type: Record<string, number>;
  top_broadcasts: Array<{
    title: string;
    type: string;
    responses: number;
    participants: number;
  }>;
}

interface WolfpackLiveStats {
  total_active: number;
  very_active: number;
  gender_breakdown: Record<string, number>;
  recent_interactions: {
    total_interactions: number;
    active_participants: number;
  };
  energy_level: number;
  top_vibers: Array<{
    user_id: string;
    name: string;
    avatar: string | null;
    vibe: string | null;
  }>;
}

// =============================================================================
// INTERFACES
// =============================================================================

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
  const djPermissions = useDJPermissions();
  const { assignedLocation, isActiveDJ, canSendMassMessages, isLoading: permissionsLoading } = djPermissions;
  const currentLocation = location || assignedLocation || 'salem';
  const locationConfig = LOCATION_CONFIG[currentLocation];

  // Core State
  const [activeBroadcasts, setActiveBroadcasts] = useState<Database['public']['Views']['active_broadcasts_live']['Row'][]>([]);
  const [liveStats, setLiveStats] = useState<WolfpackLiveStats | null>(null);
  const [analytics, setAnalytics] = useState<BroadcastAnalytics | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // UI State
  const [activeTab, setActiveTab] = useState('broadcasts');
  const [showEventCreator, setShowEventCreator] = useState(false);
  const [showMassMessage, setShowMassMessage] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs
  const subscriptionRef = useRef<RealtimeChannel | null>(null);
  const analyticsIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Get current user
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    getUser();
  }, []);

  // =============================================================================
  // DATA FETCHING
  // =============================================================================

  const fetchDashboardData = useCallback(async (showLoadingState = false) => {
    try {
      if (showLoadingState) setIsLoading(true);
      else setIsRefreshing(true);

      setError(null);

      if (!currentUser?.id) return;

      // Fetch or create dashboard state
      const { data: stateData, error: stateError } = await supabase
        .from('dj_dashboard_state')
        .select('*')
        .eq('dj_id', currentUser.id)
        .single();

      if (stateError && stateError.code !== 'PGRST116') {
        throw stateError;
      }

      if (stateData) {
        setIsLive(stateData.is_live);
      }

      // Fetch active broadcasts
      const { data: broadcasts, error: broadcastsError } = await supabase
        .from('active_broadcasts_live')
        .select('*')
        .eq('location_id', locationConfig.id)
        .order('created_at', { ascending: false });

      if (broadcastsError) throw broadcastsError;

      setActiveBroadcasts(broadcasts || []);

      // Fetch live stats
      const { data: stats, error: statsError } = await supabase
        .rpc('get_wolfpack_live_stats', {
          p_location_id: locationConfig.id
        });

      if (statsError) throw statsError;
      
      setLiveStats(stats);

      // Fetch analytics
      const { data: analyticsData, error: analyticsError } = await supabase
        .rpc('get_dj_dashboard_analytics', {
          p_dj_id: currentUser.id,
          p_timeframe: 'today'
        });

      if (analyticsError) throw analyticsError;
      
      setAnalytics(analyticsData);

    } catch (error: unknown) {
      console.error('Dashboard data fetch error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      setError(`Failed to load dashboard data: ${error instanceof Error ? error.message : 'Unknown error'}`);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [currentUser?.id, locationConfig.id]);

  // =============================================================================
  // REAL-TIME SUBSCRIPTIONS
  // =============================================================================

  const setupRealtimeSubscription = useCallback(() => {
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
    }

    subscriptionRef.current = supabase
      .channel(`dj-dashboard-${locationConfig.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'dj_broadcasts',
          filter: `location_id=eq.${locationConfig.id}`
        },
        (payload) => {
          console.log('Broadcast change:', payload);
          fetchDashboardData(false);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'dj_broadcast_responses'
        },
        (payload) => {
          console.log('New response:', payload);
          // Update response counts in real-time
          setActiveBroadcasts(prev => 
            prev.map(broadcast => 
              broadcast.id === payload.new?.broadcast_id
                ? { 
                    ...broadcast, 
                    interaction_count: broadcast.interaction_count + 1,
                    unique_participants: broadcast.unique_participants + 1
                  }
                : broadcast
            )
          );
        }
      )
      .subscribe();

  }, [locationConfig.id, fetchDashboardData]);

  // =============================================================================
  // DASHBOARD ACTIONS
  // =============================================================================

  const toggleLiveStatus = useCallback(async () => {
    if (!currentUser?.id) return;

    const newLiveStatus = !isLive;
    
    try {
      const { error } = await supabase
        .from('dj_dashboard_state')
        .upsert({ 
          dj_id: currentUser.id,
          is_live: newLiveStatus,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      setIsLive(newLiveStatus);
      
      toast.success(newLiveStatus ? 'You are now LIVE!' : 'You are now offline');
      
      // Create a system broadcast when going live
      if (newLiveStatus) {
        await supabase.from('dj_broadcasts').insert({
          dj_id: currentUser.id,
          location_id: locationConfig.id,
          broadcast_type: 'general',
          title: '🎵 DJ is LIVE!',
          message: `The DJ is now live at ${locationConfig.displayName}!`,
          priority: 'high',
          duration_seconds: 10,
          status: 'active',
          auto_close: true,
          background_color: '#ef4444',
          text_color: '#ffffff',
          accent_color: '#fbbf24',
          animation_type: 'pulse',
          emoji_burst: ['🎵', '🎶', '🎤']
        });
      }
    } catch (error) {
      console.error('Error toggling live status:', error);
      toast.error('Failed to update live status');
    }
  }, [currentUser?.id, isLive, locationConfig.id, locationConfig.displayName]);

  const handleBroadcastCreated = useCallback((broadcast: any) => {
    // Refresh data to get the new broadcast
    fetchDashboardData(false);
  }, [fetchDashboardData]);

  const handleEventCreated = useCallback((event: any) => {
    setShowEventCreator(false);
    // Could create a broadcast for the event if needed
    toast.success('Event created successfully!');
  }, []);

  const handleQuickVibeCheck = useCallback(async () => {
    if (!currentUser?.id) return;

    try {
      const { data, error } = await supabase.rpc('quick_vibe_check', {
        p_dj_id: currentUser.id,
        p_location_id: locationConfig.id
      });

      if (error) throw error;

      toast.success('Vibe check sent!');
      fetchDashboardData(false);
    } catch (error) {
      console.error('Vibe check error:', error);
      toast.error('Failed to send vibe check');
    }
  }, [currentUser?.id, locationConfig.id, fetchDashboardData]);

  const handleSingleLadiesSpotlight = useCallback(async () => {
    if (!currentUser?.id) return;

    try {
      const { data, error } = await supabase.rpc('single_ladies_spotlight', {
        p_dj_id: currentUser.id,
        p_location_id: locationConfig.id,
        p_custom_message: null
      });

      if (error) throw error;

      toast.success('Single ladies spotlight activated!');
      fetchDashboardData(false);
    } catch (error) {
      console.error('Single ladies spotlight error:', error);
      toast.error('Failed to activate spotlight');
    }
  }, [currentUser?.id, locationConfig.id, fetchDashboardData]);

  // =============================================================================
  // LIFECYCLE
  // =============================================================================

  useEffect(() => {
    if (permissionsLoading || !currentUser) return;

    if (!isActiveDJ || !canSendMassMessages) {
      console.log('User does not have DJ permissions');
      setIsLoading(false);
      return;
    }

    let mounted = true;

    const initializeDashboard = async () => {
      if (mounted) {
        await fetchDashboardData(true);
        setupRealtimeSubscription();

        // Setup analytics refresh interval
        analyticsIntervalRef.current = setInterval(() => {
          fetchDashboardData(false);
        }, 30000); // Refresh every 30 seconds
      }
    };

    initializeDashboard();

    return () => {
      mounted = false;
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
      if (analyticsIntervalRef.current) {
        clearInterval(analyticsIntervalRef.current);
        analyticsIntervalRef.current = null;
      }
    };
  }, [permissionsLoading, isActiveDJ, canSendMassMessages, currentUser, fetchDashboardData, setupRealtimeSubscription]);

  // =============================================================================
  // PERMISSION CHECK
  // =============================================================================

  if (permissionsLoading || isLoading) {
    return (
      <div className="h-screen overflow-hidden bg-gradient-to-br from-slate-900 to-purple-900 text-white p-4 flex flex-col">
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

  if (!isActiveDJ || !canSendMassMessages) {
    return (
      <div className="h-screen overflow-hidden bg-gradient-to-br from-slate-900 to-purple-900 text-white p-4 flex items-center justify-center">
        <Card className="max-w-md w-full bg-slate-800/50 backdrop-blur border-slate-700">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-purple-600/20 rounded-full flex items-center justify-center">
              <Music className="w-8 h-8 text-purple-400" />
            </div>
            <CardTitle className="text-2xl font-bold text-white">DJ Access Required</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-300">
              You need DJ permissions to access the control center.
            </p>
            <Alert className="bg-slate-700/50 border-slate-600 text-left">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-gray-300">
                If you believe you should have DJ access, please contact the venue manager.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  // =============================================================================
  // MAIN RENDER
  // =============================================================================

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-slate-900 to-purple-900 text-white flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 shadow-2xl flex-shrink-0">
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
              onClick={() => fetchDashboardData(false)}
              disabled={isRefreshing}
              className="border-white/20 text-white hover:bg-white/10"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant={isLive ? "destructive" : "secondary"}
              onClick={toggleLiveStatus}
              className="px-6 py-3 text-lg font-bold"
            >
              <Radio className="w-5 h-5 mr-2" />
              {isLive ? 'Go Offline' : 'Go Live'}
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
            <div className="text-3xl font-bold">{liveStats?.total_active || 0}</div>
            <div className="text-sm opacity-90">Active Pack</div>
            <div className="text-xs opacity-70 mt-1">{liveStats?.very_active || 0} very active</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
            <div className="text-3xl font-bold">{activeBroadcasts.filter(b => b.status === 'active').length}</div>
            <div className="text-sm opacity-90">Live Broadcasts</div>
            <div className="text-xs opacity-70 mt-1">{analytics?.total_responses || 0} responses</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center relative">
            <div className="text-3xl font-bold">{Math.round(liveStats?.energy_level || 0)}%</div>
            <div className="text-sm opacity-90">Energy Level</div>
            <div className="absolute top-2 right-2">
              {(liveStats?.energy_level || 0) > 80 ? <Zap className="w-4 h-4 text-yellow-400" /> :
                (liveStats?.energy_level || 0) > 50 ? <TrendingUp className="w-4 h-4 text-green-400" /> :
                  <Sparkles className="w-4 h-4 text-gray-400" />}
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
            <div className="text-3xl font-bold">{analytics?.unique_responders || 0}</div>
            <div className="text-sm opacity-90">Engaged Users</div>
            <div className="text-xs opacity-70 mt-1">
              {analytics?.avg_response_time_seconds ? `${analytics.avg_response_time_seconds}s avg` : 'N/A'}
            </div>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="m-4 bg-red-900/50 border-red-500">
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

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-4 flex-shrink-0">
        <Button
          size="lg"
          className="h-20 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
          onClick={() => setShowMassMessage(true)}
          disabled={(liveStats?.total_active || 0) === 0}
        >
          <div className="text-center">
            <MessageSquare className="w-6 h-6 mx-auto mb-1" />
            <div className="font-bold text-sm">Broadcast</div>
            <div className="text-xs opacity-80">
              {liveStats?.total_active ? `Send to ${liveStats.total_active}` : 'No members'}
            </div>
          </div>
        </Button>

        <Button
          size="lg"
          className="h-20 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
          onClick={handleQuickVibeCheck}
        >
          <div className="text-center">
            <Sparkles className="w-6 h-6 mx-auto mb-1" />
            <div className="font-bold text-sm">Vibe Check</div>
            <div className="text-xs opacity-80">Quick pulse</div>
          </div>
        </Button>

        <Button
          size="lg"
          className="h-20 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          onClick={handleSingleLadiesSpotlight}
        >
          <div className="text-center">
            <Trophy className="w-6 h-6 mx-auto mb-1" />
            <div className="font-bold text-sm">Ladies Night</div>
            <div className="text-xs opacity-80">Spotlight</div>
          </div>
        </Button>

        <Button
          size="lg"
          className="h-20 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
          onClick={() => setShowEventCreator(true)}
        >
          <div className="text-center">
            <Users className="w-6 h-6 mx-auto mb-1" />
            <div className="font-bold text-sm">New Event</div>
            <div className="text-xs opacity-80">Create Contest</div>
          </div>
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-3 bg-slate-800/50">
            <TabsTrigger value="broadcasts" className="data-[state=active]:bg-purple-600">
              <MessageSquare className="w-4 h-4 mr-2" />
              Broadcasts
            </TabsTrigger>
            <TabsTrigger value="active" className="data-[state=active]:bg-purple-600">
              <Radio className="w-4 h-4 mr-2" />
              Active ({activeBroadcasts.filter(b => b.status === 'active').length})
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-purple-600">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="broadcasts" className="flex-1 overflow-auto mt-4">
            <div className="max-w-4xl mx-auto">
              <BroadcastForm
                djId={currentUser?.id || ''}
                locationId={locationConfig.id}
                sessionId={sessionId || undefined}
                onBroadcastCreated={handleBroadcastCreated}
              />
            </div>
          </TabsContent>

          <TabsContent value="active" className="flex-1 overflow-auto mt-4">
            <div className="space-y-4">
              {activeBroadcasts.length === 0 ? (
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardContent className="text-center py-12">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                    <p className="text-slate-400">No active broadcasts</p>
                    <p className="text-sm text-slate-500 mt-2">
                      Create a new broadcast to engage with your audience
                    </p>
                  </CardContent>
                </Card>
              ) : (
                activeBroadcasts.map((broadcast) => (
                  <Card key={broadcast.id} className="bg-slate-800/50 border-slate-700">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{broadcast.title}</CardTitle>
                          {broadcast.subtitle && (
                            <p className="text-sm text-slate-400 mt-1">{broadcast.subtitle}</p>
                          )}
                        </div>
                        <Badge variant={broadcast.status === 'active' ? 'default' : 'secondary'}>
                          {broadcast.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm mb-4">{broadcast.message}</p>
                      <div className="flex items-center justify-between text-sm text-slate-400">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {broadcast.unique_participants} participants
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-4 h-4" />
                            {broadcast.interaction_count} responses
                          </span>
                        </div>
                        {broadcast.seconds_remaining && broadcast.seconds_remaining > 0 && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {Math.floor(broadcast.seconds_remaining / 60)}m {broadcast.seconds_remaining % 60}s
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="flex-1 overflow-auto mt-4">
            {analytics ? (
              <div className="space-y-4">
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle>Today's Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{analytics.broadcasts}</div>
                        <div className="text-sm text-slate-400">Broadcasts</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{analytics.total_responses}</div>
                        <div className="text-sm text-slate-400">Responses</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{analytics.unique_responders}</div>
                        <div className="text-sm text-slate-400">Unique Users</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{analytics.avg_response_time_seconds || 0}s</div>
                        <div className="text-sm text-slate-400">Avg Response Time</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {analytics.top_broadcasts && analytics.top_broadcasts.length > 0 && (
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader>
                      <CardTitle>Top Broadcasts</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {analytics.top_broadcasts.map((broadcast, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-slate-700/50 rounded">
                            <span className="font-medium">{broadcast.title}</span>
                            <div className="flex items-center gap-4 text-sm text-slate-400">
                              <span>{broadcast.responses} responses</span>
                              <span>{broadcast.participants} users</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="text-center py-12">
                  <BarChart3 className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                  <p className="text-slate-400">No analytics data available</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      <MassMessageInterface
        isOpen={showMassMessage}
        onClose={() => setShowMassMessage(false)}
        packMemberCount={liveStats?.total_active || 0}
        location={currentLocation}
      />

      <EventCreator
        isOpen={showEventCreator}
        onClose={() => setShowEventCreator(false)}
        onEventCreated={handleEventCreated}
        availableMembers={[]} // You can populate this from liveStats if needed
        location={currentLocation}
      />
    </div>
  );
}