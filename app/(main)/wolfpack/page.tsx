'use client';
import { supabase } from '@/lib/supabase/client';

import { useState, useEffect } from 'react';
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
  Loader2,
  AlertTriangle,
  Calendar,
  Heart,
  Music
} from 'lucide-react';
import { useRouter } from 'next/navigation';
interface WolfpackStatus {
  isInPack: boolean;
  membershipData: {
    id: string;
    location_id: string | null;
    location_name: string;
    joined_at: string;
    status: string;
  } | null;
}

// Simple auth hook
const useAuth = () => {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
    useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          setUser({ id: authUser.id, email: authUser.email });
        }
      } catch (error) {
        console.error('Auth error:', error);
      } finally {
        setIsLoading(false);
      }
    };
    getUser();
  }, [supabase]);

  return { user, isLoading };
};

// Local wolfpack hook
const useWolfpack = () => {
  const [wolfpackStatus, setWolfpackStatus] = useState<WolfpackStatus>({
    isInPack: false,
    membershipData: null
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { user } = useAuth();
  
  useEffect(() => {
    const checkWolfpackStatus = async () => {
      if (!user) {
        setWolfpackStatus({ isInPack: false, membershipData: null });
        setIsLoading(false);
        return;
      }

      try {
                // Check for active membership
        const { data: membership, error: membershipError } = await supabase
          .from('wolfpack_members_unified')
          .select(`
            id,
            location_id,
            joined_at,
            status,
            is_active
          `)
          .eq('user_id', user.id)
          .eq('is_active', true)
          .maybeSingle();

        if (membershipError) {
          console.error('Error checking membership:', membershipError);
          throw membershipError;
        }

        if (membership) {
          // Get location name if location_id exists
          let locationName = 'Unknown Location';
          if (membership.location_id) {
            try {
              const { data: location } = await supabase
                .from('locations')
                .select('name')
                .eq('id', membership.location_id)
                .single();
              
              if (location) {
                locationName = location.name;
              }
            } catch (err) {
              console.error('Error fetching location:', err);
            }
          }

          setWolfpackStatus({
            isInPack: true,
            membershipData: {
              id: membership.id,
              location_id: membership.location_id,
              location_name: locationName,
              joined_at: membership.joined_at,
              status: membership.status || 'active'
            }
          });
        } else {
          setWolfpackStatus({ isInPack: false, membershipData: null });
        }
      } catch (err) {
        console.error('Error checking wolfpack status:', err);
        setError('Failed to check wolfpack status');
        setWolfpackStatus({ isInPack: false, membershipData: null });
      } finally {
        setIsLoading(false);
      }
    };

    checkWolfpackStatus();
  }, [user]);

  return { ...wolfpackStatus, isLoading, error };
};

export default function WolfpackPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { isInPack, membershipData, isLoading: packLoading, error } = useWolfpack();
  
  const [stats, setStats] = useState({
    totalMembers: 0,
    activeNow: 0,
    eventsToday: 0
  });

  // Load wolfpack stats
  useEffect(() => {
    const loadStats = async () => {
      if (!isInPack) return;

      try {
                // Get member counts
        const { data: members, error: membersError } = await supabase
          .from('wolfpack_members_unified')
          .select('id, last_active')
          .eq('is_active', true);

        if (!membersError && members) {
          const now = new Date();
          const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
          
          const activeNow = members.filter(member => 
            member.last_active && new Date(member.last_active) > oneHourAgo
          ).length;

          setStats(prev => ({
            ...prev,
            totalMembers: members.length,
            activeNow
          }));
        }

        // Get today's events count
        const today = new Date().toISOString().split('T')[0];
        const { data: events, error: eventsError } = await supabase
          .from('dj_events')
          .select('id')
          .gte('created_at', `${today}T00:00:00`)
          .lt('created_at', `${today}T23:59:59`);

        if (!eventsError && events) {
          setStats(prev => ({
            ...prev,
            eventsToday: events.length
          }));
        }
      } catch (err) {
        console.error('Error loading stats:', err);
      }
    };

    loadStats();
  }, [isInPack]);

  if (authLoading || packLoading) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading Wolfpack...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto p-4 max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Authentication Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Please login to access the Wolfpack.
            </p>
            <Button onClick={() => router.push('/login')} className="w-full">
              Login to Continue
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 max-w-md">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button onClick={() => window.location.reload()} className="w-full">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!isInPack) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">🐺 Join the Wolf Pack</h1>
          <p className="text-xl text-muted-foreground">
            Connect with fellow night owls at Side Hustle Bar
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                What is the Wolf Pack?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                The Wolf Pack is an exclusive community for Side Hustle Bar patrons. 
                When you&#39;re at the bar, join the pack to:
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-primary" />
                  Chat with other pack members in real-time
                </li>
                <li className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  See who&#39;s at the bar and where they&#39;re sitting
                </li>
                <li className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  Join DJ events, contests, and trivia
                </li>
                <li className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-primary" />
                  Send winks and connect with other wolves
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Location Required
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                To join the Wolf Pack, you need to be physically present at Side Hustle Bar. 
                We use location verification to ensure an authentic experience.
              </p>
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-2">📍 Side Hustle Bar</h4>
                <p className="text-sm text-muted-foreground">
                  123 Main Street<br />
                  Downtown District<br />
                  Open 5PM - 2AM
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="text-center">
          <CardContent className="p-8">
            <div className="mb-6">
              <div className="text-6xl mb-4">🐺</div>
              <h2 className="text-2xl font-bold mb-2">Ready to Join the Pack?</h2>
              <p className="text-muted-foreground">
                Make sure you&#39;re at Side Hustle Bar, then tap the button below
              </p>
            </div>
            <Button 
              size="lg" 
              className="w-full md:w-auto"
              onClick={() => router.push('/wolfpack/welcome')}
            >
              <MapPin className="h-5 w-5 mr-2" />
              Enable Location & Join Pack
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // User is in the pack - show dashboard
  return (
    <div className="container mx-auto p-4 max-w-4xl">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4 flex items-center justify-center gap-3">
          🐺 Wolf Pack
          <Badge variant="secondary" className="text-lg px-3 py-1">
            {membershipData?.location_name || 'Active'}
          </Badge>
        </h1>
        <p className="text-xl text-muted-foreground">
          Welcome back to the pack, wolf! 🌙
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-primary mb-2">{stats.totalMembers}</div>
            <p className="text-sm text-muted-foreground">Total Pack Members</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">{stats.activeNow}</div>
            <p className="text-sm text-muted-foreground">Active Right Now</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">{stats.eventsToday}</div>
            <p className="text-sm text-muted-foreground">Events Today</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow border-blue-200 hover:border-blue-300"
          onClick={() => router.push('/wolfpack/chat')}
        >
          <CardContent className="p-6 text-center">
            <div className="p-3 bg-blue-100 rounded-full inline-block mb-4">
              <MessageCircle className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Pack Chat</h3>
            <p className="text-muted-foreground text-sm">
              Join the live conversation with other wolves
            </p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow border-green-200 hover:border-green-300"
          onClick={() => router.push('/wolfpack/members')}
        >
          <CardContent className="p-6 text-center">
            <div className="p-3 bg-green-100 rounded-full inline-block mb-4">
              <Users className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Pack Members</h3>
            <p className="text-muted-foreground text-sm">
              See who&#39;s here and connect with other wolves
            </p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow border-purple-200 hover:border-purple-300"
          onClick={() => router.push('/wolfpack/events')}
        >
          <CardContent className="p-6 text-center">
            <div className="p-3 bg-purple-100 rounded-full inline-block mb-4">
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Events & Games</h3>
            <p className="text-muted-foreground text-sm">
              Join DJ events, trivia, and contests
            </p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow border-orange-200 hover:border-orange-300"
          onClick={() => router.push('/menu')}
        >
          <CardContent className="p-6 text-center">
            <div className="p-3 bg-orange-100 rounded-full inline-block mb-4">
              <span className="text-2xl">🍽️</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">Order Food & Drinks</h3>
            <p className="text-muted-foreground text-sm">
              Browse the menu and place orders
            </p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow border-pink-200 hover:border-pink-300"
          onClick={() => router.push('/wolfpack/profile')}
        >
          <CardContent className="p-6 text-center">
            <div className="p-3 bg-pink-100 rounded-full inline-block mb-4">
              <span className="text-2xl">🐺</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">Wolf Profile</h3>
            <p className="text-muted-foreground text-sm">
              Customize your pack persona and preferences
            </p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow border-yellow-200 hover:border-yellow-300"
          onClick={() => router.push('/wolfpack/howl')}
        >
          <CardContent className="p-6 text-center">
            <div className="p-3 bg-yellow-100 rounded-full inline-block mb-4">
              <Music className="h-8 w-8 text-yellow-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Send a Howl</h3>
            <p className="text-muted-foreground text-sm">
              Broadcast a message to the entire pack
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pack Status */}
      {membershipData && (
        <Card>
          <CardHeader>
            <CardTitle>Your Pack Status</CardTitle>
            <CardDescription>Member since {new Date(membershipData.joined_at).toLocaleDateString()}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{membershipData.status}</Badge>
                  <span className="text-sm text-muted-foreground">
                    Location: {membershipData.location_name}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Joined the pack on {new Date(membershipData.joined_at).toLocaleDateString()}
                </p>
              </div>
              <Button 
                variant="outline"
                onClick={() => router.push('/wolfpack/settings')}
              >
                Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}