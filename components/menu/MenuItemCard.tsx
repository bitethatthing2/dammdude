// components/menu/MenuItemCard.tsx
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Flame, Leaf, Star, Play } from 'lucide-react';
import WatchItMadeModal from './WatchItMadeModal';
import Image from 'next/image';
import { VideoPlayer } from '@/components/ui/VideoPlayer';

import type { MenuItemWithModifiers, CartOrderData } from '@/types/features/menu';

interface MenuItemCardProps {
  item: MenuItemWithModifiers;
  onAddToCart?: (orderData: CartOrderData) => void;
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

// Function to get watch-it-made video URL for specific items
const getWatchItMadeVideo = (itemName: string, itemDescription: string): string | null => {
  const searchText = (itemName + ' ' + itemDescription).toLowerCase().trim();
  const itemNameOnly = itemName.toLowerCase().trim();
  
  // Map specific items to their watch-it-made videos
  const videoMapping: { [key: string]: string } = {
    'loaded nachos': '/food-menu-images/watch-it-made.mp4',
    'loaded nacho': '/food-menu-images/watch-it-made.mp4',
    'birria pizza': '/food-menu-images/watch-it-made-pzza.mp4',
    'taco salad': '/food-menu-images/watch-it-being-made-taco-salad.mp4',
    'burrito': '/food-menu-images/watch-it-be-made-burrito.mp4'
  };
  
  // First pass: Look for EXACT matches with full search text
  for (const [keyword, videoUrl] of Object.entries(videoMapping)) {
    if (searchText === keyword.toLowerCase() || itemNameOnly === keyword.toLowerCase()) {
      return videoUrl;
    }
  }
  
  // Second pass: Look for partial matches
  for (const [keyword, videoUrl] of Object.entries(videoMapping)) {
    if (searchText.includes(keyword.toLowerCase()) || itemNameOnly.includes(keyword.toLowerCase())) {
      return videoUrl;
    }
  }
  
  return null;
};

// Enhanced mapping object (longest matches first for better accuracy)
const itemImageMapping: { [key: string]: string } = {
  // Multi-word exact matches first
  '3 tacos beans and rice': '3-tacos-beans-rice.png',
  'chips, guac and salsa': 'chips-guac-salsa.png',
  'chips, salsa and guac': 'chips-guac-salsa.png',
  'chips and salsa': 'chips-guac-salsa.png',
  'chips & salsa': 'chips-guac-salsa.png',
  'birria consommé': 'birria-consume.png',
  'birria consume': 'birria-consume.png',
  'basket of fries': 'basket-of-fries.png',
  'basket of tots': 'basket-of-tots.png',
  'beans and rice': 'beans-and-rice.png',
  'rice and beans': 'beans-and-rice.png',
  'loaded nachos': 'loaded-nacho.png',
  'loaded fries': 'loaded-fries.png',
  'loaded nacho': 'loaded-nacho.png',
  'mango ceviche': 'mango-civeche.png',
  'french fries': 'basket-of-fries.png',
  'taco salad': 'taco-salad.png',
  'fish tacos': 'fish-tacos.png',
  'fish taco': 'fish-tacos.png',
  'shrimp tacos': 'shrimp-tacos.png',
  'shrimp taco': 'shrimp-tacos.png',
  'birria tacos': 'birria-tacos.png',
  'birria taco': 'birria-tacos.png',
  'keto tacos': 'keto-tacos.png',
  'keto taco': 'keto-tacos.png',
  'queso tacos': 'queso-tacos.png',
  'queso taco': 'queso-tacos.png',
  'single queso taco': 'single-queso-taco.png',
  'chefa sauce': 'chefa-sauce.png',
  'chicken and waffles': 'chicken-and-waffles.png',
  'hot wings': 'hot-wings.png',
  'hustle bowl': 'hustle-bowl.png',
  'porkchop platter': 'porkchop-platter.png',
  'ham and potato burrito': 'ham-and-potatoe-burrito.png',
  'ham and potatoe burrito': 'ham-and-potatoe-burrito.png',
  'asada burrito': 'asada-burrito.png',
  'taco dinner': '3-tacos-beans-rice.png',
  'taco combo': 'tacos.png',
  'taco plate': 'tacos.png',
  '3 tacos': 'tacos.png',
  'three tacos': 'tacos.png',
  
  // Single word matches
  'chilaquiles': 'CHILAQUILES.PNG',
  'empanadas': 'empanadas.png',
  'empanada': 'empanadas.png',
  'quesadilla': 'quesadilla.png',
  'flautas': 'flautas.png',
  'flauta': 'flautas.png',
  'burrito': 'burrito.png',
  'pancakes': 'pancakes.jpg',
  'pancake': 'pancakes.jpg',
  'molita': 'molita.png',
  'mulitas': 'mulitas.png',
  'mulita': 'mulitas.png',
  'ceviche': 'mango-civeche.png',
  'torta': 'torta.png',
  'nachos': 'nacho.png',
  'nacho': 'nacho.png',
  'consommé': 'birria-consume.png',
  'consume': 'birria-consume.png',
  'tacos': 'tacos.png',
  'taco': 'tacos.png',
  'fries': 'basket-of-fries.png',
  'tots': 'basket-of-tots.png',
  'beans': 'beans.png',
  'rice': 'rice.png',
  'vampiros': 'vampiros.png',
  'vampiro': 'vampiros.png'
};

const findImageForMenuItem = (itemName: string, itemDescription: string, categoryType?: string): string | null => {
  const searchText = (itemName + ' ' + itemDescription).toLowerCase().trim();
  const itemNameOnly = itemName.toLowerCase().trim();
  
  // Special handling for margarita drinks - they use the margarita image from food-menu-images
  // But margarita boards use the drink-menu-images directory
  if (categoryType === 'drink' && searchText.includes('margarita')) {
    if (searchText.includes('board')) {
      return '/drink-menu-images/margarita-boards.png';
    } else {
      return '/food-menu-images/margarita.png';
    }
  }
  
  // Determine image directory based on category type
  const imageDir = categoryType === 'drink' ? '/drink-menu-images/' : '/food-menu-images/';
  
  // Drink-specific mappings (for boards and other drink-specific images)
  const drinkImageMapping: { [key: string]: string } = {
    'margarita board': 'margarita-boards.png',
    'margarita boards': 'margarita-boards.png',
    'mimosa board': 'boards.png',
    'mimosa boards': 'boards.png',
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

// Display-only MenuItemCard - no ordering functionality
export default function MenuItemCard({ item }: MenuItemCardProps) {
  const [showWatchItMadeModal, setShowWatchItMadeModal] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  const themeColor = getCategoryTheme(item.category?.name);
  
  // Get the food image URL for this item with fallback system
  const baseImageUrl = item.image_url || findImageForMenuItem(item.name, item.description || '', item.category?.type);
  
  // Add fallback images for items without specific images
  const getFallbackImageUrl = (categoryType?: string): string => {
    if (categoryType === 'drink') {
      // Use boards image for general drinks, margarita for margarita-specific drinks
      if (item.name.toLowerCase().includes('margarita')) {
        return '/food-menu-images/margarita.png';
      }
      return '/drink-menu-images/boards.png'; // General drink fallback
    }
    return '/food-menu-images/tacos.png'; // Fallback for food
  };
  
  // Ensure we always have a valid URL, filter out empty strings and normalize path separators
  let normalizedImageUrl = baseImageUrl;
  if (normalizedImageUrl && normalizedImageUrl.trim() !== '') {
    // Normalize backslashes to forward slashes for web URLs
    normalizedImageUrl = normalizedImageUrl.replace(/\\/g, '/');
    // Ensure it starts with a forward slash for absolute paths
    if (!normalizedImageUrl.startsWith('/')) {
      normalizedImageUrl = '/' + normalizedImageUrl;
    }
  }
  
  const foodImageUrl = normalizedImageUrl || getFallbackImageUrl(item.category?.type);
  
  // Check if item has a watch-it-made video
  const watchItMadeVideoUrl = getWatchItMadeVideo(item.name, item.description || '');
  
  const isSpicy = item.name.toLowerCase().includes('spicy');
  const isVegetarian = item.name.toLowerCase().includes('vegetarian') || 
                       item.name.toLowerCase().includes('veggie');
  const isPopular = item.name.toLowerCase().includes('popular');
  
  return (
    <>
      <Card className="menu-item-card bg-zinc-800 border-zinc-600 hover:border-zinc-500 transition-colors">
        <CardContent className="p-3">
          <div className="md:flex gap-4">
            {/* Image/Video with mobile-first sizing constraints */}
            {foodImageUrl && !imageError ? (
              <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 rounded-md overflow-hidden bg-gray-800 relative flex-shrink-0 border border-gray-600">
                {foodImageUrl.endsWith('.mp4') || foodImageUrl.endsWith('.webm') ? (
                  <VideoPlayer
                    src={foodImageUrl}
                    className="w-full h-full object-cover"
                    showControls={false}
                    autoPlay
                    loop
                    muted
                  />
                ) : (
                  <Image
                    src={foodImageUrl}
                    alt={item.name}
                    fill
                    sizes="(max-width: 640px) 64px, (max-width: 768px) 80px, (max-width: 1024px) 96px, 112px"
                    className="object-cover"
                    loading="lazy"
                    placeholder="blur"
                    blurDataURL={`data:image/svg+xml;base64,${toBase64(shimmer(64, 64))}`}
                    onError={() => setImageError(true)}
                  />
                )}
              </div>
            ) : (
              <div className={`w-1 h-16 sm:h-20 md:h-18 lg:h-20 ${themeColor} rounded-full flex-shrink-0`} />
            )}
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start gap-2 mb-2">
                <h3 className="menu-item-name font-semibold text-base sm:text-lg leading-tight flex-1 text-white">{item.name}</h3>
                <span className="menu-item-price font-bold text-base sm:text-lg text-green-500 flex-shrink-0">${Number(item.price).toFixed(2)}</span>
              </div>
              {item.description && (
                <p className="menu-item-description text-xs sm:text-sm text-gray-300 line-clamp-3 sm:line-clamp-none mb-2">
                  {item.description}
                </p>
              )}
              
              {/* Badges */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {isSpicy && (
                  <Badge variant="secondary" className="bg-red-500/20 text-red-300 border-red-500/30">
                    <Flame className="w-3.5 h-3.5 mr-1" />
                    Spicy
                  </Badge>
                )}
                {isVegetarian && (
                  <Badge variant="secondary" className="bg-green-500/20 text-green-300 border-green-500/30">
                    <Leaf className="w-3.5 h-3.5 mr-1" />
                    Vegetarian
                  </Badge>
                )}
                {isPopular && (
                  <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">
                    <Star className="w-3.5 h-3.5 mr-1" />
                    Popular
                  </Badge>
                )}
                {!item.is_available && (
                  <Badge variant="destructive" className="bg-red-600/20 text-red-300 border-red-600/30">
                    Sold Out
                  </Badge>
                )}
              </div>
              
              {/* Watch It Made Button - Only show if video exists */}
              {watchItMadeVideoUrl && (
                <Button
                  onClick={() => setShowWatchItMadeModal(true)}
                  variant="outline"
                  className="w-full h-12 sm:h-10 text-sm sm:text-base font-semibold touch-manipulation border-2 border-orange-500/70 text-orange-400 hover:bg-orange-500/15 hover:border-orange-500 hover:text-orange-300 active:scale-95 transition-all duration-200 bg-orange-500/5 shadow-lg shadow-orange-500/20"
                >
                  <Play className="w-5 h-5 mr-2 sm:w-4 sm:h-4 sm:mr-1.5 fill-current" />
                  <span className="tracking-wide">Watch It Made</span>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Watch It Made Modal */}
      {watchItMadeVideoUrl && (
        <WatchItMadeModal
          isOpen={showWatchItMadeModal}
          onClose={() => setShowWatchItMadeModal(false)}
          videoSrc={watchItMadeVideoUrl}
          itemName={item.name}
        />
      )}
    </>
  );
}

// Alternative Compact List View for Mobile - also display-only
export function CompactMenuItemCard({ item }: MenuItemCardProps) {
  const [showWatchItMadeModal, setShowWatchItMadeModal] = useState(false);
  const [imageError, setImageError] = useState(false);
  const themeColor = getCategoryTheme(item.category?.name);
  
  // Get the food image URL for this item with fallback system
  const baseImageUrl = item.image_url || findImageForMenuItem(item.name, item.description || '', item.category?.type);
  
  // Add fallback images for items without specific images
  const getFallbackImageUrl = (categoryType?: string): string => {
    if (categoryType === 'drink') {
      // Use boards image for general drinks, margarita for margarita-specific drinks
      if (item.name.toLowerCase().includes('margarita')) {
        return '/food-menu-images/margarita.png';
      }
      return '/drink-menu-images/boards.png'; // General drink fallback
    }
    return '/food-menu-images/tacos.png'; // Fallback for food
  };
  
  // Ensure we always have a valid URL, filter out empty strings and normalize path separators
  let normalizedImageUrl = baseImageUrl;
  if (normalizedImageUrl && normalizedImageUrl.trim() !== '') {
    // Normalize backslashes to forward slashes for web URLs
    normalizedImageUrl = normalizedImageUrl.replace(/\\/g, '/');
    // Ensure it starts with a forward slash for absolute paths
    if (!normalizedImageUrl.startsWith('/')) {
      normalizedImageUrl = '/' + normalizedImageUrl;
    }
  }
  
  const foodImageUrl = normalizedImageUrl || getFallbackImageUrl(item.category?.type);
  
  // Check if item has a watch-it-made video
  const watchItMadeVideoUrl = getWatchItMadeVideo(item.name, item.description || '');
  
  return (
    <>
      <div className="menu-item-compact flex items-center gap-3 p-2 bg-zinc-800 rounded-lg border border-zinc-600 hover:border-zinc-500 transition-colors">
        {/* Small image/video/color indicator with mobile-first constraints */}
        {foodImageUrl && !imageError ? (
          <div className="w-12 h-12 sm:w-16 sm:h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-800 border border-gray-600">
            {foodImageUrl.endsWith('.mp4') || foodImageUrl.endsWith('.webm') ? (
              <VideoPlayer
                src={foodImageUrl}
                className="w-full h-full object-cover"
                showControls={false}
                autoPlay
                loop
                muted
              />
            ) : (
              <>
                {foodImageUrl && foodImageUrl.startsWith('/') ? (
                  <Image
                    src={foodImageUrl}
                    alt={item.name}
                    width={64}
                    height={64}
                    className="object-cover w-full h-full"
                    loading="lazy"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="w-full h-full bg-gray-700" />
                )}
              </>
            )}
          </div>
        ) : (
          <div className={`w-1 h-10 sm:h-12 ${themeColor} rounded-full flex-shrink-0`} />
        )}
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-2 mb-1">
            <h3 className="menu-item-name font-semibold text-sm leading-tight text-white">{item.name}</h3>
            <span className="menu-item-price font-bold text-sm text-green-500 flex-shrink-0">${Number(item.price).toFixed(2)}</span>
          </div>
          {item.description && (
            <p className="menu-item-description text-xs text-gray-300 line-clamp-2">
              {item.description}
            </p>
          )}
        </div>
        
        {/* Watch It Made Button - Only show if video exists */}
        {watchItMadeVideoUrl && (
          <Button
            onClick={() => setShowWatchItMadeModal(true)}
            variant="outline"
            className="w-10 h-10 sm:w-8 sm:h-8 p-0 border-2 border-orange-500/70 text-orange-400 hover:bg-orange-500/15 hover:border-orange-500 hover:text-orange-300 active:scale-90 transition-all duration-200 bg-orange-500/5 shadow-md shadow-orange-500/20 touch-manipulation"
          >
            <Play className="w-4 h-4 sm:w-3 sm:h-3 fill-current" />
          </Button>
        )}
      </div>

      {/* Watch It Made Modal */}
      {watchItMadeVideoUrl && (
        <WatchItMadeModal
          isOpen={showWatchItMadeModal}
          onClose={() => setShowWatchItMadeModal(false)}
          videoSrc={watchItMadeVideoUrl}
          itemName={item.name}
        />
      )}
    </>
  );
}