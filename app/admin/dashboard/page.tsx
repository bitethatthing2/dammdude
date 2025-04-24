"use client";

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function AdminDashboardPage() {
  const router = useRouter();
  
  // In a real app, this would check authentication state
  // For now, we just provide links to the admin sections
  
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      
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