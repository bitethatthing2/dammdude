// lib/supabase/middleware.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Environment variable getter with fallback
function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 
    process.env.SUPABASE_URL || // Try without NEXT_PUBLIC prefix
    'https://tvnpgbjypnezoasbhbwx.supabase.co' // Your project URL as fallback
    
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
    process.env.SUPABASE_ANON_KEY || // Try without NEXT_PUBLIC prefix
    ''
    
  if (!url || !anonKey) {
    console.error('Supabase environment variables not found. Checking:', {
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_URL: !!process.env.SUPABASE_URL,
      SUPABASE_ANON_KEY: !!process.env.SUPABASE_ANON_KEY,
    })
  }
  
  return { url, anonKey }
}

export function createSupabaseMiddlewareClient(
  request: NextRequest,
  response: NextResponse
) {
  const { url, anonKey } = getSupabaseEnv()
  
  if (!url || !anonKey) {
    throw new Error(
      'Missing Supabase configuration. Please ensure environment variables are set correctly.'
    )
  }
  
  return createServerClient(url, anonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        response.cookies.set({
          name,
          value,
          ...options,
        })
      },
      remove(name: string, options: CookieOptions) {
        response.cookies.set({
          name,
          value: '',
          ...options,
        })
      },
    },
  })
}

// Main middleware function
export async function middleware(request: NextRequest) {
  try {
    // Create a response object to pass to Supabase
    const response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    })

    // Get Supabase environment variables
    const { url, anonKey } = getSupabaseEnv()
    
    // If missing credentials, continue without authentication
    if (!url || !anonKey) {
      console.warn('Supabase credentials missing, continuing without auth middleware')
      return response
    }

    // Create Supabase client
    const supabase = createSupabaseMiddlewareClient(request, response)

    // Refresh session if expired - required for Server Components
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Optional: Add user info to response headers for debugging
    if (user) {
      response.headers.set('x-user-id', user.id)
    }

    return response
  } catch (error) {
    console.error('Middleware error:', error)
    // Continue without authentication on error
    return NextResponse.next()
  }
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}