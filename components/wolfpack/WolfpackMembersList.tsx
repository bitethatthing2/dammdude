import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/contexts/AuthContext'
import type { Database } from '@/lib/database.types'
import { supabase } from '@/lib/supabase/client'

// Location IDs from database
const LOCATION_IDS = {
  salem: '50d17782-3f4a-43a1-b6b6-608171ca3c7c',
  portland: 'ec1e8869-454a-49d2-93e5-ed05f49bb932'
} as const

export type LocationKey = keyof typeof LOCATION_IDS

// Use correct database types
type UserRow = Database['public']['Tables']['users']['Row']
type DjEventRow = Database['public']['Tables']['dj_events']['Row']
type LocationRow = Database['public']['Tables']['locations']['Row']

// Simplified membership type based on users table
export interface WolfpackMembership {
  id: string
  id: string
  display_name: string | null
  avatar_url: string | null
  location_id: string | null
  wolfpack_status: string | null
  wolfpack_joined_at: string | null
  wolfpack_tier: string | null
  is_wolfpack_member: boolean | null
  last_activity: string | null
}

// Pack member interface
export interface WolfPackMember {
  id: string
  display_name: string
  avatar_url: string | null
  profile_image_url: string | null
  role: string | null
  wolfpack_status: string | null
  wolfpack_tier: string | null
  is_online: boolean | null
  last_activity: string | null
  wolfpack_joined_at: string | null
  location_id: string | null
}

// Event interface with participant count
export interface WolfPackEvent extends DjEventRow {
  participant_count?: number
}

// Location interface with member count
export interface WolfPackLocation extends LocationRow {
  member_count?: number
}

interface UseWolfPackReturn {
  packMembers: WolfPackMember[]
  activeEvents: WolfPackEvent[]
  membership: WolfpackMembership | null
  isInPack: boolean
  loading: boolean
  error: string | null
  joinPack: (profileData?: Partial<{
    display_name: string
  }>) => Promise<{ data?: WolfPackMember; error?: string }>
  leavePack: () => Promise<void>
  refreshMembership: () => Promise<void>
}

