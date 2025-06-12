/**
 * Shared utilities for bar-tap functionality
 * Consolidates common functionality from different bar-tap components
 */

import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import type { Order, OrderItem, OrderRequest } from '@/lib/types/order';
import type { Database } from '@/lib/database.types';

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
    
    await supabase
      .from('active_sessions')
      .upsert({
        table_id: tableId,
        last_activity: new Date().toISOString(),
      });
      
    console.log('[bar-tap] Table activity updated:', tableId);
  } catch (error) {
    console.error('[bar-tap] Failed to update table activity:', error);
  }
}

/**
 * Determines category based on item name
 * Consolidates the category determination logic used in multiple components
 */
export function determineCategory(
  name: string, 
  type: 'food' | 'drink'
): string {
  const lowerName = name.toLowerCase();
  
  if (type === 'drink') {
    // House Favorites category
    if (lowerName.includes('house favorite') || 
        lowerName.includes('iced margatira') || 
        lowerName.includes('cantarito') || 
        lowerName.includes('paloma') || 
        lowerName.includes('pineapple paradise') || 
        lowerName.includes('michelada')) {
      return 'house-favorites';
    }
    // Beer category
    else if (lowerName.includes('beer') || lowerName.includes('corona') || 
             lowerName.includes('modelo') || lowerName.includes('heineken')) {
      return 'beer';
    } 
    // Wine category
    else if (lowerName.includes('wine') || lowerName.includes('cabernet') || 
             lowerName.includes('merlot') || lowerName.includes('chardonnay')) {
      return 'wine';
    } 
    // Martini category
    else if (lowerName.includes('martini')) {
      return 'martini';
    } 
    // Margarita category
    else if (lowerName.includes('margarita') || lowerName.includes('rita')) {
      return 'margarita';
    } 
    // Non-alcoholic category
    else if (lowerName.includes('soda') || lowerName.includes('coffee') || 
             lowerName.includes('tea') || lowerName.includes('water')) {
      return 'non-alcoholic';
    } 
    else {
      return 'all-drinks';
    }
  } else {
    // Small Bites category
    if (lowerName.includes('small bites') || lowerName.includes('chips & guac')) {
      return 'small-bites';
    } 
    // Main dishes category
    else if (lowerName.includes('main') || lowerName.includes('tacos')) {
      return 'main';
    }
    // Breakfast category
    else if (lowerName.includes('breakfast')) {
      return 'breakfast';
    }
    // Wings category
    else if (lowerName.includes('wings')) {
      return 'wings';
    }
    // Seafood category
    else if (lowerName.includes('seafood') || lowerName.includes('fish')) {
      return 'seafood';
    }
    // Default to main if no other category matches
    else {
      return 'all-food';
    }
  }
}

/**
 * Submits an order to the database
 */
export async function submitOrder(
  orderData: OrderRequest
): Promise<{ success: boolean; orderId?: string; error?: string }> {
  try {
    const supabase = getSupabaseBrowserClient();
    
    // Insert order first
    const { data: orderInsert, error: orderError } = await supabase
      .from('orders')
      .insert({
        table_id: orderData.table_id,
        status: 'pending',
        total_amount: 0, // Price calculation should be done server-side for security
        customer_notes: orderData.customer_notes || null,
        estimated_time: orderData.estimated_time || null,
      })
      .select('id')
      .single();
    
    if (orderError) {
      console.error('[bar-tap] Order insert error:', orderError);
      return { success: false, error: orderError.message };
    }
    
    // Insert order items
    const orderId = orderInsert.id;
    const orderItems = orderData.items.map(item => ({
      order_id: orderId,
      menu_item_id: item.menu_item_id,
      quantity: item.quantity,
      notes: item.notes || null,
      customizations: item.customizations || null,
    }));
    
    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);
    
    if (itemsError) {
      console.error('[bar-tap] Order items insert error:', itemsError);
      return { success: false, error: itemsError.message };
    }
    
    return { success: true, orderId };
  } catch (error: unknown) {
    console.error('[bar-tap] Order submission error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Fetches categories for menu display
 */
export async function fetchCategories(): Promise<Database['public']['Tables']['menu_categories']['Row'][]> {
  try {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from('menu_categories')
      .select('*')
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
