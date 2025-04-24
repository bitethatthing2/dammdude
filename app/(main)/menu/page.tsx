"use client";

import { useState, useEffect, useRef } from 'react';
import { ShoppingCart } from 'lucide-react';
import { MenuItemCard } from '@/components/menu/MenuItemCard';
import { CategoryNav } from '@/components/menu/CategoryNav';
import { useLocationState } from '@/lib/hooks/useLocationState';
import { useCartState } from '@/lib/hooks/useCartState';
import type { MenuCategory, MenuItem } from '@/lib/types/menu';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase/client';

// Enhanced mock data with more fields
const MOCK_MENU_DATA: MenuCategory[] = [
  {
    id: 'appetizers',
    name: 'Appetizers',
    display_order: 1,
    items: [
      {
        id: 'app1',
        name: 'Loaded Nachos',
        description: 'Tortilla chips with cheese, jalapeños, and sour cream',
        price: 11.99,
        category_id: 'appetizers',
        available: true,
        popular: true,
        image_url: '/images/food-placeholder.jpg',
        allergens: ['dairy'],
      },
      {
        id: 'app2',
        name: 'Chicken Wings',
        description: 'Choose from buffalo, BBQ, or teriyaki sauce',
        price: 12.99,
        category_id: 'appetizers',
        available: true,
        image_url: '/images/food-placeholder.jpg',
        dietary_info: ['gluten-free'],
      },
      {
        id: 'app3',
        name: 'Mozzarella Sticks',
        description: 'Breaded and fried mozzarella with marinara sauce',
        price: 9.99,
        category_id: 'appetizers',
        available: true,
        image_url: '/images/food-placeholder.jpg',
        allergens: ['dairy', 'gluten'],
      }
    ]
  },
  {
    id: 'salads',
    name: 'Salads',
    display_order: 2,
    items: [
      {
        id: 'salad1',
        name: 'Caesar Salad',
        description: 'Romaine lettuce, croutons, parmesan cheese, and Caesar dressing',
        price: 9.99,
        category_id: 'salads',
        available: true,
        image_url: '/images/food-placeholder.jpg',
        allergens: ['dairy'],
        dietary_info: ['vegetarian'],
      },
      {
        id: 'salad2',
        name: 'House Salad',
        description: 'Mixed greens, tomatoes, cucumbers, and your choice of dressing',
        price: 8.99,
        category_id: 'salads',
        available: true,
        image_url: '/images/food-placeholder.jpg',
        dietary_info: ['vegan', 'gluten-free'],
      }
    ]
  },
  {
    id: 'burgers',
    name: 'Burgers',
    display_order: 3,
    items: [
      {
        id: 'burg1',
        name: 'Classic Cheeseburger',
        description: 'Beef patty with American cheese, lettuce, tomato, and onion',
        price: 13.99,
        category_id: 'burgers',
        available: true,
        popular: true,
        image_url: '/images/food-placeholder.jpg',
        allergens: ['dairy', 'gluten'],
      },
      {
        id: 'burg2',
        name: 'Bacon Burger',
        description: 'Beef patty with bacon, cheddar, and BBQ sauce',
        price: 15.99,
        category_id: 'burgers',
        available: true,
        image_url: '/images/food-placeholder.jpg',
        allergens: ['dairy', 'gluten'],
      },
      {
        id: 'burg3',
        name: 'Veggie Burger',
        description: 'Plant-based patty with lettuce, tomato, and special sauce',
        price: 14.99,
        category_id: 'burgers',
        available: true,
        image_url: '/images/food-placeholder.jpg',
        dietary_info: ['vegetarian'],
        allergens: ['gluten'],
      }
    ]
  },
  {
    id: 'pizza',
    name: 'Pizza',
    display_order: 4,
    items: [
      {
        id: 'pizza1',
        name: 'Margherita Pizza',
        description: 'Fresh mozzarella, tomatoes, and basil',
        price: 14.99,
        category_id: 'pizza',
        available: true,
        image_url: '/images/food-placeholder.jpg',
        dietary_info: ['vegetarian'],
        allergens: ['dairy', 'gluten'],
      },
      {
        id: 'pizza2',
        name: 'Pepperoni Pizza',
        description: 'Classic pepperoni with mozzarella cheese',
        price: 15.99,
        category_id: 'pizza',
        available: true,
        popular: true,
        image_url: '/images/food-placeholder.jpg',
        allergens: ['dairy', 'gluten'],
      }
    ]
  },
  {
    id: 'drinks',
    name: 'Drinks',
    display_order: 5,
    items: [
      {
        id: 'drink1',
        name: 'Draft Beer',
        description: 'Ask your server for our selection of local brews',
        price: 6.99,
        category_id: 'drinks',
        available: true,
        image_url: '/images/food-placeholder.jpg',
      },
      {
        id: 'drink2',
        name: 'Soda',
        description: 'Coke, Diet Coke, Sprite, Dr Pepper',
        price: 2.99,
        category_id: 'drinks',
        available: true,
        image_url: '/images/food-placeholder.jpg',
        dietary_info: ['gluten-free'],
      },
      {
        id: 'drink3',
        name: 'Craft Cocktails',
        description: 'Handcrafted cocktails made with premium spirits',
        price: 10.99,
        category_id: 'drinks',
        available: true,
        image_url: '/images/food-placeholder.jpg',
        popular: true,
      }
    ]
  },
  {
    id: 'desserts',
    name: 'Desserts',
    display_order: 6,
    items: [
      {
        id: 'dessert1',
        name: 'Chocolate Cake',
        description: 'Rich chocolate cake with fudge frosting',
        price: 7.99,
        category_id: 'desserts',
        available: true,
        image_url: '/images/food-placeholder.jpg',
        dietary_info: ['vegetarian'],
        allergens: ['dairy', 'gluten'],
      },
      {
        id: 'dessert2',
        name: 'New York Cheesecake',
        description: 'Classic cheesecake with graham cracker crust',
        price: 8.99,
        category_id: 'desserts',
        available: true,
        image_url: '/images/food-placeholder.jpg',
        allergens: ['dairy', 'gluten'],
      }
    ]
  }
];

