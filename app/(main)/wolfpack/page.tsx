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
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
        <div className="container mx-auto p-4 max-w-4xl">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
              <p className="text-gray-300">Loading Wolf Pack...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
        <div className="container mx-auto p-4 max-w-md">
          <Card className="bg-white/5 border-white/20 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Shield className="h-5 w-5" />
                Authentication Required
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 mb-4">
                Please login to access Wolf Pack features.
              </p>
              <Button onClick={() => router.push('/login')} className="w-full bg-blue-600 hover:bg-blue-700">
                Login to Continue
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!isInPack) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
        <div className="container mx-auto p-4 max-w-md">
          <Card className="bg-white/5 border-white/20 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Sparkles className="h-5 w-5" />
                Join the Wolf Pack
              </CardTitle>
              <CardDescription className="text-gray-300">
                You need to be at Side Hustle Bar to join the pack
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-gray-400">
                <MapPin className="h-4 w-4" />
                <span>Location verification required</span>
              </div>
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700" 
                size="lg"
                onClick={() => router.push('/wolfpack/welcome')}
              >
                Enable Location & Join Pack
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      <div className="container mx-auto p-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold flex items-center justify-center gap-3 mb-2 text-white">
            🐺 Wolf Pack
            <Badge variant="outline" className="text-sm bg-white/10 border-white/20 text-white">
              {packMemberCount} Active
            </Badge>
          </h1>
          <p className="text-lg text-gray-300">
            Welcome to the pack, {user.first_name || user.email.split('@')[0]}!
          </p>
        </div>

        {/* Main Features Grid */}
        <div className="grid gap-6 mb-8">
          {/* Chat Feature */}
          <Card 
            className="cursor-pointer hover:shadow-lg transition-all duration-200 bg-white/5 border-blue-500/30 hover:border-blue-400 backdrop-blur-md"
            onClick={() => router.push('/wolfpack/chat')}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-white">
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <MessageCircle className="h-8 w-8 text-blue-400" />
                </div>
                Pack Chat & Visualization
                <Badge variant="default" className="animate-pulse bg-green-500 text-black">LIVE</Badge>
              </CardTitle>
              <CardDescription className="text-gray-300">
                Chat with your pack and see interactive visualizations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">
                  Real-time chat, bubble charts, and member interactions
                </span>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                  Enter Chat →
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Public Chat Channels */}
          <Card className="bg-white/5 border-green-500/30 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-white">
                <div className="p-3 bg-green-500/20 rounded-lg">
                  <Users className="h-8 w-8 text-green-400" />
                </div>
                Public Chat Channels
                <Badge variant="secondary" className="bg-purple-500/20 text-purple-300">NEW</Badge>
              </CardTitle>
              <CardDescription className="text-gray-300">
                Join public conversations with all Wolfpack members
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border border-white/10 rounded-lg hover:bg-white/5 cursor-pointer transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🌐</span>
                    <div>
                      <p className="font-medium text-white">General Chat</p>
                      <p className="text-sm text-gray-400">All locations • Always active</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/10">Join</Button>
                </div>
                
                <div className="flex items-center justify-between p-3 border border-white/10 rounded-lg hover:bg-white/5 cursor-pointer transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📍</span>
                    <div>
                      <p className="font-medium text-white">Salem Wolfpack</p>
                      <p className="text-sm text-gray-400">Salem location • 5 active</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/10">Join</Button>
                </div>
                
                <div className="pt-2 border-t border-white/10">
                  <Button 
                    variant="ghost" 
                    className="w-full text-white hover:bg-white/10" 
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
              className="cursor-pointer hover:shadow-md transition-shadow bg-white/5 border-purple-500/30 hover:border-purple-400 backdrop-blur-md"
              onClick={() => router.push('/profile')}
            >
              <CardContent className="p-6 text-center">
                <div className="p-4 bg-purple-500/20 rounded-lg inline-block mb-3">
                  <Settings className="h-10 w-10 text-purple-400" />
                </div>
                <h3 className="font-semibold mb-2 text-white">Wolf Profile</h3>
                <p className="text-sm text-gray-400">
                  Customize your pack persona and preferences
                </p>
              </CardContent>
            </Card>

            {/* Events */}
            <Card 
              className="cursor-pointer hover:shadow-md transition-shadow bg-white/5 border-green-500/30 hover:border-green-400 backdrop-blur-md"
              onClick={() => router.push('/events')}
            >
              <CardContent className="p-6 text-center">
                <div className="p-4 bg-green-500/20 rounded-lg inline-block mb-3">
                  <Calendar className="h-10 w-10 text-green-400" />
                </div>
                <h3 className="font-semibold mb-2 text-white">Events & Contests</h3>
                <p className="text-sm text-gray-400">
                  Join DJ events, trivia, and competitions
                </p>
              </CardContent>
            </Card>

            {/* Menu */}
            <Card 
              className="cursor-pointer hover:shadow-md transition-shadow bg-white/5 border-orange-500/30 hover:border-orange-400 backdrop-blur-md"
              onClick={() => router.push('/menu')}
            >
              <CardContent className="p-6 text-center">
                <div className="p-4 bg-orange-500/20 rounded-lg inline-block mb-3">
                  <span className="text-4xl">🍽️</span>
                </div>
                <h3 className="font-semibold mb-2 text-white">Order Food & Drinks</h3>
                <p className="text-sm text-gray-400">
                  Browse menu and place orders
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Pack Status */}
          <Card className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border-white/10 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Users className="h-5 w-5" />
                Pack Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-400">{packMemberCount}</div>
                  <div className="text-sm text-gray-400">Active Members</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-400">24/7</div>
                  <div className="text-sm text-gray-400">Available</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-400">🎯</div>
                  <div className="text-sm text-gray-400">Location Based</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-400">🔥</div>
                  <div className="text-sm text-gray-400">Live Events</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Welcome Message */}
        <Alert className="bg-white/5 border-yellow-500/30 backdrop-blur-md">
          <Star className="h-4 w-4 text-yellow-400" />
          <AlertDescription className="text-gray-300">
            <strong className="text-white">Welcome to the Wolf Pack!</strong> Connect with other patrons, join events, and make your night memorable. 
            Start by checking out the live chat or updating your wolf profile.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}