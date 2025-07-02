// lib/api/wolfpack-client.ts
// Centralized API client for wolfpack operations with proper TypeScript support

import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/supabase'
import { RealtimeUser } from '@/types/realtime'

type Tables = Database['public']['Tables']
type UserRow = Tables['users']['Row']
type WolfProfileRow = Tables['wolf_profiles']['Row']
type WolfpackMemberRow = Tables['wolf-pack-members']['Row']
type WolfChatMessageRow = Tables['wolfpack_chat_messages']['Row']
type LocationRow = Tables['locations']['Row']
type DJEventRow = Tables['dj_events']['Row']
type BartenderOrderRow = Tables['bartender_orders']['Row']

// Enhanced API Response interface with better typing
export interface APIResponse<T = unknown> {
  success: boolean
  data?: T
  error?: {
    error: string
    code: string

    
    details?: unknown
    timestamp: string
  }
  meta?: {
    total_count?: number
    has_more?: boolean
    next_cursor?: string
    page?: number
    per_page?: number
  }
}

// Wolfpack-specific response types
export interface WolfpackMembership extends WolfpackMemberRow {
  user?: UserRow
  wolf_profile?: WolfProfileRow
}

export interface WolfpackLocation extends LocationRow {
  active_member_count?: number
  is_user_at_location?: boolean
  distance_meters?: number
}

export interface ChatMessage extends WolfChatMessageRow {
  user?: Pick<UserRow, 'id' | 'first_name' | 'last_name' | 'avatar_url'>
  wolf_profile?: Pick<WolfProfileRow, 'display_name' | 'wolf_emoji'>
  reactions?: Array<{
    id: string
    id: string
    reaction: string
    created_at: string
  }>
  reply_to?: ChatMessage
}

export interface DJEvent extends DJEventRow {
  dj?: Pick<UserRow, 'id' | 'first_name' | 'last_name'>
  participants_count?: number
  user_vote?: {
    id: string
    option: string
    vote_value: number
    created_at: string
  }
  vote_counts?: Record<string, number>
}

export interface PrivateMessage {
  id: string
  sender_id: string
  receiver_id: string
  message: string
  image_url?: string
  image_id?: string
  is_read: boolean
  is_flirt_message: boolean
  created_at: string
  from_user?: Pick<UserRow, 'id' | 'first_name' | 'last_name' | 'avatar_url'>
  wolf_profile?: Pick<WolfProfileRow, 'display_name' | 'wolf_emoji'>
}

// API Error types
export type APIErrorCode = 
  | 'NETWORK_ERROR'
  | 'UNAUTHORIZED' 
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'RATE_LIMITED'
  | 'SERVER_ERROR'
  | 'LOCATION_REQUIRED'
  | 'ALREADY_MEMBER'
  | 'NOT_MEMBER'

class WolfpackAPIClient {
  private supabase = createClient()
  private baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || ''

