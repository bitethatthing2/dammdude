import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

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
        
        // Create notification for the customer
        const notificationMessage = tableName 
          ? `Your order for ${tableName} is ready for pickup!`
          : 'Your order is ready for pickup!';
        
        // Use push_notifications table 
        await supabase
          .from('push_notifications')
          .insert({
            title: 'Order Ready!',
            body: notificationMessage,
            type: 'info',
            id: null, // For anonymous orders
            data: {
              order_id: orderId,
              order_status: status,
              table_name: tableName || null,
              customer_id: order.customer_id
            }
          });
        
        // Also send push notification if user has device tokens
        const { data: deviceTokens } = await supabase
          .from('device_tokens')
          .select('token')
          .eq('id', order.customer_id)
          .eq('is_active', true);
        
        if (deviceTokens && deviceTokens.length > 0) {
          // Queue push notification for sending
          await supabase
            .from('push_notifications')
            .insert({
              id: order.customer_id,
              title: 'Order Ready!',
              body: notificationMessage,
              data: {
                type: 'order',
                order_id: orderId,
                action: 'view_order'
              },
              status: 'pending'
            });
        }
        
        notificationSent = true;
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
        status
      },
      notificationSent
    });
    
  } catch (err) {
    console.error('Unexpected server error:', err);
    
    return NextResponse.json({
      error: 'Unexpected server error',
      details: err instanceof Error ? err.message : String(err)
    }, { status: 500 });
  }
}
