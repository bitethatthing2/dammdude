"use client";

import { useState, useEffect, useRef } from 'react';
import { ShoppingCart } from 'lucide-react';
import { MenuItemCard } from '@/components/menu/MenuItemCard';
import { CategoryNav } from '@/components/menu/CategoryNav';
import { useLocationState } from '@/lib/hooks/useLocationState';
import { useCartState } from '@/lib/hooks/useCartState';
import type { MenuCategory, MenuItem } from '@/lib/types/menu';
import { Button } from '@/components/ui/button';
import dynamic from 'next/dynamic';

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

// Client-side only component for the cart button
const CartButton = dynamic(() => Promise.resolve(({ itemCount, onClick }: { itemCount: number; onClick: () => void }) => (
  <Button 
    onClick={onClick}
    size="lg" 
    className="fixed bottom-20 right-4 z-40 shadow-lg rounded-full h-14 w-14 p-0 flex items-center justify-center"
  >
    <ShoppingCart className="h-6 w-6" />
    {itemCount > 0 && (
      <span className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground text-xs rounded-full h-6 w-6 flex items-center justify-center">
        {itemCount}
      </span>
    )}
  </Button>
)), { ssr: false });

export default function MenuPage() {
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [menuData, setMenuData] = useState<MenuCategory[]>(SIDE_HUSTLE_MENU_DATA);
  const [isLoading, setIsLoading] = useState(false);
  const { location } = useLocationState();
  const { items, addItem, toggleCart } = useCartState();
  const categoryRefs = useRef<{[key: string]: HTMLDivElement | null}>({});
  
  // Calculate total items in cart
  const cartItemCount = items.reduce((total: number, item: any) => total + item.quantity, 0);
  
  // Scroll to category when clicked in the navigation
  const handleCategoryChange = (categoryId: string) => {
    if (categoryRefs.current[categoryId]) {
      categoryRefs.current[categoryId]?.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
      setActiveCategory(categoryId);
    }
  };
  
  // Set active category based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100; // Offset for header
      
      // Find the current active category based on scroll position
      let currentCategory = '';
      Object.entries(categoryRefs.current).forEach(([id, ref]) => {
        if (ref && ref.offsetTop <= scrollPosition) {
          currentCategory = id;
        }
      });
      
      if (currentCategory !== activeCategory) {
        setActiveCategory(currentCategory);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeCategory]);
  
  return (
    <div className="container pb-20">
      <div className="sticky top-0 z-30 bg-background pt-4 pb-2">
        <h1 className="text-3xl font-bold mb-4">Menu</h1>
        <CategoryNav 
          categories={menuData} 
          activeCategory={activeCategory}
          onCategoryChangeAction={handleCategoryChange}
        />
      </div>
      
      <div className="mt-6">
        {menuData.map((category) => (
          <div 
            key={category.id}
            id={category.id}
            ref={(el) => {
              categoryRefs.current[category.id] = el;
            }}
            className="mb-10"
          >
            <h2 className="text-2xl font-semibold mb-4">{category.name}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {category.items
                .filter(item => !item.location || item.location === 'both' || item.location === location)
                .map((item) => (
                  <MenuItemCard 
                    key={item.id} 
                    item={item} 
                    onAddToCart={() => addItem(item)}
                  />
                ))
              }
            </div>
          </div>
        ))}
      </div>
      
      {/* Cart button - dynamically loaded to avoid SSR issues */}
      <CartButton itemCount={cartItemCount} onClick={toggleCart} />
    </div>
  );
}