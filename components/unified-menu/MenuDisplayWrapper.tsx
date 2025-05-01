'use client';

import { useRouter } from 'next/navigation';
import { CartProvider } from '@/components/bartap/CartContext';
import { UnifiedMenuDisplay } from '@/components/unified-menu/UnifiedMenuDisplay';

interface MenuDisplayWrapperProps {
  mode: 'view' | 'order';
  tableNumber?: string;
  categories: any;
}

export function MenuDisplayWrapper({ 
  mode, 
  tableNumber, 
  categories 
}: MenuDisplayWrapperProps) {
  const router = useRouter();
  
  const handleBack = () => {
    router.push('/');
  };
  
  if (mode === 'order') {
    return (
      <CartProvider tableId={tableNumber || '1'} deliveryFee={0}>
        <div className="h-full">
          <UnifiedMenuDisplay 
            mode="order"
            tableNumber={tableNumber}
            initialCategories={categories}
            onBack={handleBack}
          />
        </div>
      </CartProvider>
    );
  }
  
  return (
    <div className="h-full">
      <UnifiedMenuDisplay 
        mode="view"
        initialCategories={categories}
        onBack={handleBack}
      />
    </div>
  );
}
