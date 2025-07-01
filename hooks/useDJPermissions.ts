import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';
import type { Database } from '@/types/supabase';
interface DJPermissions {
  canCreateEvents: boolean;
  canSendMassMessages: boolean;
  canSelectContestants: boolean;
  canManageVoting: boolean;
  assignedLocation: 'salem' | 'portland' | null;
  isActiveDJ: boolean;
}

export function useDJPermissions() {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<DJPermissions>({
    canCreateEvents: false,
    canSendMassMessages: false,
    canSelectContestants: false,
    canManageVoting: false,
    assignedLocation: null,
    isActiveDJ: false
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setPermissions({
        canCreateEvents: false,
        canSendMassMessages: false,
        canSelectContestants: false,
        canManageVoting: false,
        assignedLocation: null,
        isActiveDJ: false
      });
      setIsLoading(false);
      return;
    }

    const checkDJPermissions = async () => {
      try {        
        // Debug logging to see what user data we have
        console.log('🔍 DJ Permissions Check:', {
          user,
          userEmail: user?.email,
          userId: user?.id
        });
        
        // For now, we'll use a simple check - VIP users can be DJs
        // In production, this would check a proper DJ assignments table
        const vipUsers = ['mkahler599@gmail.com'];
        const isVipUser = user?.email && vipUsers.includes(user.email);
        
        console.log('🔍 VIP Check:', {
          vipUsers,
          userEmail: user?.email,
          isVipUser,
          userObject: user
        });
        
        // TEMP: Allow any authenticated user to access DJ dashboard for debugging
        const tempAllowAnyUser = true;

        if (isVipUser || tempAllowAnyUser) {
          console.log('🎯 Setting DJ permissions for user:', { isVipUser, tempAllowAnyUser, userEmail: user?.email });
          setPermissions({
            canCreateEvents: true,
            canSendMassMessages: true,
            canSelectContestants: true,
            canManageVoting: true,
            assignedLocation: 'salem', // Default to Salem for now
            isActiveDJ: true
          });
        } else {
          // Try to check for DJ assignment in database
          const { data: djData } = await supabase
            .from('users')
            .select('*')
            .eq('auth_id', user.id)
            .eq('is_active', true)
            .single();

          if (djData && 'location' in djData) {
            setPermissions({
              canCreateEvents: true,
              canSendMassMessages: true,
              canSelectContestants: true,
              canManageVoting: true,
              assignedLocation: djData.location as 'salem' | 'portland',
              isActiveDJ: true
            });
          }
        }
      } catch (error) {
        console.warn('Could not check DJ permissions (table may not exist yet):', error);
        // For development, allow VIP users to be DJs even if table doesn't exist
        const vipUsers = ['mkahler599@gmail.com'];
        const isVipUser = user?.email && vipUsers.includes(user.email);
        
        if (isVipUser || tempAllowAnyUser) {
          console.log('🎯 Setting DJ permissions (catch block) for user:', { isVipUser, tempAllowAnyUser, userEmail: user?.email });
          setPermissions({
            canCreateEvents: true,
            canSendMassMessages: true,
            canSelectContestants: true,
            canManageVoting: true,
            assignedLocation: 'salem',
            isActiveDJ: true
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkDJPermissions();
  }, [user]);

  return { ...permissions, isLoading };
}
