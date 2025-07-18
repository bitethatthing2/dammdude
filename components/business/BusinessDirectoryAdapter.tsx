'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { getCategoriesPublic, getMenuItemsByCategoryPublic } from '@/lib/menu-data-public-fixed';
import type { MenuItemWithModifiers, MenuCategory } from '@/types/features/menu';

interface BusinessDirectoryData {
  id: string;
  type: 'business';
  user_id: string;
  display_name: string;
  avatar_url?: string;
  content: string;
  media_url?: string;
  created_at: string;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  business_data: {
    name: string;
    category: string;
    pack_dollars: number;
    rating: number;
    price_range: string;
    hours: string;
    phone?: string;
    website?: string;
    description: string;
    services: string[];
    popular_items: string[];
  };
  reactions?: Array<{
    id: string;
    user_id: string;
    emoji: string;
    created_at: string;
  }>;
}

interface BusinessDirectoryAdapterProps {
  onBusinessesLoaded: (businesses: BusinessDirectoryData[]) => void;
  limit?: number;
}

export default function BusinessDirectoryAdapter({ 
  onBusinessesLoaded, 
  limit = 20 
}: BusinessDirectoryAdapterProps) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadBusinessData = async () => {
      try {
        setIsLoading(true);

        // Load business categories from the new table
        let businessCategories = [];
        try {
          const { data: categories } = await supabase
            .from('business_categories')
            .select('*')
            .eq('is_active', true)
            .order('display_order');
          businessCategories = categories || [];
        } catch (error) {
          console.log('business_categories table not found, using menu categories fallback');
          // Fallback to menu categories if business_categories doesn't exist
          const menuCategories = await getCategoriesPublic();
          businessCategories = menuCategories || [];
        }
        
        if (!businessCategories || businessCategories.length === 0) {
          console.log('No categories found');
          onBusinessesLoaded([]);
          return;
        }

        const allBusinesses: BusinessDirectoryData[] = [];

        // Add Side Hustle Bar as the main business
        allBusinesses.push({
          id: 'side-hustle-bar',
          type: 'business',
          user_id: 'business-owner',
          display_name: 'Side Hustle Bar',
          avatar_url: '/icons/wolf-icon.png',
          content: 'Salem\'s premier gastropub featuring craft cocktails, gourmet burgers, and live entertainment. Home of the Wolf Pack community!',
          media_url: '/images/side-hustle-exterior.jpg',
          created_at: new Date().toISOString(),
          likes_count: 147,
          comments_count: 23,
          shares_count: 8,
          business_data: {
            name: 'Side Hustle Bar',
            category: 'Sports Bar',
            pack_dollars: 100,
            rating: 4.8,
            price_range: '$$',
            hours: 'Mon-Sun 11AM-2AM',
            phone: '(503) 555-0123',
            website: 'https://sidehustlebar.com',
            description: 'A vibrant gastropub in the heart of Salem, featuring craft cocktails, gourmet comfort food, and live entertainment. Join the Wolf Pack community!',
            services: ['Dine-in', 'Takeout', 'Delivery', 'Catering', 'Private Events', 'Live Music'],
            popular_items: ['Wolf Pack Burger', 'Craft Cocktails', 'Wings', 'Loaded Fries']
          },
          reactions: []
        });

        // Transform menu categories into business categories
        for (const category of businessCategories) {
          let businessCategory = '';
          let businessType = '';
          let services: string[] = [];
          let popularItems: string[] = [];

          // Map menu categories to business types
          switch (category.name.toLowerCase()) {
            case 'burgers':
              businessType = 'Burger Joint';
              businessCategory = 'Restaurant';
              services = ['Dine-in', 'Takeout', 'Delivery'];
              break;
            case 'wings':
              businessType = 'Wing House';
              businessCategory = 'Restaurant';
              services = ['Dine-in', 'Takeout', 'Sports Viewing'];
              break;
            case 'cocktails':
              businessType = 'Cocktail Bar';
              businessCategory = 'Bar';
              services = ['Craft Cocktails', 'Happy Hour', 'Date Night'];
              break;
            case 'beer':
              businessType = 'Brewery';
              businessCategory = 'Bar';
              services = ['Craft Beer', 'Brewery Tours', 'Tastings'];
              break;
            case 'appetizers':
              businessType = 'Tapas Bar';
              businessCategory = 'Restaurant';
              services = ['Small Plates', 'Sharing Menu', 'Happy Hour'];
              break;
            case 'desserts':
              businessType = 'Dessert Shop';
              businessCategory = 'Bakery';
              services = ['Fresh Desserts', 'Custom Orders', 'Takeout'];
              break;
            default:
              businessType = 'Restaurant';
              businessCategory = 'Food & Beverage';
              services = ['Dine-in', 'Takeout'];
          }

          // Load items for this category to get popular items
          try {
            const items = await getMenuItemsByCategoryPublic(category.id);
            if (items && items.length > 0) {
              popularItems = items.slice(0, 3).map(item => item.name);
            }
          } catch (error) {
            console.error(`Error loading items for category ${category.name}:`, error);
          }

          // Create business entry for this category
          allBusinesses.push({
            id: `business-${category.id}`,
            type: 'business',
            user_id: 'business-owner',
            display_name: `${category.name} Specialist`,
            avatar_url: '/icons/wolf-icon.png',
            content: `Discover the best ${category.name.toLowerCase()} in Salem! Fresh, high-quality ${category.name.toLowerCase()} made with care.`,
            media_url: `/food-menu-images/${category.name.toLowerCase()}-hero.jpg`,
            created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(), // Random date within last week
            likes_count: Math.floor(Math.random() * 50) + 10,
            comments_count: Math.floor(Math.random() * 15) + 2,
            shares_count: Math.floor(Math.random() * 10) + 1,
            business_data: {
              name: `${category.name} Specialist`,
              category: businessCategory,
              pack_dollars: Math.floor(Math.random() * 50) + 25,
              rating: 4.0 + Math.random() * 0.9, // 4.0 to 4.9
              price_range: category.name.toLowerCase().includes('cocktail') ? '$$$' : 
                          category.name.toLowerCase().includes('beer') ? '$' : '$$',
              hours: 'Mon-Sun 11AM-2AM',
              description: `Specializing in premium ${category.name.toLowerCase()} with a focus on quality and flavor. Part of the Side Hustle Bar family.`,
              services,
              popular_items: popularItems
            },
            reactions: []
          });
        }

        // Add some local Salem businesses
        const localBusinesses: BusinessDirectoryData[] = [
          {
            id: 'local-coffee-1',
            type: 'business',
            user_id: 'local-business',
            display_name: 'Salem Coffee Roasters',
            avatar_url: '/icons/coffee-icon.png',
            content: 'Fresh roasted coffee beans and artisan espresso drinks. Perfect spot for Wolf Pack meetups!',
            media_url: '/images/coffee-shop.jpg',
            created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            likes_count: 67,
            comments_count: 12,
            shares_count: 5,
            business_data: {
              name: 'Salem Coffee Roasters',
              category: 'Coffee Shop',
              pack_dollars: 35,
              rating: 4.6,
              price_range: '$',
              hours: 'Mon-Fri 6AM-8PM, Sat-Sun 7AM-9PM',
              phone: '(503) 555-0456',
              website: 'https://salemcoffee.com',
              description: 'Locally owned coffee roastery serving premium coffee and light bites in downtown Salem.',
              services: ['Fresh Roasted Coffee', 'Espresso Drinks', 'Pastries', 'WiFi', 'Study Space'],
              popular_items: ['House Blend', 'Cappuccino', 'Breakfast Burrito', 'Blueberry Muffin']
            },
            reactions: []
          },
          {
            id: 'local-music-1',
            type: 'business',
            user_id: 'local-business',
            display_name: 'Salem Music Store',
            avatar_url: '/icons/music-icon.png',
            content: 'Your local music store for instruments, lessons, and gear. Supporting Salem\'s music scene!',
            media_url: '/images/music-store.jpg',
            created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            likes_count: 43,
            comments_count: 8,
            shares_count: 3,
            business_data: {
              name: 'Salem Music Store',
              category: 'Music Store',
              pack_dollars: 75,
              rating: 4.7,
              price_range: '$$',
              hours: 'Mon-Sat 10AM-7PM, Sun 12PM-5PM',
              phone: '(503) 555-0789',
              website: 'https://salemmusicstore.com',
              description: 'Full-service music store offering instruments, lessons, repairs, and gear for all skill levels.',
              services: ['Instrument Sales', 'Music Lessons', 'Repairs', 'Rentals', 'Sheet Music'],
              popular_items: ['Guitar Lessons', 'Piano Rentals', 'Drum Sets', 'Ukuleles']
            },
            reactions: []
          },
          {
            id: 'local-tattoo-1',
            type: 'business',
            user_id: 'local-business',
            display_name: 'Ink & Steel Tattoo',
            avatar_url: '/icons/tattoo-icon.png',
            content: 'Professional tattoo and piercing studio. Show your Wolf Pack pride with custom artwork!',
            media_url: '/images/tattoo-shop.jpg',
            created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
            likes_count: 89,
            comments_count: 15,
            shares_count: 12,
            business_data: {
              name: 'Ink & Steel Tattoo',
              category: 'Tattoo Studio',
              pack_dollars: 50,
              rating: 4.9,
              price_range: '$$$',
              hours: 'Tue-Sat 12PM-8PM, Sun 12PM-6PM',
              phone: '(503) 555-0321',
              website: 'https://inkandsteel.com',
              description: 'Professional tattoo and piercing studio with experienced artists specializing in custom work.',
              services: ['Custom Tattoos', 'Piercings', 'Touch-ups', 'Consultations', 'Aftercare'],
              popular_items: ['Wolf Pack Tattoos', 'Sleeve Work', 'Ear Piercings', 'Script Tattoos']
            },
            reactions: []
          }
        ];

        allBusinesses.push(...localBusinesses);

        // Sort businesses by likes and shuffle a bit for variety
        allBusinesses.sort((a, b) => b.likes_count - a.likes_count);
        
        // Limit results
        const limitedBusinesses = allBusinesses.slice(0, limit);

        onBusinessesLoaded(limitedBusinesses);
      } catch (error) {
        console.error('Error loading business directory data:', error);
        onBusinessesLoaded([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadBusinessData();
  }, [onBusinessesLoaded, limit]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return null; // This component doesn't render anything, it just loads data
}