import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/lib/database.types'

// Create a single shared instance
let supabaseClient: ReturnType<typeof createBrowserClient<Database>> | null = null

export function createClient() {
  // Return existing instance if it exists
  if (supabaseClient) {
    return supabaseClient
  }

  // Create new instance only if one doesn't exist
  supabaseClient = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      // Remove global Content-Type header to allow file uploads
      global: {
        headers: {
          'Accept': 'application/json',
          'Accept-Profile': 'public'
        }
      },
      // Improve connection handling
      realtime: {
        params: {
          eventsPerSecond: 2
        }
      }
    }
  )

  return supabaseClient
}

// Export the shared instance directly
export const supabase = createClient()

// For backward compatibility
export const getSupabaseBrowserClient = createClient