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

export default function MerchPage() {
  // Keep state, maybe initialize with placeholder data later
  const [categories, setCategories] = useState<CategoryWithItems[]>([]); 
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true); // Start loading
  const { location } = useLocationState();
  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Add a simple useEffect to set loading to false after initial render
  useEffect(() => {
    // In a real scenario, this would likely be triggered after fetching
    // data from the third-party service.
    setIsLoading(false);
  }, []);

  // Scroll to category when selected
  const scrollToCategory = (categoryId: string) => {
    if (categoryRefs.current[categoryId]) {
      const yOffset = -100; 
      const element = categoryRefs.current[categoryId];
      if (!element) return;
      
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      
      window.scrollTo({
        top: y,
        behavior: 'smooth'
      });
    }
  };

  // TODO: Implement actual navigation or modal display
  const handleViewDetails = (product: MerchItem) => {
    console.log(`View details for: ${product.name} (ID: ${product.id})`);
    // Example: router.push(`/merch/${product.id}`); 
    // Or open a modal: setViewingProduct(product);
  };
  
  // The rest of the return statement remains the same, 
  // rendering based on the (currently empty) `categories` state.
  return (
    <div className="pb-20">
      <div className="flex justify-between items-center p-4 bg-background sticky top-0 z-50 border-b">
        <h1 className="text-2xl font-bold">{location === 'portland' ? 'Portland' : 'Salem'} Merchandise</h1>
        <ShoppingBag className="h-5 w-5 text-primary" />
      </div>
      
      <MerchCategoryNav 
        categories={categories}
        activeCategory={activeCategory}
        onCategoryChangeAction={setActiveCategory}
        scrollToCategory={scrollToCategory}
      />
      
      <div className="max-w-7xl mx-auto px-4 mt-6">
        {isLoading ? (
          <div className="py-20 text-center">
            <p className="text-muted-foreground">Loading merchandise...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="py-20 text-center">
            <ShoppingBag className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No merchandise available</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              We're currently updating our merchandise inventory. Please check back soon!
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {categories.map((category) => (
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
                        onViewDetails={handleViewDetails} 
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