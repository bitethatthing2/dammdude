'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Gift, 
  Star, 
  Zap, 
  Trophy, 
  Target, 
  Users,
  Calendar,
  TrendingUp,
  Award,
  Crown,
  Heart,
  Share2,
  MessageCircle
} from 'lucide-react';

interface BusinessReward {
  id: string;
  business_id: string;
  business_name: string;
  business_avatar: string;
  title: string;
  description: string;
  type: 'discount' | 'freebie' | 'exclusive_access' | 'pack_dollars' | 'experience';
  value: number;
  pack_dollar_cost: number;
  requirements: {
    min_loyalty_level: number;
    min_pack_dollars: number;
    visit_count: number;
    referral_count: number;
    social_actions: number;
  };
  availability: {
    total_available: number;
    claimed: number;
    expires_at: string;
  };
  conditions: string[];
  created_at: string;
  active?: boolean;
  business?: {
    name: string;
    avatar_url: string;
    category: string;
  };
}

interface UserReward {
  id: string;
  reward_id: string;
  user_id: string;
  status: 'claimed' | 'redeemed' | 'expired';
  claimed_at: string;
  redeemed_at?: string;
  qr_code?: string;
}

interface BusinessRewardsSystemProps {
  currentUser: any;
  businessId?: string;
  onRewardClaimed?: (reward: BusinessReward) => void;
  className?: string;
}

