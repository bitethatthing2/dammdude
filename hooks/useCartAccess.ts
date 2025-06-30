// hooks/useCartAccess.ts
import { useWolfpackAccess } from '@/lib/hooks/useWolfpackAccess';

export function useCartAccess() {
  const wolfpack = useWolfpackAccess();
  
  return {
    canAccess: wolfpack.canCheckout && wolfpack.locationStatus?.isAtLocation,
    isLoading: wolfpack.isLoading,
    reason: !wolfpack.canCheckout ? 'not-member' : !wolfpack.locationStatus?.isAtLocation ? 'not-at-location' : null
  };
}
