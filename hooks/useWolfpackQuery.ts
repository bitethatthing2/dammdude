import { useState, useCallback } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { 
  WolfProfile, 
  WolfpackMembershipWithProfile, 
  createDefaultWolfProfile, 
  transformMembershipData 
} from '@/types/wolfpack-interfaces';

export const useWolfpackQuery = () => {
  const [isUsingFallback, setIsUsingFallback] = useState(false);
  const supabase = getSupabaseBrowserClient();

  const queryWolfpackMembers = useCallback(async (filters: Record<string, string | number | boolean | null> = {}) => {
    try {
      // Try primary query first
      let query = supabase
        .from('wolfpack_memberships')
        .select(`
          *,
          user:users (
            *,
            wolf_profile:wolf_profiles (*)
          ),
          locations (
            id,
            name,
            address
          )
        `);

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value === null) {
          query = query.is(key, null);
        } else {
          query = query.eq(key, value);
        }
      });

      const { data, error } = await query;

      // Check for relationship errors (wolf_profiles table might not exist or have proper relationships)
      if (error?.code === 'PGRST200' || error?.message?.includes('wolf_profiles')) {
        console.warn('Wolf profiles relationship not found, using fallback');
        setIsUsingFallback(true);
        
        // Fallback query without wolf_profiles
        let fallbackQuery = supabase
          .from('wolfpack_memberships')
          .select(`
            *,
            user:users (*),
            locations (
              id,
              name,
              address
            )
          `);

        Object.entries(filters).forEach(([key, value]) => {
          if (value === null) {
            fallbackQuery = fallbackQuery.is(key, null);
          } else {
            fallbackQuery = fallbackQuery.eq(key, value);
          }
        });

        const { data: fallbackData, error: fallbackError } = await fallbackQuery;
        
        if (fallbackError) throw fallbackError;
        
        // Transform data with defaults
        return {
          data: fallbackData?.map(transformMembershipData) || [],
          error: null,
          isUsingFallback: true
        };
      }

      if (error) throw error;

      return { 
        data: data || [], 
        error: null, 
        isUsingFallback: false 
      };
    } catch (error) {
      console.error('Error querying wolfpack members:', error);
      return { 
        data: null, 
        error, 
        isUsingFallback 
      };
    }
  }, [supabase]);

  const queryUserMembership = useCallback(async (userId: string) => {
    try {
      // Try primary query first
      const query = supabase
        .from('wolfpack_memberships')
        .select(`
          *,
          user:users (
            *,
            wolf_profile:wolf_profiles (*)
          ),
          locations (
            id,
            name,
            address
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle();

      const { data, error } = await query;

      if (error?.code === 'PGRST200' || error?.message?.includes('wolf_profiles')) {
        console.warn('Wolf profiles relationship not found, using fallback for user membership');
        setIsUsingFallback(true);
        
        // Fallback query
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('wolfpack_memberships')
          .select(`
            *,
            user:users (*),
            locations (
              id,
              name,
              address
            )
          `)
          .eq('user_id', userId)
          .eq('status', 'active')
          .maybeSingle();
        
        if (fallbackError) throw fallbackError;
        
        return {
          data: fallbackData ? transformMembershipData(fallbackData) : null,
          error: null,
          isUsingFallback: true
        };
      }

      if (error) throw error;

      return { 
        data: data ? transformMembershipData(data) : null, 
        error: null, 
        isUsingFallback: false 
      };
    } catch (error) {
      console.error('Error querying user membership:', error);
      return { 
        data: null, 
        error, 
        isUsingFallback 
      };
    }
  }, [supabase]);

  return { 
    queryWolfpackMembers, 
    queryUserMembership, 
    isUsingFallback 
  };
};
