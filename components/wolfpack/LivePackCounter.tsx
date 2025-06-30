'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, TrendingUp, MapPin } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

interface LivePackCounterProps {
  locationId?: string;
}

interface WolfPackStats {
  totalMembers: number;
  activeMembers: number;
  locationName: string;
}

export function LivePackCounter({ locationId }: LivePackCounterProps) {
  const [stats, setStats] = useState<WolfPackStats>({
    totalMembers: 0,
    activeMembers: 0,
    locationName: 'All Locations'
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        setIsLoading(true);
        
        // Fetch total members
        let totalQuery = supabase
          .from("wolf_pack_members")
          .select('id', { count: 'exact' });
        
        // Handle location filter correctly - avoid NULL query issues
        if (locationId === null || locationId === undefined) {
          totalQuery = totalQuery.is('location_id', null);
        } else if (locationId) {
          totalQuery = totalQuery.eq('location_id', locationId);
        }
        
        const { count: totalCount } = await totalQuery;
        
        // Fetch active members
        let activeQuery = supabase
          .from("wolf_pack_members")
          .select('id', { count: 'exact' })
          .eq('status', 'active');
        
        // Handle location filter correctly for active query too
        if (locationId === null || locationId === undefined) {
          activeQuery = activeQuery.is('location_id', null);
        } else if (locationId) {
          activeQuery = activeQuery.eq('location_id', locationId);
        }
        
        const { count: activeCount } = await activeQuery;
        
        // Fetch location name if specific location
        let locationName = 'All Locations';
        if (locationId) {
          const { data: locationData } = await supabase
            .from('locations')
            .select('name')
            .eq('id', locationId)
            .single();
          
          if (locationData) {
            locationName = locationData.name;
          }
        }
        
        setStats({
          totalMembers: totalCount || 0,
          activeMembers: activeCount || 0,
          locationName
        });
      } catch (error) {
        console.error('Error fetching pack stats:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStats();

    // Set up real-time subscriptions
    const subscription = supabase
      .channel('pack_stats')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'wolfpack_memberships'
      }, () => {
        fetchStats();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [locationId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-700 rounded w-32"></div>
          <div className="h-12 bg-gray-700 rounded w-24"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl p-6 border border-gray-800">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-orange-500" />
          <h3 className="text-lg font-semibold text-white">Wolf Pack Stats</h3>
        </div>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          style={{ width: '0.5rem', height: '0.5rem', backgroundColor: '#22c55e', borderRadius: '9999px' }}
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        {/* Total Members */}
        <div className="bg-gray-800/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-gray-400" />
            <p className="text-sm text-gray-400">Total Pack</p>
          </div>
          <motion.div
            key={stats.totalMembers}
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 10 }}
          >
            <span className="text-4xl font-extrabold text-white">{stats.totalMembers}</span>
          </motion.div>
        </div>
        
        {/* Active Members */}
        <div className="bg-gray-800/50 rounded-lg p-4 relative overflow-hidden">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <p className="text-sm text-gray-400">Active Now</p>
          </div>
          <div className="relative">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <span className="text-3xl font-bold text-orange-500">{stats.activeMembers}</span>
            </motion.div>
            {stats.activeMembers > 0 && (
              <motion.div
                style={{ position: "absolute", inset: 0, zIndex: -10 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <motion.div
                  style={{ width: '100%', height: '100%' }}
                  animate={{ 
                    scale: [1, 1.5, 1],
                    opacity: [0.5, 0.2, 0.5]
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <div className="w-full h-full bg-orange-500/20 rounded-full blur-lg" />
                </motion.div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
      
      {/* Location Info */}
      <div className="mt-4 pt-4 border-t border-gray-800">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <MapPin className="h-4 w-4" />
          <span>{stats.locationName}</span>
        </div>
      </div>
      
      {/* Growth Indicator */}
      {stats.totalMembers > 0 && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>Pack Activity</span>
            <span>{Math.round((stats.activeMembers / stats.totalMembers) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
            <motion.div
              style={{
                height: '100%',
                background: 'linear-gradient(to right, #f97316, #ef4444)',
                borderRadius: '9999px'
              }}
              initial={{ width: 0 }}
              animate={{ width: `${(stats.activeMembers / stats.totalMembers) * 100}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </div>
      )}
    </div>
  );
}