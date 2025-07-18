'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useConsistentAuth } from '@/lib/hooks/useConsistentAuth';
import { useWolfpack } from '@/hooks/useWolfpack';
import BusinessCollaborationHub from '@/components/business/BusinessCollaborationHub';
import BusinessRewardsSystem from '@/components/business/BusinessRewardsSystem';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Trophy, 
  TrendingUp, 
  Users,
  DollarSign,
  Target,
  Award,
  Building,
  ArrowLeft,
  Sparkles,
  Zap
} from 'lucide-react';

export default function BusinessCollaborationPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useConsistentAuth();
  const { isInPack, isLoading: packLoading } = useWolfpack();
  
  const [activeTab, setActiveTab] = useState('hub');
  const [collaborationStats, setCollaborationStats] = useState({
    totalCollaborations: 0,
    activePartnerships: 0,
    packDollarsGenerated: 0,
    businessesConnected: 0
  });

  const isLoading = authLoading || packLoading;

  // Mock stats for demonstration
  useEffect(() => {
    setCollaborationStats({
      totalCollaborations: 15,
      activePartnerships: 8,
      packDollarsGenerated: 2750,
      businessesConnected: 23
    });
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading business collaboration tools...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Authentication Required</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">Please login to access business collaboration features.</p>
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-center flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Join the Wolf Pack
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">
              Access to business collaboration tools requires Wolf Pack membership.
            </p>
            <Button onClick={() => router.push('/wolfpack')} className="w-full">
              Join Wolf Pack
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Building className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Business Collaboration</h1>
                  <p className="text-gray-600">Connect, collaborate, and grow with Salem businesses</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge className="bg-green-100 text-green-800">
                {collaborationStats.activePartnerships} Active
              </Badge>
              <Badge className="bg-blue-100 text-blue-800">
                {collaborationStats.businessesConnected} Connected
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {collaborationStats.totalCollaborations}
                  </div>
                  <div className="text-sm text-gray-500">Total Collaborations</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {collaborationStats.activePartnerships}
                  </div>
                  <div className="text-sm text-gray-500">Active Partnerships</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Zap className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {collaborationStats.packDollarsGenerated.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500">Pack Dollars Generated</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {collaborationStats.businessesConnected}
                  </div>
                  <div className="text-sm text-gray-500">Businesses Connected</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white mb-6">
            <TabsTrigger value="hub" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Collaboration Hub
            </TabsTrigger>
            <TabsTrigger value="rewards" className="flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              Rewards System
            </TabsTrigger>
          </TabsList>

          <TabsContent value="hub" className="space-y-6">
            <BusinessCollaborationHub
              currentUser={user}
              onCollaborationCreated={(collaboration) => {
                console.log('New collaboration created:', collaboration);
                // Update stats or show notification
              }}
            />
          </TabsContent>

          <TabsContent value="rewards" className="space-y-6">
            <BusinessRewardsSystem
              currentUser={user}
              onRewardClaimed={(reward) => {
                console.log('Reward claimed:', reward);
                // Update stats or show notification
              }}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}