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
  Shield, 
  UserX,
  Users
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

// Add missing interface for special role dialog
interface SpecialRoleDialog {
  role: 'bartender' | 'dj';
  member: WolfPackMember;
}

export function WolfpackSpatialView({ locationId, currentUserId }: WolfpackSpatialViewProps) {
  const { user } = useUser();
  const router = useRouter();
  const [members, setMembers] = useState<WolfPackMember[]>([]);
  const [selectedMember, setSelectedMember] = useState<WolfPackMember | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'spatial' | 'list'>('spatial');
  // Add the missing showSpecialRole state
  const [showSpecialRole, setShowSpecialRole] = useState<SpecialRoleDialog | null>(null);  // Click handler for wolf interactions
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

  // Get member bubble color based on role
  const getMemberBubbleColor = (member: WolfPackMember, isCurrentUser: boolean) => {
    const role = member.role;
    if (role === 'dj') return { bg: '#9333ea', border: '#7c3aed' }; // Purple for DJ
    if (role === 'bartender') return { bg: '#059669', border: '#047857' }; // Green for bartender
    if (isCurrentUser) return { bg: '#3b82f6', border: '#1d4ed8' }; // Blue for current user
    return { bg: '#6366f1', border: '#4f46e5' }; // Default indigo
  };

  // Toggle between spatial and list view for mobile
  const toggleViewMode = () => {
    setViewMode(prev => prev === 'spatial' ? 'list' : 'spatial');
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

  // Filter visible members - no wolf_profile needed since data is directly in the table
  const visibleMembers = members.filter(member => 
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
      {/* View Toggle for Mobile */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Users className="h-5 w-5" />
          Wolf Pack Members ({visibleMembers.length})
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={toggleViewMode}
          className="md:hidden"
        >
          {viewMode === 'spatial' ? 'List View' : 'Bar View'}
        </Button>
      </div>

      {/* Mobile List View */}
      {viewMode === 'list' && (
        <div className="block md:hidden space-y-3">
          {visibleMembers.map((member) => {
            const isCurrentUser = member.user_id === currentUserId;
            const icon = getMemberIcon(member);
            
            return (
              <Card key={member.id} className="cursor-pointer hover:shadow-md transition-all"
                    onClick={() => handleWolfClick(member)}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white`}
                           style={{ backgroundColor: getMemberBubbleColor(member, isCurrentUser).bg }}>
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
                    <Button variant="ghost" size="sm">
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Enhanced Spatial Bar Map */}
      <div className={`relative w-full ${viewMode === 'spatial' ? 'block' : 'hidden md:block'} h-[450px] md:h-[500px] bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-xl overflow-hidden shadow-lg`}>
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
          
          {/* Wolf Pack Members with Better Positioning */}
          <AnimatePresence>
            {visibleMembers.map((member, index) => {
              const isCurrentUser = member.user_id === currentUserId;
              const icon = getMemberIcon(member);
              const colors = getMemberBubbleColor(member, isCurrentUser);
              
              // Enhanced position calculation with organic clustering
              let x = 400, y = 300; // Default center position
              
              if (member.table_location) {
                // More precise table positioning
                if (member.table_location.toLowerCase().includes('table 1')) { 
                  x = 150 + (Math.random() * 40 - 20); 
                  y = 300 + (Math.random() * 40 - 20); 
                }
                else if (member.table_location.toLowerCase().includes('table 2')) { 
                  x = 400 + (Math.random() * 40 - 20); 
                  y = 300 + (Math.random() * 40 - 20); 
                }
                else if (member.table_location.toLowerCase().includes('table 3')) { 
                  x = 650 + (Math.random() * 40 - 20); 
                  y = 300 + (Math.random() * 40 - 20); 
                }
                else if (member.table_location.toLowerCase().includes('high 1')) { 
                  x = 120 + (Math.random() * 30 - 15); 
                  y = 420 + (Math.random() * 30 - 15); 
                }
                else if (member.table_location.toLowerCase().includes('high 2')) { 
                  x = 680 + (Math.random() * 30 - 15); 
                  y = 420 + (Math.random() * 30 - 15); 
                }
                else if (member.table_location.toLowerCase().includes('bar') || member.table_location.toLowerCase().includes('counter')) { 
                  x = 200 + (index * 60) + (Math.random() * 20 - 10); 
                  y = 120 + (Math.random() * 20 - 10); 
                }
                else if (member.table_location.toLowerCase().includes('upstairs')) {
                  x = 500 + (Math.random() * 200 - 100);
                  y = 150 + (Math.random() * 60 - 30);
                }
                else if (member.table_location.toLowerCase().includes('outside') || member.table_location.toLowerCase().includes('patio')) {
                  x = 100 + (Math.random() * 100);
                  y = 500 + (Math.random() * 80 - 40);
                }
              } else {
                // Organic distribution around the bar space
                const angle = (index / visibleMembers.length) * 2 * Math.PI;
                const radius = 120 + (Math.random() * 80); // Variable radius for organic feel
                x = 400 + Math.cos(angle) * radius;
                y = 350 + Math.sin(angle) * (radius * 0.6); // Elliptical distribution
              }
              
              // Ensure positions stay within bounds
              x = Math.max(30, Math.min(770, x));
              y = Math.max(130, Math.min(570, y));
              
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
                  {/* Enhanced Wolf Avatar Background */}
                  <circle 
                    cx={x} 
                    cy={y} 
                    r="22" 
                    fill={colors.bg} 
                    stroke={colors.border} 
                    strokeWidth="3"
                    filter="drop-shadow(0 2px 4px rgba(0,0,0,0.3))"
                  />
                  
                  {/* Role indicator ring for special roles */}
                  {(member.role === 'dj' || member.role === 'bartender') && (
                    <circle 
                      cx={x} 
                      cy={y} 
                      r="26" 
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
                    y={y + 6} 
                    textAnchor="middle" 
                    fill="white" 
                    fontSize="22"
                    className="select-none font-bold"
                    filter="drop-shadow(0 1px 2px rgba(0,0,0,0.5))"
                  >
                    {icon}
                  </text>
                  
                  {/* Enhanced Name Label with Background */}
                  <rect
                    x={x - 35}
                    y={y - 40}
                    width="70"
                    height="16"
                    fill="rgba(0,0,0,0.7)"
                    rx="8"
                    ry="8"
                  />
                  <text 
                    x={x} 
                    y={y - 28} 
                    textAnchor="middle" 
                    fill="#ffffff" 
                    fontSize="11" 
                    fontFamily="system-ui"
                    className="select-none font-medium"
                  >
                    {(member.display_name || member.username || 'Wolf').slice(0, 10)}
                  </text>
                  
                  {/* Role badge for special users */}
                  {member.role && (member.role === 'dj' || member.role === 'bartender') && (
                    <>
                      <rect
                        x={x - 15}
                        y={y - 55}
                        width="30"
                        height="12"
                        fill={member.role === 'dj' ? '#9333ea' : '#059669'}
                        rx="6"
                        ry="6"
                      />
                      <text 
                        x={x} 
                        y={y - 47} 
                        textAnchor="middle" 
                        fill="white" 
                        fontSize="8" 
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
        
        {/* Special Role Quick Access Overlay */}
        <div className="absolute top-4 left-4 space-y-2">
          {visibleMembers.filter(m => m.role === 'bartender').length > 0 && (
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-3 py-2 rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition-all"
              onClick={() => {
                const bartender = visibleMembers.find(m => m.role === 'bartender');
                if (bartender) handleWolfClick(bartender);
              }}
            >
              <div className="flex items-center gap-2 text-sm font-bold">
                <span className="text-lg">🐺</span>
                <span>Bartender Available</span>
              </div>
            </motion.div>
          )}
          
          {visibleMembers.filter(m => m.role === 'dj').length > 0 && (
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 py-2 rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition-all"
              onClick={() => {
                const dj = visibleMembers.find(m => m.role === 'dj');
                if (dj) handleWolfClick(dj);
              }}
            >
              <div className="flex items-center gap-2 text-sm font-bold">
                <span className="text-lg">⭐</span>
                <span>DJ Live</span>
              </div>
            </motion.div>
          )}
        </div>
        
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
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <span>Bartender</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
              <span>DJ</span>
            </div>
          </div>
        </div>
      </div>

      {/* Special Role Actions Dialog */}
      {showSpecialRole && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">
              {showSpecialRole.role === 'bartender' ? '🐺 Bartender Actions' : '🎵 DJ Actions'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Special actions for {showSpecialRole.member.display_name || 
                                  showSpecialRole.member.username || 'Wolf'}
            </p>
            <button 
              onClick={() => setShowSpecialRole(null)}
              className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md"
            >
              Close
            </button>
          </div>
        </div>
      )}
      
      {/* Regular Member Profile Dialog */}
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
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}