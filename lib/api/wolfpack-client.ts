// lib/api/wolfpack-client.ts
// Centralized API client for wolfpack operations using backend validation schemas

import { createClient } from '@/lib/supabase/client';
import { adaptAPIResponse, adaptWolfpackMembership, adaptWolfChatMessage } from '@/lib/types/adapters';

// Import validation schemas from backend
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    error: string;
    code: string;
    details?: unknown;
    timestamp: string;
  };
  meta?: {
    total_count?: number;
    has_more?: boolean;
    next_cursor?: string;
  };
}

class WolfpackAPIClient {
  private supabase = createClient();

  private async makeRequest<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any
  ): Promise<APIResponse<T>> {
    try {
      const { data: { session } } = await this.supabase.auth.getSession();
      
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token && {
            'Authorization': `Bearer ${session.access_token}`
          })
        },
        ...(data && { body: JSON.stringify(data) })
      });

      const result = await response.json();
      return adaptAPIResponse<T>(result);
    } catch (error) {
      console.error(`API request failed: ${method} ${endpoint}`, error);
      return {
        success: false,
        error: {
          error: 'Network request failed',
          code: 'NETWORK_ERROR',
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  // Wolfpack membership operations
  async joinPack(data: {
    location_id: string;
    display_name: string;
    emoji?: string;
    current_vibe?: string;
    favorite_drink?: string;
    looking_for?: string;
    instagram_handle?: string;
  }): Promise<APIResponse<{ membership: any; message: string }>> {
    return this.makeRequest('POST', '/api/wolfpack/join', data);
  }

  async leavePack(data: {
    location_id: string;
    session_id?: string;
  }): Promise<APIResponse<{ message: string }>> {
    return this.makeRequest('POST', '/api/wolfpack/leave', data);
  }

  async getActiveMembers(locationId: string, limit = 50): Promise<APIResponse<{ members: any[]; total_count: number }>> {
    return this.makeRequest('GET', `/api/wolfpack/members?location_id=${locationId}&limit=${limit}`);
  }

  async checkMembership(locationId: string): Promise<APIResponse<{ is_member: boolean; membership: any }>> {
    return this.makeRequest('GET', `/api/wolfpack/membership?location_id=${locationId}`);
  }

  async updateProfile(membershipId: string, data: {
    display_name?: string;
    emoji?: string;
    current_vibe?: string;
    favorite_drink?: string;
    looking_for?: string;
    instagram_handle?: string;
  }): Promise<APIResponse<{ membership: any; message: string }>> {
    return this.makeRequest('PUT', `/api/wolfpack/profile/${membershipId}`, data);
  }

  // Location operations
  async verifyLocation(data: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  }): Promise<APIResponse<{ is_at_location: boolean; nearest_location?: any; distance: number }>> {
    return this.makeRequest('POST', '/api/wolfpack/location/verify', data);
  }

  async getLocations(): Promise<APIResponse<{ locations: any[] }>> {
    return this.makeRequest('GET', '/api/wolfpack/locations');
  }

  // Chat operations
  async sendMessage(data: {
    session_id: string;
    message: string;
    image_id?: string;
    reply_to_id?: string;
  }): Promise<APIResponse<{ message: any }>> {
    return this.makeRequest('POST', '/api/messages/send', data);
  }

  async sendLocationMessage(data: {
    location_id: string;
    message: string;
    image_id?: string;
  }): Promise<APIResponse<{ message: any }>> {
    return this.makeRequest('POST', '/api/messages/location', data);
  }

  async reactToMessage(data: {
    message_id: string;
    reaction: string;
  }): Promise<APIResponse<{ reaction: any }>> {
    return this.makeRequest('POST', '/api/messages/react', data);
  }

  async getChatMessages(sessionId: string, limit = 50, cursor?: string): Promise<APIResponse<{ messages: any[]; next_cursor?: string }>> {
    let url = `/api/messages?session_id=${sessionId}&limit=${limit}`;
    if (cursor) url += `&cursor=${cursor}`;
    return this.makeRequest('GET', url);
  }

  // Private messaging
  async sendPrivateMessage(data: {
    to_user_id: string;
    message: string;
    is_flirt_message?: boolean;
    image_id?: string;
  }): Promise<APIResponse<{ message: any }>> {
    return this.makeRequest('POST', '/api/messages/private', data);
  }

  async getPrivateMessages(userId: string, limit = 50, cursor?: string): Promise<APIResponse<{ messages: any[]; next_cursor?: string }>> {
    let url = `/api/messages/private/${userId}?limit=${limit}`;
    if (cursor) url += `&cursor=${cursor}`;
    return this.makeRequest('GET', url);
  }

  // DJ operations
  async createDJEvent(data: {
    location_id: string;
    event_type: 'poll' | 'contest' | 'voting' | 'raffle' | 'trivia';
    title: string;
    description?: string;
    options?: string[];
    voting_ends_at?: string;
    event_config?: Record<string, any>;
  }): Promise<APIResponse<{ event_id: string; event_type: string; title: string; voting_ends_at?: string }>> {
    return this.makeRequest('POST', '/api/dj/events', data);
  }

  async voteOnEvent(eventId: string, data: {
    option?: string;
    vote_value?: number;
  }): Promise<APIResponse<{ vote_id: string; vote_counts: any }>> {
    return this.makeRequest('POST', `/api/events/${eventId}/vote`, data);
  }

  async getEventVotes(eventId: string): Promise<APIResponse<{ event: any; vote_counts: any; user_vote: any; has_voted: boolean }>> {
    return this.makeRequest('GET', `/api/events/${eventId}/vote`);
  }

  async getDJEvents(locationId: string): Promise<APIResponse<{ events: any[] }>> {
    return this.makeRequest('GET', `/api/dj/events?location_id=${locationId}`);
  }

  // Order integration
  async getWolfpackOrders(locationId: string, limit = 20): Promise<APIResponse<{ orders: any[]; total_count: number }>> {
    return this.makeRequest('GET', `/api/orders/wolfpack?location_id=${locationId}&limit=${limit}`);
  }

  async placeWolfpackOrder(data: {
    location_id: string;
    items: Array<{ menu_item_id: string; quantity: number }>;
    share_with_pack?: boolean;
    table_location?: string;
  }): Promise<APIResponse<{ order: any }>> {
    return this.makeRequest('POST', '/api/orders/wolfpack', data);
  }

  // Content flagging
  async flagContent(data: {
    content_id: string;
    content_type: 'message' | 'profile' | 'image' | 'private_message';
    reason: 'spam' | 'harassment' | 'inappropriate' | 'fake' | 'other';
    details?: string;
  }): Promise<APIResponse<{ message: string }>> {
    return this.makeRequest('POST', '/api/content/flag', data);
  }

  // Search
  async searchUsers(data: {
    query: string;
    location_id?: string;
    limit?: number;
  }): Promise<APIResponse<{ users: any[] }>> {
    const params = new URLSearchParams({
      query: data.query,
      limit: (data.limit || 10).toString(),
      ...(data.location_id && { location_id: data.location_id })
    });
    return this.makeRequest('GET', `/api/search/users?${params}`);
  }

  // Admin operations (if user has permissions)
  async triggerDailyReset(locationId?: string): Promise<APIResponse<{ summary: any; operations: any[] }>> {
    return this.makeRequest('POST', '/api/wolfpack/reset', { location_id: locationId });
  }

  async getResetStatus(): Promise<APIResponse<{ current_time: string; next_reset: string; time_until_reset: number }>> {
    return this.makeRequest('GET', '/api/wolfpack/reset');
  }
}

// Export singleton instance
export const wolfpackAPI = new WolfpackAPIClient();

// Helper functions for common patterns
export async function withErrorHandling<T>(
  apiCall: () => Promise<APIResponse<T>>,
  successMessage?: string
): Promise<{ success: boolean; data?: T; error?: string }> {
  const response = await apiCall();
  
  if (response.success && response.data) {
    if (successMessage) {
      console.log(successMessage);
    }
    return { success: true, data: response.data };
  } else {
    const errorMessage = response.error?.error || 'An unexpected error occurred';
    console.error('API Error:', response.error);
    return { success: false, error: errorMessage };
  }
}

// Type-safe error checking
export function isAPIError<T>(response: APIResponse<T>): response is APIResponse<never> & { error: NonNullable<APIResponse<T>['error']> } {
  return !response.success && !!response.error;
}

export function isAPISuccess<T>(response: APIResponse<T>): response is APIResponse<T> & { data: T } {
  return response.success && response.data !== undefined;
}