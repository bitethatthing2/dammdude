import { unstable_noStore as noStore } from 'next/cache';
import { createServerClient } from './supabase/server';
import type { Database } from '@/lib/database.types';

type MenuCategory = Database['public']['Tables']['food_drink_categories']['Row'];

/**
 * Fetches all menu categories from Supabase.
 * Gets categories from the 'menu_categories' table which contains both food and drink categories.
 * Uses unstable_noStore to prevent caching on the server.
 * @returns {Promise<MenuCategory[]>} A promise that resolves to an array of categories.
 */
export async function getCategories(): Promise<MenuCategory[]> {
  // unstable_noStore() is used to prevent the response from being cached.
  // This is helpful for data that changes often.
  noStore();

  try {
    const supabase = await createServerClient(); // Pass cookie store and await

    // Fetch all categories from the menu_categories table
    const { data: categories, error } = await supabase
      .from('food_drink_categories')
      .select('id, name, display_order, icon')
      .order('display_order', { ascending: true });
     
    if (error) {
      console.error('Error fetching categories:', error);
      throw new Error(`Failed to fetch categories: ${JSON.stringify(error)}`);
    }
     
    if (!categories || categories.length === 0) {
      console.warn('No categories found');
      return [];
    }

    // Return categories directly as they match the expected type
    return categories;
  } catch (error) {
    console.error('Unexpected error fetching categories:', error);
    throw new Error(`Failed to fetch categories: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// --- Additions below ---

// Define complex type for Menu Item with its options
// Define custom types since they're not in the database schema
interface Option {
  id: string;
  name: string;
  price?: number | null;
  available?: boolean | null;
}

interface OptionGroup {
  id: string;
  name: string;
  required?: boolean | null;
  options: Option[];
}

type MenuItemWithOptions = Database['public']['Tables']['food_drink_items']['Row'] & {
  option_groups: OptionGroup[];
};

/**
 * Fetches menu items for a specific category, including their option groups and options.
 * Uses unstable_noStore to prevent caching.
 * @param {string | number} categoryId - The ID of the category to fetch items for.
 * @returns {Promise<MenuItemWithOptions[]>} A promise resolving to menu items with options.
 */
export async function getMenuItemsByCategory(categoryId: string | number): Promise<MenuItemWithOptions[]> {
  noStore();
   
  const supabase = await createServerClient(); // Pass cookie store and await
   
  // Convert string ID to number if needed
  const numericCategoryId = typeof categoryId === 'string' ? parseInt(categoryId, 10) : categoryId;
   
  try {
    const { data, error } = await supabase
      .from('food_drink_items')
      .select(`
        id, name, description, price, category_id, image_url,
        option_groups (
          id, name, min_selections, max_selections,
          options (
            id, name, price, is_default
          )
        )
      `)
      .eq('category_id', numericCategoryId)
      .order('display_order', { ascending: true });
     
    if (error) {
      console.error(`Error fetching menu items for category ${numericCategoryId}:`, error);
      return [];
    }
     
    // Ensure the structure matches MenuItemWithOptions, especially the nested options
    // Supabase query syntax (*, options (*)) should handle this structure
    // Verify that the type MenuItemWithOptions correctly reflects the 'menu_items' table
    return (data as MenuItemWithOptions[] | null) || [];
  } catch (error) {
    console.error(`Error fetching menu items for category ${numericCategoryId}:`, error);
    return [];
  }
}
