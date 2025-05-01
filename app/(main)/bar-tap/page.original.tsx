'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { ChevronLeft, Plus, Minus, X, ShoppingBag, Home, Search as SearchIcon, Bell, User, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { useCartState } from '@/lib/hooks/useCartState';
import type { Database } from '@/lib/database.types';

// Type definitions
interface Drink {
  id: number;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  available: boolean;
  category: string;
  type?: 'food' | 'drink';
}

interface Category {
  id: string;
  name: string;
  type?: 'food' | 'drink';
}

interface CategoryData {
  id: number;
  name: string;
}

export default function BarTapPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromFoodMenu = searchParams.get('from') === 'foodmenu';
  const tableParam = searchParams.get('table');
  
  // Initialize with the URL parameter or a default value, but don't access localStorage here
  const [tableNumber, setTableNumber] = useState(tableParam || '1');
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [foodItems, setFoodItems] = useState<Drink[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedFoodCategory, setSelectedFoodCategory] = useState<string>('all-food');
  const [filteredDrinks, setFilteredDrinks] = useState<Drink[]>([]);
  const [filteredFoodItems, setFilteredFoodItems] = useState<Drink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFoodLoading, setIsFoodLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'drinks' | 'food'>('drinks');
  const { items, addItem, removeItem, updateItemQuantity } = useCartState();
  
  // Categories for bar drinks
  const categories: Category[] = [
    { id: 'all', name: 'All Drinks', type: 'drink' },
    { id: 'beer', name: 'Beer', type: 'drink' },
    { id: 'wine', name: 'Wine', type: 'drink' },
    { id: 'house-favorites', name: 'House Favorites', type: 'drink' },
    { id: 'martini', name: 'Martinis', type: 'drink' },
    { id: 'margarita', name: 'Margaritas', type: 'drink' },
    { id: 'board', name: 'Boards', type: 'drink' },
    { id: 'flight', name: 'Flights', type: 'drink' },
    { id: 'tower', name: 'Towers', type: 'drink' },
    { id: 'non-alcoholic', name: 'Non-Alcoholic', type: 'drink' }
  ];
  
  // Categories for food
  const foodCategories: Category[] = [
    { id: 'all-food', name: 'All Food', type: 'food' },
    { id: 'small-bites', name: 'Small Bites', type: 'food' },
    { id: 'main', name: 'Main Dishes', type: 'food' },
    { id: 'side', name: 'Sides', type: 'food' },
    { id: 'dessert', name: 'Desserts', type: 'food' },
    { id: 'special', name: 'Specials', type: 'food' },
    { id: 'breakfast', name: 'Breakfast', type: 'food' },
    { id: 'wings', name: 'Wings', type: 'food' },
    { id: 'seafood', name: 'Seafood', type: 'food' }
  ];
  
  // Fetch drinks from Supabase
  useEffect(() => {
    const fetchDrinks = async () => {
      setIsLoading(true);
      
      try {
        const supabase = getSupabaseBrowserClient();
        
        // First, fetch all categories to get their IDs
        const { data: categoryData, error: categoryError } = await supabase
          .from('categories')
          .select('*')
          .order('display_order');
        
        if (categoryError) {
          console.error('Error fetching categories:', categoryError);
          setIsLoading(false);
          return;
        }
        
        // Map category names to their IDs for easy lookup
        const categoryMap = new Map();
        categoryData.forEach((category: any) => {
          categoryMap.set(category.name.toUpperCase(), category.id);
        });
        
        // Get IDs for drink categories
        const drinkCategoryIds = [
          categoryMap.get('HOUSE FAVORITES') || 47,
          categoryMap.get('MARTINIS') || 48,
          categoryMap.get('MARGARITAS') || 49,
          categoryMap.get('BOARDS') || 44,
          categoryMap.get('FLIGHTS') || 45,
          categoryMap.get('TOWERS') || 46,
          categoryMap.get('BOTTLE BEER') || 52,
          categoryMap.get('WINE') || 53,
          categoryMap.get('NON-ALCOHOLIC BEVERAGES') || 17
        ].filter(id => id !== undefined);
        
        // Define explicit list of drink items by name for additional filtering
        const drinkItems: string[] = [
          // House Favorites
          'HOUSE FAVORITES', 'ICED MARGATIRA', 'ICED DOÑA 70', 'ICED PINA COLADA',
          'CANTARITO', 'PALOMA', 'PINEAPPLE PARADISE', 'MICHELADA', 'BLOODY MARY',
          'PEACHY BEACHY', 'COCONUT BERRY DREAM', 'MANGO TAMARINDO',
          
          // Martinis
          'MARTINIS', 'CLASSIC MARTINI', 'ESPRESSO MARTINI', 'FRESH LEMON DROP',
          'LECHERA ESPRESSO', 'PASSION FRUIT DROP',
          
          // Boards
          'BOARDS', 'MIMOSA BOARD', 'MARGATRIA BOARD',
          
          // Flights
          'FLIGHTS', 'PATRON FLIGHT',
          
          // Towers
          'TOWERS', 'HUSTLE MARGARITA', 'TEXAS MARGARITA', 'BEER TOWERS',
          
          // Bottle Beer options
          'BOTTLE BEER', 'CORONA', 'MODELO', 'NEGRA MODELO', 'PACIFICO', 
          'DOS EQUIS', 'ESTRILLA', 'TECATE', 'ULTRA', 'BUD LIGHT', 
          'BUDWEISER', 'COORS BANQUET', 'WHITE CLAW', 'HIGHNOON', 
          'CANTARITOS', 'HEINEKEN', 'CORONA N/A', 'COORS', 'HEFE', 'CIDERS',
          
          // Wine options
          'WINE', 'SUTTER HOME', 'CABERNET SAUVIGNON', 'PINOT GRIGIO', 
          'MERLOT', 'SEAGLASS', 'CHARDONNAY', 'RIESLING', 'LINDEMAN', 
          'MOSCATO', 'SYCAMORE LANE', 'DOMAINE SAINT VINCENT', 'SPARKLING BRUT',
          
          // Non-alcoholic drinks - comprehensive list from menu
          'COKE', 'DR PEPPER', 'DIET COKE', 'SPRITE', 'FOUNTAIN DRINKS', 'FOUNTIAN DRINKS',
          'GLASS BEVERAGES', 'TOPO CHICO', 'JARRICO', 'JARRITOS',
          'SMOOTHIES', 'STRAWBERRY', 'WATERMELON', 'MANGO', 'PEACH', 'PASSION FRUIT',
          'RASPBERRY', 'PRICKLY PEAR', 'PINEAPPLE', 'GUAVA', 'KIWI', 'BLACK BERRY', 'COCONUT',
          'COFFEE', 'ABULITA HOT CHOCOLATE', 'ABUELITA HOT CHOCOLATE', 'HOT CHOCOLATE', 'RED BULL',
          'LEMONADE', 'SWEET ICE TEA', 'TEA'
        ];
        
        // Fetch drink items by their category IDs
        const { data: drinkData, error: drinkError } = await supabase
          .from('menu_items')
          .select('*')
          .in('category_id', drinkCategoryIds)
          .order('name');
        
        if (drinkError) {
          console.error('Error fetching drinks:', drinkError);
          setIsLoading(false);
          return;
        }
        
        // Transform menu items into drinks format
        const formattedDrinks = (drinkData || []).map((item: Database['public']['Tables']['menu_items']['Row']) => {
          // Determine the front-end category based on the database category_id
          let category = 'all';
          
          // Map Supabase category_id to our front-end category
          if (item.category_id === categoryMap.get('BOARDS')) {
            category = 'board';
          } else if (item.category_id === categoryMap.get('FLIGHTS')) {
            category = 'flight';
          } else if (item.category_id === categoryMap.get('TOWERS')) {
            category = 'tower';
          } else if (item.category_id === categoryMap.get('HOUSE FAVORITES')) {
            category = 'house-favorites';
          } else if (item.category_id === categoryMap.get('MARTINIS')) {
            category = 'martini';
          } else if (item.category_id === categoryMap.get('MARGARITAS')) {
            category = 'margarita';
          } else if (item.category_id === categoryMap.get('BOTTLE BEER')) {
            category = 'beer';
          } else if (item.category_id === categoryMap.get('WINE')) {
            category = 'wine';
          } else if (item.category_id === categoryMap.get('NON-ALCOHOLIC BEVERAGES')) {
            category = 'non-alcoholic';
          } else {
            // If category_id doesn't match, fall back to name-based determination
            category = determineCategory(item.name, 'drink');
          }
          
          return {
            id: item.id,
            name: item.name,
            description: item.description,
            price: item.price || 0,
            image_url: item.image_url,
            available: true, // Default to available
            category: category,
            type: 'drink' as const
          };
        });
        
        setDrinks(formattedDrinks);
      } catch (error) {
        console.error('Error in fetchDrinks:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDrinks();
    
    // Update table number in localStorage - safely check for browser environment
    if (typeof window !== 'undefined') {
      localStorage.setItem('tableNumber', tableNumber);
    }
  }, [tableNumber]);
  
  // Fetch food items from Supabase
  useEffect(() => {
    const fetchFoodItems = async () => {
      setIsFoodLoading(true);
      
      try {
        const supabase = getSupabaseBrowserClient();
        
        // Define explicit list of food items by name for additional filtering
        const foodItems: string[] = [
          // Small Bites
          'SMALL BITES', 'CHIPS & GUAC', 'BASKET OF FRIES', 'BASKET OF TOTS',
          
          // Main Dishes
          'MAIN', 'FLAUTAS', 'LOADED FRIES', 'LOADED NACHO', 
          'TACOS', 'QUESO TACOS', 'BURRITO', 'MULITAS', 'TORTA', 'EMPANADAS',
          'HUSTLE BOWL', 'TACO SALAD', 'QUESADILLA', 'VAMPIROS',
          
          // Birria
          'BIRRIA', 'BIRRIA QUESO TACOS', 'BIRRIA PIZZA', 'BIRRIA RAMEN BOWL', 'BIRRIA FLAUTAS',
          
          // Seafood
          'SEA FOOD', 'FRIED FISH TACOS', 'FRIED SHRIMP TACOS',
          
          // Wings
          'WINGS', 'KOREAN BBQ', 'MANGO HABANERO', 'SWEET TERIYAKI', 'GARLIC BUFFALO', 'BUFFALO', 'GARLIC PARMESAN', 'BBQ',
          
          // Breakfast
          'BREAKFAST', 'ASADA & BACON',
          
          // Meat options
          'MEAT', 'ASADA', 'BIRRIA', 'AL PASTOR', 'CARNITAS', 'CHORIZO', 'POLLO', 'VEGGIES', 'LENGUA'
        ];
        
        // Define explicit list of drink items to exclude
        const drinkItems: string[] = [
          // House Favorites
          'HOUSE FAVORITES', 'ICED MARGATIRA', 'ICED DOÑA 70', 'ICED PINA COLADA',
          'CANTARITO', 'PALOMA', 'PINEAPPLE PARADISE', 'MICHELADA', 'BLOODY MARY',
          'PEACHY BEACHY', 'COCONUT BERRY DREAM', 'MANGO TAMARINDO',
          
          // Martinis
          'MARTINIS', 'CLASSIC MARTINI', 'ESPRESSO MARTINI', 'FRESH LEMON DROP',
          'LECHERA ESPRESSO', 'PASSION FRUIT DROP',
          
          // Boards
          'BOARDS', 'MIMOSA BOARD', 'MARGATRIA BOARD',
          
          // Flights
          'FLIGHTS', 'PATRON FLIGHT',
          
          // Towers
          'TOWERS', 'HUSTLE MARGARITA', 'TEXAS MARGARITA', 'BEER TOWERS',
          
          // Bottle Beer options
          'BOTTLE BEER', 'CORONA', 'MODELO', 'NEGRA MODELO', 'PACIFICO', 
          'DOS EQUIS', 'ESTRILLA', 'TECATE', 'ULTRA', 'BUD LIGHT', 
          'BUDWEISER', 'COORS BANQUET', 'WHITE CLAW', 'HIGHNOON', 
          'CANTARITOS', 'HEINEKEN', 'CORONA N/A', 'COORS', 'HEFE', 'CIDERS',
          
          // Wine options
          'WINE', 'SUTTER HOME', 'CABERNET SAUVIGNON', 'PINOT GRIGIO', 
          'MERLOT', 'SEAGLASS', 'CHARDONNAY', 'RIESLING', 'LINDEMAN', 
          'MOSCATO', 'SYCAMORE LANE', 'DOMAINE SAINT VINCENT', 'SPARKLING BRUT',
          
          // Non-alcoholic drinks
          'COKE', 'DR PEPPER', 'DIET COKE', 'SPRITE', 'FOUNTAIN DRINKS', 'FOUNTIAN DRINKS',
          'GLASS BEVERAGES', 'TOPO CHICO', 'JARRICO', 'JARRITOS',
          'SMOOTHIES', 'STRAWBERRY', 'WATERMELON', 'MANGO', 'PEACH', 'PASSION FRUIT',
          'RASPBERRY', 'PRICKLY PEAR', 'PINEAPPLE', 'GUAVA', 'KIWI', 'BLACK BERRY', 'COCONUT',
          'COFFEE', 'ABULITA HOT CHOCOLATE', 'ABUELITA HOT CHOCOLATE', 'HOT CHOCOLATE', 'RED BULL',
          'LEMONADE', 'SWEET ICE TEA', 'TEA'
        ];
        
        // Create a complex query to fetch all food items
        let query = supabase
          .from('menu_items')
          .select('*');
        
        // Build conditions to include food categories
        let includeConditions = foodItems.map(category => 
          `name.ilike.%${category.toLowerCase()}%`
        ).join(',');
        
        // First get all items that match food categories
        const { data: potentialFoodData, error: potentialFoodError } = await query
          .or(includeConditions)
          .order('name');
          
        if (potentialFoodError) {
          console.error('Error fetching potential food items:', potentialFoodError);
          setIsFoodLoading(false);
          return;
        }
        
        // Then filter out any items that match drink names
        const foodData = potentialFoodData.filter((item: Database['public']['Tables']['menu_items']['Row']) => {
          const itemName = item.name.toUpperCase();
          // Check if the item name contains any drink item name
          return !drinkItems.some((drinkName: string) => 
            itemName.includes(drinkName.toUpperCase())
          );
        });
        
        // Transform menu items into food format
        const formattedFoodItems = (foodData || []).map((item: Database['public']['Tables']['menu_items']['Row']) => ({
          id: item.id,
          name: item.name,
          description: item.description,
          price: item.price || 0,
          image_url: item.image_url,
          available: true, // Default to available
          category: determineCategory(item.name, 'food'),
          type: 'food' as const
        }));
        
        setFoodItems(formattedFoodItems);
      } catch (error) {
        console.error('Error in fetchFoodItems:', error);
      } finally {
        setIsFoodLoading(false);
      }
    };
    
    fetchFoodItems();
  }, []);
  
  // Filter drinks based on category and search query
  useEffect(() => {
    let filtered = drinks;
    
    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(drink => drink.category === selectedCategory);
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        drink => drink.name.toLowerCase().includes(query) || 
                (drink.description && drink.description.toLowerCase().includes(query))
      );
    }
    
    setFilteredDrinks(filtered);
  }, [drinks, selectedCategory, searchQuery]);
  
  // Filter food items based on category and search query
  useEffect(() => {
    let filtered = foodItems;
    
    // Apply category filter
    if (selectedFoodCategory !== 'all-food') {
      filtered = filtered.filter(food => food.category === selectedFoodCategory);
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        food => food.name.toLowerCase().includes(query) || 
               (food.description && food.description.toLowerCase().includes(query))
      );
    }
    
    setFilteredFoodItems(filtered);
  }, [foodItems, selectedFoodCategory, searchQuery]);
  
  // Determine drink category based on name
  function determineCategory(name: string, type: 'food' | 'drink'): string {
    const lowerName = name.toLowerCase();
    
    if (type === 'drink') {
      // House Favorites category
      if (lowerName.includes('house favorite') || 
          lowerName.includes('iced margatira') || lowerName.includes('iced doña 70') || 
          lowerName.includes('iced pina colada') || lowerName.includes('cantarito') || 
          lowerName.includes('paloma') || lowerName.includes('pineapple paradise') || 
          lowerName.includes('michelada') || lowerName.includes('bloody mary') || 
          lowerName.includes('peachy beachy') || lowerName.includes('coconut berry dream') || 
          lowerName.includes('mango tamarindo')) {
        return 'house-favorites';
      }
      // Beer category - catch all beer variations
      else if (lowerName.includes('beer') || lowerName.includes('ipa') || lowerName.includes('lager') || 
          lowerName.includes('ale') || lowerName.includes('bottle') || lowerName.includes('draft') ||
          lowerName.includes('corona') || lowerName.includes('modelo') || lowerName.includes('heineken') ||
          lowerName.includes('budweiser') || lowerName.includes('coors') || lowerName.includes('miller') ||
          lowerName.includes('bud light') || lowerName.includes('pacifico') || 
          lowerName.includes('dos equis') || lowerName.includes('estrilla') || 
          lowerName.includes('tecate') || lowerName.includes('ultra') || 
          lowerName.includes('white claw') || lowerName.includes('hefe') || 
          lowerName.includes('ciders') || lowerName.includes('n/a')) {
        return 'beer';
      } 
      // Wine category
      else if (lowerName.includes('wine') || lowerName.includes('red') || lowerName.includes('white') || 
               lowerName.includes('cabernet') || lowerName.includes('merlot') || lowerName.includes('chardonnay') ||
               lowerName.includes('pinot') || lowerName.includes('sauvignon') || lowerName.includes('zinfandel') ||
               lowerName.includes('rosé') || lowerName.includes('champagne') || lowerName.includes('prosecco') ||
               lowerName.includes('domaine') || lowerName.includes('sparkling') ||
               lowerName.includes('sutter home') || lowerName.includes('seaglass') ||
               lowerName.includes('grigio') || lowerName.includes('riesling') ||
               lowerName.includes('lindeman') || lowerName.includes('moscato') ||
               lowerName.includes('sycamore lane') || lowerName.includes('brut')) {
        return 'wine';
      } 
      // Martini category
      else if (lowerName.includes('martini') || lowerName.includes('classic martini') || 
               lowerName.includes('espresso martini') || lowerName.includes('fresh lemon drop') || 
               lowerName.includes('lechera espresso') || lowerName.includes('passion fruit drop') || 
               lowerName.includes('cosmopolitan') || lowerName.includes('appletini') || 
               lowerName.includes('vermouth') || lowerName.includes('olive') || 
               lowerName.includes('kahlua') || lowerName.includes('bay leaves')) {
        return 'martini';
      } 
      // Margarita category
      else if (lowerName.includes('margarita') || lowerName.includes('rita') || 
               lowerName.includes('hornitos') || lowerName.includes('combier') || 
               lowerName.includes('blue agave') || lowerName.includes('patron') || 
               lowerName.includes('don julio') || lowerName.includes('tajin')) {
        return 'margarita';
      } 
      // Board category
      else if (lowerName.includes('board') || lowerName.includes('mimosa board') || 
               lowerName.includes('margatria board') || lowerName.includes('brut champagne')) {
        return 'board';
      }
      // Flight category
      else if (lowerName.includes('flight') || lowerName.includes('patron flight')) {
        return 'flight';
      }
      // Tower category
      else if (lowerName.includes('tower') || lowerName.includes('hustle margarita') || 
               lowerName.includes('texas margarita') || lowerName.includes('88 oz')) {
        return 'tower';
      }
      // Non-alcoholic category
      else if (lowerName.includes('soda') || lowerName.includes('water') || lowerName.includes('juice') || 
               lowerName.includes('coffee') || lowerName.includes('tea') || lowerName.includes('milk') ||
               lowerName.includes('smoothie') || lowerName.includes('shake') || lowerName.includes('hot chocolate') ||
               lowerName.includes('fountain') || lowerName.includes('fountian') || 
               lowerName.includes('topo chico') || lowerName.includes('jarrico') || lowerName.includes('jarritos') ||
               lowerName.includes('red bull') || lowerName.includes('coke') || lowerName.includes('sprite') ||
               lowerName.includes('dr pepper') || lowerName.includes('diet coke') || 
               lowerName.includes('lemonade') || lowerName.includes('sweet ice tea') ||
               lowerName.includes('glass beverage') || lowerName.includes('abulita') || lowerName.includes('abuelita')) {
        return 'non-alcoholic';
      } 
      else {
        return 'all';
      }
    } else {
      // Small Bites category
      if (lowerName.includes('small bites') || lowerName.includes('chips & guac') || 
          lowerName.includes('basket of fries') || lowerName.includes('basket of tots')) {
        return 'small-bites';
      } 
      // Main dishes category
      else if (lowerName.includes('main') || lowerName.includes('flautas') || 
               lowerName.includes('loaded fries') || lowerName.includes('loaded nacho') || 
               lowerName.includes('tacos') || lowerName.includes('burrito') || 
               lowerName.includes('mulitas') || lowerName.includes('torta') || 
               lowerName.includes('hustle bowl') || lowerName.includes('taco salad') || 
               lowerName.includes('quesadilla') || lowerName.includes('vampiros') || 
               lowerName.includes('queso tacos') || lowerName.includes('empanadas')) {
        return 'main';
      }
      // Birria specials
      else if (lowerName.includes('birria') && (
               lowerName.includes('queso tacos') || lowerName.includes('pizza') || 
               lowerName.includes('ramen bowl') || lowerName.includes('flautas'))) {
        return 'special';
      }
      // Dessert category
      else if (lowerName.includes('dessert') || lowerName.includes('sweet') || lowerName.includes('cake') || 
               lowerName.includes('ice cream') || lowerName.includes('cookie') || lowerName.includes('brownie')) {
        return 'dessert';
      } 
      // Side dishes
      else if (lowerName.includes('side') || 
               (lowerName.includes('salad') && !lowerName.includes('taco salad')) || 
               lowerName.includes('vegetable')) {
        return 'side';
      } 
      // Specials category
      else if (lowerName.includes('special') || lowerName.includes('chef') || lowerName.includes('signature') || 
               lowerName.includes('specialty')) {
        return 'special';
      } 
      // Breakfast category
      else if (lowerName.includes('breakfast') || lowerName.includes('asada & bacon')) {
        return 'breakfast';
      }
      // Wings category
      else if (lowerName.includes('wings') || lowerName.includes('korean bbq') || 
               lowerName.includes('mango habanero') || lowerName.includes('sweet teriyaki') || 
               lowerName.includes('garlic buffalo') || lowerName.includes('buffalo') || 
               lowerName.includes('garlic parmesan') || lowerName.includes('bbq')) {
        return 'wings';
      }
      // Seafood category
      else if (lowerName.includes('seafood') || lowerName.includes('fried fish tacos') || 
               lowerName.includes('fried shrimp tacos')) {
        return 'seafood';
      }
      // Default to main if no other category matches
      else {
        return 'main';
      }
    }
  }
  
  // Function to filter menu items by category
  function filterItemsByCategory(items: Database['public']['Tables']['menu_items']['Row'][], categoryId: string, type: 'food' | 'drink'): Database['public']['Tables']['menu_items']['Row'][] {
    if (categoryId === 'all') {
      return items;
    }
    
    return items.filter((item: Database['public']['Tables']['menu_items']['Row']) => determineCategory(item.name, type) === categoryId);
  }
  
  // Handle adding a drink to the cart
  const handleAddToCart = (drink: Drink) => {
    addItem({
      id: drink.id.toString(),
      name: drink.name,
      price: drink.price,
      image_url: drink.image_url || '',
      description: drink.description || '',
      category_id: drink.category,
      available: drink.available,
      isOrderable: true
    });
  };
  
  // Handle updating drink quantity
  const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity > 0) {
      updateItemQuantity(itemId, newQuantity);
    } else {
      removeItem(itemId);
    }
  };
  
  // Get drink quantity in cart
  const getItemQuantity = (drinkId: number): number => {
    const item = items.find(item => item.id === drinkId.toString());
    return item ? item.quantity : 0;
  };
  
  // Handle table number change
  const handleTableNumberChange = (newNumber: string) => {
    if (parseInt(newNumber) > 0 && parseInt(newNumber) <= 50) {
      setTableNumber(newNumber);
    }
  };
  
  // Navigate to checkout
  const goToCheckout = () => {
    router.push('/menu/order-details');
  };
  
  // Return to food menu
  const returnToFoodMenu = () => {
    router.push('/menu');
  };
  
  // Navigate back to home
  const goBackToHome = () => {
    // Store table number in localStorage before navigating
    if (typeof window !== 'undefined') {
      localStorage.setItem('tableNumber', tableNumber);
    }
    router.push('/');
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header with back navigation */}
      <div className="sticky top-0 z-20 flex items-center justify-between p-4 border-b border-border bg-background">
        <div className="flex items-center gap-2">
          <Button 
            onClick={goBackToHome}
            size="sm"
            className="flex items-center gap-1 bg-primary text-primary-foreground hover:bg-primary/90"
            aria-label="Back to home"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Back</span>
          </Button>
          <div>
            <p className="text-xs text-muted-foreground">Bar Location</p>
            <div className="flex items-center">
              <p className="text-sm font-medium">Side Hustle Bar</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center border rounded-lg px-2 py-1">
            <span className="text-xs text-muted-foreground mr-1">Table</span>
            <Input
              type="number"
              value={tableNumber}
              onChange={(e) => handleTableNumberChange(e.target.value)}
              className="w-10 h-6 p-0 text-sm text-center border-0 focus-visible:ring-0"
              min="1"
              max="50"
            />
          </div>
          <Button
            onClick={() => router.push('/cart')} 
            size="icon"
            variant="ghost"
            className="relative p-2 rounded-full bg-primary/10 text-primary"
          >
            <ShoppingBag className="h-5 w-5" />
            {items.length > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                {items.reduce((total, item) => total + item.quantity, 0)}
              </span>
            )}
          </Button>
        </div>
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
            onClick={() => setActiveTab('drinks')}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              activeTab === 'drinks'
                ? 'bg-primary text-primary-foreground'
                : 'bg-card hover:bg-muted/50 text-foreground'
            }`}
          >
            Drinks
          </button>
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
        </div>
      </div>
      
      {/* Drink Categories */}
      <ScrollArea className={`pb-2 border-b border-border ${activeTab === 'drinks' ? 'block' : 'hidden'}`}>
        <div className="flex gap-1.5 overflow-x-auto py-2 px-4 snap-x">
          {categories.map(category => (
            <Button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              variant="ghost"
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs sm:text-sm whitespace-nowrap snap-start shrink-0",
                selectedCategory === category.id 
                  ? "bg-primary text-primary-foreground shadow-sm" 
                  : "bg-card hover:bg-accent text-foreground border border-border"
              )}
            >
              {category.name}
            </Button>
          ))}
        </div>
      </ScrollArea>
      
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
      
      {fromFoodMenu && (
        <div className="mx-4 mb-4 rounded-xl bg-blue-50 p-4 border border-blue-100 text-blue-800">
          <p className="text-sm">
            <strong>Tip:</strong> Add drinks to your food order! Your combined order will be delivered to your table.
          </p>
          <Button 
            variant="link" 
            className="text-blue-600 p-0 h-auto text-sm"
            onClick={returnToFoodMenu}
          >
            Return to food menu
          </Button>
        </div>
      )}
      
      {/* Drinks List */}
      <div className={`flex-1 overflow-auto pb-32 ${activeTab === 'drinks' ? 'block' : 'hidden'}`}>
        <div className="px-4 py-2">
          {isLoading ? (
            // Loading skeleton
            Array(6).fill(0).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 mb-2 bg-muted/30 rounded-lg animate-pulse h-20" />
            ))
          ) : filteredDrinks.length === 0 ? (
            <p className="text-center py-10 text-muted-foreground">
              {searchQuery ? 'No drinks found matching your search' : 'No drinks available in this category'}
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
              {filteredDrinks.map(drink => {
                const quantity = getItemQuantity(drink.id);
                
                return (
                  <div 
                    key={drink.id} 
                    className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border hover:shadow-sm transition-shadow"
                  >
                    <div className="relative h-14 w-14 rounded-md overflow-hidden bg-muted/20 shrink-0">
                      {drink.image_url ? (
                        <Image
                          src={drink.image_url}
                          alt={drink.name}
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
                      <h3 className="font-medium text-sm truncate">{drink.name}</h3>
                      {drink.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{drink.description}</p>
                      )}
                      <p className="text-xs font-semibold text-primary mt-1">${drink.price.toFixed(2)}</p>
                    </div>
                    
                    {quantity === 0 ? (
                      <Button 
                        onClick={() => handleAddToCart(drink)}
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
                          onClick={() => handleUpdateQuantity(drink.id.toString(), quantity - 1)}
                        >
                          {quantity === 1 ? <X className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                        </Button>
                        <span className="w-4 text-center text-xs font-medium">{quantity}</span>
                        <Button 
                          size="icon"
                          variant="outline"
                          className="h-7 w-7 rounded-full"
                          onClick={() => handleUpdateQuantity(drink.id.toString(), quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      
      {/* Food List */}
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
              {filteredFoodItems.map(food => {
                const quantity = getItemQuantity(food.id);
                
                return (
                  <div 
                    key={food.id} 
                    className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border hover:shadow-sm transition-shadow"
                  >
                    <div className="relative h-14 w-14 rounded-md overflow-hidden bg-muted/20 shrink-0">
                      {food.image_url ? (
                        <Image
                          src={food.image_url}
                          alt={food.name}
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
                      <h3 className="font-medium text-sm truncate">{food.name}</h3>
                      {food.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{food.description}</p>
                      )}
                      <p className="text-xs font-semibold text-primary mt-1">${food.price.toFixed(2)}</p>
                    </div>
                    
                    {quantity === 0 ? (
                      <Button 
                        onClick={() => handleAddToCart(food)}
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
                          onClick={() => handleUpdateQuantity(food.id.toString(), quantity - 1)}
                        >
                          {quantity === 1 ? <X className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                        </Button>
                        <span className="w-4 text-center text-xs font-medium">{quantity}</span>
                        <Button 
                          size="icon"
                          variant="outline"
                          className="h-7 w-7 rounded-full"
                          onClick={() => handleUpdateQuantity(food.id.toString(), quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      
      {/* Fixed checkout button */}
      {items.length > 0 && (
        <div className="fixed bottom-[72px] left-0 right-0 bg-background shadow-lg border-t border-border py-3 px-4 z-10">
          <Button 
            className="w-full bg-orange-500 hover:bg-orange-600 text-white"
            onClick={goToCheckout}
          >
            View Order ({items.reduce((total, item) => total + item.quantity, 0)} items)
          </Button>
        </div>
      )}
      
      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border shadow-md z-10">
        <div className="flex items-center justify-around py-3 max-w-md mx-auto">
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex flex-col items-center h-auto text-muted-foreground min-w-[64px]"
            onClick={() => router.push('/')}
          >
            <Home className="h-5 w-5" />
            <span className="text-xs font-medium mt-1">Home</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex flex-col items-center h-auto text-muted-foreground min-w-[64px]"
            onClick={() => router.push('/menu')}
          >
            <SearchIcon className="h-5 w-5" />
            <span className="text-xs font-medium mt-1">Menu</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex flex-col items-center h-auto text-orange-500 min-w-[64px]"
            onClick={goToCheckout}
          >
            <div className="relative">
              <ShoppingBag className="h-5 w-5" />
              {items.length > 0 && (
                <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[10px] font-medium text-white">
                  {items.reduce((total, item) => total + item.quantity, 0)}
                </span>
              )}
            </div>
            <span className="text-xs font-medium mt-1">Order</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex flex-col items-center h-auto text-muted-foreground min-w-[64px]"
            onClick={() => router.push('/notifications')}
          >
            <Bell className="h-5 w-5" />
            <span className="text-xs font-medium mt-1">Updates</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex flex-col items-center h-auto text-muted-foreground min-w-[64px]"
            onClick={() => router.push('/profile')}
          >
            <User className="h-5 w-5" />
            <span className="text-xs font-medium mt-1">Profile</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
