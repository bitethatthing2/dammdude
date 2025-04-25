"use client";

import { useState, useEffect } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, LogOut, UserCircle, Settings, Bell } from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    // Maximum number of session check retries
    const MAX_RETRIES = 3;
    
    const checkSession = async () => {
      try {
        console.log(`Checking admin session (attempt ${retryCount + 1})...`);
        const supabase = getSupabaseBrowserClient();
        
        // First check if we have a session
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          throw new Error('Failed to retrieve session');
        }
        
        if (!sessionData.session) {
          console.log('No active session found. Redirecting to login...');
          router.replace('/admin/login');
          return;
        }
        
        console.log('Session found, checking user data...');
        
        // Then get the user data
        const { data, error } = await supabase.auth.getUser();
        
        if (error || !data.user) {
          console.error('User data error:', error);
          throw new Error('Failed to retrieve user data');
        }

        console.log('User authenticated, checking admin status...');
        
        // Get admin data
        const { data: adminData, error: adminError } = await supabase
          .from('admin_users')
          .select('*')
          .eq('id', data.user.id)
          .single();
          
        if (adminError) {
          console.error('Admin data error:', adminError);
          throw new Error('Failed to verify admin status');
        }
        
        if (!adminData) {
          console.log('User is not an admin. Signing out...');
          await supabase.auth.signOut();
          router.replace('/admin/login');
          return;
        }
        
        console.log('Admin verification successful!');
        setUser(data.user);
        
        // Show welcome toast
        toast({
          title: "Welcome to Admin Dashboard",
          description: `Logged in as ${data.user.email}`,
          duration: 3000,
        });
        
      } catch (err) {
        console.error('Error checking session:', err);
        
        // Retry logic - useful for race conditions or temporary auth issues
        if (retryCount < MAX_RETRIES) {
          console.log(`Retrying session check (${retryCount + 1}/${MAX_RETRIES})...`);
          setRetryCount(retryCount + 1);
          // Wait a moment before retrying
          setTimeout(checkSession, 1000);
          return;
        }
        
        toast({
          title: "Authentication Error",
          description: "Failed to verify your session. Please log in again.",
          variant: "destructive",
          duration: 5000,
        });
        
        router.replace('/admin/login');
      } finally {
        if (retryCount >= MAX_RETRIES || user) {
          setIsLoading(false);
        }
      }
    };

    checkSession();
  }, [router, toast, retryCount, user]);

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      const supabase = getSupabaseBrowserClient();
      await supabase.auth.signOut();
      
      toast({
        title: "Signed out successfully",
        description: "You have been signed out of the admin dashboard",
        duration: 3000,
      });
      
      router.push('/admin/login');
    } catch (error) {
      console.error('Error signing out:', error);
      
      toast({
        title: "Sign out failed",
        description: "There was an error signing out. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsSigningOut(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-xl font-semibold">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage your application</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted">
            <UserCircle className="h-5 w-5 text-primary" />
            <span className="font-medium">{user?.email}</span>
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleSignOut}
            disabled={isSigningOut}
          >
            {isSigningOut ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing out...
              </>
            ) : (
              <>
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </>
            )}
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Manage push notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Send push notifications to users or specific groups
            </p>
          </CardContent>
          <CardFooter>
            <Button className="w-full">
              <Bell className="mr-2 h-4 w-4" />
              Send Notification
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
            <CardDescription>Application configuration</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Configure application settings and preferences
            </p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full">
              <Settings className="mr-2 h-4 w-4" />
              Manage Settings
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}