// Firebase Cloud Messaging (FCM) implementation for Supabase Edge Functions
import { getFirebaseServiceAccount } from "./supabase.ts";

// Define proper types for FCM
interface FCMNotification {
  title: string;
  body: string;
  imageUrl?: string;
}

interface FCMMessage {
  token?: string;
  topic?: string;
  notification: FCMNotification;
  data?: Record<string, string>;
}

// Define a type for the Supabase client
interface SupabaseClient {
  from: (table: string) => {
    delete: () => {
      eq: (column: string, value: string) => Promise<{ error: Error | null }>;
    };
  };
}

// Send notification to a specific device token using HTTP API
export async function sendPushNotification(
  token: string, 
  title: string, 
  body: string, 
  data: Record<string, string> = {}
): Promise<{ success: boolean; messageId?: string; error?: string; isInvalidToken?: boolean }> {
  try {
    const serviceAccount = getFirebaseServiceAccount();
    
    if (!serviceAccount) {
      throw new Error("Firebase service account not available");
    }
    
    // Prepare the FCM message
    const message: FCMMessage = {
      token,
      notification: {
        title,
        body
      },
      data
    };
    
    // Get access token for Firebase API
    const accessToken = await getFirebaseAccessToken(serviceAccount.client_email, serviceAccount.private_key);
    
    // Send the message using Firebase HTTP v1 API
    const response = await fetch(
      `https://fcm.googleapis.com/v1/projects/${serviceAccount.project_id}/messages:send`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ message })
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      
      // Check if token is invalid (not registered)
      const errorMessage = JSON.stringify(errorData);
      if (
        errorMessage.includes("registration-token-not-registered") || 
        errorMessage.includes("Requested entity was not found")
      ) {
        console.log(`FCM token invalid, should be removed: ${token}`);
        return { 
          success: false, 
          error: "Token not registered", 
          isInvalidToken: true 
        };
      }
      
      throw new Error(`FCM API error: ${errorMessage}`);
    }
    
    const result = await response.json();
    console.log("FCM notification sent successfully:", result);
    
    return { 
      success: true, 
      messageId: result.name 
    };
  } catch (error) {
    console.error("Error sending FCM notification:", error);
    
    // Check if error indicates invalid token
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (
      errorMessage.includes("registration-token-not-registered") || 
      errorMessage.includes("Requested entity was not found")
    ) {
      return { 
        success: false, 
        error: errorMessage, 
        isInvalidToken: true 
      };
    }
    
    return { 
      success: false, 
      error: errorMessage
    };
  }
}

// Send notification to a topic
export async function sendTopicNotification(
  topic: string,
  title: string,
  body: string,
  data: Record<string, string> = {}
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const serviceAccount = getFirebaseServiceAccount();
    
    if (!serviceAccount) {
      throw new Error("Firebase service account not available");
    }
    
    // Prepare the FCM message
    const message: FCMMessage = {
      topic,
      notification: {
        title,
        body
      },
      data
    };
    
    // Get access token for Firebase API
    const accessToken = await getFirebaseAccessToken(serviceAccount.client_email, serviceAccount.private_key);
    
    // Send the message using Firebase HTTP v1 API
    const response = await fetch(
      `https://fcm.googleapis.com/v1/projects/${serviceAccount.project_id}/messages:send`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ message })
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`FCM API error: ${JSON.stringify(errorData)}`);
    }
    
    const result = await response.json();
    console.log("FCM topic notification sent successfully:", result);
    
    return { 
      success: true, 
      messageId: result.name 
    };
  } catch (error) {
    console.error("Error sending FCM topic notification:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
}

// Helper function to remove invalid tokens from the database
export async function removeInvalidToken(token: string, supabaseClient: SupabaseClient): Promise<boolean> {
  try {
    console.log(`Removing invalid FCM token from database: ${token.substring(0, 10)}...`);
    
    // Remove from fcm_tokens table
    const { error: tokenError } = await supabaseClient
      .from('fcm_tokens')
      .delete()
      .eq('token', token);
      
    if (tokenError) {
      console.error(`Error removing token from fcm_tokens: ${tokenError.message}`);
      return false;
    }
    
    // Remove from topic_subscriptions table
    const { error: subscriptionError } = await supabaseClient
      .from('topic_subscriptions')
      .delete()
      .eq('token', token);
      
    if (subscriptionError) {
      console.error(`Error removing token from topic_subscriptions: ${subscriptionError.message}`);
      return false;
    }
    
    console.log(`Successfully removed invalid token: ${token.substring(0, 10)}...`);
    return true;
  } catch (error) {
    console.error(`Error removing invalid token: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

// Helper to get Firebase access token
async function getFirebaseAccessToken(clientEmail: string, privateKey: string): Promise<string> {
  try {
    // Use JWT to get access token
    const now = Math.floor(Date.now() / 1000);
    const expiry = now + 3600; // 1 hour
    
    const jwtHeader = btoa(JSON.stringify({ alg: "RS256", typ: "JWT" }));
    const jwtClaimSet = btoa(JSON.stringify({
      iss: clientEmail,
      sub: clientEmail,
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: expiry,
      scope: "https://www.googleapis.com/auth/firebase.messaging"
    }));
    
    // Create JWT signature using private key
    const textEncoder = new TextEncoder();
    const importedKey = await crypto.subtle.importKey(
      "pkcs8",
      str2ab(privateKey),
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["sign"]
    );
    
    const signature = await crypto.subtle.sign(
      { name: "RSASSA-PKCS1-v1_5" },
      importedKey,
      textEncoder.encode(`${jwtHeader}.${jwtClaimSet}`)
    );
    
    const jwt = `${jwtHeader}.${jwtClaimSet}.${btoa(String.fromCharCode(...new Uint8Array(signature)))}`;
    
    // Exchange JWT for access token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: jwt
      })
    });
    
    if (!tokenResponse.ok) {
      throw new Error(`Failed to get access token: ${await tokenResponse.text()}`);
    }
    
    const tokenData = await tokenResponse.json();
    return tokenData.access_token;
  } catch (error) {
    console.error("Error getting Firebase access token:", error);
    throw error;
  }
}

// Helper to convert string to ArrayBuffer
function str2ab(str: string): ArrayBuffer {
  const buf = new ArrayBuffer(str.length);
  const bufView = new Uint8Array(buf);
  for (let i = 0; i < str.length; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}
