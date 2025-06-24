// lib/hooks/useRobustMenu.ts
"use client";

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { MenuItem, MenuCategory } from '@/lib/types/menu';

// For now, we'll use direct types since the database.types.ts might not have food_drink tables
type FoodDrinkCategory = {
  id: string;
  name: string;
  description: string | null;
  type: 'food' | 'drink' | string;
  display_order: number;
  is_active: boolean;
  icon: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

type FoodDrinkItem = {
  id: string;
  name: string;
  description: string | null;
  category_id: string;
  price: number;
  is_available: boolean;
  image_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  display_order: number;
};

interface UseRobustMenuReturn {
  categories: MenuCategory[];
  items: MenuItem[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useRobustMenu(): UseRobustMenuReturn {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchMenu = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Strategy 1: Try RPC functions first (most reliable)
      try {
        const [categoriesResult, itemsResult] = await Promise.all([
          supabase.rpc('get_menu_categories'),
          supabase.rpc('get_menu_items')
        ]);

        if (!categoriesResult.error && !itemsResult.error) {
          setCategories(categoriesResult.data || []);
          setItems(itemsResult.data || []);
          console.log('✅ Loaded menu using RPC functions');
          return;
        }
      } catch {
        console.log('RPC functions not available, trying next strategy...');
      }

      // Strategy 2: Try views
      try {
        const [categoriesResult, itemsResult] = await Promise.all([
          supabase.from('menu_categories').select('*').eq('is_active', true),
          supabase.from('menu_items').select('*').eq('is_available', true)
        ]);

        if (!categoriesResult.error && !itemsResult.error) {
          setCategories(categoriesResult.data || []);
          setItems(itemsResult.data || []);
          console.log('✅ Loaded menu using views');
          return;
        }
      } catch {
        console.log('Views not available, trying next strategy...');
      }

      // Strategy 3: Direct table access
      const [categoriesResult, itemsResult] = await Promise.all([
        supabase
          .from('food_drink_categories')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true }),
        supabase
          .from('food_drink_items')
          .select('*')
          .eq('is_available', true)
          .order('display_order', { ascending: true })
      ]);

      if (categoriesResult.error) throw categoriesResult.error;
      if (itemsResult.error) throw itemsResult.error;

      // Transform data to expected format
      const transformedCategories = (categoriesResult.data || []).map((category: FoodDrinkCategory) => ({
        ...category,
        name: category.name,
        icon: category.icon || '🍽️'
      }));

      const transformedItems = (itemsResult.data || []).map((item: FoodDrinkItem) => ({
        ...item,
        menu_category_id: item.category_id,
        available: item.is_available
      }));

      setCategories(transformedCategories);
      setItems(transformedItems);
      console.log('✅ Loaded menu using direct table access');

    } catch (err) {
      console.error('Failed to load menu:', err);
      setError(err instanceof Error ? err.message : 'Failed to load menu');
      
      // No fallback data - only use real database data
      setCategories([]);
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  return {
    categories,
    items,
    isLoading,
    error,
    refetch: fetchMenu
  };
}

// Helper hook to get menu organized by category
export function useMenuByCategory() {
  const { categories, items, isLoading, error } = useRobustMenu();
  
  const menuByCategory = categories.map(category => ({
    ...category,
    items: items.filter(item => 
      item.category_id === category.id || 
      (item as unknown as { category_id: string }).category_id === category.id
    )
  }));

  return {
    menuByCategory,
    isLoading,
    error
  };
}
