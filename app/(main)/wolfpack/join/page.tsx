"use client";

import { useEffect, useState } from 'react';
import { BackButton } from '@/components/shared/BackButton';
import { WolfpackSignupForm } from '@/components/wolfpack/WolfpackSignupForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Users, MessageCircle, QrCode, Star, CheckCircle } from 'lucide-react';

export default function JoinWolfpackPage() {
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
            <h1 className="text-2xl font-bold">Join the Wolfpack</h1>
            <p className="text-muted-foreground">Unlock exclusive access and benefits</p>
          </div>
          <Badge variant="secondary" className="ml-auto">
            <Star className="h-3 w-3 mr-1" />
            Premium Membership
          </Badge>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Benefits Section */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Membership Benefits
                </CardTitle>
                <CardDescription>
                  Exclusive perks for Wolfpack members
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <QrCode className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Instant Bar Tab Access</h3>
                    <p className="text-sm text-muted-foreground">
                      Skip the wait - automatic bar tab opening when you arrive
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <MessageCircle className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Wolfpack Chat</h3>
                    <p className="text-sm text-muted-foreground">
                      Connect with other members in real-time chat
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Member Events</h3>
                    <p className="text-sm text-muted-foreground">
                      Exclusive access to member-only events and meetups
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Star className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Priority Service</h3>
                    <p className="text-sm text-muted-foreground">
                      Skip lines and get priority service throughout the venue
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Membership Tiers */}
            <Card>
              <CardHeader>
                <CardTitle>Membership Tiers</CardTitle>
                <CardDescription>
                  Choose the tier that fits your lifestyle
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <h4 className="font-semibold">Standard</h4>
                    <p className="text-sm text-muted-foreground">Essential features</p>
                  </div>
                  <Badge variant="outline">Free</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-lg border border-primary/50 bg-primary/5">
                  <div>
                    <h4 className="font-semibold">Premium</h4>
                    <p className="text-sm text-muted-foreground">Full access + perks</p>
                  </div>
                  <Badge>$9.99/month</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <h4 className="font-semibold">VIP</h4>
                    <p className="text-sm text-muted-foreground">Ultimate experience</p>
                  </div>
                  <Badge variant="secondary">$19.99/month</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Signup Form */}
          <div>
            <WolfpackSignupForm />
          </div>
        </div>
      </div>
    </div>
  );
}
