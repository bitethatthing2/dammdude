// hooks/useCurrentUser.ts - React hook for user management

'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { UserService } from '@/lib/services/user.service';
import { CurrentUser } from '@/types/user.types';
import { createClient } from '@/lib/supabase/client';

interface UserContextType {
  currentUser: CurrentUser | null;
  publicUserId: string | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const UserContext = createContext<UserContextType>({
  currentUser: null,
  publicUserId: null,
  loading: true,
  refresh: async () => {}
});

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const userService = new UserService(supabase);

  const loadUser = async () => {
    setLoading(true);
    try {
      const user = await userService.getCurrentUser();
      setCurrentUser(user);
    } catch (error) {
      console.error('Error loading user:', error);
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        // Ensure user profile exists when signing in
        await userService.ensureUserProfile(session.user as any);
      }
      await loadUser();
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <UserContext.Provider 
      value={{
        currentUser,
        publicUserId: currentUser?.publicUser.id || null,
        loading,
        refresh: loadUser
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useCurrentUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useCurrentUser must be used within a UserProvider');
  }
  return context;
};