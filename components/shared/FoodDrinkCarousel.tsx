'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Utensils, Wine, Star, DollarSign } from 'lucide-react';
import { VideoPlayer } from '@/components/ui/VideoPlayer';
import { getFreshImageUrl } from '@/lib/utils/image-cache';

interface CarouselItem {
  id: string;
  name: string;
  image: string;
  type: 'food' | 'drink';
  description: string;
  price: string;
  category: string;
  features?: string[];
}

const carouselItems: CarouselItem[] = [
  // Birria Specialties
  { 
    id: '1', 
    name: 'Birria Queso Tacos', 
    image: '/food-menu-images/birria-tacos.png', 
    type: 'food', 
    description: '3 queso birria tacos with queso oaxaca, onions, and cilantro. Served with consommé for dipping.',
    price: '$16.75',
    category: 'Birria Specialties',
    features: ['Signature Item', '3 Tacos Included']
  },
  { 
    id: '2', 
    name: 'Birria Pizza', 
    image: '/food-menu-images/birria-tacos.png', 
    type: 'food', 
    description: 'Two flour tortillas with birria, cilantro, onions, and queso oaxaca.',
    price: '$29.00',
    category: 'Birria Specialties',
    features: ['Unique Creation', 'Shareable']
  },
  { 
    id: '3', 
    name: 'Birria Flautas', 
    image: '/food-menu-images/flautas.png', 
    type: 'food', 
    description: 'Corn tortilla filled with birria, served with consommé.',
    price: '$12.00',
    category: 'Birria Specialties',
    features: ['Crispy Corn Tortilla', 'With Consommé']
  },
  { 
    id: '4', 
    name: 'Birria Ramen Bowl', 
    image: '/food-menu-images/hustle-bowl.png', 
    type: 'food', 
    description: 'Birria tapatío noodles with cilantro and onions.',
    price: '$14.75',
    category: 'Birria Specialties',
    features: ['Fusion Dish', 'Hearty Bowl']
  },

  // Breakfast Items
  { 
    id: '5', 
    name: 'Chicken & Waffles', 
    image: '/food-menu-images/chicken-and-waffles.png', 
    type: 'food', 
    description: 'Crispy fried chicken served on golden waffles with maple syrup and butter.',
    price: '$19.00',
    category: 'Breakfast All Day',
    features: ['Southern Style', 'Sweet & Savory']
  },
  { 
    id: '6', 
    name: 'Chilaquiles Green', 
    image: '/food-menu-images/CHILAQUILES.PNG', 
    type: 'food', 
    description: 'Traditional Mexican breakfast with crispy tortilla chips simmered in green salsa, topped with cheese and crema.',
    price: '$17.00',
    category: 'Breakfast All Day',
    features: ['Traditional Recipe', 'Green Salsa']
  },
  { 
    id: '7', 
    name: 'Chilaquiles Red', 
    image: '/food-menu-images/CHILAQUILES.PNG', 
    type: 'food', 
    description: 'Traditional Mexican breakfast with crispy tortilla chips simmered in red salsa, topped with cheese and crema.',
    price: '$17.00',
    category: 'Breakfast All Day',
    features: ['Traditional Recipe', 'Red Salsa']
  },
  { 
    id: '8', 
    name: 'Chorizo & Potato Breakfast Burrito', 
    image: '/food-menu-images/ham-and-potatoe-burrito.png', 
    type: 'food', 
    description: 'Breakfast burrito with scrambled eggs, chorizo, seasoned potatoes, cheese, and salsa.',
    price: '$15.00',
    category: 'Breakfast All Day',
    features: ['Breakfast Item', 'Spicy Chorizo']
  },
  { 
    id: '9', 
    name: 'Ham & Potato Breakfast Burrito', 
    image: '/food-menu-images/ham-and-potatoe-burrito.png', 
    type: 'food', 
    description: 'Breakfast burrito with scrambled eggs, ham, seasoned potatoes, cheese, and salsa.',
    price: '$15.00',
    category: 'Breakfast All Day',
    features: ['Breakfast Item', 'Hearty']
  },
  { 
    id: '10', 
    name: 'Monchi Pancakes', 
    image: '/food-menu-images/pancakes.jpg', 
    type: 'food', 
    description: 'Fluffy pancakes served with butter and maple syrup.',
    price: '$15.00',
    category: 'Breakfast All Day',
    features: ['Fluffy', 'House Special']
  },
  { 
    id: '11', 
    name: 'Asada & Bacon', 
    image: '/food-menu-images/asada-burrito.png', 
    type: 'food', 
    description: 'Carne asada with crispy bacon, perfect breakfast combination.',
    price: '$13.00',
    category: 'Breakfast All Day',
    features: ['Protein Packed', 'Breakfast Combo']
  },

  // Main Dishes
  { 
    id: '12', 
    name: 'Tacos', 
    image: '/food-menu-images/tacos.png', 
    type: 'food', 
    description: 'Authentic Mexican tacos with your choice of meat, served with onions and cilantro.',
    price: '$3.75',
    category: 'Main Dishes',
    features: ['Authentic', 'Multiple Meats Available']
  },
  { 
    id: '13', 
    name: 'Single Queso Taco', 
    image: '/food-menu-images/queso-tacos.png', 
    type: 'food', 
    description: 'Taco filled with melted cheese and your choice of meat, grilled until crispy and golden.',
    price: '$6.90',
    category: 'Main Dishes',
    features: ['Extra Cheesy', 'Grilled Crispy']
  },
  { 
    id: '14', 
    name: 'Mulita', 
    image: '/food-menu-images/mulitas.png', 
    type: 'food', 
    description: 'Grilled tortilla sandwich filled with cheese and your choice of meat, served crispy and golden.',
    price: '$7.75',
    category: 'Main Dishes',
    features: ['Crispy & Golden', 'Comfort Food']
  },
  { 
    id: '15', 
    name: 'Vampiros', 
    image: '/food-menu-images/vampiros.png', 
    type: 'food', 
    description: 'Crispy tortillas topped with beans, cheese, meat, lettuce, tomato, and crema.',
    price: '$7.75',
    category: 'Main Dishes',
    features: ['Street Food Style', 'Crispy Base']
  },
  { 
    id: '16', 
    name: 'Empanadas', 
    image: '/food-menu-images/empanadas.png', 
    type: 'food', 
    description: 'Golden pastries filled with seasoned beef, chicken, or cheese. Served with salsa for dipping.',
    price: '$7.00',
    category: 'Main Dishes',
    features: ['Golden Pastry', 'Multiple Fillings']
  },
  { 
    id: '17', 
    name: 'Flautas (4)', 
    image: '/food-menu-images/flautas.png', 
    type: 'food', 
    description: 'Four crispy rolled tortillas filled with chicken or beef, served with guacamole, sour cream, and salsa verde.',
    price: '$10.00',
    category: 'Main Dishes',
    features: ['Crispy Rolled', '4 Pieces']
  },
  { 
    id: '18', 
    name: 'Quesadilla', 
    image: '/food-menu-images/quesadilla.png', 
    type: 'food', 
    description: 'Large flour tortilla filled with melted cheese and your choice of meat, grilled to perfection.',
    price: '$14.00',
    category: 'Main Dishes',
    features: ['Kid Friendly', 'Customizable']
  },
  { 
    id: '19', 
    name: 'Torta', 
    image: '/food-menu-images/torta.png', 
    type: 'food', 
    description: 'Mexican sandwich on toasted bread with your choice of meat, beans, lettuce, tomato, avocado, and chipotle mayo.',
    price: '$15.50',
    category: 'Main Dishes',
    features: ['Mexican Sandwich', 'Toasted Bread']
  },
  { 
    id: '20', 
    name: 'Hustle Bowl', 
    image: '/food-menu-images/hustle-bowl.png', 
    type: 'food', 
    description: 'Our signature bowl with rice, beans, your choice of protein, cheese, salsa, guacamole, and all the fixings.',
    price: '$15.00',
    category: 'Main Dishes',
    features: ['Build Your Own', 'Healthy Options']
  },
  { 
    id: '21', 
    name: 'Taco Salad', 
    image: '/food-menu-images/taco-salad.png', 
    type: 'food', 
    description: 'Fresh lettuce topped with your choice of meat, beans, cheese, tomatoes, and avocado in a crispy tortilla bowl.',
    price: '$14.00',
    category: 'Main Dishes',
    features: ['Fresh', 'Crispy Bowl']
  },
  { 
    id: '22', 
    name: 'Loaded Nachos', 
    image: '/food-menu-images/loaded-nacho.png', 
    type: 'food', 
    description: 'Fresh tortilla chips loaded with cheese, beans, jalapeños, sour cream, guacamole, and your choice of meat. Perfect for sharing!',
    price: '$19.00',
    category: 'Main Dishes',
    features: ['Shareable', 'Half Order $11.00']
  },
  { 
    id: '23', 
    name: 'Loaded Nachos (Cheese Only)', 
    image: '/food-menu-images/loaded-nacho.png', 
    type: 'food', 
    description: 'Fresh tortilla chips loaded with cheese, beans, jalapeños, sour cream, and guacamole.',
    price: '$14.00',
    category: 'Main Dishes',
    features: ['Vegetarian', 'Cheese Only']
  },
  { 
    id: '24', 
    name: 'Loaded Fries', 
    image: '/food-menu-images/loaded-fries.png', 
    type: 'food', 
    description: 'Crispy fries topped with cheese, bacon, jalapeños, sour cream, and green onions.',
    price: '$19.00',
    category: 'Main Dishes',
    features: ['Fully Loaded', 'Half Order $11.00']
  },

  // Seafood
  { 
    id: '25', 
    name: 'Fried Fish Tacos (2)', 
    image: '/food-menu-images/fish-tacos.png', 
    type: 'food', 
    description: 'Two fresh white fish tacos, beer-battered and fried, served in corn tortillas with cabbage slaw and chipotle crema.',
    price: '$11.00',
    category: 'Seafood',
    features: ['Fresh Fish', '2 Tacos']
  },
  { 
    id: '26', 
    name: 'Fried Shrimp Tacos (2)', 
    image: '/food-menu-images/shrimp-tacos.png', 
    type: 'food', 
    description: 'Two fried shrimp tacos with cabbage slaw and chipotle aioli on corn tortillas.',
    price: '$11.00',
    category: 'Seafood',
    features: ['Fried Shrimp', '2 Tacos']
  },

  // Wings
  { 
    id: '27', 
    name: '4 Wings', 
    image: '/food-menu-images/hot-wings.png', 
    type: 'food', 
    description: 'Four crispy chicken wings tossed in your choice of buffalo, BBQ, or mango habanero sauce.',
    price: '$8.00',
    category: 'Wings',
    features: ['Multiple Sauces', '4 Pieces']
  },
  { 
    id: '28', 
    name: '8 Wings', 
    image: '/food-menu-images/hot-wings.png', 
    type: 'food', 
    description: 'Eight crispy chicken wings tossed in your choice of buffalo, BBQ, or mango habanero sauce.',
    price: '$15.00',
    category: 'Wings',
    features: ['Multiple Sauces', '8 Pieces']
  },
  { 
    id: '29', 
    name: 'Family Wing Pack (20 Wings)', 
    image: '/food-menu-images/hot-wings.png', 
    type: 'food', 
    description: 'Twenty crispy chicken wings tossed in your choice of buffalo, BBQ, or mango habanero sauce.',
    price: '$35.00',
    category: 'Wings',
    features: ['Family Size', '20 Pieces']
  },

  // Keto
  { 
    id: '30', 
    name: 'Keto Taco', 
    image: '/food-menu-images/keto-tacos.png', 
    type: 'food', 
    description: 'Low-carb taco served in a crispy cheese shell with your choice of protein and keto-friendly toppings.',
    price: '$7.00',
    category: 'Keto',
    features: ['Keto-Friendly', 'Cheese Shell']
  },

  // Specials
  { 
    id: '31', 
    name: '3 Tacos Beans and Rice', 
    image: '/food-menu-images/3-tacos-beans-rice.png', 
    type: 'food', 
    description: 'Three authentic tacos with your choice of meat, served with seasoned black beans and Mexican rice.',
    price: '$15.00',
    category: 'Specials',
    features: ['Complete Meal', 'Choice of Meat']
  },
  { 
    id: '32', 
    name: 'Mango Ceviche', 
    image: '/food-menu-images/mango-civeche.png', 
    type: 'food', 
    description: 'Fresh fish marinated in lime juice with mango, red onion, cilantro, and jalapeños. Served with tortilla chips.',
    price: '$18.99',
    category: 'Specials',
    features: ['Fresh', 'Citrus Marinated']
  },
  { 
    id: '33', 
    name: 'Pork Chop Platter', 
    image: '/food-menu-images/porkchop-platter.png', 
    type: 'food', 
    description: 'Grilled pork chop served with rice, beans, and tortillas. A hearty traditional meal.',
    price: '$18.00',
    category: 'Specials',
    features: ['Hearty Meal', 'Traditional']
  },

  // Small Bites
  { 
    id: '34', 
    name: 'Basket of Fries', 
    image: '/food-menu-images/basket-of-fries.png', 
    type: 'food', 
    description: 'Golden crispy french fries served hot with your choice of dipping sauce.',
    price: '$7.00',
    category: 'Small Bites',
    features: ['Crispy', 'Choice of Sauce']
  },
  { 
    id: '35', 
    name: 'Basket of Tots', 
    image: '/food-menu-images/basket-of-tots.png', 
    type: 'food', 
    description: 'Crispy tater tots served hot with ketchup or your favorite dipping sauce.',
    price: '$7.00',
    category: 'Small Bites',
    features: ['Crispy', 'Popular Side']
  },
  { 
    id: '36', 
    name: 'Chips, Guac and Salsa', 
    image: '/food-menu-images/chips-guac-salsa.png', 
    type: 'food', 
    description: 'Fresh tortilla chips served with house-made guacamole and our signature salsa.',
    price: '$12.00',
    category: 'Small Bites',
    features: ['House-Made', 'Fresh Daily']
  },

  // Sides
  { 
    id: '37', 
    name: 'Rice', 
    image: '/food-menu-images/rice.png', 
    type: 'food', 
    description: 'Fluffy Mexican rice cooked with tomatoes, onions, and spices.',
    price: '$3.60',
    category: 'Sides',
    features: ['Fluffy', 'Flavorful']
  },
  { 
    id: '38', 
    name: 'Beans', 
    image: '/food-menu-images/beans.png', 
    type: 'food', 
    description: 'Seasoned black beans cooked with onions, garlic, and Mexican spices.',
    price: '$3.60',
    category: 'Sides',
    features: ['Seasoned', 'Traditional']
  },
  { 
    id: '39', 
    name: 'Beans and Rice', 
    image: '/food-menu-images/beans-and-rice.png', 
    type: 'food', 
    description: 'Seasoned black beans and Mexican rice - the perfect complement to any meal.',
    price: '$7.20',
    category: 'Sides',
    features: ['Traditional', 'Perfect Side']
  },

  // DRINKS - Margaritas
  { 
    id: '40', 
    name: 'Hustle Margarita', 
    image: '/drink-menu-images/margarita-boards.png', 
    type: 'drink', 
    description: 'Our signature margarita made with premium tequila, fresh lime juice, and agave nectar.',
    price: '$15.00',
    category: 'Margaritas',
    features: ['Signature Drink', 'Premium Tequila']
  },
  { 
    id: '41', 
    name: 'Skinny Margarita', 
    image: '/drink-menu-images/margarita-boards.png', 
    type: 'drink', 
    description: 'Low-calorie margarita with fresh lime juice and agave nectar.',
    price: '$14.00',
    category: 'Margaritas',
    features: ['Low Calorie', 'Fresh Lime']
  },
  { 
    id: '42', 
    name: 'Spicy Margarita', 
    image: '/drink-menu-images/margarita-boards.png', 
    type: 'drink', 
    description: 'Our signature margarita with jalapeño-infused tequila and a chili-salt rim for the perfect kick.',
    price: '$14.00',
    category: 'Margaritas',
    features: ['Spicy Heat', 'Jalapeño Infused']
  },

  // House Favorites
  { 
    id: '43', 
    name: 'Paloma', 
    image: '/drink-menu-images/margarita-boards.png', 
    type: 'drink', 
    description: 'Refreshing cocktail with tequila, fresh grapefruit juice, lime, and a splash of soda water.',
    price: '$11.00',
    category: 'House Favorites',
    features: ['Refreshing', 'Citrus Forward']
  },
  { 
    id: '44', 
    name: 'Michelada', 
    image: '/drink-menu-images/margarita-boards.png', 
    type: 'drink', 
    description: 'Mexican beer cocktail with lime juice, hot sauce, Worcestershire, and spices, served with a chili-lime rim.',
    price: '$12.00',
    category: 'House Favorites',
    features: ['Authentic Mexican', 'Savory & Spicy']
  },
  { 
    id: '45', 
    name: 'Bloody Mary', 
    image: '/drink-menu-images/margarita-boards.png', 
    type: 'drink', 
    description: 'Classic brunch cocktail with vodka, tomato juice, and a blend of spices.',
    price: '$12.00',
    category: 'House Favorites',
    features: ['Brunch Classic', 'Savory']
  },

  // Beer
  { 
    id: '46', 
    name: 'Corona', 
    image: '/drink-menu-images/boards.png', 
    type: 'drink', 
    description: 'Classic Mexican lager beer served ice cold.',
    price: '$5.00',
    category: 'Beer',
    features: ['Mexican Lager', 'Ice Cold']
  },
  { 
    id: '47', 
    name: 'Modelo', 
    image: '/drink-menu-images/boards.png', 
    type: 'drink', 
    description: 'Premium Mexican beer with a rich, full flavor.',
    price: '$5.00',
    category: 'Beer',
    features: ['Premium Mexican', 'Full Flavor']
  },

  // Boards & Towers
  { 
    id: '48', 
    name: 'Margarita Board', 
    image: '/drink-menu-images/boards.png', 
    type: 'drink', 
    description: 'Shareable board featuring multiple margarita flavors for the perfect group experience.',
    price: '$35.00',
    category: 'Boards & Towers',
    features: ['Shareable', 'Multiple Flavors']
  },
  { 
    id: '49', 
    name: 'Hustle Margarita Tower', 
    image: '/drink-menu-images/boards.png', 
    type: 'drink', 
    description: 'Large tower of our signature Hustle Margaritas, perfect for celebrations.',
    price: '$50.00',
    category: 'Boards & Towers',
    features: ['Party Size', 'Signature Recipe']
  }
];

