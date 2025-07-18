import { supabase } from '@/lib/supabase/client';
import type { Database } from '@/lib/database.types';

type OrderRequest = Database['public']['Tables']['order_requests']['Row'];
type OrderRequestInsert = Database['public']['Tables']['order_requests']['Insert'];

export interface CreateOrderRequestParams {
  menu_item_id: string;
  item_name: string;
  item_price: number;
  quantity: number;
  user_id: string;
  location_id: string;
  special_instructions?: string;
  modifier_data?: any;
}

export class OrderRequestService {
  /**
   * Create a new order request for bartender approval
   */
  static async createOrderRequest(params: CreateOrderRequestParams): Promise<OrderRequest> {
    const orderRequestData: OrderRequestInsert = {
      user_id: params.user_id,
      location_id: params.location_id,
      menu_item_id: params.menu_item_id,
      item_name: params.item_name,
      item_price: params.item_price,
      quantity: params.quantity || 1,
      special_instructions: params.special_instructions || null,
      status: 'pending',
      request_type: 'menu_item'
    };

    const { data, error } = await supabase
      .from('order_requests')
      .insert(orderRequestData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create order request: ${error.message}`);
    }

    return data;
  }

  /**
   * Get pending order requests for a location (bartender view)
   */
  static async getPendingOrderRequests(locationId: string): Promise<OrderRequest[]> {
    const { data, error } = await supabase
      .from('order_requests')
      .select(`
        *,
        users:user_id (
          id,
          display_name,
          avatar_url,
          has_open_tab
        )
      `)
      .eq('location_id', locationId)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch pending order requests: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get user's order request history
   */
  static async getUserOrderRequests(userId: string): Promise<OrderRequest[]> {
    const { data, error } = await supabase
      .from('order_requests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      throw new Error(`Failed to fetch user order requests: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Approve an order request (bartender action)
   */
  static async approveOrderRequest(requestId: string, bartenderId: string): Promise<void> {
    const { error } = await supabase
      .from('order_requests')
      .update({
        status: 'approved',
        bartender_id: bartenderId,
        processed_at: new Date().toISOString()
      })
      .eq('id', requestId);

    if (error) {
      throw new Error(`Failed to approve order request: ${error.message}`);
    }
  }

  /**
   * Deny an order request (bartender action)
   */
  static async denyOrderRequest(requestId: string, bartenderId: string, reason?: string): Promise<void> {
    const { error } = await supabase
      .from('order_requests')
      .update({
        status: 'denied',
        bartender_id: bartenderId,
        denial_reason: reason || null,
        processed_at: new Date().toISOString()
      })
      .eq('id', requestId);

    if (error) {
      throw new Error(`Failed to deny order request: ${error.message}`);
    }
  }

  /**
   * Block a user from making order requests (bartender action)
   */
  static async blockUserFromOrdering(userId: string, locationId: string, bartenderId: string): Promise<void> {
    // Update user's status to blocked for this location
    const { error } = await supabase
      .from('user_interaction_permissions')
      .upsert({
        user_id: userId,
        location_id: locationId,
        can_order: false,
        blocked_by: bartenderId,
        blocked_at: new Date().toISOString(),
        block_reason: 'Excessive requests or inappropriate behavior'
      });

    if (error) {
      throw new Error(`Failed to block user: ${error.message}`);
    }
  }

  /**
   * Unblock a user (bartender action)
   */
  static async unblockUser(userId: string, locationId: string): Promise<void> {
    const { error } = await supabase
      .from('user_interaction_permissions')
      .update({
        can_order: true,
        blocked_by: null,
        blocked_at: null,
        block_reason: null
      })
      .eq('user_id', userId)
      .eq('location_id', locationId);

    if (error) {
      throw new Error(`Failed to unblock user: ${error.message}`);
    }
  }

  /**
   * Check if user can make order requests
   */
  static async canUserMakeOrderRequests(userId: string, locationId: string): Promise<boolean> {
    // Check if user is blocked
    const { data: permissions } = await (supabase as any)
      .from('user_location_permissions')
      .select('can_order')
      .eq('user_id', userId)
      .eq('location_id', locationId)
      .maybeSingle();

    if (permissions && (permissions as any).can_order === false) {
      return false;
    }

    // Check if user has too many pending requests (rate limiting)
    const { data: pendingRequests } = await supabase
      .from('order_requests')
      .select('id')
      .eq('user_id', userId)
      .eq('location_id', locationId)
      .eq('status', 'pending')
      .gte('created_at', new Date(Date.now() - 30 * 60 * 1000).toISOString()); // Last 30 minutes

    const pendingCount = pendingRequests?.length || 0;
    
    // Allow max 5 pending requests per 30 minutes
    return pendingCount < 5;
  }

  /**
   * Subscribe to order request updates for real-time notifications
   */
  static subscribeToOrderRequests(locationId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`order-requests-${locationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'order_requests',
          filter: `location_id=eq.${locationId}`
        },
        callback
      )
      .subscribe();
  }
}