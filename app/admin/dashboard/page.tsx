"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LogOut, Bell } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useToast } from '@/components/ui/use-toast';
import { NotificationSender } from '@/components/admin/NotificationSender';

export default function AdminDashboard() {
  // Use createClientComponentClient directly instead of custom client to avoid any issues
  const supabase = createClientComponentClient();
  const router = useRouter();
  const { toast } = useToast();
  const [isSigningOut, setIsSigningOut] = React.useState(false);
  const [userName, setUserName] = React.useState<string | null>(null);

  // Get the user name on mount, but don't block rendering
  React.useEffect(() => {
    const getUser = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        setUserName(data.user?.email || 'Admin User');
      } catch (error) {
        console.error('Error getting user:', error);
      }
    };
    
    getUser();
  }, [supabase.auth]);

  // Simple sign out function
  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await supabase.auth.signOut();
      
      toast({
        title: "Signed out successfully",
        description: "You have been signed out of the admin dashboard",
      });
      
      router.push('/admin/login');
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: "Sign out failed",
        description: "There was an error signing out. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <div className="container py-10">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            {userName ? `Welcome, ${userName}` : 'Welcome to your admin portal'}
          </p>
        </div>
        
        <Button 
          variant="outline" 
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="flex items-center gap-2"
        >
          {isSigningOut ? (
            <>Signing out...</>
          ) : (
            <>
              <LogOut className="h-4 w-4" />
              Sign Out
            </>
          )}
        </Button>
      </header>
      
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="h-5 w-5 mr-2 text-primary" />
              Push Notifications
            </CardTitle>
            <CardDescription>
              Send messages to all users or specific groups
            </CardDescription>
          </CardHeader>
          <CardContent>
            <NotificationSender />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Admin Controls</CardTitle>
            <CardDescription>
              Manage your application
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button 
                onClick={() => toast({ title: "Orders", description: "Order management coming soon" })}
                variant="outline"
                className="h-16"
              >
                View Orders
              </Button>
              
              <Button 
                onClick={() => toast({ title: "Products", description: "Product management coming soon" })}
                variant="outline"
                className="h-16"
              >
                Manage Products
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}