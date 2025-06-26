import { createClient } from '@/lib/supabase/client';
import { WolfpackAuthService } from './wolfpack-auth.service';
import { WolfpackLocationService, type LocationKey } from './wolfpack-location.service';
import { adaptWolfpackMembership, adaptAPIResponse, type FrontendWolfpackMembership } from '@/lib/types/adapters';
import { WOLFPACK_TABLES } from './wolfpack-backend.service';
import type { User } from '@supabase/supabase-js';

const supabase = createClient();

export interface MembershipStatus {
  isActive: boolean;
  membershipId: string | null;
  locationId: string | null;
  locationKey: LocationKey | null;
  joinedAt: string | null;
  tableLocation: string | null;
  status: 'active' | 'inactive' | 'pending' | null;
  error?: string;
}

export interface JoinPackData {
  display_name?: string;
  emoji?: string;
  current_vibe?: string;
  favorite_drink?: string;
  looking_for?: string;
  instagram_handle?: string;
  table_location?: string;
  latitude?: number;
  longitude?: number;
}

export interface JoinResult {
  success: boolean;
  membershipId?: string;
  error?: string;
  data?: any;
}

export interface MemberProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  wolf_emoji: string | null;
  favorite_drink: string | null;
  current_vibe: string | null;
  looking_for: string | null;
  instagram_handle: string | null;
  bio: string | null;
  profile_image_url: string | null;
  is_visible: boolean;
  allow_messages: boolean;
}

