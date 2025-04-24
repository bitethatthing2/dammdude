"use client";

import Image from "next/image";
import { PlusCircle } from "lucide-react";
import type { MenuItem } from '@/lib/types/menu';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";

interface MenuItemCardProps {
  item: MenuItem;
  onAddToCart?: (item: MenuItem) => void;
}

export const MenuItemCard = ({ item, onAddToCart }: MenuItemCardProps) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  // Default placeholder image if none provided
  const imageUrl = item.image_url || '/images/food-placeholder.jpg';

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <div className="relative">
        <AspectRatio ratio={16/9}>
          <Image 
            src={imageUrl} 
            alt={item.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </AspectRatio>
        {item.popular && (
          <Badge 
            variant="default" 
            className="absolute top-2 right-2 bg-primary/90 backdrop-blur-sm"
          >
            Popular
          </Badge>
        )}
      </div>

      <CardHeader className="p-4 pb-0">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{item.name}</CardTitle>
          <span className="font-bold text-primary">{formatPrice(item.price)}</span>
        </div>
        {item.description && (
          <CardDescription className="mt-1.5">
            {item.description}
          </CardDescription>
        )}
      </CardHeader>

      {(item.allergens?.length || item.dietary_info?.length) && (
        <CardContent className="p-4 pt-2">
          <div className="flex flex-wrap gap-1">
            {item.dietary_info?.map((info) => (
              <Badge key={info} variant="secondary" className="text-xs">
                {info}
              </Badge>
            ))}
            {item.allergens?.map((allergen) => (
              <Badge key={allergen} variant="outline" className="text-xs border-destructive/30 text-destructive">
                {allergen}
              </Badge>
            ))}
          </div>
        </CardContent>
      )}

      {onAddToCart && (
        <CardFooter className="p-4 pt-0 flex justify-end">
          <Button 
            size="sm" 
            onClick={() => onAddToCart(item)}
            disabled={!item.available}
            className="gap-1"
          >
            <PlusCircle className="h-4 w-4" />  
            Add to Order
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};
