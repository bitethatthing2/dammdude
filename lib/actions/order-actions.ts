"use server";

import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/database.types';

/**
 * Updates an order status and sends notifications if needed
 */
export async function updateOrderStatus(
  orderId: string,
  newStatus: 'pending' | 'preparing' | 'ready' | 'completed'
) {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Update order status
    const { error: updateError } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId);
    
    if (updateError) {
      console.error("Error updating order status:", updateError);
      return { success: false, error: "Failed to update order status" };
    }
    
    // If order is marked as ready, send notification to customer
    if (newStatus === 'ready') {
      // Get order details including table ID
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .select("table_id")
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
      
      // Find customer devices for this table
      const { data: customerDevices, error: deviceError } = await supabase
        .from("device_registrations")
        .select("device_id")
        .eq("type", "customer")
        .eq("table_id", order.table_id);
      
      if (deviceError) {
        console.error("Error finding customer devices:", deviceError);
        return { 
          success: true, 
          orderUpdated: true, 
          notificationSent: false, 
          error: "Order updated but failed to find customer devices" 
        };
      }
      
      if (!customerDevices || customerDevices.length === 0) {
        console.warn("No customer devices registered for table:", order.table_id);
        return { 
          success: true, 
          orderUpdated: true, 
          notificationSent: false, 
          error: "Order updated but no customer devices found" 
        };
      }
      
      // Get table information
      const { data: tableData, error: tableError } = await supabase
        .from("tables")
        .select("name")
        .eq("id", order.table_id)
        .single();
      
      if (tableError) {
        console.error("Error finding table:", tableError);
        return { 
          success: true, 
          orderUpdated: true, 
          notificationSent: false, 
          error: "Order updated but failed to find table information" 
        };
      }
      
      // Create notification for each customer device
      const notifications = customerDevices.map((device: { device_id: string }) => ({
        recipient_id: device.device_id,
        message: `Your order for Table ${tableData.name} is ready for pickup!`,
        type: "order_ready" as Database["public"]["Enums"]["notification_type"],
        status: "unread"
      }));
      
      const { error: notificationError } = await supabase
        .from("notifications")
        .insert(notifications);
      
      if (notificationError) {
        console.error("Error creating customer notifications:", notificationError);
        return { 
          success: true, 
          orderUpdated: true, 
          notificationSent: false, 
          error: "Order updated but failed to create notifications" 
        };
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
  tableId: string,
  orderDetails: string
) {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Find staff devices to notify (primary device first)
    const { data: staffDevices, error: deviceError } = await supabase
      .from("device_registrations")
      .select("device_id")
      .eq("type", "staff")
      .order("is_primary", { ascending: false });
    
    if (deviceError) {
      console.error("Error finding staff devices:", deviceError);
      return { success: false, error: "Failed to find staff devices" };
    }
    
    if (!staffDevices || staffDevices.length === 0) {
      console.warn("No staff devices registered to receive notifications");
      return { success: false, error: "No staff devices registered" };
    }
    
    // Get table information
    const { data: tableData, error: tableError } = await supabase
      .from("tables")
      .select("name")
      .eq("id", tableId)
      .single();
    
    if (tableError) {
      console.error("Error finding table:", tableError);
      return { success: false, error: "Failed to find table information" };
    }
    
    // Create notification for each staff device
    const notifications = staffDevices.map((device: { device_id: string }) => ({
      recipient_id: device.device_id,
      message: `New order from Table ${tableData.name}: ${orderDetails}`,
      type: "order_new" as Database["public"]["Enums"]["notification_type"],
      status: "unread"
    }));
    
    const { error: notificationError } = await supabase
      .from("notifications")
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
