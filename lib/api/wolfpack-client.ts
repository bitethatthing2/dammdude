// lib/supabase/enhanced-wolfpack-client.ts
// Enhanced realtime client that integrates with DJ Dashboard and handles RLS, relationships, and user ID issues

import { Database } from '@/lib/database.types'
import { LOCATION_CONFIG } from '@/types/features/dj-dashboard-types'
import { handleSupabaseError, createClient } from '@/lib/supabase/client'

type Tables = Database['public']['Tables']
type UserRow = Tables['users']['Row']
type WolfPackMemberRow = Tables['wolf_pack_members']['Row']

// Enhanced interfaces for better type safety
export interface EnhancedWolfpackMember {
  id: string
  user_id: string
  location_id: string | null
  status: string | null
  tier: string | null
  display_name: string | null
  emoji: string | null
  current_vibe: string | null
  favorite_drink: string | null
  looking_for: string | null
  instagram_handle: string | null
  joined_at: string
  last_active: string | null
  is_active: boolean
  membership_ends_at: string | null
  
  // User data from join
  user_email: string | null
  user_first_name: string | null
  user_last_name: string | null
  user_avatar_url: string | null
  user_gender: string | null
  user_pronouns: string | null
  user_bio: string | null
  user_profile_image_url: string | null
  user_vibe_status: string | null
  user_wolf_emoji: string | null
  user_is_online: boolean | null
  user_last_seen_at: string | null
}

export interface WolfpackMembershipCheck {
  is_member: boolean
  membership_id: string | null
  status: string | null
  tier: string | null
  joined_at: string | null
  membership_ends_at: string | null
}

export interface JoinWolfpackResult {
  success: boolean
  membership_id: string | null
  message: string
  tier?: string
}

export interface LeaveWolfpackResult {
  success: boolean
  message: string
}

export interface WolfpackStats {
  total_members: number
  active_members: number
  new_members_today: number
  gender_breakdown: Record<string, number>
  tier_breakdown: Record<string, number>
  average_session_duration: number
  top_vibes: Array<{
    vibe: string
    count: number
  }>
}

export interface RealtimeUser extends UserRow {
  wolfpack_membership?: WolfPackMemberRow
  is_current_user?: boolean
}

class EnhancedWolfpackRealtimeClient {
  private supabase = createClient()
  private currentUser: UserRow | null = null
  
