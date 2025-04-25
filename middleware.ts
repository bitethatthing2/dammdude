import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Create a Supabase client configured to use cookies
  const response = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res: response });
  
  // Refresh session if expired - required for Server Components
  const { data: { session } } = await supabase.auth.getSession();
  
  // Check if the request is for an admin route
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');
  const isLoginRoute = request.nextUrl.pathname === '/admin/login';
  
  // Allow access to login page
  if (isLoginRoute) {
    // If already logged in, redirect to dashboard
    if (session) {
      // Check if this user is actually an admin before redirecting
      try {
        const { data: adminData } = await supabase
          .from('admin_users')
          .select('id')
          .eq('id', session.user.id)
          .maybeSingle();
          
        if (adminData) {
          const url = new URL('/admin/dashboard', request.url);
          return NextResponse.redirect(url);
        } else {
          // User is authenticated but not an admin - sign them out
          await supabase.auth.signOut();
          return response;
        }
      } catch (error) {
        console.error('Error checking admin status in middleware:', error);
        // Continue to login page on error
        return response;
      }
    }
    return response;
  }
  
  // Protect admin routes
  if (isAdminRoute) {
    // If no session, redirect to login
    if (!session) {
      const url = new URL('/admin/login', request.url);
      return NextResponse.redirect(url);
    }
    
    // Check if the user is an admin
    try {
      const { data: adminData } = await supabase
        .from('admin_users')
        .select('id, role')
        .eq('id', session.user.id)
        .maybeSingle();
      
      if (!adminData) {
        // Not an admin - sign out and redirect to login
        await supabase.auth.signOut();
        const url = new URL('/admin/login', request.url);
        return NextResponse.redirect(url);
      }
      
      // User is an admin, allow access
      return response;
    } catch (error) {
      console.error('Error checking admin status in middleware:', error);
      // Redirect to login on error to be safe
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
