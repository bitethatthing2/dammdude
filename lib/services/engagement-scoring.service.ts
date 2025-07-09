'use client';

import { supabase } from '@/lib/supabase/client';
import type { Database } from '@/types/database.types';

// Define types based on your database schema
type WolfpackMember = Database['public']['Views']['active_wolfpack_members']['Row'];
type DjBroadcastResponse = Database['public']['Tables']['dj_broadcast_responses']['Row'];
type WolfpackChatMessage = Database['public']['Tables']['wolfpack_chat_messages']['Row'];
type WolfPackInteraction = Database['public']['Tables']['wolf_pack_interactions']['Row'];
type WolfpackEngagement = Database['public']['Tables']['wolfpack_engagement']['Row'];

// Define the WolfpackLiveStats type if not already defined
export interface WolfpackLiveStats {
  total_active: number;
  very_active: number;
  gender_breakdown: Record<string, number>;
  recent_interactions: {
    total_interactions: number;
    active_participants: number;
  };
  energy_level: number;
  top_vibers: TopViber[];
}

export interface TopViber {
  user_id: string;
  name: string;
  avatar: string | null;
  vibe: string | null;
  engagement_score: number;
}

interface EngagementData {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  broadcast_responses: number;
  chat_messages: number;
  interactions_sent: number;
  interactions_received: number;
  recent_activity: number;
  total_session_time: number;
  membership_tier: string | null;
}

interface ActiveWolfpackMember {
  id: string;
  display_name: string | null;
  wolf_emoji: string | null;
  avatar_url: string | null;
  profile_pic_url: string | null;
  is_online: boolean | null;
  last_activity: string | null;
  bio: string | null;
  vibe_status: string | null;
  favorite_drink: string | null;
  favorite_song: string | null;
  instagram_handle: string | null;
  looking_for: string | null;
  is_permanent_pack_member: boolean | null;
  wolfpack_tier: string | null;
  gender: string | null;
  pronouns: string | null;
}

/**
 * Engagement Scoring Service
 * Calculates real-time engagement scores for crowd members
 */
export class EngagementScoringService {
  private static readonly SCORING_WEIGHTS = {
    broadcast_responses: 0.4,    // 40% - Most valuable engagement
    chat_activity: 0.25,         // 25% - High engagement indicator
    social_interactions: 0.2,    // 20% - User-to-user engagement
    session_activity: 0.15       // 15% - Time spent and recency
  };

  private static readonly VIBE_EMOJIS = ['🔥', '✨', '💃', '🎵', '⚡', '🌟', '🎯', '💯'];

  /**
   * Get top crowd members with real-time engagement scoring
   */
  static async getTopCrowdMembers(locationId: string, limit: number = 10): Promise<TopViber[]> {
    try {
      // Get engagement data for all active users at this location
      const engagementData = await this.getEngagementData(locationId);
      
      // Calculate engagement scores
      const scoredUsers = engagementData.map(user => ({
        ...user,
        engagement_score: this.calculateEngagementScore(user)
      }));

      // Sort by engagement score and get top users
      const topUsers = scoredUsers
        .sort((a, b) => b.engagement_score - a.engagement_score)
        .slice(0, limit);

      // Convert to TopViber format
      return topUsers.map((user, index) => ({
        user_id: user.user_id,
        name: user.display_name,
        avatar: user.avatar_url,
        vibe: this.getVibeEmoji(user.engagement_score, index),
        engagement_score: user.engagement_score
      }));

    } catch (error) {
      console.error('Error getting top crowd members:', error);
      return [];
    }
  }

