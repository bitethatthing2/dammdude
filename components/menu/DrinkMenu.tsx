// components/menu/DrinkMenu.tsx
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

// Static drink menu data
const DRINK_CATEGORIES = [
  {
    category_id: "cb63e9a8-a203-4ec8-8b23-738760d75668",
    name: "Boards",
    display_order: 10,
    icon: "🍾",
    color: "bg-pink-500",
    items: [
      {
        id: "c2790bd9-dda2-4f25-b106-627904b37193",
        name: "Margarita Board",
        description: "Hornitos, Combier, Lime Juice, Fresh Fruit - Pineapple, Mango, Coconut, and Watermelon",
        price: 35.00
      },
      {
        id: "3a5bd992-1f3a-4d21-ac8a-c5af5be32984",
        name: "Mimosa Board",
        description: "Brut Champagne - CHOOSE TWO: Orange Juice, Cranberry Juice, Pineapple Juice",
        price: 19.00,
        choices: ["Orange Juice", "Cranberry Juice", "Pineapple Juice"],
        selection_rule: "Choose 2"
      }
    ]
  },
  {
    category_id: "2347aadc-88eb-4a09-8b44-6d1ca002b906",
    name: "Flights",
    display_order: 11,
    icon: "🥃",
    color: "bg-yellow-600",
    items: [
      {
        id: "e5e202ac-a168-4c87-98dd-11c219da095d",
        name: "Patron Flight",
        description: "Patron, Fresh lime juice, and Combier - CHOOSE FOUR: Strawberry, Watermelon, Mango, Peach, Passion Fruit, Raspberry, Prickly Pear, Pineapple, Guava, Kiwi, Blackberry, Coconut",
        price: 35.00,
        choices: ["Strawberry", "Watermelon", "Mango", "Peach", "Passion Fruit", "Raspberry", "Prickly Pear", "Pineapple", "Guava", "Kiwi", "Blackberry", "Coconut"],
        selection_rule: "Choose 4"
      }
    ]
  },
  {
    category_id: "e35263d0-61fa-450d-a409-957e9333862a",
    name: "Towers",
    display_order: 12,
    icon: "🍺",
    color: "bg-amber-600",
    items: [
      {
        id: "e663d30f-693e-4ad6-a88e-15c857b373de",
        name: "Beer Tower",
        description: "CHOOSE BEER: COORS, MODELO, NEGRA MODELO, CORONA, PACIFICO, HEFE, and CIDERS",
        price: 27.00,
        choices: ["COORS", "MODELO", "NEGRA MODELO", "CORONA", "PACIFICO", "HEFE", "CIDERS"],
        selection_rule: "Choose 1"
      },
      {
        id: "4f336f03-a3f2-4a5b-92ee-8dfe74e1a312",
        name: "Hustle Margarita Tower",
        description: "88 OZ - Hornitos, Combier, Fresh Lime Juice, Blue Agave, and Salt",
        price: 50.00
      },
      {
        id: "5a0eb245-aba2-4e60-8263-329af62c8323",
        name: "Texas Margarita Tower",
        description: "88 OZ - Patron, Fresh Lime Juice, Orange Juice, Combier, and Salt",
        price: 65.00
      }
    ]
  },
  {
    category_id: "c7bbc300-e9e0-47ad-80ae-d9ff39723762",
    name: "House Favorites",
    display_order: 13,
    icon: "🍹",
    color: "bg-teal-500",
    items: [
      {
        id: "d5e0faaf-3bfb-4929-9328-a42ade10c563",
        name: "Bloody Mary",
        description: "Tito's, Bloody Mary Mix, Pickles, Banana Peppers, Olives, and Spices",
        price: 12.00
      },
      {
        id: "c896f0fa-6879-4119-9ed4-e5f08f194d0b",
        name: "Cantarito",
        description: "Herradura Blanco, Orange, Lime, and Salt",
        price: 12.00
      },
      {
        id: "0c2c4b16-9433-456d-8692-6eb9d17c5c5d",
        name: "Coconut Berry Dream",
        description: "Vanilla Vodka, Huckleberry, Coconut, and Pineapple",
        price: 12.00
      },
      {
        id: "ddf9f53a-4499-42d6-8b13-f662b9b76c1e",
        name: "Iced Doña 70",
        description: "Don 70, Strawberry Syrup, Peach Syrup, Lime Juice",
        price: 22.00
      },
      {
        id: "cfe37075-5640-4d7d-8edd-f7e73a1b19e6",
        name: "Iced Margatira",
        description: "Don Julio Blanco, Mango, Lime Juice, Chamoy, and Tajin",
        price: 17.00
      },
      {
        id: "3bb2be35-f454-4350-8eb2-6624103ad2a0",
        name: "Iced Pina Colada",
        description: "Captain Morgan, Coconut Syrup, and Coconut Milk",
        price: 15.00
      },
      {
        id: "15d30807-0e84-4ede-8892-eed25718b7cf",
        name: "Mango Tamarindo",
        description: "Spicy Tamarindo, Mango, and Pineapple",
        price: 12.50
      },
      {
        id: "eb05348e-fc25-401e-b37b-d43f4ab776b4",
        name: "Michelada",
        description: "Beer, Michelada Mix, and Fresh Lime",
        price: 12.00
      },
      {
        id: "615cfe7c-1cf9-49a8-9502-0e9868c350dd",
        name: "Paloma",
        description: "Cazadores, Orange, Grape Fruit Juice, Lime, and Salt",
        price: 11.00
      },
      {
        id: "1f012fac-9fae-473b-97cc-ff6a219e898c",
        name: "Peachy Beachy",
        description: "Tito's, Champaign, and Peach syrup",
        price: 12.00
      },
      {
        id: "8677d4dd-199d-4c94-a248-ecbc0a7cf2e7",
        name: "Pineapple Paradise",
        description: "Grey Goose, Passion Fruit, and Pineapple",
        price: 11.00
      }
    ]
  },
  {
    category_id: "22c5ba8b-cb6d-4136-abc3-1cb654d10425",
    name: "Martinis",
    display_order: 14,
    icon: "🍸",
    color: "bg-gray-600",
    items: [
      {
        id: "0250265c-9fc5-49d7-a9ee-ecb11ef7a137",
        name: "Classic Martini",
        description: "Gin, Vermouth, and Olive",
        price: 11.00
      },
      {
        id: "58e6ffa9-d6eb-4f58-90bf-43f89c03a60e",
        name: "Espresso Martini",
        description: "Espresso Shot and Kahlua",
        price: 11.00
      },
      {
        id: "13264c58-f5a8-424f-ae44-8df44a7f23b3",
        name: "Fresh Lemon Drop",
        description: "Fresh Lemon Juice, Syrup, and Grey Goose",
        price: 11.00
      },
      {
        id: "d4835680-395e-4ee4-9dd6-8ec136dd7b44",
        name: "Lechera Espresso",
        description: "Kahlua, Bay Leaves, Condensed Milk, and Espresso Shot",
        price: 12.00
      },
      {
        id: "07a44939-9f3d-4999-aee0-c1b007a41ec6",
        name: "Passion Fruit Drop",
        description: "Fresh Lemon Juice, Black Berry Syrup, and Grey Goose",
        price: 12.00
      }
    ]
  },
  {
    category_id: "ff366d10-033f-4fee-82e6-1c18ac48ee1c",
    name: "Margaritas",
    display_order: 15,
    icon: "🍹",
    color: "bg-lime-500",
    items: [
      {
        id: "daa9e8b0-31e4-4007-87bb-8ad9d2bbe342",
        name: "Hustle Margarita",
        description: "Hornitos, Fresh Lime Juice, and Blue Guava - FLAVORS: Strawberry, Watermelon, Mango, Peach, Passion Fruit, Raspberry, Prickly Pear, Pineapple, Guava, Kiwi, Black Berry, and Coconut",
        price: 15.00,
        flavor_choices: ["Strawberry", "Watermelon", "Mango", "Peach", "Passion Fruit", "Raspberry", "Prickly Pear", "Pineapple", "Guava", "Kiwi", "Black Berry", "Coconut"]
      },
      {
        id: "28a54587-372b-4f6d-9f12-bdf6da8c3e8b",
        name: "Skinny Margarita",
        description: "Luna Azul and Fresh Lime Juice",
        price: 14.00
      },
      {
        id: "7c8e27a9-1261-4dd9-9b6a-96d391c731e1",
        name: "Spicy Margarita",
        description: "818, Fresh Lime Juice, Blue Guava, and Infused Jalapenos",
        price: 14.00
      }
    ]
  },
  {
    category_id: "866ecd50-33ce-4fba-aa6d-44eb5dc92436",
    name: "Malibu Buckets",
    display_order: 16,
    icon: "🥥",
    color: "bg-cyan-500",
    items: [
      {
        id: "54cfe6de-dcb0-4411-b2fa-8a5b968ed8e7",
        name: "Cinnamon Horchata",
        description: "Malibu, Horchata, Sprite, and Cinnamon",
        price: 15.00
      },
      {
        id: "c4ba289b-0bee-4167-946c-8aeb77503275",
        name: "Juicy Malibu",
        description: "Malibu, Watermelon Syrup, Pineapple Juice, and Watermelon Redbull",
        price: 18.00
      },
      {
        id: "c7e204d6-4a10-40ab-8703-c4c081dc59f9",
        name: "Malibu Guava",
        description: "Malibu, Guava Syrup, and Pineapple Juice",
        price: 15.00
      },
      {
        id: "07139c8d-74e8-4719-8fde-a22cabc7ff50",
        name: "Tropical Malibu",
        description: "Malibu, Passion Fruit Syrup, Orange Juice, and Pineapple Juice",
        price: 15.00
      }
    ]
  },
  {
    category_id: "68e1c223-bafb-4355-9659-8d94cbfbee78",
    name: "Refreshers",
    display_order: 17,
    icon: "🌿",
    color: "bg-green-600",
    items: [
      {
        id: "fbd5dfe2-272a-438b-89b4-aab53d19c794",
        name: "Mojito",
        description: "Bacardi or Hornitos - Lime, Mint, Syrup, and Soda Water",
        price: 10.00
      },
      {
        id: "0196e7fe-a6af-4bac-99c4-6f9bd6593c9b",
        name: "Mosco Mulle",
        description: "House Vodka, Ginger Bear, Mint, and Lime",
        price: 11.00
      }
    ]
  },
  {
    category_id: "b9d32990-9466-4341-ad11-d3a56fb17004",
    name: "Bottle Beer",
    display_order: 18,
    icon: "🍺",
    color: "bg-yellow-700",
    items: [
      {
        id: "7c9921b7-0695-4d51-8a8b-13f0f5025641",
        name: "Corona",
        description: "",
        price: 0.00
      },
      {
        id: "94fd1043-2927-4af8-9e52-b6afbf888af9",
        name: "Dos Equis",
        description: "",
        price: 0.00
      },
      {
        id: "d19fb788-b0eb-437c-8570-d8b99eb138a7",
        name: "Modelo",
        description: "",
        price: 0.00
      },
      {
        id: "e670b145-418b-4c63-956a-730856962477",
        name: "Negra Modelo",
        description: "",
        price: 0.00
      },
      {
        id: "b60a6909-c919-43cb-888d-cd9d6d3f109e",
        name: "Pacifico",
        description: "",
        price: 0.00
      },
      {
        id: "d92da372-2e24-40ac-b17e-51948904b746",
        name: "White Claw",
        description: "",
        price: 0.00
      }
    ]
  },
  {
    category_id: "e623b0e6-b00b-4664-be48-86d5d7478d12",
    name: "Wine",
    display_order: 19,
    icon: "🍷",
    color: "bg-red-700",
    items: [
      {
        id: "d69dd808-08dc-4ece-a834-6c84fcd74204",
        name: "Domaine Saint Vincent",
        description: "Sparkling Brut",
        price: 0.00
      },
      {
        id: "66de5be9-9d60-46d9-845c-35c4dd03020c",
        name: "Lindeman",
        description: "Moscato",
        price: 0.00
      },
      {
        id: "b8d544b4-5aaf-4e89-9e5d-b5f7ad13042e",
        name: "SeaGlass",
        description: "Chardonnay, Riesling",
        price: 0.00
      },
      {
        id: "73b66ded-65ea-45bb-ac85-05d28e39224e",
        name: "Sutter Home",
        description: "Cabernet Sauvignon, Pinot Grigio, Merlot",
        price: 0.00
      },
      {
        id: "04e4581c-736f-47ac-abd7-88d0d4b1db29",
        name: "Sycamore Lane",
        description: "Merlot",
        price: 0.00
      }
    ]
  },
  {
    category_id: "060cfb89-3be7-4569-b0da-d2f041777218",
    name: "Non Alcoholic",
    display_order: 20,
    icon: "🥤",
    color: "bg-blue-600",
    items: [
      {
        id: "d88d66e1-828e-4745-9638-8871c65ce219",
        name: "Abulita Hot Chocolate",
        description: "",
        price: 4.75
      },
      {
        id: "7f9f9c57-b27e-4fa8-932d-093ae19dbd4e",
        name: "Coffee",
        description: "",
        price: 4.75
      },
      {
        id: "9555d2e9-f2b0-4b8a-8d23-2f0ed704fa59",
        name: "Fountain Drinks",
        description: "Coke, Diet Coke, Sprite, DR Pepper, Lemonade, Sweet Ice tea",
        price: 5.00,
        choices: ["Coke", "Diet Coke", "Sprite", "DR Pepper", "Lemonade", "Sweet Ice tea"]
      },
      {
        id: "a166e90e-4dd9-4422-9738-888117a54e52",
        name: "Glass Beverages",
        description: "Topo Chico, Jarrico's, Coke, Sprite",
        price: 4.75,
        choices: ["Topo Chico", "Jarrico's", "Coke", "Sprite"]
      },
      {
        id: "78cbc607-d44c-4d79-bf97-b55173b60d68",
        name: "Red Bull",
        description: "",
        price: 4.75
      },
      {
        id: "7a1c424a-2124-4243-b424-c0aa866e4cfb",
        name: "Smoothies",
        description: "Comes w/ Whip - FLAVORS: Strawberry, Watermelon, Mango, Peach, Passion Fruit, Raspberry, Prickly Pear, Pineapple, Guava, Kiwi, Black Berry, and Coconut",
        price: 13.00,
        flavor_choices: ["Strawberry", "Watermelon", "Mango", "Peach", "Passion Fruit", "Raspberry", "Prickly Pear", "Pineapple", "Guava", "Kiwi", "Black Berry", "Coconut"]
      }
    ]
  }
];

