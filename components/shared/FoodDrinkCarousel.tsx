'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Utensils, Wine, Star, DollarSign } from 'lucide-react';

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
    name: 'Birria Tacos', 
    image: '/food-menu-images/birria-tacos.png', 
    type: 'food', 
    description: 'Our signature slow-cooked birria beef served in handmade corn tortillas with onions, cilantro, and melted cheese. Served with consommé for dipping.',
    price: '$14.99',
    category: 'Birria Specialties',
    features: ['Signature Item', 'Gluten-Free Tortillas Available']
  },
  { 
    id: '2', 
    name: 'Birria Consommé', 
    image: '/food-menu-images/birria-consume.png', 
    type: 'food', 
    description: 'Rich, flavorful birria broth perfect for dipping or enjoying on its own. Made from our slow-cooked beef and aromatic spices.',
    price: '$6.99',
    category: 'Birria Specialties',
    features: ['Traditional Recipe', 'Perfect for Dipping']
  },

  // Tacos & Mexican Classics
  { 
    id: '3', 
    name: 'Three Tacos with Beans & Rice', 
    image: '/food-menu-images/3-tacos-beans-rice.png', 
    type: 'food', 
    description: 'Three authentic tacos with your choice of meat, served with seasoned black beans and Mexican rice. A complete meal.',
    price: '$13.99',
    category: 'Taco Combos',
    features: ['Complete Meal', 'Choice of Meat']
  },
  { 
    id: '4', 
    name: 'Classic Tacos', 
    image: '/food-menu-images/tacos.png', 
    type: 'food', 
    description: 'Authentic Mexican tacos with your choice of carne asada, carnitas, chicken, or al pastor. Served with onions and cilantro.',
    price: '$3.99',
    category: 'Tacos',
    features: ['Authentic', 'Multiple Meats Available']
  },
  { 
    id: '5', 
    name: 'Fish Tacos', 
    image: '/food-menu-images/fish-tacos.png', 
    type: 'food', 
    description: 'Fresh white fish, beer-battered or grilled, served in corn tortillas with cabbage slaw, pico de gallo, and chipotle crema.',
    price: '$14.99',
    category: 'Seafood',
    features: ['Fresh Fish', 'Beer Battered or Grilled']
  },
  { 
    id: '6', 
    name: 'Shrimp Tacos', 
    image: '/food-menu-images/shrimp-tacos.png', 
    type: 'food', 
    description: 'Grilled shrimp tacos with mango salsa, cabbage slaw, and chipotle aioli on corn tortillas.',
    price: '$15.99',
    category: 'Seafood',
    features: ['Grilled Shrimp', 'Mango Salsa']
  },
  { 
    id: '7', 
    name: 'Keto Tacos', 
    image: '/food-menu-images/keto-tacos.png', 
    type: 'food', 
    description: 'Low-carb tacos served in crispy cheese shells with your choice of protein and keto-friendly toppings.',
    price: '$16.99',
    category: 'Healthy Options',
    features: ['Keto-Friendly', 'Cheese Shell']
  },
  { 
    id: '8', 
    name: 'Queso Tacos', 
    image: '/food-menu-images/queso-tacos.png', 
    type: 'food', 
    description: 'Tacos filled with melted cheese and your choice of meat, grilled until crispy and golden.',
    price: '$13.99',
    category: 'Specialty Tacos',
    features: ['Extra Cheesy', 'Grilled Crispy']
  },

  // Burritos & Wraps
  { 
    id: '9', 
    name: 'Carne Asada Burrito', 
    image: '/food-menu-images/asada-burrito.png', 
    type: 'food', 
    description: 'Grilled steak wrapped in a flour tortilla with rice, beans, cheese, salsa, and guacamole. A hearty meal in every bite.',
    price: '$13.99',
    category: 'Burritos',
    features: ['Protein Packed', 'Customer Favorite']
  },
  { 
    id: '10', 
    name: 'Classic Burrito', 
    image: '/food-menu-images/burrito.png', 
    type: 'food', 
    description: 'Large flour tortilla filled with your choice of meat, rice, beans, cheese, lettuce, and salsa.',
    price: '$11.99',
    category: 'Burritos',
    features: ['Filling', 'Customizable']
  },
  { 
    id: '11', 
    name: 'Ham & Potato Burrito', 
    image: '/food-menu-images/ham-and-potatoe-burrito.png', 
    type: 'food', 
    description: 'Breakfast burrito with scrambled eggs, ham, seasoned potatoes, cheese, and salsa verde.',
    price: '$10.99',
    category: 'Breakfast Burritos',
    features: ['Breakfast Item', 'Hearty']
  },

  // Appetizers & Shareable
  { 
    id: '12', 
    name: 'Loaded Nachos', 
    image: '/food-menu-images/loaded-nacho.png', 
    type: 'food', 
    description: 'Fresh tortilla chips loaded with cheese, beans, jalapeños, sour cream, guacamole, and your choice of meat. Perfect for sharing!',
    price: '$16.99',
    category: 'Appetizers',
    features: ['Shareable', 'Vegetarian Option']
  },
  { 
    id: '13', 
    name: 'Classic Nachos', 
    image: '/food-menu-images/nacho.png', 
    type: 'food', 
    description: 'Crispy tortilla chips topped with melted cheese, jalapeños, and salsa. Add meat or guacamole.',
    price: '$12.99',
    category: 'Appetizers',
    features: ['Classic', 'Add-ons Available']
  },
  { 
    id: '14', 
    name: 'Loaded Fries', 
    image: '/food-menu-images/loaded-fries.png', 
    type: 'food', 
    description: 'Crispy fries topped with cheese, bacon, jalapeños, sour cream, and green onions. Add carnitas or carne asada for extra protein.',
    price: '$11.99',
    category: 'Appetizers',
    features: ['Fully Loaded', 'Add Protein']
  },
  { 
    id: '15', 
    name: 'Basket of Fries', 
    image: '/food-menu-images/basket-of-fries.png', 
    type: 'food', 
    description: 'Golden crispy french fries served hot with your choice of dipping sauce.',
    price: '$6.99',
    category: 'Sides',
    features: ['Crispy', 'Choice of Sauce']
  },
  { 
    id: '16', 
    name: 'Basket of Tots', 
    image: '/food-menu-images/basket-of-tots.png', 
    type: 'food', 
    description: 'Crispy tater tots served hot with ketchup or your favorite dipping sauce.',
    price: '$7.99',
    category: 'Sides',
    features: ['Crispy', 'Popular Side']
  },
  { 
    id: '17', 
    name: 'Chips, Guac & Salsa', 
    image: '/food-menu-images/chips-guac-salsa.png', 
    type: 'food', 
    description: 'Fresh tortilla chips served with house-made guacamole and our signature salsa.',
    price: '$9.99',
    category: 'Appetizers',
    features: ['House-Made', 'Fresh Daily']
  },
  { 
    id: '18', 
    name: 'Hot Wings', 
    image: '/food-menu-images/hot-wings.png', 
    type: 'food', 
    description: 'Crispy chicken wings tossed in your choice of buffalo, BBQ, or mango habanero sauce.',
    price: '$13.99',
    category: 'Wings',
    features: ['Multiple Sauces', 'Crispy']
  },

  // Mexican Specialties
  { 
    id: '19', 
    name: 'Quesadilla', 
    image: '/food-menu-images/quesadilla.png', 
    type: 'food', 
    description: 'Large flour tortilla filled with melted cheese and your choice of meat, grilled to perfection and served with salsa and sour cream.',
    price: '$10.99',
    category: 'Mexican Classics',
    features: ['Kid Friendly', 'Customizable']
  },
  { 
    id: '20', 
    name: 'Mulitas', 
    image: '/food-menu-images/mulitas.png', 
    type: 'food', 
    description: 'Grilled tortilla sandwiches filled with cheese and your choice of meat, served crispy and golden with salsa and crema.',
    price: '$12.99',
    category: 'Mexican Classics',
    features: ['Crispy & Golden', 'Comfort Food']
  },
  { 
    id: '21', 
    name: 'Vampiros', 
    image: '/food-menu-images/vampiros.png', 
    type: 'food', 
    description: 'Crispy tortillas topped with beans, cheese, meat, lettuce, tomato, and crema. A Mexican street food favorite.',
    price: '$14.99',
    category: 'Street Food',
    features: ['Street Food Style', 'Crispy Base']
  },
  { 
    id: '22', 
    name: 'Flautas', 
    image: '/food-menu-images/flautas.png', 
    type: 'food', 
    description: 'Crispy rolled tortillas filled with chicken or beef, served with guacamole, sour cream, and salsa verde.',
    price: '$12.99',
    category: 'Mexican Classics',
    features: ['Crispy Rolled', 'Traditional']
  },
  { 
    id: '23', 
    name: 'Empanadas', 
    image: '/food-menu-images/empanadas.png', 
    type: 'food', 
    description: 'Golden pastries filled with seasoned beef, chicken, or cheese. Served with salsa for dipping.',
    price: '$8.99',
    category: 'Latin Specialties',
    features: ['Golden Pastry', 'Multiple Fillings']
  },
  { 
    id: '24', 
    name: 'Torta', 
    image: '/food-menu-images/torta.png', 
    type: 'food', 
    description: 'Mexican sandwich on toasted bread with your choice of meat, beans, lettuce, tomato, avocado, and chipotle mayo.',
    price: '$13.99',
    category: 'Sandwiches',
    features: ['Mexican Sandwich', 'Toasted Bread']
  },

  // Bowls & Healthy Options
  { 
    id: '25', 
    name: 'Hustle Bowl', 
    image: '/food-menu-images/hustle-bowl.png', 
    type: 'food', 
    description: 'Our signature bowl with rice, beans, your choice of protein, cheese, salsa, guacamole, and all the fixings.',
    price: '$13.99',
    category: 'Signature Bowls',
    features: ['Build Your Own', 'Healthy Options']
  },
  { 
    id: '26', 
    name: 'Taco Salad', 
    image: '/food-menu-images/taco-salad.png', 
    type: 'food', 
    description: 'Fresh lettuce topped with your choice of meat, beans, cheese, tomatoes, and avocado in a crispy tortilla bowl.',
    price: '$12.99',
    category: 'Salads',
    features: ['Fresh', 'Crispy Bowl']
  },

  // Breakfast All Day
  { 
    id: '27', 
    name: 'Chilaquiles', 
    image: '/food-menu-images/CHILAQUILES.PNG', 
    type: 'food', 
    description: 'Traditional Mexican breakfast with crispy tortilla chips simmered in red or green salsa, topped with cheese, crema, and your choice of protein.',
    price: '$12.99',
    category: 'Breakfast All Day',
    features: ['Traditional Recipe', 'Breakfast Favorite']
  },
  { 
    id: '28', 
    name: 'Chicken & Waffles', 
    image: '/food-menu-images/chicken-and-waffles.png', 
    type: 'food', 
    description: 'Crispy fried chicken served on golden waffles with maple syrup and butter.',
    price: '$15.99',
    category: 'Breakfast All Day',
    features: ['Southern Style', 'Sweet & Savory']
  },
  { 
    id: '29', 
    name: 'Pancakes', 
    image: '/food-menu-images/pancakes.jpg', 
    type: 'food', 
    description: 'Fluffy pancakes served with butter and maple syrup. Add blueberries or chocolate chips.',
    price: '$9.99',
    category: 'Breakfast All Day',
    features: ['Fluffy', 'Add-ons Available']
  },

  // Platters & Combos
  { 
    id: '30', 
    name: 'Pork Chop Platter', 
    image: '/food-menu-images/porkchop-platter.png', 
    type: 'food', 
    description: 'Grilled pork chop served with rice, beans, and tortillas. A hearty traditional meal.',
    price: '$17.99',
    category: 'Platters',
    features: ['Hearty Meal', 'Traditional']
  },

  // Seafood Specialties
  { 
    id: '31', 
    name: 'Mango Ceviche', 
    image: '/food-menu-images/mango-civeche.png', 
    type: 'food', 
    description: 'Fresh fish marinated in lime juice with mango, red onion, cilantro, and jalapeños. Served with tortilla chips.',
    price: '$16.99',
    category: 'Seafood',
    features: ['Fresh', 'Citrus Marinated']
  },

  // Sides
  { 
    id: '32', 
    name: 'Beans & Rice', 
    image: '/food-menu-images/beans-and-rice.png', 
    type: 'food', 
    description: 'Seasoned black beans and Mexican rice - the perfect complement to any meal.',
    price: '$5.99',
    category: 'Sides',
    features: ['Traditional', 'Perfect Side']
  },
  { 
    id: '33', 
    name: 'Black Beans', 
    image: '/food-menu-images/beans.png', 
    type: 'food', 
    description: 'Seasoned black beans cooked with onions, garlic, and Mexican spices.',
    price: '$3.99',
    category: 'Sides',
    features: ['Seasoned', 'Traditional']
  },
  { 
    id: '34', 
    name: 'Mexican Rice', 
    image: '/food-menu-images/rice.png', 
    type: 'food', 
    description: 'Fluffy rice cooked with tomatoes, onions, and spices.',
    price: '$3.99',
    category: 'Sides',
    features: ['Fluffy', 'Flavorful']
  },

  // Sauces & Extras
  { 
    id: '35', 
    name: 'Chefa Sauce', 
    image: '/food-menu-images/chefa-sauce.png', 
    type: 'food', 
    description: 'Our signature house-made sauce - a perfect blend of spices and flavor. Great on everything!',
    price: '$2.99',
    category: 'Sauces',
    features: ['House-Made', 'Signature Blend']
  },

  // Drinks
  { 
    id: '36', 
    name: 'Craft Margarita', 
    image: '/drink-menu-images/margarita-boards.png', 
    type: 'drink', 
    description: 'House-made margaritas with premium tequila, fresh lime juice, and agave nectar. Choose from classic, strawberry, or mango flavors.',
    price: '$12.99',
    category: 'Craft Cocktails',
    features: ['Made to Order', 'Multiple Flavors']
  },
  { 
    id: '37', 
    name: 'Flight Boards', 
    image: '/drink-menu-images/boards.png', 
    type: 'drink', 
    description: 'Curated tasting flights featuring craft beers, tequilas, or whiskeys. Perfect for discovering new favorites.',
    price: '$18.99',
    category: 'Tastings',
    features: ['Educational', 'Great for Groups']
  }
];

