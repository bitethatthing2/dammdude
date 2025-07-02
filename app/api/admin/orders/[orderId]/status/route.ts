import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Input validation schema
const updateOrderStatusSchema = z.object({
  status: z.enum(['pending', 'preparing', 'ready', 'delivered', 'completed', 'cancelled']),
  notify: z.boolean().optional().default(true)
});

/**
 * PATCH /api/admin/orders/[orderId]/status
 * Updates an order's status and optionally sends notifications
 */
export async function PATCH(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  try {
    // Get order ID from params
    const { orderId } = params;
    
    if (!orderId) {
      return NextResponse.json({
        error: 'Order ID is required'
      }, { status: 400 });
    }
    
    // Parse request body
    const body = await request.json();
    
    // Validate input
    const validation = updateOrderStatusSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json({
        error: 'Invalid input',
        details: validation.error.format()
      }, { status: 400 });
    }
    
    const { status, notify } = validation.data;
    
    // Get cookie store and create Supabase client
    const supabase = await createServerClient();
    
    // Fetch current order to verify it exists
    const { data: order, error: orderError } = await supabase
      .from('bartender_orders')
      .select('id, status, table_location, customer_id')
      .eq('id', orderId)
      .single();
    
    if (orderError || !order) {
      return NextResponse.json({
        error: 'Order not found',
        details: orderError?.message
      }, { status: 404 });
    }
    
    // Update order status
    const { error: updateError } = await supabase
      .from('bartender_orders')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);
    
    if (updateError) {
      return NextResponse.json({
        error: 'Failed to update order status',
        details: updateError.message
      }, { status: 500 });
    }
    
    // Send notification if requested and status is 'ready'
    let notificationSent = false;
    
    if (notify && status === 'ready') {
      try {
        const tableLocation = order.table_location || null;
        
        // Find device tokens for notifications
        let deviceTokens: Array<{ id: string, token: string }> = [];
        
        if (order.customer_id) {
          // First, try to get device tokens directly from the customer
          const { data: customerTokens } = await supabase
            .from('device_tokens')
            .select('id, token')
            .eq('user_id', order.customer_id)
            .eq('is_active', true);
          
          if (customerTokens && customerTokens.length > 0) {
            deviceTokens = customerTokens;
          }
        }
        
        // Note: Table-based device lookup could be implemented here
        // if there's a way to map table_location to table_id in device_registrations
        // For now, we rely on customer_id based device token lookup
        
        // Create push notifications
        if (deviceTokens.length > 0) {
          const notifications = deviceTokens.map((device) => ({
            user_id: order.customer_id,
            device_token_id: device.id,
            title: 'Order Ready! 🍺',
            body: tableLocation 
              ? `Your order for ${tableLocation} is ready for pickup!`
              : 'Your order is ready for pickup!',
            data: { 
              orderId, 
              tableLocation,
              type: 'order_ready'
            },
            type: 'order_update',
            priority: 'high',
            status: 'pending'
          }));
          
          const { error: notificationError } = await supabase
            .from('push_notifications')
            .insert(notifications);
          
          if (notificationError) {
            console.error('Failed to create push notifications:', notificationError);
          } else {
            notificationSent = true;
          }
        }
        
        // Also update the order to mark that a ready notification was sent
        if (notificationSent) {
          await supabase
            .from('bartender_orders')
            .update({ 
              ready_notification_sent: true,
              ready_at: new Date().toISOString()
            })
            .eq('id', orderId);
        }
        
      } catch (notificationError) {
        console.error('Error in notification process:', notificationError);
        // Continue even if notification fails - the order status update succeeded
      }
    }
    
    // Return success response
    return NextResponse.json({
      success: true,
      order: {
        id: orderId,
        status,
        previousStatus: order.status
      },
      notificationSent,
      tableLocation: order.table_location
    });
    
  } catch (err) {
    console.error('Unexpected server error:', err);
    
    return NextResponse.json({
      error: 'Unexpected server error',
      details: err instanceof Error ? err.message : String(err)
    }, { status: 500 });
  }
}