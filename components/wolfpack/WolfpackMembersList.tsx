"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, 
  MapPin, 
  Crown, 
  Mic, 
  Star,
  Eye,
  MessageCircle,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/useUser';
import { toast } from 'sonner';

interface WolfPackMember {
  id: string;
  user_id: string;
  location_id: string;
  table_location?: string;
  joined_at: string;
  last_activity: string;
  status: 'active' | 'inactive';
  user?: {
    email: string;
    first_name?: string;
    last_name?: string;
    role: string;
    wolf_profile?: {
      display_name: string;
      wolf_emoji: string;
      vibe_status: string;  // NOT wolfpack_status
      favorite_drink?: string;
      instagram_handle?: string;
      looking_for?: string;
      bio?: string;
      is_visible: boolean;
      profile_image_url?: string;
      allow_messages?: boolean;
    };
  };
}

interface SimpleMemberData {
  id: string;
  user_id: string;
  location_id: string;
  table_location?: string;
  joined_at: string;
  last_activity: string;
  status: 'active' | 'inactive';
  user?: {
    email: string;
    first_name?: string;
    last_name?: string;
    role: string;
  };
}

interface WolfPackMembersListProps {
  locationId: string;
  currentUserId: string;
}

export function WolfPackMembersList({ locationId, currentUserId }: WolfPackMembersListProps) {
  const router = useRouter();
  const { user } = useUser();
  const [members, setMembers] = useState<WolfPackMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<WolfPackMember | null>(null);

  const supabase = getSupabaseBrowserClient();

  // Load wolfpack members
  useEffect(() => {
    async function loadMembers() {
      if (!locationId || !currentUserId) {
        console.warn('Missing locationId or currentUserId:', { locationId, currentUserId });
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Try the full query first
        let query = supabase
          .from('wolfpack_memberships')
          .select(`
            *,
            user:users (
              *,
              wolf_profile:wolf_profiles (*)
            )
          `)
          .eq('status', 'active');

        // Handle location filter correctly - avoid NULL query issues
        if (locationId === null || locationId === undefined) {
          query = query.is('location_id', null);
        } else {
          query = query.eq('location_id', locationId);
        }

        const { data, error } = await query.order('joined_at', { ascending: false });

        if (error) {
          // If it's a relationship error, try a simpler query
          if (error.code === 'PGRST200') {
            console.log('Wolf profiles relationship not found, trying simpler query...');
            let simpleQuery = supabase
              .from('wolfpack_memberships')
              .select(`
                *,
                user:users (*)
              `)
              .eq('status', 'active');

            // Handle location filter correctly for fallback query too
            if (locationId === null || locationId === undefined) {
              simpleQuery = simpleQuery.is('location_id', null);
            } else {
              simpleQuery = simpleQuery.eq('location_id', locationId);
            }

            const { data: simpleData, error: simpleError } = await simpleQuery.order('joined_at', { ascending: false });

            if (simpleError) throw simpleError;

            // Transform data to match expected interface (without wolf_profile)
            const transformedData = simpleData?.map((member: SimpleMemberData) => ({
              ...member,
              user: member.user ? {
                ...member.user,
                wolf_profile: {
                  display_name: 'Anonymous Wolf',
                  wolf_emoji: '🐺',
                  vibe_status: 'Just joined',
                  favorite_drink: null,
                  instagram_handle: null,
                  looking_for: null,
                  bio: null,
                  is_visible: true,
                  profile_image_url: null,
                  allow_messages: true
                }
              } : undefined
            })) || [];

            setMembers(transformedData);
          } else {
            throw error;
          }
        } else {
          setMembers(data || []);
        }
      } catch (error) {
        console.error('Error loading wolfpack members:', error);
        setError('Failed to load wolfpack members');
      } finally {
        setIsLoading(false);
      }
    }

    loadMembers();

    // Set up real-time subscription for member changes
    if (locationId) {
      const memberSubscription = supabase
        .channel(`wolfpack_members_${locationId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'wolfpack_memberships',
            filter: `location_id=eq.${locationId}`
          },
          () => {
            loadMembers(); // Reload members when changes occur
          }
        )
        .subscribe();

      return () => {
        memberSubscription.unsubscribe();
      };
    }
  }, [locationId, currentUserId, supabase]);

  // Send wink to another member
  const sendWink = async (targetUserId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('wolf_pack_interactions')
        .insert({
          sender_id: user.id,
          receiver_id: targetUserId,
          interaction_type: 'wink',
          location_id: locationId,
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      toast.success('Wink sent! 😉');
    } catch (error) {
      console.error('Error sending wink:', error);
      toast.error('Failed to send wink');
    }
  };

  // Start private chat
  const startPrivateChat = (targetUserId: string, displayName: string) => {
    router.push(`/wolfpack/chat/private/${targetUserId}?name=${encodeURIComponent(displayName)}`);
  };

  // Get member role display
  const getMemberRoleDisplay = (member: WolfPackMember) => {
    const role = member.user?.role;
    if (role === 'dj') return { icon: Mic, label: 'DJ', color: 'bg-purple-500' };
    if (role === 'bartender') return { icon: Crown, label: 'Bartender', color: 'bg-orange-500' };
    return { icon: Star, label: 'Wolf', color: 'bg-blue-500' };
  };

  // Format time since joined
  const getTimeSinceJoined = (joinedAt: string) => {
    const now = new Date();
    const joined = new Date(joinedAt);
    const diffMs = now.getTime() - joined.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just joined';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return 'Earlier today';
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            WolfPack Members
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading pack members...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            WolfPack Members
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const visibleMembers = members.filter(member => 
    member.user?.wolf_profile?.is_visible !== false
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            WolfPack Members
            <Badge variant="secondary">{visibleMembers.length}</Badge>
          </CardTitle>
          <CardDescription>
            Current pack members at this location
          </CardDescription>
        </CardHeader>
        <CardContent>
          {visibleMembers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">No other pack members visible</p>
              <p className="text-sm text-muted-foreground">Be the first to start the conversation!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {visibleMembers.map((member) => {
                const isCurrentUser = member.user_id === currentUserId;
                const roleDisplay = getMemberRoleDisplay(member);
                const RoleIcon = roleDisplay.icon;

                return (
                  <div
                    key={member.id}
                    className={`p-4 rounded-lg border transition-all cursor-pointer hover:shadow-md ${
                      isCurrentUser 
                        ? 'bg-primary/5 border-primary/20' 
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedMember(member)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={member.user?.wolf_profile?.profile_image_url} />
                          <AvatarFallback>
                            {member.user?.wolf_profile?.wolf_emoji || 
                             member.user?.wolf_profile?.display_name?.charAt(0)?.toUpperCase() || 
                             'W'}
                          </AvatarFallback>
                        </Avatar>
                        
                        {/* Role indicator */}
                        <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full ${roleDisplay.color} flex items-center justify-center`}>
                          <RoleIcon className="h-3 w-3 text-white" />
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium truncate">
                            {member.user?.wolf_profile?.display_name || 
                             member.user?.first_name || 
                             'Anonymous Wolf'}
                          </h3>
                          {isCurrentUser && (
                            <Badge variant="outline" className="text-xs">You</Badge>
                          )}
                          <Badge variant="secondary" className="text-xs">
                            {roleDisplay.label}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-1">
                          {member.user?.wolf_profile?.vibe_status || 'Ready to party! 🎉'}
                        </p>
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {member.table_location || 'At the bar'}
                          </span>
                          <span>{getTimeSinceJoined(member.joined_at)}</span>
                        </div>
                      </div>

                      {!isCurrentUser && (
                        <div className="flex flex-col gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              sendWink(member.user_id);
                            }}
                            className="w-full"
                          >
                            😉 Wink
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              startPrivateChat(
                                member.user_id, 
                                member.user?.wolf_profile?.display_name || 'Anonymous Wolf'
                              );
                            }}
                            className="w-full"
                          >
                            <MessageCircle className="h-3 w-3 mr-1" />
                            Chat
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Member Profile Modal */}
      {selectedMember && (
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Wolf Profile
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedMember(null)}
              >
                ✕
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={selectedMember.user?.wolf_profile?.profile_image_url} />
                <AvatarFallback className="text-lg">
                  {selectedMember.user?.wolf_profile?.wolf_emoji || 
                   selectedMember.user?.wolf_profile?.display_name?.charAt(0)?.toUpperCase() || 
                   'W'}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <h3 className="text-xl font-bold">
                  {selectedMember.user?.wolf_profile?.display_name || 'Anonymous Wolf'}
                </h3>
                <p className="text-muted-foreground">
                  {selectedMember.user?.wolf_profile?.vibe_status || 'Ready to party! 🎉'}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary">
                    {getMemberRoleDisplay(selectedMember).label}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {getTimeSinceJoined(selectedMember.joined_at)}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {selectedMember.user?.wolf_profile?.bio && (
                <div>
                  <h4 className="font-medium mb-1">About</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedMember.user.wolf_profile.bio}
                  </p>
                </div>
              )}

              {selectedMember.user?.wolf_profile?.favorite_drink && (
                <div>
                  <h4 className="font-medium mb-1">Favorite Drink</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedMember.user.wolf_profile.favorite_drink}
                  </p>
                </div>
              )}

              {selectedMember.user?.wolf_profile?.looking_for && (
                <div>
                  <h4 className="font-medium mb-1">Looking For</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedMember.user.wolf_profile.looking_for}
                  </p>
                </div>
              )}

              {selectedMember.table_location && (
                <div>
                  <h4 className="font-medium mb-1">Location</h4>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {selectedMember.table_location}
                  </p>
                </div>
              )}

              {selectedMember.user?.wolf_profile?.instagram_handle && (
                <div>
                  <h4 className="font-medium mb-1">Instagram</h4>
                  <p className="text-sm text-muted-foreground">
                    @{selectedMember.user.wolf_profile.instagram_handle}
                  </p>
                </div>
              )}
            </div>

            {selectedMember.user_id !== currentUserId && (
              <div className="flex gap-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => sendWink(selectedMember.user_id)}
                  className="flex-1"
                >
                  😉 Send Wink
                </Button>
                <Button
                  onClick={() => startPrivateChat(
                    selectedMember.user_id,
                    selectedMember.user?.wolf_profile?.display_name || 'Anonymous Wolf'
                  )}
                  className="flex-1"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Start Chat
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
