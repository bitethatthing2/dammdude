import { unstable_noStore as noStore } from 'next/cache';
import { createClient } from '@supabase/supabase-js';

// Fixed version of menu data public functions
// This version handles missing service role keys gracefully

/**
 * Creates a Supabase client with fallback for missing service role key
 */
function createPublicClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
  }

  if (!anonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
  }

  // Try service role key first (for bypassing RLS)
  if (serviceRoleKey) {
    console.log('✅ Using service role key for menu access');
    return createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  // Fallback to anon key (requires proper RLS policies)
  console.warn('⚠️ Service role key not found, using anon key for menu access');
  console.warn('⚠️ Make sure RLS policies allow public read access to menu tables');
  
  return createClient(supabaseUrl, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

/**
 * Fetches all menu categories with error handling
 */
export async function getCategoriesPublic() {
  noStore();

  try {
    const supabase = createPublicClient();

    const { data: categories, error } = await supabase
      .from('food_drink_categories')
      .select('*')
      .eq('is_active', true)
      .order('type', { ascending: true })
      .order('display_order', { ascending: true });
     
    if (error) {
      console.error('❌ Error fetching categories:', error);
      
      // Provide more specific error messages
      if (error.message.includes('Invalid API key')) {
        throw new Error('Supabase API key is invalid. Check your environment variables.');
      }
      if (error.message.includes('permission') || error.message.includes('policy')) {
        throw new Error('Permission denied. Check RLS policies for food_drink_categories table.');
      }
      
      throw new Error(`Database error: ${error.message}`);
    }
     
    if (!categories || categories.length === 0) {
      console.warn('⚠️ No categories found in database');
      return [];
    }

    console.log(`✅ Successfully loaded ${categories.length} categories`);
    return categories;
    
  } catch (error) {
    console.error('💥 Unexpected error fetching categories:', error);
    
    // Return empty array instead of throwing to prevent page crashes
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
    
    // In development, you might want to throw the error
    // In production, return empty array to gracefully handle failures
    if (process.env.NODE_ENV === 'development') {
      throw error;
    }
    
    return [];
  }
}

/**
 * Helper function to get categories by type with improved error handling
 */
export async function getCategoriesByTypePublic(type: 'food' | 'drink') {
  noStore();
  
  try {
    const supabase = createPublicClient();
    
    const { data, error } = await supabase
      .from('food_drink_categories')
      .select('*')
      .eq('type', type)
      .eq('is_active', true)
      .order('display_order', { ascending: true });
      
    if (error) {
      console.error(`❌ Error fetching ${type} categories:`, error);
      
      // Provide helpful error context
      if (error.message.includes('Invalid API key')) {
        console.error('🔑 API Key Issue: Check NEXT_PUBLIC_SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY');
      }
      if (error.message.includes('permission')) {
        console.error('🔒 Permission Issue: Check RLS policies for food_drink_categories table');
      }
      
      // Return empty array instead of throwing
      return [];
    }
    
    console.log(`✅ Successfully loaded ${data?.length || 0} ${type} categories`);
    return data || [];
    
  } catch (error) {
    console.error(`💥 Exception fetching ${type} categories:`, error);
    return [];
  }
}

/**
 * Fetches menu items for a specific category with error handling
 */
export async function getMenuItemsByCategoryPublic(categoryId: string) {
  noStore();
   
  try {
    const supabase = createPublicClient();
    
    const { data: items, error: itemsError } = await supabase
      .from('menu_items_with_working_modifiers' as any)
      .select('*')
      .eq('category_id', categoryId)
      .eq('is_available', true)
      .order('display_order', { ascending: true });
     
    if (itemsError) {
      console.error(`❌ Error fetching menu items for category ${categoryId}:`, itemsError);
      return [];
    }

    if (!items || items.length === 0) {
      return [];
    }

    // Transform the data
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

    console.log(`✅ Successfully loaded ${transformedItems.length} items for category ${categoryId}`);
    return transformedItems;
    
  } catch (error) {
    console.error(`💥 Exception fetching menu items for category ${categoryId}:`, error);
    return [];
  }
}

/**
 * Check if the database connection is working
 */
export async function testMenuConnection() {
  try {
    const supabase = createPublicClient();
    
    // Simple connectivity test
    const { data, error } = await supabase
      .from('food_drink_categories')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Menu connection test failed:', error);
      return { success: false, error: error.message };
    }
    
    console.log('✅ Menu connection test passed');
    return { success: true, data };
    
  } catch (error) {
    console.error('💥 Menu connection test exception:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}