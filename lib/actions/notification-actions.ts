"use server";

import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";

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
    const supabase = createServerActionClient({ cookies });
    
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
    const supabase = createServerActionClient({ cookies });
    
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
    const supabase = createServerActionClient({ cookies });
    
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
    const supabase = createServerActionClient({ cookies });
    
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
    const supabase = createServerActionClient({ cookies });
    
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
