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

  useEffect(() => {
    const checkSession = async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase.auth.getUser();
        
        if (error || !data.user) {
          console.error('Session error:', error);
          router.push('/admin/login');
          return;
        }

        // Get admin data
        const { data: adminData, error: adminError } = await supabase
          .from('admin_users')
          .select('*')
          .eq('id', data.user.id)
          .single();
          
        if (adminError || !adminData) {
          console.error('Admin data error:', adminError);
          await supabase.auth.signOut();
          router.push('/admin/login');
          return;
        }
        
        setUser(data.user);
      } catch (err) {
        console.error('Error checking session:', err);
        router.push('/admin/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, [router]);

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