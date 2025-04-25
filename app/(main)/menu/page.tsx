"use client";

import { useState, useEffect, useRef } from 'react';
import { ShoppingCart } from 'lucide-react';
import { MenuItemCard } from '@/components/menu/MenuItemCard';
import { CategoryNav } from '@/components/menu/CategoryNav';
import { useLocationState } from '@/lib/hooks/useLocationState';
import { useCartState } from '@/lib/hooks/useCartState';
import type { MenuCategory, MenuItem } from '@/lib/types/menu';
import { Button } from '@/components/ui/button';

// --- Side Hustle Bar Menu Data ---
const placeholderImg = '/images/food-placeholder.webp'; // Placeholder image

const SIDE_HUSTLE_MENU_DATA: MenuCategory[] = [
  {
    id: 'non-alcoholic-beverages',
    name: 'Non-Alcoholic Beverages',
    display_order: 1,
    items: [
      {
        id: 'fountain-drinks',
        name: 'Fountain Drinks',
        description: 'Unlimited refills. Coke, Dr Pepper, Diet Coke, Lemonade, Sprite, Sweet Ice Tea',
        price: 3.00,
        category_id: 'non-alcoholic-beverages',
        available: true,
        isOrderable: true, // Orderable
      },
      {
        id: 'glass-beverages',
        name: 'Glass Beverages',
        description: 'Topo Chico, Coke, Jarritos (Multiple Flavors), Sprite',
        price: 4.75,
        category_id: 'non-alcoholic-beverages',
        available: true,
        isOrderable: true, // Orderable
      },
      {
        id: 'smoothies',
        name: 'Smoothies',
        description: 'Comes with whipped cream. Strawberry, Watermelon, Mango, Peach, Passion Fruit, Raspberry, Prickly Pear, Pineapple, Guava, Kiwi, Blackberry, and Coconut',
        price: 13.00,
        category_id: 'non-alcoholic-beverages',
        available: true,
        isOrderable: true, // Orderable
      },
      {
        id: 'other-beverages',
        name: 'Other Beverages',
        description: 'Coffee, Abuelita Hot Chocolate, Red Bull',
        price: 4.75,
        category_id: 'non-alcoholic-beverages',
        available: true,
        isOrderable: true, // Orderable
      },
    ]
  },
  {
    id: 'birria-specialties',
    name: 'Birria Specialties',
    description: 'ALL BIRRIA ITEMS COME WITH CONSUME. Our chips are made in-house with handmade corn tortillas. Created by Head Chef Becky Sanchez.',
    display_order: 2,
    items: [
      {
        id: 'birria-queso-tacos',
        name: 'Birria Queso Tacos',
        description: '3 QUESO BIRRIA TACOS, QUESO OAXACA, ONIONS, CILANTRO',
        price: 16.75,
        category_id: 'birria-specialties',
        available: true,
        isOrderable: false, // Display only
        image_url: placeholderImg,
      },
      {
        id: 'birria-pizza',
        name: 'Birria Pizza',
        description: 'TWO FLOUR TORTILLAS, CILANTRO, ONIONS, QUESO OAXACA',
        price: 29.00,
        category_id: 'birria-specialties',
        available: true,
        isOrderable: false, // Display only
        image_url: placeholderImg,
      },
      {
        id: 'birria-ramen-bowl',
        name: 'Birria Ramen Bowl',
        description: 'BIRRIA TAPATIO NOODLES, CILANTRO AND ONIONS',
        price: 14.75,
        category_id: 'birria-specialties',
        available: true,
        isOrderable: false, // Display only
        image_url: placeholderImg,
      },
      {
        id: 'birria-flautas',
        name: 'Birria Flautas',
        description: 'CORN TORTILLA, BIRRIA, CONSUME',
        price: 12.00,
        category_id: 'birria-specialties',
        available: true,
        isOrderable: false, // Display only
        image_url: placeholderImg,
      },
    ]
  },
  {
    id: 'house-sauces',
    name: 'House Sauces',
    description: 'ALL SAUCE MADE IN HOUSE',
    display_order: 3,
    items: [
      { id: 'sauce-chefa', name: 'Chefa Sauce', price: 0, category_id: 'house-sauces', available: true, isOrderable: false },
      { id: 'sauce-guac', name: 'Guac', price: 0, category_id: 'house-sauces', available: true, isOrderable: false },
      { id: 'sauce-tomatillo', name: 'Tomatillo', price: 0, category_id: 'house-sauces', available: true, isOrderable: false },
      { id: 'sauce-ranchera', name: 'Ranchera', price: 0, category_id: 'house-sauces', available: true, isOrderable: false },
      { id: 'sauce-chile-de-arbol', name: 'Chile De Arbol', price: 0, category_id: 'house-sauces', available: true, isOrderable: false },
      { id: 'sauce-habanero', name: 'Habanero', price: 0, category_id: 'house-sauces', available: true, isOrderable: false },
    ]
  },
  {
    id: 'small-bites',
    name: 'Small Bites',
    display_order: 4,
    items: [
      {
        id: 'regular-tacos',
        name: 'Regular Tacos',
        description: 'Gluten free corn tortilla, onions, cilantro, choice of meat. Meat Options: Asada, Al Pastor, Carnitas, Chorizo, Pollo, Veggies, +$2.00 Lengua',
        price: 3.75,
        category_id: 'small-bites',
        available: true,
        isOrderable: false,
        image_url: placeholderImg,
      },
      {
        id: 'queso-tacos',
        name: 'Queso Tacos',
        description: 'Gluten free corn tortilla, queso Oaxaca, onions, cilantro, choice of meat. Meat Options: Asada, Al Pastor, Carnitas, Chorizo, Pollo, Veggies, +$2.00 Lengua',
        price: 5.75,
        category_id: 'small-bites',
        available: true,
        isOrderable: false,
        image_url: placeholderImg,
      },
      {
        id: 'chips-guac',
        name: 'Chips & Guac',
        description: 'Our chips are made in-house with handmade corn tortillas.',
        price: 8.00,
        category_id: 'small-bites',
        available: true,
        isOrderable: false,
        image_url: placeholderImg,
      },
      { id: 'basket-fries', name: 'Basket of Fries', price: 7.00, category_id: 'small-bites', available: true, isOrderable: false },
      { id: 'basket-tots', name: 'Basket of Tots', price: 7.00, category_id: 'small-bites', available: true, isOrderable: false },
    ]
  },
  {
    id: 'seafood',
    name: 'Seafood',
    display_order: 5,
    items: [
      {
        id: 'fried-fish-tacos',
        name: 'Fried Fish Tacos (2)',
        description: 'ONIONS, CABBAGE, CHIPOTLE, CHEESE, CORN TORTILLA',
        price: 8.75,
        category_id: 'seafood',
        available: true,
        isOrderable: false,
        image_url: placeholderImg,
      },
      {
        id: 'fried-shrimp-tacos',
        name: 'Fried Shrimp Tacos (2)',
        description: 'ONIONS, CABBAGE, CHIPOTLE, CHEESE, CORN TORTILLA',
        price: 8.75,
        category_id: 'seafood',
        available: true,
        isOrderable: false,
        image_url: placeholderImg,
      },
    ]
  },
  {
    id: 'breakfast',
    name: 'Breakfast',
    display_order: 6,
    items: [
      {
        id: 'breakfast-burrito-asada-bacon',
        name: 'Burritos w/Eggs - Asada & Bacon',
        description: 'FLOUR TORTILLA, ASADA, BACON, TOTS, SOUR CREAM, GUAC SAUCE',
        price: 13.00,
        category_id: 'breakfast',
        available: true,
        isOrderable: false,
        image_url: placeholderImg,
      },
    ]
  },
  {
    id: 'wings',
    name: 'Wings',
    description: 'TRADITIONAL OR BONELESS. Flavors: KOREAN BBQ, MANGO HABANERO, SWEET TERIYAKI, GARLIC BUFFALO, BUFFALO, GARLIC PARMESAN, BBQ',
    display_order: 7,
    items: [
      { id: 'wings-4', name: 'Wings (4)', price: 8.00, category_id: 'wings', available: true, isOrderable: false, image_url: placeholderImg },
      { id: 'wings-8', name: 'Wings (8)', price: 15.00, category_id: 'wings', available: true, isOrderable: false, image_url: placeholderImg },
    ]
  },
  {
    id: 'main-dishes',
    name: 'Main Dishes',
    display_order: 8,
    items: [
      {
        id: 'burrito',
        name: 'Burrito',
        description: 'Flour tortilla, beans, rice, cilantro, onions, guac sauce, chipotle, tortilla chips, choice of meat. Meat Options: Asada, Al Pastor, Carnitas, Chorizo, Pollo, Veggies, +$2.00 Lengua',
        price: 12.00,
        category_id: 'main-dishes',
        available: true,
        isOrderable: false,
        image_url: placeholderImg,
      },
      {
        id: 'quesadilla',
        name: 'Quesadilla',
        description: 'Flour tortilla, queso Oaxaca, guac sauce, choice of meat. Meat Options: Asada, Al Pastor, Carnitas, Chorizo, Pollo, Veggies, +$2.00 Lengua',
        price: 14.00,
        category_id: 'main-dishes',
        available: true,
        isOrderable: false,
        image_url: placeholderImg,
      },
      {
        id: 'torta',
        name: 'Torta',
        description: 'Bread, queso Oaxaca, beans, lettuce, tomatoes, onions, cilantro, avocado, jalapeños, chipotle, guac sauce, cotija, choice of meat. Meat Options: Asada, Al Pastor, Carnitas, Chorizo, Pollo, Veggies, +$2.00 Lengua',
        price: 13.50,
        category_id: 'main-dishes',
        available: true,
        isOrderable: false,
        image_url: placeholderImg,
      },
      {
        id: 'flautas-4',
        name: 'Flautas (4)',
        description: 'Potatoes and carnitas',
        price: 10.00,
        category_id: 'main-dishes',
        available: true,
        isOrderable: false,
        image_url: placeholderImg,
      },
      {
        id: 'mulitas',
        name: 'Mulitas',
        description: 'Corn tortilla, queso Oaxaca, cilantro, onions, guac sauce, choice of meat. Meat Options: Asada, Al Pastor, Carnitas, Chorizo, Pollo, Veggies, +$2.00 Lengua',
        price: 7.75,
        category_id: 'main-dishes',
        available: true,
        isOrderable: false,
        image_url: placeholderImg,
      },
      {
        id: 'vampiros',
        name: 'Vampiros',
        description: 'Corn tortilla, queso Oaxaca, guacamole, choice of meat. Meat Options: Asada, Al Pastor, Carnitas, Chorizo, Pollo, Veggies, +$2.00 Lengua',
        price: 7.75,
        category_id: 'main-dishes',
        available: true,
        isOrderable: false,
        image_url: placeholderImg,
      },
      {
        id: 'empanadas',
        name: 'Empanadas',
        description: 'Fried flour, queso Oaxaca, sour cream, guac sauce, lettuce',
        price: 7.00,
        category_id: 'main-dishes',
        available: true,
        isOrderable: false,
        image_url: placeholderImg,
      },
      {
        id: 'loaded-fries-full',
        name: 'Loaded Fries (Full)',
        description: 'Nacho cheese, pico, jalapeños, guac sauce, chipotle, cotija, sour cream, choice of meat. Meat Options: Asada, Al Pastor, Carnitas, Chorizo, Pollo, Veggies, +$2.00 Lengua',
        price: 19.00,
        category_id: 'main-dishes',
        available: true,
        isOrderable: false,
        image_url: placeholderImg,
      },
      { id: 'loaded-fries-half', name: 'Loaded Fries (Half)', price: 12.00, category_id: 'main-dishes', available: true, isOrderable: false, image_url: placeholderImg, description: 'Half portion of loaded fries.' },
      {
        id: 'loaded-nachos-full',
        name: 'Loaded Nachos (Full)',
        description: 'Nacho cheese, pico, jalapeños, guac sauce, chipotle, cotija, sour cream, choice of meat. Meat Options: Asada, Al Pastor, Carnitas, Chorizo, Pollo, Veggies, +$2.00 Lengua',
        price: 19.00,
        category_id: 'main-dishes',
        available: true,
        isOrderable: false,
        image_url: placeholderImg,
      },
      { id: 'loaded-nachos-half', name: 'Loaded Nachos (Half)', price: 12.00, category_id: 'main-dishes', available: true, isOrderable: false, image_url: placeholderImg, description: 'Half portion of loaded nachos.' },
      {
        id: 'hustle-bowl',
        name: 'Hustle Bowl',
        description: 'Beans, rice, lettuce, pico, jalapeños, sour cream, guac sauce, cotija, tortilla chips, choice of meat. Meat Options: Asada, Al Pastor, Carnitas, Chorizo, Pollo, Veggies, +$2.00 Lengua',
        price: 15.00,
        category_id: 'main-dishes',
        available: true,
        isOrderable: false,
        image_url: placeholderImg,
      },
      {
        id: 'taco-salad',
        name: 'Taco Salad',
        description: 'Flour tortilla, lettuce, pico, cilantro, sour cream, cotija, choice of meat. Meat Options: Asada, Al Pastor, Carnitas, Chorizo, Pollo, Veggies, +$2.00 Lengua',
        price: 14.00,
        category_id: 'main-dishes',
        available: true,
        isOrderable: false,
        image_url: placeholderImg,
      },
    ]
  }
];

