'use client';

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
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { toast } from 'sonner';

// Use centralized Supabase client
// Interfaces based on actual database structure
interface WolfpackMemberAtLocation {
  id: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  wolfpack_tier: string | null;
  display_name: string | null;
  wolf_emoji: string | null;
  vibe_status: string | null;
  location_id: string | null;
  last_seen: string | null;
}

// RPC response interface
interface JoinWolfpackResponse {
  success: boolean;
  message?: string;
  error?: string;
  membership_id?: string;
  is_vip?: boolean;
}

interface WolfpackMembership {
  id: string | null;
  user_id: string | null;
  display_name: string | null;
  avatar_url: string | null;
  table_location: string | null;
  joined_at: string | null;
  last_active: string | null;
  status: string | null;
  is_host: boolean | null;
  session_id: string | null;
  location_id: string | null;
  is_active: boolean | null;
  left_at: string | null;
}

interface Location {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  latitude: number;
  longitude: number;
}

interface MembershipState {
  isLoading: boolean;
  isMember: boolean;
  currentMembership: WolfpackMembership | null;
  currentLocation: Location | null;
  members: WolfpackMemberAtLocation[];
  error: string | null;
}

export function WolfpackMembershipManager() {
  const { user } = useAuth();
  const [state, setState] = useState<MembershipState>({
    isLoading: true,
    isMember: false,
    currentMembership: null,
    currentLocation: null,
    members: [],
    error: null
  });

  const loadMembers = useCallback(async (locationId: string | null) => {
    if (!locationId) return;

    try {
      const { data: members, error } = await supabase
        .from('wolfpack_members_at_location')
        .select('*')
        .eq('location_id', locationId)
        .order('last_seen', { ascending: false });

      if (error) {
        console.error('Error loading members:', error);
        return;
      }

      setState(prev => ({
        ...prev,
        members: members || []
      }));

    } catch (error) {
      console.error('Error loading members:', error);
    }
  }, []);

  const loadMembershipStatus = useCallback(async () => {
    if (!user) {
      setState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Get active membership from wolfpack_memberships view
      const { data: membershipData, error: membershipError } = await supabase
        .from('wolfpack_memberships')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (membershipError) {
        console.error('Error loading membership:', membershipError);
        setState(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: 'Failed to load membership status' 
        }));
        return;
      }

      if (membershipData && membershipData.location_id) {
        // Get location details
        const { data: locationData, error } = await supabase
          .from('locations')
          .select('*')
          .eq('id', membershipData.location_id)
          .maybeSingle();

        if (error) {
          console.error('Error loading location:', error);
        }

        setState(prev => ({
          ...prev,
          isMember: true,
          currentMembership: membershipData,
          currentLocation: locationData || null
        }));

        await loadMembers(membershipData.location_id);
      } else {
        setState(prev => ({ ...prev, isMember: false }));
      }

    } catch (error) {
      console.error('Error in loadMembershipStatus:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to load membership status'
      }));
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [user, loadMembers]);

  useEffect(() => {
    loadMembershipStatus();
  }, [loadMembershipStatus]);

  useEffect(() => {
    const locationId = state.currentMembership?.location_id;
    if (!locationId) return;

    const channel = supabase
      .channel(`wolfpack_${locationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wolfpack_members_unified',
          filter: `location_id=eq.${locationId}`
        },
        () => {
          loadMembers(locationId);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [state.currentMembership?.location_id, loadMembers]);

  const joinWolfPack = async () => {
    if (!user) {
      toast.error('Please log in to join WolfPack');
      return;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true }));

      // Get current position
      const position = await getCurrentPosition();
      
      // Find nearby locations using the correct RPC function
      const { data: locations, error: locError } = await supabase
        .rpc('find_nearest_location', {
          user_lat: position.coords.latitude,
          user_lon: position.coords.longitude,
          max_distance_meters: 100
        });

      if (locError || !locations || locations.length === 0) {
        toast.error('No Side Hustle locations found nearby');
        setState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      // Join wolfpack using the correct RPC function with optional table location
      const { data: result, error: joinError } = await supabase
        .rpc('join_wolfpack_membership');

      if (joinError) {
        throw new Error(joinError.message || 'Failed to join WolfPack');
      }

      // Type check and assertion for the RPC response
      const response = result as unknown as JoinWolfpackResponse;

      // Check if the result indicates success
      if (response && typeof response === 'object' && 'success' in response && response.success) {
        toast.success(response.message || 'Joined WolfPack!');
      } else if (response && typeof response === 'object' && 'error' in response) {
        throw new Error(response.error || 'Failed to join WolfPack');
      } else {
        throw new Error('Failed to join WolfPack');
      }
      
      // Reload membership status
      await loadMembershipStatus();

    } catch (error) {
      console.error('Error joining WolfPack:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to join WolfPack';
      toast.error(errorMessage);
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const leaveWolfPack = async () => {
    if (!user?.id) return;

    try {
      setState(prev => ({ ...prev, isLoading: true }));

      // Update in the actual base table
      const { error } = await supabase
        .from('wolfpack_members_unified')
        .update({ 
          status: 'inactive',
          last_active: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Left WolfPack');
      setState(prev => ({
        ...prev,
        isLoading: false,
        isMember: false,
        currentMembership: null,
        currentLocation: null,
        members: []
      }));

    } catch (error) {
      console.error('Error leaving WolfPack:', error);
      toast.error('Failed to leave WolfPack');
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const updateTableLocation = async (tableLocation: string) => {
    if (!user?.id) return;

    try {
      // Update in the actual base table
      const { error } = await supabase
        .from('wolfpack_members_unified')
        .update({ 
          table_location: tableLocation,
          last_active: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      setState(prev => ({
        ...prev,
        currentMembership: prev.currentMembership ? {
          ...prev.currentMembership,
          table_location: tableLocation
        } : null
      }));

      // Reload members to get updated data
      if (state.currentMembership?.location_id) {
        await loadMembers(state.currentMembership.location_id);
      }

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

      navigator.geolocation.getCurrentPosition(
        resolve,
        reject,
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      );
    });
  };

  const formatTimeAgo = (dateString: string | null): string => {
    if (!dateString) return 'Unknown';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };

  // Loading state
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

  // Error state
  if (state.error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{state.error}</AlertDescription>
      </Alert>
    );
  }

  // Not a member - show join UI
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
          
          <Button 
            onClick={joinWolfPack} 
            className="w-full" 
            size="lg"
            disabled={state.isLoading}
          >
            <Shield className="mr-2 h-4 w-4" />
            Find & Join WolfPack
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Get location name
  const locationName = state.currentLocation?.name || 'Unknown Location';

  // Member UI
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Active WolfPack
          </CardTitle>
          <CardDescription>
            You&#39;re part of the pack at {locationName}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {locationName}
              </span>
            </div>
            <Badge variant="secondary">
              {state.members.length} members
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              Joined {formatTimeAgo(state.currentMembership?.joined_at || null)}
            </span>
          </div>

          {state.currentMembership?.table_location && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Table: {state.currentMembership.table_location}</span>
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
            
            <Button 
              variant="destructive" 
              onClick={leaveWolfPack} 
              size="sm"
              disabled={state.isLoading}
            >
              <LogOut className="mr-2 h-3 w-3" />
              Leave Pack
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Pack Members ({state.members.length})
          </CardTitle>
          <CardDescription>
            Other wolves currently at {locationName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {state.members.map((member, index) => {
              const isCurrentUser = member.id === user?.id;
              const displayName = member.display_name || `${member.first_name || ''} ${member.last_name || ''}`.trim() || 'Anonymous';
              const memberEmoji = member.wolf_emoji || '🐺';
              
              return (
                <div key={member.id || index}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        {member.avatar_url && <AvatarImage src={member.avatar_url} />}
                        <AvatarFallback>
                          {memberEmoji || displayName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {displayName}
                          </span>
                          {isCurrentUser && (
                            <Badge variant="outline" className="text-xs">You</Badge>
                          )}
                          {member.wolfpack_tier && member.wolfpack_tier !== 'basic' && (
                            <Badge variant="secondary" className="text-xs">
                              {member.wolfpack_tier}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {member.vibe_status && (
                            <>
                              <span>{member.vibe_status}</span>
                              <span>•</span>
                            </>
                          )}
                          <span>{formatTimeAgo(member.last_seen)}</span>
                        </div>
                      </div>
                    </div>

                    {!isCurrentUser && (
                      <Button variant="ghost" size="sm">
                        <MessageCircle className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  
                  {index < state.members.length - 1 && (
                    <Separator className="mt-3" />
                  )}
                </div>
              );
            })}
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