// components/menu/FoodMenu.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Plus, ImageOff } from 'lucide-react';

// Static food menu data from the provided JSON structure
const FOOD_CATEGORIES = [
  {
    category_id: "34b8fc44-924a-4724-8b80-ece082a52bd0",
    name: "Small Bites",
    display_order: 1,
    icon: "🍟",
    color: "bg-yellow-500",
    items: [
      {
        id: "444b974d-6577-4bc7-8546-4bc320008f1a",
        name: "Basket of Fries",
        description: "",
        price: 7.00,
        has_sauce_options: true,
        max_sauce_selections: 2
      },
      {
        id: "8608c1d9-6e8a-45da-af90-9b85b963d98c",
        name: "Basket of Tots",
        description: "",
        price: 7.00,
        has_sauce_options: true,
        max_sauce_selections: 2
      },
      {
        id: "1ab9036c-4cdb-43a3-bb86-3a825ea0fa9c",
        name: "Chips & Guac",
        description: "",
        price: 8.00
      },
      {
        id: "64bc052f-9d4c-4f6d-bf63-22c524acb6fe",
        name: "Nachos",
        description: "Crispy tortilla chips with melted cheese, jalapeños, and toppings",
        price: 8.99,
        has_sauce_options: true,
        max_sauce_selections: 2
      },
      {
        id: "2b1bdfcd-8339-47e0-bd94-ca415e21045d",
        name: "Guacamole & Chips",
        description: "Fresh guacamole made to order with warm tortilla chips",
        price: 7.99
      },
      {
        id: "ca282f42-4fe5-45b2-94e3-14585ed6f56b",
        name: "Street Corn",
        description: "Grilled corn with mayo, cotija cheese, chili powder, and lime",
        price: 5.99
      }
    ]
  },
  {
    category_id: "eac5cd6b-cb6a-4e6f-b7e0-5d926830a7bf",
    name: "Main",
    display_order: 2,
    icon: "🍽️",
    color: "bg-green-500",
    items: [
      {
        id: "d9205b03-4c49-4fcb-b26a-527e7e4befcd",
        name: "Burrito",
        description: "Flour tortillas beans rice cilantro onions guac sauce chipotle, tortilla chips choice of meat",
        price: 12.00,
        requires_meat_choice: true,
        has_sauce_options: true,
        max_sauce_selections: 3
      },
      {
        id: "52d00832-dda3-4043-ad82-25a6d0ff8f89",
        name: "Flautas (4)",
        description: "Potatoes and Carnitas",
        price: 10.00,
        has_sauce_options: true,
        max_sauce_selections: 3
      },
      {
        id: "1e3afba4-0dcf-482a-b3fb-6b2badb8e72b",
        name: "Loaded Fries",
        description: "Nacho Cheese, pico, jalapinos, Guac sauce, chipotle, cotija, sour cream, Choice of Meat (Half order $11.00)",
        price: 19.00,
        requires_meat_choice: true,
        has_sauce_options: true,
        max_sauce_selections: 3
      },
      {
        id: "41290150-a1ad-4185-aab3-3191cf0883e2",
        name: "Loaded Nacho",
        description: "Nacho Cheese, pico, jalapinos, Guac sauce, chipotle, cotija, sour cream, Choice of Meat (Half order $11.00)",
        price: 19.00,
        requires_meat_choice: true,
        has_sauce_options: true,
        max_sauce_selections: 3
      },
      {
        id: "68a31974-4297-434e-983f-661e72775d39",
        name: "Mulita",
        description: "Two grilled corn tortillas, cheese in the middle, onions cilantro, choice of meat",
        price: 5.50,
        requires_meat_choice: true,
        has_sauce_options: true,
        max_sauce_selections: 3
      },
      {
        id: "b12839a5-0510-41a6-ae1a-ec66026e9ad2",
        name: "Quesadilla",
        description: "Flour tortilla, oaxaca, cheese, cilantro, choice of meat",
        price: 11.00,
        requires_meat_choice: true,
        has_sauce_options: true,
        max_sauce_selections: 3
      },
      {
        id: "34471329-1a1e-4454-b381-03f496ff1075",
        name: "Tacos",
        description: "Gluten free corn tortilla, onions, cilantro, choice of meat",
        price: 3.75,
        requires_meat_choice: true,
        has_sauce_options: true,
        max_sauce_selections: 3
      },
      {
        id: "1a4043d6-3bd4-4c50-901a-587ca3858195",
        name: "Torta",
        description: "Milanesa, beans, queso, oaxaca, lettuce, tomato, chipotle, pickled, jalapenos, choice of meat",
        price: 11.50,
        requires_meat_choice: true,
        has_sauce_options: true,
        max_sauce_selections: 3
      },
      {
        id: "28fb0a32-f9d8-4a4e-9996-45df0652fbca",
        name: "Hustle Bowl",
        description: "Beans, rice, lettuce, pico, jalapeños, sour cream, guac sauce, cotija, tortilla chips, choice of meat",
        price: 15.00,
        requires_meat_choice: true,
        has_sauce_options: true,
        max_sauce_selections: 3
      },
      {
        id: "9409353d-28a5-4a23-a080-a24f15d5c72a",
        name: "Taco Salad",
        description: "Flour tortilla, lettuce, rice, cilantro, sour cream, cotija, choice of meat",
        price: 14.00,
        requires_meat_choice: true,
        has_sauce_options: true,
        max_sauce_selections: 3
      },
      {
        id: "afa42185-f1eb-4e4f-b64b-31fd2bc35104",
        name: "Empanadas",
        description: "Fried flour, queso oaxaca, sour cream, guac sauce, lettuce, choice of meat",
        price: 7.00,
        requires_meat_choice: true,
        has_sauce_options: true,
        max_sauce_selections: 3
      }
    ]
  },
  {
    category_id: "8e5d693c-6ea8-4a70-9e0f-78e0cc40173e",
    name: "Birria",
    display_order: 4,
    icon: "🍖",
    color: "bg-orange-500",
    items: [
      {
        id: "471c370e-12cf-40d7-8c7d-e43e605cedd2",
        name: "Birria Loaded Fries",
        description: "Cheese sauce and mozzarella cheese",
        price: 22.00,
        has_sauce_options: true,
        max_sauce_selections: 3
      },
      {
        id: "b4efbc96-6406-4d3c-b69e-3256368a5350",
        name: "Birria Pizza",
        description: "Pizza dough 8in, pizza sauce, and mozzarella cheese",
        price: 20.00,
        has_sauce_options: true,
        max_sauce_selections: 3
      },
      {
        id: "d218caef-eaa4-415c-b092-3c52fc5c7899",
        name: "Birria Queso Tacos",
        description: "3 queso birria tacos Queso oaxaca onions cilantro (ALL BIRRIA ITEMS COME WITH CONSUME)",
        price: 16.75,
        has_sauce_options: true,
        max_sauce_selections: 3
      },
      {
        id: "a115ee3d-974c-4060-a5fa-9ce81cfc7380",
        name: "Birria Ramen",
        description: "Two packs of ramen onions cilantro cheese",
        price: 17.00,
        has_sauce_options: true,
        max_sauce_selections: 3
      }
    ]
  },
  {
    category_id: "1e7c470d-abd1-4ba0-b55b-df02b18098d0",
    name: "Sea Food",
    display_order: 5,
    icon: "🦐",
    color: "bg-blue-500",
    items: [
      {
        id: "59b3e76e-d07c-4665-9f7f-38acec659376",
        name: "Aguachile Tostada",
        description: "Cilantro, onions, tomato, lime, avocado",
        price: 6.50,
        has_sauce_options: true,
        max_sauce_selections: 2
      },
      {
        id: "d2300275-047a-450c-8707-154059e2f5b8",
        name: "Caldo de Camaron",
        description: "",
        price: 17.00,
        has_sauce_options: true,
        max_sauce_selections: 2
      },
      {
        id: "c5eaa8ae-efb7-423a-8e92-9a9de5feb017",
        name: "Caldo de Pescado",
        description: "",
        price: 17.00,
        has_sauce_options: true,
        max_sauce_selections: 2
      },
      {
        id: "d5fb893a-17c1-4776-83c1-2110c77cb9d6",
        name: "Ceviche Tostada",
        description: "Cilantro, onions, tomato, lime, avocado",
        price: 6.00,
        has_sauce_options: true,
        max_sauce_selections: 2
      },
      {
        id: "bf80efe1-d189-4249-9a1d-01d19467f2ca",
        name: "Fried Fish Tacos (2)",
        description: "Onions cabbage Chipotle cheese corn tortilla",
        price: 8.75,
        has_sauce_options: true,
        max_sauce_selections: 2
      },
      {
        id: "fb8f3628-37db-47cd-b579-90cb93ff2b8b",
        name: "Fried Fish Torta",
        description: "Lettuce, pico, chipotle cheese",
        price: 12.75,
        has_sauce_options: true,
        max_sauce_selections: 2
      },
      {
        id: "f070edbd-208e-4dba-8b2e-961ca9a32b02",
        name: "Pescado Frito",
        description: "Deep fried whole tilapia, salad, rice",
        price: 15.00,
        has_sauce_options: true,
        max_sauce_selections: 2
      },
      {
        id: "9f707831-d6b3-4298-b29d-69fa85d2074d",
        name: "Sopa de Mariscos",
        description: "",
        price: 20.00,
        has_sauce_options: true,
        max_sauce_selections: 2
      }
    ]
  },
  {
    category_id: "dbccf811-00b0-4640-9855-ebe1942161b5",
    name: "Wings",
    display_order: 6,
    icon: "🍗",
    color: "bg-purple-500",
    items: [
      {
        id: "3e129750-a5c0-4cd9-b97e-c3a481a0301c",
        name: "Wings",
        description: "10 wings - Any sauce and seasoning",
        price: 16.00,
        has_wing_sauce_options: true,
        max_sauce_selections: 3,
        sauce_type: "wing"
      }
    ]
  },
  {
    category_id: "44c8ab1d-9ee9-4b6c-bdd6-26e2789a83d6",
    name: "Chefa Sauce",
    display_order: 7,
    icon: "🌶️",
    color: "bg-red-600",
    items: [
      {
        id: "8f07021d-a09a-48b5-a947-f0d547d33adf",
        name: "Chefa Sauce Bottle",
        description: "Take home bottle of our signature sauce",
        price: 8.00
      }
    ]
  },
  {
    category_id: "1d2176a1-7961-46ee-8e48-5b1ec34b89de",
    name: "Breakfast",
    display_order: 8,
    icon: "🍳",
    color: "bg-amber-500",
    items: [
      {
        id: "6c420849-f870-47ac-a9fe-262fa82dad0a",
        name: "Asada & Bacon",
        description: "Flour tortilla, asada bacon, tots, sour cream, guac sauce",
        price: 13.00,
        has_sauce_options: true,
        max_sauce_selections: 3
      },
      {
        id: "3f5d2d55-c738-44df-b44a-ab88eb3f3e24",
        name: "Chilaquiles",
        description: "Tortilla chips, green or red salsa, two eggs onions, sour cream, cheese choice of meat",
        price: 13.00,
        requires_meat_choice: true,
        has_sauce_options: true,
        max_sauce_selections: 3,
        salsa_choice: ["Green Salsa", "Red Salsa"]
      },
      {
        id: "b58b124d-1754-4d07-ae93-4c6890b102da",
        name: "French Toast",
        description: "Three slices of French toast, two eggs choice of meat",
        price: 13.00,
        requires_meat_choice: true,
        has_sauce_options: true,
        max_sauce_selections: 3
      },
      {
        id: "9ad1af8b-bfcc-40ac-8904-10988f593077",
        name: "Ham & Bacon",
        description: "Flour tortilla, ham, bacon, egg, tots, beans, sour cream, guac sauce",
        price: 12.00,
        has_sauce_options: true,
        max_sauce_selections: 3
      },
      {
        id: "36a73f04-9a91-45bd-947e-34b19fd0aa68",
        name: "Pancakes",
        description: "Two pancakes, two eggs, choice of meat",
        price: 12.00,
        requires_meat_choice: true,
        has_sauce_options: true,
        max_sauce_selections: 3
      }
    ]
  },
  {
    category_id: "c799fdab-9cb7-42c3-8724-8eb5fa98570f",
    name: "Specials",
    display_order: 9,
    icon: "⭐",
    color: "bg-indigo-500",
    items: [
      {
        id: "1b439da7-b0d7-4d54-94ec-5f08cad5903f",
        name: "3 Tacos Beans and Rice",
        description: "",
        price: 15.00,
        requires_meat_choice: true,
        has_sauce_options: true,
        max_sauce_selections: 3
      },
      {
        id: "c9037bf3-ea38-4342-a021-da7818cf7166",
        name: "Enchiladas (3) Beans and Rice",
        description: "",
        price: 15.00,
        requires_meat_choice: true,
        has_sauce_options: true,
        max_sauce_selections: 3,
        salsa_choice: ["Green Salsa", "Red Salsa"]
      },
      {
        id: "5705d7b7-ad15-41a7-baf1-46ade7d465db",
        name: "Flautas (3) Beans and Rice",
        description: "",
        price: 13.00,
        requires_meat_choice: true,
        has_sauce_options: true,
        max_sauce_selections: 3
      },
      {
        id: "ac04e18b-8a46-4b4c-914d-f80cbc4d3313",
        name: "Quesadilla Beans and Rice",
        description: "",
        price: 15.00,
        requires_meat_choice: true,
        has_sauce_options: true,
        max_sauce_selections: 3
      },
      {
        id: "17ffff1b-40d3-4089-87f0-e181384e56f7",
        name: "Wet Burrito",
        description: "Red or green salsa",
        price: 17.00,
        requires_meat_choice: true,
        has_sauce_options: true,
        max_sauce_selections: 3,
        salsa_choice: ["Red Salsa", "Green Salsa"]
      }
    ]
  }
];

