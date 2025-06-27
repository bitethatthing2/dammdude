import { unstable_noStore as noStore } from 'next/cache';
import { createServerClient } from './supabase/server';
import type { Database } from '@/lib/database.types';

type MenuCategory = Database['public']['Tables']['food_drink_categories']['Row'];
type MenuItem = Database['public']['Tables']['food_drink_items']['Row'];
type ModifierGroup = Database['public']['Tables']['item_modifier_groups']['Row'];
type Modifier = Database['public']['Tables']['menu_item_modifiers']['Row'];

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
    // First, fetch all items in the category
    const { data: items, error: itemsError } = await supabase
      .from('food_drink_items')
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

    // Then fetch modifiers for each item using the RPC function
    const itemsWithModifiers = await Promise.all(
      items.map(async (item) => {
        const { data: modifierGroups, error: modifiersError } = await supabase
          .rpc('get_item_modifiers', { p_item_id: item.id });

        if (modifiersError) {
          console.error(`Error fetching modifiers for item ${item.id}:`, modifiersError);
          return { ...item, modifier_groups: [] };
        }

        // Transform the modifiers data to match our interface
        const transformedGroups: ModifierGroupWithOptions[] = (modifierGroups || []).map(group => ({
          group_name: group.group_name,
          modifier_type: group.modifier_type,
          is_required: group.is_required,
          min_selections: group.min_selections,
          max_selections: group.max_selections,
          modifiers: group.modifiers as ModifierOption[]
        }));

        return {
          ...item,
          modifier_groups: transformedGroups
        };
      })
    );

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
    // Fetch items with their modifier groups
    const { data: items, error } = await supabase
      .from('food_drink_items')
      .select(`
        *,
        item_modifier_groups (
          id,
          group_name,
          modifier_type,
          is_required,
          min_selections,
          max_selections,
          modifier_group_items (
            display_order,
            is_default,
            menu_item_modifiers (
              id,
              name,
              price_adjustment
            )
          )
        )
      `)
      .eq('category_id', categoryId)
      .eq('is_available', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.error(`Error fetching menu items for category ${categoryId}:`, error);
      return [];
    }

    // Transform the nested structure to match our interface
    const transformedItems: MenuItemWithModifiers[] = (items || []).map(item => {
      const modifierGroups: ModifierGroupWithOptions[] = (item.item_modifier_groups || []).map(group => ({
        group_name: group.group_name,
        modifier_type: group.modifier_type,
        is_required: group.is_required,
        min_selections: group.min_selections,
        max_selections: group.max_selections,
        modifiers: (group.modifier_group_items || [])
          .sort((a, b) => a.display_order - b.display_order)
          .map(mgi => ({
            id: mgi.menu_item_modifiers.id,
            name: mgi.menu_item_modifiers.name,
            price_adjustment: mgi.menu_item_modifiers.price_adjustment,
            display_order: mgi.display_order,
            is_default: mgi.is_default
          }))
      }));

      // Remove the joined data and add transformed modifier_groups
      const { item_modifier_groups, ...itemData } = item;
      return {
        ...itemData,
        modifier_groups: modifierGroups
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
    // Fetch the item
    const { data: item, error: itemError } = await supabase
      .from('food_drink_items')
      .select('*')
      .eq('id', itemId)
      .single();
      
    if (itemError || !item) {
      console.error('Error fetching item:', itemError);
      return null;
    }
    
    // Fetch modifiers using RPC
    const { data: modifierGroups, error: modifiersError } = await supabase
      .rpc('get_item_modifiers', { p_item_id: itemId });
      
    if (modifiersError) {
      console.error('Error fetching modifiers:', modifiersError);
      return { ...item, modifier_groups: [] };
    }
    
    // Transform the modifiers
    const transformedGroups: ModifierGroupWithOptions[] = (modifierGroups || []).map(group => ({
      group_name: group.group_name,
      modifier_type: group.modifier_type,
      is_required: group.is_required,
      min_selections: group.min_selections,
      max_selections: group.max_selections,
      modifiers: group.modifiers as ModifierOption[]
    }));
    
    return {
      ...item,
      modifier_groups: transformedGroups
    };
  } catch (error) {
    console.error(`Error fetching menu item ${itemId}:`, error);
    return null;
  }
}