// Supabase related helper functions

// Firebase service account interface
interface FirebaseServiceAccount {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
}

export function getSupabaseServiceRoleKey(): string | undefined {
  try {
    // Get the service role key from environment variables
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!serviceRoleKey) {
      console.error("SUPABASE_SERVICE_ROLE_KEY environment variable is not set");
    }
    
    return serviceRoleKey;
  } catch (error) {
    console.error("Error retrieving Supabase service role key:", error);
    return undefined;
  }
}

// Helper function to get Firebase service account
export function getFirebaseServiceAccount(): FirebaseServiceAccount | undefined {
  try {
    // Try to get the service account from environment variable
    const serviceAccountJson = Deno.env.get("FIREBASE_SERVICE_ACCOUNT");
    
    if (serviceAccountJson) {
      return JSON.parse(serviceAccountJson) as FirebaseServiceAccount;
    }
    
    console.error("FIREBASE_SERVICE_ACCOUNT environment variable is not set");
    return undefined;
  } catch (error) {
    console.error("Error retrieving Firebase service account:", error);
    return undefined;
  }
}