// Available modifiers from the provided data
const MEAT_CHOICES = [
  { name: "ASADA (BEEF)", price_adjustment: 0.00, display_order: 1 },
  { name: "BIRRIA (BEEF)", price_adjustment: 0.00, display_order: 2 },
  { name: "AL PASTOR (PORK)", price_adjustment: 0.00, display_order: 3 },
  { name: "CARNITAS (PORK)", price_adjustment: 0.00, display_order: 4 },
  { name: "CHORIZO (PORK)", price_adjustment: 0.00, display_order: 5 },
  { name: "POLLO (CHICKEN)", price_adjustment: 0.00, display_order: 6 },
  { name: "VEGGIES", price_adjustment: 0.00, display_order: 7 },
  { name: "LENGUA", price_adjustment: 2.00, display_order: 8 },
  { name: "SHRIMP", price_adjustment: 2.00, display_order: 9 }
];

const CHEF_SAUCES = [
  { name: "Guac", price_adjustment: 0.00, display_order: 1 },
  { name: "Tomatillo", price_adjustment: 0.00, display_order: 2 },
  { name: "Ranchero", price_adjustment: 0.00, display_order: 3 },
  { name: "Chile-De-Arbol", price_adjustment: 0.00, display_order: 4 },
  { name: "Habanero", price_adjustment: 0.00, display_order: 5 }
];