export default function MenuPage() {
  const { location } = useLocationState();
  const { addItem, getTotalItems } = useCartState();
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    // Fetch menu from Supabase based on location
    const fetchMenu = async () => {
      setIsLoading(true);
      
      try {
        // In a real implementation, we would fetch from Supabase:
        // const { data, error } = await supabase
        //   .from('menu_categories')
        //   .select(`
        //     *,
        //     items:menu_items(*)
        //   `)
        //   .eq('location', location)
        //   .order('display_order', { ascending: true });
        
        // For now, simulate network delay and use mock data
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Simulate filtering by location
        const filteredCategories = MOCK_MENU_DATA.filter(category => 
          !category.location || category.location === location
        );
        
        setCategories(filteredCategories);
        setActiveCategory(filteredCategories[0]?.id || '');
      } catch (error) {
        console.error('Error fetching menu:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMenu();
  }, [location]);

  const handleAddToCart = (item: MenuItem) => {
    addItem(item);
    // TODO: Add toast notification
  };

  const scrollToCategory = (categoryId: string) => {
    const element = categoryRefs.current[categoryId];
    if (element) {
      // Offset for sticky header
      const topOffset = 110;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - topOffset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  // Filter menu items based on selected filter
  const filteredCategories = categories.map(category => {
    let filteredItems = [...category.items];
    
    if (filterType === 'popular') {
      filteredItems = filteredItems.filter(item => item.popular);
    } else if (filterType === 'vegetarian') {
      filteredItems = filteredItems.filter(item => 
        item.dietary_info?.includes('vegetarian') || item.dietary_info?.includes('vegan')
      );
    } else if (filterType === 'gluten-free') {
      filteredItems = filteredItems.filter(item => 
        item.dietary_info?.includes('gluten-free')
      );
    }
    
    return {
      ...category,
      items: filteredItems
    };
  }).filter(category => category.items.length > 0);

  const cartItemCount = getTotalItems();

  return (
    <div className="pb-20">
      {/* Header with Location and Cart */}
      <div className="flex justify-between items-center p-4 bg-background sticky top-0 z-50 border-b">
        <h1 className="text-2xl font-bold">{location === 'portland' ? 'Portland' : 'Salem'} Menu</h1>
        <Button 
          variant="outline"
          size="sm"
          asChild
          className="relative"
        >
          <a href="/order/1">
            <ShoppingCart className="h-4 w-4 mr-1" />
            <span>Cart</span>
            {cartItemCount > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                {cartItemCount}
              </span>
            )}
          </a>
        </Button>
      </div>
      
      {/* Category Navigation */}
      <CategoryNav 
        categories={filteredCategories}
        activeCategory={activeCategory}
        onCategoryChangeAction={setActiveCategory}
        scrollToCategory={scrollToCategory}
      />
      
      {/* Filter Dropdown */}
      <div className="max-w-7xl mx-auto px-4 mt-4 flex justify-end items-center gap-2">
        <label htmlFor="menu-filter" className="text-sm text-muted-foreground">
          Filter:
        </label>
        <select
          id="menu-filter"
          aria-label="Filter menu items"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2 border rounded-md bg-background text-foreground border-input"
        >
          <option value="all">All Items</option>
          <option value="popular">Popular Items</option>
          <option value="vegetarian">Vegetarian</option>
          <option value="gluten-free">Gluten-Free</option>
        </select>
      </div>
      
      {/* Menu Content */}
      <div className="max-w-7xl mx-auto px-4 mt-4">
        {isLoading ? (
          <div className="py-20 text-center">
            <p className="text-muted-foreground">Loading menu...</p>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-muted-foreground">No menu items match your filter. Try a different selection.</p>
          </div>
        ) : (
          filteredCategories.map((category) => (
            <div 
              key={category.id}
              id={`category-${category.id}`}
              ref={(el) => { categoryRefs.current[category.id] = el; }}
              className="mb-8"
            >
              <h2 className="text-xl font-semibold mb-4 pt-4">{category.name}</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {category.items.map((item) => (
                  <MenuItemCard 
                    key={item.id} 
                    item={item} 
                    onAddToCart={handleAddToCart} 
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}