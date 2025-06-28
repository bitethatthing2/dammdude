'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  MessageCircle, 
  Heart, 
  Shield, 
  UserX,
  Users,
  User
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useUser } from '@/hooks/useUser';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

// Exact interface matching the actual backend structure
interface WolfPackMember {
  id: string;
  user_id: string;
  location_id: string | null;
  status: string | null;
  joined_at: string;
  last_active: string | null;
  latitude: number | null;
  longitude: number | null;
  position_x: number | null;
  position_y: number | null;
  table_location: string | null;
  is_active: boolean | null;
  username: string | null;
  avatar_url: string | null;
  favorite_drink: string | null;
  current_vibe: string | null;
  looking_for: string | null;
  instagram_handle: string | null;
  emoji: string | null;
  role: string | null;
  created_at: string;
  updated_at: string;
  session_id: string | null;
  display_name: string | null;
  is_host: boolean | null;
  left_at: string | null;
  status_enum: string | null;
}

interface WolfpackSpatialViewProps {
  locationId: string;
  currentUserId: string;
}

// Interaction types matching the backend constraint
type InteractionType = 'wink' | 'message' | 'block' | 'like' | 'super_like' | 'report' | 'view_profile';

interface WolfPackInteraction {
  id?: string;
  sender_id: string;
  receiver_id: string;
  interaction_type: InteractionType;
  location_id: string | null;
  message_content?: string | null;
  metadata?: Record<string, unknown>;
  status?: string;
  read_at?: string | null;
  expires_at?: string | null;
  created_at: string;
  updated_at?: string;
}

