"use client";

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';

export default function AdminRedirect() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  
  // Use useEffect to check auth and handle the redirect after component mounts
  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data } = await supabase.auth.getSession();
        
        if (data.session) {
          // User is authenticated, redirect to dashboard
          router.replace('/admin/dashboard');
        } else {
          // User is not authenticated, redirect to login
          router.replace('/admin/login');
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        // On error, redirect to login
        router.replace('/admin/login');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuthAndRedirect();
  }, [router]);
  
  return (
    <div className="flex items-center justify-center min-h-screen">
      {isLoading ? (
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      ) : (
        <p className="text-center">Redirecting...</p>
      )}
    </div>
  );
}