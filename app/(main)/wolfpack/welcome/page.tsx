"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BackButton } from '@/components/shared/BackButton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Users, MessageCircle, QrCode, Star, CheckCircle, ArrowRight } from 'lucide-react';

export default function WolfpackWelcomePage() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <BackButton fallbackHref="/" className="mr-2" />
          <div className="p-2 bg-primary/10 rounded-lg">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Welcome to the Wolfpack!</h1>
            <p className="text-muted-foreground">Your membership is now active</p>
          </div>
          <Badge variant="default" className="ml-auto">
            <CheckCircle className="h-3 w-3 mr-1" />
            Active Member
          </Badge>
        </div>

        {/* Welcome Message */}
        <Card className="mb-8 border-2 border-primary/20 bg-primary/5">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-2xl">
              <Star className="h-6 w-6 text-primary" />
              Congratulations!
            </CardTitle>
            <CardDescription className="text-lg">
              You&apos;re now part of an exclusive community with amazing benefits
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-6">
              Your Wolfpack membership gives you instant access to premium features 
              and exclusive experiences. Start exploring what&apos;s available to you!
            </p>
            
            <div className="flex flex-wrap justify-center gap-3">
              <Button onClick={() => router.push('/chat')} className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                Join Wolfpack Chat
              </Button>
              <Button variant="outline" onClick={() => router.push('/table')} className="flex items-center gap-2">
                <QrCode className="h-4 w-4" />
                Try Bar Tab
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Features Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Instant Access Features */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Available Now
              </CardTitle>
              <CardDescription>
                Features you can use immediately
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <QrCode className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Instant Bar Tab</h3>
                  <p className="text-sm text-muted-foreground">
                    Automatic tab opening when you arrive at the venue
                  </p>
                  <Button size="sm" variant="ghost" className="mt-2 p-0 h-auto" onClick={() => router.push('/table')}>
                    Try it now <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <MessageCircle className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Wolfpack Chat</h3>
                  <p className="text-sm text-muted-foreground">
                    Connect with other members in real-time
                  </p>
                  <Button size="sm" variant="ghost" className="mt-2 p-0 h-auto" onClick={() => router.push('/chat')}>
                    Start chatting <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Member Benefits</h3>
                  <p className="text-sm text-muted-foreground">
                    Priority service and exclusive member perks
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Getting Started Guide */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-primary" />
                Getting Started
              </CardTitle>
              <CardDescription>
                Make the most of your membership
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg border">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                    1
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Enable location services</p>
                    <p className="text-xs text-muted-foreground">Allow location access for automatic check-ins</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 rounded-lg border">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                    2
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Join the chat</p>
                    <p className="text-xs text-muted-foreground">Introduce yourself to other pack members</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 rounded-lg border">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                    3
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Try your bar tab</p>
                    <p className="text-xs text-muted-foreground">Experience seamless ordering when you visit</p>
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-4 mt-4">
                <Button variant="outline" className="w-full" onClick={() => router.push('/')}>
                  Explore the App
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Support Section */}
        <Card className="mt-8">
          <CardHeader className="text-center">
            <CardTitle>Need Help?</CardTitle>
            <CardDescription>
              We&apos;re here to help you get the most out of your Wolfpack membership
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Button variant="outline" onClick={() => router.push('/contact')}>
                Contact Support
              </Button>
              <Button variant="outline" onClick={() => router.push('/about')}>
                Learn More
              </Button>
              <Button variant="outline" onClick={() => router.push('/events')}>
                View Events
              </Button>
            </div>
            
            <p className="text-sm text-muted-foreground">
              Check out our events page for upcoming member-exclusive gatherings and special offers.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
