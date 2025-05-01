"use server";

import { createClient } from '@/lib/supabase/server';
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Database } from '@/lib/database.types';

// Type definitions
export type NotificationType = "info" | "warning" | "error";

// Validation schemas
const createNotificationSchema = z.object({
  userId: z.string().uuid(),
  type: z.enum(["info", "warning", "error"]).default("info"),
  body: z.string().min(1).max(5000),
  link: z.string().url().optional(),
  expiresAt: z.date().optional(),
});

const dismissNotificationSchema = z.object({
  id: z.number().int().positive(),
});

/**
 * Create a new notification for a user
 */
export async function createNotification(
  data: z.infer<typeof createNotificationSchema>
) {
  try {
    // Validate input
    const validated = createNotificationSchema.parse(data);
    
    // Get Supabase client
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    
    // Check if user exists
    const { data: userData, error: userError } = await supabase
      .from("auth.users")
      .select("id")
      .eq("id", validated.userId)
      .single();
    
    if (userError || !userData) {
      throw new Error("User not found");
    }
    
    // Insert notification
    const { data: notification, error } = await supabase
      .from("notifications")
      .insert({
        user_id: validated.userId,
        type: validated.type,
        body: validated.body,
        link: validated.link,
        expires_at: validated.expiresAt ? validated.expiresAt.toISOString() : undefined,
      })
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to create notification: ${error.message}`);
    }
    
    return { success: true, notification };
  } catch (error) {
    console.error("Error creating notification:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

/**
 * Create notifications for multiple users at once
 */
export async function createBulkNotifications(
  userIds: string[],
  data: Omit<z.infer<typeof createNotificationSchema>, "userId">
) {
  try {
    // Validate user IDs
    if (!userIds.length) {
      throw new Error("No user IDs provided");
    }
    
    // Get Supabase client
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    
    // Prepare notification records
    const notifications = userIds.map(userId => ({
      user_id: userId,
      type: data.type || "info",
      body: data.body,
      link: data.link,
      expires_at: data.expiresAt ? data.expiresAt.toISOString() : undefined,
    }));
    
    // Insert notifications
    const { data: createdNotifications, error } = await supabase
      .from("notifications")
      .insert(notifications)
      .select();
    
    if (error) {
      throw new Error(`Failed to create notifications: ${error.message}`);
    }
    
    return { success: true, count: createdNotifications.length };
  } catch (error) {
    console.error("Error creating bulk notifications:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

/**
 * Dismiss a notification
 */
export async function dismissNotification(
  data: z.infer<typeof dismissNotificationSchema>
) {
  try {
    // Validate input
    const validated = dismissNotificationSchema.parse(data);
    
    // Get Supabase client
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error("Not authenticated");
    }
    
    // Update notification
    const { error } = await supabase
      .from("notifications")
      .update({ dismissed: true })
      .eq("id", validated.id)
      .eq("user_id", user.id);
    
    if (error) {
      throw new Error(`Failed to dismiss notification: ${error.message}`);
    }
    
    // Revalidate paths that might show notifications
    revalidatePath("/");
    
    return { success: true };
  } catch (error) {
    console.error("Error dismissing notification:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

/**
 * Dismiss all notifications for the current user
 */
export async function dismissAllNotifications() {
  try {
    // Get Supabase client
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error("Not authenticated");
    }
    
    // Update notifications
    const { error } = await supabase
      .from("notifications")
      .update({ dismissed: true })
      .eq("user_id", user.id)
      .eq("dismissed", false);
    
    if (error) {
      throw new Error(`Failed to dismiss notifications: ${error.message}`);
    }
    
    // Revalidate paths that might show notifications
    revalidatePath("/");
    
    return { success: true };
  } catch (error) {
    console.error("Error dismissing all notifications:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

/**
 * Clean up expired notifications
 * This should be called by a scheduled task
 */
export async function cleanupExpiredNotifications() {
  try {
    // Get Supabase client with service role
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    
    // Delete expired notifications
    const { data, error } = await supabase
      .from("notifications")
      .delete()
      .lt("expires_at", new Date().toISOString())
      .select("id");
    
    if (error) {
      throw new Error(`Failed to clean up notifications: ${error.message}`);
    }
    
    return { 
      success: true, 
      count: data?.length || 0 
    };
  } catch (error) {
    console.error("Error cleaning up notifications:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

/**
 * Send order notification to staff when a customer places an order
 */
export async function sendOrderNotificationToStaff(
  orderId: string,
  tableId: string,
  orderDetails: string
) {
  try {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    
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
    console.error("Error sending order notification to staff:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

/**
 * Send order ready notification to customer
 */
export async function sendOrderReadyNotification(
  orderId: string,
  tableId: string
) {
  try {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    
    // Find customer devices for this table
    const { data: customerDevices, error: deviceError } = await supabase
      .from("device_registrations")
      .select("device_id")
      .eq("type", "customer")
      .eq("table_id", tableId);
    
    if (deviceError) {
      console.error("Error finding customer devices:", deviceError);
      return { success: false, error: "Failed to find customer devices" };
    }
    
    if (!customerDevices || customerDevices.length === 0) {
      console.warn("No customer devices registered for table:", tableId);
      return { success: false, error: "No customer devices registered for this table" };
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
      return { success: false, error: "Failed to create notifications" };
    }
    
    // Update order status to ready
    const { error: orderError } = await supabase
      .from("orders")
      .update({ status: "ready" })
      .eq("id", orderId);
    
    if (orderError) {
      console.error("Error updating order status:", orderError);
      return { success: false, error: "Failed to update order status" };
    }
    
    return { success: true };
  } catch (error) {
    console.error("Error sending order ready notification:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string) {
  try {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    
    const { error } = await supabase
      .from("notifications")
      .update({ status: "read" })
      .eq("id", notificationId);
    
    if (error) {
      console.error("Error marking notification as read:", error);
      return { success: false, error: "Failed to mark notification as read" };
    }
    
    return { success: true };
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}
