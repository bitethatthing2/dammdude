'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ChevronLeft, Plus, Minus, X, ShoppingBag, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { useCart } from '@/components/bartap/CartContext';
import Link from 'next/link';
import type { Database } from '@/lib/database.types';

// Type definitions
interface MenuItem {
  id: number;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  available: boolean;
  category: string;
  type?: 'food' | 'drink';
  category_id: number;
  is_specialty?: boolean;
}

interface Category {
  id: string;
  name: string;
  type?: 'food' | 'drink';
}

interface UnifiedMenuDisplayProps {
  mode: 'view' | 'order';
  tableNumber?: string;
  onBack?: () => void;
  initialCategories?: Database['public']['Tables']['menu_categories']['Row'][];
}

export function UnifiedMenuDisplay({
  mode = 'view',
  tableNumber = '1',
  onBack,
  initialCategories = []
}: UnifiedMenuDisplayProps) {
  const router = useRouter();
  
  // State for active tab (food or drinks)
  const [activeTab, setActiveTab] = useState<'food' | 'drinks'>('food');
  const [searchQuery, setSearchQuery] = useState('');
  
  // State for menu items
  const [foodItems, setFoodItems] = useState<MenuItem[]>([]);
  const [drinkItems, setDrinkItems] = useState<MenuItem[]>([]);
  const [filteredFoodItems, setFilteredFoodItems] = useState<MenuItem[]>([]);
  const [filteredDrinkItems, setFilteredDrinkItems] = useState<MenuItem[]>([]);
  const [isFoodLoading, setIsFoodLoading] = useState(true);
  const [isDrinkLoading, setIsDrinkLoading] = useState(true);
  
  // Categories for food and drinks
  const [foodCategories, setFoodCategories] = useState<Category[]>([
    { id: 'all-food', name: 'All Food', type: 'food' }
  ]);
  
  const [drinkCategories, setDrinkCategories] = useState<Category[]>([
    { id: 'all-drinks', name: 'All Drinks', type: 'drink' }
  ]);
  
  // State for selected categories
  const [selectedFoodCategory, setSelectedFoodCategory] = useState<string>('all-food');
  const [selectedDrinkCategory, setSelectedDrinkCategory] = useState<string>('all-drinks');
  
  // Cart state (only used in order mode)
  const cart = mode === 'order' ? useCart() : null;
  
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
  
  // Initialize categories from props or fetch from database
  useEffect(() => {
    const initializeCategories = async () => {
      try {
        let categories = initialCategories;
        
        // If no categories provided, fetch from database
        if (!initialCategories || initialCategories.length === 0) {
          const supabase = getSupabaseBrowserClient();
          const { data, error } = await supabase
            .from('menu_categories')
            .select('*')
            .order('display_order');
            
          if (error) {
            console.error('Error fetching categories:', error);
            return;
          }
          
          categories = data || [];
        }
        
        // Create a map of category IDs by name for easy lookup
        const categoryMap = new Map();
        categories.forEach(cat => {
          categoryMap.set(cat.name.toUpperCase(), cat.id);
        });
        
        // Get the IDs for drink categories
        const drinkCategoryIds = drinkCategoryNames
          .map(name => categoryMap.get(name))
          .filter(Boolean);
        
        // Separate categories into food and drinks
        const foodCats = categories.filter(cat => {
          return !drinkCategoryIds.includes(cat.id);
        });
        
        const drinkCats = categories.filter(cat => {
          return drinkCategoryIds.includes(cat.id);
        });
        
        // Create UI-friendly category objects
        const uiFoodCategories = [
          { id: 'all-food', name: 'All Food', type: 'food' as const },
          ...foodCats.map(cat => ({
            id: cat.id,
            name: cat.name,
            type: 'food' as const
          }))
        ];
        
        const uiDrinkCategories = [
          { id: 'all-drinks', name: 'All Drinks', type: 'drink' as const },
          ...drinkCats.map(cat => ({
            id: cat.id,
            name: cat.name,
            type: 'drink' as const
          }))
        ];
        
        setFoodCategories(uiFoodCategories);
        setDrinkCategories(uiDrinkCategories);
      } catch (error) {
        console.error('Error initializing categories:', error);
      }
    };
    
    initializeCategories();
  }, [initialCategories]);
  
  // Fetch food items
  useEffect(() => {
    const fetchFoodItems = async () => {
      setIsFoodLoading(true);
      
      try {
        const supabase = getSupabaseBrowserClient();
        
        // Get food category IDs (excluding the "all-food" category)
        const foodCategoryIds = foodCategories
          .filter(cat => cat.id !== 'all-food')
          .map(cat => cat.id);
        
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
          .in('category_id', foodCategoryIds);
        
        // No filtering based on is_specialty - show all items in both modes
        
        // Execute query
        const { data, error } = await query;
        
        if (error) {
          console.error('Error fetching food items:', error);
          setFoodItems([]);
        } else {
          // Transform to MenuItem format
          const formattedItems = (data || []).map((item: Database['public']['Tables']['menu_items']['Row']) => ({
            id: item.id,
            name: item.name,
            description: item.description,
            price: item.price || 0,
            image_url: item.image_url,
            available: item.is_specialty ?? true,
            category: item.category_id?.toString() || '',
            category_id: item.category_id || 0,
            is_specialty: item.is_specialty,
            type: 'food' as const
          }));
          
          setFoodItems(formattedItems);
        }
      } catch (error) {
        console.error('Error in fetchFoodItems:', error);
        setFoodItems([]);
      } finally {
        setIsFoodLoading(false);
      }
    };
    
    fetchFoodItems();
  }, [foodCategories, mode]);
  
  // Fetch drink items
  useEffect(() => {
    const fetchDrinkItems = async () => {
      setIsDrinkLoading(true);
      
      try {
        const supabase = getSupabaseBrowserClient();
        
        // Get drink category IDs (excluding the "all-drinks" category)
        const drinkCategoryIds = drinkCategories
          .filter(cat => cat.id !== 'all-drinks')
          .map(cat => cat.id);
        
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
          .in('category_id', drinkCategoryIds);
        
        // No filtering based on is_specialty - show all items in both modes
        
        // Execute query
        const { data, error } = await query;
        
        if (error) {
          console.error('Error fetching drink items:', error);
          setDrinkItems([]);
        } else {
          // Transform to MenuItem format
          const formattedItems = (data || []).map((item: Database['public']['Tables']['menu_items']['Row']) => ({
            id: item.id,
            name: item.name,
            description: item.description,
            price: item.price || 0,
            image_url: item.image_url,
            available: item.is_specialty ?? true,
            category: item.category_id?.toString() || '',
            category_id: item.category_id || 0,
            is_specialty: item.is_specialty,
            type: 'drink' as const
          }));
          
          setDrinkItems(formattedItems);
        }
      } catch (error) {
        console.error('Error in fetchDrinkItems:', error);
        setDrinkItems([]);
      } finally {
        setIsDrinkLoading(false);
      }
    };
    
    fetchDrinkItems();
  }, [drinkCategories, mode]);
  
  // Filter food items based on category and search
  useEffect(() => {
    let filtered = foodItems;
    
    // Apply category filter
    if (selectedFoodCategory !== 'all-food') {
      filtered = filtered.filter(item => item.category_id && item.category_id.toString() === selectedFoodCategory);
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
      filtered = filtered.filter(item => item.category_id && item.category_id.toString() === selectedDrinkCategory);
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
  const getItemQuantity = (itemId: number): number => {
    if (!cart || mode !== 'order') return 0;
    const item = cart.items.find(item => item.id === itemId.toString());
    return item ? item.quantity : 0;
  };
  
  // Handle adding an item to the cart
  const handleAddToCart = (item: MenuItem) => {
    if (!cart || mode !== 'order') return;
    
    cart.addItem({
      id: item.id.toString(),
      name: item.name,
      price: item.price,
      image_url: item.image_url || '',
      description: item.description || '',
      category_id: item.category_id?.toString() || '',
      available: item.available
    });
  };
  
  // Handle updating item quantity
  const handleUpdateQuantity = (id: string, quantity: number) => {
    if (!cart || mode !== 'order') return;
    
    if (quantity > 0) {
      cart.updateQuantity(id, quantity);
    } else {
      cart.removeItem(id);
    }
  };
  
  // Navigate to checkout
  const goToCheckout = () => {
    router.push('/checkout');
  };
  
  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header with back navigation */}
      <div className="sticky top-0 z-20 flex items-center justify-between p-4 border-b border-border bg-background">
        <div className="flex items-center gap-2">
          <Button 
            onClick={onBack || (() => router.push('/'))}
            size="sm"
            className="flex items-center gap-1 bg-primary text-primary-foreground hover:bg-primary/90"
            aria-label="Back"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Back</span>
          </Button>
          <div>
            <p className="text-xs text-muted-foreground">Menu</p>
            <div className="flex items-center">
              <p className="text-sm font-medium">Side Hustle Bar</p>
            </div>
          </div>
        </div>
        
        {mode === 'order' && (
          <div className="flex items-center gap-2">
            <div className="flex items-center border rounded-lg px-2 py-1">
              <span className="text-xs text-muted-foreground mr-1">Table</span>
              <span className="w-10 h-6 p-0 text-sm text-center">{tableNumber}</span>
            </div>
            <Button
              onClick={() => router.push('/checkout')} 
              size="icon"
              variant="ghost"
              className="relative p-2 rounded-full bg-primary/10 text-primary"
            >
              <ShoppingBag className="h-5 w-5" />
              {cart && cart.items.length > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                  {cart.items.reduce((total, item) => total + item.quantity, 0)}
                </span>
              )}
            </Button>
          </div>
        )}
      </div>
      
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
          {foodCategories.map(category => (
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
          {drinkCategories.map(category => (
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
              {filteredFoodItems.map(item => {
                const quantity = getItemQuantity(item.id);
                
                return (
                  <div 
                    key={item.id} 
                    className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border hover:shadow-sm transition-shadow"
                  >
                    <div className="relative h-14 w-14 rounded-md overflow-hidden bg-muted/20 shrink-0">
                      {item.image_url ? (
                        <Image
                          src={item.image_url}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="56px"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/placeholder-food.webp';
                          }}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full bg-muted/20 text-muted-foreground">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M7 10h10"/>
                            <path d="M7 14h10"/>
                            <circle cx="12" cy="12" r="10"></circle>
                          </svg>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm truncate">{item.name}</h3>
                      {item.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{item.description}</p>
                      )}
                      <p className="text-xs font-semibold text-primary mt-1">${item.price.toFixed(2)}</p>
                    </div>
                    
                    {mode === 'order' && (
                      quantity === 0 ? (
                        <Button 
                          onClick={() => handleAddToCart(item)}
                          size="sm" 
                          className="h-8 text-xs px-2.5 shrink-0"
                        >
                          Add
                        </Button>
                      ) : (
                        <div className="flex items-center gap-1 shrink-0">
                          <Button 
                            size="icon"
                            variant="outline"
                            className="h-7 w-7 rounded-full"
                            onClick={() => handleUpdateQuantity(item.id.toString(), quantity - 1)}
                          >
                            {quantity === 1 ? <X className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                          </Button>
                          <span className="w-4 text-center text-xs font-medium">{quantity}</span>
                          <Button 
                            size="icon"
                            variant="outline"
                            className="h-7 w-7 rounded-full"
                            onClick={() => handleUpdateQuantity(item.id.toString(), quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      )
                    )}
                  </div>
                );
              })}
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
              {filteredDrinkItems.map(item => {
                const quantity = getItemQuantity(item.id);
                
                return (
                  <div 
                    key={item.id} 
                    className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border hover:shadow-sm transition-shadow"
                  >
                    <div className="relative h-14 w-14 rounded-md overflow-hidden bg-muted/20 shrink-0">
                      {item.image_url ? (
                        <Image
                          src={item.image_url}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="56px"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/placeholder-drink.webp';
                          }}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full bg-muted/20 text-muted-foreground">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m6 8 1.75 12.28a2 2 0 0 0 2 1.72h4.54a2 2 0 0 0 2-1.72L18 8"/>
                            <path d="M5 8h14"/>
                            <path d="M7 15a6.47 6.47 0 0 0 5 0 6.47 6.47 0 0 0 5 0"/>
                            <path d="m12 8-1-6h-2"/>
                          </svg>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm truncate">{item.name}</h3>
                      {item.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{item.description}</p>
                      )}
                      <p className="text-xs font-semibold text-primary mt-1">${item.price.toFixed(2)}</p>
                    </div>
                    
                    {mode === 'order' && (
                      quantity === 0 ? (
                        <Button 
                          onClick={() => handleAddToCart(item)}
                          size="sm" 
                          className="h-8 text-xs px-2.5 shrink-0"
                        >
                          Add
                        </Button>
                      ) : (
                        <div className="flex items-center gap-1 shrink-0">
                          <Button 
                            size="icon"
                            variant="outline"
                            className="h-7 w-7 rounded-full"
                            onClick={() => handleUpdateQuantity(item.id.toString(), quantity - 1)}
                          >
                            {quantity === 1 ? <X className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                          </Button>
                          <span className="w-4 text-center text-xs font-medium">{quantity}</span>
                          <Button 
                            size="icon"
                            variant="outline"
                            className="h-7 w-7 rounded-full"
                            onClick={() => handleUpdateQuantity(item.id.toString(), quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      )
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      
      {/* View-only mode: Order from your table CTA */}
      {mode === 'view' && (
        <div className="fixed bottom-4 right-4 z-10">
          <Link href="/table">
            <Button className="gap-2 shadow-lg">
              <ShoppingBag className="h-4 w-4" />
              Order from your table
            </Button>
          </Link>
        </div>
      )}
      
      {/* Order mode: Fixed checkout button */}
      {mode === 'order' && cart && cart.items.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-background shadow-lg border-t border-border py-3 px-4 z-10">
          <Button 
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={goToCheckout}
          >
            View Order ({cart.items.reduce((total, item) => total + item.quantity, 0)} items)
          </Button>
        </div>
      )}
    </div>
  );
}
