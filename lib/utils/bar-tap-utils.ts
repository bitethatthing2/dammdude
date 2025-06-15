/**
 * Shared utilities for bar-tap functionality
 * Consolidates common functionality from different bar-tap components
 */

import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import type { Database } from '@/lib/database.types';

// Type definitions based on your actual database schema
export type FoodDrinkCategory = Database['public']['Tables']['food_drink_categories']['Row'];
export type FoodDrinkItem = Database['public']['Tables']['food_drink_items']['Row'];
export type BartenderOrder = Database['public']['Tables']['bartender_orders']['Row'];
export type BartenderOrderInsert = Database['public']['Tables']['bartender_orders']['Insert'];

/**
 * Stores table ID in both localStorage and cookie for consistent access
 * across client and server components
 */
export function storeTableId(tableId: string): void {
  if (typeof window === 'undefined') return;
  
  // Store in localStorage for client components
  localStorage.setItem('table_id', tableId);
  
  // Also store as a cookie for server components
  document.cookie = `table_id=${tableId}; path=/; max-age=${60 * 60 * 24}; SameSite=Lax`;
  
  console.log('[bar-tap] Table ID stored:', tableId);
}

/**
 * Retrieves table ID from URL params, localStorage, or cookie
 */
export function getTableId(tableParam?: string | null): string {
  // Prioritize URL parameter if available
  if (tableParam) return tableParam;
  
  // Check localStorage if in browser environment
  if (typeof window !== 'undefined') {
    const storedTableId = localStorage.getItem('table_id');
    if (storedTableId) return storedTableId;
    
    // Check cookies as fallback
    const cookieTableId = document.cookie
      .split('; ')
      .find(row => row.startsWith('table_id='))
      ?.split('=')[1];
    
    if (cookieTableId) return cookieTableId;
  }
  
  // Default to table 1 if nothing found
  return '1';
}

/**
 * Updates the last activity time for a table session
 */
export async function updateTableActivity(tableId: string): Promise<void> {
  if (!tableId) return;
  
  try {
    const supabase = getSupabaseBrowserClient();
    
    // Get the table UUID from the name
    const { data: tableData } = await supabase
      .from('tables')
      .select('id')
      .eq('name', tableId)
      .single();
    
    if (tableData) {
      await supabase
        .from('active_sessions')
        .upsert({
          table_id: tableData.id,
          last_activity: new Date().toISOString(),
        });
        
      console.log('[bar-tap] Table activity updated:', tableId);
    }
  } catch (error) {
    console.error('[bar-tap] Failed to update table activity:', error);
  }
}

/**
 * Determines category based on item name
 * Maps to actual category types in your database
 */
export function determineCategory(
  name: string, 
  type: 'food' | 'drink'
): string {
  const lowerName = name.toLowerCase();
  
  if (type === 'drink') {
    // Map drink categories
    if (lowerName.includes('beer') || lowerName.includes('corona') || 
        lowerName.includes('modelo') || lowerName.includes('heineken')) {
      return 'beer';
    } 
    else if (lowerName.includes('wine') || lowerName.includes('cabernet') || 
             lowerName.includes('merlot') || lowerName.includes('chardonnay')) {
      return 'wine';
    } 
    else if (lowerName.includes('margarita') || lowerName.includes('rita')) {
      return 'margarita';
    } 
    else if (lowerName.includes('cocktail') || lowerName.includes('martini')) {
      return 'cocktail';
    }
    else if (lowerName.includes('soda') || lowerName.includes('coffee') || 
             lowerName.includes('tea') || lowerName.includes('water')) {
      return 'non-alcoholic';
    } 
    else {
      return 'drink'; // default drink category
    }
  } else {
    // Map food categories
    if (lowerName.includes('appetizer') || lowerName.includes('chips') || 
        lowerName.includes('guac') || lowerName.includes('small')) {
      return 'appetizer';
    } 
    else if (lowerName.includes('taco')) {
      return 'tacos';
    }
    else if (lowerName.includes('breakfast')) {
      return 'breakfast';
    }
    else if (lowerName.includes('wings')) {
      return 'wings';
    }
    else if (lowerName.includes('seafood') || lowerName.includes('fish')) {
      return 'seafood';
    }
    else {
      return 'food'; // default food category
    }
  }
}

/**
 * Interface for order items in bartender_orders JSONB
 */
export interface OrderItemJson {
  id: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
  customizations?: {
    meatType?: string;
    extras?: string[];
    preferences?: string[];
  };
}

/**
 * Submits an order to the bartender_orders table
 */
export async function submitOrder(
  orderData: {
    table_location: string;
    items: OrderItemJson[];
    customer_notes?: string;
    customer_id?: string;
    location_id: string;
    order_type: 'pickup' | 'table_delivery';
  }
): Promise<{ success: boolean; orderNumber?: number; error?: string }> {
  try {
    const supabase = getSupabaseBrowserClient();
    
    // Calculate total
    const total_amount = orderData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Insert order to bartender_orders table
    const { data: orderInsert, error: orderError } = await supabase
      .from('bartender_orders')
      .insert({
        customer_id: orderData.customer_id || null,
        location_id: orderData.location_id,
        status: 'pending',
        order_type: orderData.order_type,
        table_location: orderData.table_location,
        items: orderData.items as any, // JSONB column
        total_amount: total_amount,
        customer_notes: orderData.customer_notes || null
      } as BartenderOrderInsert)
      .select('order_number')
      .single();
    
    if (orderError) {
      console.error('[bar-tap] Order insert error:', orderError);
      return { success: false, error: orderError.message };
    }
    
    return { success: true, orderNumber: orderInsert.order_number };
  } catch (error: unknown) {
    console.error('[bar-tap] Order submission error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Fetches categories for menu display
 */
export async function fetchCategories(): Promise<FoodDrinkCategory[]> {
  try {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from('food_drink_categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order');
    
    if (error) {
      console.error('[bar-tap] Error fetching categories:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('[bar-tap] Error fetching categories:', error);
    return [];
  }
}

/**
 * Fetches menu items for a specific category
 */
export async function fetchMenuItems(categoryId?: string): Promise<FoodDrinkItem[]> {
  try {
    const supabase = getSupabaseBrowserClient();
    
    let query = supabase
      .from('food_drink_items')
      .select('*')
      .eq('is_available', true);
    
    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }
    
    const { data, error } = await query.order('display_order');
    
    if (error) {
      console.error('[bar-tap] Error fetching menu items:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('[bar-tap] Error fetching menu items:', error);
    return [];
  }
}