'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { CartProvider } from '@/components/bartap/CartContext';
import { UnifiedMenuDisplay } from '@/components/unified-menu/UnifiedMenuDisplay';
import type { Database } from '@/lib/database.types';

interface BarTapWrapperProps {
  initialCategories?: any[];
  initialTableNumber?: string;
}

export function BarTapWrapper({ 
  initialCategories = [],
  initialTableNumber = '1'
}: BarTapWrapperProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromFoodMenu = searchParams.get('from') === 'foodmenu';
  const tableParam = searchParams.get('table');
  
  // Initialize with the URL parameter or a default value
  const [tableNumber, setTableNumber] = useState(tableParam || initialTableNumber);
  const [categories, setCategories] = useState<any[]>(initialCategories);
  const [isLoading, setIsLoading] = useState(initialCategories.length === 0);
  
  // Fetch categories on component mount if not provided
  useEffect(() => {
    if (initialCategories.length === 0) {
      const fetchCategories = async () => {
        setIsLoading(true);
        try {
          const supabase = getSupabaseBrowserClient();
          const { data, error } = await supabase
            .from('menu_categories')
            .select('*')
            .order('display_order');
            
          if (error) {
            console.error('Error fetching categories:', error);
            return;
          }
          
          setCategories(data || []);
        } catch (error) {
          console.error('Error fetching categories:', error);
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchCategories();
    }
    
    // Update table number in localStorage - safely check for browser environment
    if (typeof window !== 'undefined') {
      localStorage.setItem('tableNumber', tableNumber);
    }
  }, [tableNumber, initialCategories]);
  
  // Handle back navigation
  const handleBack = () => {
    if (fromFoodMenu) {
      router.push('/menu');
    } else {
      router.push('/');
    }
  };
  
  // If still loading, show a simple loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return (
    <CartProvider tableId={tableNumber} deliveryFee={0}>
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
