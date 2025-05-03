import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { OrderStatus } from '@/lib/types/order';

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
    const cookieStore = cookies();
    const supabase = await createSupabaseServerClient(cookieStore);
    
    // Fetch current order to verify it exists
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, status, table_id')
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
      .from('orders')
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
        const { data: table } = await supabase
          .from('tables')
          .select('name')
          .eq('id', order.table_id)
          .single();
        
        // Find registered devices for this table
        const { data: devices } = await supabase
          .from('device_registrations')
          .select('device_id')
          .eq('table_id', order.table_id)
          .eq('type', 'customer');
        
        if (devices && devices.length > 0) {
          // Create notifications for each device
          const notifications = devices.map(device => ({
            recipient_id: device.device_id,
            message: `Your order for ${table?.name || 'your table'} is ready for pickup!`,
            type: 'info',
            status: 'unread'
          }));
          
          // Insert notifications
          await supabase
            .from('notifications')
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