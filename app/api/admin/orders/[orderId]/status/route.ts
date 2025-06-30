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
      .select('id, status, table_location')
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
        // Get table information
        const tableLocation = order.table_location || null;
        
        // Find registered devices for this table if device_registrations table exists
        let devices: Array<{ device_id: string }> = [];
        if (tableLocation) {
          try {
            const { data: deviceData } = await supabase
              .from('device_registrations')
              .select('device_id')
              .eq('table_location', tableLocation)
              .eq('type', 'customer');
            devices = deviceData || [];
          } catch {
            // device_registrations table may not exist yet
            devices = [];
          }
        }
        
        if (devices && devices.length > 0) {
          // Create push notifications for each device
          const notifications = devices.map((device: { device_id: string }) => ({
            id: null, // No specific user, using device token
            device_token_id: device.device_id,
            title: 'Order Ready',
            body: `Your order for ${tableLocation || 'your table'} is ready for pickup!`,
            data: { orderId, tableLocation },
            status: 'pending'
          }));
          
          // Insert notifications (use push_notifications table instead)
          await supabase
            .from('push_notifications')
            .insert(notifications);
          
          notificationSent = true;
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
