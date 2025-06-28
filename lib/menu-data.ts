import { unstable_noStore as noStore } from 'next/cache';
import { createServerClient } from './supabase/server';
import type { Database } from './database.types';

type MenuCategory = Database['public']['Tables']['food_drink_categories']['Row'];
type MenuItem = Database['public']['Tables']['food_drink_items']['Row'];

/**
 * Fetches all menu categories from Supabase.
 * Gets categories from the 'food_drink_categories' table which contains both food and drink categories.
 * Uses unstable_noStore to prevent caching on the server.
 * @returns {Promise<MenuCategory[]>} A promise that resolves to an array of categories.
 */
export async function getCategories(): Promise<MenuCategory[]> {
  // unstable_noStore() is used to prevent the response from being cached.
  // This is helpful for data that changes often.
  noStore();

  try {
    const supabase = await createServerClient();

    // Fetch all active categories from the food_drink_categories table
    const { data: categories, error } = await supabase
      .from('food_drink_categories')
      .select('*')
      .eq('is_active', true)
      .order('type', { ascending: true }) // Group by type first (food, then drink)
      .order('display_order', { ascending: true });
     
    if (error) {
      console.error('Error fetching categories:', error);
      throw new Error(`Failed to fetch categories: ${JSON.stringify(error)}`);
    }
     
    if (!categories || categories.length === 0) {
      console.warn('No categories found');
      return [];
    }

    return categories;
  } catch (error) {
    console.error('Unexpected error fetching categories:', error);
    throw new Error(`Failed to fetch categories: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Define types for menu items with modifiers
interface ModifierOption {
  id: string;
  name: string;
  price_adjustment: number;
  display_order: number;
  is_default: boolean;
}

interface ModifierGroupWithOptions {
  group_name: string;
  modifier_type: string;
  is_required: boolean;
  min_selections: number;
  max_selections: number;
  modifiers: ModifierOption[];
}

interface MenuItemWithModifiers extends MenuItem {
  modifier_groups: ModifierGroupWithOptions[];
}

/**
 * Fetches menu items for a specific category, including their modifier groups.
 * Uses the get_item_modifiers function to fetch modifiers efficiently.
 * @param {string} categoryId - The UUID of the category to fetch items for.
 * @returns {Promise<MenuItemWithModifiers[]>} A promise resolving to menu items with modifiers.
 */
export async function getMenuItemsByCategory(categoryId: string): Promise<MenuItemWithModifiers[]> {
  noStore();
   
  const supabase = await createServerClient();
   
  try {
    // Fetch items with modifiers from the view
    const { data: items, error: itemsError } = await supabase
      .from('menu_items_with_working_modifiers' as any)
      .select('*')
      .eq('category_id', categoryId)
      .eq('is_available', true)
      .order('display_order', { ascending: true });
     
    if (itemsError) {
      console.error(`Error fetching menu items for category ${categoryId}:`, itemsError);
      return [];
    }

    if (!items || items.length === 0) {
      return [];
    }

    // The view returns data with modifiers already included
    const itemsWithModifiers = items.map(item => {
      // Handle potential query errors
      if (!item || typeof item !== 'object') {
        return { modifier_groups: [] } as any;
      }
      
      return {
        ...(item as any),
        modifier_groups: (item as any).modifiers || []
      };
    });

    return itemsWithModifiers;
  } catch (error) {
    console.error(`Error fetching menu items for category ${categoryId}:`, error);
    return [];
  }
}

/**
 * Alternative: Fetch menu items with inline modifier data (if you prefer not to use RPC)
 * This approach uses joins but may be less efficient for complex modifier structures
 */
export async function getMenuItemsByCategoryWithJoins(categoryId: string): Promise<MenuItemWithModifiers[]> {
  noStore();
   
  const supabase = await createServerClient();
   
  try {
    // Fetch items with modifiers from the view
    const { data: items, error } = await supabase
      .from('menu_items_with_working_modifiers' as any)
      .select('*')
      .eq('category_id', categoryId)
      .eq('is_available', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.error(`Error fetching menu items for category ${categoryId}:`, error);
      return [];
    }

    // The view returns data with modifiers already properly formatted
    const transformedItems: MenuItemWithModifiers[] = (items || []).map(item => {
      // Handle potential query errors
      if (!item || typeof item !== 'object') {
        return { modifier_groups: [] } as any;
      }
      
      return {
        ...(item as any),
        modifier_groups: (item as any).modifiers || []
      };
    });

    return transformedItems;
  } catch (error) {
    console.error(`Error fetching menu items for category ${categoryId}:`, error);
    return [];
  }
}

/**
 * Helper function to get categories by type
 */
export async function getCategoriesByType(type: 'food' | 'drink'): Promise<MenuCategory[]> {
  noStore();
  
  const supabase = await createServerClient();
  
  const { data, error } = await supabase
    .from('food_drink_categories')
    .select('*')
    .eq('type', type)
    .eq('is_active', true)
    .order('display_order', { ascending: true });
    
  if (error) {
    console.error(`Error fetching ${type} categories:`, error);
    return [];
  }
  
  return data || [];
}

/**
 * Get a single menu item with all its modifiers
 */
export async function getMenuItemById(itemId: string): Promise<MenuItemWithModifiers | null> {
  noStore();
  
  const supabase = await createServerClient();
  
  try {
    // Fetch the item with modifiers from the view
    const { data: item, error: itemError } = await supabase
      .from('menu_items_with_working_modifiers' as any)
      .select('*')
      .eq('id', itemId)
      .single();
      
    if (itemError || !item) {
      console.error('Error fetching item:', itemError);
      return null;
    }
    
    // The view returns data with modifiers already included
    if (!item || typeof item !== 'object') {
      return null;
    }
    
    return {
      ...(item as any),
      modifier_groups: (item as any).modifiers || []
    };
  } catch (error) {
    console.error(`Error fetching menu item ${itemId}:`, error);
    return null;
  }
}
