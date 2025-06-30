'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  MessageCircle, 
  Heart, 
  Users,
  RefreshCw,
  Coffee,
  Wine
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useUser } from '@/hooks/useUser';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

// FIXED: Match actual database schema
interface DatabaseUser {
  id: string;
  display_name: string | null;
  wolf_emoji: string | null;
  bio: string | null;
  vibe_status: string | null;
  avatar_url: string | null;
  profile_image_url: string | null;
  role: string | null;
  favorite_drink: string | null;
  wolfpack_status: string | null;
  wolfpack_tier: string | null;
  is_wolfpack_member: boolean | null;
  location_id: string | null;
  last_activity: string | null;
  created_at: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  is_online: boolean | null;
}

// Simplified interface for the component
interface WolfPackMember {
  id: string;
  display_name: string | null;
  wolf_emoji: string | null;
  bio: string | null;
  current_activity: string | null;
  avatar_url: string | null;
  role: string | null;
  vibe_status: string | null;
  last_activity_at: string;
  favorite_drink: string | null;
  isCurrentUser: boolean;
  email: string;
  first_name: string | null;
  last_name: string | null;
  wolfpack_status: string | null;
  is_online: boolean;
}

interface MembersByArea {
  dj_booth: WolfPackMember[];
  bar: WolfPackMember[];
  pack_general: WolfPackMember[];
}

interface WolfpackAreaBasedViewProps {
  locationId: string;
  currentUserId: string;
}

// Area configuration
const areaConfig = {
  dj_booth: {
    title: 'DJ BOOTH',
    icon: '🎵',
    color: 'bg-purple-600',
    textColor: 'text-purple-400',
    description: 'Where the beats drop'
  },
  bar: {
    title: 'THE BAR',
    icon: '🍺',
    color: 'bg-green-600',
    textColor: 'text-green-400',
    description: 'Bartenders serving up magic'
  },
  pack_general: {
    title: 'WOLFPACK AREA',
    icon: '🐺',
    color: 'bg-blue-600',
    textColor: 'text-blue-400',
    description: 'Where the pack gathers'
  }
} as const;

