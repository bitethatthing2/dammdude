import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { adaptUserType, adaptWolfpackMembership, adaptError } from '@/lib/types/adapters';
import { WolfpackAuthService } from '@/lib/services/wolfpack-auth.service';
import { WolfpackLocationService, type LocationKey } from '@/lib/services/wolfpack-location.service';
import { 
  WolfpackMembershipService, 
  type MembershipStatus, 
  type JoinPackData, 
  type JoinResult 
} from '@/lib/services/wolfpack-membership.service';
import { WolfpackErrorHandler } from '@/lib/services/wolfpack-error.service';
import { toast } from 'sonner';

export interface WolfpackState {
  // Authentication
  isAuthenticated: boolean;
  isVipUser: boolean;
  userDisplayName: string;
  userAvatarUrl: string | null;
  
  // Location
  currentLocation: LocationKey | null;
  locationVerified: boolean;
  locationDistance: number;
  
  // Membership
  isInPack: boolean;
  membershipStatus: MembershipStatus | null;
  canJoinPack: boolean;
  
  // UI State
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
}

export interface WolfpackActions {
  // Authentication
  refreshAuth: () => Promise<void>;
  
  // Location
  verifyLocation: () => Promise<void>;
  requestLocationPermission: () => Promise<void>;
  
  // Membership
  joinPack: (data?: JoinPackData) => Promise<JoinResult>;
  leavePack: () => Promise<boolean>;
  updateProfile: (data: Partial<any>) => Promise<boolean>;
  refreshMembership: () => Promise<void>;
  
  // Utility
  clearError: () => void;
  reset: () => void;
}

export interface UseWolfpackCompleteReturn {
  state: WolfpackState;
  actions: WolfpackActions;
}

/**
 * Comprehensive Wolfpack hook that consolidates all functionality
 * Replaces multiple hooks: useWolfpack, useWolfpackAccess, useWolfpackMembership, etc.
 */
