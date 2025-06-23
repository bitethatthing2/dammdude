"use client";

import { useEffect, useState } from 'react';
import { redirect } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useWolfpackMembership } from '@/hooks/useWolfpackMembership';
import { WolfpackChatInterface } from '@/components/wolfpack/WolfpackChatInterface';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, MessageCircle, Users, Loader2 } from 'lucide-react';

export default function ChatPage() {
  const { user, loading } = useAuth();
  const { membership, isLoading: membershipLoading, isActive } = useWolfpackMembership();
  const [userLocation, setUserLocation] = useState<string>('');

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      redirect('/login');
    }
  }, [user, loading]);

  // Get user's current location from membership
  useEffect(() => {
    if (membership?.table_location) {
      // Determine location based on membership data
      const location = membership.table_location.includes('Portland') ? 'Portland' : 'Salem';
      setUserLocation(location);
    }
  }, [membership]);

  // Loading state
  if (loading || membershipLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading chat...</p>
          </div>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return null; // Will redirect
  }

  // Not a Wolf Pack member
  if (!isActive) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-lg mx-auto">
          <Card className="border-2 border-primary/20">
            <CardHeader className="text-center">
              <div className="p-3 bg-primary/10 rounded-lg inline-block mb-4">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Wolf Pack Access Required</CardTitle>
              <CardDescription className="text-lg">
                Join the Wolf Pack to access real-time chat with other members
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <MessageCircle className="h-4 w-4" />
                <AlertDescription>
                  Chat is exclusively available to Wolf Pack members. Join now to connect with other wolves at Salem and Portland!
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <h3 className="font-semibold">Chat Features You&apos;ll Get:</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-green-600" />
                    <span>Pack-wide chat for your location</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-green-600" />
                    <span>Direct messaging with other members</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-green-600" />
                    <span>DJ announcements and event notifications</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-lg">🐺</span>
                    <span>Winks and social interactions</span>
                  </li>
                </ul>
              </div>

              <div className="pt-4">
                <Button 
                  onClick={() => window.location.href = '/wolfpack'}
                  className="w-full"
                  size="lg"
                >
                  <Shield className="mr-2 h-5 w-5" />
                  Join the Wolf Pack
                </Button>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Location verification required
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Wolf Pack member - show chat interface
  return (
    <WolfpackChatInterface 
      currentLocation={userLocation || 'Salem'} 
      userId={user.id}
    />
  );
}
