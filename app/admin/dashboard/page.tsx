"use client";

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { LogOut, User } from 'lucide-react';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const checkSession = async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data } = await supabase.auth.getSession();
        
        if (data.session?.user) {
          setUserEmail(data.session.user.email);
        }
      } catch (error) {
        console.error('Error fetching session:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkSession();
  }, []);
  
  const handleLogout = async () => {
    try {
      const supabase = getSupabaseBrowserClient();
      await supabase.auth.signOut();
      router.push('/admin/login');
      router.refresh();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <p>Loading...</p>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        
        <div className="flex items-center gap-4">
          {userEmail && (
            <div className="flex items-center text-sm text-muted-foreground">
              <User className="h-4 w-4 mr-1" />
              {userEmail}
            </div>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleLogout}
            className="flex items-center gap-1"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border rounded-lg p-6 bg-card">
          <h2 className="text-xl font-bold mb-4">Bar Tap Orders</h2>
          <p className="text-muted-foreground mb-6">
            View and manage incoming orders from customers.
          </p>
          <Button 
            onClick={() => router.push('/admin/bar-tap')}
            className="w-full"
          >
            View Orders
          </Button>
        </div>
        
        <div className="border rounded-lg p-6 bg-card">
          <h2 className="text-xl font-bold mb-4">Send Notifications</h2>
          <p className="text-muted-foreground mb-6">
            Send push notifications to customers.
          </p>
          <Button 
            onClick={() => router.push('/admin/bar-tap')}
            className="w-full"
          >
            Manage Notifications
          </Button>
        </div>
      </div>
      
      <div className="mt-8 p-4 border rounded-lg bg-muted/50">
        <h2 className="text-lg font-medium mb-2">Admin Features Coming Soon</h2>
        <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
          <li>Menu management</li>
          <li>Booking confirmations</li>
          <li>Event calendar management</li>
          <li>Staff scheduling</li>
        </ul>
      </div>
    </div>
  );
}