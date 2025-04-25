"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { LogOut, Bell, Send } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function AdminDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSigningOut, setIsSigningOut] = React.useState(false);
  
  // Notification state
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationBody, setNotificationBody] = useState('');
  const [notificationTarget, setNotificationTarget] = useState('all_devices');
  const [isSending, setIsSending] = useState(false);

  // Simple sign out function
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
  
  // Function to send notifications
  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!notificationTitle || !notificationBody) {
      toast({
        title: "Validation Error",
        description: "Please provide both title and body for the notification",
        variant: "destructive",
      });
      return;
    }
    
    setIsSending(true);
    
    try {
      // Send notification to Firebase Cloud Messaging topic
      const response = await fetch('/api/send-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(
          notificationTarget === 'all_devices' 
            ? {
                title: notificationTitle,
                body: notificationBody,
                sendToAll: true
              }
            : {
                title: notificationTitle,
                body: notificationBody,
                topic: notificationTarget
              }
        ),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        const errorMessage = data.error || data.message || 'Failed to send notification';
        const errorDetails = data.details ? `: ${data.details}` : '';
        console.error(`Error sending notification: ${errorMessage}${errorDetails}`);
        throw new Error(errorMessage);
      }
      
      toast({
        title: "Notification Sent!",
        description: `Successfully sent to ${notificationTarget}`,
      });
      
      // Clear form after successful send
      setNotificationTitle('');
      setNotificationBody('');
    } catch (error) {
      console.error('Error sending notification:', error);
      toast({
        title: "Notification Failed",
        description: error instanceof Error ? error.message : 'Failed to send notification, please try again',
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="container py-10">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Welcome to your admin portal</p>
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
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Notification Card */}
        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="h-5 w-5 mr-2 text-primary" />
              Send Push Notification
            </CardTitle>
            <CardDescription>
              Send notifications to all users or specific groups
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSendNotification} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="notification-title">Notification Title</Label>
                <Input
                  id="notification-title"
                  value={notificationTitle}
                  onChange={(e) => setNotificationTitle(e.target.value)}
                  placeholder="Enter notification title"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notification-body">Notification Body</Label>
                <Textarea
                  id="notification-body"
                  value={notificationBody}
                  onChange={(e) => setNotificationBody(e.target.value)}
                  placeholder="Enter notification message"
                  required
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notification-target">Target Audience</Label>
                <Select
                  value={notificationTarget}
                  onValueChange={setNotificationTarget}
                >
                  <SelectTrigger id="notification-target">
                    <SelectValue placeholder="Select audience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all_devices">All Devices</SelectItem>
                    <SelectItem value="admin_devices">Admin Devices</SelectItem>
                    <SelectItem value="ios_devices">iOS Devices</SelectItem>
                    <SelectItem value="android_devices">Android Devices</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                type="submit" 
                className="w-full flex items-center justify-center"
                disabled={isSending}
              >
                {isSending ? (
                  <>Sending notification...</>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Notification
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Manage customer orders</p>
            <Button variant="outline" className="mt-4" onClick={() => toast({ title: "Orders", description: "This feature is coming soon" })}>
              View Orders
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Products</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Manage your product catalog</p>
            <Button variant="outline" className="mt-4" onClick={() => toast({ title: "Products", description: "This feature is coming soon" })}>
              View Products
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Manage your account settings</p>
            <Button variant="outline" className="mt-4" onClick={() => toast({ title: "Settings", description: "This feature is coming soon" })}>
              View Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}