export function WolfpackSpatialView({ locationId, currentUserId }: WolfpackSpatialViewProps) {
  const { user } = useUser();
  const router = useRouter();
  const [members, setMembers] = useState<WolfPackMember[]>([]);
  const [selectedMember, setSelectedMember] = useState<WolfPackMember | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'honeycomb' | 'list'>('honeycomb');
  const [interactions, setInteractions] = useState<WolfPackInteraction[]>([]);

  // Send interaction with proper error handling and backend sync
  const sendInteraction = useCallback(async (targetUserId: string, type: InteractionType) => {
    if (!user || targetUserId === currentUserId) return;

    try {
      const interactionData = {
        sender_id: user.id,
        receiver_id: targetUserId,
        interaction_type: type,
        location_id: locationId,
        created_at: new Date().toISOString(),
        metadata: {
          location_name: 'The Side Hustle Bar',
          timestamp: Date.now()
        }
      };

      if (type === 'block') {
        // Remove any existing interactions with this user first
        await supabase
          .from('wolf_pack_interactions')
          .delete()
          .eq('sender_id', user.id)
          .eq('receiver_id', targetUserId);

        // Insert new block interaction
        const { error } = await supabase
          .from('wolf_pack_interactions')
          .insert(interactionData);

        if (error) throw error;
        
        setBlockedUsers(prev => [...prev, targetUserId]);
        toast.success('User blocked');
        setSelectedMember(null);

      } else if (type === 'wink') {
        // Check if already sent a wink recently (prevent spam)
        const recentWink = interactions.find(i => 
          i.receiver_id === targetUserId && 
          i.interaction_type === 'wink' &&
          new Date().getTime() - new Date(i.created_at).getTime() < 60000 // 1 minute cooldown
        );

        if (recentWink) {
          toast.error('Please wait before sending another wink');
          return;
        }

        const { error } = await supabase
          .from('wolf_pack_interactions')
          .insert(interactionData);

        if (error) throw error;
        
        setInteractions(prev => [...prev, { ...interactionData, id: Date.now().toString() }]);
        toast.success('Wink sent! 😉');

      } else if (type === 'message') {
        // Create private message record and navigate to chat
        const { error } = await supabase
          .from('wolf_private_messages')
          .insert({
            from_user_id: user.id,
            to_user_id: targetUserId,
            message: 'Started a conversation',
            created_at: new Date().toISOString()
          });

        if (error) throw error;

        // Navigate to private chat
        router.push(`/wolfpack/chat/private/${targetUserId}`);
        
      } else if (type === 'like' || type === 'super_like') {
        const { error } = await supabase
          .from('wolf_pack_interactions')
          .insert(interactionData);

        if (error) throw error;
        
        setInteractions(prev => [...prev, { ...interactionData, id: Date.now().toString() }]);
        toast.success(type === 'super_like' ? 'Super like sent! ⭐' : 'Like sent! ❤️');
        
      } else if (type === 'view_profile') {
        // Silent profile view tracking
        const { error } = await supabase
          .from('wolf_pack_interactions')
          .insert(interactionData);

        if (error) console.error('Error tracking profile view:', error);
      }

    } catch (error) {
      console.error('Error sending interaction:', error);
      toast.error(`Failed to send ${type}`);
    }
  }, [user, currentUserId, locationId, interactions, router]);

  // Click handler for wolf interactions
  const handleWolfClick = useCallback((member: WolfPackMember) => {
    if (member.user_id !== currentUserId) {
      setSelectedMember(member);
      // Record profile view
      sendInteraction(member.user_id, 'view_profile');
    }
  }, [currentUserId, sendInteraction]);

  // Load wolfpack members and interactions
  useEffect(() => {
    async function loadData() {
      if (!locationId || !currentUserId) {
        console.warn('Missing locationId or currentUserId:', { locationId, currentUserId });
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        // Load active members from the unified table
        const { data: memberData, error: memberError } = await supabase
          .from("wolfpack_members_unified")
          .select("*")
          .eq('is_active', true)
          .eq('location_id', locationId)
          .order('joined_at', { ascending: false });

        if (memberError) {
          console.error('Error loading wolfpack members:', memberError);
          throw memberError;
        }

        setMembers(memberData || []);

        // Load user interactions - with proper type checking
        const { data: interactionData, error: interactionError } = await supabase
          .from('wolf_pack_interactions')
          .select('*')
          .eq('sender_id', currentUserId)
          .eq('status', 'active');

        if (interactionError) {
          console.error('Error loading interactions:', interactionError);
        } else {
          // Filter and properly type the interactions
          const validInteractions = (interactionData || [])
            .filter((item) => 
              item.sender_id != null && 
              item.receiver_id != null && 
              item.interaction_type != null &&
              item.created_at != null
            ) as WolfPackInteraction[];
          
          setInteractions(validInteractions);
          
          // Extract blocked users - filter out nulls
          const blocked = validInteractions
            .filter(i => i.interaction_type === 'block')
            .map(i => i.receiver_id)
            .filter((id): id is string => id != null);
          
          setBlockedUsers(blocked);
        }

      } catch (error) {
        console.error('Error loading wolfpack data:', error);
        toast.error('Failed to load pack members');
      } finally {
        setIsLoading(false);
      }
    }

    loadData();

    // Set up real-time subscriptions
    const memberSubscription = supabase
      .channel(`wolfpack_members_${locationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wolfpack_members_unified',
          filter: `location_id=eq.${locationId}`
        },
        (payload) => {
          console.log('Member update:', payload);
          loadData();
        }
      )
      .subscribe();

    const interactionSubscription = supabase
      .channel(`wolfpack_interactions_${currentUserId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wolf_pack_interactions',
          filter: `receiver_id=eq.${currentUserId}`
        },
        (payload) => {
          console.log('Interaction update:', payload);
          // Handle incoming interactions (winks, messages, etc.)
          if (payload.eventType === 'INSERT' && payload.new) {
            const interaction = payload.new as WolfPackInteraction;
            if (interaction.interaction_type === 'wink') {
              const sender = members.find(m => m.user_id === interaction.sender_id);
              toast.success(`${sender?.display_name || sender?.username || 'Someone'} sent you a wink! 😉`);
            }
          }
        }
      )
      .subscribe();

    return () => {
      memberSubscription.unsubscribe();
      interactionSubscription.unsubscribe();
    };
  }, [locationId, currentUserId, members]);

  // Get member display info with proper fallbacks
  const getMemberDisplayInfo = (member: WolfPackMember) => {
    const name = member.display_name || member.username || 'Anonymous Wolf';
    const initials = name.charAt(0).toUpperCase() + (name.split(' ')[1]?.charAt(0).toUpperCase() || '');
    
    return {
      initials,
      name,
      avatar: member.avatar_url,
      role: member.role,
      isOnline: member.last_active ? 
        (new Date().getTime() - new Date(member.last_active).getTime()) < 300000 : // 5 minutes
        false
    };
  };

  // Get member border color based on role
  const getMemberBorderColor = (member: WolfPackMember, isCurrentUser: boolean) => {
    if (member.role === 'dj') return 'border-violet-500'; 
    if (member.role === 'bartender') return 'border-green-500'; 
    if (isCurrentUser) return 'border-blue-500'; 
    return 'border-slate-400';
  };

  // Get background color for avatar fallback
  const getMemberBgColor = (member: WolfPackMember, isCurrentUser: boolean) => {
    if (member.role === 'dj') return 'bg-violet-600'; 
    if (member.role === 'bartender') return 'bg-green-600'; 
    if (isCurrentUser) return 'bg-blue-600'; 
    return 'bg-slate-600';
  };

  // Honeycomb positioning system for scalability
  const getHoneycombPosition = (index: number) => {
    // Center position for first member
    if (index === 0) {
      return { x: 50, y: 50 };
    }

    // Calculate ring and position within ring
    let ring = 1;
    let positionInRing = index - 1;
    let membersInCurrentRing = 6;

    // Find which ring this member belongs to
    while (positionInRing >= membersInCurrentRing) {
      positionInRing -= membersInCurrentRing;
      ring++;
      membersInCurrentRing = ring * 6;
    }

    // Calculate position within the ring
    const ringRadius = ring * 20; // Adjust spacing between rings
    const angleStep = (2 * Math.PI) / membersInCurrentRing;
    const angle = positionInRing * angleStep - Math.PI / 2; // Start from top

    const x = 50 + (ringRadius * Math.cos(angle));
    const y = 50 + (ringRadius * Math.sin(angle));

    // Ensure positions stay within container bounds
    return {
      x: Math.max(8, Math.min(92, x)),
      y: Math.max(12, Math.min(88, y))
    };
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
      setInteractions(prev => prev.filter(i => !(i.receiver_id === targetUserId && i.interaction_type === 'block')));
      toast.success('User unblocked');
    } catch (error) {
      console.error('Error unblocking user:', error);
      toast.error('Failed to unblock user');
    }
  };

  // Filter visible members (exclude blocked users)
  const visibleMembers = members.filter(member => 
    !blockedUsers.includes(member.user_id)
  );

  // Check if user has been interacted with
  const hasInteractedWith = (userId: string, interactionType: InteractionType) => {
    return interactions.some(i => i.receiver_id === userId && i.interaction_type === interactionType);
  };

  if (isLoading) {
    return (
      <div className="min-h-[400px] bg-background text-foreground flex items-center justify-center">
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
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Users className="h-5 w-5" />
          Live Pack View
          <Badge variant="secondary" className="ml-2">
            {visibleMembers.length} wolves active
          </Badge>
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setViewMode(prev => prev === 'honeycomb' ? 'list' : 'honeycomb')}
          className="md:hidden"
        >
          {viewMode === 'honeycomb' ? 'List View' : 'Pack View'}
        </Button>
      </div>

      {/* Enhanced Honeycomb Layout */}
      <div className="relative w-full h-[600px] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl overflow-hidden border border-border shadow-lg">
        
        {/* Honeycomb Grid Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
            <defs>
              <pattern id="honeycomb" x="0" y="0" width="10" height="8.66" patternUnits="userSpaceOnUse">
                <polygon points="5,0 8.66,2.5 8.66,6.5 5,9 1.34,6.5 1.34,2.5" 
                         fill="none" stroke="currentColor" strokeWidth="0.2"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#honeycomb)" />
          </svg>
        </div>

        {/* Container for all members */}
        <div className="absolute inset-4">
          {/* Wolf Pack Members in Honeycomb Layout */}
          <AnimatePresence>
            {visibleMembers.map((member, index) => {
              const isCurrentUser = member.user_id === currentUserId;
              const displayInfo = getMemberDisplayInfo(member);
              const borderColor = getMemberBorderColor(member, isCurrentUser);
              const bgColor = getMemberBgColor(member, isCurrentUser);
              
              // Get honeycomb position
              const position = getHoneycombPosition(index);
              
              return (
                <motion.div
                  key={member.id}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10 group"
                  style={{
                    left: `${position.x}%`,
                    top: `${position.y}%`
                  }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  whileHover={{ scale: 1.15, zIndex: 20 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleWolfClick(member)}
                  transition={{ type: "spring", stiffness: 300, damping: 20, delay: index * 0.05 }}
                >
                  {/* Member Avatar with Profile Image */}
                  <div className="relative">
                    <Avatar className={`w-12 h-12 border-2 shadow-lg transition-all ${borderColor}`}>
                      <AvatarImage 
                        src={displayInfo.avatar || undefined} 
                        alt={displayInfo.name}
                        className="object-cover"
                      />
                      <AvatarFallback className={`text-sm font-bold text-white ${bgColor}`}>
                        {displayInfo.initials}
                      </AvatarFallback>
                    </Avatar>
                    
                    {/* Role indicator ring for special roles */}
                    {(member.role === 'dj' || member.role === 'bartender') && (
                      <div 
                        className={`absolute -inset-1 rounded-full border-2 border-dashed animate-pulse
                          ${member.role === 'dj' ? 'border-yellow-400' : 'border-green-400'}`}
                      />
                    )}
                    
                    {/* Current user indicator */}
                    {isCurrentUser && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 border border-white rounded-full" />
                    )}
                    
                    {/* Online status indicator */}
                    <div className={`absolute -bottom-0.5 -left-0.5 w-3 h-3 border border-white rounded-full ${
                      displayInfo.isOnline ? 'bg-green-500' : 'bg-gray-400'
                    }`} />
                    
                    {/* Role badge for special users */}
                    {member.role && (member.role === 'dj' || member.role === 'bartender') && (
                      <div className={`absolute -bottom-1 -right-1 w-5 h-3 text-xs font-bold text-white rounded-sm flex items-center justify-center
                        ${member.role === 'dj' ? 'bg-violet-600' : 'bg-green-600'}`}>
                        {member.role === 'dj' ? 'DJ' : 'B'}
                      </div>
                    )}
                  </div>
                  
                  {/* Name label on hover */}
                  <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black/90 text-white px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30">
                    {displayInfo.name.slice(0, 12)}
                  </div>
                  
                  {/* Quick action buttons on hover */}
                  {!isCurrentUser && (
                    <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto z-30">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          sendInteraction(member.user_id, 'message');
                        }}
                        className="w-6 h-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center transition-colors shadow-lg"
                        title="Send Message"
                      >
                        <MessageCircle className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          sendInteraction(member.user_id, 'wink');
                        }}
                        className={`w-6 h-6 text-white rounded-full flex items-center justify-center transition-colors shadow-lg ${
                          hasInteractedWith(member.user_id, 'wink') 
                            ? 'bg-pink-400 cursor-not-allowed' 
                            : 'bg-pink-600 hover:bg-pink-700'
                        }`}
                        title={hasInteractedWith(member.user_id, 'wink') ? "Already winked" : "Send Wink"}
                        disabled={hasInteractedWith(member.user_id, 'wink')}
                      >
                        <Heart className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Empty State */}
        {visibleMembers.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
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
              <div className="w-3 h-3 bg-slate-500 rounded-full"></div>
              <span>Wolves</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span>Bartender</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-violet-500 rounded-full animate-pulse"></div>
              <span>DJ</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>Online</span>
            </div>
          </div>
        </div>

        {/* Special Role Quick Access */}
        <div className="absolute top-4 right-4 space-y-2">
          {visibleMembers.filter(m => m.role === 'bartender').length > 0 && (
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="bg-green-600/90 text-white px-3 py-2 rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition-all text-sm"
              onClick={() => {
                const bartender = visibleMembers.find(m => m.role === 'bartender');
                if (bartender) handleWolfClick(bartender);
              }}
            >
              <div className="flex items-center gap-2 font-bold">
                <span>🐺</span>
                <span>Bartender</span>
              </div>
            </motion.div>
          )}
          
          {visibleMembers.filter(m => m.role === 'dj').length > 0 && (
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-violet-600/90 text-white px-3 py-2 rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition-all text-sm"
              onClick={() => {
                const dj = visibleMembers.find(m => m.role === 'dj');
                if (dj) handleWolfClick(dj);
              }}
            >
              <div className="flex items-center gap-2 font-bold">
                <span>🎵</span>
                <span>DJ Live</span>
              </div>
            </motion.div>
          )}
        </div>
      </div>
      
      {/* Enhanced Member Profile Dialog */}
      <Dialog open={!!selectedMember} onOpenChange={() => setSelectedMember(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Wolf Profile
            </DialogTitle>
          </DialogHeader>
          
          {selectedMember && (
            <div className="space-y-4">
              {/* Profile Header */}
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border-2 border-primary/20">
                  <AvatarImage 
                    src={selectedMember.avatar_url || undefined} 
                    alt={selectedMember.display_name || 'Wolf'}
                    className="object-cover"
                  />
                  <AvatarFallback className="text-lg bg-primary/10">
                    {getMemberDisplayInfo(selectedMember).initials}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <h3 className="text-xl font-bold">
                    {selectedMember.display_name || selectedMember.username || 'Anonymous Wolf'}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {selectedMember.current_vibe || 'Ready to party! 🎉'}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary">
                      {selectedMember.role === 'dj' ? 'DJ' : 
                       selectedMember.role === 'bartender' ? 'Bartender' : 'Wolf'}
                    </Badge>
                    <div className={`w-2 h-2 rounded-full ${
                      getMemberDisplayInfo(selectedMember).isOnline ? 'bg-green-500' : 'bg-gray-400'
                    }`} />
                  </div>
                </div>
              </div>

              {/* Profile Details */}
              <div className="space-y-3">
                {selectedMember.current_vibe && (
                  <div>
                    <h4 className="font-medium mb-1">Current Vibe</h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedMember.current_vibe}
                    </p>
                  </div>
                )}

                {selectedMember.favorite_drink && (
                  <div>
                    <h4 className="font-medium mb-1">Favorite Drink</h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedMember.favorite_drink}
                    </p>
                  </div>
                )}

                {selectedMember.looking_for && (
                  <div>
                    <h4 className="font-medium mb-1">Looking For</h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedMember.looking_for}
                    </p>
                  </div>
                )}

                {selectedMember.instagram_handle && (
                  <div>
                    <h4 className="font-medium mb-1">Instagram</h4>
                    <p className="text-sm text-muted-foreground">
                      @{selectedMember.instagram_handle}
                    </p>
                  </div>
                )}

                {selectedMember.table_location && (
                  <div>
                    <h4 className="font-medium mb-1">Current Location</h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedMember.table_location}
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {selectedMember.user_id !== currentUserId && (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => sendInteraction(selectedMember.user_id, 'wink')}
                      className="flex-1"
                      disabled={hasInteractedWith(selectedMember.user_id, 'wink')}
                    >
                      <Heart className="h-4 w-4 mr-2" />
                      {hasInteractedWith(selectedMember.user_id, 'wink') ? 'Winked' : 'Send Wink'}
                    </Button>
                    <Button
                      onClick={() => sendInteraction(selectedMember.user_id, 'message')}
                      className="flex-1"
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Message
                    </Button>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => sendInteraction(selectedMember.user_id, 'like')}
                      className="flex-1"
                      disabled={hasInteractedWith(selectedMember.user_id, 'like')}
                    >
                      ❤️ {hasInteractedWith(selectedMember.user_id, 'like') ? 'Liked' : 'Like'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => sendInteraction(selectedMember.user_id, 'super_like')}
                      className="flex-1"
                      disabled={hasInteractedWith(selectedMember.user_id, 'super_like')}
                    >
                      ⭐ {hasInteractedWith(selectedMember.user_id, 'super_like') ? 'Super Liked' : 'Super Like'}
                    </Button>
                  </div>

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
                    All interactions are private and respectful
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}