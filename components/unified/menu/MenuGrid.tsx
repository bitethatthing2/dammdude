'use client';

import { useState } from 'react';
import { MenuItem } from './MenuItem';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Define menu item interface
interface MenuItemType {
  id: string;
  name: string;
  description: string;
  price: number;
  image?: string;
  category: string;
  tags?: string[];
}

interface MenuGridProps {
  items: MenuItemType[];
  categories: string[];
  onItemClick?: (id: string) => void;
  onAddToCart?: (id: string, quantity: number) => void;
  variant?: 'default' | 'compact' | 'detailed';
  showFilters?: boolean;
  maxHeight?: string;
}

/**
 * Unified MenuGrid component
 * Displays menu items with filtering and category tabs
 */
export function MenuGrid({
  items,
  categories,
  onItemClick,
  onAddToCart,
  variant = 'default',
  showFilters = true,
  maxHeight = '800px'
}: MenuGridProps) {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'popularity'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100]);
  
  // Filter items based on search and category
  const filteredItems = items.filter(item => {
    // Filter by search query
    const matchesSearch = searchQuery.trim() === '' || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.tags && item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));
      
    // Filter by category
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    
    // Filter by price range
    const matchesPrice = item.price >= priceRange[0] && item.price <= priceRange[1];
    
    return matchesSearch && matchesCategory && matchesPrice;
  });
  
  // Sort items
  const sortedItems = [...filteredItems].sort((a, b) => {
    if (sortBy === 'name') {
      return sortOrder === 'asc' 
        ? a.name.localeCompare(b.name) 
        : b.name.localeCompare(a.name);
    } else if (sortBy === 'price') {
      return sortOrder === 'asc' 
        ? a.price - b.price 
        : b.price - a.price;
    }
    return 0;
  });
  
  // Calculate grid columns based on variant
  const gridColumns = variant === 'detailed' 
    ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-2' 
    : variant === 'compact'
      ? 'grid-cols-1'
      : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4';
  
  return (
    <div className="space-y-4">
      {/* Search and filters */}
      {showFilters && (
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search menu..."
              className="pl-8 pr-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <X
                className="absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 cursor-pointer text-muted-foreground hover:text-foreground"
                onClick={() => setSearchQuery('')}
              />
            )}
          </div>
          
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filter & Sort</SheetTitle>
              </SheetHeader>
              <div className="py-4 space-y-6">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Sort by</h4>
                  <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="price">Price</SelectItem>
                      <SelectItem value="popularity">Popularity</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <div className="flex items-center space-x-2 mt-2">
                    <Button 
                      variant={sortOrder === 'asc' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setSortOrder('asc')}
                      className="flex-1"
                    >
                      Ascending
                    </Button>
                    <Button 
                      variant={sortOrder === 'desc' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setSortOrder('desc')}
                      className="flex-1"
                    >
                      Descending
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Price Range</h4>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      min={0}
                      value={priceRange[0]}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        if (!isNaN(value)) {
                          setPriceRange([value, priceRange[1]]);
                        }
                      }}
                    />
                    <span>to</span>
                    <Input
                      type="number"
                      min={0}
                      value={priceRange[1]}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        if (!isNaN(value)) {
                          setPriceRange([priceRange[0], value]);
                        }
                      }}
                    />
                  </div>
                </div>
                
                <Button
                  className="w-full"
                  onClick={() => {
                    setSortBy('name');
                    setSortOrder('asc');
                    setPriceRange([0, 100]);
                  }}
                >
                  Reset Filters
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      )}
      
      {/* Category tabs */}
      <Tabs defaultValue="all" value={activeCategory} onValueChange={setActiveCategory}>
        <ScrollArea className="whitespace-nowrap pb-2" orientation="horizontal">
          <TabsList className="inline-flex h-10">
            <TabsTrigger value="all">All Items</TabsTrigger>
            {categories.map(category => (
              <TabsTrigger key={category} value={category}>
                {category}
              </TabsTrigger>
            ))}
          </TabsList>
        </ScrollArea>
        
        <TabsContent value={activeCategory} className="mt-2">
          <ScrollArea style={{ height: maxHeight }}>
            {sortedItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="bg-muted/50 p-4 rounded-full mb-3">
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">No menu items found</p>
                <Button 
                  variant="link" 
                  onClick={() => {
                    setSearchQuery('');
                    setActiveCategory('all');
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div className={`grid ${gridColumns} gap-4 p-1`}>
                {sortedItems.map(item => (
                  <MenuItem
                    key={item.id}
                    id={item.id}
                    name={item.name}
                    description={item.description}
                    price={item.price}
                    image={item.image}
                    category={item.category}
                    tags={item.tags}
                    onAddToCart={onAddToCart}
                    onViewDetails={onItemClick}
                    variant={variant}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default MenuGrid;