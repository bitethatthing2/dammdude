// lib/supabase/wolfpack-realtime-client.ts
// Complete realtime client that handles RLS, relationships, and user ID issues

import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/supabase'
import { RealtimeUser } from '@/types/realtime'
import { RPCFallbacks } from '@/lib/utils/rpc-fallbacks'

type Tables = Database['public']['Tables']
type UserRow = Tables['users']['Row']
// type WolfProfileRow = Tables['wolf_profiles']['Row'] // Table doesn't exist

export interface EnhancedWolfpackMember {
  id: string
  id: string
  location_id: string | null
  status: string | null
  display_name: string | null
  emoji: string | null
  current_vibe: string | null
  favorite_drink: string | null
  looking_for: string | null
  instagram_handle: string | null
  joined_at: string
  last_active: string | null
  is_active: boolean
  // User data from join
  user_email: string | null
  user_first_name: string | null
  user_last_name: string | null
  user_avatar_url: string | null
  // Wolf profile data from join
  wolf_profile_id: string | null
  wolf_bio: string | null
  wolf_profile_pic_url: string | null
  wolf_is_profile_visible: boolean | null
}

export interface WolfpackMembershipCheck {
  is_member: boolean
  membership_id: string | null
  status: string | null
  joined_at: string | null
}

export interface JoinWolfpackResult {
  success: boolean
  membership_id: string | null
  message: string
}

export interface LeaveWolfpackResult {
  success: boolean
  message: string
}

class WolfpackRealtimeClient {
  private supabase = createClient()
  
