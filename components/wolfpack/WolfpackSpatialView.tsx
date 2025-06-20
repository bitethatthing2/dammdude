"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  MessageCircle, 
  Heart, 
  Shield, 
  UserX
} from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/useUser';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface WolfPackMember {
  id: string;
  user_id: string;
  location_id: string;
  table_location?: string;
  joined_at: string;
  last_activity: string;
  is_active: boolean;
  position_x?: number;
  position_y?: number;
  wolf_profiles?: {
    display_name: string;
    wolf_emoji: string;
    vibe_status: string;
    favorite_drink?: string;
    instagram_handle?: string;
    looking_for?: string;
    bio?: string;
    is_visible: boolean;
    profile_image_url?: string;
    allow_messages: boolean;
  };
  users?: {
    email: string;
    first_name?: string;
    last_name?: string;
    role: string;
  };
}

interface WolfpackSpatialViewProps {
  locationId: string;
  currentUserId: string;
}

import './WolfpackSpatialView.css';

export function WolfpackSpatialView({ locationId, currentUserId }: WolfpackSpatialViewProps) {
  const { user } = useUser();
  const router = useRouter();
  const [members, setMembers] = useState<WolfPackMember[]>([]);
  const [selectedMember, setSelectedMember] = useState<WolfPackMember | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);

  const supabase = getSupabaseBrowserClient();

  // Load wolfpack members and blocked users
  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);

        // Load members
        const { data: memberData, error: memberError } = await supabase
          .from('wolf_pack_members')
          .select(`
            *,
            wolf_profiles (
              display_name,
              wolf_emoji,
              vibe_status,
              favorite_drink,
              instagram_handle,
              looking_for,
              bio,
              is_visible,
              profile_image_url,
              allow_messages
            ),
            users (
              email,
              first_name,
              last_name,
              role
            )
          `)
          .eq('location_id', locationId)
          .eq('is_active', true)
          .order('joined_at', { ascending: false });

        if (memberError) throw memberError;

        // Assign random positions for spatial layout if not set
        const membersWithPositions = (memberData || []).map((member: WolfPackMember, index: number) => ({
          ...member,
          position_x: member.position_x || getRandomPosition(index, 'x'),
          position_y: member.position_y || getRandomPosition(index, 'y')
        }));

        setMembers(membersWithPositions);

        // Load blocked users
        const { data: blockData } = await supabase
          .from('wolf_pack_interactions')
          .select('receiver_id')
          .eq('sender_id', currentUserId)
          .eq('interaction_type', 'block');

        setBlockedUsers(blockData?.map((b: { receiver_id: string }) => b.receiver_id) || []);

      } catch (error) {
        console.error('Error loading wolfpack data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    if (locationId) {
      loadData();

      // Set up real-time subscription
      const memberSubscription = supabase
        .channel(`wolfpack_spatial_${locationId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'wolf_pack_members',
            filter: `location_id=eq.${locationId}`
          },
          () => {
            loadData(); // Reload when changes occur
          }
        )
        .subscribe();

      return () => {
        memberSubscription.unsubscribe();
      };
    }
  }, [locationId, currentUserId, supabase]);

  // Generate random but consistent positions for members
  const getRandomPosition = (index: number, axis: 'x' | 'y') => {
    const seed = index + (axis === 'x' ? 1 : 2);
    const random = Math.sin(seed) * 10000;
    const normalized = random - Math.floor(random);
    
    if (axis === 'x') {
      return Math.floor(normalized * 70) + 15; // 15% to 85% width
    } else {
      return Math.floor(normalized * 60) + 20; // 20% to 80% height
    }
  };

  // Get member icon based on role
  const getMemberIcon = (member: WolfPackMember) => {
    const role = member.users?.role;
    if (role === 'dj') return '⭐';
    if (role === 'bartender') return '🐺';
    return '🐾';
  };

  // Get member display color based on role
  const getMemberColor = (member: WolfPackMember) => {
    const role = member.users?.role;
    if (role === 'dj') return 'text-purple-600';
    if (role === 'bartender') return 'text-orange-600';
    return 'text-blue-600';
  };

  // Send interaction (wink, message, etc.)
  const sendInteraction = async (targetUserId: string, type: 'wink' | 'message' | 'block') => {
    if (!user || targetUserId === currentUserId) return;

    try {
      if (type === 'block') {
        const { error } = await supabase
          .from('wolf_pack_interactions')
          .upsert({
            sender_id: user.id,
            receiver_id: targetUserId,
            interaction_type: 'block',
            location_id: locationId,
            created_at: new Date().toISOString()
          });

        if (error) throw error;
        
        setBlockedUsers(prev => [...prev, targetUserId]);
        toast.success('User blocked');
        setSelectedMember(null);
      } else if (type === 'wink') {
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
      } else if (type === 'message') {
        router.push(`/wolfpack/chat/private/${targetUserId}?name=${encodeURIComponent(selectedMember?.wolf_profiles?.display_name || 'Wolf')}`);
      }
    } catch (error) {
      console.error('Error sending interaction:', error);
      toast.error('Failed to send interaction');
    }
  };

  // Unblock user
  const unblockUser = async (targetUserId: string) => {
    try {
      const { error } = await supabase
        .from('wolf_pack_interactions')
        .delete()
        .eq('sender_id', currentUserId)
        .eq('receiver_id', targetUserId)
        .eq('interaction_type', 'block');

      if (error) throw error;

      setBlockedUsers(prev => prev.filter(id => id !== targetUserId));
      toast.success('User unblocked');
    } catch (error) {
      console.error('Error unblocking user:', error);
      toast.error('Failed to unblock user');
    }
  };

  const visibleMembers = members.filter(member => 
    member.wolf_profiles?.is_visible !== false && 
    !blockedUsers.includes(member.user_id)
  );

  if (isLoading) {
    return (
      <Card className="h-[600px]">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold">WOLFPACK VIEW</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Spatial View */}
      <Card className="h-[600px] relative overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-center text-3xl font-bold tracking-wide">
            WOLFPACK VIEW
          </CardTitle>
          <div className="text-center text-sm text-muted-foreground">
            {visibleMembers.length} members at the bar
          </div>
        </CardHeader>
        
        <CardContent className="relative h-full p-4">
          {/* Bar Layout Background */}
          <div className="absolute inset-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg border-2 border-dashed border-amber-200">
            
            {/* Member Icons Positioned Spatially */}
            {visibleMembers.map((member) => {
              const isCurrentUser = member.user_id === currentUserId;
              const icon = getMemberIcon(member);
              const colorClass = getMemberColor(member);
              return (
                <div
                  key={member.id}
                  className={`wolfpack-member-icon absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all hover:scale-110 ${
                    isCurrentUser ? 'animate-pulse' : ''
                  }`}
                  style={{
                    '--member-x': `${member.position_x}%`,
                    '--member-y': `${member.position_y}%`
                  } as React.CSSProperties}
                  onClick={() => setSelectedMember(member)}
                >
                  <div className="flex flex-col items-center group">
                    <div className={`text-4xl ${colorClass} drop-shadow-lg group-hover:drop-shadow-xl transition-all`}>
                      {icon}
                    </div>
                    <div className={`text-xs font-semibold mt-1 px-2 py-1 bg-white/80 rounded shadow-sm ${
                      isCurrentUser ? 'bg-primary/20 border border-primary' : ''
                    }`}>
                      {member.wolf_profiles?.display_name || member.users?.first_name || 'Wolf'}
                      {isCurrentUser && (
                        <Badge variant="outline" className="ml-1 text-xs">You</Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Legend */}
            <div className="absolute bottom-4 left-4 bg-white/90 p-3 rounded-lg shadow-sm">
              <div className="text-xs font-semibold mb-2">LEGEND</div>
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-purple-600">⭐</span>
                  <span>DJ</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-orange-600">🐺</span>
                  <span>BARTENDER</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-blue-600">🐾</span>
                  <span>PACK MEMBER</span>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="absolute bottom-4 right-4 bg-white/90 p-3 rounded-lg shadow-sm max-w-xs">
              <div className="text-xs text-muted-foreground">
                Click on any wolf icon to interact, send messages, or view profiles
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Member Profile Dialog */}
      {selectedMember && (
        <Dialog open={!!selectedMember} onOpenChange={() => setSelectedMember(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span className="text-2xl">{getMemberIcon(selectedMember)}</span>
                Wolf Profile
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Profile Header */}
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedMember.wolf_profiles?.profile_image_url} />
                  <AvatarFallback className="text-lg">
                    {selectedMember.wolf_profiles?.wolf_emoji || 
                     selectedMember.wolf_profiles?.display_name?.charAt(0)?.toUpperCase() || 
                     'W'}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <h3 className="text-xl font-bold">
                    {selectedMember.wolf_profiles?.display_name || 'Anonymous Wolf'}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {selectedMember.wolf_profiles?.vibe_status || 'Ready to party! 🎉'}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary">
                      {selectedMember.users?.role === 'dj' ? 'DJ' : 
                       selectedMember.users?.role === 'bartender' ? 'Bartender' : 'Wolf'}
                    </Badge>
                    {selectedMember.table_location && (
                      <Badge variant="outline" className="text-xs">
                        {selectedMember.table_location}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Profile Details */}
              <div className="space-y-3">
                {selectedMember.wolf_profiles?.bio && (
                  <div>
                    <h4 className="font-medium mb-1">About</h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedMember.wolf_profiles.bio}
                    </p>
                  </div>
                )}

                {selectedMember.wolf_profiles?.favorite_drink && (
                  <div>
                    <h4 className="font-medium mb-1">Favorite Drink</h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedMember.wolf_profiles.favorite_drink}
                    </p>
                  </div>
                )}

                {selectedMember.wolf_profiles?.looking_for && (
                  <div>
                    <h4 className="font-medium mb-1">Looking For</h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedMember.wolf_profiles.looking_for}
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {selectedMember.user_id !== currentUserId && (
                <div className="space-y-2">
                  {selectedMember.wolf_profiles?.allow_messages !== false && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => sendInteraction(selectedMember.user_id, 'wink')}
                        className="flex-1"
                      >
                        <Heart className="h-4 w-4 mr-2" />
                        Send Wink
                      </Button>
                      <Button
                        onClick={() => sendInteraction(selectedMember.user_id, 'message')}
                        className="flex-1"
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Message
                      </Button>
                    </div>
                  )}

                  {blockedUsers.includes(selectedMember.user_id) ? (
                    <Button
                      variant="outline"
                      onClick={() => unblockUser(selectedMember.user_id)}
                      className="w-full"
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      Unblock User
                    </Button>
                  ) : (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => sendInteraction(selectedMember.user_id, 'block')}
                      className="w-full"
                    >
                      <UserX className="h-4 w-4 mr-2" />
                      Block User
                    </Button>
                  )}

                  <p className="text-xs text-muted-foreground text-center">
                    Blocking prevents this user from messaging you
                  </p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
