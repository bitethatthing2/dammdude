// components/menu/MenuItemCard.tsx
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Flame, Leaf, Star } from 'lucide-react';
import MenuItemModal from './MenuItemModal';
import { toast } from '@/components/ui/use-toast';
import { useUser } from '@/hooks/useUser';
import { OrderRequestService } from '@/lib/services/order-request.service';
import Image from 'next/image';

import type { MenuItemWithModifiers, CartOrderData } from '@/types/features/menu';

interface MenuItemCardProps {
  item: MenuItemWithModifiers;
  onAddToCart: (orderData: CartOrderData) => void;
  locationId?: string;
}

// Get theme color based on category
const getCategoryTheme = (categoryName?: string) => {
  const name = categoryName?.toLowerCase() || '';
  
  if (name.includes('small') || name.includes('bite')) return 'bg-orange-500';
  if (name.includes('meat') || name.includes('beef')) return 'bg-red-500';
  if (name.includes('birria')) return 'bg-rose-500';
  if (name.includes('sea') || name.includes('fish')) return 'bg-blue-500';
  if (name.includes('wings') || name.includes('chicken')) return 'bg-orange-500';
  if (name.includes('chefa') || name.includes('sauce')) return 'bg-violet-500';
  if (name.includes('breakfast')) return 'bg-green-500';
  if (name.includes('special')) return 'bg-slate-500';
  if (name.includes('drink')) return 'bg-cyan-500';
  
  return 'bg-gray-500';
};

// Helper function to determine if item needs customization or can be added directly
const needsCustomization = (item: MenuItemWithModifiers): boolean => {
  // If item has modifiers, it needs customization
  if (item.modifiers && item.modifiers.length > 0) {
    return true;
  }

  const categoryName = item.category?.name?.toLowerCase() || '';
  const itemName = (item.name || '').toLowerCase();
  const description = item.description?.toLowerCase() || '';
  
  // Simple beverages that should be added directly to cart (NO modal)
  const simpleBeverageCategories = [
    'non alcoholic',
    'non-alcoholic', 
    'beverages',
    'drinks',
    'glass beverages',
    'soft drinks',
    'juices',
    'water',
    'soda'
  ];
  
  const simpleBeverageKeywords = [
    'coke', 'sprite', 'pepsi', 'water', 'juice', 'soda',
    'topo chico', 'jarrico', 'glass', 'bottle', 'beer', 'wine'
  ];
  
  // Check if it's a simple beverage - if so, DON'T show modal
  for (const category of simpleBeverageCategories) {
    if (categoryName.includes(category)) {
      return false; // Add directly to cart
    }
  }
  
  for (const keyword of simpleBeverageKeywords) {
    if (itemName.includes(keyword) || description.includes(keyword)) {
      return false; // Add directly to cart
    }
  }
  
  // Food items that typically need customization (meat, sauces)
  const foodItemsNeedingCustomization = [
    'loaded fries', 'loaded nacho', 'taco', 'burrito', 'quesadilla', 'torta', 'nacho', 'wings'
  ];
  
  for (const foodType of foodItemsNeedingCustomization) {
    if (itemName.includes(foodType) || categoryName.includes(foodType)) {
      return true; // Show customization modal
    }
  }
  
  // Default: simple items go directly to cart
  return false;
};

