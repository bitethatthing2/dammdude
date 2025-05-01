'use client';

import Image from 'next/image';
import { PlusCircle, ShoppingCart, Plus, Minus, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import type { Database } from '@/lib/database.types';

// Define the menu item type from database schema
type MenuItem = Database['public']['Tables']['menu_items']['Row'];

interface MenuItemCardProps {
  item: MenuItem;
  mode?: 'info' | 'order';
  onAddToCart?: (item: MenuItem) => void;
  quantity?: number;
  onQuantityChange?: (id: number, quantity: number) => void;
}

/**
 * Unified menu item card component for both informational display and ordering
 * 
 * Features:
 * - Adaptive display based on mode ('info' or 'order')
 * - Image display with fallback
 * - Price formatting
 * - Description display
 * - Ordering controls when in 'order' mode
 */
export function MenuItemCard({ 
  item, 
  mode = 'info', 
  onAddToCart, 
  quantity = 0,
  onQuantityChange 
}: MenuItemCardProps) {
  // Create a fully typed menu item from partial data
  const safeItem = {
    id: item.id,
    name: item.name,
    price: item.price || 0,
    image_url: item.image_url,
    description: item.description,
    category_id: item.category_id,
    is_specialty: item.is_specialty,
    available: item.is_specialty ?? true,
    display_order: item.display_order || 0
  };
  
  // Handle add to cart button click
  const handleAddToCart = () => {
    if (mode === 'order' && onAddToCart) {
      onAddToCart(safeItem);
    }
  };
  
  // Determine the image to display with fallback
  const imageUrl = item.image_url || '/placeholder-image.webp';
  
  return (
    <Card className={`overflow-hidden hover:shadow-lg transition-shadow duration-200 ease-in-out border-2 ${!safeItem.available ? 'border-gray-300 bg-gray-100' : 'border-amber-200 bg-white'}`}>
      <div className="flex flex-col h-full relative">
        {/* Unavailable badge */}
        {!safeItem.available && (
          <div className="absolute top-2 right-2 z-10">
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Currently Unavailable
            </Badge>
          </div>
        )}
        
        {/* Image Section */}
        {imageUrl && (
          <div className="relative h-40 w-full">
            <Image
              src={imageUrl}
              alt={item.name}
              fill
              className={`object-cover ${!safeItem.available ? 'opacity-50' : ''}`}
              sizes="(max-width: 768px) 100vw, 50vw"
              priority={false}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/placeholder-image.webp';
                target.onerror = null;
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
          </div>
        )}
        
        {/* Content Section */}
        <CardHeader className="flex-grow">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl font-bold">{item.name}</CardTitle>
              <CardDescription className="text-lg font-medium">
                {formatCurrency(safeItem.price)}
              </CardDescription>
            </div>
          </div>
          
          {item.description && (
            <p className="text-sm text-muted-foreground mt-2">
              {item.description}
            </p>
          )}
        </CardHeader>
        
        {/* Order Controls - Only shown in order mode */}
        {mode === 'order' && (
          <CardFooter className="flex justify-between pt-0">
            {!safeItem.available ? (
              <Button
                variant="outline"
                disabled
                className="w-full opacity-70"
              >
                Currently Unavailable
              </Button>
            ) : quantity > 0 ? (
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onQuantityChange?.(safeItem.id, quantity - 1)}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                
                <span className="font-medium">{quantity}</span>
                
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onQuantityChange?.(safeItem.id, quantity + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                onClick={handleAddToCart}
                className="w-full gap-2"
              >
                <ShoppingCart className="h-4 w-4" />
                Add to Order
              </Button>
            )}
          </CardFooter>
        )}
        
        {/* Info mode footer - subtle promotion for ordering */}
        {mode === 'info' && (
          <CardFooter className="pt-0">
            {!safeItem.available ? (
              <p className="text-sm text-muted-foreground italic">
                Currently unavailable for ordering
              </p>
            ) : null}
          </CardFooter>
        )}
      </div>
    </Card>
  );
}