export function FoodDrinkCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerView, setItemsPerView] = useState(2);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'food' | 'drink'>('all');
  const [selectedItem, setSelectedItem] = useState<CarouselItem | null>(null);
  
  // Touch handling states
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Filter items based on active filter
  const filteredItems = carouselItems.filter(item => {
    if (activeFilter === 'all') return true;
    return item.type === activeFilter;
  });

  // Responsive items per view - showing larger items now
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setItemsPerView(1);
      } else {
        setItemsPerView(2);
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
      {/* Filter Buttons */}
      <div className="flex justify-center gap-3 mb-8">
        <button
          onClick={() => handleFilterChange('all')}
          className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-200 shadow-sm border ${
            activeFilter === 'all'
              ? 'bg-red-600 text-white border-red-600 shadow-lg transform scale-105'
              : 'bg-white text-gray-700 border-gray-200 hover:border-red-300 hover:text-red-600 hover:shadow-md'
          }`}
        >
          All Items
        </button>
        <button
          onClick={() => handleFilterChange('food')}
          className={`px-8 py-3 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 shadow-sm border ${
            activeFilter === 'food'
              ? 'bg-red-600 text-white border-red-600 shadow-lg transform scale-105'
              : 'bg-white text-gray-700 border-gray-200 hover:border-red-300 hover:text-red-600 hover:shadow-md'
          }`}
        >
          <Utensils className="h-4 w-4" />
          Food
        </button>
        <button
          onClick={() => handleFilterChange('drink')}
          className={`px-8 py-3 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 shadow-sm border ${
            activeFilter === 'drink'
              ? 'bg-red-600 text-white border-red-600 shadow-lg transform scale-105'
              : 'bg-white text-gray-700 border-gray-200 hover:border-red-300 hover:text-red-600 hover:shadow-md'
          }`}
        >
          <Wine className="h-4 w-4" />
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
              className="flex-shrink-0 px-3"
              style={{ width: `${100 / filteredItems.length}%` }}
            >
              <div 
                className="group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden"
                onClick={() => setSelectedItem(item)}
              >
                {/* Large Featured Image */}
                <div className="aspect-[4/3] relative overflow-hidden">
                  <Image 
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
                
                {/* Content Section */}
                <div className="p-4">
                  {/* Category Label */}
                  <div className="mb-2">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      {item.category}
                    </span>
                  </div>
                  
                  {/* Item Name & Price */}
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-bold text-gray-900 leading-tight">
                      {item.name}
                    </h3>
                    <span className="text-lg font-bold text-red-600 ml-3">
                      {item.price}
                    </span>
                  </div>
                  
                  {/* Description */}
                  <p className="text-gray-700 text-xs leading-relaxed mb-3 line-clamp-3">
                    {item.description}
                  </p>
                  
                  {/* Features */}
                  {item.features && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {item.features.slice(0, 2).map((feature, index) => (
                        <span key={index} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                          {feature}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {/* Type Badge */}
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 ${
                      item.type === 'food' 
                        ? 'bg-orange-100 text-orange-600' 
                        : 'bg-blue-100 text-blue-600'
                    }`}>
                      {item.type === 'food' ? <Utensils className="h-3 w-3" /> : <Wine className="h-3 w-3" />}
                      {item.type === 'food' ? 'Food' : 'Drink'}
                    </span>
                    
                    <button className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold">
                      View Details
                    </button>
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



      {/* Item Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-auto border border-white/20">
            <div className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">{selectedItem.name}</h2>
                  <p className="text-red-400 font-semibold">{selectedItem.category}</p>
                </div>
                <button 
                  onClick={() => setSelectedItem(null)}
                  className="text-white/60 hover:text-white text-xl"
                >
                  ×
                </button>
              </div>
              
              <div className="aspect-video relative rounded-xl overflow-hidden mb-3">
                <Image 
                  src={selectedItem.image}
                  alt={selectedItem.name}
                  fill
                  className="object-cover"
                />
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold text-white">{selectedItem.price}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 ${
                    selectedItem.type === 'food' 
                      ? 'bg-red-600 text-white' 
                      : 'bg-blue-600 text-white'
                  }`}>
                    {selectedItem.type === 'food' ? <Utensils className="h-4 w-4" /> : <Wine className="h-4 w-4" />}
                    {selectedItem.type === 'food' ? 'Food Item' : 'Beverage'}
                  </span>
                </div>
                
                <p className="text-sm text-white/90 leading-relaxed">{selectedItem.description}</p>
                
                {selectedItem.features && (
                  <div>
                    <h4 className="text-sm text-white font-semibold mb-2">Features:</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedItem.features.map((feature, index) => (
                        <span key={index} className="px-2 py-0.5 bg-white/10 backdrop-blur-sm rounded-full text-xs text-white/90">
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex gap-2 pt-3">
                  <button className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg text-sm font-semibold transition-colors">
                    View Full Menu
                  </button>
                  <button className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2 px-4 rounded-lg text-sm font-semibold transition-colors backdrop-blur-sm border border-white/20">
                    Order Online
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}