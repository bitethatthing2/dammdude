// lib/supabase/menu.ts
import { getSupabaseBrowserClient } from './client';
import { 
  MenuCategory, 
  MenuItemWithModifiers, 
  APIModifierGroup,
  APIModifierOption,
  MenuItemModifier 
} from '../types/menu';

// =============================================================================
// SUPABASE DATABASE TYPES - EXACT FROM GENERATED TYPES
// =============================================================================

type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

// Database types from Supabase
type Database = {
  public: {
    Tables: {
      food_drink_categories: {
        Row: {
          id: string;
          name: string;
          type: string;
          description: string | null;
          display_order: number | null;
          is_active: boolean | null;
          created_at: string | null;
          updated_at: string | null;
          created_by: string | null;
          icon: string | null;
          color: string | null;
        };
      };
      food_drink_items: {
        Row: {
          id: string;
          category_id: string | null;
          name: string;
          description: string | null;
          price: number;
          is_available: boolean | null;
          image_id: string | null;
          created_at: string | null;
          updated_at: string | null;
          created_by: string | null;
          display_order: number | null;
        };
      };
      menu_item_modifiers: {
        Row: {
          id: string;
          name: string;
          modifier_type: string;
          price_adjustment: number | null;
          is_available: boolean | null;
          created_at: string | null;
          display_order: number | null;
          description: string | null;
          is_popular: boolean | null;
          spice_level: number | null;
        };
      };
      item_modifier_groups: {
        Row: {
          id: string;
          item_id: string | null;
          modifier_type: string;
          is_required: boolean | null;
          max_selections: number | null;
          created_at: string | null;
          group_name: string | null;
          min_selections: number | null;
          description: string | null;
        };
      };
    };
    Views: {
      menu_items_with_working_modifiers: {
        Row: {
          id: string | null;
          name: string | null;
          description: string | null;
          price: string | null; // numeric in DB, returned as string
          is_available: boolean | null;
          display_order: number | null;
          category_id: string | null;
          image_id: string | null;
          created_at: string | null;
          updated_at: string | null;
          image_url: string | null;
          category: Json | null;
          modifiers: Json | null;
        };
      };
      menu_item_modifier_details: {
        Row: {
          modifier_id: string | null;
          modifier_name: string | null;
          modifier_type: string | null;
          price_adjustment: string | null; // numeric in DB, returned as string
          is_available: boolean | null;
          display_order: number | null;
          item_id: string | null;
          group_name: string | null;
          is_required: boolean | null;
          max_selections: number | null;
          min_selections: number | null;
          category: string | null;
          category_order: number | null;
          description: string | null;
          is_default: boolean | null;
        };
      };
    };
  };
};

// Type aliases for cleaner code
type FoodDrinkCategoryRow = Database['public']['Tables']['food_drink_categories']['Row'];
type FoodDrinkItemRow = Database['public']['Tables']['food_drink_items']['Row'];
type MenuItemModifierRow = Database['public']['Tables']['menu_item_modifiers']['Row'];
type ItemModifierGroupRow = Database['public']['Tables']['item_modifier_groups']['Row'];
type MenuItemWithWorkingModifiersRow = Database['public']['Views']['menu_items_with_working_modifiers']['Row'];
type MenuItemModifierDetailsRow = Database['public']['Views']['menu_item_modifier_details']['Row'];

// =============================================================================
// JSON STRUCTURE TYPES (From actual database inspection)
// =============================================================================

interface CategoryJsonStructure {
  id: string;
  name: string;
  type: string;
}

interface ModifierOptionJsonStructure {
  id: string;
  name: string;
  price_adjustment: number;
}

interface ModifierGroupJsonStructure {
  id: string;
  name: string;
  type: string;
  required: boolean;
  max_selections: number;
  min_selections: number;
  options: ModifierOptionJsonStructure[];
}

