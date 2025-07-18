'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Calendar, 
  DollarSign, 
  Star,
  MessageCircle,
  Send,
  Plus,
  Award,
  TrendingUp,
  Target,
  Zap,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  Info,
  Activity,
  X
} from 'lucide-react';

interface BusinessCollaboration {
  id: string;
  title: string;
  description: string;
  type: 'cross_promotion' | 'event_partnership' | 'pack_dollars' | 'joint_venture' | 'resource_sharing';
  status: 'proposed' | 'active' | 'completed' | 'cancelled';
  initiator_business: {
    id: string;
    name: string;
    category: string;
    avatar_url: string;
  };
  partner_business: {
    id: string;
    name: string;
    category: string;
    avatar_url: string;
  };
  details: {
    start_date: string;
    end_date: string;
    pack_dollar_pool: number;
    expected_participants: number;
    benefits: string[];
    requirements: string[];
  };
  metrics: {
    participants_joined: number;
    pack_dollars_earned: number;
    engagement_rate: number;
    satisfaction_score: number;
  };
  messages: Array<{
    id: string;
    sender_id: string;
    sender_name: string;
    content: string;
    created_at: string;
  }>;
  created_at: string;
}

interface BusinessCollaborationHubProps {
  currentUser: any;
  businessId?: string;
  onCollaborationCreated?: (collaboration: BusinessCollaboration) => void;
  className?: string;
}

