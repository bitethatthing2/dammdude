import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Create a Supabase client configured to use cookies
  const response = NextResponse.next();
  
  // Create a Supabase client using the newer SSR package
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dzvvjgmnlcmgrsnyfqnw.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6dnZqZ21ubGNtZ3JzbnlmcW53Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk0MTU5OTQsImV4cCI6MjA1NDk5MTk5NH0.ECFbZk2XPcQ18Qf26i5AbDAjcmH4fHSrfLfv_ccaq-A',
    {
      cookies: {
        get: (name) => request.cookies.get(name)?.value,
        set: (name, value, options) => {
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove: (name, options) => {
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );
  
  // Check if the request is for an admin route
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');
  const isLoginRoute = request.nextUrl.pathname === '/admin/login';
  const isDashboardRoute = request.nextUrl.pathname === '/admin/dashboard';
  const isApiRoute = request.nextUrl.pathname.startsWith('/api/');
  
  // Check if the request is for the table route with no ID
  const isTableRoute = request.nextUrl.pathname === '/table';
  
  console.log(`Middleware: Processing ${request.nextUrl.pathname}`);

  // Skip authentication checks for API routes
  if (isApiRoute) {
    return response;
  }

  // For direct /table requests, ensure they're handled correctly
  if (isTableRoute) {
    // If this is a page navigation, let it proceed
    const accept = request.headers.get('accept');
    if (accept && accept.includes('text/html')) {
      return response;
    }
    
    // If it's an API request or resource fetch, redirect to the API endpoint
    console.log('Middleware: Redirecting /table resource request to proper endpoint');
    const url = new URL('/api/table-identification', request.url);
    return NextResponse.redirect(url);
  }

  // For login route: if already logged in, redirect to dashboard
  if (isLoginRoute) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Skip admin check for now - if they're logged in, let dashboard handle it
        console.log('Middleware: Session found on login page, redirecting to dashboard');
        const url = new URL('/admin/dashboard', request.url);
        return NextResponse.redirect(url);
      }
    } catch (error) {
      console.error('Middleware error checking login session:', error);
    }
    return response;
  }
  
  // For all other admin routes: if not logged in, redirect to login
  if (isAdminRoute && !isLoginRoute) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log('Middleware: No session found, redirecting to login');
        const url = new URL('/admin/login', request.url);
        return NextResponse.redirect(url);
      }
      
      // Let the dashboard page handle admin validation
      return response;
    } catch (error) {
      console.error('Middleware error checking admin route:', error);
      const url = new URL('/admin/login', request.url);
      return NextResponse.redirect(url);
    }
  }
  
  // For all other routes, just proceed
  return response;
}

// Update matcher to exclude API routes and include /table route
export const config = {
  matcher: [
    '/admin/:path*', 
    '/table',
    // Exclude API routes from authentication checks
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};