import { unstable_noStore as noStore } from 'next/cache';
import { createSupabaseServerClient } from './supabase/server';
import type { Database } from './database.types';
import { cookies } from 'next/headers'; // Import cookies

// Define type alias for convenience
// Create a unified category type that works for both tables
type Category = {
  id: string;
  name: string;
  description: string | null;
  display_order: number | null;
};

/**
 * Fetches all menu categories from Supabase.
 * Gets categories from the 'menu_categories' table which contains both food and drink categories.
 * Uses unstable_noStore to prevent caching on the server.
 * @returns {Promise<Category[]>} A promise that resolves to an array of categories.
 */
export async function getCategories(): Promise<Category[]> {
  // unstable_noStore() is used to prevent the response from being cached.
  // This is helpful for data that changes often.
  noStore();

  const cookieStore = await cookies(); // Await cookie store
  const supabase = createSupabaseServerClient(cookieStore); // Pass cookie store

  // Fetch all categories from the menu_categories table
  const { data: categories, error } = await supabase
    .from('menu_categories')
    .select('id, name, icon, display_order')
    .order('display_order', { ascending: true });
   
  if (error) {
    console.error('Error fetching categories:', error);
    // In a real app, you might want to throw the error or return a specific error state
    return []; // Return empty array on error
  }
   
  // Format categories to match our unified Category type
  const formattedCategories: Category[] = (categories || []).map((cat: { id: number; name: string; icon: string | null; display_order: number | null; }) => ({
    id: cat.id.toString(), // Convert numeric ID to string
    name: cat.name,
    description: cat.icon, // Use icon as description for consistency
    display_order: cat.display_order
  }));
 
  return formattedCategories;
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

type MenuItemWithOptions = Database['public']['Tables']['menu_items']['Row'] & {
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
   
  const cookieStore = await cookies(); // Await cookie store
  const supabase = createSupabaseServerClient(cookieStore); // Pass cookie store
   
  // Convert string ID to number if needed
  const numericCategoryId = typeof categoryId === 'string' ? parseInt(categoryId, 10) : categoryId;
   
  try {
    const { data, error } = await supabase
      .from('menu_items')
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
