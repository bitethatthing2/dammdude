"use server";

import { createServerClient } from '@/lib/supabase/server';

/**
 * Updates an order status and sends notifications if needed
 */
export async function updateOrderStatus(
  orderId: string,
  newStatus: 'pending' | 'preparing' | 'ready' | 'completed'
) {
  try {
    const supabase = await createServerClient();
    
    // Update order status
    const { error: updateError } = await supabase
      .from("bartender_orders")
      .update({ status: newStatus })
      .eq("id", orderId);
    
    if (updateError) {
      console.error("Error updating order status:", updateError);
      return { success: false, error: "Failed to update order status" };
    }
    
    // If order is marked as ready, send notification to customer
    if (newStatus === 'ready') {
      // Get order details including table location
      const { data: order, error: orderError } = await supabase
        .from("bartender_orders")
        .select("table_location, customer_id")
        .eq("id", orderId)
        .single();
      
      if (orderError) {
        console.error("Error fetching order details:", orderError);
        return { 
          success: true, 
          orderUpdated: true, 
          notificationSent: false, 
          error: "Order updated but failed to fetch details for notification" 
        };
      }
      
      // If customer_id exists, create a push notification
      if (order.customer_id) {
        const { error: notificationError } = await supabase
          .from("push_notifications")
          .insert({
            user_id: order.customer_id,
            title: "Order Ready!",
            body: `Your order for ${order.table_location || 'your table'} is ready for pickup!`,
            status: "pending"
          });
        
        if (notificationError) {
          console.error("Error creating customer notification:", notificationError);
          return { 
            success: true, 
            orderUpdated: true, 
            notificationSent: false, 
            error: "Order updated but failed to create notification" 
          };
        }
      }
      
      return { 
        success: true, 
        orderUpdated: true, 
        notificationSent: true 
      };
    }
    
    return { success: true, orderUpdated: true };
  } catch (error) {
    console.error("Error in updateOrderStatus:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

/**
 * Sends a notification to staff when a new order is placed
 */
export async function notifyStaffOfNewOrder(
  orderId: string,
  tableLocation: string,
  orderDetails: string
) {
  try {
    const supabase = await createServerClient();
    
    // Find staff users with admin or bartender roles
    const { data: staffUsers, error: staffError } = await supabase
      .from("users")
      .select("id")
      .in("role", ["admin", "bartender", "staff"])
      .eq("status", "active");
    
    if (staffError) {
      console.error("Error finding staff users:", staffError);
      return { success: false, error: "Failed to find staff users" };
    }
    
    if (!staffUsers || staffUsers.length === 0) {
      console.warn("No staff users found to notify");
      return { success: false, error: "No staff users found" };
    }
    
    // Create push notifications for each staff member
    const notifications = staffUsers.map((staff: { id: string }) => ({
      user_id: staff.id,
      title: "New Order!",
      body: `New order from ${tableLocation}: ${orderDetails}`,
      status: "pending" as const
    }));
    
    const { error: notificationError } = await supabase
      .from("push_notifications")
      .insert(notifications);
    
    if (notificationError) {
      console.error("Error creating staff notifications:", notificationError);
      return { success: false, error: "Failed to create notifications" };
    }
    
    return { success: true };
  } catch (error) {
    console.error("Error notifying staff of new order:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}
