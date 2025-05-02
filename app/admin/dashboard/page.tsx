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
import { NotificationCreator } from '@/components/admin/NotificationCreator';
import { DeviceRegistration } from '@/components/admin/DeviceRegistration';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AdminDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSigningOut, setIsSigningOut] = React.useState(false);
  
  // Notification state
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationBody, setNotificationBody] = useState('');
  const [notificationTarget, setNotificationTarget] = useState('all_devices');
  const [isSending, setIsSending] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageLink, setImageLink] = useState('');
  const [actionButtonLabel, setActionButtonLabel] = useState('');
  const [actionButtonUrl, setActionButtonUrl] = useState('');

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
                sendToAll: true,
                imageUrl: imageUrl,
                imageLink: imageLink,
                actionButtonLabel: actionButtonLabel,
                actionButtonUrl: actionButtonUrl
              }
            : {
                title: notificationTitle,
                body: notificationBody,
                topic: notificationTarget,
                imageUrl: imageUrl,
                imageLink: imageLink,
                actionButtonLabel: actionButtonLabel,
                actionButtonUrl: actionButtonUrl
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
      setImageUrl('');
      setImageLink('');
      setActionButtonLabel('');
      setActionButtonUrl('');
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
              Notification Management
            </CardTitle>
            <CardDescription>
              Send notifications to users through different channels
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="push">
              <TabsList className="mb-4">
                <TabsTrigger value="push">Push Notifications</TabsTrigger>
                <TabsTrigger value="in-app">In-App Notifications</TabsTrigger>
              </TabsList>
              
              <TabsContent value="push">
                <form onSubmit={handleSendNotification} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="notification-body">Notification Message</Label>
                    <Textarea
                      id="notification-body"
                      value={notificationBody}
                      onChange={(e) => setNotificationBody(e.target.value)}
                      placeholder="Enter notification message"
                      required
                      rows={3}
                    />
                  </div>
                  
                  <Tabs defaultValue="basic" className="w-full mt-4">
                    <TabsList className="w-full grid grid-cols-3">
                      <TabsTrigger value="basic">Basic</TabsTrigger>
                      <TabsTrigger value="media">Media</TabsTrigger>
                      <TabsTrigger value="actions">Actions</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="basic" className="pt-4">
                      <p className="text-sm text-muted-foreground mb-2">
                        Basic notification with title and message. No additional options needed.
                      </p>
                    </TabsContent>
                    
                    <TabsContent value="media" className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label htmlFor="notification-image" className="flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-image">
                            <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                            <circle cx="9" cy="9" r="2"/>
                            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                          </svg>
                          Notification Image URL
                        </Label>
                        <Input
                          id="notification-image"
                          placeholder="https://example.com/image.jpg"
                          className="w-full"
                          onChange={(e) => setImageUrl(e.target.value)}
                          value={imageUrl}
                        />
                        <p className="text-xs text-muted-foreground">
                          Full URL to an image that will be displayed in the notification (must start with http:// or https://)
                        </p>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="actions" className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label htmlFor="notification-link" className="flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-link">
                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                          </svg>
                          Notification Link
                        </Label>
                        <Input
                          id="notification-link"
                          placeholder="/menu or https://example.com"
                          className="w-full"
                          onChange={(e) => setImageLink(e.target.value)}
                          value={imageLink}
                        />
                        <p className="text-xs text-muted-foreground">
                          URL to open when the notification is clicked (can be a relative path or full URL)
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="action-button-label" className="flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-mouse-pointer-click">
                              <path d="m9 9 5 12 1.774-5.226L21 14 9 9z"/>
                              <path d="m16.071 16.071 4.243 4.243"/>
                              <path d="m7.188 2.239.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656-2.12 2.122"/>
                            </svg>
                            Action Button Label
                          </Label>
                          <Input
                            id="action-button-label"
                            placeholder="View Order"
                            onChange={(e) => setActionButtonLabel(e.target.value)}
                            value={actionButtonLabel}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="action-button-url" className="flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-link">
                              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                            </svg>
                            Action Button URL
                          </Label>
                          <Input
                            id="action-button-url"
                            placeholder="/orders/123 or https://example.com"
                            onChange={(e) => setActionButtonUrl(e.target.value)}
                            value={actionButtonUrl}
                          />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Add a custom action button to your notification. Both label and URL are required for the button to appear.
                      </p>
                    </TabsContent>
                  </Tabs>
                  
                  <Button 
                    type="submit" 
                    className="w-full flex items-center justify-center mt-6"
                    disabled={isSending}
                  >
                    {isSending ? (
                      <>Sending notification...</>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Push Notification
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="in-app">
                <NotificationCreator />
              </TabsContent>
            </Tabs>
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
        
        <Card>
          <CardHeader>
            <CardTitle>Device Registration</CardTitle>
          </CardHeader>
          <CardContent>
            <DeviceRegistration />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}