'use client';

import { useCallback } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Import all icons as a namespace
import * as LucideIcons from 'lucide-react';

import type { Database } from '@/lib/database.types';

// Define the category type from database schema
type MenuCategory = Database['public']['Tables']['menu_categories']['Row'];

interface CategorySelectorProps {
  categories: MenuCategory[];
  selectedCategoryId: string;
  onChangeAction: (categoryId: string) => void;  // renamed for client prop serialization
  variant?: 'tabs' | 'buttons';
}

/**
 * Reusable category selector component that can be styled as either tabs or buttons
 * Used by both the informational menu and ordering system
 */
export function CategorySelector({
  categories,
  selectedCategoryId,
  onChangeAction,
  variant = 'tabs',
}: CategorySelectorProps) {
  const handleCategoryChange = useCallback((value: string) => {
    onChangeAction(value);
  }, [onChangeAction]);

  // Map category names to icon names in lucide-react
  const getIconForCategory = (categoryName: string): React.ReactNode => {
    // Map category names to Lucide icon component names
    const iconNameMap: Record<string, keyof typeof LucideIcons> = {
      'Birria Specialties': 'Taco',
      'Small Bites': 'Cookie',
      'Seafood': 'Fish',
      'Breakfast': 'Egg',
      'Wings': 'Drumstick',
      'Main Dishes': 'Utensils',
      'Boards': 'Cocktail',
      'Flights': 'Wine',
      'Towers': 'Beer',
      'House Favorites': 'Star',
      'Martinis': 'Martini',
      'Margaritas': 'Cocktail',
      'Malibu Buckets': 'Palmtree',
      'Refreshers': 'GlassWater',
      'Bottle Beer': 'Beer',
      'Wine': 'Wine',
      'Non-Alcoholic Beverages': 'Coffee',
    };
    
    // Get the icon name for this category, or default to Utensils
    const iconName = iconNameMap[categoryName] || 'Utensils';
    
    // Get the actual icon component
    const IconComponent = LucideIcons[iconName];
    
    // Return the icon with styling
    return IconComponent ? <IconComponent className="h-3 w-3" /> : null;
  };

  if (!categories.length) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        No categories available
      </div>
    );
  }

  // Render as tabs (default)
  if (variant === 'tabs') {
    return (
      <div className="w-full">
        <div className="w-full border-b bg-muted/20 overflow-x-auto">
          <div className="flex flex-nowrap py-1 px-1 gap-1 snap-x">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryChange(category.id)}
                className={`
                  flex items-center whitespace-nowrap px-2 py-1.5 text-xs sm:text-sm rounded-md
                  snap-start shrink-0 transition-all duration-200
                  ${selectedCategoryId === category.id 
                    ? 'bg-primary text-primary-foreground shadow-md transform scale-105' 
                    : 'bg-card hover:bg-accent text-foreground border border-border'
                  }
                `}
              >
                <div className="flex items-center">
                  <span className="mr-1">{getIconForCategory(category.name)}</span>
                  <span className="font-medium">{category.name}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Render as buttons (alternative)
  return (
    <div className="w-full border-b bg-muted/20 overflow-x-auto">
      <div className="flex flex-nowrap py-1.5 px-2 gap-1.5 snap-x">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => handleCategoryChange(category.id)}
            className={`
              flex items-center whitespace-nowrap px-2.5 py-1.5 text-xs sm:text-sm rounded-md
              snap-start shrink-0 transition-all duration-200
              ${selectedCategoryId === category.id 
                ? 'bg-primary text-primary-foreground shadow-md transform scale-105' 
                : 'bg-card hover:bg-accent text-foreground border border-border'
              }
            `}
          >
            <span className="mr-1">{getIconForCategory(category.name)}</span>
            <span className="font-medium">{category.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
