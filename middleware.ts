import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Refresh session if expired - this is the key fix for AuthSessionMissingError
  await supabase.auth.getUser()
  
  return response
}

/**
 * Middleware for handling authentication and route protection
 */
export async function middleware(request: NextRequest) {
  // First, update the session
  const response = await updateSession(request)
  
  // Create a new Supabase client for auth checks
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
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
    }
  )
  
  // Check path types
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');
  const isLoginRoute = request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/admin/login';
  const isApiRoute = request.nextUrl.pathname.startsWith('/api/');
  const isTableRoute = request.nextUrl.pathname === '/table';
  
  // Log processing for debugging
  console.log(`Middleware: Processing ${request.nextUrl.pathname}`);

  // Skip authentication checks for API routes
  if (isApiRoute) {
    return response;
  }

  // Handle table route requests
  if (isTableRoute) {
    // For HTML requests (browser navigation), let it proceed
    const accept = request.headers.get('accept');
    if (accept && accept.includes('text/html')) {
      return response;
    }
    
    // For API/resource requests, redirect to proper endpoint
    console.log('Middleware: Redirecting /table resource request to proper endpoint');
    const url = new URL('/api/table-identification', request.url);
    return NextResponse.redirect(url);
  }

  // Login route handling - always allow access to login page
  if (isLoginRoute) {
    // Don't do any auth checks for login page to avoid redirect loops
    console.log('Middleware: Allowing access to login page');
    return response;
  }
  
  // Admin route protection
  if (isAdminRoute && !isLoginRoute) {
    try {
      // Verify user exists - use getUser() instead of getSession()
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      // If there's an error or no user, redirect to login
      if (userError || !user || !user.email) {
        console.log('Middleware: No valid user found for admin route, redirecting to login. Error:', userError?.message);
        // Clear any stale auth cookies
        const loginUrl = new URL('/login', request.url);
        const loginResponse = NextResponse.redirect(loginUrl);
        loginResponse.cookies.delete('sb-tvnpgbjypnezoasbhbwx-auth-token');
        loginResponse.cookies.delete('sb-tvnpgbjypnezoasbhbwx-auth-token.0');
        loginResponse.cookies.delete('sb-tvnpgbjypnezoasbhbwx-auth-token.1');
        return loginResponse;
      }
      
      // Allow access to admin routes for logged-in users
      console.log('Middleware: Valid user found, allowing access to admin route');
      return response;
    } catch (error) {
      console.error('Middleware error checking admin route:', error);
      // On error, redirect to login as a fallback and clear cookies
      const loginUrl = new URL('/login', request.url);
      const loginResponse = NextResponse.redirect(loginUrl);
      loginResponse.cookies.delete('sb-tvnpgbjypnezoasbhbwx-auth-token');
      loginResponse.cookies.delete('sb-tvnpgbjypnezoasbhbwx-auth-token.0');
      loginResponse.cookies.delete('sb-tvnpgbjypnezoasbhbwx-auth-token.1');
      return loginResponse;
    }
  }
  
  // Default: proceed with request
  return response;
}

// Define route matcher patterns
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
