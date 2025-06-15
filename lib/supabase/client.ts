// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr';

export { createBrowserClient };


import type { Database } from '../database.types';

// Always use production
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tvnpgbjypnezoasbhbwx.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2bnBnYmp5cG5lem9hc2JoYnd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzOTM0MDMsImV4cCI6MjA2Mzk2OTQwM30.5u3YkO5BvdJ3eabOzNhEuKDF2IvugTFE_EAvB-V7Y9c';

// Log which environment we're using
if (typeof window !== 'undefined') {
  console.log(`🚀 Supabase Client: Using PRODUCTION environment`);
  console.log(`📍 URL: ${supabaseUrl}`);
}

// Define the Supabase client type using the Database generic
type SupabaseClient = ReturnType<typeof createBrowserClient<Database>>;

// Use a singleton pattern to avoid creating multiple clients
let clientInstance: SupabaseClient | undefined;

export function getSupabaseBrowserClient(): SupabaseClient {
  // Guard against SSR execution
  if (typeof window === 'undefined') {
    console.warn('getSupabaseBrowserClient was called during server rendering, which should be avoided');
    // Return a minimal mock client for SSR that won't make actual requests
    return {
      auth: {
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      },
      from: () => ({
        select: () => Promise.resolve({ data: null, error: null }),
        insert: () => Promise.resolve({ data: null, error: null }),
        update: () => Promise.resolve({ data: null, error: null }),
        delete: () => Promise.resolve({ data: null, error: null }),
      }),
    } as unknown as SupabaseClient;
  }

  if (!clientInstance) {
    try {
      clientInstance = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
    } catch (err) {
      console.error('Failed to create Supabase browser client:', err);
      throw err;
    }
  }
  return clientInstance;
}

// Export a createClient function for backward compatibility
export const createClient = getSupabaseBrowserClient;

// Define error type
interface QueryError {
  message: string;
  details?: string;
}

// Utility for safer queries with proper error handling
export async function safeSupabaseQuery<T>(
  supabase: SupabaseClient,
  queryFn: (client: SupabaseClient) => Promise<{ data: T | null; error: QueryError | null }>
): Promise<{ data: T | null; error: QueryError | null }> {
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