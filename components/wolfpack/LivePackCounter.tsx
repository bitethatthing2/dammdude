'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Users, Wifi, WifiOff } from 'lucide-react';

interface PackCounterProps {
  locationId?: string | null;
  className?: string;
  showLocation?: boolean;
  variant?: 'default' | 'compact' | 'badge';
}

interface PackMember {
  id: string;
  display_name: string;
  wolfpack_status: string;
  is_online: boolean;
  last_activity: string;
}

export default function LivePackCounter({ 
  locationId, 
  className = '',
  showLocation = false,
  variant = 'default'
}: PackCounterProps) {
  const [memberCount, setMemberCount] = useState<number>(0);
  const [onlineCount, setOnlineCount] = useState<number>(0);
  const [locationName, setLocationName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(true);
  const [members, setMembers] = useState<PackMember[]>([]);

  // Load pack member count
  useEffect(() => {
    async function loadPackCount() {
      try {
        setIsLoading(true);

        // Build query for active wolfpack members
        let query = supabase
          .from('users')
          .select(`
            id, 
            display_name, 
            first_name, 
            last_name,
            wolfpack_status, 
            is_online, 
            last_activity,
            location_id
          `)
          .eq('is_wolfpack_member', true)
          .eq('wolfpack_status', 'active');

        // Filter by location if provided
        if (locationId) {
          query = query.eq('location_id', locationId);
        }

        const { data: packMembers, error } = await query;

        if (error) {
          console.error('Error loading pack count:', error);
          setIsConnected(false);
          return;
        }

        // Process member data
        const processedMembers: PackMember[] = packMembers?.map(member => ({
          id: member.id,
          display_name: member.display_name || member.first_name || member.last_name || 'Pack Member',
          wolfpack_status: member.wolfpack_status,
          is_online: member.is_online || false,
          last_activity: member.last_activity || new Date().toISOString()
        })) || [];

        setMembers(processedMembers);
        setMemberCount(processedMembers.length);
        setOnlineCount(processedMembers.filter(m => m.is_online).length);
        setIsConnected(true);

        // Load location name if needed and provided
        if (locationId && showLocation) {
          const { data: location } = await supabase
            .from('locations')
            .select('name')
            .eq('id', locationId)
            .single();
          
          if (location) {
            setLocationName(location.name);
          }
        }

      } catch (error) {
        console.error('Error in loadPackCount:', error);
        setIsConnected(false);
      } finally {
        setIsLoading(false);
      }
    }

    loadPackCount();
  }, [locationId, showLocation]);

  // Set up real-time subscription for member count updates
  useEffect(() => {
    const channel = supabase
      .channel('pack-count-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users',
          filter: 'is_wolfpack_member=eq.true'
        },
        (payload) => {
          console.log('Pack member update:', payload);
          // Reload count on any wolfpack member changes
          loadPackCount();
        }
      )
      .subscribe();

    // Cleanup subscription
    return () => {
      supabase.removeChannel(channel);
    };
  }, [locationId]);

  // Reload count function for real-time updates
  const loadPackCount = async () => {
    try {
      let query = supabase
        .from('users')
        .select('id, is_online, wolfpack_status')
        .eq('is_wolfpack_member', true)
        .eq('wolfpack_status', 'active');

      if (locationId) {
        query = query.eq('location_id', locationId);
      }

      const { data } = await query;
      
      if (data) {
        setMemberCount(data.length);
        setOnlineCount(data.filter(m => m.is_online).length);
        setIsConnected(true);
      }
    } catch (error) {
      console.error('Error reloading pack count:', error);
      setIsConnected(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <div className="animate-pulse flex items-center gap-2">
          <Users className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-400">Loading...</span>
        </div>
      </div>
    );
  }

  // Render variants
  if (variant === 'badge') {
    return (
      <div className={`inline-flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium ${className}`}>
        <Users className="h-3 w-3" />
        <span>{memberCount}</span>
        {!isConnected && <WifiOff className="h-3 w-3 text-red-500" />}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <div className="flex items-center gap-1">
          <Users className="h-4 w-4 text-gray-600" />
          <span className="text-sm font-medium">{memberCount}</span>
        </div>
        {onlineCount > 0 && (
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs text-gray-500">{onlineCount} online</span>
          </div>
        )}
        {!isConnected && <WifiOff className="h-4 w-4 text-red-500" />}
      </div>
    );
  }

  // Default variant
  return (
    <div className={`inline-flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm border ${className}`}>
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
          <Users className="h-4 w-4 text-blue-600" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-gray-900">{memberCount}</span>
            <span className="text-sm text-gray-500">wolves</span>
          </div>
          {showLocation && locationName && (
            <div className="text-xs text-gray-400">
              at {locationName}
            </div>
          )}
        </div>
      </div>

      {/* Online indicator */}
      {onlineCount > 0 && (
        <div className="flex items-center gap-1 text-green-600">
          <Wifi className="h-4 w-4" />
          <span className="text-sm font-medium">{onlineCount} online</span>
        </div>
      )}

      {/* Connection status */}
      {!isConnected && (
        <div className="flex items-center gap-1 text-red-500">
          <WifiOff className="h-4 w-4" />
          <span className="text-xs">Offline</span>
        </div>
      )}

      {/* Live indicator */}
      {isConnected && memberCount > 0 && (
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs text-gray-500 font-medium">LIVE</span>
        </div>
      )}
    </div>
  );
}