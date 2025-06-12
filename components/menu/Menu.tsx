// components/menu/Menu.tsx
'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UtensilsCrossed, Wine } from 'lucide-react';
import DrinkMenu from './DrinkMenu';
import FoodMenu from './FoodMenu';

export default function Menu() {
  const [activeTab, setActiveTab] = useState<'food' | 'drinks'>('food');

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2">Our Menu</h1>
        <p className="text-muted-foreground">Fresh, delicious, and made with love</p>
      </div>

      <Tabs value={activeTab} onValueChange={(val) => {
        setActiveTab(val as 'food' | 'drinks');
      }}>
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
          <TabsTrigger value="food" className="flex items-center gap-2">
            <UtensilsCrossed className="w-4 h-4" />
            Food
          </TabsTrigger>
          <TabsTrigger value="drinks" className="flex items-center gap-2">
            <Wine className="w-4 h-4" />
            Drinks
          </TabsTrigger>
        </TabsList>

        <TabsContent value="food" className="space-y-6">
          {/* Food Menu - Using static data with complete functionality */}
          <FoodMenu />
        </TabsContent>

        <TabsContent value="drinks" className="space-y-6">
          {/* Drinks Menu - Using static data for now */}
          <DrinkMenu />
        </TabsContent>
      </Tabs>
    </div>
  );
}
