import React, { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { useUser } from '@/hooks/useUser';
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

// Type definitions
interface WolfpackMember {
  id: string;
  user_id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  table_location: string | null;
  joined_at: string;
  last_active: string;
  status: string;
  current_vibe: string | null;
  emoji: string | null;
  is_host: boolean;
}

interface Location {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
}

interface WolfpackStatus {
  isMember: boolean;
  membership: WolfpackMember | null;
  location: Location | null;
  databaseUserId: string | null;
}

interface MembershipState {
  isLoading: boolean;
  status: WolfpackStatus | null;
  members: WolfpackMember[];
  error: string | null;
}

export default function WolfpackMembershipManager() {
  const { user, loading: userLoading } = useUser();
  
  const [state, setState] = useState<MembershipState>({
    isLoading: true,
    status: null,
    members: [],
    error: null
  });

  // API call helper
  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    const response = await fetch(`/api/wolfpack${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'API call failed');
    }

    return data;
  };

  // Load wolfpack status
  const loadStatus = useCallback(async () => {
    if (!user?.id) {
      setState(prev => ({ ...prev, isLoading: false, status: null }));
      return;
    }

    // Load members for location - moved inside loadStatus to fix dependency issue
    const loadMembers = async (locationId: string) => {
      try {
        const membersData = await apiCall(`/members?location_id=${locationId}`);
        setState(prev => ({ ...prev, members: membersData.members || [] }));
      } catch (error) {
        console.error('Error loading members:', error);
        setState(prev => ({ ...prev, error: 'Failed to load members' }));
      }
    };

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const statusData = await apiCall('/status');
      
      setState(prev => ({ 
        ...prev, 
        status: {
          isMember: statusData.isMember,
          membership: statusData.membership,
          location: statusData.location,
          databaseUserId: statusData.databaseUserId
        }
      }));

      // Load members if user is in a pack
      if (statusData.isMember && statusData.membership?.location_id) {
        await loadMembers(statusData.membership.location_id);
      }

    } catch (error) {
      console.error('Error loading status:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to load status'
      }));
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [user?.id]);

  // Join wolfpack
  const joinWolfPack = async () => {
    if (!user?.id) {
      alert('Please log in to join WolfPack');
      return;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true }));

      // Get current position for location detection (but don't store unused variable)
      await getCurrentPosition();
      
      // For now, let's use a simple location selection
      // In production, you'd calculate distance to actual locations
      const locations = [
        { id: '50d17782-3f4a-43a1-b6b6-608171ca3c7c', name: 'THE SIDEHUSTLE BAR Salem' },
        { id: 'ec1e8869-454a-49d2-93e5-ed05f49bb932', name: 'THE SIDEHUSTLE BAR Portland' }
      ];

      const selectedLocation = prompt(
        `Select location:\n${locations.map((loc, i) => `${i + 1}. ${loc.name}`).join('\n')}\n\nEnter number:`
      );

      if (!selectedLocation) {
        setState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      const locationIndex = parseInt(selectedLocation) - 1;
      if (locationIndex < 0 || locationIndex >= locations.length) {
        alert('Invalid location selection');
        setState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      const chosenLocation = locations[locationIndex];

      // Join the wolfpack
      const joinData = await apiCall('/join', {
        method: 'POST',
        body: JSON.stringify({
          location_id: chosenLocation.id,
          current_vibe: 'Ready to party! 🎉'
        })
      });

      alert(`Joined WolfPack at ${joinData.membership.location_name}!`);
      
      // Reload status
      await loadStatus();

    } catch (error) {
      console.error('Error joining wolfpack:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to join WolfPack';
      alert(errorMessage);
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  // Leave wolfpack
  const leaveWolfPack = async () => {
    if (!user?.id) return;

    try {
      setState(prev => ({ ...prev, isLoading: true }));

      await apiCall('/leave', {
        method: 'DELETE'
      });

      alert('Left WolfPack');
      
      // Reset state
      setState(prev => ({
        ...prev,
        isLoading: false,
        status: {
          isMember: false,
          membership: null,
          location: null,
          databaseUserId: prev.status?.databaseUserId || null
        },
        members: []
      }));

    } catch (error) {
      console.error('Error leaving wolfpack:', error);
      alert('Failed to leave WolfPack');
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  // Update table location
  const updateTableLocation = async (tableLocation: string) => {
    try {
      await apiCall('/update', {
        method: 'PATCH',
        body: JSON.stringify({ table_location: tableLocation })
      });

      alert('Table location updated');
      
      // Reload status and members
      await loadStatus();

    } catch (error) {
      console.error('Error updating location:', error);
      alert('Failed to update table location');
    }
  };

  // Get current position
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

  // Format time ago
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

  // Load status on mount
  useEffect(() => {
    if (!userLoading) {
      loadStatus();
    }
  }, [userLoading, loadStatus]);

  // Loading state
  if (userLoading || state.isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-lg">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2">Loading WolfPack status...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (state.error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
          <span className="text-red-800">{state.error}</span>
        </div>
        <button 
          onClick={loadStatus}
          className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  // Not a member - show join UI
  if (!state.status?.isMember) {
    return (
      <div className="bg-white rounded-lg shadow-lg">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Join WolfPack
          </h2>
          <p className="text-gray-600 mt-1">
            Connect with other Side Hustle visitors in your area
          </p>
        </div>
        <div className="p-6 space-y-4">
          <div className="text-sm text-gray-600">
            <p>When you join a WolfPack, you can:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Chat with other members in real-time</li>
              <li>Share your table location with staff</li>
              <li>Get notifications about group activities</li>
              <li>Connect with fellow Side Hustle enthusiasts</li>
            </ul>
          </div>
          
          <button 
            onClick={joinWolfPack} 
            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={state.isLoading}
          >
            <Shield className="h-4 w-4" />
            {state.isLoading ? 'Finding WolfPack...' : 'Find & Join WolfPack'}
          </button>

          {/* Debug info */}
          {state.status?.databaseUserId && (
            <div className="text-xs text-gray-400 mt-2">
              Debug: Auth ID: {user?.id}, DB ID: {state.status.databaseUserId}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Member UI
  const locationName = state.status.location?.name || 'Unknown Location';
  const membership = state.status.membership;

  return (
    <div className="space-y-6">
      {/* Active WolfPack Card */}
      <div className="bg-white rounded-lg shadow-lg">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Active WolfPack
          </h2>
          <p className="text-gray-600 mt-1">
            You&apos;re part of the pack at {locationName}
          </p>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gray-500" />
              <span className="text-sm">{locationName}</span>
            </div>
            <div className="text-xs bg-gray-100 px-2 py-1 rounded">
              {state.members.length} members
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-500" />
            <span className="text-sm">
              Joined {formatTimeAgo(membership?.joined_at || null)}
            </span>
          </div>

          {membership?.table_location && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-500" />
              <span className="text-sm">Table: {membership.table_location}</span>
            </div>
          )}

          <div className="flex gap-2">
            <button 
              onClick={() => {
                const table = prompt('Enter your table number or location:');
                if (table) updateTableLocation(table);
              }}
              className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
            >
              <MapPin className="h-3 w-3" />
              Update Location
            </button>
            
            <button 
              onClick={leaveWolfPack} 
              className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:opacity-50"
              disabled={state.isLoading}
            >
              <LogOut className="h-3 w-3" />
              Leave Pack
            </button>
          </div>
        </div>
      </div>

      {/* Pack Members Card */}
      <div className="bg-white rounded-lg shadow-lg">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Pack Members ({state.members.length})
          </h2>
          <p className="text-gray-600 mt-1">
            Other wolves currently at {locationName}
          </p>
        </div>
        <div className="p-6">
          <div className="space-y-3">
            {state.members.map((member, index) => {
              const isCurrentUser = member.user_id === state.status?.databaseUserId;
              const displayName = member.display_name || member.username || 'Anonymous Wolf';
              const memberEmoji = member.emoji || '🐺';
              
              return (
                <div key={member.id || index}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm">
                        {member.avatar_url ? (
                          <Image
                            src={member.avatar_url}
                            alt={displayName}
                            className="w-full h-full rounded-full object-cover"
                            width={32}
                            height={32}
                          />
                        ) : (
                          <span>{memberEmoji}</span>
                        )}
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{displayName}</span>
                          {isCurrentUser && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">You</span>
                          )}
                          {member.is_host && (
                            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">Host</span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          {member.current_vibe && (
                            <>
                              <span>{member.current_vibe}</span>
                              <span>•</span>
                            </>
                          )}
                          <span>{formatTimeAgo(member.last_active)}</span>
                          {member.table_location && (
                            <>
                              <span>•</span>
                              <span>Table: {member.table_location}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {!isCurrentUser && (
                      <button className="p-2 hover:bg-gray-100 rounded-lg" aria-label="Send message">
                        <MessageCircle className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                  
                  {index < state.members.length - 1 && (
                    <hr className="mt-3" />
                  )}
                </div>
              );
            })}
          </div>

          {state.members.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No other members in this WolfPack yet</p>
              <p className="text-sm">Be the first to start the conversation!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}