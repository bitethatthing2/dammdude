'use client';

import { useEffect, useState } from 'react';
import { OrderManagement } from '@/components/employee/order-management';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export default function EmployeeDashboardPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = getSupabaseBrowserClient();
      
      try {
        setIsLoading(true);
        
        // Check if user is logged in
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        if (!session) {
          // Redirect to login if not authenticated
          router.push('/login');
          return;
        }
        
        // Additional check for employee role if needed
        // For example, query a 'employees' table to verify this user has access
        // This is optional depending on your authentication setup
        
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Authentication error:', error);
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, [router]);
  
  // Handle sign out
  const handleSignOut = async () => {
    const supabase = getSupabaseBrowserClient();
    
    try {
      await supabase.auth.signOut();
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }
  
  return (
    <div className="container py-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Employee Dashboard</h1>
          <p className="text-muted-foreground">Manage orders and food menu items</p>
        </div>
        <Button variant="outline" onClick={handleSignOut}>
          Sign Out
        </Button>
      </div>
      
      <Tabs defaultValue="orders">
        <TabsList className="mb-6">
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="menu">Menu Management</TabsTrigger>
          <TabsTrigger value="tables">Tables</TabsTrigger>
        </TabsList>
        
        <TabsContent value="orders">
          <Card className="p-6">
            <OrderManagement />
          </Card>
        </TabsContent>
        
        <TabsContent value="menu">
          <Card className="p-6">
            <div className="text-center py-12">
              <h2 className="text-xl font-medium mb-2">Menu Management</h2>
              <p className="text-muted-foreground mb-4">
                This section will allow you to add, edit, and remove menu items.
              </p>
              <Button onClick={() => router.push('/employee/menu-editor')}>
                Edit Menu
              </Button>
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="tables">
          <Card className="p-6">
            <div className="space-y-6">
              <h2 className="text-xl font-medium">Table Management</h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {Array.from({ length: 50 }, (_, i) => i + 1).map((tableNum) => {
                  // In a real app, you'd fetch table status from your database
                  const isOccupied = Math.random() > 0.7;
                  const timeRemaining = Math.floor(Math.random() * 15); // 0-15 minutes
                  
                  return (
                    <div 
                      key={tableNum} 
                      className={`p-4 rounded-lg border flex flex-col items-center ${
                        isOccupied ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                      }`}
                    >
                      <span className="text-lg font-bold">Table {tableNum}</span>
                      <span className={`text-sm ${isOccupied ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                        {isOccupied ? `${timeRemaining}min left` : 'Available'}
                      </span>
                    </div>
                  );
                })}
              </div>
              
              <div className="bg-muted/30 p-4 rounded-lg mt-6">
                <h3 className="font-medium mb-2">Table Time Limits</h3>
                <p className="text-sm text-muted-foreground">
                  Each table has a 15-minute time limit. Tables will automatically be marked as available after the time expires.
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
