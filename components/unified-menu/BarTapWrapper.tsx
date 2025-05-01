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
  
  console.log('[BarTapWrapper] Initializing with params:', { 
    initialTableNumber, 
    tableParam, 
    fromFoodMenu,
    storedTableId: typeof window !== 'undefined' ? localStorage.getItem('table_id') : null
  });
  
  // Initialize with the URL parameter, localStorage, or a default value
  const [tableNumber, setTableNumber] = useState(() => {
    if (tableParam) return tableParam;
    
    // Check localStorage if no URL param
    if (typeof window !== 'undefined') {
      const storedTableId = localStorage.getItem('table_id');
      if (storedTableId) return storedTableId;
    }
    
    return initialTableNumber;
  });
  
  const [categories, setCategories] = useState<any[]>(initialCategories);
  const [isLoading, setIsLoading] = useState(initialCategories.length === 0);
  
  // Store table ID in localStorage and cookie on component mount or when it changes
  useEffect(() => {
    if (typeof window !== 'undefined' && tableNumber) {
      console.log('[BarTapWrapper] Setting table_id in storage:', tableNumber);
      
      // Store in localStorage
      localStorage.setItem('table_id', tableNumber);
      
      // Also store as a cookie for server components
      document.cookie = `table_id=${tableNumber}; path=/; max-age=${60 * 60 * 24}; SameSite=Lax`;
    }
  }, [tableNumber]);
  
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
  }, [initialCategories]);
  
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
