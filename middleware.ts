import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Create a Supabase client configured to use cookies
  const supabase = createMiddlewareClient({ req: request, res: NextResponse.next() });
  
  // Refresh session if expired - required for Server Components
  const { data: { session } } = await supabase.auth.getSession();
  
  // Check if the request is for an admin route
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');
  const isLoginRoute = request.nextUrl.pathname === '/admin/login';
  
  // Allow access to login page
  if (isLoginRoute) {
    // If already logged in, redirect to dashboard
    if (session) {
      const url = new URL('/admin/dashboard', request.url);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }
  
  // Protect admin routes
  if (isAdminRoute) {
    // If no session, redirect to login
    if (!session) {
      const url = new URL('/admin/login', request.url);
      return NextResponse.redirect(url);
    }
    
    // Check if the user is an admin (you can add this check if needed)
    // This would require an additional database query
    
    // Allow access to admin routes for authenticated users
    return NextResponse.next();
  }
  
  // For all other routes, just proceed
  return NextResponse.next();
}

// Only run middleware on admin routes
export const config = {
  matcher: ['/admin/:path*'],
};
