import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/contexts/AuthContext'
import type { Database } from '@/lib/database.types'
import { supabase } from '@/lib/supabase/client';

// Use centralized Supabase client
// Location IDs from database
const LOCATION_IDS = {
  salem: '50d17782-3f4a-43a1-b6b6-608171ca3c7c',
  portland: 'ec1e8869-454a-49d2-93e5-ed05f49bb932'
} as const

export type LocationKey = keyof typeof LOCATION_IDS

// Type aliases from database - using CORRECT table names that exist
type WolfPackMemberRow = Database['public']['Tables']['users']['Row']
// wolfpack_memberships is a view, so we'll define its type based on the view structure
type WolfpackMembership = {
  id: string | null
  user_id: string | null
  display_name: string | null
  avatar_url: string | null
  table_location: string | null
  joined_at: string | null
  last_active: string | null
  status: string | null
  is_host: boolean | null
  session_id: string | null
  location_id: string | null
  is_active: boolean | null
  left_at: string | null
}
type DjEvent = Database['public']['Tables']['dj_events']['Row']
type Location = Database['public']['Tables']['locations']['Row']

// Extended types for our use based on actual backend structure
export interface WolfPackMember extends WolfPackMemberRow {
  users?: {
    id: string
    email: string
    first_name?: string | null
    last_name?: string | null
    role: string
    avatar_url?: string | null
  }
}

export interface WolfPackEvent extends DjEvent {
  participant_count?: number
}

export interface WolfPackLocation extends Location {
  member_count?: number
}

interface UseWolfPackReturn {
  packMembers: WolfPackMember[]
  activeEvents: WolfPackEvent[]
  membership: WolfpackMembership | null
  isInPack: boolean
  loading: boolean
  error: string | null
  joinPack: (profileData: Partial<{
    display_name: string
    table_location: string
  }>) => Promise<{ data?: WolfPackMember; error?: string }>
  leavePack: () => Promise<void>
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
    if (!user || !locationId) return

