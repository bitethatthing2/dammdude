import { useState, useEffect, useCallback } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/contexts/AuthContext'

export interface WolfPackMember {
  id: string
  user_id: string
  username: string
  profile_image_url?: string  // NOT avatar_url
  emoji?: string
  role?: 'bartender' | 'dj' | 'user'
  status: string
  favorite_drink?: string
  vibe_status?: string  // NOT current_vibe
  looking_for?: string
  location: 'salem' | 'portland'
  joined_at: string
  instagram_handle?: string
}

export interface WolfPackEvent {
  id: string
  title: string
  type: 'contest' | 'trivia' | 'special'
  description: string
  is_active: boolean
  participant_count: number
  created_by: string
  location: 'salem' | 'portland'
  created_at: string
}

export interface WolfPackSession {
  id: string
  user_id: string
  location: 'salem' | 'portland'
  joined_at: string
  expires_at: string
  is_active: boolean
  username?: string
}

interface RealtimePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new: Record<string, unknown>
  old: Record<string, unknown>
}

interface UseWolfPackReturn {
  packMembers: WolfPackMember[]
  activeEvents: WolfPackEvent[]
  session: WolfPackSession | null
  isInPack: boolean
  loading: boolean
  error: string | null
  joinPack: (profileData: Partial<WolfPackMember>) => Promise<{ data?: WolfPackMember; error?: string }>
  leavePack: () => Promise<void>
}

