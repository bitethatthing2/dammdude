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
  const isDashboardRoute = request.nextUrl.pathname === '/admin/dashboard';
  
  // Extract URL for debugging and handle any query parameters or redirects
  const fullUrl = request.url;
  const requestedPath = request.nextUrl.pathname;
  
  console.log(`Middleware processing: ${requestedPath}`);
  
  // Allow access to login page
  if (isLoginRoute) {
    // If already logged in, redirect to dashboard
    if (session) {
      try {
        // Check if this user is actually an admin before redirecting
        const { data: adminData, error: adminError } = await supabase
          .from('admin_users')
          .select('id')
          .eq('id', session.user.id)
          .maybeSingle();
        
        if (adminError) {
          console.error('Admin verification error:', adminError);
          return response;
        }
        
        if (adminData) {
          console.log('Admin already logged in, redirecting to dashboard');
          const url = new URL('/admin/dashboard', request.url);
          return NextResponse.redirect(url);
        } else {
          // User is authenticated but not an admin - sign them out
          console.log('Non-admin user detected, signing out');
          await supabase.auth.signOut();
          return response;
        }
      } catch (error) {
        console.error('Error checking admin status in middleware:', error);
        // Continue to login page on error
        return response;
      }
    }
    console.log('Allowing access to login page');
    return response;
  }
  
  // Protect admin routes
  if (isAdminRoute) {
    // If no session, redirect to login
    if (!session) {
      console.log('No session detected, redirecting to login');
      const url = new URL('/admin/login', request.url);
      // Clear any previous query params
      return NextResponse.redirect(url);
    }
    
    // Check if the user is an admin
    try {
      const { data: adminData, error: adminError } = await supabase
        .from('admin_users')
        .select('id, role')
        .eq('id', session.user.id)
        .maybeSingle();
      
      if (adminError) {
        console.error('Admin verification error in protected route:', adminError);
        throw adminError;
      }
      
      if (!adminData) {
        // Not an admin - sign out and redirect to login
        console.log('Non-admin accessing protected route, signing out');
        await supabase.auth.signOut();
        const url = new URL('/admin/login', request.url);
        return NextResponse.redirect(url);
      }
      
      // User is an admin, allow access
      console.log('Admin verification successful, allowing access');
      
      // Set custom header for admin verification
      // This helps frontend code know the request was properly authenticated
      response.headers.set('x-admin-authenticated', 'true');
      
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
