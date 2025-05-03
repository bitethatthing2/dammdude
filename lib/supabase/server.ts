import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { Database } from '../database.types';
import type { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';
import { cookies as nextCookies } from 'next/headers';

/**
 * Creates a Supabase server client with proper async cookie handling
 */
export async function createSupabaseServerClient(cookieStore?: ReadonlyRequestCookies) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase URL or Anon Key');
  }
  
  // Use provided cookieStore or get a fresh one
  const cookieJar = cookieStore || nextCookies();
  
  // Create client with fully async cookie handling
  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      async get(name: string) {
        try {
          // Use await to ensure all cookie operations are async
          return (await cookieJar.get(name))?.value;
        } catch (error) {
          console.error('Error getting cookie:', name, error);
          return undefined;
        }
      },
      async set(name: string, value: string, options: CookieOptions) {
        try {
          // Use await to ensure all cookie operations are async
          await cookieJar.set({ name, value, ...options });
        } catch (error) {
          console.error('Error setting cookie:', name, error);
        }
      },
      async remove(name: string, options: CookieOptions) {
        try {
          // Use await to ensure all cookie operations are async
          await cookieJar.set({ name, value: '', maxAge: 0, ...options });
        } catch (error) {
          console.error('Error removing cookie:', name, error);
        }
      }
    }
  });
}

// For backward compatibility
export const createClient = createSupabaseServerClient;