  private async makeRequest<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: Record<string, unknown>,
    options?: RequestInit
  ): Promise<APIResponse<T>> {
    try {
      const { data: { session } } = await this.supabase.auth.getSession()
      
      if (!session?.access_token) {
        return {
          success: false,
          error: {
            error: 'Authentication required',
            code: 'UNAUTHORIZED',
            timestamp: new Date().toISOString()
          }
        }
      }

      const url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          ...options?.headers
        },
        ...(data && { body: JSON.stringify(data) }),
        ...options
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        return {
          success: false,
          error: {
            error: errorData.error || `HTTP ${response.status}: ${response.statusText}`,
            code: this.getErrorCode(response.status),
            details: errorData,
            timestamp: new Date().toISOString()
          }
        }
      }

      const result = await response.json()
      return {
        success: true,
        data: result.data || result,
        meta: result.meta
      }
    } catch (error) {
      console.error(`API request failed: ${method} ${endpoint}`, error)
      return {
        success: false,
        error: {
          error: error instanceof Error ? error.message : 'Network request failed',
          code: 'NETWORK_ERROR',
          timestamp: new Date().toISOString()
        }
      }
    }
  }

  private getErrorCode(status: number): APIErrorCode {
    switch (status) {
      case 401: return 'UNAUTHORIZED'
      case 403: return 'FORBIDDEN'
      case 404: return 'NOT_FOUND'
      case 422: return 'VALIDATION_ERROR'
      case 429: return 'RATE_LIMITED'
      case 500:
      case 502:
      case 503:
      case 504: return 'SERVER_ERROR'
      default: return 'NETWORK_ERROR'
    }
  }

  // Wolfpack membership operations
  async joinPack(data: {
    location_id: string
    display_name: string
    emoji?: string
    current_vibe?: string
    favorite_drink?: string
    looking_for?: string
    instagram_handle?: string
    bio?: string
  }): Promise<APIResponse<{ membership: WolfpackMembership; message: string }>> {
    return this.makeRequest('POST', '/api/wolfpack/join', data)
  }

  async leavePack(data: {
    location_id: string
    session_id?: string
  }): Promise<APIResponse<{ message: string }>> {
    return this.makeRequest('POST', '/api/wolfpack/leave', data)
  }

  async getActiveMembers(
    locationId: string, 
    options?: { limit?: number; cursor?: string }
  ): Promise<APIResponse<{ members: RealtimeUser[]; total_count: number; next_cursor?: string }>> {
    const params = new URLSearchParams({
      location_id: locationId,
      limit: (options?.limit || 50).toString(),
      ...(options?.cursor && { cursor: options.cursor })
    })
    return this.makeRequest('GET', `/api/wolfpack/members?${params}`)
  }

  async checkMembership(
    locationId: string
  ): Promise<APIResponse<{ is_member: boolean; membership?: WolfpackMembership }>> {
    return this.makeRequest('GET', `/api/wolfpack/membership?location_id=${locationId}`)
  }

  async updateProfile(
    membershipId: string, 
    data: {
      display_name?: string
      emoji?: string
      current_vibe?: string
      favorite_drink?: string
      looking_for?: string
      instagram_handle?: string
      bio?: string
      is_profile_visible?: boolean
    }
  ): Promise<APIResponse<{ membership: WolfpackMembership; message: string }>> {
    return this.makeRequest('PUT', `/api/profile/${membershipId}`, data)
  }

  async getCurrentMembership(): Promise<APIResponse<WolfpackMembership | null>> {
    return this.makeRequest('GET', '/api/wolfpack/me')
  }

  // Location operations
  async verifyLocation(data: {
    latitude: number
    longitude: number
    accuracy?: number
  }): Promise<APIResponse<{ 
    is_at_location: boolean
    nearest_location?: WolfpackLocation
    distance: number 
  }>> {
    return this.makeRequest('POST', '/api/wolfpack/location/verify', data)
  }

  async getLocations(
    options?: { include_inactive?: boolean }
  ): Promise<APIResponse<{ locations: WolfpackLocation[] }>> {
    const params = new URLSearchParams()
    if (options?.include_inactive) {
      params.set('include_inactive', 'true')
    }
    const query = params.toString()
    return this.makeRequest('GET', `/api/wolfpack/locations${query ? `?${query}` : ''}`)
  }

  async getLocationById(locationId: string): Promise<APIResponse<WolfpackLocation>> {
    return this.makeRequest('GET', `/api/wolfpack/locations/${locationId}`)
  }

  // Chat operations
  async sendMessage(data: {
    session_id: string
    message: string
    image_id?: string
    reply_to_id?: string
  }): Promise<APIResponse<{ message: ChatMessage }>> {
    return this.makeRequest('POST', '/api/messages/send', data)
  }

  async sendLocationMessage(data: {
    location_id: string
    message: string
    image_id?: string
  }): Promise<APIResponse<{ message: ChatMessage }>> {
    return this.makeRequest('POST', '/api/messages/location', data)
  }

  async reactToMessage(data: {
    message_id: string
    reaction: string
  }): Promise<APIResponse<{ reaction: { id: string; message_id: string; id: string; emoji: string; created_at: string } }>> {
    return this.makeRequest('POST', '/api/messages/react', data)
  }

  async removeReaction(data: {
    message_id: string
    reaction: string
  }): Promise<APIResponse<{ message: string }>> {
    return this.makeRequest('DELETE', '/api/messages/react', data)
  }

  async getChatMessages(
    sessionId: string, 
    options?: { limit?: number; cursor?: string; before?: string }
  ): Promise<APIResponse<{ messages: ChatMessage[]; next_cursor?: string; has_more: boolean }>> {
    const params = new URLSearchParams({
      session_id: sessionId,
      limit: (options?.limit || 50).toString(),
      ...(options?.cursor && { cursor: options.cursor }),
      ...(options?.before && { before: options.before })
    })
    return this.makeRequest('GET', `/api/messages?${params}`)
  }

  async deleteMessage(messageId: string): Promise<APIResponse<{ message: string }>> {
    return this.makeRequest('DELETE', `/api/messages/${messageId}`)
  }

  // Private messaging
  async sendPrivateMessage(data: {
    receiver_id: string
    message: string
    is_flirt_message?: boolean
    image_id?: string
  }): Promise<APIResponse<{ message: PrivateMessage }>> {
    return this.makeRequest('POST', '/api/messages/private', data)
  }

  async getPrivateMessages(
    userId: string, 
    options?: { limit?: number; cursor?: string }
  ): Promise<APIResponse<{ messages: PrivateMessage[]; next_cursor?: string; has_more: boolean }>> {
    const params = new URLSearchParams({
      limit: (options?.limit || 50).toString(),
      ...(options?.cursor && { cursor: options.cursor })
    })
    return this.makeRequest('GET', `/api/messages/private/${userId}?${params}`)
  }

  async getPrivateConversations(): Promise<APIResponse<{ 
    conversations: Array<{
      user: Pick<UserRow, 'id' | 'first_name' | 'last_name' | 'avatar_url'>
      wolf_profile?: Pick<WolfProfileRow, 'display_name' | 'wolf_emoji'>
      last_message: PrivateMessage
      unread_count: number
    }>
  }>> {
    return this.makeRequest('GET', '/api/messages/private/conversations')
  }

  async markPrivateMessagesAsRead(userId: string): Promise<APIResponse<{ message: string }>> {
    return this.makeRequest('PUT', `/api/messages/private/${userId}/read`)
  }

  // DJ operations
  async createDJEvent(data: {
    location_id: string
    event_type: 'poll' | 'contest' | 'voting' | 'raffle' | 'trivia'
    title: string
    description?: string
    options?: string[]
    voting_ends_at?: string
    event_config?: Record<string, unknown>
  }): Promise<APIResponse<{ 
    event_id: string
    event_type: string
    title: string
    voting_ends_at?: string 
  }>> {
    return this.makeRequest('POST', '/api/dj/events', data)
  }

  async voteOnEvent(
    eventId: string, 
    data: { option?: string; vote_value?: number }
  ): Promise<APIResponse<{ vote_id: string; vote_counts: Record<string, number> }>> {
    return this.makeRequest('POST', `/api/events/${eventId}/vote`, data)
  }

  async getEventVotes(
    eventId: string
  ): Promise<APIResponse<{ 
    event: DJEvent
    vote_counts: Record<string, number>
    user_vote?: {
      id: string
      option: string
      vote_value: number
      created_at: string
    }
    has_voted: boolean 
  }>> {
    return this.makeRequest('GET', `/api/events/${eventId}/vote`)
  }

  async getDJEvents(
    locationId: string,
    options?: { active_only?: boolean }
  ): Promise<APIResponse<{ events: DJEvent[] }>> {
    const params = new URLSearchParams({ location_id: locationId })
    if (options?.active_only) {
      params.set('active_only', 'true')
    }
    return this.makeRequest('GET', `/api/dj/events?${params}`)
  }

  async endDJEvent(eventId: string): Promise<APIResponse<{ event: DJEvent; winner?: { id: string; name: string; option: string; votes: number } }>> {
    return this.makeRequest('PUT', `/api/dj/events/${eventId}/end`)
  }

  // Order integration
  async getWolfpackOrders(
    locationId: string, 
    options?: { limit?: number; status?: string }
  ): Promise<APIResponse<{ orders: BartenderOrderRow[]; total_count: number }>> {
    const params = new URLSearchParams({
      location_id: locationId,
      limit: (options?.limit || 20).toString(),
      ...(options?.status && { status: options.status })
    })
    return this.makeRequest('GET', `/api/orders/wolfpack?${params}`)
  }

  async placeWolfpackOrder(data: {
    location_id: string
    items: Array<{ menu_item_id: string; quantity: number; modifiers?: Array<{ id: string; name: string; price: number; selected: boolean }> }>
    share_with_pack?: boolean
    table_location?: string
    customer_notes?: string
  }): Promise<APIResponse<{ order: BartenderOrderRow }>> {
    return this.makeRequest('POST', '/api/orders/wolfpack', data)
  }

  async getOrderStatus(orderId: string): Promise<APIResponse<BartenderOrderRow>> {
    return this.makeRequest('GET', `/api/orders/${orderId}`)
  }

  // Content flagging
  async flagContent(data: {
    content_id: string
    content_type: 'message' | 'profile' | 'image' | 'private_message'
    reason: 'spam' | 'harassment' | 'inappropriate' | 'fake' | 'other'
    details?: string
  }): Promise<APIResponse<{ message: string }>> {
    return this.makeRequest('POST', '/api/content/flag', data)
  }

  // Search operations
  async searchUsers(data: {
    query: string
    location_id?: string
    limit?: number
    filters?: {
      wolfpack_only?: boolean
      online_only?: boolean
      gender?: string
    }
  }): Promise<APIResponse<{ users: RealtimeUser[] }>> {
    const params = new URLSearchParams({
      query: data.query,
      limit: (data.limit || 10).toString(),
      ...(data.location_id && { location_id: data.location_id }),
      ...(data.filters?.wolfpack_only && { wolfpack_only: 'true' }),
      ...(data.filters?.online_only && { online_only: 'true' }),
      ...(data.filters?.gender && { gender: data.filters.gender })
    })
    return this.makeRequest('GET', `/api/search/users?${params}`)
  }

  async searchMessages(data: {
    query: string
    session_id?: string
    location_id?: string
    limit?: number
  }): Promise<APIResponse<{ messages: ChatMessage[] }>> {
    const params = new URLSearchParams({
      query: data.query,
      limit: (data.limit || 20).toString(),
      ...(data.session_id && { session_id: data.session_id }),
      ...(data.location_id && { location_id: data.location_id })
    })
    return this.makeRequest('GET', `/api/search/messages?${params}`)
  }

  // User interactions
  async sendWink(data: {
    receiver_id: string
    location_id: string
  }): Promise<APIResponse<{ message: string; interaction_id: string }>> {
    return this.makeRequest('POST', '/api/interactions/wink', data)
  }

  async sendDrink(data: {
    receiver_id: string
    location_id: string
    drink_name: string
    message?: string
  }): Promise<APIResponse<{ message: string; interaction_id: string }>> {
    return this.makeRequest('POST', '/api/interactions/drink', data)
  }

  async getInteractions(
    options?: { limit?: number; type?: string }
  ): Promise<APIResponse<{ interactions: Array<{ id: string; type: string; sender_id: string; receiver_id: string; message?: string; created_at: string; status: string }> }>> {
    const params = new URLSearchParams({
      limit: (options?.limit || 20).toString(),
      ...(options?.type && { type: options.type })
    })
    return this.makeRequest('GET', `/api/interactions?${params}`)
  }

  // Admin operations (if user has permissions)
  async triggerDailyReset(
    locationId?: string
  ): Promise<APIResponse<{ summary: { total_resets: number; affected_locations: number; timestamp: string }; operations: Array<{ type: string; target: string; result: string; timestamp: string }> }>> {
    return this.makeRequest('POST', '/api/wolfpack/reset', { location_id: locationId })
  }

  async getResetStatus(): Promise<APIResponse<{ 
    current_time: string
    next_reset: string
    time_until_reset: number 
  }>> {
    return this.makeRequest('GET', '/api/wolfpack/reset')
  }

  async getAdminStats(
    locationId: string
  ): Promise<APIResponse<{
    active_members: number
    total_messages: number
    active_sessions: number
    location_stats: {
      total_members: number
      active_sessions: number
      messages_today: number
      peak_time: string
      avg_session_duration: number
    }
  }>> {
    return this.makeRequest('GET', `/api/admin/stats?location_id=${locationId}`)
  }

  // Utility methods
  async healthCheck(): Promise<APIResponse<{ status: string; timestamp: string }>> {
    return this.makeRequest('GET', '/api/health')
  }

  async uploadImage(file: File, type: 'avatar' | 'chat' | 'message'): Promise<APIResponse<{
    image_id: string
    url: string
    storage_path: string
  }>> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', type)

    const { data: { session } } = await this.supabase.auth.getSession()
    
    const response = await fetch('/api/upload/image', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session?.access_token}`
      },
      body: formData
    })

    const result = await response.json()
    return response.ok ? { success: true, data: result } : { 
      success: false, 
      error: { 
        error: result.error || 'Upload failed', 
        code: 'UPLOAD_ERROR',
        timestamp: new Date().toISOString()
      } 
    }
  }
}

// Export singleton instance
export const wolfpackAPI = new WolfpackAPIClient()

// Helper functions for common patterns
export async function withErrorHandling<T>(
  apiCall: () => Promise<APIResponse<T>>,
  options?: {
    successMessage?: string
    onSuccess?: (data: T) => void
    onError?: (error: string) => void
  }
): Promise<{ success: boolean; data?: T; error?: string }> {
  const response = await apiCall()
  
  if (response.success && response.data) {
    if (options?.successMessage) {
      console.log(options.successMessage)
    }
    options?.onSuccess?.(response.data)
    return { success: true, data: response.data }
  } else {
    const errorMessage = response.error?.error || 'An unexpected error occurred'
    console.error('API Error:', response.error)
    options?.onError?.(errorMessage)
    return { success: false, error: errorMessage }
  }
}

// Type guards
export function isAPIError<T>(
  response: APIResponse<T>
): response is APIResponse<never> & { error: NonNullable<APIResponse<T>['error']> } {
  return !response.success && !!response.error
}

export function isAPISuccess<T>(
  response: APIResponse<T>
): response is APIResponse<T> & { data: T } {
  return response.success && response.data !== undefined
}

// Rate limiting helper
export class RateLimiter {
  private static requests = new Map<string, number[]>()

  static canMakeRequest(endpoint: string, maxRequests = 10, windowMs = 60000): boolean {
    const now = Date.now()
    const key = `${endpoint}`
    const requests = this.requests.get(key) || []
    
    // Remove old requests outside the window
    const validRequests = requests.filter(time => now - time < windowMs)
    
    if (validRequests.length >= maxRequests) {
      return false
    }
    
    validRequests.push(now)
    this.requests.set(key, validRequests)
    return true
  }
}

// Retry helper
export async function withRetry<T>(
  apiCall: () => Promise<APIResponse<T>>,
  maxRetries = 3,
  delay = 1000
): Promise<APIResponse<T>> {
  let lastResponse: APIResponse<T>
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    lastResponse = await apiCall()
    
    if (lastResponse.success || attempt === maxRetries) {
      return lastResponse
    }
    
    // Don't retry client errors (4xx)
    if (lastResponse.error?.code && ['VALIDATION_ERROR', 'UNAUTHORIZED', 'FORBIDDEN', 'NOT_FOUND'].includes(lastResponse.error.code)) {
      return lastResponse
    }
    
    // Wait before retrying
    await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt)))
  }
  
  return lastResponse!
}