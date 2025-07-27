import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database.types'
import { checkAndClearCorruptedCookies } from '@/lib/utils/cookie-utils'

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

// Retry fetch with exponential backoff
async function fetchWithRetry(url: string, options: RequestInit = {}, maxRetries = 3): Promise<Response> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok && response.status >= 500 && i < maxRetries - 1) {
        throw new Error(`Server error: ${response.status}`)
      }
      
      return response
    } catch (error) {
      // Check if it's a connection error to local Supabase
      if (error instanceof Error && error.message.includes('Failed to fetch') && url.includes('127.0.0.1:54321')) {
        console.warn('Local Supabase instance not running. Please start it with: npx supabase start')
        if (i === maxRetries - 1) {
          throw new Error('Local Supabase instance not running. Please start it with: npx supabase start')
        }
      } else if (i === maxRetries - 1) {
        throw error
      }
      
      // Exponential backoff with jitter
      const delay = Math.min(1000 * Math.pow(2, i) + Math.random() * 1000, 10000)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw new Error('Max retries reached')
}

// Create a single shared instance with proper typing
let supabaseClient: ReturnType<typeof createBrowserClient<Database>> | null = null

export function createClient() {
  // Return existing instance if it exists
  if (supabaseClient) {
    return supabaseClient
  }

  // Check and clear corrupted cookies before creating client
  if (typeof window !== 'undefined') {
    try {
      checkAndClearCorruptedCookies()
    } catch (error) {
      console.warn('Error checking cookies:', error)
    }
  }

  // Use environment variables directly to avoid config layer issues
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Debug: Log configuration status in development
  if (process.env.NODE_ENV === 'development' && (!supabaseUrl || !supabaseAnonKey)) {
    console.error('Supabase Configuration Error:', {
      url: supabaseUrl ? 'OK' : 'MISSING',
      anonKey: supabaseAnonKey ? 'OK' : 'MISSING'
    })
  }

  // Validate required configuration
  if (!supabaseUrl || !supabaseAnonKey) {
    // During build time, return a dummy client to prevent errors
    if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
      console.warn('Supabase client created without credentials during build time')
      return createBrowserClient<Database>(
        'https://placeholder.supabase.co',
        'placeholder-anon-key'
      )
    }
    throw new Error(`Missing Supabase configuration: URL=${!!supabaseUrl}, AnonKey=${!!supabaseAnonKey}`)
  }

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
          flowType: 'pkce',
          storageKey: 'supabase.auth.token',
          storage: typeof window !== 'undefined' ? {
            getItem: (key: string) => {
              try {
                const value = window.localStorage.getItem(key);
                // Validate the value before returning
                if (value && (value.includes('undefined') || value.includes('null'))) {
                  window.localStorage.removeItem(key);
                  return null;
                }
                return value;
              } catch {
                return null;
              }
            },
            setItem: (key: string, value: string) => {
              try {
                window.localStorage.setItem(key, value);
              } catch (error) {
                console.error('Failed to save to localStorage:', error);
              }
            },
            removeItem: (key: string) => {
              try {
                window.localStorage.removeItem(key);
              } catch (error) {
                console.error('Failed to remove from localStorage:', error);
              }
            },
          } : undefined
        },
        realtime: {
          params: {
            eventsPerSecond: 10
          }
        },
        global: {
          headers: {
            'X-Client-Info': 'supabase-ssr-js'
          },
          fetch: (url, options = {}) => {
            return fetchWithRetry(url, options, 3)
          }
        }
      }
    )
  } catch (error) {
    console.error('Error creating Supabase client:', error)
    // Clear cookies and try again
    if (typeof window !== 'undefined') {
      checkAndClearCorruptedCookies()
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
export type { SupabaseError, PostgrestError, AuthError }