import { useState, useEffect } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

interface WolfpackStatus {
  isLoading: boolean;
  isWolfpackMember: boolean;
  isLocationVerified: boolean;
  error?: string;
}

export function useWolfpackStatus(): WolfpackStatus {
  const [status, setStatus] = useState<WolfpackStatus>({
    isLoading: true,
    isWolfpackMember: false,
    isLocationVerified: false,
  });

  useEffect(() => {
    async function checkWolfpackStatus() {
      try {
        const supabase = getSupabaseBrowserClient();
        
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          throw userError;
        }

        if (!user) {
          // Not logged in, check location verification for guest access
          const isLocationVerified = localStorage.getItem('location_verified') === 'true';
          setStatus({
            isLoading: false,
            isWolfpackMember: false,
            isLocationVerified,
          });
          return;
        }

        // Check if user is a Wolfpack member
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('is_wolfpack_member')
          .eq('user_id', user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          throw profileError;
        }

        const isWolfpackMember = profile?.is_wolfpack_member || false;
        const isLocationVerified = isWolfpackMember || localStorage.getItem('location_verified') === 'true';

        setStatus({
          isLoading: false,
          isWolfpackMember,
          isLocationVerified,
        });

      } catch (error) {
        console.error('Error checking Wolfpack status:', error);
        setStatus({
          isLoading: false,
          isWolfpackMember: false,
          isLocationVerified: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    checkWolfpackStatus();
  }, []);

  return status;
}
