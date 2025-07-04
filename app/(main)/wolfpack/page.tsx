'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useConsistentAuth } from '@/lib/hooks/useConsistentAuth';
import { useConsistentWolfpackAccess } from '@/lib/hooks/useConsistentWolfpackAccess';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/database.types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, 
  MessageCircle, 
  MapPin, 
  Sparkles, 
  Shield,
  Settings,
  Calendar,
  Loader2,
  AlertTriangle,
  Heart,
  Star
} from 'lucide-react';

// Remove custom hooks - using consistent hooks instead

export default function WolfpackMainPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useConsistentAuth();
  const { isMember: isInPack, isLoading: packLoading } = useConsistentWolfpackAccess();
  const [packMemberCount, setPackMemberCount] = useState(0);
  const supabase = createClientComponentClient<Database>();

  // Load pack member count
  useEffect(() => {
    const loadPackStats = async () => {
      if (!isInPack) return;

      try {
        const { count } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('is_wolfpack_member', true)
          .eq('wolfpack_status', 'active');

        setPackMemberCount(count || 0);
      } catch (error) {
        console.error('Error loading pack stats:', error);
      }
    };

    loadPackStats();
  }, [isInPack]);

  const isLoading = authLoading || packLoading;

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 pb-20 max-w-4xl">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading Wolf Pack...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto p-4 pb-20 max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Authentication Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Please login to access Wolf Pack features.
            </p>
            <Button onClick={() => router.push('/login')} className="w-full">
              Login to Continue
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isInPack) {
    return (
      <div className="container mx-auto p-4 pb-20 max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Join the Wolf Pack
            </CardTitle>
            <CardDescription>
              You need to be at Side Hustle Bar to join the pack
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>Location verification required</span>
            </div>
            <Button 
              className="w-full" 
              size="lg"
              onClick={() => router.push('/wolfpack/welcome')}
            >
              Enable Location & Join Pack
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="container mx-auto p-4 pb-20 max-w-4xl flex-1">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold flex items-center justify-center gap-3 mb-2">
            🐺 Wolf Pack
            <Badge variant="outline" className="text-sm">
              {packMemberCount} Active
            </Badge>
          </h1>
          <p className="text-lg text-muted-foreground">
            Welcome to the pack, {user.first_name || user.email.split('@')[0]}!
          </p>
        </div>

        {/* Main Features Grid */}
        <div className="grid gap-6 mb-8">
          {/* Chat Feature */}
          <Card 
            className="cursor-pointer hover:shadow-lg transition-all duration-200 border-blue-200 hover:border-blue-400"
            onClick={() => router.push('/wolfpack/chat')}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <MessageCircle className="h-6 w-6 text-blue-600" />
                </div>
                Pack Chat & Visualization
                <Badge variant="default" className="animate-pulse">LIVE</Badge>
              </CardTitle>
              <CardDescription>
                Chat with your pack and see interactive visualizations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Real-time chat, bubble charts, and member interactions
                </span>
                <Button size="sm">
                  Enter Chat →
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Public Chat Channels */}
          <Card className="border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                Public Chat Channels
                <Badge variant="secondary">NEW</Badge>
              </CardTitle>
              <CardDescription>
                Join public conversations with all Wolfpack members
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🌐</span>
                    <div>
                      <p className="font-medium">General Chat</p>
                      <p className="text-sm text-muted-foreground">All locations • Always active</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">Join</Button>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📍</span>
                    <div>
                      <p className="font-medium">Salem Wolfpack</p>
                      <p className="text-sm text-muted-foreground">Salem location • 5 active</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">Join</Button>
                </div>
                
                <div className="pt-2 border-t">
                  <Button 
                    variant="ghost" 
                    className="w-full" 
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push('/wolfpack/channels');
                    }}
                  >
                    View All Channels →
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Profile Management */}
            <Card 
              className="cursor-pointer hover:shadow-md transition-shadow border-purple-200 hover:border-purple-300"
              onClick={() => router.push('/profile')}
            >
              <CardContent className="p-6 text-center">
                <div className="p-3 bg-purple-100 rounded-lg inline-block mb-3">
                  <Settings className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-semibold mb-2">Wolf Profile</h3>
                <p className="text-sm text-muted-foreground">
                  Customize your pack persona and preferences
                </p>
              </CardContent>
            </Card>

            {/* Events */}
            <Card 
              className="cursor-pointer hover:shadow-md transition-shadow border-green-200 hover:border-green-300"
              onClick={() => router.push('/events')}
            >
              <CardContent className="p-6 text-center">
                <div className="p-3 bg-green-100 rounded-lg inline-block mb-3">
                  <Calendar className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold mb-2">Events & Contests</h3>
                <p className="text-sm text-muted-foreground">
                  Join DJ events, trivia, and competitions
                </p>
              </CardContent>
            </Card>

            {/* Menu */}
            <Card 
              className="cursor-pointer hover:shadow-md transition-shadow border-orange-200 hover:border-orange-300"
              onClick={() => router.push('/menu')}
            >
              <CardContent className="p-6 text-center">
                <div className="p-3 bg-orange-100 rounded-lg inline-block mb-3">
                  <span className="text-2xl">🍽️</span>
                </div>
                <h3 className="font-semibold mb-2">Order Food & Drinks</h3>
                <p className="text-sm text-muted-foreground">
                  Browse menu and place orders
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Pack Status */}
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Pack Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{packMemberCount}</div>
                  <div className="text-sm text-muted-foreground">Active Members</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">24/7</div>
                  <div className="text-sm text-muted-foreground">Available</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">🎯</div>
                  <div className="text-sm text-muted-foreground">Location Based</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600">🔥</div>
                  <div className="text-sm text-muted-foreground">Live Events</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Welcome Message */}
        <Alert>
          <Star className="h-4 w-4" />
          <AlertDescription>
            <strong>Welcome to the Wolf Pack!</strong> Connect with other patrons, join events, and make your night memorable. 
            Start by checking out the live chat or updating your wolf profile.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}