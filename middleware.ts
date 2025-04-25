import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Create a Supabase client configured to use cookies
  const response = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res: response });
  
  // Check if the request is for an admin route
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');
  const isLoginRoute = request.nextUrl.pathname === '/admin/login';
  const isDashboardRoute = request.nextUrl.pathname === '/admin/dashboard';
  
  console.log(`Middleware: Processing ${request.nextUrl.pathname}`);

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

// Only run middleware on admin routes
export const config = {
  matcher: ['/admin/:path*'],
};