export function WolfpackAreaBasedView({ locationId, currentUserId }: WolfpackAreaBasedViewProps) {
  const { user } = useUser();
  const router = useRouter();
  const [membersByArea, setMembersByArea] = useState<MembersByArea>({
    dj_booth: [],
    bar: [],
    pack_general: []
  });
  const [selectedMember, setSelectedMember] = useState<WolfPackMember | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // FIXED: Load members using correct schema and field names
  const loadMembers = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Query users who are wolfpack members and at this location
      const { data: memberData, error } = await supabase
        .from("users")
        .select(`
          id,
          display_name,
          wolf_emoji,
          bio,
          vibe_status,
          avatar_url,
          profile_image_url,
          role,
          favorite_drink,
          wolfpack_status,
          wolfpack_tier,
          is_wolfpack_member,
          location_id,
          last_activity,
          created_at,
          first_name,
          last_name,
          email,
          is_online
        `)
        .eq('is_wolfpack_member', true)
        .eq('wolfpack_status', 'active')
        .not('deleted_at', 'is', null); // Exclude soft-deleted users

      if (error) {
        console.error('Error loading members:', error);
        throw error;
      }

      // FIXED: Transform data to match component interface
      const members: WolfPackMember[] = (memberData || []).map((member: DatabaseUser) => ({
        id: member.id,
        display_name: member.display_name,
        wolf_emoji: member.wolf_emoji,
        bio: member.bio,
        current_activity: member.vibe_status || 'Vibing',
        avatar_url: member.profile_image_url || member.avatar_url,
        role: member.role,
        vibe_status: member.vibe_status,
        last_activity_at: member.last_activity || member.created_at,
        favorite_drink: member.favorite_drink,
        isCurrentUser: member.id === currentUserId,
        email: member.email,
        first_name: member.first_name,
        last_name: member.last_name,
        wolfpack_status: member.wolfpack_status,
        is_online: member.is_online || false
      }));

      // Group by role-based areas
      const groupedMembers: MembersByArea = {
        dj_booth: members.filter((m) => m.role === 'dj'),
        bar: members.filter((m) => m.role === 'bartender'),
        pack_general: members.filter((m) => !m.role || (m.role !== 'dj' && m.role !== 'bartender'))
      };

      setMembersByArea(groupedMembers);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error loading wolfpack members:', error);
      toast.error('Failed to load wolfpack members');
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId]);

  // FIXED: Simplified join logic - just ensure user is wolfpack member
  const joinLocation = useCallback(async () => {
    if (!user) return;

    try {
      // Update user to be active wolfpack member
      const { error } = await supabase
        .from('users')
        .update({
          wolfpack_status: 'active',
          is_wolfpack_member: true,
          last_activity: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error joining wolfpack:', error);
        throw error;
      }

      toast.success('Welcome to the Wolfpack!');
      await loadMembers();
    } catch (error) {
      console.error('Error joining wolfpack:', error);
      toast.error('Failed to join wolfpack');
    }
  }, [user, loadMembers]);

  // FIXED: Use correct column names (sender_id/receiver_id)
  const sendInteraction = useCallback(async (targetUserId: string, type: 'wink' | 'message') => {
    if (!user || targetUserId === currentUserId) return;

    try {
      if (type === 'message') {
        router.push(`/wolfpack/chat/private/${targetUserId}`);
      } else if (type === 'wink') {
        const { error } = await supabase
          .from('wolf_pack_interactions')
          .insert({
            sender_id: user.id,     // FIXED: was from_user_id
            receiver_id: targetUserId,  // FIXED: was to_user_id
            interaction_type: 'wink',
            location_id: locationId,
            status: 'active',           // FIXED: was 'sent'
            created_at: new Date().toISOString()
          });

        if (error) throw error;
        toast.success('Wink sent! 😉');
      }
    } catch (error) {
      console.error('Error sending interaction:', error);
      toast.error('Failed to send interaction');
    }
  }, [user, currentUserId, router, locationId]);

  // Get total member count
  const getTotalMembers = useCallback(() => {
    return membersByArea.dj_booth.length + membersByArea.bar.length + membersByArea.pack_general.length;
  }, [membersByArea]);

  // Initial data load
  useEffect(() => {
    if (currentUserId) {
      loadMembers();
      if (user) {
        joinLocation();
      }
    }
  }, [currentUserId, user, loadMembers, joinLocation]);

  // FIXED: Set up real-time subscription for users table
  useEffect(() => {
    const channel = supabase
      .channel('wolfpack_members')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users',
          filter: 'is_wolfpack_member=eq.true'
        },
        () => {
          void loadMembers();
        }
      )
      .subscribe();

    // Refresh every 30 seconds
    const interval = setInterval(() => {
      void loadMembers();
    }, 30000);

    return () => {
      void supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [loadMembers]);

  // Member card component
  const MemberCard = ({ member, area }: { member: WolfPackMember; area: keyof MembersByArea }) => {
    // FIXED: Better display name logic
    const displayName = member.display_name || 
                       `${member.first_name || ''} ${member.last_name || ''}`.trim() ||
                       member.email.split('@')[0] ||
                       'Anonymous Wolf';

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        whileHover={{ scale: 1.02 }}
        onClick={() => setSelectedMember(member)}
        className={`${areaConfig[area].color} p-3 rounded-lg cursor-pointer hover:opacity-90 transition-all duration-200`}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="w-12 h-12 border-2 border-white/30">
              <AvatarImage src={member.avatar_url || undefined} />
              <AvatarFallback className="bg-white/20 text-white font-bold">
                {member.wolf_emoji || displayName.charAt(0) || '🐺'}
              </AvatarFallback>
            </Avatar>
            
            {/* Online indicator */}
            {member.is_online && (
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white text-sm truncate">
                {displayName}
              </h3>
              {member.isCurrentUser && (
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
              )}
            </div>
            
            {member.role && member.role !== 'user' && (
              <Badge className="bg-white/20 text-white text-xs mt-1">
                {member.role === 'dj' ? 'DJ' : member.role === 'bartender' ? 'BAR' : member.role.toUpperCase()}
              </Badge>
            )}
            
            <p className="text-white/80 text-xs mt-1 truncate">
              {member.current_activity || 'Vibing'}
            </p>
          </div>
        </div>
      </motion.div>
    );
  };

  // Area section component
  const AreaSection = ({ areaKey, members }: { areaKey: keyof MembersByArea; members: WolfPackMember[] }) => {
    const config = areaConfig[areaKey];
    
    return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">{config.icon}</span>
            <h2 className={`font-bold text-sm ${config.textColor}`}>
              {config.title}
            </h2>
            <Badge variant="secondary" className="text-xs">
              {members.length}
            </Badge>
          </div>
        </div>
        
        <p className="text-muted-foreground text-xs mb-3">{config.description}</p>
        
        <div className="space-y-2">
          <AnimatePresence>
            {members.length > 0 ? (
              members.map((member) => (
                <MemberCard 
                  key={member.id} 
                  member={member} 
                  area={areaKey}
                />
              ))
            ) : (
              <div className="text-center py-4 text-muted-foreground text-sm">
                No one in this area right now
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="animate-spin h-8 w-8 mx-auto mb-2" />
          <p className="text-muted-foreground">Loading Wolf Pack...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Users className="h-5 w-5" />
          Wolf Pack ({getTotalMembers()})
        </h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => void loadMembers()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          {lastUpdated && (
            <span className="text-xs text-muted-foreground">
              Updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Stats Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4 text-primary" />
                <span className="font-semibold">{getTotalMembers()}</span>
                <span className="text-muted-foreground">active</span>
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-muted-foreground">DJ: {membersByArea.dj_booth.length}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-muted-foreground">Bar: {membersByArea.bar.length}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-muted-foreground">Pack: {membersByArea.pack_general.length}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Members by Area */}
      <div className="space-y-6">
        <AreaSection areaKey="dj_booth" members={membersByArea.dj_booth} />
        <AreaSection areaKey="bar" members={membersByArea.bar} />
        <AreaSection areaKey="pack_general" members={membersByArea.pack_general} />
      </div>

      {/* Food & Drink Menu Card (if bartenders present) */}
      {membersByArea.bar.length > 0 && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-center text-sm flex items-center justify-center gap-2">
              🍺 Bartender Available
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <Button 
              variant="secondary" 
              className="w-full"
              onClick={() => router.push('/menu')}
            >
              View Food & Drink Menu
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Member Profile Dialog */}
      <Dialog open={!!selectedMember} onOpenChange={() => setSelectedMember(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-2xl">{selectedMember?.wolf_emoji || '🐺'}</span>
              Wolf Profile
            </DialogTitle>
          </DialogHeader>
          
          {selectedMember && (
            <div className="space-y-4">
              {/* Profile Header */}
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedMember.avatar_url || undefined} />
                  <AvatarFallback className="text-lg">
                    {selectedMember.wolf_emoji || selectedMember.display_name?.charAt(0) || 'W'}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <h3 className="text-xl font-bold">
                    {selectedMember.display_name || 
                     `${selectedMember.first_name || ''} ${selectedMember.last_name || ''}`.trim() ||
                     'Anonymous Wolf'}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {selectedMember.vibe_status || 'Ready to party! 🎉'}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary">
                      {selectedMember.role === 'dj' ? 'DJ' : 
                       selectedMember.role === 'bartender' ? 'Bartender' : 'Wolf'}
                    </Badge>
                    {selectedMember.is_online && (
                      <Badge variant="outline" className="text-green-600">
                        Online
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Bio */}
              {selectedMember.bio && (
                <div>
                  <p className="text-sm text-muted-foreground">{selectedMember.bio}</p>
                </div>
              )}

              {/* Current Activity */}
              <div className="p-3 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Coffee className="h-4 w-4" />
                  Currently
                </h4>
                <p className="text-sm">{selectedMember.current_activity || 'Vibing'}</p>
              </div>

              {/* Favorite Drink */}
              {selectedMember.favorite_drink && (
                <div className="p-3 bg-amber-50 rounded-lg">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Wine className="h-4 w-4" />
                    Favorite Drink
                  </h4>
                  <p className="text-sm">{selectedMember.favorite_drink}</p>
                </div>
              )}

              {/* Action Buttons */}
              {!selectedMember.isCurrentUser && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => void sendInteraction(selectedMember.id, 'wink')}
                    className="flex-1"
                  >
                    <Heart className="h-4 w-4 mr-2" />
                    Send Wink
                  </Button>
                  <Button
                    onClick={() => void sendInteraction(selectedMember.id, 'message')}
                    className="flex-1"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Message
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}