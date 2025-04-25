import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Create a response first
  const response = NextResponse.next();
  
  // Skip middleware for login page - let it handle auth itself
  if (request.nextUrl.pathname === '/admin/login') {
    return response;
  }
  
  // Only protect dashboard and other admin pages (not login)
  if (request.nextUrl.pathname.startsWith('/admin')) {
    try {
      const supabase = createMiddlewareClient({ req: request, res: response });
      const { data } = await supabase.auth.getSession();
      
      // No session - redirect to login
      if (!data.session) {
        const redirectUrl = new URL('/admin/login', request.url);
        return NextResponse.redirect(redirectUrl);
      }
    } catch (error) {
      console.error('Middleware error:', error);
      // On error, redirect to login
      const redirectUrl = new URL('/admin/login', request.url);
      return NextResponse.redirect(redirectUrl);
    }
  }
  
  // Continue for all other routes
  return response;
}

// Only run middleware on admin routes except login
export const config = {
  matcher: ['/admin/:path*'],
};
