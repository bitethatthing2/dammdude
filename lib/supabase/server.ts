import { createServerClient as createSupabaseServerClient, type CookieOptions } from '@supabase/ssr';
import type { Database } from '../database.types';
import type { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';
import { cookies as nextCookies } from 'next/headers';

/**
 * Creates a Supabase server client with proper async cookie handling
 */
export async function createServerClient(cookieStore?: ReadonlyRequestCookies) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase URL or Anon Key');
  }
  
  // IMPORTANT: Await cookies() in Next.js 15
  const cookieJar = cookieStore || await nextCookies();
  
  // Create client with cookie handling
  return createSupabaseServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        try {
          return cookieJar.get(name)?.value;
        } catch (error) {
          console.error('Error getting cookie:', name, error);
          return undefined;
        }
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieJar.set({ name, value, ...options });
        } catch (error) {
          console.error('Error setting cookie:', name, error);
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieJar.set({ name, value: '', maxAge: 0, ...options });
        } catch (error) {
          console.error('Error removing cookie:', name, error);
        }
      }
    }
  });
}

// For backward compatibility
export const createClient = createServerClient;
