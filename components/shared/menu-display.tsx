'use client';

import { useState, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardHeader, CardContent, CardFooter, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useCart } from '@/components/bartap/CartContext';
import { formatCurrency } from '@/lib/utils';
import * as LucideIcons from 'lucide-react';
import { Star, Search } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { Database } from '@/lib/database.types';

// Define types
type MenuCategory = Database['public']['Tables']['menu_categories']['Row'];
type MenuItem = Database['public']['Tables']['menu_items']['Row'] & {
  is_specialty?: boolean;
  category_id?: string;
};

interface MenuDisplayProps {
  initialCategories: MenuCategory[];
  mode?: 'info' | 'order';
  filterAvailable?: boolean;
}

// Skeleton component for loading state
function MenuItemsSkeleton() {
  return (
    <div className="space-y-4">
      {Array(3).fill(0).map((_, i) => (
        <div key={i} className="bg-muted/30 h-32 rounded-lg animate-pulse" />
      ))}
    </div>
  );
}

/**
 * Unified menu display component with category tabs and item display
 * Works in two modes:
 * - 'info': Display-only for browsing the menu (Food Menu feature)
 * - 'order': Interactive with ordering capabilities (BarTap feature)
 */
export function MenuDisplay({
  initialCategories,
  mode = 'info',
  filterAvailable = false
}: MenuDisplayProps) {
  // State for active tab (food or drinks)
  const [activeTab, setActiveTab] = useState<'food' | 'drinks'>('food');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Define drink category names
  const drinkCategoryNames = [
    'HOUSE FAVORITES',
    'MARTINIS',
    'MARGARITAS',
    'BOARDS',
    'FLIGHTS',
    'TOWERS',
    'BOTTLE BEER',
    'WINE',
    'NON-ALCOHOLIC BEVERAGES',
    'MALIBU BUCKETS',
    'REFRESHERS'
  ];
  
  // Create a map of category IDs by name for easy lookup
  const categoryMap = new Map();
  initialCategories.forEach(cat => {
    categoryMap.set(cat.name.toUpperCase(), cat.id);
  });
  
  // Get the IDs for drink categories
  const drinkCategoryIds = drinkCategoryNames
    .map(name => categoryMap.get(name))
    .filter(Boolean);
  
  // Separate categories into food and drinks
  const foodCategories = initialCategories.filter(cat => {
    return !drinkCategoryIds.includes(cat.id);
  });
  
  const drinkCategories = initialCategories.filter(cat => {
    return drinkCategoryIds.includes(cat.id);
  });
  
  // Create UI-friendly category objects
  const uiFoodCategories = [
    { id: 'all-food', name: 'All Food', type: 'food' },
    ...foodCategories.map(cat => ({
      id: cat.id,
      name: cat.name,
      type: 'food' as const
    }))
  ];
  
  const uiDrinkCategories = [
    { id: 'all-drinks', name: 'All Drinks', type: 'drink' },
    ...drinkCategories.map(cat => ({
      id: cat.id,
      name: cat.name,
      type: 'drink' as const
    }))
  ];
  
  // State for selected categories
  const [selectedFoodCategory, setSelectedFoodCategory] = useState<string>('all-food');
  const [selectedDrinkCategory, setSelectedDrinkCategory] = useState<string>('all-drinks');
  
  // State for menu items
  const [foodItems, setFoodItems] = useState<MenuItem[]>([]);
  const [drinkItems, setDrinkItems] = useState<MenuItem[]>([]);
  const [filteredFoodItems, setFilteredFoodItems] = useState<MenuItem[]>([]);
  const [filteredDrinkItems, setFilteredDrinkItems] = useState<MenuItem[]>([]);
  const [isFoodLoading, setIsFoodLoading] = useState(true);
  const [isDrinkLoading, setIsDrinkLoading] = useState(true);
  
  // Access cart context if in order mode
  const cart = mode === 'order' ? useCart() : null;
  
  // Fetch food items
  useEffect(() => {
    const fetchFoodItems = async () => {
      setIsFoodLoading(true);
      
      try {
        const supabase = getSupabaseBrowserClient();
        
        // Get food category IDs
        const foodCategoryIds = foodCategories.map(cat => cat.id);
        
        // Skip if no food categories
        if (foodCategoryIds.length === 0) {
          setFoodItems([]);
          setIsFoodLoading(false);
          return;
        }
        
        // Create query
        let query = supabase
          .from('menu_items')
          .select('*')
          .in('menu_category_id', foodCategoryIds);
        
        // Apply available filter if needed
        if (mode === 'order' && filterAvailable) {
          query = query.eq('is_specialty', true);
        }
        
        // Execute query
        const { data, error } = await query;
        
        if (error) {
          console.error('Error fetching food items:', error);
          setFoodItems([]);
        } else {
          setFoodItems(data || []);
        }
      } catch (error) {
        console.error('Error in fetchFoodItems:', error);
        setFoodItems([]);
      } finally {
        setIsFoodLoading(false);
      }
    };
    
    fetchFoodItems();
  }, [foodCategories, mode, filterAvailable]);
  
  // Fetch drink items
  useEffect(() => {
    const fetchDrinkItems = async () => {
      setIsDrinkLoading(true);
      
      try {
        const supabase = getSupabaseBrowserClient();
        
        // Skip if no drink categories
        if (drinkCategoryIds.length === 0) {
          setDrinkItems([]);
          setIsDrinkLoading(false);
          return;
        }
        
        // Create query
        let query = supabase
          .from('menu_items')
          .select('*')
          .in('menu_category_id', drinkCategoryIds);
        
        // Apply available filter if needed
        if (mode === 'order' && filterAvailable) {
          query = query.eq('is_specialty', true);
        }
        
        // Execute query
        const { data, error } = await query;
        
        if (error) {
          console.error('Error fetching drink items:', error);
          setDrinkItems([]);
        } else {
          setDrinkItems(data || []);
        }
      } catch (error) {
        console.error('Error in fetchDrinkItems:', error);
        setDrinkItems([]);
      } finally {
        setIsDrinkLoading(false);
      }
    };
    
    fetchDrinkItems();
  }, [drinkCategoryIds, mode, filterAvailable]);
  
  // Filter food items based on category and search
  useEffect(() => {
    let filtered = foodItems;
    
    // Apply category filter
    if (selectedFoodCategory !== 'all-food') {
      filtered = filtered.filter(item => 
        (item.menu_category_id?.toString() === selectedFoodCategory));
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        item => item.name.toLowerCase().includes(query) || 
               (item.description && item.description.toLowerCase().includes(query))
      );
    }
    
    setFilteredFoodItems(filtered);
  }, [foodItems, selectedFoodCategory, searchQuery]);
  
  // Filter drink items based on category and search
  useEffect(() => {
    let filtered = drinkItems;
    
    // Apply category filter
    if (selectedDrinkCategory !== 'all-drinks') {
      filtered = filtered.filter(item => 
        (item.menu_category_id?.toString() === selectedDrinkCategory));
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        item => item.name.toLowerCase().includes(query) || 
               (item.description && item.description.toLowerCase().includes(query))
      );
    }
    
    setFilteredDrinkItems(filtered);
  }, [drinkItems, selectedDrinkCategory, searchQuery]);
  
  // Get item quantity in cart
  const getItemQuantity = (itemId: string): number => {
    if (!cart) return 0;
    const item = cart.items.find(item => item.id === itemId);
    return item ? item.quantity : 0;
  };
  
  // Handle adding an item to the cart
  const handleAddToCart = (item: MenuItem) => {
    if (!cart) return;
    
    cart.addItem({
      id: item.id.toString(),
      name: item.name,
      price: item.price || 0,
      image_url: item.image_url,
      description: item.description,
      category_id: item.menu_category_id?.toString(),
      available: item.available ?? true
    });
  };
  
  // Handle updating item quantity
  const handleUpdateQuantity = (id: string, quantity: number) => {
    if (!cart) return;
    
    if (quantity > 0) {
      cart.updateQuantity(id, quantity);
    } else {
      cart.removeItem(id);
    }
  };
  
  return (
    <div className="flex flex-col h-full bg-background">
      {/* Search Bar */}
      <div className="p-4 pb-3">
        <div className="relative flex items-center">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            type="search"
            placeholder={`Search ${activeTab === 'drinks' ? 'Drinks' : 'Food'}`}
            className="pl-10 pr-4 py-2 bg-muted/10 border-border"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      {/* Tab Navigation */}
      <div className="flex justify-center px-4 pb-2">
        <div className="flex w-full rounded-lg overflow-hidden border border-border">
          <button
            onClick={() => setActiveTab('food')}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              activeTab === 'food'
                ? 'bg-primary text-primary-foreground'
                : 'bg-card hover:bg-muted/50 text-foreground'
            }`}
          >
            Food
          </button>
          <button
            onClick={() => setActiveTab('drinks')}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              activeTab === 'drinks'
                ? 'bg-primary text-primary-foreground'
                : 'bg-card hover:bg-muted/50 text-foreground'
            }`}
          >
            Drinks
          </button>
        </div>
      </div>
      
      {/* Food Categories */}
      <ScrollArea className={`pb-2 border-b border-border ${activeTab === 'food' ? 'block' : 'hidden'}`}>
        <div className="flex gap-1.5 overflow-x-auto py-2 px-4 snap-x">
          {uiFoodCategories.map(category => (
            <Button
              key={category.id}
              onClick={() => setSelectedFoodCategory(category.id)}
              variant="ghost"
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs sm:text-sm whitespace-nowrap snap-start shrink-0",
                selectedFoodCategory === category.id 
                  ? "bg-primary text-primary-foreground shadow-sm" 
                  : "bg-card hover:bg-accent text-foreground border border-border"
              )}
            >
              {category.name}
            </Button>
          ))}
        </div>
      </ScrollArea>
      
      {/* Drink Categories */}
      <ScrollArea className={`pb-2 border-b border-border ${activeTab === 'drinks' ? 'block' : 'hidden'}`}>
        <div className="flex gap-1.5 overflow-x-auto py-2 px-4 snap-x">
          {uiDrinkCategories.map(category => (
            <Button
              key={category.id}
              onClick={() => setSelectedDrinkCategory(category.id)}
              variant="ghost"
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs sm:text-sm whitespace-nowrap snap-start shrink-0",
                selectedDrinkCategory === category.id 
                  ? "bg-primary text-primary-foreground shadow-sm" 
                  : "bg-card hover:bg-accent text-foreground border border-border"
              )}
            >
              {category.name}
            </Button>
          ))}
        </div>
      </ScrollArea>
      
      {/* Food Items List */}
      <div className={`flex-1 overflow-auto pb-32 ${activeTab === 'food' ? 'block' : 'hidden'}`}>
        <div className="px-4 py-2">
          {isFoodLoading ? (
            // Loading skeleton
            Array(6).fill(0).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 mb-2 bg-muted/30 rounded-lg animate-pulse h-20" />
            ))
          ) : filteredFoodItems.length === 0 ? (
            <p className="text-center py-10 text-muted-foreground">
              {searchQuery ? 'No food items found matching your search' : 'No food items available in this category'}
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
              {filteredFoodItems.map(item => (
                <Card 
                  key={item.id} 
                  className="overflow-hidden hover:shadow transition-shadow duration-200 border-border"
                >
                  <CardHeader className="pb-1 pt-3 px-3">
                    <div className="flex justify-between items-start gap-2">
                      <CardTitle className="text-sm sm:text-base font-bold text-foreground">
                        {item.name}
                      </CardTitle>
                      <div className="font-semibold text-primary text-sm whitespace-nowrap">
                        ${item.price ? parseFloat(item.price.toString()).toFixed(2) : '0.00'}
                      </div>
                    </div>
                    {item.is_specialty && (
                      <Badge variant="secondary" className="mt-1 text-xs">
                        <Star className="h-3 w-3 mr-1" /> House Specialty
                      </Badge>
                    )}
                  </CardHeader>
                  <CardContent className="py-1 px-3">
                    <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed line-clamp-2 sm:line-clamp-none">
                      {item.description}
                    </p>
                  </CardContent>
                  {mode === 'order' && (
                    <CardFooter className="pt-1 pb-3 px-3">
                      {getItemQuantity(item.id.toString()) === 0 ? (
                        <Button 
                          size="sm" 
                          className="w-full"
                          onClick={() => handleAddToCart(item)}
                        >
                          <LucideIcons.Plus className="h-4 w-4 mr-2" />
                          Add to Cart
                        </Button>
                      ) : (
                        <div className="flex items-center justify-between w-full">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={() => handleUpdateQuantity(item.id.toString(), getItemQuantity(item.id.toString()) - 1)}
                          >
                            <LucideIcons.Minus className="h-4 w-4" />
                          </Button>
                          <span className="font-medium">{getItemQuantity(item.id.toString())}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={() => handleUpdateQuantity(item.id.toString(), getItemQuantity(item.id.toString()) + 1)}
                          >
                            <LucideIcons.Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </CardFooter>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Drink Items List */}
      <div className={`flex-1 overflow-auto pb-32 ${activeTab === 'drinks' ? 'block' : 'hidden'}`}>
        <div className="px-4 py-2">
          {isDrinkLoading ? (
            // Loading skeleton
            Array(6).fill(0).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 mb-2 bg-muted/30 rounded-lg animate-pulse h-20" />
            ))
          ) : filteredDrinkItems.length === 0 ? (
            <p className="text-center py-10 text-muted-foreground">
              {searchQuery ? 'No drink items found matching your search' : 'No drink items available in this category'}
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
              {filteredDrinkItems.map(item => (
                <Card 
                  key={item.id} 
                  className="overflow-hidden hover:shadow transition-shadow duration-200 border-border"
                >
                  <CardHeader className="pb-1 pt-3 px-3">
                    <div className="flex justify-between items-start gap-2">
                      <CardTitle className="text-sm sm:text-base font-bold text-foreground">
                        {item.name}
                      </CardTitle>
                      <div className="font-semibold text-primary text-sm whitespace-nowrap">
                        ${item.price ? parseFloat(item.price.toString()).toFixed(2) : '0.00'}
                      </div>
                    </div>
                    {item.is_specialty && (
                      <Badge variant="secondary" className="mt-1 text-xs">
                        <Star className="h-3 w-3 mr-1" /> House Specialty
                      </Badge>
                    )}
                  </CardHeader>
                  <CardContent className="py-1 px-3">
                    <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed line-clamp-2 sm:line-clamp-none">
                      {item.description}
                    </p>
                  </CardContent>
                  {mode === 'order' && (
                    <CardFooter className="pt-1 pb-3 px-3">
                      {getItemQuantity(item.id.toString()) === 0 ? (
                        <Button 
                          size="sm" 
                          className="w-full"
                          onClick={() => handleAddToCart(item)}
                        >
                          <LucideIcons.Plus className="h-4 w-4 mr-2" />
                          Add to Cart
                        </Button>
                      ) : (
                        <div className="flex items-center justify-between w-full">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={() => handleUpdateQuantity(item.id.toString(), getItemQuantity(item.id.toString()) - 1)}
                          >
                            <LucideIcons.Minus className="h-4 w-4" />
                          </Button>
                          <span className="font-medium">{getItemQuantity(item.id.toString())}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={() => handleUpdateQuantity(item.id.toString(), getItemQuantity(item.id.toString()) + 1)}
                          >
                            <LucideIcons.Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </CardFooter>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Order from your table promotional button - Only shown in info mode */}
      {mode === 'info' && (
        <div className="fixed bottom-4 right-4 z-10">
          <Link href="/table">
            <Button className="gap-2 shadow-lg">
              <LucideIcons.QrCode className="h-4 w-4" />
              Order from your table
            </Button>
          </Link>
        </div>
      )}
      
      {/* Cart Summary - Only shown when cart has items in order mode */}
      {mode === 'order' && cart && cart.items.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t shadow-md p-4 flex justify-between items-center z-10">
          <div>
            <p className="font-medium">{cart.items.length} item{cart.items.length !== 1 ? 's' : ''}</p>
            <p className="text-lg font-bold">{formatCurrency(cart.grandTotal)}</p>
          </div>
          
          <Link href="/checkout">
            <Button className="gap-2">
              <LucideIcons.ShoppingCart className="h-4 w-4" />
              View Order
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