interface DrinkItem {
  id: string;
  name: string;
  description: string;
  price: number;
  choices?: string[];
  flavor_choices?: string[];
  selection_rule?: string;
}

interface DrinkCategory {
  category_id: string;
  name: string;
  display_order: number;
  icon: string;
  color: string;
  items: DrinkItem[];
}

export default function DrinkMenu() {
  const [activeCategory, setActiveCategory] = useState<string>(DRINK_CATEGORIES[0].category_id);
  const [selectedItem, setSelectedItem] = useState<DrinkItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedChoices, setSelectedChoices] = useState<string[]>([]);

  const handleItemSelect = (item: DrinkItem) => {
    setSelectedItem(item);
    setSelectedChoices([]);
    setModalOpen(true);
  };

  const handleChoiceChange = (choice: string, checked: boolean) => {
    if (selectedItem?.selection_rule?.includes('Choose 1') || selectedItem?.selection_rule?.includes('flavor')) {
      // Radio-style selection
      setSelectedChoices(checked ? [choice] : []);
    } else if (selectedItem?.selection_rule?.includes('Choose 2')) {
      // Max 2 selections
      if (checked) {
        if (selectedChoices.length < 2) {
          setSelectedChoices([...selectedChoices, choice]);
        }
      } else {
        setSelectedChoices(selectedChoices.filter(c => c !== choice));
      }
    } else if (selectedItem?.selection_rule?.includes('Choose 4')) {
      // Max 4 selections
      if (checked) {
        if (selectedChoices.length < 4) {
          setSelectedChoices([...selectedChoices, choice]);
        }
      } else {
        setSelectedChoices(selectedChoices.filter(c => c !== choice));
      }
    } else {
      // Default checkbox behavior
      if (checked) {
        setSelectedChoices([...selectedChoices, choice]);
      } else {
        setSelectedChoices(selectedChoices.filter(c => c !== choice));
      }
    }
  };

  const canAddToCart = () => {
    if (!selectedItem) return false;
    
    if (selectedItem.selection_rule?.includes('Choose 1')) {
      return selectedChoices.length === 1;
    } else if (selectedItem.selection_rule?.includes('Choose 2')) {
      return selectedChoices.length === 2;
    } else if (selectedItem.selection_rule?.includes('Choose 4')) {
      return selectedChoices.length === 4;
    }
    
    return true; // No selection required
  };

  const handleAddToCart = () => {
    if (!selectedItem || !canAddToCart()) return;
    
    const orderData = {
      item: selectedItem,
      choices: selectedChoices,
      totalPrice: selectedItem.price
    };
    
    console.log('Adding drink to cart:', orderData);
    setModalOpen(false);
  };

  const activeCategoryData = DRINK_CATEGORIES.find(cat => cat.category_id === activeCategory);

  return (
    <div className="space-y-6">
      {/* Category Navigation */}
      <div className="flex flex-wrap gap-2 justify-center">
        {DRINK_CATEGORIES.map(category => (
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
            {activeCategoryData.items.map(item => (
              <Card key={item.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <div className="relative h-32 bg-muted flex items-center justify-center rounded-lg overflow-hidden mb-2">
                    <ImageOff className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <CardTitle className="text-lg">{item.name}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {item.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold">
                      ${item.price.toFixed(2)}
                    </span>
                    <Button onClick={() => handleItemSelect(item)} size="sm">
                      <Plus className="w-4 h-4 mr-1" />
                      Add to Cart
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
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
                <span className="font-medium">Price:</span>
                <Badge variant="secondary">${selectedItem.price.toFixed(2)}</Badge>
              </div>

              {/* Choices/Flavors */}
              {(selectedItem.choices || selectedItem.flavor_choices) && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Label className="text-base font-semibold">
                      {selectedItem.flavor_choices ? 'Choose Flavor:' : 'Make Selection:'}
                    </Label>
                    {selectedItem.selection_rule && (
                      <Badge variant="outline">{selectedItem.selection_rule}</Badge>
                    )}
                  </div>

                  <div className="grid gap-2">
                    {(selectedItem.choices || selectedItem.flavor_choices)?.map(choice => {
                      const isRadio = selectedItem.selection_rule?.includes('Choose 1') || 
                                     selectedItem.selection_rule?.includes('flavor');
                      
                      if (isRadio) {
                        return (
                          <div key={choice} className="flex items-center space-x-2">
                            <RadioGroup
                              value={selectedChoices[0] || ''}
                              onValueChange={(value) => handleChoiceChange(value, true)}
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value={choice} id={choice} />
                                <Label htmlFor={choice}>{choice}</Label>
                              </div>
                            </RadioGroup>
                          </div>
                        );
                      } else {
                        return (
                          <div key={choice} className="flex items-center space-x-2">
                            <Checkbox
                              id={choice}
                              checked={selectedChoices.includes(choice)}
                              onCheckedChange={(checked) => 
                                handleChoiceChange(choice, checked as boolean)
                              }
                            />
                            <Label htmlFor={choice}>{choice}</Label>
                          </div>
                        );
                      }
                    })}
                  </div>
                </div>
              )}

              {/* Add to Cart Button */}
              <Button 
                onClick={handleAddToCart} 
                className="w-full"
                disabled={!canAddToCart()}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add to Cart - ${selectedItem.price.toFixed(2)}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