export class WolfpackMembershipService {
  /**
   * Check user's current membership status - consolidates multiple implementations
   */
  static async checkMembership(
    userId: string, 
    locationId?: string
  ): Promise<MembershipStatus> {
    try {
      let query = supabase
        .from('wolfpack_memberships')
        .select(`
          id,
          user_id,
          location_id,
          status,
          joined_at,
          table_location,
          locations!inner(
            id,
            name
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'active');

      // Add location filter if provided
      if (locationId) {
        query = query.eq('location_id', locationId);
      }

      const { data, error } = await query.maybeSingle();

      if (error) throw error;

      if (!data) {
        return {
          isActive: false,
          membershipId: null,
          locationId: null,
          locationKey: null,
          joinedAt: null,
          tableLocation: null,
          status: null
        };
      }

      const locationKey = WolfpackLocationService.getLocationKeyById(data.location_id);

      return {
        isActive: true,
        membershipId: data.id,
        locationId: data.location_id,
        locationKey,
        joinedAt: data.joined_at,
        tableLocation: data.table_location,
        status: data.status as 'active'
      };
    } catch (error) {
      console.error('Error checking membership:', error);
      return {
        isActive: false,
        membershipId: null,
        locationId: null,
        locationKey: null,
        joinedAt: null,
        tableLocation: null,
        status: null,
        error: error instanceof Error ? error.message : 'Failed to check membership'
      };
    }
  }

  /**
   * Join wolfpack with comprehensive error handling
   */
  static async joinPack(
    user: User,
    data: JoinPackData,
    locationId?: string
  ): Promise<JoinResult> {
    try {
      // Verify user authentication
      const authResult = await WolfpackAuthService.verifyUser(user);
      if (!authResult.isVerified) {
        return {
          success: false,
          error: authResult.error || 'User verification failed'
        };
      }

      // Determine location if not provided
      let targetLocationId = locationId;
      let targetLocationKey: LocationKey | null = null;

      if (!targetLocationId) {
        // VIP users can join from anywhere
        if (authResult.isVipUser) {
          targetLocationId = WolfpackLocationService.SIDE_HUSTLE_LOCATIONS.salem.id;
          targetLocationKey = 'salem';
        } else {
          // Regular users need location verification
          const locationResult = await WolfpackLocationService.verifyUserLocation();
          if (!locationResult.isAtLocation || !locationResult.locationId) {
            return {
              success: false,
              error: 'You must be at Side Hustle Bar to join the Wolf Pack'
            };
          }
          targetLocationId = locationResult.locationId;
          targetLocationKey = locationResult.nearestLocation;
        }
      } else {
        targetLocationKey = WolfpackLocationService.getLocationKeyById(targetLocationId);
      }

      // Check for existing active membership
      const existingMembership = await this.checkMembership(user.id, targetLocationId);
      if (existingMembership.isActive) {
        return {
          success: true,
          membershipId: existingMembership.membershipId!,
          data: existingMembership
        };
      }

      // Use RPC function for joining (maintains existing backend logic)
      const { data: rpcResult, error: rpcError } = await supabase
        .rpc('join_wolfpack', {
          p_location_id: targetLocationId,
          p_latitude: data.latitude || null,
          p_longitude: data.longitude || null,
          p_table_location: data.table_location || null
        });

      if (rpcError) throw rpcError;

      // Check if RPC returned an error result
      if (rpcResult && typeof rpcResult === 'object' && 'success' in rpcResult && !rpcResult.success) {
        throw new Error(String(rpcResult.error) || 'Failed to join wolfpack');
      }

      // Update member profile with additional data if provided
      if (Object.keys(data).length > 0) {
        await this.updateMemberProfile(user.id, targetLocationId, {
          display_name: data.display_name,
          wolf_emoji: data.emoji,
          current_vibe: data.current_vibe,
          favorite_drink: data.favorite_drink,
          looking_for: data.looking_for,
          instagram_handle: data.instagram_handle
        });
      }

      // Get the new membership
      const newMembership = await this.checkMembership(user.id, targetLocationId);

      return {
        success: true,
        membershipId: newMembership.membershipId!,
        data: newMembership
      };
    } catch (error) {
      console.error('Error joining wolfpack:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to join pack'
      };
    }
  }

  /**
   * Leave wolfpack - consolidated implementation
   */
  static async leavePack(membershipId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('wolfpack_memberships')
        .update({ 
          status: 'inactive',
          left_at: new Date().toISOString()
        })
        .eq('id', membershipId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error leaving wolfpack:', error);
      return false;
    }
  }

  /**
   * Update member profile information
   */
  static async updateMemberProfile(
    userId: string,
    locationId: string,
    profileData: Partial<MemberProfile>
  ): Promise<boolean> {
    try {
      // Update wolf_profiles table
      const { error: profileError } = await supabase
        .from('wolf_profiles')
        .upsert({
          user_id: userId,
          ...profileData,
          updated_at: new Date().toISOString()
        });

      if (profileError) {
        console.warn('Profile update failed, trying wolf_pack_members:', profileError);
        
        // Fallback to wolf_pack_members table
        const { error: memberError } = await supabase
          .from('wolf_pack_members')
          .update({
            display_name: profileData.display_name,
            emoji: profileData.wolf_emoji,
            current_vibe: profileData.current_vibe,
            favorite_drink: profileData.favorite_drink,
            looking_for: profileData.looking_for,
            instagram_handle: profileData.instagram_handle,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .eq('location_id', locationId)
          .eq('is_active', true);

        if (memberError) throw memberError;
      }

      return true;
    } catch (error) {
      console.error('Error updating profile:', error);
      return false;
    }
  }

  /**
   * Get member profile by user ID
   */
  static async getMemberProfile(userId: string): Promise<MemberProfile | null> {
    try {
      const { data, error } = await supabase
        .from('wolf_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        // Fallback to wolf_pack_members if wolf_profiles doesn't exist
        const { data: memberData, error: memberError } = await supabase
          .from('wolf_pack_members')
          .select('*')
          .eq('user_id', userId)
          .eq('is_active', true)
          .single();

        if (memberError) throw memberError;

        // Convert to MemberProfile format
        return {
          id: memberData.id,
          user_id: memberData.user_id,
          display_name: memberData.display_name,
          wolf_emoji: memberData.emoji,
          favorite_drink: memberData.favorite_drink,
          current_vibe: memberData.current_vibe,
          looking_for: memberData.looking_for,
          instagram_handle: memberData.instagram_handle,
          bio: null,
          profile_image_url: null,
          is_visible: true,
          allow_messages: true
        };
      }

      return data;
    } catch (error) {
      console.error('Error fetching member profile:', error);
      return null;
    }
  }

  /**
   * Get all active members at a location
   */
  static async getLocationMembers(locationId: string) {
    try {
      const { data, error } = await supabase
        .from('wolfpack_memberships')
        .select(`
          *,
          user:users(
            *,
            wolf_profile:wolf_profiles(*)
          )
        `)
        .eq('location_id', locationId)
        .eq('status', 'active')
        .order('joined_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching location members:', error);
      return [];
    }
  }

  /**
   * Check if user can join wolfpack (rate limiting, restrictions, etc.)
   */
  static async canUserJoin(userId: string): Promise<{ canJoin: boolean; reason?: string }> {
    try {
      // Check for recent membership activity
      const { data: recentMembership, error } = await supabase
        .from('wolfpack_memberships')
        .select('left_at, joined_at')
        .eq('user_id', userId)
        .order('joined_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      // If user left recently (within last hour), prevent rejoining
      if (recentMembership?.left_at) {
        const leftAt = new Date(recentMembership.left_at);
        const now = new Date();
        const hoursSinceLeft = (now.getTime() - leftAt.getTime()) / (1000 * 60 * 60);
        
        if (hoursSinceLeft < 1) {
          return {
            canJoin: false,
            reason: 'Please wait before rejoining the pack'
          };
        }
      }

      return { canJoin: true };
    } catch (error) {
      console.error('Error checking join eligibility:', error);
      return { canJoin: true }; // Default to allowing join on error
    }
  }

  /**
   * Get membership statistics for a location
   */
  static async getLocationStats(locationId: string) {
    try {
      const { data, error } = await supabase
        .from('wolfpack_memberships')
        .select('id, joined_at, status')
        .eq('location_id', locationId);

      if (error) throw error;

      const stats = {
        totalMembers: data?.length || 0,
        activeMembers: data?.filter(m => m.status === 'active').length || 0,
        recentJoins: data?.filter(m => {
          if (!m.joined_at) return false;
          const joinedAt = new Date(m.joined_at);
          const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
          return joinedAt > oneDayAgo;
        }).length || 0
      };

      return stats;
    } catch (error) {
      console.error('Error fetching location stats:', error);
      return {
        totalMembers: 0,
        activeMembers: 0,
        recentJoins: 0
      };
    }
  }
}