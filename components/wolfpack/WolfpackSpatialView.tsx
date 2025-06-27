'use client';

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
  Menu,
  X,
  User,
  MoreVertical
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useUser } from '@/hooks/useUser';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

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
  display_name: string | null;
  is_host: boolean | null;
  left_at: string | null;
  status_enum: string | null;
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
  const [showBartenderMenu, setShowBartenderMenu] = useState(false);
  const [viewMode, setViewMode] = useState<'hexagonal' | 'list'>('hexagonal');

  // Click handler for wolf interactions
  const handleWolfClick = useCallback((member: WolfPackMember) => {
    setSelectedMember(member);
  }, []);

  // Load wolfpack members and blocked users
  useEffect(() => {
    async function loadData() {
      if (!locationId || !currentUserId) {
        console.warn('Missing locationId or currentUserId:', { locationId, currentUserId });
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        // Query the correct table: wolfpack_members_unified
        let memberQuery = supabase
          .from("wolfpack_members_unified")
          .select('*')
          .eq('is_active', true);

        // Handle location filter correctly
        if (locationId === null || locationId === undefined) {
          memberQuery = memberQuery.is('location_id', null);
        } else {
          memberQuery = memberQuery.eq('location_id', locationId);
        }

        const { data: memberData, error: memberError } = await memberQuery.order('joined_at', { ascending: false });

        if (memberError) {
          console.error('Error loading wolfpack members:', memberError);
          throw memberError;
        }

        setMembers(memberData || []);

        // Load blocked users
        const { data: blockData } = await supabase
          .from('wolf_pack_interactions')
          .select('receiver_id')
          .eq('sender_id', currentUserId)
          .eq('interaction_type', 'block');

        setBlockedUsers(blockData?.map((b: { receiver_id: string | null }) => b.receiver_id).filter((id): id is string => id !== null) || []);

      } catch (error) {
        console.error('Error loading wolfpack data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    if (locationId) {
      loadData();

      // Set up real-time subscription for the correct table
      const memberSubscription = supabase
        .channel(`wolfpack_spatial_${locationId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'wolfpack_members_unified',
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

  // Get member icon based on role with exclusive wolf emojis
  const getMemberIcon = (member: WolfPackMember) => {
    const role = member.role;
    if (role === 'dj') return '🎵'; // DJ gets music emoji
    if (role === 'bartender') return '🐺'; // Bartender gets exclusive wolf emoji
    return member.emoji || '🐾'; // Default wolf paw
  };

  // Get member bubble color based on role (using CSS variables from your theme)
  const getMemberBubbleColor = (member: WolfPackMember, isCurrentUser: boolean) => {
    const role = member.role;
    if (role === 'dj') return 'bg-violet-600 border-violet-500'; 
    if (role === 'bartender') return 'bg-green-600 border-green-500'; 
    if (isCurrentUser) return 'bg-blue-600 border-blue-500'; 
    return 'bg-slate-600 border-slate-500'; // Default
  };

  // Hexagonal positioning system
  const getHexagonalPosition = (index: number, total: number) => {
    if (total === 1) return { x: 50, y: 50 };
    
    // Predefined positions for clean hexagonal layout
    const positions = [
      { x: 50, y: 25 },  // Top center (DJ position)
      { x: 75, y: 37.5 },  // Top right
      { x: 75, y: 62.5 },  // Bottom right
      { x: 50, y: 75 },  // Bottom center
      { x: 25, y: 62.5 },  // Bottom left
      { x: 25, y: 37.5 },  // Top left
    ];
    
    if (index < positions.length) {
      return positions[index];
    }
    
    // For additional members, create outer ring
    const outerRingIndex = index - positions.length;
    const angle = (outerRingIndex / Math.max(1, total - positions.length)) * 2 * Math.PI;
    return {
      x: 50 + Math.cos(angle) * 35,
      y: 50 + Math.sin(angle) * 30
    };
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
        router.push(`/wolfpack/chat`);
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

  // Filter visible members
  const visibleMembers = members.filter(member => 
    !blockedUsers.includes(member.user_id)
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
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
          Wolf Pack Members ({visibleMembers.length})
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setViewMode(prev => prev === 'hexagonal' ? 'list' : 'hexagonal')}
          className="md:hidden"
        >
          {viewMode === 'hexagonal' ? 'List View' : 'Hex View'}
        </Button>
      </div>

      {/* Mobile List View */}
      {viewMode === 'list' && (
        <div className="block md:hidden space-y-3">
          {visibleMembers.map((member) => {
            const isCurrentUser = member.user_id === currentUserId;
            const icon = getMemberIcon(member);
            const colorClasses = getMemberBubbleColor(member, isCurrentUser);
            
            return (
              <Card key={member.id} className="cursor-pointer hover:shadow-md transition-all"
                    onClick={() => handleWolfClick(member)}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white border-2 ${colorClasses}`}>
                        {icon}
                      </div>
                      {isCurrentUser && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold">
                        {member.display_name || member.username || 'Wolf'}
                        {isCurrentUser && <span className="text-sm text-muted-foreground ml-2">(You)</span>}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {member.table_location || 'Roaming the bar'}
                      </p>
                      {member.role && (
                        <Badge variant="secondary" className="text-xs mt-1">
                          {member.role === 'dj' ? 'DJ' : member.role === 'bartender' ? 'Bartender' : 'Member'}
                        </Badge>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setSelectedMember(member)}>
                          <User className="mr-2 h-4 w-4" />
                          View Profile
                        </DropdownMenuItem>
                        {!isCurrentUser && (
                          <>
                            <DropdownMenuItem onClick={() => sendInteraction(member.user_id, 'message')}>
                              <MessageCircle className="mr-2 h-4 w-4" />
                              Send Message
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => sendInteraction(member.user_id, 'wink')}>
                              <Heart className="mr-2 h-4 w-4" />
                              Send Wink
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Enhanced Hexagonal Layout */}
      <div className={`relative w-full ${viewMode === 'hexagonal' ? 'block' : 'hidden md:block'} h-[450px] md:h-[500px] bg-gradient-to-br from-background via-muted/10 to-background rounded-xl overflow-hidden border border-border shadow-lg`}>
        {/* Hexagonal Grid Background */}
        <div className="absolute inset-0 opacity-5">
          <svg width="100%" height="100%" viewBox="0 0 800 600">
            <defs>
              <pattern id="hexPattern" x="0" y="0" width="60" height="52" patternUnits="userSpaceOnUse">
                <polygon points="30,2 54,15 54,37 30,50 6,37 6,15" 
                         fill="none" stroke="currentColor" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#hexPattern)" />
          </svg>
        </div>

        {/* Central Hexagonal Platform */}
        <motion.svg
          viewBox="0 0 800 600"
          className="w-full h-full cursor-pointer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Central hexagon platform */}
          <polygon 
            points="400,150 550,225 550,375 400,450 250,375 250,225" 
            fill="hsl(var(--muted) / 0.1)" 
            stroke="hsl(var(--border))" 
            strokeWidth="2"
          />
          
          {/* Inner hexagon connections */}
          <g stroke="hsl(var(--border) / 0.3)" strokeWidth="1">
            <line x1="400" y1="150" x2="400" y2="300" />
            <line x1="550" y1="225" x2="400" y2="300" />
            <line x1="550" y1="375" x2="400" y2="300" />
            <line x1="400" y1="450" x2="400" y2="300" />
            <line x1="250" y1="375" x2="400" y2="300" />
            <line x1="250" y1="225" x2="400" y2="300" />
          </g>
          
          {/* Wolf Pack Members with Hexagonal Positioning */}
          <AnimatePresence>
            {visibleMembers.map((member, index) => {
              const isCurrentUser = member.user_id === currentUserId;
              const icon = getMemberIcon(member);
              const colors = getMemberBubbleColor(member, isCurrentUser);
              
              // Get hexagonal position
              const position = getHexagonalPosition(index, visibleMembers.length);
              const x = 400 + (position.x - 50) * 6; // Scale and center
              const y = 300 + (position.y - 50) * 4; // Scale and center
              
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
                  {/* Enhanced Wolf Avatar Background with proper color mapping */}
                  <circle 
                    cx={x} 
                    cy={y} 
                    r="24" 
                    fill={member.role === 'dj' ? '#7c3aed' : 
                          member.role === 'bartender' ? '#059669' :
                          isCurrentUser ? '#2563eb' : '#475569'} 
                    stroke={member.role === 'dj' ? '#6d28d9' : 
                            member.role === 'bartender' ? '#047857' :
                            isCurrentUser ? '#1d4ed8' : '#334155'} 
                    strokeWidth="3"
                    filter="drop-shadow(0 4px 8px rgba(0,0,0,0.2))"
                  />
                  
                  {/* Role indicator ring for special roles */}
                  {(member.role === 'dj' || member.role === 'bartender') && (
                    <circle 
                      cx={x} 
                      cy={y} 
                      r="28" 
                      fill="none" 
                      stroke={member.role === 'dj' ? '#fbbf24' : '#10b981'} 
                      strokeWidth="2"
                      strokeDasharray="4 4"
                      className="animate-pulse"
                    />
                  )}
                  
                  {/* Enhanced Wolf Icon */}
                  <text 
                    x={x} 
                    y={y + 8} 
                    textAnchor="middle" 
                    fill="white" 
                    fontSize="24"
                    className="select-none font-bold"
                    filter="drop-shadow(0 1px 2px rgba(0,0,0,0.5))"
                  >
                    {icon}
                  </text>
                  
                  {/* Enhanced Name Label with Background */}
                  <rect
                    x={x - 40}
                    y={y - 45}
                    width="80"
                    height="18"
                    fill="rgba(0,0,0,0.7)"
                    rx="9"
                    ry="9"
                  />
                  <text 
                    x={x} 
                    y={y - 32} 
                    textAnchor="middle" 
                    fill="#ffffff" 
                    fontSize="12" 
                    fontFamily="system-ui"
                    className="select-none font-medium"
                  >
                    {(member.display_name || member.username || 'Wolf').slice(0, 12)}
                  </text>
                  
                  {/* Role badge for special users */}
                  {member.role && (member.role === 'dj' || member.role === 'bartender') && (
                    <>
                      <rect
                        x={x - 18}
                        y={y - 60}
                        width="36"
                        height="14"
                        fill={member.role === 'dj' ? '#7c3aed' : '#059669'}
                        rx="7"
                        ry="7"
                      />
                      <text 
                        x={x} 
                        y={y - 51} 
                        textAnchor="middle" 
                        fill="white" 
                        fontSize="9" 
                        fontFamily="system-ui"
                        className="select-none font-bold"
                      >
                        {member.role === 'dj' ? 'DJ' : 'BAR'}
                      </text>
                    </>
                  )}
                  
                  {/* Current User Indicator */}
                  {isCurrentUser && (
                    <circle 
                      cx={x + 18} 
                      cy={y - 18} 
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
                    r="22"
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
              <text x="400" y="300" textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize="18" fontFamily="system-ui">
                No pack members online right now
              </text>
              <text x="400" y="325" textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize="14" fontFamily="system-ui">
                Be the first to join the pack! 🐺
              </text>
            </motion.g>
          )}
        </motion.svg>
        
        {/* Order Notification (Left Side) */}
        {visibleMembers.find(m => m.table_location?.toLowerCase().includes('ordered')) && (
          <motion.div 
            className="absolute top-4 left-4 bg-card/90 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg max-w-xs"
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
          >
            <div className="flex items-center gap-2 mb-1">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-green-600">🐺</AvatarFallback>
              </Avatar>
              <span className="font-semibold text-sm">Bartender</span>
            </div>
            <div className="text-sm">
              <p className="font-medium">Ordered & Drink Menu</p>
              <p className="text-muted-foreground">Ordered: Nachos & Craft Beer</p>
            </div>
          </motion.div>
        )}
        
        {/* Bartender Menu Card (Right Side) */}
        {visibleMembers.filter(m => m.role === 'bartender').length > 0 && (
          <motion.div 
            className="absolute bottom-4 right-4 bg-card/90 backdrop-blur-sm border border-border rounded-lg p-4 cursor-pointer shadow-lg hover:shadow-xl transition-all"
            whileHover={{ scale: 1.05 }}
            onClick={() => setShowBartenderMenu(true)}
          >
            <div className="text-center">
              <h3 className="font-bold mb-2">Bartender</h3>
              <Avatar className="h-12 w-12 mx-auto mb-2">
                <AvatarFallback className="bg-green-600 text-white text-xl">🐺</AvatarFallback>
              </Avatar>
              <Badge variant="secondary" className="text-xs">Food & Drink Menu</Badge>
            </div>
          </motion.div>
        )}
        
        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-card/70 backdrop-blur-sm border border-border rounded-lg p-3 text-foreground text-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>You</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-slate-500 rounded-full"></div>
              <span>Other Wolves</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span>Bartender</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-violet-500 rounded-full animate-pulse"></div>
              <span>DJ</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Regular Member Profile Dialog */}
      <Dialog open={!!selectedMember} onOpenChange={() => setSelectedMember(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-2xl">{selectedMember ? getMemberIcon(selectedMember) : ''}</span>
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
                    {selectedMember.emoji || 
                     selectedMember.display_name?.charAt(0)?.toUpperCase() || 
                     'W'}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <h3 className="text-xl font-bold">
                    {selectedMember.display_name || selectedMember.username || 'Anonymous Wolf'}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Ready to party! 🎉
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary">
                      {selectedMember.role === 'dj' ? 'DJ' : 
                       selectedMember.role === 'bartender' ? 'Bartender' : 'Wolf'}
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
              </div>

              {/* Action Buttons */}
              {selectedMember.user_id !== currentUserId && (
                <div className="space-y-2">
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
          )}
        </DialogContent>
      </Dialog>

      {/* Bartender Menu Dialog */}
      <Dialog open={showBartenderMenu} onOpenChange={setShowBartenderMenu}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">
              <Avatar className="h-16 w-16 mx-auto mb-3">
                <AvatarFallback className="bg-green-600 text-white text-2xl">🐺</AvatarFallback>
              </Avatar>
              Bartender Menu
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-3">
            <Button variant="outline" className="w-full text-left justify-start h-auto p-3" onClick={() => router.push('/menu')}>
              <div>
                <div className="font-medium">🍺 Craft Beer Selection</div>
                <div className="text-sm text-muted-foreground">Local and imported beers</div>
              </div>
            </Button>
            <Button variant="outline" className="w-full text-left justify-start h-auto p-3" onClick={() => router.push('/menu')}>
              <div>
                <div className="font-medium">🍸 Signature Cocktails</div>
                <div className="text-sm text-muted-foreground">House specials and classics</div>
              </div>
            </Button>
            <Button variant="outline" className="w-full text-left justify-start h-auto p-3" onClick={() => router.push('/menu')}>
              <div>
                <div className="font-medium">🌮 Bar Bites</div>
                <div className="text-sm text-muted-foreground">Nachos, wings, and more</div>
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}