// Mapping object (longest matches first for better accuracy)
const itemImageMapping: { [key: string]: string } = {
  '3 tacos beans and rice': '3-tacos-beans-rice.png',
  'chips, guac and salsa': 'chips-guac-salsa.png',
  'chips, salsa and guac': 'chips-guac-salsa.png',
  'chips and salsa': 'chips-guac-salsa.png',
  'chips & salsa': 'chips-guac-salsa.png',
  'birria consommé': 'birria-consume.png',
  'basket of fries': 'basket-of-fries.png',
  'basket of tots': 'basket-of-tots.png',
  'beans and rice': 'beans-and-rice.png',
  'rice and beans': 'beans-and-rice.png',
  'loaded nachos': 'loaded-nacho.png',
  'loaded fries': 'loaded-nacho.png',
  'mango ceviche': 'mango-civeche.png',
  'french fries': 'basket-of-fries.png',
  'taco salad': 'taco-salad.png',
  'fish tacos': 'fish-tacos.png',
  'fish taco': 'fish-tacos.png',
  'chefa sauce': 'chefa-sauce.png',
  'taco dinner': '3-tacos-beans-rice.png',
  'taco combo': 'tacos.png',
  'taco plate': 'tacos.png',
  '3 tacos': 'tacos.png',
  'three tacos': 'tacos.png',
  'chilaquiles': 'CHILAQUILES.PNG',
  'empanadas': 'empanadas.png',
  'quesadilla': 'quesadilla.png',
  'flautas': 'flautas.png',
  'burrito': 'burrito.png',
  'pancakes': 'pancakes.jpg',
  'margarita': 'margarita.png',
  'molita': 'molita.png',
  'ceviche': 'mango-civeche.png',
  'torta': 'torta.png',
  'nachos': 'loaded-nacho.png',
  'guacamole': 'guacamole.png',
  'consommé': 'birria-consume.png',
  'tacos': 'tacos.png',
  'taco': 'tacos.png',
  'fries': 'basket-of-fries.png',
  'tots': 'basket-of-tots.png',
  'beans': 'beans.png',
  'rice': 'rice.png'
};

const findImageForMenuItem = (itemName: string, itemDescription: string, categoryType?: string): string | null => {
  const searchText = (itemName + ' ' + itemDescription).toLowerCase().trim();
  const itemNameOnly = itemName.toLowerCase().trim();
  
  // Determine image directory based on category type
  const imageDir = categoryType === 'drink' ? '/drink-menu-images/' : '/food-menu-images/';
  
  // Drink-specific mappings
  const drinkImageMapping: { [key: string]: string } = {
    'margarita board': 'boards.png',
    'mimosa board': 'boards.png',
    'board': 'boards.png',
    'boards': 'boards.png'
  };
  
  // Use drink mappings for drink items
  const mappingsToUse = categoryType === 'drink' ? drinkImageMapping : itemImageMapping;
  
  // First pass: Look for EXACT matches with full search text
  for (const [keyword, imageName] of Object.entries(mappingsToUse)) {
    if (searchText === keyword.toLowerCase()) {
      return `${imageDir}${imageName}`;
    }
  }
  
  // Second pass: Look for EXACT matches with item name only
  for (const [keyword, imageName] of Object.entries(mappingsToUse)) {
    if (itemNameOnly === keyword.toLowerCase()) {
      return `${imageDir}${imageName}`;
    }
  }
  
  // Third pass: Look for specific multi-word matches (prioritize longer phrases)
  const sortedMappings = Object.entries(mappingsToUse)
    .filter(([keyword]) => keyword.includes(' '))
    .sort((a, b) => b[0].length - a[0].length);
    
  for (const [keyword, imageName] of sortedMappings) {
    if (searchText.includes(keyword.toLowerCase()) || itemNameOnly.includes(keyword.toLowerCase())) {
      return `${imageDir}${imageName}`;
    }
  }
  
  // Fourth pass: Single word matches
  const singleWordMappings = Object.entries(mappingsToUse)
    .filter(([keyword]) => !keyword.includes(' '))
    .sort((a, b) => b[0].length - a[0].length);
    
  for (const [keyword, imageName] of singleWordMappings) {
    if (searchText.includes(keyword.toLowerCase()) || itemNameOnly.includes(keyword.toLowerCase())) {
      return `${imageDir}${imageName}`;
    }
  }
  
  return null;
};

// Placeholder image while loading
const shimmer = (w: number, h: number) => `
<svg width="${w}" height="${h}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="g">
      <stop stop-color="#e5e7eb" offset="20%" />
      <stop stop-color="#f3f4f6" offset="50%" />
      <stop stop-color="#e5e7eb" offset="70%" />
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="#e5e7eb" />
  <rect id="r" width="${w}" height="${h}" fill="url(#g)" />
  <animate xlink:href="#r" attributeName="x" from="-${w}" to="${w}" dur="1s" repeatCount="indefinite"  />
</svg>`;

