"use client";

import { useState, useEffect, useRef } from 'react';
import { ShoppingBag } from 'lucide-react';
import { MerchCategoryNav } from '@/components/merch/MerchCategoryNav';
import { ProductCard } from '@/components/merch/ProductCard';
import { useLocationState } from '@/lib/hooks/useLocationState';
import type { MerchCategory, MerchItem } from '@/lib/types/merch';
import { Button } from '@/components/ui/button';
// import { supabase } from '@/lib/supabase/client'; // Commented out
import type { ApiResponse } from '@/lib/types/api';

export default function MerchPage() {
  const [categories, setCategories] = useState<MerchCategory[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true); // Keep loading state, default to false later?
  const { location } = useLocationState();
  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Fetch merchandise data from Supabase - COMMENTED OUT FOR NOW
  /*
  useEffect(() => {
    const fetchMerchData = async () => {
      setIsLoading(true);
      try {
        // Fetch categories
        const { data: categoryData, error: categoryError } = await supabase
          .from('merch_categories')
          .select('*')
          .order('display_order', { ascending: true }) as ApiResponse<MerchCategory[]>;
          
        if (categoryError) {
          console.error('Error fetching merch categories:', categoryError);
          return;
        }
        
        if (!categoryData || categoryData.length === 0) {
          setIsLoading(false);
          return;
        }
        
        // Fetch items for each category
        const categoriesWithItems = await Promise.all(
          categoryData.map(async (category) => {
            const { data: itemsData, error: itemsError } = await supabase
              .from('merch_items')
              .select('*')
              .eq('category_id', category.id)
              .eq('available', true) as ApiResponse<MerchItem[]>;
              
            if (itemsError) {
              console.error(`Error fetching items for category ${category.id}:`, itemsError);
              return { ...category, items: [] };
            }
            
            return { ...category, items: itemsData || [] };
          })
        );
        
        // Filter based on location if needed
        const filteredCategories = categoriesWithItems.filter(category => 
          !category.location || category.location === location || category.location === 'both'
        );
        
        setCategories(filteredCategories);
        
        // Set active category to first one if available
        if (filteredCategories.length > 0 && !activeCategory) {
          setActiveCategory(filteredCategories[0].id);
        }
      } catch (err) {
        console.error('Failed to fetch merch data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMerchData();
  }, [location, activeCategory]);
  */

  // Set loading to false immediately since we are not fetching
  useEffect(() => {
    setIsLoading(false);
  }, []);


  // Scroll to category when selected
  const scrollToCategory = (categoryId: string) => {
    if (categoryRefs.current[categoryId]) {
      const yOffset = -100; // Adjust for header
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

  return (
    <div className="pb-20">
      {/* Header with Location */}
      <div className="flex justify-between items-center p-4 bg-background sticky top-0 z-50 border-b">
        <h1 className="text-2xl font-bold">{location === 'portland' ? 'Portland' : 'Salem'} Merchandise</h1>
        <ShoppingBag className="h-5 w-5 text-primary" />
      </div>
      
      {/* Category Navigation */}
      <MerchCategoryNav 
        categories={categories}
        activeCategory={activeCategory}
        onCategoryChangeAction={setActiveCategory}
        scrollToCategory={scrollToCategory}
      />
      
      {/* Merchandise Content */}
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