// Mock function for Supabase data fetching (replace with actual fetch)
async function fetchMenuData(): Promise<MenuCategory[]> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 50));
  // In a real app, fetch from Supabase
  // const { data, error } = await supabase.from('categories').select('*, items(*)');
  // if (error) console.error('Error fetching menu:', error);
  // return data || [];
  return SIDE_HUSTLE_MENU_DATA; // Return the hardcoded data for now
}

export default function MenuPage() {
  const { location } = useLocationState(); // Fix: Use 'location'
  const { items: cart, addItem, getTotalPrice } = useCartState(); // Fix: Use 'items' as 'cart', 'addItem', 'getTotalPrice'
  const [menuData, setMenuData] = useState<MenuCategory[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null); // Fix: Rename state
  const [isLoading, setIsLoading] = useState(true);
  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    setIsLoading(true);
    fetchMenuData()
      .then(data => {
        // Filter by location if needed (example)
        const filteredData = data; // Add location filtering logic here if necessary
        setMenuData(filteredData);
        if (filteredData.length > 0 && !activeCategory) { // Fix: Use activeCategory
          setActiveCategory(filteredData[0].id); // Fix: Use setActiveCategory
        }
      })
      .catch(error => console.error('Failed to load menu data:', error))
      .finally(() => setIsLoading(false));
  }, [location, activeCategory]); // Fix: Use location, activeCategory

  const handleCategoryChange = (categoryId: string) => { // Fix: Rename handler
    setActiveCategory(categoryId); // Fix: Use setActiveCategory
    const element = categoryRefs.current[categoryId];
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Add offset for sticky header if necessary
      // window.scrollBy(0, -80); // Example offset
    }
  };

  const handleAddToCart = (item: MenuItem) => { // Use the correct hook function name
    console.log('Adding to cart:', item);
    addItem(item); // Fix: Use 'addItem'
    // Optionally show a toast notification
  };

  // Filter categories/items based on location - placeholder
  const displayedCategories = menuData.filter(category => {
    // Add logic here if menu differs by location (Portland/Salem)
    // return !category.location || category.location === location; // Fix: Use location
    return true; // Show all for now
  }).sort((a, b) => (a.display_order ?? 99) - (b.display_order ?? 99));

  if (isLoading) {
    return <div className="container mx-auto px-4 py-8 text-center">Loading menu...</div>;
  }

  if (!menuData || menuData.length === 0) {
    return <div className="container mx-auto px-4 py-8 text-center">Menu not available.</div>;
  }

  return (
    <div className="container mx-auto px-0 sm:px-4 py-4">
      <div className="sticky top-[56px] z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b mb-6">
        <CategoryNav
          categories={displayedCategories}
          activeCategory={activeCategory || ''} // Fix: Pass activeCategory, provide default
          onCategoryChangeAction={handleCategoryChange} // Fix: Pass correct handler name
        />
      </div>

      <div className="px-2 sm:px-0">
        {displayedCategories.map((category) => (
          <div
            key={category.id}
            ref={(el) => { categoryRefs.current[category.id] = el; }} // Fix: Correct ref callback signature
            className="mb-12 scroll-mt-24" // Added scroll-mt for sticky nav offset
          >
            <h2 className="text-2xl font-bold mb-4 border-b pb-2">{category.name}</h2>
            {category.description && <p className="text-muted-foreground mb-4 italic">{category.description}</p>}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {category.items
                // Optional: Filter items based on location
                // .filter(item => !item.location || item.location === location) // Fix: Use location
                .map((item) => (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    onAddToCart={handleAddToCart}
                    isOrderable={item.isOrderable} // Pass the flag here
                  />
                ))}
            </div>
          </div>
        ))}
      </div>

      {/* Optional: Cart Summary/Checkout Button */}
      {cart.length > 0 && (
        <div className="fixed bottom-16 left-0 right-0 p-4 bg-background border-t shadow-lg z-40">
          <div className="container mx-auto flex justify-between items-center">
            <span className="font-semibold">{cart.length} items</span>
            <Button>
              View Order (${getTotalPrice().toFixed(2)}) {/* Fix: Use getTotalPrice */}
              <ShoppingCart className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}