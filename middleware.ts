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
  
  // Login route - allow access
  if (isLoginRoute) {
    // Allow direct access to login page in all cases
    // The login page itself can handle redirects if user is logged in
    return response;
  }
  
  // Protected admin routes require authentication
  if (isAdminRoute) {
    // Check if user is authenticated
    const { data } = await supabase.auth.getSession();
    
    // No session found, redirect to login
    if (!data.session) {
      const redirectUrl = new URL('/admin/login', request.url);
      return NextResponse.redirect(redirectUrl);
    }
    
    // Has session, allow access to admin routes
    return response;
  }
  
  // For non-admin routes, just proceed
  return response;
}

// Only run middleware on admin routes
export const config = {
  matcher: ['/admin/:path*'],
};
