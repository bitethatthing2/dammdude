import { createBrowserClient } from '@supabase/ssr';

// Add fallback values to ensure the client works
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dzvvjgmnlcmgrsnyfqnw.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6dnZqZ21ubGNtZ3JzbnlmcW53Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk0MTU5OTQsImV4cCI6MjA1NDk5MTk5NH0.ECFbZk2XPcQ18Qf26i5AbDAjcmH4fHSrfLfv_ccaq-A';

// Keep the warning for debugging purposes
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.warn('Supabase environment variables (URL or Anon Key) are missing. Check Vercel environment variables and .env.local for client-side usage. Using fallback values.');
}

export function getSupabaseBrowserClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

// Define the return type of getSupabaseBrowserClient for type safety
type SupabaseClient = ReturnType<typeof createBrowserClient>;

export const safeSupabaseQuery = async <T>(
  client: SupabaseClient,
  queryFn: (client: SupabaseClient) => Promise<{ data: T | null; error: any }>
): Promise<{ data: T | null; error: any }> => {
  try {
    return await queryFn(client);
  } catch (error) {
    console.error('Supabase query error:', error);
    return { data: null, error: { message: 'Failed to fetch data', details: error } };
  }
};