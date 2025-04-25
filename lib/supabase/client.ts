import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables (URL or Anon Key) are missing. Check Vercel environment variables and .env.local for client-side usage.');
}

export function getSupabaseBrowserClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Cannot create Supabase browser client: URL or Anon Key is missing.');
  }
  return createBrowserClient(supabaseUrl!, supabaseAnonKey!);
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