  constructor() {
    // Set up error logging for debugging
    this.supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔐 Auth state changed:', event, session ? 'Session exists' : 'No session')
    })
  }

  private async getCurrentUser() {
    try {
      const { data: { user }, error } = await this.supabase.auth.getUser()
      if (error) {
        console.error('❌ Auth error:', error)
        return null
      }
      
      if (!user) {
        console.error('❌ No authenticated user found')
        return null
      }

      console.log('✅ Current user:', user.id)
      return user
    } catch (error) {
      console.error('❌ Error getting current user:', error)
      return null
    }
  }

  private validateUUID(id: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    return uuidRegex.test(id)
  }

  // Get wolfpack members using the secure function
  async getWolfpackMembers(locationId?: string): Promise<{
    data: EnhancedWolfpackMember[]
    error: string | null
  }> {
    try {
      console.log('🔍 Getting wolfpack members for location:', locationId)

      // Validate locationId if provided
      if (locationId && !this.validateUUID(locationId)) {
        console.error('❌ Invalid location ID format:', locationId)
        return { data: [], error: 'Invalid location ID format' }
      }

      const user = await this.getCurrentUser()
      if (!user) {
        return { data: [], error: 'Authentication required' }
      }

      // Query wolfpack members from users table
      const query = this.supabase
        .from('users')
        .select('*')
        .eq('is_wolfpack_member', true)
        .not('wolfpack_status', 'is', null)

      if (locationId) {
        query.eq('location_id', locationId)
      }

      const { data, error } = await query

      if (error) {
        console.error('❌ Error fetching wolfpack members:', error)
        return { data: [], error: error.message }
      }

      // Transform the users table data to match EnhancedWolfpackMember format
      const enhancedMembers: EnhancedWolfpackMember[] = (data || []).map(member => ({
        id: member.id,
        id: member.id, // In users table, id is the id
        location_id: member.location_id,
        status: member.wolfpack_status || 'active',
        display_name: member.display_name || member.first_name || 'Pack Member',
        emoji: member.wolf_emoji || '🐺',
        current_vibe: null,
        favorite_drink: null,
        looking_for: null,
        instagram_handle: null,
        joined_at: member.wolfpack_joined_at || member.created_at,
        last_active: member.updated_at,
        is_active: member.is_wolfpack_member || false,
        // User data is already in the member object
        user_email: member.email || null,
        user_first_name: member.first_name || null,
        user_last_name: member.last_name || null,
        user_avatar_url: member.avatar_url || null,
        // Wolf profile data - not available in users table
        wolf_profile_id: null,
        wolf_bio: null,
        wolf_profile_pic_url: null,
        wolf_is_profile_visible: null,
      }))

      console.log('✅ Successfully fetched', enhancedMembers.length, 'wolfpack members')
      return { data: enhancedMembers, error: null }

    } catch (error) {
      console.error('❌ Unexpected error in getWolfpackMembers:', error)
      return { data: [], error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  // Check user's current membership across all locations
  async getCurrentUserMembership(): Promise<{
    data: EnhancedWolfpackMember | null
    error: string | null
  }> {
    try {
      const user = await this.getCurrentUser()
      if (!user) {
        return { data: null, error: 'Authentication required' }
      }

      const { data: members, error } = await this.getWolfpackMembers()
      
      if (error) {
        return { data: null, error }
      }

      // Find the user's active membership
      const userMembership = members.find(member => 
        member.id === user.id && member.is_active
      )

      return { data: userMembership || null, error: null }

    } catch (error) {
      console.error('❌ Error getting current user membership:', error)
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  // Check user's membership status
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

      if (!this.validateUUID(user.id)) {
        console.error('❌ Invalid user ID format:', user.id)
        return { data: null, error: 'Invalid user ID format' }
      }

      const { data, error } = await RPCFallbacks.checkUserMembership(user.id, locationId)

      if (error) {
        console.error('❌ Error checking membership:', error)
        return { data: null, error: error.message }
      }

      const result = Array.isArray(data) && data.length > 0 ? data[0] : { is_member: false, membership_id: null, status: null, joined_at: null }
      console.log('✅ Membership check result:', result)
      return { data: result, error: null }

    } catch (error) {
      console.error('❌ Unexpected error in checkMembership:', error)
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  // Join wolfpack using secure function
  async joinWolfpack(data: {
    locationId: string
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

      if (!this.validateUUID(user.id)) {
        return { data: null, error: 'Invalid user ID format' }
      }

      const { data: result, error } = await RPCFallbacks.joinWolfpack(user.id, data)

      if (error) {
        console.error('❌ Error joining wolfpack:', error)
        return { data: null, error: error.message }
      }

      const joinResult = Array.isArray(result) && result.length > 0 ? result[0] : { success: false, membership_id: null, message: 'Unknown error' }
      console.log('✅ Join wolfpack result:', joinResult)
      return { data: joinResult, error: null }

    } catch (error) {
      console.error('❌ Unexpected error in joinWolfpack:', error)
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  // Leave wolfpack using secure function
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

      if (!this.validateUUID(user.id)) {
        return { data: null, error: 'Invalid user ID format' }
      }

      const { data: result, error } = await RPCFallbacks.leaveWolfpack(user.id)

      if (error) {
        console.error('❌ Error leaving wolfpack:', error)
        return { data: null, error: error.message }
      }

      const leaveResult = Array.isArray(result) && result.length > 0 ? result[0] : { success: false, message: 'Unknown error' }
      console.log('✅ Leave wolfpack result:', leaveResult)
      return { data: leaveResult, error: null }

    } catch (error) {
      console.error('❌ Unexpected error in leaveWolfpack:', error)
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  // Subscribe to realtime changes with proper error handling
  async subscribeToWolfpackChanges(
    locationId: string,
    onMemberJoined: (member: EnhancedWolfpackMember) => void,
    onMemberLeft: (userId: string) => void,
    onMemberUpdated: (member: EnhancedWolfpackMember) => void,
    onError: (error: string) => void
  ) {
    try {
      console.log('📡 Setting up realtime subscription for location:', locationId)

      const user = await this.getCurrentUser()
      if (!user) {
        onError('Authentication required for realtime subscription')
        return null
      }

      // Subscribe to wolf-pack-members changes
      const channel = this.supabase
        .channel(`wolfpack_${locationId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'wolf-pack-members',
            filter: `location_id=eq.${locationId}`
          },
          async (payload) => {
            console.log('➕ Member joined:', payload.new)
            
            // Fetch full member data with joins
            const { data: members } = await this.getWolfpackMembers(locationId)
            const newMember = members.find(m => m.id === payload.new.id)
            if (newMember) {
              onMemberJoined(newMember)
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'wolf-pack-members',
            filter: `location_id=eq.${locationId}`
          },
          async (payload) => {
            console.log('🔄 Member updated:', payload.new)
            
            if (payload.new.is_active === false) {
              // Member left
              onMemberLeft(payload.new.id)
            } else {
              // Member updated
              const { data: members } = await this.getWolfpackMembers(locationId)
              const updatedMember = members.find(m => m.id === payload.new.id)
              if (updatedMember) {
                onMemberUpdated(updatedMember)
              }
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'wolf-pack-members',
            filter: `location_id=eq.${locationId}`
          },
          (payload) => {
            console.log('➖ Member deleted:', payload.old)
            onMemberLeft(payload.old.id)
          }
        )
        .subscribe((status) => {
          console.log('📡 Subscription status:', status)
          if (status === 'SUBSCRIBED') {
            console.log('✅ Successfully subscribed to wolfpack changes')
          } else if (status === 'CHANNEL_ERROR') {
            console.error('❌ Channel error in wolfpack subscription')
            onError('Failed to establish realtime connection')
          }
        })

      return channel

    } catch (error) {
      console.error('❌ Error setting up realtime subscription:', error)
      onError(error instanceof Error ? error.message : 'Unknown subscription error')
      return null
    }
  }

  // Get current user's profile with wolf profile data
  async getCurrentUserProfile(): Promise<{
    data: RealtimeUser | null
    error: string | null
  }> {
    try {
      const user = await this.getCurrentUser()
      if (!user) {
        return { data: null, error: 'Authentication required' }
      }

      const { data, error } = await this.supabase
        .from('users')
        .select(`
          *,
          wolf_profile:wolf_profiles(*),
          wolfpack_member:wolf-pack-members(*)
        `)
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('❌ Error fetching user profile:', error)
        return { data: null, error: error.message }
      }

      console.log('✅ Successfully fetched user profile')
      return { data: data as unknown as RealtimeUser, error: null }

    } catch (error) {
      console.error('❌ Unexpected error in getCurrentUserProfile:', error)
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  // Update user profile
  async updateProfile(updates: {
    displayName?: string
    emoji?: string
    currentVibe?: string
    favoriteDrink?: string
    lookingFor?: string
    instagramHandle?: string
    bio?: string
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

      // Update wolf_profiles table
      if (updates.bio !== undefined) {
        const { error: profileError } = await this.supabase
          .from('wolf_profiles')
          .upsert({
            id: user.id,
            bio: updates.bio,
            display_name: updates.displayName,
            updated_at: new Date().toISOString()
          })

        if (profileError) {
          console.error('❌ Error updating wolf profile:', profileError)
          return { success: false, error: profileError.message }
        }
      }

      // Update wolf-pack-members table for current active memberships
      const memberUpdates: Record<string, unknown> = {}
      if (updates.displayName !== undefined) memberUpdates.display_name = updates.displayName
      if (updates.emoji !== undefined) memberUpdates.emoji = updates.emoji
      if (updates.currentVibe !== undefined) memberUpdates.current_vibe = updates.currentVibe
      if (updates.favoriteDrink !== undefined) memberUpdates.favorite_drink = updates.favoriteDrink
      if (updates.lookingFor !== undefined) memberUpdates.looking_for = updates.lookingFor
      if (updates.instagramHandle !== undefined) memberUpdates.instagram_handle = updates.instagramHandle

      if (Object.keys(memberUpdates).length > 0) {
        memberUpdates.updated_at = new Date().toISOString()
        
        const { error: memberError } = await this.supabase
          .from('wolf-pack-members')
          .update(memberUpdates)
          .eq('id', user.id)
          .eq('is_active', true)

        if (memberError) {
          console.error('❌ Error updating wolfpack member profile:', memberError)
          return { success: false, error: memberError.message }
        }
      }

      console.log('✅ Successfully updated profile')
      return { success: true, error: null }

    } catch (error) {
      console.error('❌ Unexpected error in updateProfile:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  // Clean up function to remove subscriptions
  unsubscribe(channel: ReturnType<typeof this.supabase.channel> | null) {
    if (channel) {
      this.supabase.removeChannel(channel)
      console.log('🔌 Unsubscribed from realtime channel')
    }
  }
}

// Export singleton instance
export const wolfpackRealtimeClient = new WolfpackRealtimeClient()

// Helper function to convert enhanced member to RealtimeUser
export function enhancedMemberToRealtimeUser(member: EnhancedWolfpackMember): RealtimeUser {
  return {
    id: member.id,
    email: member.user_email || '',
    first_name: member.user_first_name || null,
    last_name: member.user_last_name || null,
    avatar_url: member.user_avatar_url || null,
    wolfpack_status: member.status || 'inactive',
    status: 'active',
    created_at: member.joined_at,
    updated_at: member.joined_at,
    // Add other required UserRow fields with defaults
    auth_id: null,
    avatar_id: null,
    block_reason: null,
    blocked_at: null,
    blocked_by: null,
    deleted_at: null,
    is_approved: true,
    is_permanent_pack_member: false,
    is_wolfpack_member: member.is_active,
    last_login: null,
    location_id: member.location_id,
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
    wolfpack_joined_at: member.joined_at,
    wolfpack_tier: 'basic',
    wolf_profile: member.wolf_profile_id ? {
      id: member.wolf_profile_id,
      id: member.id,
      display_name: member.display_name,
      wolf_emoji: member.emoji || '🐺',
      bio: member.wolf_bio || null,
      favorite_drink: member.favorite_drink || null,
      vibe_status: member.current_vibe || null,
      looking_for: member.looking_for || null,
      instagram_handle: member.instagram_handle || null,
      is_profile_visible: member.wolf_is_profile_visible ?? true,
      profile_pic_url: member.wolf_profile_pic_url || null,
      created_at: member.joined_at,
      updated_at: member.joined_at,
      // Add other wolf profile fields with defaults
      custom_avatar_id: null,
      gender: null,
      pronouns: null,
      daily_customization: null,
      profile_image_url: null,
      allow_messages: true,
      phone: null,
      location_permissions_granted: false,
      favorite_bartender: null,
      last_seen_at: member.last_active || member.joined_at
    } : undefined
  } as unknown as RealtimeUser
}