export function useWolfPack(locationKey: LocationKey | null): UseWolfPackReturn {
  const { user } = useAuth()
  const [packMembers, setPackMembers] = useState<WolfPackMember[]>([])
  const [activeEvents, setActiveEvents] = useState<WolfPackEvent[]>([])
  const [membership, setMembership] = useState<WolfpackMembership | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const locationId = locationKey ? LOCATION_IDS[locationKey] : null

  // Check if user has an active wolf pack membership
  const checkMembership = useCallback(async () => {
    if (!user) {
      setMembership(null)
      setLoading(false)
      return
    }

    try {
      const { data: membershipData, error: membershipError } = await supabase
        .from('users')
        .select(`
          id,
          display_name,
          first_name,
          last_name,
          avatar_url,
          profile_image_url,
          location_id,
          wolfpack_status,
          wolfpack_joined_at,
          wolfpack_tier,
          is_wolfpack_member,
          last_activity
        `)
        .eq('id', user.id)
        .single()

      if (membershipError) {
        console.error('Error checking membership:', membershipError)
        setMembership(null)
        return
      }

      // Check if user is an active wolfpack member
      const isActiveMember = membershipData.is_wolfpack_member && 
                           membershipData.wolfpack_status === 'active'

      if (isActiveMember) {
        const adaptedMembership: WolfpackMembership = {
          id: membershipData.id,
          id: membershipData.id,
          display_name: membershipData.display_name || membershipData.first_name || membershipData.last_name,
          avatar_url: membershipData.profile_image_url || membershipData.avatar_url,
          location_id: membershipData.location_id,
          wolfpack_status: membershipData.wolfpack_status,
          wolfpack_joined_at: membershipData.wolfpack_joined_at,
          wolfpack_tier: membershipData.wolfpack_tier,
          is_wolfpack_member: membershipData.is_wolfpack_member,
          last_activity: membershipData.last_activity
        }
        setMembership(adaptedMembership)
      } else {
        setMembership(null)
      }

    } catch (err) {
      console.error('Error checking wolf pack membership:', err)
      setError(err instanceof Error ? err.message : 'Failed to check membership')
      setMembership(null)
    }
  }, [user])

  // Join the wolf pack
  const joinPack = async (profileData?: Partial<{
    display_name: string
  }>) => {
    if (!user || !locationId) {
      return { error: 'User or location not available' }
    }

    try {
      // Update user to be wolfpack member
      const updateData: any = {
        is_wolfpack_member: true,
        wolfpack_status: 'active',
        wolfpack_joined_at: new Date().toISOString(),
        location_id: locationId,
        last_activity: new Date().toISOString()
      }

      // Add profile data if provided
      if (profileData?.display_name) {
        updateData.display_name = profileData.display_name
      }

      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', user.id)
        .select()
        .single()

      if (updateError) throw updateError

      // Refresh membership
      await checkMembership()
      
      return { data: updatedUser as WolfPackMember }
    } catch (err) {
      console.error('Error joining wolf pack:', err)
      return { error: err instanceof Error ? err.message : 'Failed to join pack' }
    }
  }

  // Leave the wolf pack
  const leavePack = async () => {
    if (!user) return

    try {
      const { error: leaveError } = await supabase
        .from('users')
        .update({ 
          wolfpack_status: 'inactive',
          is_wolfpack_member: false,
          wolfpack_joined_at: null,
          location_id: null
        })
        .eq('id', user.id)

      if (leaveError) throw leaveError

      setMembership(null)
      setPackMembers([])
    } catch (err) {
      console.error('Error leaving wolf pack:', err)
      setError(err instanceof Error ? err.message : 'Failed to leave pack')
    }
  }

  // Refresh membership manually
  const refreshMembership = useCallback(async () => {
    await checkMembership()
  }, [checkMembership])

  // Fetch active pack members
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        // Build query for active wolfpack members
        let query = supabase
          .from('users')
          .select(`
            id,
            display_name,
            first_name,
            last_name,
            avatar_url,
            profile_image_url,
            role,
            wolfpack_status,
            wolfpack_tier,
            is_online,
            last_activity,
            wolfpack_joined_at,
            location_id
          `)
          .eq('is_wolfpack_member', true)
          .eq('wolfpack_status', 'active')

        // Filter by location if specified
        if (locationId) {
          query = query.eq('location_id', locationId)
        }

        query = query.order('wolfpack_joined_at', { ascending: false })

        const { data, error } = await query

        if (error) throw error

        // Transform data to WolfPackMember format
        const transformedMembers: WolfPackMember[] = (data || []).map(member => ({
          id: member.id,
          display_name: member.display_name || member.first_name || member.last_name || 'Pack Member',
          avatar_url: member.avatar_url,
          profile_image_url: member.profile_image_url,
          role: member.role,
          wolfpack_status: member.wolfpack_status,
          wolfpack_tier: member.wolfpack_tier,
          is_online: member.is_online,
          last_activity: member.last_activity,
          wolfpack_joined_at: member.wolfpack_joined_at,
          location_id: member.location_id
        }))

        setPackMembers(transformedMembers)
      } catch (err) {
        console.error('Error fetching pack members:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch members')
      }
    }

    fetchMembers()

    // Set up real-time subscription for member changes
    const channel = supabase
      .channel('wolfpack_members_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users',
          filter: 'is_wolfpack_member=eq.true'
        },
        (payload) => {
          console.log('Wolfpack member change:', payload)
          fetchMembers() // Refetch on any change
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [locationId])

  // Fetch active events
  useEffect(() => {
    if (!locationId) return

    const fetchEvents = async () => {
      try {
        const { data, error } = await supabase
          .from('dj_events')
          .select('*')
          .eq('location_id', locationId)
          .in('status', ['active', 'voting'])
          .is('ended_at', null)
          .order('created_at', { ascending: false })

        if (error) throw error
        
        // Get participant counts
        const eventsWithCount: WolfPackEvent[] = []
        for (const event of data || []) {
          const { count } = await supabase
            .from('dj_event_participants')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', event.id)

          eventsWithCount.push({
            ...event,
            participant_count: count || 0
          })
        }
        
        setActiveEvents(eventsWithCount)
      } catch (err) {
        console.error('Error fetching events:', err)
      }
    }

    fetchEvents()

    // Set up real-time subscription for events
    const channel = supabase
      .channel(`wolfpack_events_${locationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'dj_events',
          filter: `location_id=eq.${locationId}`
        },
        () => {
          fetchEvents() // Refetch on any change
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [locationId])

  // Check membership when user changes
  useEffect(() => {
    setLoading(true)
    checkMembership().finally(() => setLoading(false))
  }, [checkMembership])

  return {
    packMembers,
    activeEvents,
    membership,
    isInPack: !!membership,
    loading,
    error,
    joinPack,
    leavePack,
    refreshMembership
  }
}

// WolfPack Actions Hook
export function useWolfPackActions() {
  const { user } = useAuth()

  const sendWink = async (recipientId: string, locationId?: string) => {
    if (!user) return { error: 'Not authenticated' }

    try {
      const { data, error } = await supabase
        .from('wolf_pack_interactions')
        .insert({
          sender_id: user.id,
          receiver_id: recipientId,
          interaction_type: 'wink',
          location_id: locationId || null,
          status: 'active' // Use correct status value
        })
        .select()
        .single()

      if (error) throw error
      return { data }
    } catch (err) {
      console.error('Error sending wink:', err)
      return { error: err instanceof Error ? err.message : 'Failed to send wink' }
    }
  }

  const sendPrivateMessage = async (recipientId: string, message: string) => {
    if (!user) return { error: 'Not authenticated' }

    try {
      const { data, error } = await supabase
        .from('wolf_private_messages')
        .insert({
          sender_id: user.id,
          receiver_id: recipientId,
          message_content: message, // Use correct column name
          is_read: false
        })
        .select()
        .single()

      if (error) throw error
      return { data }
    } catch (err) {
      console.error('Error sending private message:', err)
      return { error: err instanceof Error ? err.message : 'Failed to send message' }
    }
  }

  const joinEvent = async (eventId: string) => {
    if (!user) return { error: 'Not authenticated' }

    try {
      const { data, error } = await supabase
        .from('dj_event_participants')
        .insert({
          event_id: eventId,
          participant_id: user.id
        })
        .select()
        .single()

      if (error) throw error
      return { data }
    } catch (err) {
      console.error('Error joining event:', err)
      return { error: err instanceof Error ? err.message : 'Failed to join event' }
    }
  }

  const voteInEvent = async (eventId: string, votedForId: string) => {
    if (!user) return { error: 'Not authenticated' }

    try {
      const { data, error } = await supabase
        .from('wolf_pack_votes')
        .insert({
          event_id: eventId,
          voter_id: user.id,
          voted_for_id: votedForId
        })
        .select()
        .single()

      if (error) throw error
      return { data }
    } catch (err) {
      console.error('Error voting in event:', err)
      return { error: err instanceof Error ? err.message : 'Failed to vote' }
    }
  }

  return {
    sendWink,
    joinEvent,
    voteInEvent,
    sendPrivateMessage
  }
}

// Location verification coordinates
const VERIFICATION_LOCATIONS = {
  salem: {
    lat: 44.9431,
    lng: -123.0351,
    radius: 100
  },
  portland: {
    lat: 45.5152,
    lng: -122.6784,
    radius: 100
  }
} as const

// Location Verification Hook
export function useLocationVerification() {
  const [location, setLocation] = useState<LocationKey | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const calculateDistance = useCallback((lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3
    const φ1 = (lat1 * Math.PI) / 180
    const φ2 = (lat2 * Math.PI) / 180
    const Δφ = ((lat2 - lat1) * Math.PI) / 180
    const Δλ = ((lon2 - lon1) * Math.PI) / 180

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c
  }, [])

  const verifyLocation = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000 // Cache for 1 minute
        })
      })

      const { latitude, longitude } = position.coords

      // Check Salem location
      const salemDistance = calculateDistance(
        latitude,
        longitude,
        VERIFICATION_LOCATIONS.salem.lat,
        VERIFICATION_LOCATIONS.salem.lng
      )

      if (salemDistance <= VERIFICATION_LOCATIONS.salem.radius) {
        setLocation('salem')
        return
      }

      // Check Portland location
      const portlandDistance = calculateDistance(
        latitude,
        longitude,
        VERIFICATION_LOCATIONS.portland.lat,
        VERIFICATION_LOCATIONS.portland.lng
      )

      if (portlandDistance <= VERIFICATION_LOCATIONS.portland.radius) {
        setLocation('portland')
        return
      }

      setLocation(null)
      setError('You must be at Side Hustle Bar to join the Wolf Pack')
    } catch (err) {
      console.error('Location error:', err)
      setError('Unable to verify location. Please enable location services.')
      setLocation(null)
    } finally {
      setLoading(false)
    }
  }, [calculateDistance])

  useEffect(() => {
    verifyLocation()
  }, [verifyLocation])

  return {
    location,
    loading,
    error,
    verifyLocation
  }
}

// Get nearest location helper
export async function getNearestLocation(latitude: number, longitude: number): Promise<LocationKey | null> {
  // Try database function first
  try {
    const { data, error } = await supabase
      .rpc('find_nearest_location', {
        user_lat: latitude,
        user_lon: longitude,
        max_distance_meters: 100
      })

    if (!error && data && data.length > 0) {
      const location = data[0]
      
      if (location.location_id === LOCATION_IDS.salem) {
        return 'salem'
      } else if (location.location_id === LOCATION_IDS.portland) {
        return 'portland'
      }
    }
  } catch (err) {
    console.warn('Database location lookup failed, using fallback:', err)
  }

  // Fallback to manual calculation
  const salemDistance = calculateDistanceHelper(
    latitude, longitude,
    VERIFICATION_LOCATIONS.salem.lat, VERIFICATION_LOCATIONS.salem.lng
  )
  
  const portlandDistance = calculateDistanceHelper(
    latitude, longitude,
    VERIFICATION_LOCATIONS.portland.lat, VERIFICATION_LOCATIONS.portland.lng
  )

  if (salemDistance <= VERIFICATION_LOCATIONS.salem.radius) {
    return 'salem'
  } else if (portlandDistance <= VERIFICATION_LOCATIONS.portland.radius) {
    return 'portland'
  }

  return null
}

// Helper function for distance calculation
function calculateDistanceHelper(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}