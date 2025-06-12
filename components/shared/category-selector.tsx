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

  // Map category names to icon names in lucide-react dynamically
  const getIconForCategory = (categoryName: string): React.ReactNode => {
    const lowerName = categoryName.toLowerCase();
    
    // Dynamic mapping based on keywords in category names
    let iconName: keyof typeof LucideIcons = 'Utensils'; // default
    
    // Food categories
    if (lowerName.includes('birria') || lowerName.includes('taco')) {
      iconName = 'Cookie'; // Using Cookie as closest to taco
    } else if (lowerName.includes('bite') || lowerName.includes('appetizer')) {
      iconName = 'Cookie';
    } else if (lowerName.includes('seafood') || lowerName.includes('fish')) {
      iconName = 'Fish';
    } else if (lowerName.includes('breakfast')) {
      iconName = 'Egg';
    } else if (lowerName.includes('wing')) {
      iconName = 'Drumstick';
    } else if (lowerName.includes('main') || lowerName.includes('entree')) {
      iconName = 'Utensils';
    }
    // Drink categories
    else if (lowerName.includes('board')) {
      iconName = 'Cocktail';
    } else if (lowerName.includes('flight')) {
      iconName = 'Wine';
    } else if (lowerName.includes('tower')) {
      iconName = 'Beer';
    } else if (lowerName.includes('favorite') || lowerName.includes('special')) {
      iconName = 'Star';
    } else if (lowerName.includes('martini')) {
      iconName = 'Martini';
    } else if (lowerName.includes('margarita') || lowerName.includes('cocktail')) {
      iconName = 'Cocktail';
    } else if (lowerName.includes('bucket')) {
      iconName = 'Palmtree';
    } else if (lowerName.includes('refresh')) {
      iconName = 'GlassWater';
    } else if (lowerName.includes('beer')) {
      iconName = 'Beer';
    } else if (lowerName.includes('wine')) {
      iconName = 'Wine';
    } else if (lowerName.includes('non-alcoholic') || lowerName.includes('coffee') || lowerName.includes('soft')) {
      iconName = 'Coffee';
    }
    
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
