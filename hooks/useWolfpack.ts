/**
 * @deprecated This hook has been replaced by useWolfpackComplete
 * 
 * Migration Guide:
 * - Replace `useWolfpack()` with `useWolfpackComplete()`
 * - Use `state.isInPack` instead of `isInPack`
 * - Use `actions.joinPack()` instead of `joinPack()`
 * - Use `state.membershipStatus` instead of `membership`
 * 
 * This file will be removed in a future version.
 * Please migrate to useWolfpackComplete for better performance and features.
 */

import { useWolfpackComplete } from './useWolfpackComplete';

// Legacy wrapper for backward compatibility
export function useWolfpack() {
  console.warn('useWolfpack is deprecated. Please migrate to useWolfpackComplete.');
  
  const { state, actions } = useWolfpackComplete();
  
  return {
    isInPack: state.isInPack,
    isLoading: state.isLoading,
    error: state.error,
    joinPack: actions.joinPack,
    leavePack: actions.leavePack,
    membership: state.membershipStatus,
    // Legacy empty arrays - fetch separately if needed
    packMembers: [],
    activeEvents: []
  };
}

// Re-export the new hook as the primary export
export { useWolfpackComplete } from './useWolfpackComplete';