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

// Database response types
interface FoodDrinkItemDB {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category_id: string | null;
  is_available: boolean | null;
  display_order: number | null;
  food_drink_categories: {
    id: string;
    name: string;
    type: string;
    display_order: number | null;
    icon: string | null;
  } | null;
}

interface MenuItemModifierDB {
  id: string;
  name: string;
  modifier_type: string;
  price_adjustment: number | null;
  is_available: boolean | null;
  is_popular: boolean | null;
  display_order: number | null;
  created_at: string | null;
  description: string | null;
  spice_level: number | null;
}

interface MenuItemModifierDetailsDB {
  category: string | null;
  category_order: number | null;
  description: string | null;
  group_name: string | null;
  is_available: boolean | null;
  is_required: boolean | null;
  item_id: string | null;
  modifier_id?: string | null;
  modifier_name?: string | null;
  modifier_type: string | null;
  price: number | null;
  // Additional fields that might be in the view
  id?: string;
  name?: string;
  price_adjustment?: number | null;
  is_default?: boolean | null;
  display_order?: number | null;
}

interface ItemModifierGroupDB {
  id: string;
  item_id: string | null;
  modifier_type: string;
  is_required: boolean | null;
  max_selections: number | null;
  group_name: string | null;
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
    // Cast the data to ensure TypeScript knows the type field contains valid literals
    const categories: MenuCategory[] = (data || []).map((category) => ({
      id: category.id,
      name: category.name,
      type: category.type as 'food' | 'drink', // Cast to literal type
      display_order: category.display_order || 0, // Default to 0 if null
      is_active: category.is_active ?? true, // Default to true if null
      icon: category.icon || '🍽️', // Default icon if none provided
      description: category.description,
      color: category.color || null, // Add missing color property
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
          type,
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
      // Return empty array on error instead of trying a fallback with incorrect column names
      return [];
    }

    console.log('Menu items fetched successfully:', {
      count: data?.length || 0,
      categoryId
    });

    // Transform data to match expected interface
    const items: MenuItemWithModifiers[] = (data || []).map((item: FoodDrinkItemDB) => ({
      id: item.id,
      name: item.name,
      description: item.description || undefined,
      price: item.price,
      is_available: item.is_available ?? true,
      display_order: item.display_order || 0,
      category_id: item.category_id,
      image_url: item.image_url,
      category: item.food_drink_categories ? {
        id: item.food_drink_categories.id,
        name: item.food_drink_categories.name,
        type: item.food_drink_categories.type
      } : undefined
    }));

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
      
      // Transform data to ensure it matches MenuItemModifier interface
      const modifiers: MenuItemModifier[] = (data || []).map((mod: MenuItemModifierDetailsDB) => ({
        id: mod.modifier_id || mod.id || '',
        name: mod.modifier_name || mod.name || '',
        modifier_type: mod.modifier_type || '',
        price_adjustment: mod.price_adjustment ?? mod.price ?? 0,
        is_available: mod.is_available ?? true,
        is_default: mod.is_default ?? false,
        display_order: mod.display_order ?? 0
      }));
      
      return modifiers;
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
      
      // Transform data to ensure it matches MenuItemModifier interface
      const modifiers: MenuItemModifier[] = (data || []).map((mod: MenuItemModifierDB) => ({
        id: mod.id,
        name: mod.name,
        modifier_type: mod.modifier_type,
        price_adjustment: mod.price_adjustment || 0,
        is_available: mod.is_available ?? true,
        is_default: false,
        display_order: mod.display_order || 0
      }));
      
      return modifiers;
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
    
    // Transform and filter data to ensure it matches ModifierGroup interface
    const groups: ModifierGroup[] = (data || [])
      .filter((group: ItemModifierGroupDB) => group.item_id && group.modifier_type && group.group_name)
      .map((group: ItemModifierGroupDB) => ({
        id: group.id,
        item_id: group.item_id as string, // We filtered for non-null above
        modifier_type: group.modifier_type as 'meat' | 'sauce',
        is_required: group.is_required ?? false,
        max_selections: group.max_selections || 1,
        group_name: group.group_name as string // We filtered for non-null above
      }));
    
    return groups;
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
    
    // Transform data to ensure it matches ModifierOption interface
    const options: ModifierOption[] = (data || []).map((opt: MenuItemModifierDB) => ({
      id: opt.id,
      name: opt.name,
      modifier_type: modifierType, // Use the passed parameter to ensure correct type
      price_adjustment: opt.price_adjustment || 0,
      is_available: opt.is_available ?? true,
      display_order: opt.display_order || 0
    }));
    
    return options;
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
