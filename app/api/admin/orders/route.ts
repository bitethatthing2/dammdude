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
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    // Get order ID from params
    const { orderId } = await params;
    
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
      .select('id, status, table_location, customer_id, location_id')
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
    
    if (notify && status === 'ready' && order.customer_id) {
      try {
        // Get table information from table_location string
        const tableName = order.table_location;
        
        // Create notification message
        const notificationMessage = tableName 
          ? `Your order for ${tableName} is ready for pickup!`
          : 'Your order is ready for pickup!';
        
        // Get customer's active device tokens
        const { data: deviceTokens } = await supabase
          .from('device_tokens')
          .select('id, token')
          .eq('user_id', order.customer_id)  // Fixed: use user_id not id
          .eq('is_active', true);
        
        if (deviceTokens && deviceTokens.length > 0) {
          // Create push notifications for each device token
          const notifications = deviceTokens.map(device => ({
            user_id: order.customer_id,
            device_token_id: device.id,
            title: 'Order Ready! 🍺',
            body: notificationMessage,
            type: 'order_update',
            priority: 'high',
            data: {
              order_id: orderId,
              order_status: status,
              table_location: tableName || null,
              action: 'view_order'
            },
            status: 'pending'
          }));
          
          const { error: notificationError } = await supabase
            .from('push_notifications')
            .insert(notifications);
          
          if (notificationError) {
            console.error('Failed to create push notifications:', notificationError);
          } else {
            notificationSent = true;
            
            // Update the order to mark that notification was sent
            await supabase
              .from('bartender_orders')
              .update({ 
                ready_notification_sent: true,
                ready_at: new Date().toISOString()
              })
              .eq('id', orderId);
          }
        } else {
          console.warn(`No active device tokens found for customer ${order.customer_id}`);
        }
        
      } catch (notificationError) {
        console.error('Error sending notifications:', notificationError);
        // Continue even if notification fails
      }
    }
    
    // Return success response
    return NextResponse.json({
      success: true,
      order: {
        id: orderId,
        status,
        previousStatus: order.status,
        tableLocation: order.table_location
      },
      notificationSent,
      customerHasDeviceTokens: order.customer_id ? true : false
    });
    
  } catch (err) {
    console.error('Unexpected server error:', err);
    
    return NextResponse.json({
      error: 'Unexpected server error',
      details: err instanceof Error ? err.message : String(err)
    }, { status: 500 });
  }
}