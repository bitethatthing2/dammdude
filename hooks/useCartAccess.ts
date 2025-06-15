// hooks/useCartAccess.ts
import { useWolfpackAccess } from '@/lib/hooks/useWolfpackAccess';

export function useCartAccess() {
  const wolfpack = useWolfpackAccess();
  
  return {
    canAccess: wolfpack.canCheckout && wolfpack.location === 'granted',
    isLoading: wolfpack.wolfpack === 'loading' || wolfpack.location === 'loading',
    reason: !wolfpack.canCheckout ? 'not-member' : wolfpack.location !== 'granted' ? 'not-at-location' : null
  };
}
