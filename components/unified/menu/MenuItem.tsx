'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus, ShoppingCart } from 'lucide-react';
import { motion } from 'framer-motion';

interface MenuItemProps {
  id: string;
  name: string;
  description: string;
  price: number;
  image?: string;
  category?: string;
  tags?: string[];
  onAddToCart?: (id: string, quantity: number) => void;
  onViewDetails?: (id: string) => void;
  variant?: 'default' | 'compact' | 'detailed';
}

/**
 * Unified MenuItem component
 * Displays a menu item with consistent styling
 */
export function MenuItem({
  id,
  name,
  description,
  price,
  image,
  category,
  tags = [],
  onAddToCart,
  onViewDetails,
  variant = 'default'
}: MenuItemProps) {
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  
  // Handle adding to cart
  const handleAddToCart = () => {
    if (!onAddToCart) return;
    
    setIsAdding(true);
    onAddToCart(id, quantity);
    
    // Reset after animation
    setTimeout(() => {
      setIsAdding(false);
      setQuantity(1);
    }, 500);
  };
  
  // Handle quantity changes
  const decreaseQuantity = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };
  
  const increaseQuantity = (e: React.MouseEvent) => {
    e.stopPropagation();
    setQuantity(quantity + 1);
  };
  
  // Render compact variant
  if (variant === 'compact') {
    return (
      <div 
        className="flex items-center border rounded-md p-2 hover:bg-accent/50 transition-colors"
        onClick={() => onViewDetails?.(id)}
      >
        {image && (
          <div className="h-12 w-12 relative overflow-hidden rounded-md mr-3 flex-shrink-0">
            <Image
              src={image}
              alt={name}
              fill
              className="object-cover"
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-base">{name}</h3>
          <p className="text-sm text-muted-foreground">${price.toFixed(2)}</p>
        </div>
        {onAddToCart && (
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(id, 1);
            }}
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  }
  
  // Render detailed variant
  if (variant === 'detailed') {
    return (
      <Card className="overflow-hidden h-full">
        {image && (
          <div className="relative h-48 w-full">
            <Image
              src={image}
              alt={name}
              fill
              className="object-cover"
            />
            {category && (
              <Badge className="absolute top-2 right-2 bg-primary/70 hover:bg-primary/70">
                {category}
              </Badge>
            )}
          </div>
        )}
        <CardContent className="pt-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-medium text-lg">{name}</h3>
            <span className="font-bold">${price.toFixed(2)}</span>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-3 mb-4">{description}</p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </CardContent>
        <CardFooter className="pt-0 flex justify-between">
          <Button 
            variant="outline"
            className="text-sm"
            onClick={() => onViewDetails?.(id)}
          >
            View Details
          </Button>
          {onAddToCart && (
            <div className="flex items-center space-x-2">
              <div className="flex items-center border rounded-md">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-none"
                  onClick={decreaseQuantity}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-8 text-center">{quantity}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-none"
                  onClick={increaseQuantity}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              <Button
                size="sm"
                className="relative"
                onClick={handleAddToCart}
              >
                {isAdding ? (
                  <motion.div
                    initial={{ scale: 1 }}
                    animate={{ scale: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Add
                  </motion.div>
                ) : (
                  <>
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Add
                  </>
                )}
              </Button>
            </div>
          )}
        </CardFooter>
      </Card>
    );
  }
  
  // Render default variant
  return (
    <Card className="overflow-hidden h-full">
      {image && (
        <div className="relative h-40 w-full">
          <Image
            src={image}
            alt={name}
            fill
            className="object-cover"
          />
        </div>
      )}
      <CardContent className="p-4">
        <div className="flex justify-between mb-1">
          <h3 className="font-medium">{name}</h3>
          <span className="font-bold">${price.toFixed(2)}</span>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
      </CardContent>
      {onAddToCart && (
        <CardFooter className="pt-0 flex justify-between">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onViewDetails?.(id)}
          >
            Details
          </Button>
          <Button
            size="sm"
            className="relative"
            onClick={handleAddToCart}
          >
            {isAdding ? (
              <motion.div
                initial={{ scale: 1 }}
                animate={{ scale: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Plus className="h-4 w-4" />
              </motion.div>
            ) : (
              <Plus className="h-4 w-4" />
            )}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

export default MenuItem;