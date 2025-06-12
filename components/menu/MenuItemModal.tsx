// components/menu/MenuItemModal.tsx
import { useState } from 'react';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus, ImageOff } from 'lucide-react';
import { MenuItem, MenuModifier } from '@/lib/types/menu';
import FoodModifierSelector, { calculateModifierTotal, getSelectedModifierNames } from './FoodModifierSelector';

interface MenuItemModalProps {
  item: MenuItem;
  modifiers: MenuModifier[];
  open: boolean;
  onClose: () => void;
}

// List of items that require meat selection based on your requirements
const ITEMS_REQUIRING_MEAT = [
  'tacos', 'burritos', 'quesadillas', 'loaded fries', 'loaded nacho', 'tortas', 
  'mulitas', 'hustle bowl', 'taco salad', 'empanadas', 'chilaquiles', 
  'french toast', 'pancakes', '3 tacos beans and rice', 'enchiladas', 
  'flautas', 'quesadilla beans and rice', 'wet burrito'
];

// Items that need wings sauces instead of regular sauces
const WING_ITEMS = ['wings'];

export default function MenuItemModal({ item, modifiers, open, onClose }: MenuItemModalProps) {
  const [selectedMeat, setSelectedMeat] = useState<string>('');
  const [selectedSauces, setSelectedSauces] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);

  // Determine if item requires meat selection
  const requiresMeatSelection = 
    item.description?.toLowerCase().includes('choice of meat') ||
    ITEMS_REQUIRING_MEAT.some(keyword => 
      item.name.toLowerCase().includes(keyword)
    );

  // Check if this is a wings item
  const isWingsItem = WING_ITEMS.some(keyword => 
    item.name.toLowerCase().includes(keyword)
  );
  
  // All entrees should offer sauce selection as per requirements
  const offersSauceSelection = true;

  // Calculate total price including modifier adjustments
  const calculateTotal = () => {
    const modifierTotal = calculateModifierTotal(selectedMeat, selectedSauces);
    return (item.price + modifierTotal) * quantity;
  };

  const canAddToCart = () => {
    // Must select meat if required
    if (requiresMeatSelection && !selectedMeat) {
      return false;
    }
    
    // Wings must have at least 1 sauce, max 3
    if (isWingsItem) {
      return selectedSauces.length >= 1 && selectedSauces.length <= 3;
    }
    
    // Regular items cannot select more than 3 sauces
    if (selectedSauces.length > 3) {
      return false;
    }
    
    return true;
  };

  const handleAddToCart = () => {
    if (!canAddToCart()) {
      return;
    }

    const { meat, sauces } = getSelectedModifierNames(selectedMeat, selectedSauces);
    
    const orderData = {
      item,
      meat,
      sauces,
      quantity,
      totalPrice: calculateTotal()
    };

    console.log('Adding to cart:', orderData);
    // TODO: Implement actual cart functionality
    onClose();
  };

  const handleReset = () => {
    setSelectedMeat('');
    setSelectedSauces([]);
    setQuantity(1);
  };

  const handleSauceChange = (sauceId: string, checked: boolean) => {
    if (checked) {
      if (selectedSauces.length < 3) {
        setSelectedSauces(prev => [...prev, sauceId]);
      }
    } else {
      setSelectedSauces(prev => prev.filter(id => id !== sauceId));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{item.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Item Image with Next.js Image Optimization */}
          <div className="relative h-48 bg-muted flex items-center justify-center rounded-lg overflow-hidden">
            {item.image_url ? (
              <Image
                src={item.image_url}
                alt={item.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                priority={true}
                placeholder="blur"
                blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAf/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWEREiMxUf/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
              />
            ) : (
              <div className="flex flex-col items-center justify-center space-y-2">
                <ImageOff className="w-12 h-12 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">No image available</span>
              </div>
            )}
          </div>

          {/* Item Description */}
          {item.description && (
            <p className="text-sm text-muted-foreground">{item.description}</p>
          )}

          {/* Base Price */}
          <div className="flex justify-between items-center">
            <span className="font-medium">Base Price:</span>
            <Badge variant="secondary" className="text-base">${item.price.toFixed(2)}</Badge>
          </div>

          {/* Food Modifier Selector */}
          <FoodModifierSelector
            requiresMeatSelection={requiresMeatSelection}
            offersSauceSelection={offersSauceSelection}
            selectedMeat={selectedMeat}
            selectedSauces={selectedSauces}
            onMeatChange={setSelectedMeat}
            onSauceChange={handleSauceChange}
          />

          {/* Quantity Selector */}
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold">Quantity:</Label>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
                className="h-9 w-9"
              >
                <Minus className="w-4 h-4" />
              </Button>
              <span className="w-12 text-center font-semibold text-lg">{quantity}</span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(quantity + 1)}
                className="h-9 w-9"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Total Price */}
          <div className="flex justify-between items-center pt-4 border-t">
            <span className="text-lg font-semibold">Total:</span>
            <Badge variant="default" className="text-lg px-4 py-1">
              ${calculateTotal().toFixed(2)}
            </Badge>
          </div>

          {/* Validation Messages */}
          {requiresMeatSelection && !selectedMeat && (
            <p className="text-sm text-destructive">Please select a meat option</p>
          )}
          {isWingsItem && selectedSauces.length === 0 && (
            <p className="text-sm text-destructive">Please select 1-3 wing sauces</p>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 pt-4">
          <Button 
            variant="outline" 
            onClick={handleReset} 
            className="w-full sm:w-auto"
          >
            Reset
          </Button>
          <Button 
            onClick={handleAddToCart} 
            className="w-full sm:w-auto"
            disabled={!canAddToCart()}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add to Cart
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}