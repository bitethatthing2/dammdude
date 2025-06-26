"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BackButton } from '@/components/shared/BackButton';
import { WolfpackSpatialView } from '@/components/wolfpack/WolfpackSpatialView';
import { WolfpackRealTimeChat } from '@/components/wolfpack/WolfpackRealTimeChat';
import { LiveEventsDisplay } from '@/components/wolfpack/LiveEventsDisplay';
import { MessageCircle, Users, Shield, Settings } from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface WolfpackChatInterfaceProps {
  currentLocation: string;
  userId: string;
}

interface MembershipData {
  id: string;
  location_id: string | null;
  table_location: string | null;
  joined_at: string | null;
  locations: {
    id: string;
    name: string;
    address: string | null;
  };
}

export function WolfpackChatInterface({ currentLocation, userId }: WolfpackChatInterfaceProps) {
  const router = useRouter();
  const [locationId, setLocationId] = useState<string | null>(null);
  const [membershipData, setMembershipData] = useState<MembershipData | null>(null);
  const [activeTab, setActiveTab] = useState('chat');

  const supabase = getSupabaseBrowserClient();

  // Get location and membership details
  useEffect(() => {
    async function loadLocationData() {
      try {
        // Get location ID and membership data
        const { data: memberData, error } = await supabase
          .from('wolfpack_memberships')
          .select(`
            id,
            location_id,
            table_location,
            joined_at,
            locations!inner(
              id,
              name,
              address
            )
          `)
          .eq('user_id', userId)
          .eq('status', 'active')
          .single();

        if (error) throw error;

        setLocationId(memberData.location_id);
        setMembershipData(memberData);
      } catch (error) {
        console.error('Error loading location data:', error);
      }
    }

    loadLocationData();
  }, [userId, supabase]);

  // Create a session ID for the chat (location-based)
  const sessionId = locationId ? `location_${locationId}` : null;

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
            Connected to {currentLocation} • Active Pack Member
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="flex items-center gap-1">
            <Shield className="h-3 w-3" />
            Verified Member
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
      {membershipData && (
        <Card className="mb-6 border-green-200 bg-green-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="font-medium">Active in {currentLocation} Pack</span>
              </div>
              {membershipData.table_location && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <span>•</span>
                  <span>Table: {membershipData.table_location}</span>
                </div>
              )}
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <span>•</span>
                <span>Joined: {membershipData.joined_at ? new Date(membershipData.joined_at).toLocaleTimeString() : 'Unknown'}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
                  Real-time chat with other pack members at {currentLocation}
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