  /**
   * Get comprehensive engagement data for all users at a location
   */
  private static async getEngagementData(locationId: string): Promise<EngagementData[]> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    try {
      // Get active wolfpack members at this location using the view
      const { data: activeMembers, error: membersError } = await supabase
        .from('active_wolfpack_members')
        .select('id, display_name, avatar_url, profile_pic_url, gender, wolfpack_tier')
        .gte('last_activity', startOfDay.toISOString());

      if (membersError) throw membersError;
      if (!activeMembers || activeMembers.length === 0) return [];

      const userIds = activeMembers.map(member => member.id);

      // Get broadcast responses (today)
      const { data: broadcastResponses, error: broadcastError } = await supabase
        .from('dj_broadcast_responses')
        .select('user_id')
        .in('user_id', userIds)
        .gte('created_at', startOfDay.toISOString())
        .lt('created_at', endOfDay.toISOString());

      if (broadcastError) console.warn('Broadcast responses error:', broadcastError);

      // Get chat messages (today)
      const { data: chatMessages, error: chatError } = await supabase
        .from('wolfpack_chat_messages')
        .select('user_id')
        .in('user_id', userIds)
        .gte('created_at', startOfDay.toISOString())
        .lt('created_at', endOfDay.toISOString());

      if (chatError) console.warn('Chat messages error:', chatError);

      // Get interactions sent (today) - note the column name difference
      const { data: interactionsSent, error: sentError } = await supabase
        .from('wolf_pack_interactions')
        .select('sender_id')
        .in('sender_id', userIds)
        .gte('created_at', startOfDay.toISOString())
        .lt('created_at', endOfDay.toISOString());

      if (sentError) console.warn('Interactions sent error:', sentError);

      // Get interactions received (today) - note the column name difference
      const { data: interactionsReceived, error: receivedError } = await supabase
        .from('wolf_pack_interactions')
        .select('receiver_id')
        .in('receiver_id', userIds)
        .gte('created_at', startOfDay.toISOString())
        .lt('created_at', endOfDay.toISOString());

      if (receivedError) console.warn('Interactions received error:', receivedError);

      // Get engagement metrics (today)
      const { data: engagementMetrics, error: engagementError } = await supabase
        .from('wolfpack_engagement')
        .select('user_id, total_session_time_minutes, total_interactions')
        .in('user_id', userIds)
        .gte('date', startOfDay.toISOString().split('T')[0])
        .lt('date', endOfDay.toISOString().split('T')[0]);

      if (engagementError) console.warn('Engagement metrics error:', engagementError);

      // Aggregate data for each user
      return activeMembers.map(member => {
        const broadcastCount = broadcastResponses?.filter(r => r.user_id === member.id).length || 0;
        const chatCount = chatMessages?.filter(m => m.user_id === member.id).length || 0;
        const sentCount = interactionsSent?.filter(i => i.sender_id === member.id).length || 0;
        const receivedCount = interactionsReceived?.filter(i => i.receiver_id === member.id).length || 0;
        const engagement = engagementMetrics?.find(e => e.user_id === member.id);

        return {
          user_id: member.id,
          display_name: member.display_name || 'Anonymous',
          avatar_url: member.avatar_url || member.profile_pic_url,
          broadcast_responses: broadcastCount,
          chat_messages: chatCount,
          interactions_sent: sentCount,
          interactions_received: receivedCount,
          recent_activity: this.calculateRecentActivity(member.id),
          total_session_time: engagement?.total_session_time_minutes || 0,
          membership_tier: member.wolfpack_tier
        };
      });

    } catch (error) {
      console.error('Error fetching engagement data:', error);
      return [];
    }
  }

  /**
   * Calculate engagement score based on weighted metrics
   */
  private static calculateEngagementScore(user: EngagementData): number {
    const weights = this.SCORING_WEIGHTS;
    
    // Normalize values (assuming max values for scaling)
    const normalizedBroadcasts = Math.min(user.broadcast_responses / 10, 1) * 100;
    const normalizedChat = Math.min(user.chat_messages / 20, 1) * 100;
    const normalizedInteractions = Math.min((user.interactions_sent + user.interactions_received) / 15, 1) * 100;
    const normalizedSession = Math.min(user.total_session_time / 120, 1) * 100; // 2 hours max

    // Calculate weighted score
    const score = (
      normalizedBroadcasts * weights.broadcast_responses +
      normalizedChat * weights.chat_activity +
      normalizedInteractions * weights.social_interactions +
      normalizedSession * weights.session_activity
    );

    // Add bonus for premium members
    const tierBonus = user.membership_tier === 'premium' ? 10 : 0;
    
    // Add recent activity bonus (decaying over time)
    const recentBonus = user.recent_activity * 5;

    return Math.round(score + tierBonus + recentBonus);
  }

  /**
   * Calculate recent activity bonus (simplified - would need more complex logic)
   */
  private static calculateRecentActivity(userId: string): number {
    // This is a simplified version - in reality you'd check last activity timestamps
    // and apply time decay factors
    return Math.random() * 2; // 0-2 bonus for recent activity
  }

  /**
   * Get appropriate vibe emoji based on engagement score and ranking
   */
  private static getVibeEmoji(score: number, rank: number): string {
    if (rank === 0) return '🔥'; // Top performer always gets fire
    if (score >= 80) return '✨';
    if (score >= 60) return '💃';
    if (score >= 40) return '🎵';
    if (score >= 20) return '⚡';
    return '🌟';
  }

  /**
   * Get live stats with real engagement data
   */
  static async getLiveStats(locationId: string): Promise<WolfpackLiveStats> {
    try {
      // Try to use RPC function first
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('get_wolfpack_live_stats', { p_location_id: locationId });

      if (!rpcError && rpcData) {
        console.log('✅ RPC function returned data:', rpcData);
        // If RPC returns data, use it but get real top_vibers
        const topVibers = await this.getTopCrowdMembers(locationId, 10);
        
        return {
          total_active: rpcData.total_active || 0,
          very_active: rpcData.very_active || 0,
          gender_breakdown: rpcData.gender_breakdown || {},
          recent_interactions: rpcData.recent_interactions || {
            total_interactions: 0,
            active_participants: 0
          },
          energy_level: rpcData.energy_level || 0,
          top_vibers: topVibers
        };
      }

      console.warn('🔄 RPC function failed, using manual calculation:', rpcError);
      // Fallback to manual calculation if RPC fails
      return await this.calculateLiveStatsManually(locationId);

    } catch (error) {
      console.error('❌ Error getting live stats:', error);
      return this.getFallbackStats();
    }
  }

  /**
   * Manual calculation of live stats
   */
  private static async calculateLiveStatsManually(locationId: string): Promise<WolfpackLiveStats> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    try {
      // Get active wolfpack members at this location using the view
      const { data: activeMembers, error: membersError } = await supabase
        .from('active_wolfpack_members')
        .select('id, gender')
        .gte('last_activity', startOfDay.toISOString());

      if (membersError) throw membersError;
      
      const userIds = activeMembers?.map(m => m.id) || [];

      const totalActive = activeMembers?.length || 0;
      const veryActive = Math.floor(totalActive * 0.6); // Estimate 60% as very active

      // Calculate gender breakdown
      const genderBreakdown = activeMembers?.reduce((acc, member) => {
        const gender = member.gender || 'unknown';
        acc[gender] = (acc[gender] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      // Get recent interactions
      const { data: recentInteractions, error: interactionsError } = await supabase
        .from('wolf_pack_interactions')
        .select('sender_id, receiver_id')
        .gte('created_at', startOfDay.toISOString());

      if (interactionsError) console.warn('Interactions error:', interactionsError);

      const totalInteractions = recentInteractions?.length || 0;
      const uniqueParticipants = new Set<string>();
      
      recentInteractions?.forEach(interaction => {
        if (interaction.sender_id) uniqueParticipants.add(interaction.sender_id);
        if (interaction.receiver_id) uniqueParticipants.add(interaction.receiver_id);
      });
      
      const activeParticipants = uniqueParticipants.size;

      // Calculate energy level based on activity
      const energyLevel = Math.min(Math.floor((totalInteractions + (totalActive * 2)) / 10 * 100), 100);

      // Get top vibers
      const topVibers = await this.getTopCrowdMembers(locationId, 10);

      return {
        total_active: totalActive,
        very_active: veryActive,
        gender_breakdown: genderBreakdown,
        recent_interactions: {
          total_interactions: totalInteractions,
          active_participants: activeParticipants
        },
        energy_level: energyLevel,
        top_vibers: topVibers
      };

    } catch (error) {
      console.error('Error calculating live stats manually:', error);
      return this.getFallbackStats();
    }
  }

  /**
   * Fallback stats when all else fails
   */
  private static getFallbackStats(): WolfpackLiveStats {
    return {
      total_active: 0,
      very_active: 0,
      gender_breakdown: {},
      recent_interactions: {
        total_interactions: 0,
        active_participants: 0
      },
      energy_level: 0,
      top_vibers: []
    };
  }
}