"use client";

import { useState, useEffect, useRef } from 'react';
import { ShoppingBag } from 'lucide-react';
import { MerchCategoryNav } from '@/components/merch/MerchCategoryNav';
import { ProductCard } from '@/components/merch/ProductCard';
import { useLocationState } from '@/lib/hooks/useLocationState';
import type { MerchCategory, MerchItem } from '@/lib/types/merch';
import { Button } from '@/components/ui/button';

// Define the expected shape for placeholder/future data
type CategoryWithItems = MerchCategory & { items: MerchItem[] };

// Mock data for merch items
const MOCK_MERCH_DATA: CategoryWithItems[] = [
  {
    id: 'apparel',
    name: 'Apparel',
    display_order: 1,
    items: [
      {
        id: 'tshirt-1',
        name: 'Salem PDX Logo T-Shirt',
        description: 'Comfortable cotton t-shirt with our iconic logo',
        price: 24.99,
        image: '/images/merch/tshirt.jpg',
        category_id: 'apparel',
        in_stock: true,
        location: 'both'
      },
      {
        id: 'hoodie-1',
        name: 'Wolf Hoodie',
        description: 'Stay warm with our premium hoodie',
        price: 49.99,
        image: '/images/merch/hoodie.jpg',
        category_id: 'apparel',
        in_stock: true,
        location: 'portland'
      }
    ]
  },
  {
    id: 'accessories',
    name: 'Accessories',
    display_order: 2,
    items: [
      {
        id: 'mug-1',
        name: 'Coffee Mug',
        description: 'Start your day with our branded coffee mug',
        price: 14.99,
        image: '/images/merch/mug.jpg',
        category_id: 'accessories',
        in_stock: true,
        location: 'both'
      },
      {
        id: 'cap-1',
        name: 'Baseball Cap',
        description: 'Classic baseball cap with embroidered logo',
        price: 22.99,
        image: '/images/merch/cap.jpg',
        category_id: 'accessories',
        in_stock: true,
        location: 'salem'
      }
    ]
  }
];

export default function MerchPage() {
  // Initialize with mock data instead of empty array
  const [categories, setCategories] = useState<CategoryWithItems[]>(MOCK_MERCH_DATA); 
  const [activeCategory, setActiveCategory] = useState<string>(MOCK_MERCH_DATA[0]?.id || '');
  const [isLoading, setIsLoading] = useState(false); // Start with false since we have mock data
  const { location } = useLocationState();
  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Handle category change
  const handleCategoryChange = (categoryId: string) => {
    setActiveCategory(categoryId);
    const element = categoryRefs.current[categoryId];
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Filter items based on location
  const filteredCategories = categories.map(category => ({
    ...category,
    items: category.items.filter(item => 
      !item.location || item.location === 'both' || item.location === location
    )
  })).filter(category => category.items.length > 0);

  return (
    <div className="pb-20">
      <div className="flex justify-between items-center p-4 bg-background sticky top-0 z-50 border-b">
        <h1 className="text-2xl font-bold">{location === 'portland' ? 'Portland' : 'Salem'} Merchandise</h1>
        <ShoppingBag className="h-5 w-5 text-primary" />
      </div>
      
      <MerchCategoryNav 
        categories={filteredCategories}
        activeCategory={activeCategory}
        onCategoryChangeAction={handleCategoryChange}
      />
      
      <div className="max-w-7xl mx-auto px-4 mt-6">
        {isLoading ? (
          <div className="py-20 text-center">
            <p className="text-muted-foreground">Loading merchandise...</p>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="py-20 text-center">
            <ShoppingBag className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No merchandise available</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              We're currently updating our merchandise inventory. Please check back soon!
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {filteredCategories.map((category) => (
              <div 
                key={category.id}
                id={`category-${category.id}`}
                ref={(el) => { categoryRefs.current[category.id] = el; }}
                className="mb-10"
              >
                <h2 className="text-xl font-semibold mb-4 pt-4 flex items-center">
                  <span className="mr-2">{category.name}</span>
                  <div className="h-px bg-border flex-grow ml-4 opacity-50" />
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {category.items.length === 0 ? (
                    <div className="col-span-full py-8 text-center bg-muted/20 rounded-lg border border-dashed">
                      <p className="text-muted-foreground">No items available in this category.</p>
                    </div>
                  ) : (
                    category.items.map((item) => (
                      <ProductCard 
                        key={item.id} 
                        product={item} 
                        onViewDetails={() => console.log(`View details for: ${item.name} (ID: ${item.id})`)} 
                      />
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}