export function FoodDrinkCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerView, setItemsPerView] = useState(2);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'food' | 'drink'>('all');
  // Removed selectedItem state - no modal on click
  
  // Touch handling states
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Filter items based on active filter
  const filteredItems = carouselItems.filter(item => {
    if (activeFilter === 'all') return true;
    return item.type === activeFilter;
  });

  // Responsive items per view - more items on desktop for smaller cards
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setItemsPerView(1);
      } else if (window.innerWidth < 1200) {
        setItemsPerView(3);
      } else {
        setItemsPerView(4);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Reset current index when filter changes
  useEffect(() => {
    setCurrentIndex(0);
  }, [activeFilter]);

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        const maxIndex = filteredItems.length - itemsPerView;
        return prev >= maxIndex ? 0 : prev + 1;
      });
    }, 8000);

    return () => clearInterval(interval);
  }, [itemsPerView, isAutoPlaying, filteredItems.length]);

  const nextSlide = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => {
      const maxIndex = filteredItems.length - itemsPerView;
      return prev >= maxIndex ? 0 : prev + 1;
    });
  };

  const prevSlide = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => {
      const maxIndex = filteredItems.length - itemsPerView;
      return prev <= 0 ? maxIndex : prev - 1;
    });
  };

  const goToSlide = (index: number) => {
    setIsAutoPlaying(false);
    setCurrentIndex(index);
  };

  const maxIndex = Math.max(0, filteredItems.length - itemsPerView);

  const handleFilterChange = (filter: 'all' | 'food' | 'drink') => {
    setActiveFilter(filter);
    setIsAutoPlaying(false);
  };

  // Touch handlers
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      nextSlide();
    } else if (isRightSwipe) {
      prevSlide();
    }
  };

  return (
    <div className="relative w-full">
      {/* Compact Filter Buttons */}
      <div className="flex justify-center gap-2 sm:gap-3 mb-4 sm:mb-6">
        <button
          onClick={() => handleFilterChange('all')}
          className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 shadow-sm border ${
            activeFilter === 'all'
              ? 'bg-red-600 text-white border-red-600 shadow-lg transform scale-105'
              : 'bg-white text-gray-700 border-gray-200 hover:border-red-300 hover:text-red-600 hover:shadow-md'
          }`}
        >
          All Items
        </button>
        <button
          onClick={() => handleFilterChange('food')}
          className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 flex items-center gap-1 sm:gap-2 shadow-sm border ${
            activeFilter === 'food'
              ? 'bg-red-600 text-white border-red-600 shadow-lg transform scale-105'
              : 'bg-white text-gray-700 border-gray-200 hover:border-red-300 hover:text-red-600 hover:shadow-md'
          }`}
        >
          <Utensils className="h-3 w-3 sm:h-4 sm:w-4" />
          Food
        </button>
        <button
          onClick={() => handleFilterChange('drink')}
          className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 flex items-center gap-1 sm:gap-2 shadow-sm border ${
            activeFilter === 'drink'
              ? 'bg-red-600 text-white border-red-600 shadow-lg transform scale-105'
              : 'bg-white text-gray-700 border-gray-200 hover:border-red-300 hover:text-red-600 hover:shadow-md'
          }`}
        >
          <Wine className="h-3 w-3 sm:h-4 sm:w-4" />
          Drinks
        </button>
      </div>

      {/* Carousel Container */}
      <div 
        className="relative overflow-hidden rounded-xl"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div 
          className="flex transition-transform duration-500 ease-in-out"
          style={{ 
            transform: `translateX(-${currentIndex * (100 / filteredItems.length)}%)`,
            width: `${filteredItems.length * (100 / itemsPerView)}%`
          }}
        >
          {filteredItems.map((item) => (
            <div 
              key={item.id}
              className="flex-shrink-0 px-2"
              style={{ width: `${100 / filteredItems.length}%` }}
            >
              <div 
                className="group bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl shadow-lg hover:shadow-2xl border border-gray-700 hover:border-gray-600 transition-all duration-300 overflow-hidden"
              >
                {/* Professional Featured Image/Video */}
                <div className="aspect-[4/3] relative bg-gradient-to-br from-gray-800 to-gray-900">
                  {item.image.endsWith('.mp4') || item.image.endsWith('.webm') ? (
                    <VideoPlayer
                      src={getFreshImageUrl(item.image)}
                      className="w-full h-full object-cover"
                      showControls={false}
                      autoPlay
                      loop
                      muted
                    />
                  ) : (
                    <Image 
                      src={getFreshImageUrl(item.image)}
                      alt={item.name}
                      fill
                      className="object-cover object-center group-hover:scale-110 transition-transform duration-700"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  )}
                  {/* Gradient overlay for better text readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  
                  {/* Price badge */}
                  <div className="absolute top-3 right-3">
                    <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                      {item.price}
                    </span>
                  </div>
                  
                  {/* Category badge */}
                  <div className="absolute top-3 left-3">
                    <span className="bg-black/70 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs font-medium uppercase tracking-wider">
                      {item.category}
                    </span>
                  </div>
                </div>
                
                {/* Professional Content Section */}
                <div className="p-4">
                  {/* Item Name */}
                  <h3 className="text-base sm:text-lg font-bold text-white leading-tight mb-2 group-hover:text-red-400 transition-colors duration-300">
                    {item.name}
                  </h3>
                  
                  {/* Description */}
                  <p className="text-gray-300 text-sm leading-relaxed mb-3 line-clamp-2">
                    {item.description.length > 100 ? `${item.description.substring(0, 100)}...` : item.description}
                  </p>
                  
                  {/* Features */}
                  {item.features && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {item.features.slice(0, 2).map((feature, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs font-medium">
                          {feature}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {/* Bottom section */}
                  <div className="flex items-center justify-between">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${
                      item.type === 'food' 
                        ? 'bg-orange-600 text-white' 
                        : 'bg-blue-600 text-white'
                    }`}>
                      {item.type === 'food' ? <Utensils className="h-3 w-3" /> : <Wine className="h-3 w-3" />}
                      {item.type === 'food' ? 'Food' : 'Drink'}
                    </span>
                    
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Arrows */}
      {filteredItems.length > itemsPerView && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-700 hover:text-gray-900 p-2 rounded-full transition-all duration-200 z-10 shadow-lg border border-gray-200"
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          
          <button
            onClick={nextSlide}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-700 hover:text-gray-900 p-2 rounded-full transition-all duration-200 z-10 shadow-lg border border-gray-200"
            disabled={currentIndex >= maxIndex}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}



    </div>
  );
}