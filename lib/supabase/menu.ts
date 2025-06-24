// lib/supabase/menu.ts
import { getSupabaseBrowserClient } from './client';
import { MenuCategory, MenuItemWithModifiers, MenuItemModifier } from '../types/menu';

// Type for the food_drink_categories table
interface FoodDrinkCategory {
  id: string;
  name: string;
  description: string | null;
  type: 'food' | 'drink';
  display_order: number;
  is_active: boolean;
  icon: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// Type for the joined query result
interface MenuItemWithCategory extends MenuItemWithModifiers {
  food_drink_categories: FoodDrinkCategory | null;
}

// Interface for modifier group data
interface ModifierGroup {
  id: string;
  item_id: string;
  modifier_type: 'meat' | 'sauce';
  is_required: boolean;
  max_selections: number;
  group_name: string;
}

// Interface for modifier option
interface ModifierOption {
  id: string;
  name: string;
  modifier_type: 'meat' | 'sauce';
  price_adjustment: number;
  is_available: boolean;
  display_order: number;
}

export async function getMenuCategories(): Promise<MenuCategory[]> {
  try {
    const supabase = getSupabaseBrowserClient();
    
    const { data, error } = await supabase
      .from('food_drink_categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order')
      .order('name');

    if (error) {
      console.error('Error fetching menu categories:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      throw new Error(`Failed to fetch menu categories: ${error.message}`);
    }

    // Transform to MenuCategory format with required icon field
    const categories: MenuCategory[] = (data || []).map((category: FoodDrinkCategory) => ({
      ...category,
      icon: category.icon || '🍽️', // Default icon if none provided
      items: [] // Will be populated later
    }));

    return categories;
  } catch (error) {
    console.error('Error in getMenuCategories:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error: error
    });
    throw error;
  }
}

export async function getMenuItems(categoryId?: string): Promise<MenuItemWithModifiers[]> {
  try {
    const supabase = getSupabaseBrowserClient();
    
    // Try to fetch from the new food_drink_items table
    console.log('Fetching menu items from food_drink_items table...');
    
    let query = supabase
      .from('food_drink_items')
      .select(`
        id,
        name,
        description,
        price,
        image_url,
        category_id,
        is_available,
        display_order,
        food_drink_categories!category_id(
          id,
          name,
          display_order,
          icon
        )
      `)
      .eq('is_available', true)
      .order('display_order', { ascending: true })
      .order('name', { ascending: true });

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching from food_drink_items:', error);
      
      // Fallback to old menu_items table
      console.log('Falling back to menu_items table...');
      let fallbackQuery = supabase
        .from('menu_items')
        .select(`
          id,
          name,
          description,
          price,
          image_url,
          menu_category_id as category_id,
          available as is_available,
          display_order,
          created_at
        `)
        .eq('available', true)
        .order('display_order', { ascending: true })
        .order('name', { ascending: true });

      if (categoryId) {
        fallbackQuery = fallbackQuery.eq('menu_category_id', categoryId);
      }

      const { data: fallbackData, error: fallbackError } = await fallbackQuery;
      
      if (fallbackError) {
        console.error('Fallback query also failed:', fallbackError);
        return [];
      }
      
      return fallbackData || [];
    }

    console.log('Menu items fetched successfully:', {
      count: data?.length || 0,
      categoryId
    });

    // Transform data to match expected interface
    const items = data?.map((item: MenuItemWithCategory & { category_id?: string; is_available?: boolean }) => ({
      ...item,
      category: item.food_drink_categories,
      menu_category_id: item.category_id, // For backward compatibility
      available: item.is_available // For backward compatibility
    })) || [];

    return items;
  } catch (error) {
    console.error('Unexpected error in getMenuItems:', error);
    return [];
  }
}

export async function getMenuModifiers(itemId?: string): Promise<MenuItemModifier[]> {
  try {
    const supabase = getSupabaseBrowserClient();
    
    if (itemId) {
      // Get modifiers for a specific item using the menu_item_modifier_details view
      const { data, error } = await supabase
        .from('menu_item_modifier_details')
        .select('*')
        .eq('item_id', itemId)
        .order('modifier_type')
        .order('is_required', { ascending: false })
        .order('display_order');
      
      if (error) {
        console.error('Error fetching item modifiers:', error);
        return [];
      }
      
      return data || [];
    } else {
      // Get all available modifiers
      const { data, error } = await supabase
        .from('menu_item_modifiers')
        .select('*')
        .eq('is_available', true)
        .order('modifier_type')
        .order('display_order');
      
      if (error) {
        console.error('Error fetching all modifiers:', error);
        return [];
      }
      
      return data || [];
    }
  } catch (error) {
    console.error('Unexpected error in getMenuModifiers:', error);
    return [];
  }
}

// Get modifier groups for a specific item
export async function getItemModifierGroups(itemId: string): Promise<ModifierGroup[]> {
  try {
    const supabase = getSupabaseBrowserClient();
    
    const { data, error } = await supabase
      .from('item_modifier_groups')
      .select('*')
      .eq('item_id', itemId);
    
    if (error) {
      console.error('Error fetching modifier groups:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Unexpected error in getItemModifierGroups:', error);
    return [];
  }
}

// Get available modifier options by type
export async function getModifierOptionsByType(modifierType: 'meat' | 'sauce'): Promise<ModifierOption[]> {
  try {
    const supabase = getSupabaseBrowserClient();
    
    const { data, error } = await supabase
      .from('menu_item_modifiers')
      .select('*')
      .eq('modifier_type', modifierType)
      .eq('is_available', true)
      .order('display_order')
      .order('name');
    
    if (error) {
      console.error('Error fetching modifier options:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Unexpected error in getModifierOptionsByType:', error);
    return [];
  }
}

export async function getFullMenu(): Promise<{ menu: MenuCategory[]; modifiers: MenuItemModifier[] }> {
  try {
    console.log('Starting getFullMenu...');
    
    // Fetch all data in parallel
    const [categories, items, modifiers] = await Promise.all([
      getMenuCategories(),
      getMenuItems(),
      getMenuModifiers()
    ]);

    console.log('Fetched data:', {
      categoriesCount: categories.length,
      itemsCount: items.length,
      modifiersCount: modifiers.length
    });

    // Group items by category - handle both new and old field names
    const menu = categories.map(category => ({
      ...category,
      items: items.filter(item => {
        // Handle both new and old field names for category ID
        const itemCategoryId = (item as MenuItemWithModifiers & { category_id?: string }).category_id || item.category_id;
        return itemCategoryId === category.id;
      })
    }));

    console.log('Menu assembled successfully:', {
      menuCategoriesCount: menu.length,
      totalItemsInMenu: menu.reduce((acc, cat) => acc + (cat.items?.length || 0), 0)
    });

    return { menu, modifiers };
  } catch (error) {
    console.error('Error in getFullMenu:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown',
      error: error
    });
    
    // Return empty data structure to prevent UI crashes
    return { menu: [], modifiers: [] };
  }
}
