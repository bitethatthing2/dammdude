"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWolfpackAccess } from '@/lib/hooks/useWolfpackAccess';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BackButton } from '@/components/shared/BackButton';
import { MessageCircle, Users, Shield, ArrowRight } from 'lucide-react';

export default function ChatPage() {
  const router = useRouter();
  const { wolfpack, location } = useWolfpackAccess();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Handle loading states
  if (!isMounted || wolfpack === 'loading' || location === 'loading') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  // If user is a Wolfpack member and location verified, show chat interface
  if (wolfpack === 'active' && location === 'granted') {
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
              <p className="text-muted-foreground">Connect with fellow pack members</p>
            </div>
            <Badge variant="secondary" className="ml-auto">
              <Shield className="h-3 w-3 mr-1" />
              Verified Member
            </Badge>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Main Pack Chat
              </CardTitle>
              <CardDescription>
                Real-time chat for Wolfpack members currently at the location
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <MessageCircle className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Chat feature coming soon! Connect with other Wolfpack members in real-time.
                  </p>
                </div>
                
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex items-center gap-3 p-3 rounded-lg border">
                    <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                      <div className="h-3 w-3 rounded-full bg-green-500"></div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Live Members</p>
                      <p className="text-xs text-muted-foreground">3 members online</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 rounded-lg border">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <MessageCircle className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Recent Activity</p>
                      <p className="text-xs text-muted-foreground">2 new messages</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // If user is not a Wolfpack member, show upgrade prompt
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
              Members Only Feature
            </CardTitle>
            <CardDescription>
              Join the Wolfpack to access real-time chat with other members
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4">
              <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Connect with Members</h3>
                  <p className="text-sm text-muted-foreground">
                    Chat in real-time with other Wolfpack members at the location
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <MessageCircle className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Share Experiences</h3>
                  <p className="text-sm text-muted-foreground">
                    Share recommendations, plan meetups, and build community
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Shield className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Verified Community</h3>
                  <p className="text-sm text-muted-foreground">
                    Chat with verified members in a safe, moderated environment
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center mt-8">
              <p className="text-muted-foreground mb-4">
                Ready to join the pack?
              </p>
              <Button 
                size="lg" 
                className="w-full sm:w-auto" 
                onClick={() => router.push('/wolfpack/join')}
              >
                Join Wolfpack
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Get instant access to chat, exclusive bar tab features, and more
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