  constructor() {
    // Set up error logging for debugging
    this.supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔐 Auth state changed:', event, session ? 'Session exists' : 'No session')
      
      if (session?.user) {
        await this.loadCurrentUser()
      } else {
        this.currentUser = null
      }
    })
    
    // Load current user on initialization
    this.loadCurrentUser()
  }

  private async loadCurrentUser(): Promise<UserRow | null> {
    try {
      const { data: { user }, error } = await this.supabase.auth.getUser()
      if (error || !user) {
        console.error('❌ Auth error:', error)
        this.currentUser = null
        return null
      }

      // Fetch full user data from users table
      const { data: userData, error: userError } = await this.supabase
        .from('users')
        .select('*')
        .eq('auth_id', user.id)
        .single()

      if (userError) {
        console.error('❌ Error fetching user data:', userError)
        this.currentUser = null
        return null
      }

      this.currentUser = userData
      console.log('✅ Current user loaded:', userData.id)
      return userData
    } catch (error) {
      console.error('❌ Error loading current user:', error)
      this.currentUser = null
      return null
    }
  }

  public async getCurrentUser(): Promise<UserRow | null> {
    if (!this.currentUser) {
      return await this.loadCurrentUser()
    }
    return this.currentUser
  }

  private validateUUID(id: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    return uuidRegex.test(id)
  }

  // Get wolfpack members with enhanced data and proper joins
  async getWolfpackMembers(locationId?: string): Promise<{
    data: EnhancedWolfpackMember[]
    error: string | null
  }> {
    try {
      console.log('🔍 Getting wolfpack members for location:', locationId)

      if (locationId && !this.validateUUID(locationId)) {
        console.error('❌ Invalid location ID format:', locationId)
        return { data: [], error: 'Invalid location ID format' }
      }

      const user = await this.getCurrentUser()
      if (!user) {
        return { data: [], error: 'Authentication required' }
      }

      // Query wolf_pack_members with user data join
      let query = this.supabase
        .from('wolf_pack_members')
        .select(`
          *,
          users:user_id (
            id,
            email,
            first_name,
            last_name,
            avatar_url,
            profile_image_url,
            display_name,
            wolf_emoji,
            bio,
            gender,
            pronouns,
            vibe_status,
            favorite_drink,
            favorite_bartender,
            instagram_handle,
            looking_for,
            is_online,
            last_seen_at,
            last_activity
          )
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (locationId) {
        query = query.eq('location_id', locationId)
      }

      const { data, error } = await query

      if (error) {
        console.error('❌ Error fetching wolfpack members:', error)
        return { data: [], error: handleSupabaseError(error).message }
      }

      // Transform and enhance the data
      const enhancedMembers: EnhancedWolfpackMember[] = (data || []).map(member => {
        const userData = member.users as any
        
        return {
          id: member.id,
          user_id: member.user_id || '',
          location_id: member.location_id,
          status: member.status,
          tier: 'basic', // Default tier since field doesn't exist in schema
          display_name: userData?.display_name || userData?.first_name || 'Pack Member',
          emoji: userData?.wolf_emoji || '🐺',
          current_vibe: userData?.vibe_status || null,
          favorite_drink: userData?.favorite_drink || null,
          looking_for: userData?.looking_for || null,
          instagram_handle: userData?.instagram_handle || null,
          joined_at: member.created_at || '',
          last_active: userData?.last_activity || userData?.last_seen_at || null,
          is_active: member.status === 'active',
          membership_ends_at: null, // Field doesn't exist in schema
          
          // User data
          user_email: userData?.email || null,
          user_first_name: userData?.first_name || null,
          user_last_name: userData?.last_name || null,
          user_avatar_url: userData?.avatar_url || userData?.profile_image_url || null,
          user_gender: userData?.gender || null,
          user_pronouns: userData?.pronouns || null,
          user_bio: userData?.bio || null,
          user_profile_image_url: userData?.profile_image_url || null,
          user_vibe_status: userData?.vibe_status || null,
          user_wolf_emoji: userData?.wolf_emoji || null,
          user_is_online: userData?.is_online || false,
          user_last_seen_at: userData?.last_seen_at || null,
        }
      })

      console.log('✅ Successfully fetched', enhancedMembers.length, 'wolfpack members')
      return { data: enhancedMembers, error: null }

    } catch (error) {
      console.error('❌ Unexpected error in getWolfpackMembers:', error)
      return { data: [], error: handleSupabaseError(error).message }
    }
  }

  // Get wolfpack statistics for DJ Dashboard
  async getWolfpackStats(locationId: string): Promise<{
    data: WolfpackStats | null
    error: string | null
  }> {
    try {
      console.log('📊 Getting wolfpack stats for location:', locationId)

      if (!this.validateUUID(locationId)) {
        return { data: null, error: 'Invalid location ID format' }
      }

      // Use the existing RPC function if available, otherwise calculate manually
      try {
        const { data: rpcData, error: rpcError } = await this.supabase
          .rpc('get_wolfpack_live_stats', {
            p_location_id: locationId
          })

        if (!rpcError && rpcData) {
          // Convert RPC response to our WolfpackStats format with proper type checking
          const data = rpcData && typeof rpcData === 'object' && rpcData !== null ? rpcData as any : {}
          const stats: WolfpackStats = {
            total_members: data.total_active || 0,
            active_members: data.very_active || 0,
            new_members_today: 0, // Not available in RPC
            gender_breakdown: data.gender_breakdown || {},
            tier_breakdown: {}, // Not available in RPC
            average_session_duration: 0, // Not available in RPC
            top_vibes: data.top_vibers?.map((viper: any) => ({
              vibe: viper.vibe || 'Unknown',
              count: 1
            })) || []
          }

          return { data: stats, error: null }
        }
      } catch (rpcError) {
        console.log('📊 RPC function not available, calculating stats manually')
      }

      // Fallback: Calculate stats manually
      const { data: members, error } = await this.getWolfpackMembers(locationId)
      
      if (error) {
        return { data: null, error }
      }

      const now = new Date()
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

      const stats: WolfpackStats = {
        total_members: members.length,
        active_members: members.filter(m => {
          const lastActive = m.last_active ? new Date(m.last_active) : null
          return lastActive && (now.getTime() - lastActive.getTime()) < 30 * 60 * 1000 // 30 minutes
        }).length,
        new_members_today: members.filter(m => {
          const joinedDate = new Date(m.joined_at)
          return joinedDate >= todayStart
        }).length,
        gender_breakdown: members.reduce((acc, m) => {
          const gender = m.user_gender || 'unknown'
          acc[gender] = (acc[gender] || 0) + 1
          return acc
        }, {} as Record<string, number>),
        tier_breakdown: members.reduce((acc, m) => {
          const tier = m.tier || 'basic'
          acc[tier] = (acc[tier] || 0) + 1
          return acc
        }, {} as Record<string, number>),
        average_session_duration: 0, // Would need session tracking
        top_vibes: members
          .filter(m => m.current_vibe)
          .reduce((acc, m) => {
            const vibe = m.current_vibe!
            const existing = acc.find(v => v.vibe === vibe)
            if (existing) {
              existing.count++
            } else {
              acc.push({ vibe, count: 1 })
            }
            return acc
          }, [] as Array<{ vibe: string; count: number }>)
          .sort((a, b) => b.count - a.count)
          .slice(0, 5)
      }

      return { data: stats, error: null }

    } catch (error) {
      console.error('❌ Error getting wolfpack stats:', error)
      return { data: null, error: handleSupabaseError(error).message }
    }
  }

  // Check user's membership status with enhanced data
  async checkMembership(locationId: string): Promise<{
    data: WolfpackMembershipCheck | null
    error: string | null
  }> {
    try {
      console.log('🔍 Checking membership for location:', locationId)

      if (!this.validateUUID(locationId)) {
        return { data: null, error: 'Invalid location ID format' }
      }

      const user = await this.getCurrentUser()
      if (!user) {
        return { data: null, error: 'Authentication required' }
      }

      const { data, error } = await this.supabase
        .from('wolf_pack_members')
        .select('*')
        .eq('user_id', user.id)
        .eq('location_id', locationId)
        .eq('status', 'active')
        .maybeSingle()

      if (error) {
        console.error('❌ Error checking membership:', error)
        return { data: null, error: handleSupabaseError(error).message }
      }

      const result: WolfpackMembershipCheck = {
        is_member: !!data,
        membership_id: data?.id || null,
        status: data?.status || null,
        tier: 'basic', // Default tier since field doesn't exist in schema
        joined_at: data?.created_at || null,
        membership_ends_at: null // Field doesn't exist in schema
      }

      console.log('✅ Membership check result:', result)
      return { data: result, error: null }

    } catch (error) {
      console.error('❌ Unexpected error in checkMembership:', error)
      return { data: null, error: handleSupabaseError(error).message }
    }
  }

  // Join wolfpack with enhanced data and validation
  async joinWolfpack(data: {
    locationId: string
    tier?: string
    displayName?: string
    emoji?: string
    currentVibe?: string
    favoriteDrink?: string
    lookingFor?: string
    instagramHandle?: string
  }): Promise<{
    data: JoinWolfpackResult | null
    error: string | null
  }> {
    try {
      console.log('🐺 Joining wolfpack:', data)

      if (!this.validateUUID(data.locationId)) {
        return { data: null, error: 'Invalid location ID format' }
      }

      const user = await this.getCurrentUser()
      if (!user) {
        return { data: null, error: 'Authentication required' }
      }

      // Check if user is already a member
      const { data: existingMembership } = await this.checkMembership(data.locationId)
      if (existingMembership?.is_member) {
        return { 
          data: { 
            success: false, 
            membership_id: existingMembership.membership_id, 
            message: 'Already a member of this wolfpack' 
          }, 
          error: null 
        }
      }

      // Create new membership
      const membershipData: Database['public']['Tables']['wolf_pack_members']['Insert'] = {
        user_id: user.id,
        location_id: data.locationId,
        status: 'active',
        // tier field doesn't exist in schema
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data: newMembership, error: membershipError } = await this.supabase
        .from('wolf_pack_members')
        .insert(membershipData)
        .select()
        .single()

      if (membershipError) {
        console.error('❌ Error creating membership:', membershipError)
        return { data: null, error: handleSupabaseError(membershipError).message }
      }

      // Update user profile if provided
      if (data.displayName || data.emoji || data.currentVibe || data.favoriteDrink || data.lookingFor || data.instagramHandle) {
        const userUpdates: Database['public']['Tables']['users']['Update'] = {
          updated_at: new Date().toISOString()
        }

        if (data.displayName) userUpdates.display_name = data.displayName
        if (data.emoji) userUpdates.wolf_emoji = data.emoji
        if (data.currentVibe) userUpdates.vibe_status = data.currentVibe
        if (data.favoriteDrink) userUpdates.favorite_drink = data.favoriteDrink
        if (data.lookingFor) userUpdates.looking_for = data.lookingFor
        if (data.instagramHandle) userUpdates.instagram_handle = data.instagramHandle

        const { error: userUpdateError } = await this.supabase
          .from('users')
          .update(userUpdates)
          .eq('id', user.id)

        if (userUpdateError) {
          console.warn('⚠️ Error updating user profile:', userUpdateError)
          // Don't fail the join if profile update fails
        }
      }

      const result: JoinWolfpackResult = {
        success: true,
        membership_id: newMembership.id,
        message: 'Successfully joined the wolfpack!',
        tier: 'basic' // Default tier since field doesn't exist in schema
      }

      console.log('✅ Join wolfpack result:', result)
      return { data: result, error: null }

    } catch (error) {
      console.error('❌ Unexpected error in joinWolfpack:', error)
      return { data: null, error: handleSupabaseError(error).message }
    }
  }

  // Leave wolfpack with proper cleanup
  async leaveWolfpack(locationId: string): Promise<{
    data: LeaveWolfpackResult | null
    error: string | null
  }> {
    try {
      console.log('👋 Leaving wolfpack for location:', locationId)

      if (!this.validateUUID(locationId)) {
        return { data: null, error: 'Invalid location ID format' }
      }

      const user = await this.getCurrentUser()
      if (!user) {
        return { data: null, error: 'Authentication required' }
      }

      // Update membership status to inactive instead of deleting
      const { error } = await this.supabase
        .from('wolf_pack_members')
        .update({ 
          status: 'inactive',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('location_id', locationId)

      if (error) {
        console.error('❌ Error leaving wolfpack:', error)
        return { data: null, error: handleSupabaseError(error).message }
      }

      const result: LeaveWolfpackResult = {
        success: true,
        message: 'Successfully left the wolfpack'
      }

      console.log('✅ Leave wolfpack result:', result)
      return { data: result, error: null }

    } catch (error) {
      console.error('❌ Unexpected error in leaveWolfpack:', error)
      return { data: null, error: handleSupabaseError(error).message }
    }
  }

  // Subscribe to realtime changes with enhanced error handling and DJ Dashboard integration
  async subscribeToWolfpackChanges(
    locationId: string,
    callbacks: {
      onMemberJoined?: (member: EnhancedWolfpackMember) => void
      onMemberLeft?: (userId: string) => void
      onMemberUpdated?: (member: EnhancedWolfpackMember) => void
      onStatsChanged?: (stats: WolfpackStats) => void
      onError?: (error: string) => void
    }
  ) {
    try {
      console.log('📡 Setting up realtime subscription for location:', locationId)

      const user = await this.getCurrentUser()
      if (!user) {
        callbacks.onError?.('Authentication required for realtime subscription')
        return null
      }

      // Subscribe to wolf_pack_members changes
      const channel = this.supabase
        .channel(`wolfpack_${locationId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'wolf_pack_members',
            filter: `location_id=eq.${locationId}`
          },
          async (payload) => {
            console.log('➕ Member joined:', payload.new)
            
            // Fetch full member data with joins
            const { data: members } = await this.getWolfpackMembers(locationId)
            const newMember = members.find(m => m.id === payload.new.id)
            if (newMember && callbacks.onMemberJoined) {
              callbacks.onMemberJoined(newMember)
            }

            // Update stats
            if (callbacks.onStatsChanged) {
              const { data: stats } = await this.getWolfpackStats(locationId)
              if (stats) callbacks.onStatsChanged(stats)
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'wolf_pack_members',
            filter: `location_id=eq.${locationId}`
          },
          async (payload) => {
            console.log('🔄 Member updated:', payload.new)
            
            if (payload.new.status === 'inactive') {
              // Member left
              if (callbacks.onMemberLeft) {
                callbacks.onMemberLeft(payload.new.user_id)
              }
            } else {
              // Member updated
              const { data: members } = await this.getWolfpackMembers(locationId)
              const updatedMember = members.find(m => m.id === payload.new.id)
              if (updatedMember && callbacks.onMemberUpdated) {
                callbacks.onMemberUpdated(updatedMember)
              }
            }

            // Update stats
            if (callbacks.onStatsChanged) {
              const { data: stats } = await this.getWolfpackStats(locationId)
              if (stats) callbacks.onStatsChanged(stats)
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'wolf_pack_members',
            filter: `location_id=eq.${locationId}`
          },
          async (payload) => {
            console.log('➖ Member deleted:', payload.old)
            if (callbacks.onMemberLeft) {
              callbacks.onMemberLeft(payload.old.user_id)
            }

            // Update stats
            if (callbacks.onStatsChanged) {
              const { data: stats } = await this.getWolfpackStats(locationId)
              if (stats) callbacks.onStatsChanged(stats)
            }
          }
        )
        .subscribe((status) => {
          console.log('📡 Subscription status:', status)
          if (status === 'SUBSCRIBED') {
            console.log('✅ Successfully subscribed to wolfpack changes')
          } else if (status === 'CHANNEL_ERROR') {
            console.error('❌ Channel error in wolfpack subscription')
            callbacks.onError?.('Failed to establish realtime connection')
          }
        })

      return channel

    } catch (error) {
      console.error('❌ Error setting up realtime subscription:', error)
      callbacks.onError?.(handleSupabaseError(error).message)
      return null
    }
  }

  // Get current user's profile with wolfpack data
  async getCurrentUserProfile(): Promise<{
    data: RealtimeUser | null
    error: string | null
  }> {
    try {
      const user = await this.getCurrentUser()
      if (!user) {
        return { data: null, error: 'Authentication required' }
      }

      // Get user's wolfpack memberships
      const { data: memberships, error: membershipError } = await this.supabase
        .from('wolf_pack_members')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')

      if (membershipError) {
        console.error('❌ Error fetching memberships:', membershipError)
        return { data: null, error: handleSupabaseError(membershipError).message }
      }

      const realtimeUser: RealtimeUser = {
        ...user,
        wolfpack_membership: memberships?.[0] || undefined,
        is_current_user: true
      }

      console.log('✅ Successfully fetched user profile')
      return { data: realtimeUser, error: null }

    } catch (error) {
      console.error('❌ Unexpected error in getCurrentUserProfile:', error)
      return { data: null, error: handleSupabaseError(error).message }
    }
  }

  // Update user profile with validation
  async updateProfile(updates: {
    displayName?: string
    emoji?: string
    currentVibe?: string
    favoriteDrink?: string
    lookingFor?: string
    instagramHandle?: string
    bio?: string
    profileImageUrl?: string
    gender?: string
    pronouns?: string
  }): Promise<{
    success: boolean
    error: string | null
  }> {
    try {
      console.log('🔄 Updating profile:', updates)

      const user = await this.getCurrentUser()
      if (!user) {
        return { success: false, error: 'Authentication required' }
      }

      // Prepare user updates
      const userUpdates: Database['public']['Tables']['users']['Update'] = {
        updated_at: new Date().toISOString()
      }

      if (updates.displayName !== undefined) userUpdates.display_name = updates.displayName
      if (updates.emoji !== undefined) userUpdates.wolf_emoji = updates.emoji
      if (updates.currentVibe !== undefined) userUpdates.vibe_status = updates.currentVibe
      if (updates.favoriteDrink !== undefined) userUpdates.favorite_drink = updates.favoriteDrink
      if (updates.lookingFor !== undefined) userUpdates.looking_for = updates.lookingFor
      if (updates.instagramHandle !== undefined) userUpdates.instagram_handle = updates.instagramHandle
      if (updates.bio !== undefined) userUpdates.bio = updates.bio
      if (updates.profileImageUrl !== undefined) userUpdates.profile_image_url = updates.profileImageUrl
      if (updates.gender !== undefined) userUpdates.gender = updates.gender
      if (updates.pronouns !== undefined) userUpdates.pronouns = updates.pronouns

      // Update users table
      const { error: userError } = await this.supabase
        .from('users')
        .update(userUpdates)
        .eq('id', user.id)

      if (userError) {
        console.error('❌ Error updating user profile:', userError)
        return { success: false, error: handleSupabaseError(userError) }
      }

      // Update cached user
      this.currentUser = { ...user, ...userUpdates } as UserRow

      console.log('✅ Successfully updated profile')
      return { success: true, error: null }

    } catch (error) {
      console.error('❌ Unexpected error in updateProfile:', error)
      return { success: false, error: handleSupabaseError(error).message }
    }
  }

  // Clean up function to remove subscriptions
  unsubscribe(channel: ReturnType<typeof this.supabase.channel> | null) {
    if (channel) {
      this.supabase.removeChannel(channel)
      console.log('🔌 Unsubscribed from realtime channel')
    }
  }

  // Get members for a specific location (used by DJ Dashboard)
  async getMembersForLocation(locationId: string): Promise<{
    data: EnhancedWolfpackMember[]
    error: string | null
  }> {
    return this.getWolfpackMembers(locationId)
  }

  // Utility method to get location config
  getLocationConfig(locationKey: 'salem' | 'portland') {
    return LOCATION_CONFIG[locationKey]
  }

  // Utility method to validate if user can access location
  async validateLocationAccess(locationId: string): Promise<boolean> {
    const user = await this.getCurrentUser()
    if (!user) return false

    // Admins and DJs can access all locations
    if (user.role === 'admin' || user.role === 'dj') {
      return true
    }

    // Regular users need to be wolfpack members of the location
    const { data: membership } = await this.checkMembership(locationId)
    return membership?.is_member || false
  }
}

// Export singleton instance
export const enhancedWolfpackClient = new EnhancedWolfpackRealtimeClient()

// Export as wolfpackAPI for backward compatibility
export const wolfpackAPI = enhancedWolfpackClient

// Helper function to convert enhanced member to basic user format
export function enhancedMemberToUser(member: EnhancedWolfpackMember): UserRow {
  return {
    id: member.user_id,
    email: member.user_email || '',
    first_name: member.user_first_name,
    last_name: member.user_last_name,
    avatar_url: member.user_avatar_url,
    profile_image_url: member.user_profile_image_url,
    display_name: member.display_name,
    wolf_emoji: member.emoji || '🐺',
    bio: member.user_bio,
    gender: member.user_gender,
    pronouns: member.user_pronouns,
    vibe_status: member.current_vibe,
    favorite_drink: member.favorite_drink,
    looking_for: member.looking_for,
    instagram_handle: member.instagram_handle,
    is_online: member.user_is_online || false,
    last_seen_at: member.user_last_seen_at,
    location_id: member.location_id,
    is_wolfpack_member: member.is_active,
    wolfpack_status: member.status as any,
    wolfpack_joined_at: member.joined_at,
    wolfpack_tier: member.tier as any,
    // Add required fields with defaults
    auth_id: null,
    avatar_id: null,
    block_reason: null,
    blocked_at: null,
    blocked_by: null,
    created_at: member.joined_at,
    updated_at: member.last_active || member.joined_at,
    deleted_at: null,
    is_approved: true,
    is_permanent_pack_member: false,
    last_login: null,
    location_permissions_granted: false,
    notes: null,
    notification_preferences: null,
    password_hash: null,
    permanent_member_benefits: null,
    permanent_member_notes: null,
    permanent_member_since: null,
    permissions: null,
    phone: null,
    phone_verification_code: null,
    phone_verification_sent_at: null,
    phone_verified: false,
    privacy_settings: null,
    role: 'user',
    sensitive_data_encrypted: null,
    status: 'active',
    custom_avatar_id: null,
    daily_customization: null,
    allow_messages: true,
    favorite_bartender: null,
    last_activity: member.last_active,
    session_id: null
  } as UserRow
}

// Helper function to format member data for DJ Dashboard
export function formatMemberForDashboard(member: EnhancedWolfpackMember) {
  return {
    id: member.user_id,
    name: member.display_name || `${member.user_first_name || ''} ${member.user_last_name || ''}`.trim() || 'Pack Member',
    avatar: member.user_avatar_url || member.user_profile_image_url,
    vibe: member.current_vibe,
    emoji: member.emoji || '🐺',
    tier: member.tier || 'basic',
    isOnline: member.user_is_online || false,
    lastSeen: member.user_last_seen_at,
    joinedAt: member.joined_at,
    gender: member.user_gender
  }
}

export default enhancedWolfpackClient