const toBase64 = (str: string) =>
  typeof window === 'undefined'
    ? Buffer.from(str).toString('base64')
    : window.btoa(str);

// User status interface for ordering system
interface UserOrderStatus {
  has_open_tab: boolean;
  is_side_hustle: boolean;
  card_on_file: boolean;
  is_wolfpack_member: boolean;
}

// Function to get user's order status
const getUserOrderStatus = async (userId: string): Promise<UserOrderStatus> => {
  try {
    const { supabase } = await import('@/lib/supabase/client');
    
    // Get user's membership and financial status
    const { data: userData } = await supabase
      .from('users')
      .select('has_open_tab, is_side_hustle, card_on_file, is_wolfpack_member')
      .eq('id', userId)
      .maybeSingle();
    
    return {
      has_open_tab: userData?.has_open_tab || false,
      is_side_hustle: userData?.is_side_hustle || false,
      card_on_file: userData?.card_on_file || false,
      is_wolfpack_member: userData?.is_wolfpack_member || false
    };
  } catch {
    return {
      has_open_tab: false,
      is_side_hustle: false,
      card_on_file: false,
      is_wolfpack_member: false
    };
  }
};

// Function to determine button text based on user status
const getOrderButtonText = (userStatus: UserOrderStatus | null, isAvailable: boolean): string => {
  if (!isAvailable) return 'Sold Out';
  if (!userStatus) return 'Loading...';
  if (!userStatus.is_wolfpack_member) return 'Join Pack to Order';
  
  // User is wolfpack member, check if they have an open tab
  if (userStatus.has_open_tab) {
    return 'Request to Order';
  }
  
  // No open tab - must go to bartender first
  return 'Visit Bar to Open Tab';
};

// Simple function to check if user is in wolfpack (keeping for backward compatibility)
const checkWolfPackMembership = async (userId: string): Promise<boolean> => {
  try {
    const { supabase } = await import('@/lib/supabase/client');
    const { data: memberData } = await supabase
      .from('wolfpack_whitelist')
      .select('id')
      .eq('id', userId)
      .eq('is_active', true)
      .maybeSingle();
    
    return !!memberData;
  } catch {
    return false;
  }
};