export function useWolfpackComplete(): UseWolfpackCompleteReturn {
  const { user } = useAuth();
  
  // Centralized state
  const [state, setState] = useState<WolfpackState>({
    isAuthenticated: false,
    isVipUser: false,
    userDisplayName: 'Anonymous',
    userAvatarUrl: null,
    currentLocation: null,
    locationVerified: false,
    locationDistance: 0,
    isInPack: false,
    membershipStatus: null,
    canJoinPack: false,
    isLoading: true,
    error: null,
    isInitialized: false
  });

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Reset all state
  const reset = useCallback(() => {
    setState({
      isAuthenticated: false,
      isVipUser: false,
      userDisplayName: 'Anonymous',
      userAvatarUrl: null,
      currentLocation: null,
      locationVerified: false,
      locationDistance: 0,
      isInPack: false,
      membershipStatus: null,
      canJoinPack: false,
      isLoading: false,
      error: null,
      isInitialized: true
    });
  }, []);

  // Refresh authentication state - memoized properly
  const refreshAuth = useCallback(async () => {
    if (!user) return;
    
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const authResult = await WolfpackAuthService.verifyUser(user);
      
      setState(prev => ({
        ...prev,
        isAuthenticated: authResult.isVerified,
        isVipUser: authResult.isVipUser,
        userDisplayName: WolfpackAuthService.getUserDisplayName(user),
        userAvatarUrl: WolfpackAuthService.getUserAvatarUrl(user),
        isLoading: false
      }));
    } catch (error) {
      const errorMessage = WolfpackErrorHandler.getWolfpackErrorMessage('auth', error);
      setState(prev => ({
        ...prev,
        isAuthenticated: false,
        isVipUser: false,
        error: errorMessage,
        isLoading: false
      }));
    }
  }, [user]);

  // Verify location
  const verifyLocation = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const locationResult = await WolfpackLocationService.verifyUserLocation();
      
      setState(prev => ({
        ...prev,
        currentLocation: locationResult.nearestLocation,
        locationVerified: locationResult.isAtLocation,
        locationDistance: locationResult.distance,
        error: locationResult.error || null,
        isLoading: false
      }));
    } catch (error) {
      const errorMessage = WolfpackErrorHandler.getWolfpackErrorMessage('location', error);
      setState(prev => ({
        ...prev,
        locationVerified: false,
        error: errorMessage,
        isLoading: false
      }));
    }
  }, []);

  // Request location permission
  const requestLocationPermission = useCallback(async () => {
    try {
      if (!WolfpackLocationService.isGeolocationAvailable()) {
        throw new Error('Geolocation not available');
      }
      
      await WolfpackLocationService.requestLocationPermission();
      await verifyLocation();
    } catch (error) {
      const userError = WolfpackErrorHandler.handleLocationError(error);
      setState(prev => ({ ...prev, error: userError.message }));
      toast.error(userError.message);
    }
  }, [verifyLocation]);

  // Refresh membership status - batch state updates
  const refreshMembership = useCallback(async () => {
    if (!user) return;
    
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      const [membershipStatus, canJoinResult] = await Promise.all([
        WolfpackMembershipService.checkMembership(user.id),
        WolfpackMembershipService.canUserJoin(user.id)
      ]);
      
      // Batch state update to prevent multiple renders
      setState(prev => ({
        ...prev,
        membershipStatus,
        isInPack: membershipStatus.isActive,
        canJoinPack: canJoinResult.canJoin,
        isLoading: false,
        error: null
      }));
    } catch (error) {
      const errorMessage = WolfpackErrorHandler.getWolfpackErrorMessage('membership', error);
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false
      }));
    }
  }, [user]);

  // Join pack
  const joinPack = useCallback(async (data: JoinPackData = {}): Promise<JoinResult> => {
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Default profile data
      const defaultData: JoinPackData = {
        display_name: WolfpackAuthService.getUserDisplayName(user),
        emoji: '🐺',
        current_vibe: 'Ready to party!',
        ...data
      };
      
      const result = await WolfpackMembershipService.joinPack(user, defaultData);
      
      if (result.success) {
        // Refresh membership status
        await refreshMembership();
        toast.success('Welcome to the Wolf Pack! 🐺');
      } else {
        setState(prev => ({ ...prev, error: result.error || 'Failed to join pack' }));
        toast.error(result.error || 'Failed to join pack');
      }
      
      setState(prev => ({ ...prev, isLoading: false }));
      return result;
    } catch (error) {
      const errorMessage = WolfpackErrorHandler.getWolfpackErrorMessage('join', error);
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false
      }));
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [user, refreshMembership]);

  // Leave pack
  const leavePack = useCallback(async (): Promise<boolean> => {
    if (!state.membershipStatus?.membershipId) {
      return false;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const success = await WolfpackMembershipService.leavePack(state.membershipStatus.membershipId);
      
      if (success) {
        await refreshMembership();
        toast.success('Left the Wolf Pack');
      } else {
        toast.error('Failed to leave pack');
      }
      
      setState(prev => ({ ...prev, isLoading: false }));
      return success;
    } catch (error) {
      const errorMessage = WolfpackErrorHandler.getWolfpackErrorMessage('leave', error);
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false
      }));
      toast.error(errorMessage);
      return false;
    }
  }, [state.membershipStatus?.membershipId, refreshMembership]);

  // Update profile with proper typing
  const updateProfile = useCallback(async (data: Partial<{
    display_name?: string;
    wolf_emoji?: string;
    current_vibe?: string;
    favorite_drink?: string;
    looking_for?: string;
    instagram_handle?: string;
    bio?: string;
    is_visible?: boolean;
    allow_messages?: boolean;
  }>): Promise<boolean> => {
    if (!user || !state.membershipStatus?.locationId) {
      return false;
    }

    try {
      const success = await WolfpackMembershipService.updateMemberProfile(
        user.id,
        state.membershipStatus.locationId,
        data
      );
      
      if (success) {
        toast.success('Profile updated!');
        await refreshMembership();
      } else {
        toast.error('Failed to update profile');
      }
      
      return success;
    } catch (error) {
      const errorMessage = WolfpackErrorHandler.getWolfpackErrorMessage('profile', error);
      toast.error(errorMessage);
      return false;
    }
  }, [user, state.membershipStatus?.locationId, refreshMembership]);

  // Initialize on mount and when user changes - fixed dependencies
  useEffect(() => {
    const initialize = async () => {
      if (!user) {
        reset();
        return;
      }

      setState(prev => ({ ...prev, isLoading: true }));
      
      try {
        // Run authentication and membership checks in parallel
        await Promise.all([
          refreshAuth(),
          refreshMembership()
        ]);
        
        setState(prev => ({ ...prev, isInitialized: true }));
      } catch (error) {
        console.error('Wolfpack initialization failed:', error);
        setState(prev => ({ 
          ...prev, 
          error: 'Initialization failed',
          isLoading: false,
          isInitialized: true
        }));
      }
    };

    initialize();
  }, [user]); // Only depend on user, functions are stable with useCallback

  // Auto-verify location for VIP users
  useEffect(() => {
    if (state.isAuthenticated && state.isVipUser && !state.locationVerified && !state.isLoading) {
      // VIP users can bypass location verification
      setState(prev => ({
        ...prev,
        currentLocation: 'salem', // Default to Salem for VIP
        locationVerified: true
      }));
    }
  }, [state.isAuthenticated, state.isVipUser, state.locationVerified, state.isLoading]);

  // Create actions object
  const actions: WolfpackActions = {
    refreshAuth,
    verifyLocation,
    requestLocationPermission,
    joinPack,
    leavePack,
    updateProfile,
    refreshMembership,
    clearError,
    reset
  };

  return {
    state,
    actions
  };
}

// Convenience hooks for specific functionality
export function useWolfpackAuth() {
  const { state, actions } = useWolfpackComplete();
  return {
    isAuthenticated: state.isAuthenticated,
    isVipUser: state.isVipUser,
    userDisplayName: state.userDisplayName,
    userAvatarUrl: state.userAvatarUrl,
    refreshAuth: actions.refreshAuth
  };
}

export function useWolfpackLocation() {
  const { state, actions } = useWolfpackComplete();
  return {
    currentLocation: state.currentLocation,
    locationVerified: state.locationVerified,
    locationDistance: state.locationDistance,
    verifyLocation: actions.verifyLocation,
    requestLocationPermission: actions.requestLocationPermission
  };
}

export function useWolfpackMembership() {
  const { state, actions } = useWolfpackComplete();
  return {
    isInPack: state.isInPack,
    membershipStatus: state.membershipStatus,
    canJoinPack: state.canJoinPack,
    joinPack: actions.joinPack,
    leavePack: actions.leavePack,
    updateProfile: actions.updateProfile,
    refreshMembership: actions.refreshMembership
  };
}

// Legacy compatibility hook - gradually migrate components to useWolfpackComplete
export function useWolfpack() {
  const { state, actions } = useWolfpackComplete();
  
  // Map to legacy interface for backward compatibility
  return {
    isInPack: state.isInPack,
    isLoading: state.isLoading,
    error: state.error,
    joinPack: actions.joinPack,
    leavePack: actions.leavePack,
    // Legacy properties
    packMembers: [], // Would need to be fetched separately if needed
    activeEvents: [], // Would need to be fetched separately if needed  
    membership: state.membershipStatus
  };
}