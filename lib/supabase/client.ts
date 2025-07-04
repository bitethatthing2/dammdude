import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/lib/database.types'
import { checkAndClearCorruptedCookies } from '@/lib/utils/cookie-utils'
import { checkAndCleanCorruptedCookies } from '@/utils/cookieCleanup'

// Define proper error types
interface SupabaseError {
  message: string
  status?: number
  code?: string
  details?: string
  hint?: string
}

interface PostgrestError {
  message: string
  details: string
  hint: string
  code: string
}

interface AuthError {
  message: string
  status?: number
  code?: string
  name: string
}

// Type guard to check if error is a Supabase/Postgrest error
function isSupabaseError(error: unknown): error is SupabaseError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as SupabaseError).message === 'string'
  )
}

// Type guard for auth errors
function isAuthError(error: unknown): error is AuthError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    'message' in error
  )
}

// Create a single shared instance
let supabaseClient: ReturnType<typeof createBrowserClient<Database>> | null = null

export function createClient() {
  // Return existing instance if it exists
  if (supabaseClient) {
    return supabaseClient
  }

  // Check and clear corrupted cookies before creating client
  if (typeof window !== 'undefined') {
    try {
      // Use both cleanup methods for maximum effectiveness
      checkAndClearCorruptedCookies()
      checkAndCleanCorruptedCookies()
    } catch (error) {
      console.warn('Error checking cookies:', error)
    }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  // Create new instance with better error handling
  try {
    supabaseClient = createBrowserClient<Database>(
      supabaseUrl,
      supabaseAnonKey,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          flowType: 'pkce'
        },
        global: {
          headers: {
            'X-Client-Info': 'supabase-ssr-js'
          }
        }
      }
    )
  } catch (error) {
    console.error('Error creating Supabase client:', error)
    // Clear cookies and try again
    if (typeof window !== 'undefined') {
      checkAndClearCorruptedCookies()
      checkAndCleanCorruptedCookies()
    }
    
    // Retry with minimal config
    supabaseClient = createBrowserClient<Database>(
      supabaseUrl,
      supabaseAnonKey
    )
  }

  return supabaseClient
}

// Export the shared instance directly
export const supabase = createClient()

// For backward compatibility
export const getSupabaseBrowserClient = createClient

// Utility function to handle Supabase errors with proper typing
export function handleSupabaseError(error: unknown): {
  message: string
  status?: number
  code?: string
} {
  // Handle null/undefined
  if (!error) {
    return {
      message: 'An unknown error occurred',
      status: 500,
      code: 'UNKNOWN_ERROR',
    }
  }

  // Handle Error instances
  if (error instanceof Error) {
    // Check for specific error types
    if (error.message.includes('JWT')) {
      return {
        message: 'Authentication expired. Please sign in again.',
        status: 401,
        code: 'AUTH_EXPIRED',
      }
    }
    
    if (error.message.includes('fetch')) {
      return {
        message: 'Network error. Please check your connection.',
        status: 0,
        code: 'NETWORK_ERROR',
      }
    }

    return {
      message: error.message,
      status: 500,
      code: 'ERROR',
    }
  }

  // Handle Supabase/Postgrest errors
  if (isSupabaseError(error)) {
    // Rate limiting
    if (error.status === 429) {
      return {
        message: 'Too many requests. Please try again later.',
        status: 429,
        code: 'RATE_LIMITED',
      }
    }

    return {
      message: error.message,
      status: error.status || 500,
      code: error.code || 'SUPABASE_ERROR',
    }
  }

  // Handle auth errors
  if (isAuthError(error)) {
    return {
      message: error.message,
      status: error.status || 401,
      code: error.code || 'AUTH_ERROR',
    }
  }

  // Handle string errors
  if (typeof error === 'string') {
    return {
      message: error,
      status: 500,
      code: 'STRING_ERROR',
    }
  }

  // Default fallback
  return {
    message: 'An unexpected error occurred',
    status: 500,
    code: 'UNKNOWN_ERROR',
  }
}

// Export types
export type { Database } from '@/lib/database.types'
export type { SupabaseError, PostgrestError, AuthError }