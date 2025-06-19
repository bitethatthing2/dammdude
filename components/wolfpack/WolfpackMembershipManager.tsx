"use client";

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, 
  Shield, 
  MapPin, 
  Clock, 
  User, 
  MessageCircle, 
  LogOut,
  Crown,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/AuthContext';
import { toast } from 'sonner';

interface WolfPackMember {
  id: string;
  user_id: string;
  display_name: string;
  avatar_url?: string;
  table_location?: string;
  joined_at: string;
  last_active: string;
  status: 'online' | 'away' | 'offline';
  is_host?: boolean;
}

interface WolfPackSession {
  id: string;
  bar_location_id: string;
  bar_name: string;
  created_at: string;
  expires_at: string;
  member_count: number;
  max_members: number;
  is_active: boolean;
}

interface MembershipState {
  isLoading: boolean;
  isMember: boolean;
  currentSession: WolfPackSession | null;
  members: WolfPackMember[];
  userMembership: WolfPackMember | null;
  error: string | null;
}

export function WolfpackMembershipManager() {
  const { user } = useAuth();
  const [state, setState] = useState<MembershipState>({
    isLoading: true,
    isMember: false,
    currentSession: null,
    members: [],
    userMembership: null,
    error: null
  });

  const supabase = getSupabaseBrowserClient();

  const loadMembers = useCallback(async (sessionId?: string) => {
    const targetSessionId = sessionId || state.currentSession?.id;
    if (!targetSessionId) return;

    try {
      const { data: members, error } = await supabase
        .from('wolfpack_memberships')
        .select(`
          id,
          user_id,
          display_name,
          avatar_url,
          table_location,
          joined_at,
          last_active,
          status,
          is_host
        `)
        .eq('session_id', targetSessionId)
        .eq('is_active', true)
        .order('joined_at', { ascending: true });

      if (error) throw error;

      setState(prev => ({
        ...prev,
        members: members || []
      }));

    } catch (error) {
      console.error('Error loading members:', error);
    }
  }, [state.currentSession?.id, supabase]);

  const loadMembershipStatus = useCallback(async () => {
    if (!user) {
      setState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Check current WolfPack membership
      const { data: membership, error: membershipError } = await supabase
        .from('wolfpack_memberships')
        .select(`
          *,
          wolfpack_sessions (
            id,
            bar_location_id,
            created_at,
            expires_at,
            member_count,
            max_members,
            is_active,
            bar_locations (name)
          )
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (membershipError && membershipError.code !== 'PGRST116') {
        throw membershipError;
      }

      if (membership && membership.wolfpack_sessions) {
        setState(prev => ({
          ...prev,
          isMember: true,
          userMembership: membership,
          currentSession: {
            id: membership.wolfpack_sessions.id,
            bar_location_id: membership.wolfpack_sessions.bar_location_id,
            bar_name: membership.wolfpack_sessions.bar_locations?.name || 'Unknown Location',
            created_at: membership.wolfpack_sessions.created_at,
            expires_at: membership.wolfpack_sessions.expires_at,
            member_count: membership.wolfpack_sessions.member_count,
            max_members: membership.wolfpack_sessions.max_members,
            is_active: membership.wolfpack_sessions.is_active
          }
        }));

        // Load other members
        await loadMembers(membership.session_id);
      }

    } catch (error) {
      console.error('Error loading membership status:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to load membership status'
      }));
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [user, supabase, loadMembers]);

  // Load current membership status
  useEffect(() => {
    loadMembershipStatus();
  }, [loadMembershipStatus]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!state.currentSession) return;

    const membershipSubscription = supabase
      .channel(`wolfpack_${state.currentSession.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wolfpack_memberships',
          filter: `session_id=eq.${state.currentSession.id}`
        },
        () => {
          loadMembers();
        }
      )
      .subscribe();

    return () => {
      membershipSubscription.unsubscribe();
    };
  }, [state.currentSession, loadMembers, supabase]);

  const joinWolfPack = async () => {
    if (!user) {
      toast.error('Please log in to join WolfPack');
      return;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true }));

      // Get user's current location to find nearby sessions
      const position = await getCurrentPosition();
      
      // Find active WolfPack session nearby
      const { data: sessions, error: sessionsError } = await supabase
        .rpc('find_nearby_wolfpack_sessions', {
          user_lat: position.coords.latitude,
          user_lng: position.coords.longitude,
          radius_meters: 100 // 100m radius
        });

      if (sessionsError) throw sessionsError;

      if (!sessions || sessions.length === 0) {
        toast.error('No active WolfPack sessions found nearby');
        return;
      }

      const session = sessions[0];

      // Join the session
      const { error: joinError } = await supabase
        .from('wolfpack_memberships')
        .insert({
          session_id: session.id,
          user_id: user.id,
          display_name: user.user_metadata?.display_name || user.email?.split('@')[0] || 'Anonymous',
          avatar_url: user.user_metadata?.avatar_url,
          status: 'online',
          joined_at: new Date().toISOString(),
          last_active: new Date().toISOString()
        });

      if (joinError) throw joinError;

      toast.success('Joined WolfPack!');
      await loadMembershipStatus();

    } catch (error) {
      console.error('Error joining WolfPack:', error);
      toast.error('Failed to join WolfPack');
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const leaveWolfPack = async () => {
    if (!state.userMembership) return;

    try {
      setState(prev => ({ ...prev, isLoading: true }));

      const { error } = await supabase
        .from('wolfpack_memberships')
        .update({ 
          is_active: false,
          left_at: new Date().toISOString()
        })
        .eq('id', state.userMembership.id);

      if (error) throw error;

      toast.success('Left WolfPack');
      setState({
        isLoading: false,
        isMember: false,
        currentSession: null,
        members: [],
        userMembership: null,
        error: null
      });

    } catch (error) {
      console.error('Error leaving WolfPack:', error);
      toast.error('Failed to leave WolfPack');
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const updateTableLocation = async (tableLocation: string) => {
    if (!state.userMembership) return;

    try {
      const { error } = await supabase
        .from('wolfpack_memberships')
        .update({ 
          table_location: tableLocation,
          last_active: new Date().toISOString()
        })
        .eq('id', state.userMembership.id);

      if (error) throw error;

      setState(prev => ({
        ...prev,
        userMembership: prev.userMembership ? {
          ...prev.userMembership,
          table_location: tableLocation
        } : null
      }));

      toast.success('Table location updated');

    } catch (error) {
      console.error('Error updating table location:', error);
      toast.error('Failed to update table location');
    }
  };

  const getCurrentPosition = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      });
    });
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };

  if (state.isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading WolfPack status...</span>
        </CardContent>
      </Card>
    );
  }

  if (state.error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{state.error}</AlertDescription>
      </Alert>
    );
  }

  if (!state.isMember) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Join WolfPack
          </CardTitle>
          <CardDescription>
            Connect with other Side Hustle visitors in your area
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <p>When you join a WolfPack, you can:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Chat with other members in real-time</li>
              <li>Share your table location with staff</li>
              <li>Get notifications about group activities</li>
              <li>Connect with fellow Side Hustle enthusiasts</li>
            </ul>
          </div>
          
          <Button onClick={joinWolfPack} className="w-full" size="lg">
            <Shield className="mr-2 h-4 w-4" />
            Find & Join WolfPack
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Session Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Active WolfPack
          </CardTitle>
          <CardDescription>
            You&apos;re part of the pack at {state.currentSession?.bar_name}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{state.currentSession?.bar_name}</span>
            </div>
            <Badge variant="secondary">
              {state.members.length} / {state.currentSession?.max_members} members
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              Active since {state.currentSession?.created_at ? 
                formatTimeAgo(state.currentSession.created_at) : 'Unknown'}
            </span>
          </div>

          {state.userMembership?.table_location && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Table: {state.userMembership.table_location}</span>
            </div>
          )}

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                const table = prompt('Enter your table number or location:');
                if (table) updateTableLocation(table);
              }}
              size="sm"
            >
              <MapPin className="mr-2 h-3 w-3" />
              Update Location
            </Button>
            
            <Button variant="destructive" onClick={leaveWolfPack} size="sm">
              <LogOut className="mr-2 h-3 w-3" />
              Leave Pack
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Members List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Pack Members ({state.members.length})
          </CardTitle>
          <CardDescription>
            Other wolves currently at {state.currentSession?.bar_name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {state.members.map((member, index) => (
              <div key={member.id}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={member.avatar_url} />
                      <AvatarFallback>
                        {member.display_name?.charAt(0)?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{member.display_name}</span>
                        {member.is_host && (
                          <Crown className="h-3 w-3 text-yellow-500" />
                        )}
                        {member.user_id === user?.id && (
                          <Badge variant="outline" className="text-xs">You</Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <div className={`w-2 h-2 rounded-full ${
                          member.status === 'online' ? 'bg-green-500' :
                          member.status === 'away' ? 'bg-yellow-500' : 'bg-gray-400'
                        }`} />
                        <span>{member.status}</span>
                        {member.table_location && (
                          <>
                            <span>•</span>
                            <span>Table {member.table_location}</span>
                          </>
                        )}
                        <span>•</span>
                        <span>{formatTimeAgo(member.last_active)}</span>
                      </div>
                    </div>
                  </div>

                  {member.user_id !== user?.id && (
                    <Button variant="ghost" size="sm">
                      <MessageCircle className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                
                {index < state.members.length - 1 && (
                  <Separator className="mt-3" />
                )}
              </div>
            ))}
          </div>

          {state.members.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No other members in this WolfPack yet</p>
              <p className="text-sm">Be the first to start the conversation!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
