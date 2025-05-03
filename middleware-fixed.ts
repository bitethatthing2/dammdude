import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { Database } from '@/lib/database.types';

/**
 * Middleware for handling authentication and route protection
 * Uses async cookie handling to avoid NextJS "cookies() should be awaited" issues
 */
export async function middleware(request: NextRequest) {
  // Create a response object
  const response = NextResponse.next();
  
  // Set up Supabase client for middleware with proper cookie handling
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dzvvjgmnlcmgrsnyfqnw.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6dnZqZ21ubGNtZ3JzbnlmcW53Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk0MTU5OTQsImV4cCI6MjA1NDk5MTk5NH0.ECFbZk2XPcQ18Qf26i5AbDAjcmH4fHSrfLfv_ccaq-A',
    {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value;
        },
        set(name, value, options) {
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name, options) {
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );
  
  // Check path types
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');
  const isLoginRoute = request.nextUrl.pathname === '/admin/login';
  const isDashboardRoute = request.nextUrl.pathname === '/admin/dashboard';
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

  // Login route handling
  if (isLoginRoute) {
    try {
      // Check if already logged in
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // If already logged in, redirect to dashboard
        console.log('Middleware: Session found on login page, redirecting to dashboard');
        const url = new URL('/admin/dashboard', request.url);
        return NextResponse.redirect(url);
      }
    } catch (error) {
      console.error('Middleware error checking login session:', error);
    }
    return response;
  }
  
  // Admin route protection
  if (isAdminRoute && !isLoginRoute) {
    try {
      // Verify session exists
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log('Middleware: No session found, redirecting to login');
        const url = new URL('/admin/login', request.url);
        return NextResponse.redirect(url);
      }
      
      // Allow access to admin routes for logged-in users
      // (Role-based checks happen at the page level)
      return response;
    } catch (error) {
      console.error('Middleware error checking admin route:', error);
      // On error, redirect to login as a fallback
      const url = new URL('/admin/login', request.url);
      return NextResponse.redirect(url);
    }
  }
  
  // Default: proceed with request
  return response;
}

// Define route matcher patterns
export const config = {
  matcher: [
    '/admin/:path*', 
    '/table',
    // Exclude API routes and static assets from middleware processing
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};