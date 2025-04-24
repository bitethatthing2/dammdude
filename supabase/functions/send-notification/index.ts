/// <reference path="./deno.d.ts" />

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.48.1"; // Pinned version
import { corsHeaders } from "../_shared/cors.ts";
import { sendPushNotification, sendTopicNotification } from "../_shared/fcm.ts";
import { getSupabaseServiceRoleKey } from "../_shared/supabase.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"; // Import serve

// Define the expected structure of the incoming request body
interface NotificationRequest {
  title: string; // Required
  body: string; // Required
  data?: Record<string, unknown>; // Optional custom data
  token?: string; // Optional specific token to target
  topic?: string; // Optional topic to target
  orderId?: string; // Optional order ID to link
  link?: string; // Optional URL to open when notification is clicked
  linkButtonText?: string; // Optional text for link action button
  image?: string; // Optional image URL
  actionButton?: string; // Optional action button key
  actionButtonText?: string; // Optional text for action button
  icon?: string; // Optional icon URL
  badge?: string; // Optional badge URL
  // Platform-specific options
  androidConfig?: {
    channelId?: string;
    priority?: string;
    ttl?: number;
    [key: string]: unknown;
  };
  iosConfig?: {
    sound?: string;
    badge?: number;
    [key: string]: unknown;
  };
  webConfig?: {
    [key: string]: unknown;
  };
}

