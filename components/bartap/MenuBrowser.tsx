"use client";

import { useState } from 'react';
import { useCart } from '@/components/bartap/CartContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus, ShoppingCart, Coffee, Wine, Beer, Cocktail, Utensils, Salad, Egg, Drumstick, Fish, Pizza, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';

interface Category {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
}

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category_id: string;
  available: boolean;
}

interface MenuBrowserProps {
  categories: Category[];
  menuItems: MenuItem[];
}

// Map category names to icons
const categoryIcons: Record<string, React.ReactNode> = {
  'Boards': <Pizza className="h-4 w-4" />,
  'Flights': <Wine className="h-4 w-4" />,
  'Towers': <Beer className="h-4 w-4" />,
  'House Favorites': <Cocktail className="h-4 w-4" />,
  'Martinis': <Cocktail className="h-4 w-4" />,
  'Margaritas': <Cocktail className="h-4 w-4" />,
  'Malibu Buckets': <Beer className="h-4 w-4" />,
  'Refreshers': <Coffee className="h-4 w-4" />,
  'Bottle Beer': <Beer className="h-4 w-4" />,
  'Wine': <Wine className="h-4 w-4" />,
  'Non-Alcoholic Beverages': <Coffee className="h-4 w-4" />,
  'Birria Specialties': <Utensils className="h-4 w-4" />,
  'Small Bites': <Salad className="h-4 w-4" />,
  'Seafood': <Fish className="h-4 w-4" />,
  'Breakfast': <Egg className="h-4 w-4" />,
  'Wings': <Drumstick className="h-4 w-4" />,
  'Main Dishes': <Utensils className="h-4 w-4" />,
};

export function MenuBrowser({ categories, menuItems }: MenuBrowserProps) {
  const [activeCategory, setActiveCategory] = useState<string>(
    categories.length > 0 ? categories[0].id : ''
  );
  
  const { items, addItem, removeItem, updateQuantity, totalItems, totalPrice, grandTotal } = useCart();
  
  // Get the quantity of an item in the cart
  const getItemQuantity = (id: string) => {
    const item = items.find(item => item.id === id);
    return item ? item.quantity : 0;
  };
  
  // Get icon for category
  const getCategoryIcon = (categoryName: string) => {
    return categoryIcons[categoryName] || <Utensils className="h-4 w-4" />;
  };
  
  return (
    <div className="flex flex-col h-full">
      {/* Category tabs */}
      <Tabs 
        value={activeCategory} 
        onValueChange={setActiveCategory}
        className="w-full"
      >
        <div className="border-b sticky top-0 bg-gradient-to-r from-yellow-400 to-red-500 z-10 pb-2">
          <ScrollArea className="whitespace-nowrap pb-2">
            <TabsList className="h-auto p-1 bg-white/20 backdrop-blur-sm">
              {categories.map(category => (
                <TabsTrigger 
                  key={category.id}
                  value={category.id}
                  className="px-4 py-2 flex items-center gap-2 transition-all"
                >
                  {getCategoryIcon(category.name)}
                  {category.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </ScrollArea>
        </div>
        
        {/* Menu items by category */}
        <div className="flex-1 overflow-auto pb-24 bg-gradient-to-b from-yellow-50 to-orange-50">
          {categories.map(category => (
            <TabsContent key={category.id} value={category.id} className="m-0 pt-4">
              <div className="relative mb-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-6 py-1 text-lg font-bold text-black rounded-full shadow-sm">
                    {category.name}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-4">
                {menuItems
                  .filter(item => item.category_id === category.id)
                  .map(item => {
                    const itemQuantity = getItemQuantity(item.id);
                    
                    return (
                      <Card 
                        key={item.id} 
                        className={`overflow-hidden border-2 ${!item.available ? 'border-gray-300 bg-gray-100' : 'border-amber-200 bg-white'}`}
                      >
                        <div className="flex flex-col h-full relative">
                          {!item.available && (
                            <div className="absolute top-2 right-2 z-10">
                              <Badge variant="destructive" className="flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" />
                                Currently Unavailable
                              </Badge>
                            </div>
                          )}
                          
                          {item.image_url && (
                            <div className="relative h-40 w-full">
                              <Image
                                src={item.image_url}
                                alt={item.name}
                                fill
                                className={`object-cover ${!item.available ? 'opacity-50' : ''}`}
                                sizes="(max-width: 768px) 100vw, 50vw"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                            </div>
                          )}
                          
                          <CardHeader className="flex-grow">
                            <div className="flex justify-between items-start">
                              <div>
                                <CardTitle className="text-xl font-bold">{item.name}</CardTitle>
                                <CardDescription className="text-lg font-medium">
                                  {formatCurrency(item.price)}
                                </CardDescription>
                              </div>
                            </div>
                            
                            {item.description && (
                              <p className="text-sm text-muted-foreground mt-2">
                                {item.description}
                              </p>
                            )}
                          </CardHeader>
                          
                          <CardFooter className="flex justify-between pt-0">
                            {!item.available ? (
                              <Button
                                variant="outline"
                                disabled
                                className="w-full opacity-70"
                              >
                                Currently Unavailable
                              </Button>
                            ) : itemQuantity > 0 ? (
                              <div className="flex items-center gap-3">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => updateQuantity(item.id, itemQuantity - 1)}
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                                
                                <span className="font-medium">{itemQuantity}</span>
                                
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => updateQuantity(item.id, itemQuantity + 1)}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <Button
                                variant="outline"
                                onClick={() => addItem({
                                  id: item.id,
                                  name: item.name,
                                  price: item.price,
                                  image_url: item.image_url,
                                  description: item.description,
                                  category_id: item.category_id,
                                  available: item.available
                                })}
                                className="gap-2"
                              >
                                <Plus className="h-4 w-4" /> Add
                              </Button>
                            )}
                          </CardFooter>
                        </div>
                      </Card>
                    );
                  })}
              </div>
            </TabsContent>
          ))}
        </div>
      </Tabs>
      
      {/* Cart summary (fixed at bottom) */}
      {totalItems > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-yellow-500 to-red-500 border-t shadow-md p-4 flex justify-between items-center">
          <div className="text-white">
            <p className="font-medium">{totalItems} item{totalItems !== 1 ? 's' : ''}</p>
            <p className="text-lg font-bold">{formatCurrency(grandTotal)}</p>
          </div>
          
          <Link href="/checkout">
            <Button className="gap-2 bg-white text-black hover:bg-white/90">
              <ShoppingCart className="h-4 w-4" />
              View Order
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
