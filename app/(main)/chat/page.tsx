"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BackButton } from '@/components/shared/BackButton';
import { GeolocationActivation } from '@/components/wolfpack/GeolocationActivation';
import { WolfpackRealTimeChat } from '@/components/wolfpack/WolfpackRealTimeChat';
import { WolfpackChatInterface } from '@/components/wolfpack/WolfpackChatInterface';
import { useUser } from '@/hooks/useUser';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { MessageCircle, Users, Shield, ArrowRight } from 'lucide-react';

export default function ChatPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const [isWolfPackMember, setIsWolfPackMember] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = getSupabaseBrowserClient();

  // Check wolfpack membership status
  useEffect(() => {
    async function checkMembershipStatus() {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('wolf_pack_members')
          .select(`
            id,
            location_id,
            locations!inner(name)
          `)
          .eq('user_id', user.id)
          .eq('status', 'active')
          .single();

        if (!error && data) {
          setIsWolfPackMember(true);
          setCurrentLocation(data.locations.name);
        } else {
          setIsWolfPackMember(false);
          setCurrentLocation(null);
        }
      } catch (error) {
        console.error('Error checking wolfpack membership:', error);
        setIsWolfPackMember(false);
        setCurrentLocation(null);
      } finally {
        setIsLoading(false);
      }
    }

    if (!userLoading) {
      checkMembershipStatus();
    }
  }, [user, userLoading, supabase]);

  // Handle loading states
  if (userLoading || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  // If user is not logged in, show login prompt
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center mb-6 relative">
            <BackButton fallbackHref="/" className="absolute left-0" />
            <div className="text-center">
              <div className="p-4 bg-primary/10 rounded-full inline-block mb-4">
                <MessageCircle className="h-12 w-12 text-primary" />
              </div>
              <h1 className="text-3xl font-bold mb-2">Wolfpack Chat</h1>
              <p className="text-muted-foreground text-lg">
                Exclusive chat for Wolfpack members
              </p>
            </div>
          </div>

          <Card className="border-2">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <Shield className="h-5 w-5" />
                Login Required
              </CardTitle>
              <CardDescription>
                Join the Wolfpack to access real-time chat with other members
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button 
                size="lg" 
                className="w-full sm:w-auto" 
                onClick={() => router.push('/login')}
              >
                Login to Access Chat
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // If user is a wolfpack member, show chat interface
  if (isWolfPackMember && currentLocation) {
    return (
      <WolfpackChatInterface 
        currentLocation={currentLocation}
        userId={user.id}
      />
    );
  }

  // If user is logged in but not a wolfpack member, show geolocation activation
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <BackButton fallbackHref="/" className="mr-2" />
          <div className="p-2 bg-primary/10 rounded-lg">
            <MessageCircle className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Wolfpack Chat</h1>
            <p className="text-muted-foreground">Join the pack to access chat</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Welcome message */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <div className="text-center mb-4">
                <div className="p-3 bg-primary/10 rounded-full inline-block mb-3">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-xl font-semibold mb-2">Welcome to Wolfpack Chat!</h2>
                <p className="text-muted-foreground">
                  To access the exclusive wolfpack chat, you need to be at a Side Hustle location and join the pack.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Geolocation activation component */}
          <GeolocationActivation />

          {/* Benefits preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                What you&apos;ll get with Wolfpack access
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <MessageCircle className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Real-time Chat</h3>
                    <p className="text-sm text-muted-foreground">
                      Connect instantly with other wolfpack members at your location
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Location-based Community</h3>
                    <p className="text-sm text-muted-foreground">
                      Chat only with people who are actually at the same location as you
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Shield className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Profile & Ordering</h3>
                    <p className="text-sm text-muted-foreground">
                      Access your wolfpack profile and exclusive menu ordering features
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