export function useWolfPack(location: 'salem' | 'portland' | null): UseWolfPackReturn {
  const { user } = useAuth()
  const [packMembers, setPackMembers] = useState<WolfPackMember[]>([])
  const [activeEvents, setActiveEvents] = useState<WolfPackEvent[]>([])
  const [session, setSession] = useState<WolfPackSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = getSupabaseBrowserClient()

  // Check if user has an active wolf pack session
  const checkSession = useCallback(async () => {
    if (!user || !location) return

    try {
      const { data, error } = await supabase
        .from('wolfpack_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('location', location)
        .eq('is_active', true)
        .gte('expires_at', new Date().toISOString())
        .maybeSingle()

      if (error) throw error
      setSession(data)
    } catch (err) {
      console.error('Error checking wolf pack session:', err)
      setError(err instanceof Error ? err.message : 'Failed to check session')
    }
  }, [user, location, supabase])

  // Join the wolf pack
  const joinPack = async (profileData: Partial<WolfPackMember>) => {
    if (!user || !location) return { error: 'User or location not available' }

    try {
      // Create or update wolf pack session
      const sessionExpiry = new Date()
      sessionExpiry.setHours(26, 30, 0, 0) // Next day at 2:30 AM
      
      const { data: sessionData, error: sessionError } = await supabase
        .from('wolfpack_sessions')
        .upsert({
          user_id: user.id,
          location,
          is_active: true,
          expires_at: sessionExpiry.toISOString(),
          username: profileData.username
        })
        .select()
        .single()

      if (sessionError) throw sessionError

      // Create or update wolf pack member profile
      const { data: memberData, error: memberError } = await supabase
        .from('wolfpack_members')
        .upsert({
          user_id: user.id,
          location,
          ...profileData,
          joined_at: new Date().toISOString()
        })
        .select()
        .single()

      if (memberError) throw memberError

      setSession(sessionData)
      return { data: memberData }
    } catch (err) {
      console.error('Error joining wolf pack:', err)
      return { error: err instanceof Error ? err.message : 'Failed to join pack' }
    }
  }

  // Leave the wolf pack
  const leavePack = async () => {
    if (!user || !session) return

    try {
      await supabase
        .from('wolfpack_sessions')
        .update({ is_active: false })
        .eq('id', session.id)

      await supabase
        .from('wolfpack_members')
        .delete()
        .eq('user_id', user.id)
        .eq('location', location!)

      setSession(null)
    } catch (err) {
      console.error('Error leaving wolf pack:', err)
    }
  }

  // Fetch active pack members
  useEffect(() => {
    if (!location) return

    const fetchMembers = async () => {
      try {
        const { data, error } = await supabase
          .from('wolfpack_members')
          .select('*')
          .eq('location', location)
          .order('joined_at', { ascending: false })

        if (error) throw error
        setPackMembers(data || [])
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
      .channel(`wolfpack_members_${location}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wolfpack_members',
          filter: `location=eq.${location}`
        },
        (payload: RealtimePayload) => {
          if (payload.eventType === 'INSERT') {
            setPackMembers((prev) => [payload.new as unknown as WolfPackMember, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setPackMembers((prev) =>
              prev.map((member) =>
                member.id === payload.new.id ? (payload.new as unknown as WolfPackMember) : member
              )
            )
          } else if (payload.eventType === 'DELETE') {
            setPackMembers((prev) => prev.filter((member) => member.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [location, supabase])

  // Fetch active events
  useEffect(() => {
    if (!location) return

    const fetchEvents = async () => {
      try {
        const { data, error } = await supabase
          .from('wolfpack_events')
          .select('*')
          .eq('location', location)
          .order('created_at', { ascending: false })

        if (error) throw error
        setActiveEvents(data || [])
      } catch (err) {
        console.error('Error fetching events:', err)
      }
    }

    fetchEvents()

    // Set up realtime subscription for events
    const channel = supabase
      .channel(`wolfpack_events_${location}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wolfpack_events',
          filter: `location=eq.${location}`
        },
        (payload: RealtimePayload) => {
          if (payload.eventType === 'INSERT') {
            setActiveEvents((prev) => [payload.new as unknown as WolfPackEvent, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setActiveEvents((prev) =>
              prev.map((event) =>
                event.id === payload.new.id ? (payload.new as unknown as WolfPackEvent) : event
              )
            )
          } else if (payload.eventType === 'DELETE') {
            setActiveEvents((prev) => prev.filter((event) => event.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [location, supabase])

  // Check session when user changes
  useEffect(() => {
    checkSession()
  }, [checkSession])

  return {
    packMembers,
    activeEvents,
    session,
    isInPack: !!session,
    loading,
    error,
    joinPack,
    leavePack
  }
}

// WolfPack Actions Hook
export function useWolfPackActions() {
  const { user } = useAuth()
  const supabase = getSupabaseBrowserClient()

  const sendWink = async (recipientId: string) => {
    if (!user) return { error: 'Not authenticated' }

    try {
      const { data, error } = await supabase
        .from('wolfpack_winks')
        .insert({
          sender_id: user.id,
          recipient_id: recipientId,
          created_at: new Date().toISOString()
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
          created_at: new Date().toISOString()
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
        .from('wolfpack_event_participants')
        .insert({
          event_id: eventId,
          user_id: user.id,
          joined_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      // Update participant count
      await supabase.rpc('increment_event_participants', { event_id: eventId })

      return { data }
    } catch (err) {
      console.error('Error joining event:', err)
      return { error: err instanceof Error ? err.message : 'Failed to join event' }
    }
  }

  const voteInEvent = async (eventId: string, optionId: string) => {
    if (!user) return { error: 'Not authenticated' }

    try {
      const { data, error } = await supabase
        .from('wolfpack_event_votes')
        .insert({
          event_id: eventId,
          user_id: user.id,
          option_id: optionId,
          created_at: new Date().toISOString()
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

// Location Verification Hook for Side Hustle Bar
export function useLocationVerification() {
  const [location, setLocation] = useState<'salem' | 'portland' | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Side Hustle Bar locations
  const LOCATIONS = {
    salem: {
      lat: 44.9429,
      lng: -123.0351,
      radius: 100 // meters
    },
    portland: {
      lat: 45.5152,
      lng: -122.6784,
      radius: 100 // meters
    }
  }

  const verifyLocation = async () => {
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
        LOCATIONS.salem.lat,
        LOCATIONS.salem.lng
      )

      if (salemDistance <= LOCATIONS.salem.radius) {
        setLocation('salem')
        return
      }

      // Check if user is at Portland location
      const portlandDistance = calculateDistance(
        latitude,
        longitude,
        LOCATIONS.portland.lat,
        LOCATIONS.portland.lng
      )

      if (portlandDistance <= LOCATIONS.portland.radius) {
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
  }

  // Haversine formula to calculate distance between two points
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
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
  }

  useEffect(() => {
    verifyLocation()
  }, [])

  return {
    location,
    loading,
    error,
    verifyLocation
  }
}