    try {
      // Check wolfpack_memberships view for active membership
      const { data: membershipData, error: membershipError } = await supabase
        .from("wolfpack_memberships")
        .select('*')
        .eq('user_id', user.id)
        .eq('location_id', locationId)
        .eq('is_active', true)
        .maybeSingle()

      if (membershipError) throw membershipError
      setMembership(membershipData)
    } catch (err) {
      console.error('Error checking wolf pack membership:', err)
      setError(err instanceof Error ? err.message : 'Failed to check membership')
    }
  }, [user, locationId])

  // Join the wolf pack
  const joinPack = async (profileData: Partial<{
    display_name: string
    table_location: string
  }>) => {
    if (!user || !locationId) return { error: 'User or location not available' }

    try {
      // Call the join_wolfpack RPC function
      const { data: result, error: joinError } = await supabase
        .rpc('join_wolfpack', {
          p_location_id: locationId,
          p_latitude: undefined,
          p_longitude: undefined,
          p_table_location: profileData.table_location || undefined
        })

      if (joinError) throw joinError

      // Check if join was successful
      if (result && typeof result === 'object' && 'success' in result && !result.success) {
        throw new Error(String(result.error) || 'Failed to join wolfpack')
      }

      // Update member profile with additional data if we have users
      if (Object.keys(profileData).length > 0) {
        const { error: updateError } = await supabase
          .from('users')
          .update({
            table_location: profileData.table_location,
            display_name: profileData.display_name
          })
          .eq('user_id', user.id)
          .eq('location_id', locationId)
          .eq('is_active', true)

        if (updateError) console.error('Error updating profile:', updateError)
      }

      // Refresh membership and members
      await checkMembership()
      
      return { data: undefined } // Will be loaded by checkMembership
    } catch (err) {
      console.error('Error joining wolf pack:', err)
      return { error: err instanceof Error ? err.message : 'Failed to join pack' }
    }
  }

  // Leave the wolf pack
  const leavePack = async () => {
    if (!user || !locationId) return

    try {
      // Update member to inactive in users
      const { error: leaveError } = await supabase
        .from('users')
        .update({ 
          is_active: false,
          left_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('location_id', locationId)
        .eq('is_active', true)

      if (leaveError) throw leaveError

      setMembership(null)
      setPackMembers([])
    } catch (err) {
      console.error('Error leaving wolf pack:', err)
    }
  }

  // Fetch active pack members
  useEffect(() => {
    if (!locationId) return

    const fetchMembers = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select(`
            *,
            users!user_id (
              id,
              email,
              first_name,
              last_name,
              role,
              avatar_url
            )
          `)
          .eq('location_id', locationId)
          .eq('is_active', true)
          .order('joined_at', { ascending: false })

        if (error) throw error
        setPackMembers((data || []) as WolfPackMember[])
      } catch (err) {
        console.error('Error fetching pack members:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch members')
      } finally {
        setLoading(false)
      }
    }

    fetchMembers()

    // Set up realtime subscription for members
    const channel = supabase
      .channel(`wolfpack_members_${locationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users', // Use the table that actually exists
          filter: `location_id=eq.${locationId}`
        },
        (payload) => {
          const { eventType, old: oldRecord } = payload
          
          if (eventType === 'INSERT' || eventType === 'UPDATE') {
            // Refetch to get joined data
            fetchMembers()
          } else if (eventType === 'DELETE' && oldRecord) {
            setPackMembers((prev) => prev.filter((member) => member.id !== oldRecord.id))
          }
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
          .eq('status', 'active')
          .order('created_at', { ascending: false })

        if (error) throw error
        
        // Add participant count (would need to be calculated separately)
        const eventsWithCount = (data || []).map(event => ({
          ...event,
          participant_count: 0 // You'd need to fetch this separately from dj_event_participants
        }))
        
        setActiveEvents(eventsWithCount)
      } catch (err) {
        console.error('Error fetching events:', err)
      }
    }

    fetchEvents()
    // Set up realtime subscription for events
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
    checkMembership()
  }, [checkMembership])

  return {
    packMembers,
    activeEvents,
    membership,
    isInPack: !!membership,
    loading,
    error,
    joinPack,
    leavePack
  }
}

// WolfPack Actions Hook
export function useWolfPackActions() {
  const { user } = useAuth()

  const sendWink = async (recipientId: string, locationId: string) => {
    if (!user) return { error: 'Not authenticated' }

    try {
      const { data, error } = await supabase
        .from('wolf_pack_interactions')
        .insert({
          sender_id: user.id,
          receiver_id: recipientId,
          interaction_type: 'wink',
          location_id: locationId
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
          from_user_id: user.id,
          to_user_id: recipientId,
          message,
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
          contest_id: eventId,
          voter_id: user.id,
          voted_for_id: votedForId
        })
        .select()
        .single()

      if (error) throw error
      return { data }
    } catch (err) {
      console.error('Error voting:', err)
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

// Side Hustle Bar locations - CORRECTED coordinates from earlier
const VERIFICATION_LOCATIONS = {
  salem: {
    lat: 44.9431, // 145 Liberty St NE Salem
    lng: -123.0351,
    radius: 100 // meters
  },
  portland: {
    lat: 45.5152, // 327 SW Morrison St Portland
    lng: -122.6784,
    radius: 100 // meters
  }
} as const

// Location Verification Hook for Side Hustle Bar
export function useLocationVerification() {
  const [location, setLocation] = useState<LocationKey | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Haversine formula to calculate distance between two points
  const calculateDistance = useCallback((lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3 // Earth's radius in meters
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
          maximumAge: 0
        })
      })

      const { latitude, longitude } = position.coords

      // Check if user is at Salem location
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

      // Check if user is at Portland location
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

      setError('You must be at Side Hustle Bar to join the Wolf Pack')
    } catch (err) {
      console.error('Location error:', err)
      setError('Unable to verify location. Please enable location services.')
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
export async function getNearestLocation(latitude: number, longitude: number) {
  const { data, error } = await supabase
    .rpc('find_nearest_location', {
      user_lat: latitude,
      user_lon: longitude,
      max_distance_meters: 100
    })

  if (error || !data || data.length === 0) {
    return null
  }

  const location = data[0]
  
  // Map location to our location key
  if (location.location_id === LOCATION_IDS.salem) {
    return 'salem' as LocationKey
  } else if (location.location_id === LOCATION_IDS.portland) {
    return 'portland' as LocationKey
  }
  
  return null
}