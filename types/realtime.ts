import { Database } from './supabase'

export type RealtimeConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

export interface RealtimeUser {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  avatar_url: string | null
  wolfpack_status: string | null
  wolfpack_tier: string | null
  status: 'active' | 'inactive' | null
  created_at: string
  updated_at: string
  session_id: string | null
  last_activity: string | null
  is_online: boolean | null
  wolf_profile?: {
    display_name: string | null
    bio: string | null
    vibe_status: string | null
    location_name: string | null
    current_vibe: string | null
    emoji: string | null
    favorite_drink: string | null
    instagram_handle: string | null
    pronouns: string | null
    age: number | null
    id: string
    created_at: string
    updated_at: string
  } | null
  wolfpack_member?: {
    id: string
    id: string
    status: string | null
    joined_at: string | null
    left_at: string | null
    location_name: string | null
    table_location: string | null
    session_id: string | null
    last_active: string | null
    created_at: string
    updated_at: string
  } | null
}

export interface RealtimeState {
  status: RealtimeConnectionStatus
  isLoading: boolean
  error: string | null
  members: RealtimeUser[]
  onlineMembers: RealtimeUser[]
  currentUser: RealtimeUser | null
  sessionId: string | null
  isCurrentUser: boolean
  joinPack: () => Promise<void>
  leavePack: () => Promise<void>
  updateProfile: (updates: any) => Promise<void>
  refreshStatus: () => Promise<void>
  refreshMembers: () => Promise<void>
  clearError: () => void
}

export interface RealtimeActions {
  connect: () => void
  disconnect: () => void
  reconnect: () => void
  setCurrentUser: (user: RealtimeUser | null) => void
  updateUserStatus: (userId: string, status: Partial<RealtimeUser>) => void
  addMember: (member: RealtimeUser) => void
  removeMember: (userId: string) => void
  updateMember: (userId: string, updates: Partial<RealtimeUser>) => void
  setMembers: (members: RealtimeUser[]) => void
  joinPack: (userId: string) => Promise<void>
  leavePack: (userId: string) => Promise<void>
  setStatus: (status: RealtimeConnectionStatus) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
  updateProfile: (userId: string, updates: any) => Promise<void>
  refreshStatus: () => Promise<void>
  refreshMembers: () => Promise<void>
}

export interface RealtimeContextType {
  state: RealtimeState
  actions: RealtimeActions
}

export interface SupabaseRealtimePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new: Record<string, any> | null
  old: Record<string, any> | null
  schema: string
  table: string
}

export type RealtimeCallback = (payload: SupabaseRealtimePayload) => void

export interface RealtimeSubscription {
  unsubscribe: () => void
}

export interface WolfpackMembership {
  id: string
  id: string
  status: string | null
  joined_at: string | null
  left_at: string | null
  location_name: string | null
  table_location: string | null
  session_id: string | null
  last_active: string | null
  created_at: string
  updated_at: string
}

export interface WolfProfile {
  id: string
  display_name: string | null
  bio: string | null
  vibe_status: string | null
  location_name: string | null
  current_vibe: string | null
  emoji: string | null
  favorite_drink: string | null
  instagram_handle: string | null
  pronouns: string | null
  age: number | null
  created_at: string
  updated_at: string
}