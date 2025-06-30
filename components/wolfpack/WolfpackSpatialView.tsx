// Fixed WolfpackSpatialView.tsx - Updated for standardized database schema

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
  MapPin,
  Coffee,
  Wine
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useUser } from '@/hooks/useUser';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

// FIXED: Updated interface to match standardized database schema
interface WolfPackMember {
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
  // Spatial positioning (can be null if not set)
  position_x: number | null;
  position_y: number | null;
  // Calculated fields
  isCurrentUser?: boolean;
}

interface WolfpackSpatialViewProps {
  locationId: string;
  currentUserId: string;
}

export function WolfpackSpatialView({ locationId, currentUserId }: WolfpackSpatialViewProps) {
  const { user } = useUser();
  const router = useRouter();
  const [members, setMembers] = useState<WolfPackMember[]>([]);
  const [selectedMember, setSelectedMember] = useState<WolfPackMember | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // FIXED: Load members using correct schema
  const loadMembers = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Query users who are active wolfpack members
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
        .not('deleted_at', 'is', null);

      if (error) {
        console.error('Error loading members:', error);
        throw error;
      }

      // FIXED: Transform data to match interface (add positioning and flags)
      const transformedMembers: WolfPackMember[] = (memberData || []).map((member) => ({
        ...member,
        // Add positioning (random for demo, replace with actual positioning logic)
        position_x: Math.random() * 400 + 50, // Random position between 50-450
        position_y: Math.random() * 300 + 50, // Random position between 50-350
        isCurrentUser: member.id === currentUserId
      }));

      setMembers(transformedMembers);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error loading wolfpack members:', error);
      toast.error('Failed to load wolfpack members');
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId]);

  // FIXED: Use correct column names for interactions
  const sendInteraction = useCallback(async (targetUserId: string, type: 'wink' | 'message') => {
    if (!user || targetUserId === currentUserId) return;

    try {
      if (type === 'message') {
        router.push(`/wolfpack/chat/private/${targetUserId}`);
      } else if (type === 'wink') {
        const { error } = await supabase
          .from('wolf_pack_interactions')
          .insert({
            sender_id: user.id,     // FIXED: standardized column name
            receiver_id: targetUserId,  // FIXED: standardized column name
            interaction_type: 'wink',
            location_id: locationId,
            status: 'active',
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

  // Update member position (for spatial interaction)
  const updateMemberPosition = useCallback(async (memberId: string, x: number, y: number) => {
    if (memberId !== currentUserId) return; // Only allow updating own position

    try {
      // In a real app, you might store positions in a separate table
      // For now, we'll just update the local state
      setMembers(prev => prev.map(member => 
        member.id === memberId 
          ? { ...member, position_x: x, position_y: y }
          : member
      ));

      // Optionally persist to database
      // await supabase.from('user_positions').upsert({
      //   user_id: memberId,
      //   position_x: x,
      //   position_y: y,
      //   updated_at: new Date().toISOString()
      // });

    } catch (error) {
      console.error('Error updating position:', error);
    }
  }, [currentUserId]);

  // Initial data load
  useEffect(() => {
    if (currentUserId) {
      loadMembers();
    }
  }, [currentUserId, loadMembers]);

  // Set up real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('wolfpack_spatial')
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

  // Spatial member component
  const SpatialMember = ({ member }: { member: WolfPackMember }) => {
    const displayName = member.display_name || 
                       `${member.first_name || ''} ${member.last_name || ''}`.trim() ||
                       member.email.split('@')[0] ||
                       'Anonymous Wolf';

    const handleDrag = (
      event: MouseEvent | TouchEvent | PointerEvent, 
      info: { delta: { x: number; y: number } }
    ) => {
      if (member.isCurrentUser) {
        const newX = Math.max(25, Math.min(475, member.position_x! + info.delta.x));
        const newY = Math.max(25, Math.min(375, member.position_y! + info.delta.y));
        updateMemberPosition(member.id, newX, newY);
      }
    };

    return (
      <motion.div
        drag={member.isCurrentUser ? true : false}
        dragConstraints={{ left: 25, right: 475, top: 25, bottom: 375 }}
        onDrag={handleDrag}
        initial={{ 
          x: member.position_x || 100, 
          y: member.position_y || 100,
          scale: 0 
        }}
        animate={{ 
          x: member.position_x || 100, 
          y: member.position_y || 100,
          scale: 1 
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setSelectedMember(member)}
        className={`absolute cursor-pointer ${member.isCurrentUser ? 'cursor-move' : 'cursor-pointer'}`}
        style={{
          left: member.position_x || 100,
          top: member.position_y || 100
        }}
      >
        <div className="relative">
          <Avatar className={`w-12 h-12 border-2 ${member.isCurrentUser ? 'border-yellow-400' : 'border-white'} shadow-lg`}>
            <AvatarImage src={member.profile_image_url || member.avatar_url || undefined} />
            <AvatarFallback className="bg-blue-600 text-white font-bold text-xs">
              {member.wolf_emoji || displayName.charAt(0) || '🐺'}
            </AvatarFallback>
          </Avatar>
          
          {/* Online indicator */}
          {member.is_online && (
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
          )}
          
          {/* Role badge */}
          {member.role && member.role !== 'user' && (
            <div className="absolute -top-2 -right-2 w-4 h-4 bg-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">
                {member.role === 'dj' ? '🎵' : member.role === 'bartender' ? '🍺' : '⭐'}
              </span>
            </div>
          )}
          
          {/* Name label */}
          <div className="absolute top-14 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-2 py-1 rounded text-xs whitespace-nowrap">
            {displayName}
          </div>
        </div>
      </motion.div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-[500px] flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="animate-spin h-8 w-8 mx-auto mb-2" />
          <p className="text-muted-foreground">Loading Spatial View...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Spatial Wolfpack ({members.length})
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

      {/* Instructions */}
      <Card>
        <CardContent className="p-4">
          <div className="text-sm text-muted-foreground">
            {members.find(m => m.isCurrentUser) && (
              <p className="mb-2">
                <span className="font-semibold text-yellow-600">Your avatar</span> (with yellow border) can be dragged around. 
                Click on other members to see their profiles.
              </p>
            )}
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Online</span>
              </div>
              <div className="flex items-center gap-1">
                <span>🎵</span>
                <span>DJ</span>
              </div>
              <div className="flex items-center gap-1">
                <span>🍺</span>
                <span>Bartender</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Spatial View Container */}
      <Card>
        <CardContent className="p-0">
          <div className="relative w-full h-[400px] bg-gradient-to-br from-blue-900 via-purple-900 to-blue-800 overflow-hidden rounded-lg">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="grid grid-cols-8 grid-rows-6 h-full">
                {Array.from({ length: 48 }).map((_, i) => (
                  <div key={i} className="border border-white/20"></div>
                ))}
              </div>
            </div>
            
            {/* Members */}
            <AnimatePresence>
              {members.map((member) => (
                <SpatialMember key={member.id} member={member} />
              ))}
            </AnimatePresence>
            
            {/* Empty state */}
            {members.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-white/60">
                  <Users className="h-12 w-12 mx-auto mb-2" />
                  <p>No wolfpack members found</p>
                  <p className="text-sm">Join the pack to see others!</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

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
                  <AvatarImage src={selectedMember.profile_image_url || selectedMember.avatar_url || undefined} />
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
                <p className="text-sm">{selectedMember.vibe_status || 'Vibing in the spatial view'}</p>
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

              {/* Position Info */}
              <div className="p-3 bg-blue-50 rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Position
                </h4>
                <p className="text-sm">
                  X: {Math.round(selectedMember.position_x || 0)}, 
                  Y: {Math.round(selectedMember.position_y || 0)}
                </p>
              </div>

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