export default function BusinessRewardsSystem({
  currentUser,
  businessId,
  onRewardClaimed,
  className = ''
}: BusinessRewardsSystemProps) {
  const [rewards, setRewards] = useState<BusinessReward[]>([]);
  const [userRewards, setUserRewards] = useState<UserReward[]>([]);
  const [userStats, setUserStats] = useState({
    pack_dollars: 0,
    loyalty_level: 1,
    total_rewards_claimed: 0,
    businesses_supported: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Load rewards and user data
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load available rewards
        const { data: rewardsData, error: rewardsError } = await supabase
          .from('business_rewards')
          .select(`
            *,
            business:businesses!business_rewards_business_id_fkey(
              name,
              avatar_url,
              category
            )
          `)
          .eq('active', true)
          .order('created_at', { ascending: false });

        if (rewardsError) {
          console.error('Error loading rewards:', rewardsError);
        } else {
          // Transform data to match our interface
          const transformedRewards = (rewardsData || []).map((reward: any) => ({
            ...reward,
            business_name: reward.business?.name || 'Unknown Business',
            business_avatar: reward.business?.avatar_url || '/default-business-avatar.png'
          }));
          setRewards(transformedRewards);
        }

        // Load user's claimed rewards
        if (currentUser) {
          const { data: userRewardsData, error: userRewardsError } = await supabase
            .from('user_rewards')
            .select('*')
            .eq('user_id', currentUser.id);

          if (userRewardsError) {
            console.error('Error loading user rewards:', userRewardsError);
          } else {
            setUserRewards(userRewardsData || []);
          }

          // Load user stats
          const { data: userStatsData, error: userStatsError } = await supabase
            .from('user_business_stats')
            .select('*')
            .eq('user_id', currentUser.id)
            .single();

          if (userStatsError && userStatsError.code !== 'PGRST116') {
            console.error('Error loading user stats:', userStatsError);
          } else if (userStatsData) {
            setUserStats(userStatsData);
          }
        }
      } catch (error) {
        console.error('Error loading rewards data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [currentUser]);

  // Claim reward
  const claimReward = async (reward: BusinessReward) => {
    if (!currentUser) return;

    try {
      // Check if user meets requirements
      if (!meetsRequirements(reward)) {
        console.log('User does not meet requirements');
        return;
      }

      // Check if user has enough Pack Dollars
      if (userStats.pack_dollars < reward.pack_dollar_cost) {
        console.log('Not enough Pack Dollars');
        return;
      }

      // Create claimed reward
      const { data, error } = await supabase
        .from('user_rewards')
        .insert([{
          reward_id: reward.id,
          user_id: currentUser.id,
          status: 'claimed',
          claimed_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error('Error claiming reward:', error);
        return;
      }

      // Deduct Pack Dollars
      const { error: deductError } = await supabase
        .from('pack_dollar_transactions')
        .insert([{
          user_id: currentUser.id,
          type: 'spend',
          amount: reward.pack_dollar_cost,
          source: 'business_reward',
          description: `Claimed: ${reward.title}`,
          metadata: { reward_id: reward.id, business_id: reward.business_id }
        }]);

      if (deductError) {
        console.error('Error deducting Pack Dollars:', deductError);
      }

      // Update local state
      setUserRewards(prev => [...prev, data]);
      setUserStats(prev => ({
        ...prev,
        pack_dollars: prev.pack_dollars - reward.pack_dollar_cost,
        total_rewards_claimed: prev.total_rewards_claimed + 1
      }));

      // Update reward availability
      setRewards(prev => prev.map(r => 
        r.id === reward.id 
          ? { ...r, availability: { ...r.availability, claimed: r.availability.claimed + 1 } }
          : r
      ));

      if (onRewardClaimed) {
        onRewardClaimed(reward);
      }
    } catch (error) {
      console.error('Error claiming reward:', error);
    }
  };

  // Check if user meets requirements
  const meetsRequirements = (reward: BusinessReward): boolean => {
    const requirements = reward.requirements;
    
    return (
      userStats.loyalty_level >= requirements.min_loyalty_level &&
      userStats.pack_dollars >= requirements.min_pack_dollars
    );
  };

  // Get reward type info
  const getRewardTypeInfo = (type: string) => {
    const types = {
      discount: { color: 'bg-green-600', icon: <Target className="w-4 h-4" />, label: 'Discount' },
      freebie: { color: 'bg-blue-600', icon: <Gift className="w-4 h-4" />, label: 'Freebie' },
      exclusive_access: { color: 'bg-purple-600', icon: <Crown className="w-4 h-4" />, label: 'Exclusive' },
      pack_dollars: { color: 'bg-yellow-600', icon: <Zap className="w-4 h-4" />, label: 'Pack Dollars' },
      experience: { color: 'bg-orange-600', icon: <Star className="w-4 h-4" />, label: 'Experience' }
    };
    return types[type as keyof typeof types] || types.discount;
  };

  // Filter rewards by category
  const filteredRewards = rewards.filter(reward => {
    if (selectedCategory === 'all') return true;
    return reward.type === selectedCategory;
  });

  // Check if reward is claimed by user
  const isRewardClaimed = (rewardId: string) => {
    return userRewards.some(ur => ur.reward_id === rewardId);
  };

  // Get availability percentage
  const getAvailabilityPercentage = (reward: BusinessReward) => {
    return ((reward.availability.total_available - reward.availability.claimed) / reward.availability.total_available) * 100;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Business Rewards</h2>
              <p className="text-gray-600">Earn and redeem rewards from local businesses</p>
            </div>
          </div>
        </div>
      </div>

      {/* User Stats */}
      <div className="p-6 bg-gray-50">
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{userStats.pack_dollars}</div>
            <div className="text-sm text-gray-500">Pack Dollars</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{userStats.loyalty_level}</div>
            <div className="text-sm text-gray-500">Loyalty Level</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{userStats.total_rewards_claimed}</div>
            <div className="text-sm text-gray-500">Rewards Claimed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{userStats.businesses_supported}</div>
            <div className="text-sm text-gray-500">Businesses Supported</div>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory('all')}
          >
            All Rewards
          </Button>
          {['discount', 'freebie', 'exclusive_access', 'pack_dollars', 'experience'].map(type => {
            const typeInfo = getRewardTypeInfo(type);
            return (
              <Button
                key={type}
                variant={selectedCategory === type ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(type)}
                className={selectedCategory === type ? typeInfo.color : ''}
              >
                {typeInfo.icon}
                <span className="ml-1">{typeInfo.label}</span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Rewards Grid */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRewards.map((reward) => {
            const typeInfo = getRewardTypeInfo(reward.type);
            const availabilityPercentage = getAvailabilityPercentage(reward);
            const isClaimed = isRewardClaimed(reward.id);
            const canClaim = meetsRequirements(reward) && !isClaimed;

            return (
              <Card key={reward.id} className="border-l-4 border-l-purple-500 hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={reward.business_avatar || '/default-business-avatar.png'}
                        alt={reward.business_name || 'Business'}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div>
                        <div className="font-medium text-gray-900">{reward.business_name || 'Unknown Business'}</div>
                        <div className="text-sm text-gray-500">{reward.title}</div>
                      </div>
                    </div>
                    <Badge className={`${typeInfo.color} text-white`}>
                      {typeInfo.icon}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <p className="text-gray-600 text-sm mb-3">{reward.description}</p>
                  
                  {/* Value & Cost */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-green-600">
                        {reward.type === 'discount' ? `${reward.value}% OFF` : 
                         reward.type === 'pack_dollars' ? `${reward.value} Pack Dollars` :
                         `$${reward.value} Value`}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Zap className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm font-medium">{reward.pack_dollar_cost}</span>
                    </div>
                  </div>

                  {/* Availability */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                      <span>Availability</span>
                      <span>{reward.availability.total_available - reward.availability.claimed} left</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-green-500 to-yellow-500 h-2 rounded-full"
                        style={{ width: `${availabilityPercentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Requirements */}
                  <div className="mb-4">
                    <div className="text-xs text-gray-500 mb-1">Requirements:</div>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline" className="text-xs">
                        Level {reward.requirements.min_loyalty_level}+
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {reward.requirements.min_pack_dollars} Pack Dollars
                      </Badge>
                    </div>
                  </div>

                  {/* Action */}
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => claimReward(reward)}
                      disabled={!canClaim || userStats.pack_dollars < reward.pack_dollar_cost}
                      className={`flex-1 ${canClaim ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gray-400'}`}
                    >
                      {isClaimed ? (
                        <>
                          <Award className="w-4 h-4 mr-2" />
                          Claimed
                        </>
                      ) : (
                        <>
                          <Gift className="w-4 h-4 mr-2" />
                          Claim
                        </>
                      )}
                    </Button>
                    
                    <Button variant="outline" size="sm">
                      <Heart className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}