export default function MenuItemCard({ item, onAddToCart, locationId }: MenuItemCardProps) {
  const [showModal, setShowModal] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isWolfPackMember, setIsWolfPackMember] = useState<boolean | null>(null);
  const [userOrderStatus, setUserOrderStatus] = useState<UserOrderStatus | null>(null);
  const { user } = useUser();
  
  // Check user status on component mount
  useEffect(() => {
    if (user?.id) {
      getUserOrderStatus(user.id).then(status => {
        setUserOrderStatus(status);
        setIsWolfPackMember(status.is_wolfpack_member);
      });
    }
  }, [user?.id]);
  
  const themeColor = getCategoryTheme(item.category?.name);
  
  // Get the food image URL for this item - prioritize database images
  const baseImageUrl = item.image_url || findImageForMenuItem(item.name, item.description || '', item.category?.type);
  const foodImageUrl = baseImageUrl?.startsWith('/food-menu-images/') || baseImageUrl?.startsWith('/drink-menu-images/')
    ? `${baseImageUrl}?v=${Date.now()}` 
    : baseImageUrl;
  
  const isSpicy = item.name.toLowerCase().includes('spicy');
  const isVegetarian = item.name.toLowerCase().includes('vegetarian') || 
                       item.name.toLowerCase().includes('veggie');
  const isPopular = item.name.toLowerCase().includes('popular');

  // Handler for add button - either create order request or add to cart
  const handleAddClick = async () => {
    if (!item.is_available || !user?.id || !locationId) return;

    // Check if user is in Wolf Pack
    if (!userOrderStatus?.is_wolfpack_member) {
      toast({
        title: "🐺 Wolf Pack Membership Required",
        description: "You need to be in the Wolf Pack to order items. Join the pack to start ordering!",
        variant: "destructive"
      });
      return;
    }

    // Check if user needs to open a tab first
    if (!userOrderStatus.has_open_tab) {
      toast({
        title: "Tab Required for Ordering",
        description: "To order food and drinks, please visit the bar to open a tab by leaving a payment card on file with the bartender.",
        variant: "default"
      });
      return;
    }

    // Check if user can make order requests
    const canOrder = await OrderRequestService.canUserMakeOrderRequests(user.id, locationId);
    if (!canOrder) {
      toast({
        title: "Request Limit Reached",
        description: "You have pending requests awaiting bartender review. Please wait for approval before placing additional orders.",
        variant: "destructive"
      });
      return;
    }

    if (needsCustomization(item)) {
      setShowModal(true);
    } else {
      // Create order request directly
      try {
        await OrderRequestService.createOrderRequest({
          menu_item_id: item.id,
          item_name: item.name,
          item_price: Number(item.price),
          quantity: 1,
          user_id: user.id,
          location_id: locationId
        });

        toast({
          title: "Order Request Sent",
          description: `Your request for ${item.name} has been sent to the bartender for review and approval.`,
        });
      } catch (error) {
        toast({
          title: "Request Failed",
          description: "Failed to send order request. Please try again.",
          variant: "destructive"
        });
      }
    }
  };
  
  return (
    <>
      <Card>
        <CardContent className="p-3">
          <div className="md:flex gap-4">
            {/* Image with mobile-first sizing constraints */}
            {foodImageUrl && !imageError ? (
              <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-18 lg:w-28 lg:h-20 rounded-md overflow-hidden bg-gray-100 relative flex-shrink-0">
                <Image
                  src={foodImageUrl}
                  alt={item.name}
                  fill
                  sizes="(max-width: 640px) 64px, (max-width: 768px) 80px, (max-width: 1024px) 96px, 112px"
                  className="object-cover object-center"
                  loading="lazy"
                  placeholder="blur"
                  blurDataURL={`data:image/svg+xml;base64,${toBase64(shimmer(64, 64))}`}
                  onError={() => setImageError(true)}
                  style={{ 
                    maxWidth: '100%', 
                    maxHeight: '100%',
                    width: '100%',
                    height: '100%'
                  }}
                />
              </div>
            ) : (
              <div className={`w-1 h-16 sm:h-20 md:h-18 lg:h-20 ${themeColor} rounded-full flex-shrink-0`} />
            )}
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-baseline gap-2">
                <h3 className="font-medium text-sm sm:text-base line-clamp-1 sm:line-clamp-none">{item.name}</h3>
                <span className="font-semibold text-sm sm:text-base">${Number(item.price).toFixed(2)}</span>
              </div>
              {item.description && (
                <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 sm:line-clamp-none mt-1">
                  {item.description}
                </p>
              )}
              
              {/* Badges */}
              <div className="mt-1 flex gap-1.5">
                {isSpicy && (
                  <Badge variant="secondary">
                    <Flame className="w-3.5 h-3.5 mr-1" />
                    Spicy
                  </Badge>
                )}
                {isVegetarian && (
                  <Badge variant="secondary">
                    <Leaf className="w-3.5 h-3.5 mr-1" />
                    Vegetarian
                  </Badge>
                )}
                {isPopular && (
                  <Badge variant="secondary">
                    <Star className="w-3.5 h-3.5 mr-1" />
                    Popular
                  </Badge>
                )}
              </div>
              
              {/* Add Button - Touch-friendly size */}
              <Button
                onClick={handleAddClick}
                disabled={!item.is_available || userOrderStatus === null}
                variant="secondary"
                className="w-full mt-3 h-10 sm:h-9 text-sm sm:text-base font-medium touch-manipulation"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                {getOrderButtonText(userOrderStatus, item.is_available)}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <MenuItemModal
        item={item}
        open={showModal}
        onClose={() => setShowModal(false)}
        onAddToCart={onAddToCart}
      />
    </>
  );
}

