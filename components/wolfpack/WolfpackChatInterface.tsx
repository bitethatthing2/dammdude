'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BackButton } from '@/components/shared/BackButton';
import { WolfpackSpatialView } from '@/components/wolfpack/WolfpackSpatialView';
import { WolfpackRealTimeChat } from '@/components/wolfpack/WolfpackRealTimeChat';
import { LiveEventsDisplay } from '@/components/wolfpack/LiveEventsDisplay';
import { MessageCircle, Users, Shield, Settings, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface WolfpackChatInterfaceProps {
  currentLocation: string;
  userId: string;
}

interface Location {
  id: string;
  name: string;
  address: string | null;
}

interface MembershipData {
  id: string;
  user_id: string;
  location_id: string | null;
  status: string | null;
  joined_at: string;
  last_active: string | null;
  table_location: string | null;
  position_x: number | null;
  position_y: number | null;
  is_active: boolean | null;
  display_name: string | null;
  avatar_url: string | null;
  locations?: Location | null;
}

export function WolfpackChatInterface({ currentLocation, userId }: WolfpackChatInterfaceProps) {
  const router = useRouter();
  const [locationId, setLocationId] = useState<string | null>(null);
  const [membershipData, setMembershipData] = useState<MembershipData | null>(null);
  const [activeTab, setActiveTab] = useState('chat');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);  // Get location and membership details
  useEffect(() => {
    async function loadLocationData() {
      setLoading(true);
      setError(null);
      
      try {
        // Get membership data from wolfpack_members_unified (the authoritative source)
        const { data: memberData, error: memberError } = await supabase
          .from("wolfpack_members_unified")
          .select(`
            id,
            user_id,
            location_id,
            status,
            joined_at,
            last_active,
            table_location,
            position_x,
            position_y,
            is_active,
            display_name,
            avatar_url,
            locations!location_id(
              id,
              name,
              address
            )
          `)
          .eq('user_id', userId)
          .eq('is_active', true)
          .order('last_active', { ascending: false })
          .limit(1);

        if (memberError) {
          throw new Error(`Failed to fetch membership data: ${memberError.message}`);
        }

        if (!memberData || memberData.length === 0) {
          throw new Error('No active wolfpack membership found');
        }

        const member = memberData[0];
        
        // Type-safe assignment with proper defaults
        const membershipData: MembershipData = {
          id: member.id,
          user_id: member.user_id,
          location_id: member.location_id,
          status: member.status || 'active',
          joined_at: member.joined_at,
          last_active: member.last_active,
          table_location: member.table_location,
          position_x: member.position_x,
          position_y: member.position_y,
          is_active: member.is_active ?? true,
          display_name: member.display_name,
          avatar_url: member.avatar_url,
          locations: member.locations || null
        };
        
        setLocationId(membershipData.location_id);
        setMembershipData(membershipData);

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error('Error loading location data:', error);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }

    if (userId) {
      loadLocationData();
    }
  }, [userId, supabase]);

  // Create a session ID for the chat (location-based)
  const sessionId = locationId ? `location_${locationId}` : null;

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading wolfpack data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="flex items-center gap-3 mb-6">
          <BackButton fallbackHref="/" className="mr-2" />
          <div className="p-2 bg-primary/10 rounded-lg">
            <MessageCircle className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Wolfpack Chat</h1>
            <p className="text-muted-foreground">Error loading wolfpack data</p>
          </div>
        </div>
        
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
        
        <div className="mt-4">
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!membershipData) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="flex items-center gap-3 mb-6">
          <BackButton fallbackHref="/" className="mr-2" />
          <div className="p-2 bg-primary/10 rounded-lg">
            <MessageCircle className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Wolfpack Chat</h1>
            <p className="text-muted-foreground">No active membership found</p>
          </div>
        </div>
        
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You don&#39;t have an active wolfpack membership. Please join a wolfpack session first.
          </AlertDescription>
        </Alert>
        
        <div className="mt-4">
          <Button onClick={() => router.push('/wolfpack')}>
            Join Wolfpack
          </Button>
        </div>
      </div>
    );
  }

  const locationName = membershipData.locations?.name || currentLocation;

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl bottom-nav-safe">
      <div className="flex items-center gap-3 mb-6">
        <BackButton fallbackHref="/" className="mr-2" />
        <div className="p-2 bg-primary/10 rounded-lg">
          <MessageCircle className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Wolfpack Chat</h1>
          <p className="text-muted-foreground">
            Connected to {locationName} • Active Pack Member
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="flex items-center gap-1">
            <Shield className="h-3 w-3" />
            {membershipData.status === 'active' ? 'Active Member' : (membershipData.status || 'Member')}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/wolfpack/profile')}
          >
            <Settings className="h-4 w-4 mr-2" />
            Profile
          </Button>
        </div>
      </div>

      {/* Membership Status Card */}
      <Card className="mb-6 border-green-200 bg-green-50">
        <CardContent className="pt-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="font-medium">Active in {locationName} Pack</span>
            </div>
            {membershipData.table_location && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <span>•</span>
                <span>Table: {membershipData.table_location}</span>
              </div>
            )}
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <span>•</span>
              <span>
                Joined: {new Date(membershipData.joined_at).toLocaleTimeString()}
              </span>
            </div>
            {membershipData.last_active && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <span>•</span>
                <span>
                  Last Active: {new Date(membershipData.last_active).toLocaleTimeString()}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Chat Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Pack Chat
          </TabsTrigger>
          <TabsTrigger value="events" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Live Events
          </TabsTrigger>
          <TabsTrigger value="members" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Wolfpack View
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="mt-6">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Pack Chat
                </CardTitle>
                <CardDescription>
                  Real-time chat with other pack members at {locationName}
                </CardDescription>
              </CardHeader>
            </Card>
            
            {sessionId && (
              <WolfpackRealTimeChat sessionId={sessionId} />
            )}
          </div>
        </TabsContent>

        <TabsContent value="events" className="mt-6">
          <div className="space-y-4">
            {locationId && (
              <LiveEventsDisplay 
                locationId={locationId}
                userId={userId}
              />
            )}
          </div>
        </TabsContent>

        <TabsContent value="members" className="mt-6">
          <div className="space-y-4">
            {locationId && (
              <WolfpackSpatialView 
                locationId={locationId}
                currentUserId={userId}
              />
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}