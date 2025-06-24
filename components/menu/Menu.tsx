// components/menu/Menu.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  UtensilsCrossed, 
  Wine, 
  AlertCircle, 
  RefreshCw,
  ArrowLeft,
  ShoppingCart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { toast } from '@/components/ui/use-toast';
import MenuCategoryNav from './MenuCategoryNav';
import MenuItemCard, { CompactMenuItemCard } from './MenuItemCard';
import Cart, { useCart } from '@/components/cart/Cart';
import { useAuth } from '@/lib/contexts/AuthContext';
import { createCartItem, ItemCustomization } from '@/types/wolfpack-unified';
import type { 
  MenuCategory, 
  MenuCategoryWithCount, 
  MenuItemWithModifiers, 
  CartOrderData
} from '@/lib/types/menu';

export default function Menu() {
  const [activeTab, setActiveTab] = useState<'food' | 'drink'>('food');
  const [categories, setCategories] = useState<MenuCategoryWithCount[]>([]);
  const [items, setItems] = useState<MenuItemWithModifiers[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [useCompactView, setUseCompactView] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Get the Supabase client
  const supabase = getSupabaseBrowserClient();
  
  // Cart management
  const { cartCount, addToCart } = useCart();
  const { user } = useAuth();

  // Initialize client-side state
  useEffect(() => {
    // Check if mobile device (mobile-first approach)
    const checkMobile = () => {
      setUseCompactView(window.innerWidth < 640);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch menu data function
  const fetchMenuData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch categories using direct Supabase query
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('food_drink_categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (categoriesError) throw categoriesError;

      // Fetch items with modifiers using RPC function
      const { data: rpcItemsData, error: itemsError } = await supabase
        .rpc('get_menu_items_with_modifiers');

      if (itemsError) throw itemsError;
      
      // Convert RPC items to MenuItemWithModifiers format
      const convertedItems: MenuItemWithModifiers[] = [];
      
      if (rpcItemsData && Array.isArray(rpcItemsData)) {
        for (const rpcItem of rpcItemsData) {
          try {
            // Direct conversion from RPC format to MenuItemWithModifiers
            const convertedItem: MenuItemWithModifiers = {
              id: rpcItem.id,
              name: rpcItem.name,
              description: rpcItem.description,
              price: typeof rpcItem.price === 'string' ? parseFloat(rpcItem.price) : rpcItem.price,
              is_available: rpcItem.is_available,
              display_order: rpcItem.display_order,
              category_id: rpcItem.category_id,
              category: {
                id: rpcItem.category_id,
                name: rpcItem.category_name,
                type: rpcItem.menu_type
              },
              modifiers: rpcItem.modifiers, // RPC already returns in correct format
              image_url: rpcItem.image_url
            };
            convertedItems.push(convertedItem);
          } catch (e) {
            console.error('Error converting menu item:', e, rpcItem);
          }
        }
      }

      // Count items per category
      const categoriesWithCount: MenuCategoryWithCount[] = (categoriesData || []).map((cat: MenuCategory) => ({
        ...cat,
        item_count: convertedItems.filter((item) => item.category_id === cat.id).length
      }));

      setCategories(categoriesWithCount);
      setItems(convertedItems);

      // Set initial active category
      setActiveCategory(prevCategory => {
        if (!prevCategory && categoriesWithCount.length > 0) {
          const firstFoodCategory = categoriesWithCount.find(cat => cat.type === 'food');
          return firstFoodCategory?.id || categoriesWithCount[0].id;
        }
        return prevCategory;
      });

      setHasInitialized(true);
    } catch (err) {
      console.error('Error fetching menu data:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Failed to load menu: ${errorMessage}`);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Initial data fetch
  useEffect(() => {
    if (typeof window !== 'undefined' && !hasInitialized) {
      fetchMenuData();
    }
  }, [fetchMenuData, hasInitialized]);

  // Update active category when tab changes
  useEffect(() => {
    if (categories.length === 0) return;

    const currentCategory = categories.find(cat => cat.id === activeCategory);
    
    if (!currentCategory || currentCategory.type !== activeTab) {
      const firstCategoryInTab = categories.find(cat => cat.type === activeTab);
      if (firstCategoryInTab) {
        setActiveCategory(firstCategoryInTab.id);
      }
    }
  }, [activeTab, categories, activeCategory]);

  // Handle add to cart
  const handleAddToCart = useCallback((orderData: CartOrderData) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to add items to your cart.",
      });
      return;
    }

    // Find the menu item to get image_url
    const menuItem = items.find(item => item.id === orderData.item.id);
    
    // Convert modifiers to unified customizations structure
    const customizations: ItemCustomization = {
      meat: orderData.modifiers.meat,
      sauces: orderData.modifiers.sauces || [],
      special_instructions: orderData.specialInstructions
    };

    // Create cart item using unified utility function
    const cartItem = createCartItem(
      {
        id: orderData.item.id,
        name: orderData.item.name,
        price: orderData.item.price,
        image_url: menuItem?.image_url || undefined
      },
      orderData.quantity,
      customizations
    );

    addToCart(cartItem);
  }, [user, addToCart, items]);

  // Handle checkout
  const handleCheckout = useCallback(async (cartItems: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    image_url?: string;
    notes?: string;
    modifiers?: {
      meat?: { id: string; name: string; price_adjustment: number } | null;
      sauces?: Array<{ id: string; name: string; price_adjustment: number }>;
    };
  }>, notes: string, total: number) => {
    if (!user) {
      throw new Error('Authentication required');
    }

    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: cartItems,
        notes,
        total
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to place order');
    }

    return response.json();
  }, [user]);

  // Mobile-first loading skeleton
  const LoadingSkeleton = () => (
    <div className="space-y-4">
      {/* Category skeleton */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="h-10 w-24 flex-shrink-0 rounded-lg" />
        ))}
      </div>
      {/* Items skeleton */}
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map(i => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );

  // Filter categories by type
  const foodCategories = categories.filter(cat => cat.type === 'food');
  const drinkCategories = categories.filter(cat => cat.type === 'drink');

  // Filter items by active category
  const activeItems = items.filter(item => item.category_id === activeCategory);

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background p-4">
        <Alert variant="destructive" className="mx-auto max-w-lg">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex flex-col gap-3">
            <span>{error}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchMenuData}
              className="w-full"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile-First Header */}
      <header className="sticky top-0 z-40 bg-background border-b">
        <div className="flex items-center justify-between p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.history.back();
              }
            }}
            className="h-10 w-10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">Menu</h1>
          
          {/* Cart Button or Login CTA */}
          {user ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCartOpen(true)}
              className="h-10 w-10 relative"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
                  {cartCount}
                </Badge>
              )}
            </Button>
          ) : (
            <Button
              variant="default"
              size="sm"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.location.href = '/login';
                }
              }}
              className="text-xs"
            >
              Login
            </Button>
          )}
        </div>
      </header>

      {/* Main Tabs - Full width on mobile */}
      <div className="sticky top-[73px] z-30 bg-background border-b">
        <Tabs 
          value={activeTab} 
          onValueChange={(val) => setActiveTab(val as 'food' | 'drink')} 
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 h-12 p-1 rounded-none">
            <TabsTrigger 
              value="food" 
              className="flex items-center gap-2 text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <UtensilsCrossed className="w-5 h-5" />
              <span>Food</span>
            </TabsTrigger>
            <TabsTrigger 
              value="drink" 
              className="flex items-center gap-2 text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Wine className="w-5 h-5" />
              <span>Drinks</span>
            </TabsTrigger>
          </TabsList>

          {/* Category Navigation - Horizontal scroll on mobile */}
          <div className="bg-muted/50">
            <TabsContent value="food" className="m-0">
              {loading ? (
                <div className="p-3">
                  <LoadingSkeleton />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <MenuCategoryNav
                    categories={foodCategories}
                    activeCategory={activeCategory}
                    onCategoryChange={setActiveCategory}
                    loading={loading}
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value="drink" className="m-0">
              {loading ? (
                <div className="p-3">
                  <LoadingSkeleton />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <MenuCategoryNav
                    categories={drinkCategories}
                    activeCategory={activeCategory}
                    onCategoryChange={setActiveCategory}
                    loading={loading}
                  />
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Menu Items - Mobile optimized */}
      <main className="bottom-nav-safe">
        {loading ? (
          <div className="p-4">
            <LoadingSkeleton />
          </div>
        ) : activeItems.length > 0 ? (
          <div className="menu-container">
            <div className={
              useCompactView 
                ? "space-y-2 p-4" 
                : "menu-grid"
            }>
              {activeItems.map(item => (
                useCompactView ? (
                  <CompactMenuItemCard
                    key={item.id}
                    item={item}
                    onAddToCart={handleAddToCart}
                  />
                ) : (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    onAddToCart={handleAddToCart}
                  />
                )
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            {activeTab === 'food' ? (
              <UtensilsCrossed className="w-16 h-16 text-muted-foreground mb-4" />
            ) : (
              <Wine className="w-16 h-16 text-muted-foreground mb-4" />
            )}
            <p className="text-lg text-muted-foreground">No items in this category</p>
            <p className="text-sm text-muted-foreground mt-1">Check back later!</p>
          </div>
        )}
      </main>

      {/* Cart Modal */}
      <Cart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onCheckout={handleCheckout}
      />
    </div>
  );
}