// Alternative Compact List View for Mobile
export function CompactMenuItemCard({ item, onAddToCart, locationId }: MenuItemCardProps) {
  const [showModal, setShowModal] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isWolfPackMember, setIsWolfPackMember] = useState<boolean | null>(null);
  const [userOrderStatus, setUserOrderStatus] = useState<UserOrderStatus | null>(null);
  const { user } = useUser();
  const themeColor = getCategoryTheme(item.category?.name);
  
  // Check user status on component mount
  useEffect(() => {
    if (user?.id) {
      getUserOrderStatus(user.id).then(status => {
        setUserOrderStatus(status);
        setIsWolfPackMember(status.is_wolfpack_member);
      });
    }
  }, [user?.id]);
  
  // Get the food image URL for this item - prioritize database images
  const baseImageUrl = item.image_url || findImageForMenuItem(item.name, item.description || '', item.category?.type);
  const foodImageUrl = baseImageUrl?.startsWith('/food-menu-images/') || baseImageUrl?.startsWith('/drink-menu-images/')
    ? `${baseImageUrl}?v=${Date.now()}` 
    : baseImageUrl;
  
  // Handler for add button - either create order request or add to cart
  const handleAddClick = async () => {
    if (!item.is_available || !user?.id || !locationId) return;

    // Check if user is in Wolf Pack
    if (!userOrderStatus?.is_wolfpack_member) {
      toast({
        title: "🐺 Wolf Pack Membership Required",
        description: "You need to be in the Wolf Pack to order items. Join the pack to start ordering!",
        variant: "destructive"
      });
      return;
    }

    // Check if user needs to open a tab first
    if (!userOrderStatus.has_open_tab) {
      toast({
        title: "Tab Required for Ordering",
        description: "To order food and drinks, please visit the bar to open a tab by leaving a payment card on file with the bartender.",
        variant: "default"
      });
      return;
    }

    // Check if user can make order requests
    const canOrder = await OrderRequestService.canUserMakeOrderRequests(user.id, locationId);
    if (!canOrder) {
      toast({
        title: "Request Limit Reached",
        description: "You have pending requests awaiting bartender review. Please wait for approval before placing additional orders.",
        variant: "destructive"
      });
      return;
    }

    if (needsCustomization(item)) {
      setShowModal(true);
    } else {
      // Create order request directly
      try {
        await OrderRequestService.createOrderRequest({
          menu_item_id: item.id,
          item_name: item.name,
          item_price: Number(item.price),
          quantity: 1,
          user_id: user.id,
          location_id: locationId
        });

        toast({
          title: "Order Request Sent",
          description: `Your request for ${item.name} has been sent to the bartender for review and approval.`,
        });
      } catch (error) {
        toast({
          title: "Request Failed",
          description: "Failed to send order request. Please try again.",
          variant: "destructive"
        });
      }
    }
  };
  
  return (
    <>
      <div className="menu-item-compact flex items-center gap-3 p-2">
        {/* Small image/color indicator with mobile-first constraints */}
        {foodImageUrl && !imageError ? (
          <div className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 relative">
            <Image
              src={foodImageUrl}
              alt={item.name}
              width={40}
              height={40}
              className="object-cover object-center"
              loading="lazy"
              onError={() => setImageError(true)}
              style={{ 
                maxWidth: '100%', 
                maxHeight: '100%',
                width: '100%',
                height: '100%'
              }}
            />
          </div>
        ) : (
          <div className={`w-1 h-10 sm:h-12 ${themeColor} rounded-full flex-shrink-0`} />
        )}
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-baseline gap-2">
            <h3 className="font-medium text-sm truncate">{item.name}</h3>
            <span className="font-semibold text-sm">${Number(item.price).toFixed(2)}</span>
          </div>
          {item.description && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {item.description}
            </p>
          )}
        </div>
        
        {/* Add Button */}
        <Button
          onClick={handleAddClick}
          disabled={!item.is_available || userOrderStatus === null}
          variant="secondary"
          className="w-20 h-9 text-xs font-medium"
        >
          <Plus className="w-3 h-3 mr-1" />
          {!item.is_available ? 'Out' : 
           userOrderStatus === null ? '...' :
           !userOrderStatus.is_wolfpack_member ? 'Join' :
           userOrderStatus.has_open_tab ? 'Request' : 'Tab Required'}
        </Button>
      </div>

      <MenuItemModal
        item={item}
        open={showModal}
        onClose={() => setShowModal(false)}
        onAddToCart={onAddToCart}
      />
    </>
  );
}