// Define the structure for tokens fetched from the database
interface FcmToken {
  token: string;
  device_info?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

// Define the response structure
interface NotificationResponse {
  success: boolean;
  message: string;
  recipients?: number;
  messageIds?: string[];
  errors?: Array<{
    token?: string;
    topic?: string;
    error: string;
  }>;
}

console.log("send-notification function started");

async function handleRequest(req: Request): Promise<Response> {
  console.log("Handling request:", req.method, req.url);

  if (req.method === "OPTIONS") {
    console.log("Handling OPTIONS request");
    return new Response("ok", { headers: corsHeaders });
  }

  // --- Authentication and Supabase Client Setup ---
  const serviceRoleKey = getSupabaseServiceRoleKey();
  if (!serviceRoleKey) {
    console.error("Service Role Key is missing.");
    return new Response(JSON.stringify({ error: "Missing Supabase key" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseAdmin: SupabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "http://localhost:54321",
    serviceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  );
  console.log("Supabase admin client initialized.");

  // --- Request Body Parsing and Validation ---
  let requestData: NotificationRequest;
  try {
    // Ensure content type is JSON before parsing
    if (!req.headers.get("content-type")?.includes("application/json")) {
      throw new Error("Invalid content type, expected application/json");
    }
    requestData = await req.json();
    console.log("Request data parsed:", requestData);

    // Basic validation for required fields
    if (!requestData.title || !requestData.body) {
      throw new Error("Missing required fields: title and body");
    }
  } catch (error: unknown) {
    console.error("Error parsing or validating request JSON:", error);
    const errorMessage = error instanceof Error ? error.message : "Invalid JSON payload";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { 
    title, 
    body, 
    data: customData, 
    token: specificToken, 
    topic, 
    orderId, 
    link,
    linkButtonText,
    icon,
    image,
    badge,
    actionButton,
    actionButtonText,
    androidConfig,
    iosConfig,
    webConfig
  } = requestData;

  // Prepare notification options
  const notificationOptions = {
    icon,
    badge,
    image,
    link: link || (orderId ? `/orders/${orderId}` : undefined),
    linkButtonText: linkButtonText,
    actionButton,
    actionButtonText
  };

  // Add order ID to data if provided
  const notificationData = {
    ...customData,
    ...(orderId && { orderId }),
    ...(link && { link }),
    ...(image && { image }),
    ...(linkButtonText && { linkButtonText }),
    ...(actionButton && { actionButton }),
    ...(actionButtonText && { actionButtonText })
  };

  // Platform-specific configurations
  const platformConfig = {
    android: androidConfig || {},
    ios: iosConfig || {},
    web: webConfig || {}
  };

  try {
    // --- Notification Sending Logic ---
    const response: NotificationResponse = {
      success: false,
      message: "",
      errors: []
    };

    // Case 1: Send to a specific topic
    if (topic) {
      console.log(`Sending notification to topic: ${topic}`);
      const result = await sendTopicNotification(
        topic, 
        title, 
        body, 
        notificationData, 
        notificationOptions,
        platformConfig
      );

      if (result.success) {
        response.success = true;
        response.message = `Notification sent to topic: ${topic}`;
        response.messageIds = [result.messageId!];
        response.recipients = 1; // Topic counts as one recipient for tracking
      } else {
        response.success = false;
        response.message = `Failed to send to topic: ${topic}`;
        response.errors!.push({
          topic,
          error: result.error || "Unknown error"
        });
      }

      // Log the notification attempt in the database
      await logNotificationAttempt(
        supabaseAdmin,
        title,
        body,
        { topic, success: result.success, messageId: result.messageId }
      );

      return new Response(JSON.stringify(response), {
        status: response.success ? 200 : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Case 2: Send to a specific token
    if (specificToken) {
      console.log(`Sending notification to specific token: ${specificToken}`);
      const result = await sendPushNotification(
        specificToken, 
        title, 
        body, 
        notificationData, 
        notificationOptions,
        platformConfig
      );

      if (result.success) {
        response.success = true;
        response.message = "Notification sent to specified token";
        response.messageIds = [result.messageId!];
        response.recipients = 1;
      } else {
        response.success = false;
        response.message = "Failed to send to specified token";
        response.errors!.push({
          token: specificToken,
          error: result.error || "Unknown error"
        });
      }

      // Log the notification attempt in the database
      await logNotificationAttempt(
        supabaseAdmin,
        title,
        body,
        { token: specificToken, success: result.success, messageId: result.messageId }
      );

      return new Response(JSON.stringify(response), {
        status: response.success ? 200 : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Case 3: Send to all active tokens
    console.log("Fetching active FCM tokens from Supabase...");
    const { data: tokensData, error: tokensError } = await supabaseAdmin
      .from("fcm_tokens")
      .select("token");

    if (tokensError) {
      console.error("Error fetching FCM tokens:", tokensError);
      throw new Error("Failed to fetch tokens");
    }

    if (!tokensData || tokensData.length === 0) {
      console.log("No active FCM tokens found.");
      return new Response(
        JSON.stringify({ 
          success: false,
          message: "No active tokens to send notifications to" 
        }),
        {
          status: 200, // Success, but nothing to do
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const activeTokens: FcmToken[] = tokensData;
    console.log(`Found ${activeTokens.length} active tokens.`);

    // --- Send Notifications Concurrently ---
    const notificationResults = await Promise.allSettled(
      activeTokens.map(async ({ token }) => {
        console.log(`Attempting to send notification to token: ${token}`);
        const result = await sendPushNotification(
          token, 
          title, 
          body, 
          notificationData, 
          notificationOptions,
          platformConfig
        );
        return { token, result };
      })
    );

    // Process results
    const successfulTokens: string[] = [];
    const failedTokens: Array<{ token: string; error: string }> = [];
    const messageIds: string[] = [];

    notificationResults.forEach((promiseResult) => {
      if (promiseResult.status === "fulfilled") {
        const { token, result } = promiseResult.value;
        if (result.success && result.messageId) {
          successfulTokens.push(token);
          messageIds.push(result.messageId);
        } else {
          failedTokens.push({ 
            token, 
            error: result.error || "Unknown error" 
          });
        }
      } else {
        console.error("Promise rejection in notification batch:", promiseResult.reason);
      }
    });

    // Log the batch notification in the database
    await logNotificationAttempt(
      supabaseAdmin,
      title,
      body,
      { 
        batchSize: activeTokens.length,
        successCount: successfulTokens.length,
        failureCount: failedTokens.length
      }
    );

    // Update response object
    response.success = successfulTokens.length > 0;
    response.message = `Notifications sent to ${successfulTokens.length}/${activeTokens.length} tokens`;
    response.recipients = successfulTokens.length;
    response.messageIds = messageIds;
    response.errors = failedTokens.map(({ token, error }) => ({ token, error }));

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error: unknown) {
    // --- Global Error Handling ---
    console.error("Unhandled error during notification processing:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}

/**
 * Logs notification attempts to the database for analytics
 */
async function logNotificationAttempt(
  supabase: SupabaseClient,
  title: string,
  body: string,
  details: Record<string, unknown>
): Promise<void> {
  try {
    const { error } = await supabase
      .from("sent_notifications")
      .insert({
        title,
        body,
        metadata: details,
        created_at: new Date().toISOString()
      });
    
    if (error) {
      console.error("Error logging notification:", error);
    }
  } catch (err) {
    console.error("Failed to log notification:", err);
    // Non-blocking - we don't want to fail the notification if logging fails
  }
}

// --- Main Entry Point using Deno.serve ---
console.log("Send Notification function initializing...");

serve(async (req: Request) => {
  console.log(`Handling request: ${req.method} ${req.url}`);
  try {
    return await handleRequest(req);
  } catch (error) {
    console.error("Critical error in serve handler:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

console.log("Send Notification function started.");