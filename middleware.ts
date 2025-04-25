import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Create a response first
  const response = NextResponse.next();
  
  try {
    // Create a Supabase client configured to use cookies
    const supabase = createMiddlewareClient({ req: request, res: response });
    
    // Check if the request is for an admin route
    const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');
    const isLoginRoute = request.nextUrl.pathname === '/admin/login';
    
    // For login route: if already logged in, redirect to dashboard
    if (isLoginRoute) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const url = new URL('/admin/dashboard', request.url);
        return NextResponse.redirect(url);
      }
      // Not logged in, continue to login page
      return response;
    }
    
    // For all other admin routes: if not logged in, redirect to login
    if (isAdminRoute && !isLoginRoute) {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        const url = new URL('/admin/login', request.url);
        return NextResponse.redirect(url);
      }
      // Logged in, continue to requested admin page
      return response;
    }
  } catch (error) {
    console.error('Middleware error:', error);
    
    // On error for admin routes (except login), redirect to login
    if (request.nextUrl.pathname.startsWith('/admin') && 
        request.nextUrl.pathname !== '/admin/login') {
      const url = new URL('/admin/login', request.url);
      return NextResponse.redirect(url);
    }
  }
  
  // For all other routes, just continue
  return response;
}

// Only run middleware on admin routes
export const config = {
  matcher: ['/admin/:path*'],
};
