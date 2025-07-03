import { unstable_noStore as noStore } from 'next/cache';
import { createClient } from '@supabase/supabase-js';

// Create admin client for public menu access (bypasses RLS)
// This should only be used server-side
function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
  }

  // If service role key is not available, create a regular anon client
  // This will work if RLS policies allow public read access
  if (!serviceRoleKey) {
    console.warn('Service role key not found, using anon key for public menu access');
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!anonKey) {
      throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
    }
    return createClient(supabaseUrl, anonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

/**
 * Fetches all menu categories using admin privileges for public access.
 * This bypasses RLS policies to allow anonymous users to view the menu.
 */
export async function getCategoriesPublic() {
  noStore();

  try {
    const supabase = createAdminClient();

    const { data: categories, error } = await supabase
      .from('food_drink_categories')
      .select('*')
      .eq('is_active', true)
      .order('type', { ascending: true })
      .order('display_order', { ascending: true });
     
    if (error) {
      console.error('Error fetching categories:', error);
      throw new Error(`Failed to fetch categories: ${JSON.stringify(error)}`);
    }
     
    if (!categories || categories.length === 0) {
      console.warn('No categories found');
      return [];
    }

    console.log(`✅ Public categories loaded: ${categories.length}`);
    return categories;
  } catch (error) {
    console.error('Unexpected error fetching categories:', error);
    throw new Error(`Failed to fetch categories: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Fetches menu items for a specific category using admin privileges.
 */
export async function getMenuItemsByCategoryPublic(categoryId: string) {
  noStore();
   
  const supabase = createAdminClient();
   
  try {
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

    // The view already returns properly formatted data with modifiers
    const transformedItems = items.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description || undefined,
      price: item.price,
      is_available: item.is_available || false,
      display_order: item.display_order || 0,
      category_id: item.category_id,
      category: item.category || undefined,
      image_url: item.image_url || undefined,
      modifiers: item.modifiers || []
    }));

    console.log(`✅ Public items loaded for category ${categoryId}: ${transformedItems.length}`);
    return transformedItems;
  } catch (error) {
    console.error(`Error fetching menu items for category ${categoryId}:`, error);
    return [];
  }
}

/**
 * Helper function to get categories by type using admin privileges
 */
export async function getCategoriesByTypePublic(type: 'food' | 'drink') {
  noStore();
  
  const supabase = createAdminClient();
  
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
  
  console.log(`✅ Public ${type} categories loaded: ${data?.length || 0}`);
  return data || [];
}
