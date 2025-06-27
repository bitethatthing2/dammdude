import { getCategoriesByTypePublic } from '@/lib/menu-data-public';
import MenuClient from './MenuClient';
import type { Database } from '@/lib/database.types';
import type { MenuCategoryWithCount } from '@/lib/types/menu';
import { supabase } from '@/lib/supabase/client';

type MenuCategory = Database['public']['Tables']['food_drink_categories']['Row'];

export default async function MenuServer() {
  try {
    // Fetch categories and items count on the server using the proper data functions
    const [foodCategories, drinkCategories, allItems] = await Promise.all([
      getCategoriesByTypePublic('food'),
      getCategoriesByTypePublic('drink'),
      // Get all items to count per category using admin client
      (async () => {
        const { createClient } = await import('@supabase/supabase-js');
                const { data } = await supabase
          .from('food_drink_items')
          .select('category_id')
          .eq('is_available', true);
        return data || [];
      })()
    ]);

    // Count items per category
    const itemCountByCategory = allItems.reduce((acc: Record<string, number>, item: { category_id: string | null }) => {
      if (item.category_id) {
        acc[item.category_id] = (acc[item.category_id] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    // Add item counts to categories
    const foodCategoriesWithCount: MenuCategoryWithCount[] = foodCategories.map((cat: MenuCategory) => ({
      id: cat.id,
      name: cat.name,
      type: cat.type as 'food' | 'drink',
      display_order: cat.display_order || 0,
      is_active: cat.is_active || false,
      icon: cat.icon,
      description: cat.description,
      color: cat.color,
      item_count: itemCountByCategory[cat.id] || 0
    }));

    interface DrinkCategory extends MenuCategory {
      // You can extend with drink-specific fields if needed
    }

    interface DrinkCategoryWithCount extends MenuCategoryWithCount {
      // You can extend with drink-specific fields if needed
    }

    const drinkCategoriesWithCount: DrinkCategoryWithCount[] = drinkCategories.map((cat: DrinkCategory): DrinkCategoryWithCount => ({
      id: cat.id,
      name: cat.name,
      type: cat.type as 'food' | 'drink',
      display_order: cat.display_order || 0,
      is_active: cat.is_active || false,
      icon: cat.icon,
      description: cat.description,
      color: cat.color,
      item_count: itemCountByCategory[cat.id] || 0
    }));

    const allCategories = [...foodCategoriesWithCount, ...drinkCategoriesWithCount];

    console.log('🍽️ SERVER DEBUG: Categories fetched successfully');
    console.log('📊 SERVER DEBUG: Food categories:', foodCategories.length);
    console.log('🍹 SERVER DEBUG: Drink categories:', drinkCategories.length);
    console.log('📋 SERVER DEBUG: Total categories:', allCategories.length);
    console.log('🍴 SERVER DEBUG: Total menu items:', allItems.length);
    console.log('📈 SERVER DEBUG: Category breakdown:', {
      food: foodCategoriesWithCount.map(c => `${c.name}: ${c.item_count}`),
      drink: drinkCategoriesWithCount.map(c => `${c.name}: ${c.item_count}`)
    });
    
    // Debug: Check if we actually have data
    if (allCategories.length === 0) {
      console.error('❌ SERVER DEBUG: No categories found!');
    }
    if (allItems.length === 0) {
      console.error('❌ SERVER DEBUG: No menu items found!');
    }

    return (
      <MenuClient 
        initialCategories={allCategories}
        initialFoodCategories={foodCategoriesWithCount}
        initialDrinkCategories={drinkCategoriesWithCount}
      />
    );
  } catch (error) {
    console.error('❌ Server: Error fetching menu data:', error);
    
    // Return error state to client
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">Menu Unavailable</h1>
          <p className="text-muted-foreground">Unable to load menu data. Please try again later.</p>
          <details className="mt-4 text-left text-sm">
            <summary className="cursor-pointer font-medium">Error Details</summary>
            <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
              {error instanceof Error ? error.message : String(error)}
            </pre>
          </details>
        </div>
      </div>
    );
  }
}
