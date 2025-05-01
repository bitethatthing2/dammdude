import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '../database.types';

// Fallback values (consider removing or adjusting logging if ENV vars are reliably set)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dzvvjgmnlcmgrsnyfqnw.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6dnZqZ21ubGNtZ3JzbnlmcW53Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk0MTU5OTQsImV4cCI6MjA1NDk5MTk5NH0.ECFbZk2XPcQ18Qf26i5AbDAjcmH4fHSrfLfv_ccaq-A';

// Keep the warning for debugging purposes (optional)
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.warn('Supabase environment variables (URL or Anon Key) are missing. Check Vercel environment variables and .env.local for client-side usage. Using fallback values.');
}

// Use a singleton pattern to avoid creating multiple clients
let clientInstance: ReturnType<typeof createBrowserClient<Database>> | undefined;

export function getSupabaseBrowserClient() {
  // Guard against SSR execution
  if (typeof window === 'undefined') {
    console.warn('getSupabaseBrowserClient was called during server rendering, which should be avoided');
    // Return a minimal mock client for SSR that won't make actual requests
    return {
      auth: {
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      },
      // Add additional stubs as needed
    } as any;
  }

  if (!clientInstance) {
    try {
      // Use the Database type generic
      clientInstance = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
    } catch (err) {
      console.error('Failed to create Supabase browser client:', err);
      // Return a minimal mock client if creation fails
      return {
        auth: {
          getUser: () => Promise.resolve({ data: { user: null }, error: null }),
          getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        },
        // Add additional stubs as needed
      } as any;
    }
  }
  return clientInstance;
}

// Define the Supabase client type using the Database generic
type SupabaseClient = ReturnType<typeof createBrowserClient<Database>>;

// Export a createClient function for backward compatibility
export const createClient = getSupabaseBrowserClient;

// Utility for safer queries with proper error handling
export async function safeSupabaseQuery<T>(
  supabase: SupabaseClient,
  queryFn: (client: SupabaseClient) => Promise<{ data: T | null; error: any }>
): Promise<{ data: T | null; error: any }> {
  try {
    return await queryFn(supabase);
  } catch (error: unknown) {
    console.error('Supabase query error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return { 
      data: null, 
      error: { message: 'Failed to fetch data', details: errorMessage } 
    };
  }
}