// Type guards for JSON validation
function isCategoryJson(obj: Json): obj is CategoryJsonStructure {
  return typeof obj === 'object' && 
         obj !== null && 
         typeof (obj as Record<string, unknown>).id === 'string' &&
         typeof (obj as Record<string, unknown>).name === 'string' &&
         typeof (obj as Record<string, unknown>).type === 'string';
}

function isModifierGroupArray(obj: Json): obj is ModifierGroupJsonStructure[] {
  return Array.isArray(obj) && 
         obj.every(item => 
           typeof item === 'object' && 
           item !== null &&
           typeof (item as Record<string, unknown>).id === 'string' &&
           typeof (item as Record<string, unknown>).name === 'string' &&
           typeof (item as Record<string, unknown>).type === 'string' &&
           typeof (item as Record<string, unknown>).required === 'boolean' &&
           typeof (item as Record<string, unknown>).max_selections === 'number' &&
           Array.isArray((item as Record<string, unknown>).options)
         );
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

export function isValidModifierType(type: string): boolean {
  return ['meat', 'sauce', 'salsa', 'addon', 'side'].includes(type);
}

export function isValidCategoryType(type: string): boolean {
  return ['food', 'drink'].includes(type);
}

function safeModifierType(type: string | null | undefined): string {
  if (!type) return 'addon';
  return isValidModifierType(type) ? type : 'addon';
}

function safeCategoryType(type: string): 'food' | 'drink' {
  return isValidCategoryType(type) ? (type as 'food' | 'drink') : 'food';
}

function parseNumeric(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
}

// =============================================================================
// API FUNCTIONS
// =============================================================================

export async function getMenuCategories(): Promise<MenuCategory[]> {
  try {
    const supabase = getSupabaseBrowserClient();
    
    const { data, error } = await supabase
      .from('food_drink_categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching menu categories:', error);
      throw new Error(`Failed to fetch menu categories: ${error.message}`);
    }

    // Type assertion to the correct type
    const typedData = data as FoodDrinkCategoryRow[] | null;

    const categories: MenuCategory[] = (typedData || []).map((category) => ({
      id: category.id,
      name: category.name,
      type: safeCategoryType(category.type),
      display_order: category.display_order || 0,
      is_active: category.is_active ?? true,
      icon: category.icon,
      description: category.description,
      color: category.color
    }));

    return categories;
  } catch (error) {
    console.error('Error in getMenuCategories:', error);
    throw error;
  }
}

export async function getMenuItems(categoryId?: string): Promise<MenuItemWithModifiers[]> {
  try {
    const supabase = getSupabaseBrowserClient();
    
    console.log('Fetching menu items from menu_items_with_working_modifiers view...');
    
    let query = supabase
      .from('menu_items_with_working_modifiers')
      .select('*')
      .eq('is_available', true)
      .order('display_order', { ascending: true })
      .order('name', { ascending: true });

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching from menu_items_with_working_modifiers:', error);
      return [];
    }

    // Type assertion to the correct type
    const typedData = data as MenuItemWithWorkingModifiersRow[] | null;

    console.log('Menu items fetched successfully:', {
      count: typedData?.length || 0,
      categoryId
    });

    const items: MenuItemWithModifiers[] = (typedData || []).map((item) => {
      const modifierGroups: APIModifierGroup[] = [];
      
      // Parse modifiers JSON using type guards
      if (item.modifiers && isModifierGroupArray(item.modifiers)) {
        // TypeScript now knows item.modifiers is ModifierGroupJsonStructure[]
        const typedModifiers = item.modifiers;
        typedModifiers.forEach((group) => {
          const options: APIModifierOption[] = group.options.map((option) => ({
            id: option.id,
            name: option.name,
            price_adjustment: option.price_adjustment
          }));

          modifierGroups.push({
            id: group.id,
            type: group.type,
            name: group.name,
            options: options,
            required: group.required,
            max_selections: group.max_selections
          });
        });
      }

      // Parse category JSON using type guard
      let categoryInfo: { id?: string; name: string; type: string } | undefined;
      if (item.category && isCategoryJson(item.category)) {
        categoryInfo = {
          id: item.category.id,
          name: item.category.name,
          type: item.category.type
        };
      }

      return {
        id: item.id || '',
        name: item.name || '',
        description: item.description || undefined,
        price: parseNumeric(item.price),
        is_available: item.is_available ?? true,
        display_order: item.display_order || 0,
        category: categoryInfo,
        category_id: item.category_id,
        modifiers: modifierGroups.length > 0 ? modifierGroups : undefined,
        image_url: item.image_url
      };
    });

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
      
      // Type assertion to the correct type
      const typedData = data as MenuItemModifierDetailsRow[] | null;
      
      const modifiers: MenuItemModifier[] = (typedData || []).map((mod) => ({
        id: mod.modifier_id || '',
        name: mod.modifier_name || '',
        modifier_type: safeModifierType(mod.modifier_type),
        price_adjustment: parseNumeric(mod.price_adjustment),
        is_available: mod.is_available ?? true,
        is_default: mod.is_default ?? false,
        display_order: mod.display_order ?? 0
      }));
      
      return modifiers;
    } else {
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
      
      // Type assertion to the correct type
      const typedData = data as MenuItemModifierRow[] | null;
      
      const modifiers: MenuItemModifier[] = (typedData || []).map((mod) => ({
        id: mod.id,
        name: mod.name,
        modifier_type: safeModifierType(mod.modifier_type),
        price_adjustment: mod.price_adjustment || 0,
        is_available: mod.is_available ?? true,
        is_default: false,
        display_order: mod.display_order ?? 0
      }));
      
      return modifiers;
    }
  } catch (error) {
    console.error('Unexpected error in getMenuModifiers:', error);
    return [];
  }
}

