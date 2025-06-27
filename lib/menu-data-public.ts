import { unstable_noStore as noStore } from 'next/cache';
import { supabase } from '@/lib/supabase/client';

// Create admin client for public menu access (bypasses RLS)
function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
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
      .from('food_drink_items')
      .select(`
        *,
        category:food_drink_categories(
          id,
          name,
          type
        )
      `)
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

    // Transform to the expected format
    const transformedItems = items.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description || undefined,
      price: item.price,
      is_available: item.is_available || false,
      display_order: item.display_order || 0,
      category_id: item.category_id,
      category: item.category ? {
        id: item.category.id,
        name: item.category.name,
        type: item.category.type as 'food' | 'drink'
      } : undefined,
      image_url: item.image_url || undefined
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
