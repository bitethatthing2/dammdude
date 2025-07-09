'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useConsistentAuth } from '@/lib/hooks/useConsistentAuth';
import { useConsistentWolfpackAccess } from '@/lib/hooks/useConsistentWolfpackAccess';
import { supabase } from '@/lib/supabase/client';
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
  Star
} from 'lucide-react';

// Remove custom hooks - using consistent hooks instead

export default function WolfpackMainPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useConsistentAuth();
  const { isMember: isInPack, isLoading: packLoading } = useConsistentWolfpackAccess();
  const [packMemberCount, setPackMemberCount] = useState(0);

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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-black dark:to-gray-900 text-gray-900 dark:text-white">
        <div className="container mx-auto p-4 max-w-4xl">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
              <p className="text-gray-600 dark:text-gray-300">Loading Wolf Pack...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-black dark:to-gray-900 text-gray-900 dark:text-white">
        <div className="container mx-auto p-4 max-w-md">
          <Card className="bg-white/90 dark:bg-white/5 border-gray-200 dark:border-white/20 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                <Shield className="h-5 w-5" />
                Authentication Required
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-black dark:to-gray-900 text-gray-900 dark:text-white">
        <div className="container mx-auto p-4 max-w-md">
          <Card className="bg-white/90 dark:bg-white/5 border-gray-200 dark:border-white/20 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                <Sparkles className="h-5 w-5" />
                Join the Wolf Pack
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-300">
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-black dark:to-gray-900 text-gray-900 dark:text-white">
      <div className="container mx-auto p-3 sm:p-4 max-w-4xl pb-20 sm:pb-24">
        {/* Header */}
        <div className="mb-4 sm:mb-6 text-center">
          <h1 className="text-3xl font-bold flex items-center justify-center gap-3 mb-2 text-white">
            🐺 Wolf Pack
            <Badge variant="outline" className="text-sm bg-gray-100 dark:bg-white/10 border-gray-300 dark:border-white/20 text-gray-900 dark:text-white">
              {packMemberCount} Active
            </Badge>
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Welcome to the pack, {user.first_name || user.email.split('@')[0]}!
          </p>
        </div>

        {/* Main Features Grid */}
        <div className="grid gap-4 mb-6">
          {/* Chat Feature */}
          <Card 
            className="cursor-pointer hover:shadow-lg transition-all duration-200 bg-white/90 dark:bg-white/5 border-blue-300 dark:border-blue-500/30 hover:border-blue-500 dark:hover:border-blue-400 backdrop-blur-md"
            onClick={() => router.push('/wolfpack/chat')}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-gray-900 dark:text-white">
                <div className="p-3 bg-blue-100 dark:bg-blue-500/20 rounded-lg">
                  <MessageCircle className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                Pack Chat & Visualization
                <Badge variant="default" className="animate-pulse bg-green-500 text-white">LIVE</Badge>
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-300">
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
          <Card className="bg-white/90 dark:bg-white/5 border-green-300 dark:border-green-500/30 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-gray-900 dark:text-white">
                <div className="p-3 bg-green-100 dark:bg-green-500/20 rounded-lg">
                  <Users className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                Public Chat Channels
                <Badge variant="secondary" className="bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300">NEW</Badge>
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-300">
                Join public conversations with all Wolfpack members
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-white/10 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📍</span>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Salem Wolfpack</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Salem location • 5 active</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="border-gray-300 dark:border-white/30 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white bg-transparent">Join</Button>
                </div>
                
                <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-white/10 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📍</span>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Portland Wolfpack</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Portland location • 3 active</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="border-gray-300 dark:border-white/30 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white bg-transparent">Join</Button>
                </div>
                
                <div className="pt-2 border-t border-white/10">
                  <Button 
                    variant="ghost" 
                    className="w-full text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-white/10" 
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
              className="cursor-pointer hover:shadow-md transition-shadow bg-white/90 dark:bg-white/5 border-purple-300 dark:border-purple-500/30 hover:border-purple-500 dark:hover:border-purple-400 backdrop-blur-md"
              onClick={() => router.push('/profile')}
            >
              <CardContent className="p-4 text-center">
                <div className="p-3 bg-purple-100 dark:bg-purple-500/20 rounded-lg inline-block mb-2">
                  <Settings className="h-10 w-10 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="font-semibold mb-1 text-gray-900 dark:text-white">Wolf Profile</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Customize your pack persona and preferences
                </p>
              </CardContent>
            </Card>

            {/* Events */}
            <Card 
              className="cursor-pointer hover:shadow-md transition-shadow bg-white/90 dark:bg-white/5 border-green-300 dark:border-green-500/30 hover:border-green-500 dark:hover:border-green-400 backdrop-blur-md"
              onClick={() => router.push('/events')}
            >
              <CardContent className="p-4 text-center">
                <div className="p-3 bg-green-100 dark:bg-green-500/20 rounded-lg inline-block mb-2">
                  <Calendar className="h-10 w-10 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="font-semibold mb-1 text-gray-900 dark:text-white">Events & Contests</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Join DJ events, trivia, and competitions
                </p>
              </CardContent>
            </Card>

            {/* Menu */}
            <Card 
              className="cursor-pointer hover:shadow-md transition-shadow bg-white/90 dark:bg-white/5 border-orange-300 dark:border-orange-500/30 hover:border-orange-500 dark:hover:border-orange-400 backdrop-blur-md"
              onClick={() => router.push('/menu')}
            >
              <CardContent className="p-4 text-center">
                <div className="p-3 bg-orange-100 dark:bg-orange-500/20 rounded-lg inline-block mb-2">
                  <span className="text-4xl">🍽️</span>
                </div>
                <h3 className="font-semibold mb-1 text-gray-900 dark:text-white">Order Food & Drinks</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Browse menu and place orders
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Pack Status */}
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-gray-200 dark:border-white/10 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                <Users className="h-5 w-5" />
                Pack Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{packMemberCount}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Active Members</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">24/7</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Available</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">🎯</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Location Based</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">🔥</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Live Events</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Welcome Message */}
        <Alert className="bg-yellow-50 dark:bg-white/5 border-yellow-300 dark:border-yellow-500/30 backdrop-blur-md">
          <Star className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
          <AlertDescription className="text-gray-700 dark:text-gray-300">
            <strong className="text-gray-900 dark:text-white">Welcome to the Wolf Pack!</strong> Connect with other patrons, join events, and make your night memorable. 
            Start by checking out the live chat or updating your wolf profile.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}