export async function getItemModifierGroups(itemId: string): Promise<ItemModifierGroupRow[]> {
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
    
    // Type assertion to the correct type
    const typedData = data as ItemModifierGroupRow[] | null;
    
    return typedData || [];
  } catch (error) {
    console.error('Unexpected error in getItemModifierGroups:', error);
    return [];
  }
}

export async function getModifierOptionsByType(
  modifierType: 'meat' | 'sauce' | 'salsa' | 'addon' | 'side'
): Promise<MenuItemModifier[]> {
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
    
    // Type assertion to the correct type
    const typedData = data as MenuItemModifierRow[] | null;
    
    const options: MenuItemModifier[] = (typedData || []).map((opt) => ({
      id: opt.id,
      name: opt.name,
      modifier_type: safeModifierType(opt.modifier_type),
      price_adjustment: opt.price_adjustment || 0,
      is_available: opt.is_available ?? true,
      is_default: false,
      display_order: opt.display_order ?? 0
    }));
    
    return options;
  } catch (error) {
    console.error('Unexpected error in getModifierOptionsByType:', error);
    return [];
  }
}

export async function getFullMenu(): Promise<{ menu: MenuCategory[]; items: MenuItemWithModifiers[]; modifiers: MenuItemModifier[] }> {
  try {
    console.log('Starting getFullMenu...');
    
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

    // Don't nest items inside categories for backward compatibility
    return { menu: categories, items, modifiers };
  } catch (error) {
    console.error('Error in getFullMenu:', error);
    return { menu: [], items: [], modifiers: [] };
  }
}

export async function getAvailableModifierTypes(): Promise<string[]> {
  try {
    const supabase = getSupabaseBrowserClient();
    
    const { data, error } = await supabase
      .from('menu_item_modifiers')
      .select('modifier_type')
      .eq('is_available', true);
    
    if (error) {
      console.error('Error fetching modifier types:', error);
      return ['meat', 'sauce', 'salsa', 'addon', 'side'];
    }
    
    // Type assertion to the correct type
    const typedData = data as { modifier_type: string }[] | null;
    
    const types = [...new Set((typedData || []).map(item => item.modifier_type))];
    return types;
  } catch (error) {
    console.error('Unexpected error in getAvailableModifierTypes:', error);
    return ['meat', 'sauce', 'salsa', 'addon', 'side'];
  }
}