export default function BusinessCollaborationHub({
  currentUser,
  businessId,
  onCollaborationCreated,
  className = ''
}: BusinessCollaborationHubProps) {
  const [activeTab, setActiveTab] = useState('opportunities');
  const [collaborations, setCollaborations] = useState<BusinessCollaboration[]>([]);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [proposals, setProposals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Load collaborations and businesses
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load existing collaborations
        const { data: collabData, error: collabError } = await supabase
          .from('business_collaborations')
          .select(`
            *,
            initiator:businesses!business_collaborations_initiator_id_fkey(*),
            partner:businesses!business_collaborations_partner_id_fkey(*),
            messages:collaboration_messages(*)
          `)
          .order('created_at', { ascending: false });

        if (collabError) {
          console.error('Error loading collaborations:', collabError);
        } else {
          setCollaborations(collabData || []);
        }

        // Load businesses for partnerships (fallback to empty since table doesn't exist)
        try {
          const { data: businessData, error: businessError } = await supabase
            .from('businesses')
            .select('*')
            .eq('active', true)
            .order('name');

          if (businessError) {
            console.log('businesses table not found, using empty array');
            setBusinesses([]);
          } else {
            setBusinesses(businessData || []);
          }
        } catch (error) {
          console.log('businesses table not found, using empty array');
          setBusinesses([]);
        }

        // Load collaboration proposals
        const { data: proposalData, error: proposalError } = await supabase
          .from('collaboration_proposals')
          .select(`
            *,
            proposer:businesses!collaboration_proposals_proposer_id_fkey(*),
            target:businesses!collaboration_proposals_target_id_fkey(*)
          `)
          .eq('status', 'pending')
          .order('created_at', { ascending: false });

        if (proposalError) {
          console.error('Error loading proposals:', proposalError);
        } else {
          setProposals(proposalData || []);
        }
      } catch (error) {
        console.error('Error loading collaboration data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Create new collaboration
  const createCollaboration = async (collaborationData: any) => {
    try {
      const { data, error } = await supabase
        .from('business_collaborations')
        .insert([{
          ...collaborationData,
          initiator_id: businessId,
          status: 'proposed',
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating collaboration:', error);
        return;
      }

      setCollaborations(prev => [data, ...prev]);
      
      if (onCollaborationCreated) {
        onCollaborationCreated(data);
      }
      
      setShowCreateForm(false);
    } catch (error) {
      console.error('Error creating collaboration:', error);
    }
  };

  // Join collaboration
  const joinCollaboration = async (collaborationId: string) => {
    try {
      const { error } = await supabase
        .from('collaboration_participants')
        .insert([{
          collaboration_id: collaborationId,
          user_id: currentUser.id,
          joined_at: new Date().toISOString()
        }]);

      if (error) {
        console.error('Error joining collaboration:', error);
        return;
      }

      // Update local state
      setCollaborations(prev => prev.map(collab => 
        collab.id === collaborationId 
          ? { ...collab, metrics: { ...collab.metrics, participants_joined: collab.metrics.participants_joined + 1 } }
          : collab
      ));
    } catch (error) {
      console.error('Error joining collaboration:', error);
    }
  };

  // Get collaboration type color
  const getCollaborationType = (type: string) => {
    const types = {
      cross_promotion: { color: 'bg-blue-600', icon: <TrendingUp className="w-4 h-4" />, label: 'Cross Promotion' },
      event_partnership: { color: 'bg-green-600', icon: <Calendar className="w-4 h-4" />, label: 'Event Partnership' },
      pack_dollars: { color: 'bg-yellow-600', icon: <DollarSign className="w-4 h-4" />, label: 'Pack Dollars' },
      joint_venture: { color: 'bg-purple-600', icon: <Users className="w-4 h-4" />, label: 'Joint Venture' },
      resource_sharing: { color: 'bg-orange-600', icon: <Users className="w-4 h-4" />, label: 'Resource Sharing' }
    };
    return types[type as keyof typeof types] || types.cross_promotion;
  };

  // Get status color
  const getStatusColor = (status: string) => {
    const colors = {
      proposed: 'bg-yellow-600',
      active: 'bg-green-600',
      completed: 'bg-blue-600',
      cancelled: 'bg-red-600'
    };
    return colors[status as keyof typeof colors] || colors.proposed;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Business Collaboration Hub</h2>
              <p className="text-gray-600">Connect, collaborate, and grow together</p>
            </div>
          </div>
          
          <Button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Collaboration
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-gray-50 mx-6 mt-4">
          <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="proposals">Proposals</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="opportunities" className="p-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Available Opportunities</h3>
            
            {collaborations.filter(c => c.status === 'proposed').map((collaboration) => {
              const typeInfo = getCollaborationType(collaboration.type);
              
              return (
                <Card key={collaboration.id} className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <img
                            src={collaboration.initiator_business.avatar_url}
                            alt={collaboration.initiator_business.name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <span className="font-medium text-gray-900">
                            {collaboration.initiator_business.name}
                          </span>
                        </div>
                        <div className="text-gray-400">×</div>
                        <div className="flex items-center gap-2">
                          <img
                            src={collaboration.partner_business.avatar_url}
                            alt={collaboration.partner_business.name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <span className="font-medium text-gray-900">
                            {collaboration.partner_business.name}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge className={`${typeInfo.color} text-white`}>
                          {typeInfo.icon}
                          <span className="ml-1">{typeInfo.label}</span>
                        </Badge>
                        <Badge className={`${getStatusColor(collaboration.status)} text-white`}>
                          {collaboration.status.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                    
                    <CardTitle className="text-lg">{collaboration.title}</CardTitle>
                  </CardHeader>
                  
                  <CardContent>
                    <p className="text-gray-600 mb-4">{collaboration.description}</p>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          {new Date(collaboration.details.start_date).toLocaleDateString()} - 
                          {new Date(collaboration.details.end_date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          {collaboration.metrics.participants_joined} / {collaboration.details.expected_participants} participants
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-yellow-500" />
                        <span className="text-sm text-gray-600">
                          {collaboration.details.pack_dollar_pool} Pack Dollars
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-gray-600">
                          {collaboration.metrics.engagement_rate}% engagement
                        </span>
                      </div>
                    </div>
                    
                    {/* Benefits */}
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900 mb-2">Benefits:</h4>
                      <div className="flex flex-wrap gap-2">
                        {collaboration.details.benefits.map((benefit, index) => (
                          <Badge key={index} variant="outline" className="text-green-600 border-green-600">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            {benefit}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    {/* Requirements */}
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900 mb-2">Requirements:</h4>
                      <div className="flex flex-wrap gap-2">
                        {collaboration.details.requirements.map((requirement, index) => (
                          <Badge key={index} variant="outline" className="text-orange-600 border-orange-600">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            {requirement}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Button
                        onClick={() => joinCollaboration(collaboration.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Users className="w-4 h-4 mr-2" />
                        Join Collaboration
                      </Button>
                      <Button variant="outline">
                        <Info className="w-4 h-4 mr-2" />
                        Learn More
                      </Button>
                      <Button variant="outline">
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Contact ({collaboration.messages.length})
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="active" className="p-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Active Collaborations</h3>
            
            {collaborations.filter(c => c.status === 'active').map((collaboration) => {
              const typeInfo = getCollaborationType(collaboration.type);
              
              return (
                <Card key={collaboration.id} className="border-l-4 border-l-green-500">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {typeInfo.icon}
                        {collaboration.title}
                      </CardTitle>
                      <Badge className="bg-green-600 text-white">
                        ACTIVE
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="grid grid-cols-4 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {collaboration.metrics.participants_joined}
                        </div>
                        <div className="text-sm text-gray-500">Participants</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">
                          {collaboration.metrics.pack_dollars_earned}
                        </div>
                        <div className="text-sm text-gray-500">Pack Dollars</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {collaboration.metrics.engagement_rate}%
                        </div>
                        <div className="text-sm text-gray-500">Engagement</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {collaboration.metrics.satisfaction_score}
                        </div>
                        <div className="text-sm text-gray-500">Satisfaction</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Button className="bg-blue-600 hover:bg-blue-700">
                        <Activity className="w-4 h-4 mr-2" />
                        View Dashboard
                      </Button>
                      <Button variant="outline">
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Messages
                      </Button>
                      <Button variant="outline">
                        <Award className="w-4 h-4 mr-2" />
                        Rewards
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="proposals" className="p-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Collaboration Proposals</h3>
            
            {proposals.map((proposal) => (
              <Card key={proposal.id} className="border-l-4 border-l-yellow-500">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{proposal.title}</CardTitle>
                    <Badge className="bg-yellow-600 text-white">
                      PENDING
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <p className="text-gray-600 mb-4">{proposal.description}</p>
                  
                  <div className="flex items-center gap-3">
                    <Button className="bg-green-600 hover:bg-green-700">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Accept
                    </Button>
                    <Button variant="outline" className="text-red-600 border-red-600">
                      <X className="w-4 h-4 mr-2" />
                      Decline
                    </Button>
                    <Button variant="outline">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Discuss
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="p-6">
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Collaboration Analytics</h3>
            
            <div className="grid grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Total Collaborations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{collaborations.length}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Pack Dollars Generated</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">
                    {collaborations.reduce((sum, c) => sum + c.metrics.pack_dollars_earned, 0)}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Average Engagement</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {Math.round(collaborations.reduce((sum, c) => sum + c.metrics.engagement_rate, 0) / collaborations.length || 0)}%
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}