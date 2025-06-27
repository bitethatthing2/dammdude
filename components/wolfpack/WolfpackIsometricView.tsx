"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  MessageCircle, 
  Heart, 
  Shield, 
  UserX,
  Users,
  User,
  Sparkles
} from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/useUser';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface WolfPackMember {
  id: string;
  user_id: string;
  location_id: string | null;
  table_location?: string | null;
  joined_at: string | null;
  last_active: string | null;
  status: string;
  position_x?: number;
  position_y?: number;
  user?: {
    email: string;
    first_name?: string | null;
    last_name?: string | null;
    role: string | null;
    wolf_profile?: {
      display_name: string | null;
      wolf_emoji: string | null;
      favorite_drink?: string | null;
      instagram_handle?: string | null;
      looking_for?: string | null;
      bio?: string | null;
      is_visible: boolean | null;
      profile_image_url?: string | null;
      allow_messages: boolean | null;
    } | null;
  };
}

interface WolfpackIsometricViewProps {
  locationId: string;
  currentUserId: string;
}

export function WolfpackIsometricView({ locationId, currentUserId }: WolfpackIsometricViewProps) {
  const { user } = useUser();
  const router = useRouter();
  const [members, setMembers] = useState<WolfPackMember[]>([]);
  const [selectedMember, setSelectedMember] = useState<WolfPackMember | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);

  const supabase = getSupabaseBrowserClient();

  // Load wolfpack members
  useEffect(() => {
    async function loadData() {
      if (!locationId || !currentUserId) return;

      try {
        setIsLoading(true);

        // Load active members
        const { data: memberData, error: memberError } = await supabase
          .from("wolfpack_members_unified")
          .select(`
            *,
            user:users (
              *,
              wolf_profile:wolf_profiles (*)
            )
          `)
          .eq('is_active', true)
          .eq('bar_location_id', locationId);

        if (memberError) throw memberError;
        setMembers(memberData || []);

        // Load blocked users
        const { data: blockData } = await supabase
          .from('wolf_pack_interactions')
          .select('receiver_id')
          .eq('sender_id', currentUserId)
          .eq('interaction_type', 'block');

        setBlockedUsers(blockData?.map(b => b.receiver_id).filter(Boolean) || []);

      } catch (error) {
        console.error('Error loading wolfpack data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();

    // Set up real-time subscription
    const memberSubscription = supabase
      .channel(`wolfpack_isometric_${locationId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'wolfpack_members_unified',
        filter: `bar_location_id=eq.${locationId}`
      }, loadData)
      .subscribe();

    return () => {
      memberSubscription.unsubscribe();
    };
  }, [locationId, currentUserId, supabase]);

  // Get member icon based on role
  const getMemberIcon = (member: WolfPackMember) => {
    const role = member.user?.role;
    if (role === 'dj') return '🎵';
    if (role === 'bartender') return '🐺';
    return member.user?.wolf_profile?.wolf_emoji || '🐾';
  };

  // Send interaction
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
        router.push(`/wolfpack/chat/private/${targetUserId}`);
      }
    } catch (error) {
      console.error('Error sending interaction:', error);
      toast.error('Failed to send interaction');
    }
  };

  const visibleMembers = members.filter(member => 
    member.user?.wolf_profile?.is_visible !== false && 
    !blockedUsers.includes(member.user_id)
  );

  if (isLoading) {
    return (
      <div className="h-[600px] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
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
          3D Wolf Pack View ({visibleMembers.length})
        </h3>
      </div>

      {/* 3D Isometric Platform View (CRITICAL REQUIREMENT) */}
      <div className="relative w-full h-[600px] bg-gradient-to-br from-black via-slate-900 to-slate-800 rounded-xl overflow-hidden shadow-2xl">
        {/* Isometric Container with 3D Transform */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div 
            className="isometric-container relative" 
            style={{
              width: '400px',
              height: '400px',
              transformStyle: 'preserve-3d',
              transform: 'rotateX(60deg) rotateZ(45deg)'
            }}
          >
            {/* Diamond Platform with Grid */}
            <div 
              className="isometric-platform absolute inset-0" 
              style={{
                background: 'linear-gradient(45deg, rgba(139, 69, 19, 0.3) 25%, transparent 25%), linear-gradient(-45deg, rgba(139, 69, 19, 0.3) 25%, transparent 25%)',
                backgroundSize: '40px 40px',
                border: '2px solid rgba(255, 215, 0, 0.3)',
                borderRadius: '50px',
                transform: 'rotateZ(-45deg) rotateX(-60deg)'
              }}
            >
              {/* Grid overlay for depth */}
              <div 
                className="absolute inset-0" 
                style={{
                  background: 'radial-gradient(circle at center, rgba(255, 215, 0, 0.1) 0%, transparent 70%)',
                  borderRadius: '50px'
                }} 
              />
            </div>

            {/* User Avatars in 3D Space */}
            <AnimatePresence>
              {visibleMembers.map((member, index) => {
                const isCurrentUser = member.user_id === currentUserId;
                const icon = getMemberIcon(member);
                
                // Calculate isometric position based on table location
                const getIsometricPosition = (tableLocation: string | null | undefined, index: number) => {
                  const positions = {
                    'bar_center': { x: 50, y: 30 },
                    'bar_left': { x: 20, y: 30 },
                    'bar_right': { x: 80, y: 30 },
                    'table_1': { x: 30, y: 60 },
                    'table_2': { x: 70, y: 60 },
                    'dj_booth': { x: 50, y: 10 },
                    'entrance': { x: 50, y: 90 },
                    'upstairs': { x: 25, y: 25 },
                    'patio': { x: 75, y: 85 }
                  };
                  
                  if (tableLocation) {
                    const key = Object.keys(positions).find(k => 
                      tableLocation.toLowerCase().includes(k.split('_')[0])
                    );
                    if (key) return positions[key as keyof typeof positions];
                  }
                  
                  // Default circular distribution
                  const angle = (index / visibleMembers.length) * 2 * Math.PI;
                  return {
                    x: 50 + Math.cos(angle) * 35,
                    y: 50 + Math.sin(angle) * 25
                  };
                };
                
                const position = getIsometricPosition(member.table_location, index);
                
                return (
                  <motion.div
                    key={member.id}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                    style={{
                      left: `${position.x}%`,
                      top: `${position.y}%`,
                      transformStyle: 'preserve-3d',
                      transform: 'translate(-50%, -50%) rotateX(-60deg) rotateZ(-45deg)'
                    }}
                    initial={{ scale: 0, y: -50, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    exit={{ scale: 0, y: -50, opacity: 0 }}
                    whileHover={{ scale: 1.2, z: 10 }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    {/* Avatar with interaction menu */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <div className="relative">
                          {/* 3D Avatar Container */}
                          <div className="relative w-16 h-16">
                            <Avatar className="w-full h-full border-2 border-background shadow-lg">
                              <AvatarImage src={member.user?.wolf_profile?.profile_image_url || undefined} />
                              <AvatarFallback className="text-lg font-bold">
                                {icon}
                              </AvatarFallback>
                            </Avatar>
                            
                            {/* Role Badge */}
                            {member.user?.role === 'dj' && (
                              <Badge className="absolute -bottom-1 -right-1 h-6 w-6 p-0 flex items-center justify-center bg-purple-600">
                                🎵
                              </Badge>
                            )}
                            {member.user?.role === 'bartender' && (
                              <Badge className="absolute -bottom-1 -right-1 h-6 w-6 p-0 flex items-center justify-center bg-green-600">
                                🐺
                              </Badge>
                            )}
                            
                            {/* Current User Indicator */}
                            {isCurrentUser && (
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 border-2 border-white rounded-full" />
                            )}
                          </div>
                          
                          {/* Name Label */}
                          <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-2 py-1 rounded text-xs whitespace-nowrap">
                            {(member.user?.wolf_profile?.display_name || member.user?.first_name || 'Wolf').slice(0, 10)}
                          </div>
                        </div>
                      </DropdownMenuTrigger>
                      
                      {/* Interaction Menu */}
                      {!isCurrentUser && (
                        <DropdownMenuContent align="start" className="w-48">
                          <DropdownMenuItem onClick={() => setSelectedMember(member)}>
                            <User className="mr-2 h-4 w-4" />
                            View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => sendInteraction(member.user_id, 'message')}>
                            <MessageCircle className="mr-2 h-4 w-4" />
                            Send Message
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => sendInteraction(member.user_id, 'wink')}>
                            <Sparkles className="mr-2 h-4 w-4" />
                            Send Wink
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      )}
                    </DropdownMenu>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
        
        {/* Bartender Menu Card (Bottom Right) */}
        {visibleMembers.filter(m => m.user?.role === 'bartender').length > 0 && (
          <Card className="absolute bottom-4 right-4 bg-black/90 text-white border-zinc-800 w-48">
            <CardHeader className="pb-2">
              <CardTitle className="text-center text-sm">Bartender</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <Avatar className="h-12 w-12 mb-3">
                <AvatarFallback className="bg-green-600">🐺</AvatarFallback>
              </Avatar>
              <Button 
                variant="secondary" 
                className="w-full text-xs"
                onClick={() => router.push('/menu')}
              >
                Food & Drink Menu
              </Button>
            </CardContent>
          </Card>
        )}
        
        {/* Order Display Bubbles */}
        <AnimatePresence>
          {visibleMembers
            .filter(m => m.table_location?.toLowerCase().includes('ordered'))
            .map((member, index) => (
              <motion.div
                key={`order-${member.id}`}
                className="absolute top-4 left-4"
                style={{ top: `${20 + index * 60}px` }}
                initial={{ scale: 0, x: -50 }}
                animate={{ scale: 1, x: 0 }}
                exit={{ scale: 0, x: -50 }}
              >
                <Card className="bg-background/95 backdrop-blur border shadow-lg">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{getMemberIcon(member)}</AvatarFallback>
                      </Avatar>
                      <CardTitle className="text-sm">Recent Order</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm font-medium">Nachos & Craft Beer</p>
                    <p className="text-xs text-muted-foreground">
                      {member.user?.wolf_profile?.display_name || 'Wolf'}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          }
        </AnimatePresence>

        {/* Empty State */}
        {visibleMembers.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white/60">
              <p className="text-lg mb-2">No pack members online right now</p>
              <p className="text-sm">Be the first to join the pack! 🐺</p>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-sm rounded-lg p-3 text-white text-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>You</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
              <span>Other Wolves</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span>Bartender</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
              <span>DJ</span>
            </div>
          </div>
        </div>
      </div>
      
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
                  <AvatarImage src={selectedMember.user?.wolf_profile?.profile_image_url || undefined} />
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
                  <p className="text-muted-foreground text-sm">
                    Ready to party! 🎉
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary">
                      {selectedMember.user?.role === 'dj' ? 'DJ' : 
                       selectedMember.user?.role === 'bartender' ? 'Bartender' : 'Wolf'}
                    </Badge>
                    {selectedMember.table_location && (
                      <Badge variant="outline" className="text-xs">
                        {selectedMember.table_location}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {selectedMember.user_id !== currentUserId && (
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
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}