"use client";

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
  Shield, 
  UserX,
  Users
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

export function WolfpackSpatialView({ locationId, currentUserId }: WolfpackSpatialViewProps) {
  const { user } = useUser();
  const router = useRouter();
  const [members, setMembers] = useState<WolfPackMember[]>([]);
  const [selectedMember, setSelectedMember] = useState<WolfPackMember | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);

  const supabase = getSupabaseBrowserClient();

  // Click handler for wolf interactions
  const handleWolfClick = useCallback((member: WolfPackMember) => {
    setSelectedMember(member);
  }, []);

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

        setMembers(memberData || []);

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

  // Get member icon based on role
  const getMemberIcon = (member: WolfPackMember) => {
    const role = member.users?.role;
    if (role === 'dj') return '⭐';
    if (role === 'bartender') return '🐺';
    return '🐾';
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
        
        setBlockedUsers((prev: string[]) => [...prev, targetUserId]);
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
        router.push(`/chat`);
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-6 w-6" />
            Wolf Pack View
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Animated Live Bar Map */}
      <div className="relative w-full h-[400px] bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-xl overflow-hidden">
        <motion.svg
          viewBox="0 0 800 600"
          className="w-full h-full cursor-pointer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Bar Background */}
          <defs>
            <linearGradient id="barGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1a1a2e" stopOpacity={1} />
              <stop offset="100%" stopColor="#16213e" stopOpacity={1} />
            </linearGradient>
          </defs>
          
          {/* Bar Layout */}
          <rect width="800" height="600" fill="url(#barGradient)" rx="12" />
          
          {/* Bar Counter */}
          <rect x="50" y="150" width="700" height="80" fill="#2a2a3e" rx="8" stroke="#444" strokeWidth="2" />
          <text x="400" y="195" textAnchor="middle" fill="#888" fontSize="14" fontFamily="system-ui">
            Bar Counter
          </text>
          
          {/* Tables */}
          <g>
            {/* Table 1 */}
            <circle cx="150" cy="350" r="30" fill="#2a2a3e" stroke="#444" strokeWidth="2" />
            <text x="150" y="355" textAnchor="middle" fill="#888" fontSize="10">Table 1</text>
            
            {/* Table 2 */}
            <circle cx="400" cy="350" r="30" fill="#2a2a3e" stroke="#444" strokeWidth="2" />
            <text x="400" y="355" textAnchor="middle" fill="#888" fontSize="10">Table 2</text>
            
            {/* Table 3 */}
            <circle cx="650" cy="350" r="30" fill="#2a2a3e" stroke="#444" strokeWidth="2" />
            <text x="650" y="355" textAnchor="middle" fill="#888" fontSize="10">Table 3</text>
            
            {/* High Tables */}
            <rect x="100" y="450" width="40" height="40" fill="#2a2a3e" stroke="#444" strokeWidth="2" rx="4" />
            <text x="120" y="473" textAnchor="middle" fill="#888" fontSize="8">High 1</text>
            
            <rect x="660" y="450" width="40" height="40" fill="#2a2a3e" stroke="#444" strokeWidth="2" rx="4" />
            <text x="680" y="473" textAnchor="middle" fill="#888" fontSize="8">High 2</text>
          </g>
          
          {/* DJ Booth */}
          <rect x="300" y="50" width="200" height="60" fill="#4a1a4a" stroke="#6a2a6a" strokeWidth="2" rx="8" />
          <text x="400" y="85" textAnchor="middle" fill="#9a6a9a" fontSize="12" fontFamily="system-ui">
            DJ Booth 🎵
          </text>
          
          {/* Wolf Pack Members */}
          <AnimatePresence>
            {visibleMembers.map((member, index) => {
              const isCurrentUser = member.user_id === currentUserId;
              const icon = getMemberIcon(member);
              
              // Calculate position based on table_location or use default positions
              let x = 400, y = 300; // Default center position
              
              if (member.table_location) {
                if (member.table_location.includes('Table 1')) { x = 150; y = 300; }
                else if (member.table_location.includes('Table 2')) { x = 400; y = 300; }
                else if (member.table_location.includes('Table 3')) { x = 650; y = 300; }
                else if (member.table_location.includes('High 1')) { x = 120; y = 420; }
                else if (member.table_location.includes('High 2')) { x = 680; y = 420; }
                else if (member.table_location.includes('Bar')) { x = 200 + (index * 80); y = 120; }
              } else {
                // Distribute members around the space if no specific table
                const angle = (index / visibleMembers.length) * 2 * Math.PI;
                x = 400 + Math.cos(angle) * 150;
                y = 350 + Math.sin(angle) * 100;
              }
              
              return (
                <motion.g
                  key={member.id}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleWolfClick(member)}
                  className="cursor-pointer"
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  {/* Wolf Avatar Background */}
                  <circle 
                    cx={x} 
                    cy={y} 
                    r="20" 
                    fill={isCurrentUser ? "#3b82f6" : "#6366f1"} 
                    stroke={isCurrentUser ? "#1d4ed8" : "#4f46e5"} 
                    strokeWidth="2"
                  />
                  
                  {/* Wolf Icon */}
                  <text 
                    x={x} 
                    y={y + 5} 
                    textAnchor="middle" 
                    fill="white" 
                    fontSize="20"
                    className="select-none"
                  >
                    {icon}
                  </text>
                  
                  {/* Name Label */}
                  <text 
                    x={x} 
                    y={y - 30} 
                    textAnchor="middle" 
                    fill="#e2e8f0" 
                    fontSize="12" 
                    fontFamily="system-ui"
                    className="select-none"
                  >
                    {member.wolf_profiles?.display_name || member.users?.first_name || 'Wolf'}
                  </text>
                  
                  {/* Current User Indicator */}
                  {isCurrentUser && (
                    <circle 
                      cx={x + 15} 
                      cy={y - 15} 
                      r="6" 
                      fill="#10b981" 
                      stroke="#065f46" 
                      strokeWidth="1"
                    />
                  )}
                  
                  {/* Activity Pulse for Active Users */}
                  <motion.circle
                    cx={x}
                    cy={y}
                    r="20"
                    fill="transparent"
                    stroke="#10b981"
                    strokeWidth="2"
                    initial={{ scale: 1, opacity: 0.6 }}
                    animate={{ scale: 1.5, opacity: 0 }}
                    transition={{ 
                      duration: 2, 
                      repeat: Infinity, 
                      ease: "easeOut" 
                    }}
                  />
                </motion.g>
              );
            })}
          </AnimatePresence>
          
          {/* Empty State */}
          {visibleMembers.length === 0 && (
            <motion.g
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <text x="400" y="300" textAnchor="middle" fill="#64748b" fontSize="18" fontFamily="system-ui">
                No pack members online right now
              </text>
              <text x="400" y="325" textAnchor="middle" fill="#64748b" fontSize="14" fontFamily="system-ui">
                Be the first to join the pack! 🐺
              </text>
            </motion.g>
          )}
        </motion.svg>
        
        {/* Legend */}
        <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur-sm rounded-lg p-3 text-white text-xs">
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
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Online</span>
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