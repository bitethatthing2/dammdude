'use client';

import { useState, useEffect, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import MenuItemCard from './MenuItemCard';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { toast } from '@/components/ui/use-toast';
import type { MenuItemWithModifiers, CartOrderData } from '@/lib/types/menu';

// Local type definitions
interface Category {
  id: string;
  name: string;
  description?: string | null;
  emoji?: string | null;
  display_order: number;
  color_class?: string;
}

interface MenuGridProps {
  selectedCategoryId?: string | null;
  onAddToCart: (orderData: CartOrderData) => void;
}

export default function MenuGrid({ selectedCategoryId, onAddToCart }: MenuGridProps) {
  const [menuItems, setMenuItems] = useState<MenuItemWithModifiers[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(selectedCategoryId || null);
  
  const supabase = getSupabaseBrowserClient();

  // Fetch categories
  useEffect(() => {
    async function fetchCategories() {
      try {
        const { data, error } = await supabase
          .from('food_drink_categories')
          .select('*')
          .order('display_order', { ascending: true });

        if (error) throw error;
        
        interface DBCategory {
          id: string;
          name: string;
          description?: string | null;
          emoji?: string | null;
          display_order: number | null;
          color_class?: string;
        }
        
        setCategories((data || []).map((cat: DBCategory) => ({
          ...cat,
          display_order: cat.display_order || 0
        })));
        
        // Set first category as active if none selected
        if (!activeCategory && data && data.length > 0) {
          setActiveCategory(data[0].id);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        toast({
          title: "Error",
          description: "Failed to load categories",
          variant: "destructive"
        });
      }
    }

    fetchCategories();
  }, [activeCategory, supabase]);

  // Fetch menu items
  useEffect(() => {
    async function fetchMenuItems() {
      try {
        setLoading(true);
        
        let query = supabase
          .from('food_drink_items')
          .select(`
            *,
            category:food_drink_categories(
              id,
              name,
              type
            )
          `)
          .order('display_order', { ascending: true });

        // Filter by category if one is selected
        if (activeCategory) {
          query = query.eq('category_id', activeCategory);
        }

        const { data, error } = await query;

        if (error) throw error;
        
        interface DBMenuItem {
          id: string;
          name: string;
          description: string | null;
          price: number;
          is_available: boolean | null;
          display_order: number | null;
          category_id: string | null;
          category: {
            id: string;
            name: string;
            type: string;
          } | null;
          image_url: string | null;
        }
        
        // Transform the data to match MenuItemWithModifiers type
        const transformedItems: MenuItemWithModifiers[] = (data || []).map((item: DBMenuItem) => ({
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
            type: item.category.type
          } : undefined,
          image_url: item.image_url || undefined
        }));
        
        setMenuItems(transformedItems);
      } catch (error) {
        console.error('Error fetching menu items:', error);
        toast({
          title: "Error",
          description: "Failed to load menu items",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    }

    fetchMenuItems();
  }, [activeCategory, supabase]);

  // Filter items by availability
  const availableItems = useMemo(() => {
    return menuItems.filter((item: MenuItemWithModifiers) => item.is_available);
  }, [menuItems]);

  const unavailableItems = useMemo(() => {
    return menuItems.filter((item: MenuItemWithModifiers) => !item.is_available);
  }, [menuItems]);

  // Combine items with available first
  const sortedItems = [...availableItems, ...unavailableItems];

  return (
    <div className="w-full">
      {/* Category Navigation */}
      <div className="menu-category-nav sticky top-0 z-10 bg-background/95 backdrop-blur-sm">
        <div className="menu-category-scroll">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`menu-category-button ${
                activeCategory === category.id ? 
                  (category.color_class || 'menu-category-orange') : 
                  'menu-category-inactive'
              }`}
            >
              {category.emoji && (
                <span className="text-lg">{category.emoji}</span>
              )}
              <span className="font-medium">{category.name}</span>
              <span className="text-xs opacity-75">
                {menuItems.filter((item: MenuItemWithModifiers) => item.category_id === category.id).length}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Menu Items Grid */}
      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
              <p className="mt-4 text-lg text-muted-foreground">Loading delicious food...</p>
            </div>
          </div>
        ) : sortedItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground">No items found in this category.</p>
          </div>
        ) : (
          <div className="menu-grid">
            {sortedItems.map((item) => (
              <MenuItemCard
                key={item.id}
                item={item}
                onAddToCart={onAddToCart}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Example usage in a page component:
/*
// app/menu/page.tsx or pages/menu.tsx

'use client';

import { useState } from 'react';
import MenuGrid from '@/components/MenuGrid';
import { toast } from '@/components/ui/use-toast';

export default function MenuPage() {
  const [cart, setCart] = useState<any[]>([]);

  const handleAddToCart = (orderData: any) => {
    setCart(prev => [...prev, orderData]);
    toast({
      title: "Added to cart!",
      description: `${orderData.item.name} has been added to your cart.`,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-3xl font-bold">Our Menu</h1>
        </div>
      </header>
      
      <main>
        <MenuGrid onAddToCart={handleAddToCart} />
      </main>
    </div>
  );
}
*/