const WING_SAUCES = [
  { name: "Korean BBQ", price_adjustment: 0.00, display_order: 20 },
  { name: "Mango Habanero", price_adjustment: 0.00, display_order: 21 },
  { name: "Sweet Teriyaki", price_adjustment: 0.00, display_order: 22 },
  { name: "Garlic Buffalo", price_adjustment: 0.00, display_order: 23 },
  { name: "Buffalo", price_adjustment: 0.00, display_order: 24 },
  { name: "Garlic Parmesan", price_adjustment: 0.00, display_order: 25 },
  { name: "BBQ", price_adjustment: 0.00, display_order: 26 }
];

interface FoodItem {
  id: string;
  name: string;
  description: string;
  price: number;
  requires_meat_choice?: boolean;
  has_sauce_options?: boolean;
  has_wing_sauce_options?: boolean;
  max_sauce_selections?: number;
  sauce_type?: string;
  salsa_choice?: string[];
}

export default function FoodMenu() {
  const [activeCategory, setActiveCategory] = useState<string>(FOOD_CATEGORIES[0].category_id);
  const [selectedItem, setSelectedItem] = useState<FoodItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMeat, setSelectedMeat] = useState<string>('');
  const [selectedSauces, setSelectedSauces] = useState<string[]>([]);
  const [selectedSalsa, setSelectedSalsa] = useState<string>('');

  const handleItemSelect = (item: FoodItem) => {
    setSelectedItem(item);
    setSelectedMeat('');
    setSelectedSauces([]);
    setSelectedSalsa('');
    setModalOpen(true);
  };

  const handleMeatChange = (meat: string) => {
    setSelectedMeat(meat);
  };

  const handleSauceChange = (sauce: string, checked: boolean) => {
    if (checked) {
      if (selectedSauces.length < (selectedItem?.max_sauce_selections || 3)) {
        setSelectedSauces([...selectedSauces, sauce]);
      }
    } else {
      setSelectedSauces(selectedSauces.filter(s => s !== sauce));
    }
  };

  const handleSalsaChange = (salsa: string) => {
    setSelectedSalsa(salsa);
  };

  const calculateTotalPrice = () => {
    if (!selectedItem) return 0;
    
    let total = selectedItem.price;
    
    // Add meat price adjustment for premium meats
    if (selectedMeat === 'LENGUA' || selectedMeat === 'SHRIMP') {
      total += 2.00;
    }
    
    return total;
  };

  const canAddToCart = () => {
    if (!selectedItem) return false;
    
    // Must select meat if required
    if (selectedItem.requires_meat_choice && !selectedMeat) {
      return false;
    }
    
    // Must select salsa if required
    if (selectedItem.salsa_choice && !selectedSalsa) {
      return false;
    }
    
    // Wings must have at least 1 sauce
    if (selectedItem.has_wing_sauce_options && selectedSauces.length === 0) {
      return false;
    }
    
    return true;
  };

  const handleAddToCart = () => {
    if (!selectedItem || !canAddToCart()) return;
    
    const orderData = {
      item: selectedItem,
      meat: selectedMeat,
      sauces: selectedSauces,
      salsa: selectedSalsa,
      totalPrice: calculateTotalPrice()
    };
    
    console.log('Adding food to cart:', orderData);
    setModalOpen(false);
  };

  const activeCategoryData = FOOD_CATEGORIES.find(cat => cat.category_id === activeCategory);

  return (
    <div className="space-y-6">
      {/* Category Navigation */}
      <div className="flex flex-wrap gap-2 justify-center">
        {FOOD_CATEGORIES.map(category => (
          <Button
            key={category.category_id}
            variant={activeCategory === category.category_id ? 'default' : 'outline'}
            onClick={() => setActiveCategory(category.category_id)}
            className="flex items-center gap-2"
          >
            <span>{category.icon}</span>
            {category.name}
            <Badge variant="secondary" className="ml-1">
              {category.items.length}
            </Badge>
          </Button>
        ))}
      </div>

      {/* Active Category */}
      {activeCategoryData && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">{activeCategoryData.icon}</span>
            <h2 className="text-2xl font-semibold">{activeCategoryData.name}</h2>
            <Badge variant="secondary">
              {activeCategoryData.items.length} items
            </Badge>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {activeCategoryData.items.map(item => {
              const foodItem = item as FoodItem;
              return (
                <Card key={foodItem.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="relative h-32 bg-muted flex items-center justify-center rounded-lg overflow-hidden mb-2">
                      <ImageOff className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <CardTitle className="text-lg">{foodItem.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {foodItem.description}
                    </p>
                    
                    {/* Item badges */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {foodItem.requires_meat_choice && (
                        <Badge variant="outline" className="text-xs">Choice of Meat</Badge>
                      )}
                      {foodItem.has_sauce_options && (
                        <Badge variant="outline" className="text-xs">Chef Sauces</Badge>
                      )}
                      {foodItem.has_wing_sauce_options && (
                        <Badge variant="outline" className="text-xs">Wing Sauces</Badge>
                      )}
                      {foodItem.salsa_choice && (
                        <Badge variant="outline" className="text-xs">Salsa Choice</Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-semibold">
                        ${foodItem.price.toFixed(2)}
                      </span>
                      <Button onClick={() => handleItemSelect(foodItem)} size="sm">
                        <Plus className="w-4 h-4 mr-1" />
                        Add to Cart
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Selection Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedItem?.name}</DialogTitle>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-4">
              {/* Item Image */}
              <div className="relative h-32 bg-muted flex items-center justify-center rounded-lg overflow-hidden">
                <ImageOff className="w-8 h-8 text-muted-foreground" />
              </div>

              {/* Item Description */}
              <p className="text-sm text-muted-foreground">{selectedItem.description}</p>

              {/* Base Price */}
              <div className="flex justify-between items-center">
                <span className="font-medium">Base Price:</span>
                <Badge variant="secondary">${selectedItem.price.toFixed(2)}</Badge>
              </div>

              {/* Meat Selection */}
              {selectedItem.requires_meat_choice && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Label className="text-base font-semibold">Choose Meat</Label>
                    <Badge variant="destructive" className="text-xs">Required</Badge>
                  </div>
                  
                  <RadioGroup value={selectedMeat} onValueChange={handleMeatChange}>
                    {MEAT_CHOICES.map(meat => (
                      <div key={meat.name} className="flex items-center space-x-2">
                        <RadioGroupItem value={meat.name} id={meat.name} />
                        <Label
                          htmlFor={meat.name}
                          className="flex-1 cursor-pointer flex justify-between items-center"
                        >
                          <span>{meat.name}</span>
                          {meat.price_adjustment > 0 && (
                            <span className="text-muted-foreground font-medium">
                              +${meat.price_adjustment.toFixed(2)}
                            </span>
                          )}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                  
                  {!selectedMeat && (
                    <p className="text-sm text-destructive">Please select a meat option</p>
                  )}
                </div>
              )}

              {/* Salsa Choice */}
              {selectedItem.salsa_choice && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Label className="text-base font-semibold">Choose Salsa</Label>
                    <Badge variant="destructive" className="text-xs">Required</Badge>
                  </div>
                  
                  <RadioGroup value={selectedSalsa} onValueChange={handleSalsaChange}>
                    {selectedItem.salsa_choice.map(salsa => (
                      <div key={salsa} className="flex items-center space-x-2">
                        <RadioGroupItem value={salsa} id={salsa} />
                        <Label htmlFor={salsa} className="cursor-pointer">
                          {salsa}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                  
                  {!selectedSalsa && (
                    <p className="text-sm text-destructive">Please select a salsa option</p>
                  )}
                </div>
              )}

              {/* Sauce Selection */}
              {(selectedItem.has_sauce_options || selectedItem.has_wing_sauce_options) && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Label className="text-base font-semibold">
                      {selectedItem.has_wing_sauce_options ? 'Choose Wing Sauces' : 'Choose Chef Sauces'}
                    </Label>
                    <Badge variant={selectedItem.has_wing_sauce_options ? "destructive" : "secondary"} className="text-xs">
                      {selectedItem.has_wing_sauce_options 
                        ? `Required - Select 1-${selectedItem.max_sauce_selections || 3}` 
                        : `Optional - Select up to ${selectedItem.max_sauce_selections || 3}`
                      }
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    {(selectedItem.has_wing_sauce_options ? WING_SAUCES : CHEF_SAUCES).map(sauce => (
                      <div key={sauce.name} className="flex items-center space-x-2">
                        <Checkbox
                          id={sauce.name}
                          checked={selectedSauces.includes(sauce.name)}
                          onCheckedChange={(checked) => handleSauceChange(sauce.name, checked as boolean)}
                          disabled={!selectedSauces.includes(sauce.name) && selectedSauces.length >= (selectedItem.max_sauce_selections || 3)}
                        />
                        <Label
                          htmlFor={sauce.name}
                          className="flex-1 cursor-pointer flex justify-between items-center"
                        >
                          <span>{sauce.name}</span>
                          {sauce.price_adjustment > 0 && (
                            <span className="text-muted-foreground">
                              +${sauce.price_adjustment.toFixed(2)}
                            </span>
                          )}
                        </Label>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>{selectedSauces.length}/{selectedItem.max_sauce_selections || 3} sauces selected</span>
                    {selectedSauces.length === (selectedItem.max_sauce_selections || 3) && (
                      <span className="text-amber-600">Maximum reached</span>
                    )}
                  </div>
                </div>
              )}

              {/* Total Price */}
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-lg font-semibold">Total Price:</span>
                <Badge variant="default" className="text-lg">
                  ${calculateTotalPrice().toFixed(2)}
                </Badge>
              </div>

              {/* Add to Cart Button */}
              <Button 
                onClick={handleAddToCart} 
                className="w-full"
                disabled={!canAddToCart()}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add to Cart - ${calculateTotalPrice().toFixed(2)}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
