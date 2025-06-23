// Enhanced MenuItemModal.tsx - Improved with animations, better UX, and fixes
import { useState, useMemo, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Minus, ArrowLeft, Check, Loader2, Sparkles, ShoppingCart, Star, Flame, X } from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { MenuItem } from '@/lib/types/menu';
import { motion, AnimatePresence } from 'framer-motion';

interface MenuItemModifier {
  id: string;
  name: string;
  modifier_type: string;
  price_adjustment: number;
  is_available: boolean;
  display_order: number;
  description?: string;
  is_popular?: boolean;
  spice_level?: number;
}

interface ItemModifierGroup {
  id: string;
  item_id: string;
  modifier_type: string;
  is_required: boolean;
  max_selections: number;
  min_selections?: number;
  group_name: string;
  description?: string;
}

interface CartOrderData {
  item: {
    id: string;
    name: string;
    price: number;
  };
  modifiers: {
    meat: {
      id: string;
      name: string;
      price_adjustment: number;
    } | null;
    sauces: Array<{
      id: string;
      name: string;
      price_adjustment: number;
    }>;
  };
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  specialInstructions?: string;
}

interface MenuItemModalProps {
  item: MenuItem;
  open: boolean;
  onClose: () => void;
  onAddToCart: (orderData: CartOrderData) => void;
  existingCartQuantity?: number;
}

// McDonald's-style screen types
type ModalScreen = 'item-details' | 'meat-choice' | 'sauce-choice' | 'review';

// Animation variants
const pageVariants = {
  initial: { opacity: 0, x: 20 },
  in: { opacity: 1, x: 0 },
  out: { opacity: 0, x: -20 }
};

const pageTransition = {
  type: "tween",
  ease: "anticipate",
  duration: 0.3
};

export default function MenuItemModal({ 
  item, 
  open, 
  onClose, 
  onAddToCart,
  existingCartQuantity = 0 
}: MenuItemModalProps) {
  const [currentScreen, setCurrentScreen] = useState<ModalScreen>('item-details');
  const [selectedMeat, setSelectedMeat] = useState<string>('');
  const [selectedSauces, setSelectedSauces] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [modifiers, setModifiers] = useState<MenuItemModifier[]>([]);
  const [modifierGroups, setModifierGroups] = useState<ItemModifierGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCheckingAccess, setIsCheckingAccess] = useState(false);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [showInstructionsInput, setShowInstructionsInput] = useState(false);

  const supabase = getSupabaseBrowserClient();

  // Precise meat selection requirements based on exact item names
  const requiresMeatSelection = useMemo(() => {
    const meatModGroup = modifierGroups.find(g => g.modifier_type === 'meat');
    if (meatModGroup?.is_required) return true;
    
    const name = item.name.toUpperCase();
    
    // Items that SHOULD show meat selection
    const itemsWithMeatChoice = [
      'TACOS',
      'QUESO TACOS', 
      'BURRITO',
      'QUESADILLA',
      'MULITAS',
      'VAMPIROS',
      'TORTA',
      'EMPANADAS',
      'HUSTLE BOWL',
      'TACO SALAD',
      'LOADED FRIES',
      'LOADED NACHO'
    ];
    
    // Items that should NOT show meat selection (explicit exclusions)
    const itemsWithoutMeatChoice = [
      'FLAUTAS',
      'CHIPS & GUAC',
      'BASKET OF FRIES',
      'BASKET OF TOTS',
      'CHIPS AND GUAC'
    ];
    
    // First check exclusions
    if (itemsWithoutMeatChoice.some(excluded => name.includes(excluded))) {
      return false;
    }
    
    // Then check inclusions
    return itemsWithMeatChoice.some(included => name.includes(included));
  }, [item, modifierGroups]);

  // Reset function
  const handleReset = useCallback(() => {
    setSelectedMeat('');
    setSelectedSauces([]);
    setQuantity(1);
    setCurrentScreen('item-details');
    setSpecialInstructions('');
    setShowInstructionsInput(false);
  }, []);

  // Enhanced fetch modifiers with error handling
  const fetchModifiersForItem = useCallback(async () => {
    try {
      setLoading(true);
      
      const { data: groups, error: groupsError } = await supabase
        .from('item_modifier_groups')
        .select('*')
        .eq('item_id', item.id);

      if (groupsError) throw groupsError;
      setModifierGroups(groups || []);

      if (groups && groups.length > 0) {
        const modifierTypes = [...new Set(groups.map((g: ItemModifierGroup) => g.modifier_type))];
        
        const { data: modifiersData, error: modError } = await supabase
          .from('menu_item_modifiers')
          .select('*')
          .in('modifier_type', modifierTypes)
          .eq('is_available', true)
          .order('display_order', { ascending: true });

        if (modError) throw modError;
        setModifiers(modifiersData || []);
      } else {
        // Fallback for items without specific modifier groups
        if (requiresMeatSelection || item.name.toLowerCase().includes('wings')) {
          const { data: modifiersData, error: modError } = await supabase
            .from('menu_item_modifiers')
            .select('*')
            .eq('is_available', true)
            .order('display_order', { ascending: true });

          if (modError) throw modError;
          setModifiers(modifiersData || []);
        }
      }
    } catch (error) {
      console.error('Error fetching modifiers:', error);
      toast({
        title: "Error",
        description: "Failed to load customization options. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [item.id, item.name, requiresMeatSelection, supabase]);

  // Reset when modal closes
  useEffect(() => {
    if (!open) {
      handleReset();
    }
  }, [open, handleReset]);

  // Fetch modifiers when modal opens
  useEffect(() => {
    if (open && item.id) {
      fetchModifiersForItem();
    }
  }, [open, item.id, fetchModifiersForItem]);

  // Check item type for sauce filtering
  const isWingsItem = item.name.toLowerCase().includes('wings');
  const isSmallBitesItem = item.name.toLowerCase().includes('small bites') || 
                          (item.description && item.description.toLowerCase().includes('small bites'));

  // Process modifiers with enhanced filtering based on item type
  const { meatOptions, sauceOptions } = useMemo(() => {
    const meats = modifiers.filter(mod => mod.modifier_type === 'meat');
    
    // Filter sauces based on item type and sauce names
    let sauces: MenuItemModifier[] = [];
    
    if (isSmallBitesItem) {
      // Small Bites: No sauce options
      sauces = [];
    } else if (isWingsItem) {
      // Wing Items: Show only wing flavors
      const wingFlavors = ['Korean BBQ', 'Mango Habanero', 'Sweet Teriyaki', 'Garlic Buffalo', 'Buffalo', 'Garlic Parmesan', 'BBQ'];
      sauces = modifiers.filter(mod => 
        mod.modifier_type === 'sauce' && 
        wingFlavors.includes(mod.name)
      );
    } else {
      // All Other Items: Show CHEFA SAUCE options
      const chefaSauces = ['GUAC', 'TOMATILLO', 'RANCHERA', 'CHILE DE ARBOL', 'HABANERO'];
      sauces = modifiers.filter(mod => 
        mod.modifier_type === 'sauce' && 
        chefaSauces.includes(mod.name)
      );
    }
    
    return { meatOptions: meats, sauceOptions: sauces };
  }, [modifiers, isWingsItem, isSmallBitesItem]);
  
  const meatGroup = modifierGroups.find(g => g.modifier_type === 'meat');
  const sauceGroup = modifierGroups.find(g => 
    g.modifier_type === 'sauce' || 
    (isWingsItem && g.modifier_type === 'wing_sauce') ||
    g.modifier_type === 'salsa'
  );
  const maxSauceSelections = sauceGroup?.max_selections || 3;
  const minSauceSelections = sauceGroup?.min_selections || (isWingsItem ? 1 : 0);

  // Calculate total price
  const calculateTotal = () => {
    let modifierTotal = 0;
    
    if (selectedMeat) {
      const meatMod = meatOptions.find(m => m.id === selectedMeat);
      if (meatMod) modifierTotal += Number(meatMod.price_adjustment);
    }
    
    selectedSauces.forEach(sauceId => {
      const sauceMod = sauceOptions.find(s => s.id === sauceId);
      if (sauceMod) modifierTotal += Number(sauceMod.price_adjustment);
    });
    
    return (Number(item.price) + modifierTotal) * quantity;
  };

  // Enhanced navigation logic
  const handleContinue = () => {
    if (currentScreen === 'item-details') {
      if (requiresMeatSelection && meatOptions.length > 0) {
        setCurrentScreen('meat-choice');
      } else if (sauceOptions.length > 0) {
        setCurrentScreen('sauce-choice');
      } else {
        setCurrentScreen('review');
      }
    } else if (currentScreen === 'meat-choice') {
      if (sauceOptions.length > 0) {
        setCurrentScreen('sauce-choice');
      } else {
        setCurrentScreen('review');
      }
    } else if (currentScreen === 'sauce-choice') {
      setCurrentScreen('review');
    }
  };

  const handleBack = () => {
    if (currentScreen === 'meat-choice') {
      setCurrentScreen('item-details');
    } else if (currentScreen === 'sauce-choice') {
      if (requiresMeatSelection && meatOptions.length > 0) {
        setCurrentScreen('meat-choice');
      } else {
        setCurrentScreen('item-details');
      }
    } else if (currentScreen === 'review') {
      if (sauceOptions.length > 0) {
        setCurrentScreen('sauce-choice');
      } else if (requiresMeatSelection && meatOptions.length > 0) {
        setCurrentScreen('meat-choice');
      } else {
        setCurrentScreen('item-details');
      }
    }
  };

  // Progress indicator
  const getProgress = () => {
    const steps = ['item-details'];
    if (requiresMeatSelection && meatOptions.length > 0) steps.push('meat-choice');
    if (sauceOptions.length > 0) steps.push('sauce-choice');
    steps.push('review');
    
    const currentIndex = steps.indexOf(currentScreen);
    return { steps, currentIndex, total: steps.length };
  };

  const progress = getProgress();

  // Enhanced validation
  const canContinue = () => {
    if (currentScreen === 'meat-choice' && requiresMeatSelection && !selectedMeat) {
      return false;
    }
    if (currentScreen === 'sauce-choice' && minSauceSelections > 0 && selectedSauces.length < minSauceSelections) {
      return false;
    }
    return true;
  };

  // Enhanced add to cart with special instructions
  const handleAddToCart = async () => {
    setIsCheckingAccess(true);

    try {
      const selectedMeatData = meatOptions.find(m => m.id === selectedMeat);
      const selectedSaucesData = sauceOptions.filter(s => selectedSauces.includes(s.id));
      
      const orderData: CartOrderData = {
        item: {
          id: item.id,
          name: item.name,
          price: Number(item.price)
        },
        modifiers: {
          meat: selectedMeatData ? {
            id: selectedMeatData.id,
            name: selectedMeatData.name,
            price_adjustment: Number(selectedMeatData.price_adjustment)
          } : null,
          sauces: selectedSaucesData.map(s => ({
            id: s.id,
            name: s.name,
            price_adjustment: Number(s.price_adjustment)
          }))
        },
        quantity,
        unitPrice: calculateTotal() / quantity,
        totalPrice: calculateTotal(),
        specialInstructions: specialInstructions.trim()
      };

      onAddToCart(orderData);
      handleReset();
      onClose();
      
      toast({
        title: "Added to Cart! 🐺",
        description: `${quantity} × ${item.name} has been added to your order.`,
        action: (
          <Button variant="outline" size="sm" onClick={() => {/* Navigate to cart */}}>
            View Cart
          </Button>
        )
      });
    } catch (error) {
      console.error('Cart access check error:', error);
      toast({
        title: "Error",
        description: "Failed to add item to cart. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCheckingAccess(false);
    }
  };

  // Screen titles with emojis
  const getScreenTitle = () => {
    switch (currentScreen) {
      case 'item-details': return `🍽️ ${item.name}`;
      case 'meat-choice': return '🥩 Choose Your Protein';
      case 'sauce-choice': 
        if (isWingsItem) return '🔥 Choose Your Wing Flavors';
        return '🌶️ Choose Your CHEFA SAUCE';
      case 'review': return '📋 Review Your Order';
      default: return item.name;
    }
  };

  // Spice level indicator
  const SpiceIndicator = ({ level }: { level?: number }) => {
    if (!level) return null;
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Flame
            key={i}
            className={cn(
              "w-4 h-4",
              i < level ? "text-red-500" : "text-gray-300"
            )}
          />
        ))}
      </div>
    );
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1000] bg-black/80 flex items-center justify-center p-4 pb-20 menu-modal-overlay">
      <div className="w-full max-w-sm max-h-[calc(100vh-8rem)] flex flex-col bg-background rounded-lg shadow-lg">
        {/* Header */}
        <div className="p-6 space-y-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {currentScreen !== 'item-details' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBack}
                  className="p-2 hover:bg-accent rounded-full transition-all"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              )}
              <h2 className="text-xl font-bold flex-1">
                {getScreenTitle()}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 opacity-80 animate-pulse" />
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="p-2 hover:bg-accent rounded-full transition-all"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
          
          {/* Progress indicator */}
          {progress.total > 1 && (
            <div className="flex items-center justify-center gap-2">
              {progress.steps.map((step, index) => (
                <div key={step} className="flex items-center">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                      index < progress.currentIndex ? "bg-green-500 text-white" :
                      index === progress.currentIndex ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2" : 
                      "bg-muted text-muted-foreground"
                    )}
                  >
                    {index < progress.currentIndex ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  {index < progress.steps.length - 1 && (
                    <div className={cn(
                      "w-8 h-0.5 mx-2 transition-all",
                      index < progress.currentIndex ? "bg-green-500" : "bg-muted"
                    )} />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 p-6 space-y-6 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="mt-4 text-center text-lg font-medium">Loading delicious options...</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={currentScreen}
                initial="initial"
                animate="in"
                exit="out"
                variants={pageVariants}
                transition={pageTransition}
              >
                {/* Item Details Screen */}
                {currentScreen === 'item-details' && (
                  <div className="space-y-6">
                    {/* Description */}
                    {item.description && (
                      <p className="text-lg text-muted-foreground leading-relaxed">{item.description}</p>
                    )}

                    {/* Price */}
                    <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                      <span className="text-xl font-bold">Price:</span>
                      <span className="text-2xl font-bold text-primary">
                        ${Number(item.price).toFixed(2)}
                      </span>
                    </div>

                    {/* Quantity selector with existing cart info */}
                    <div className="space-y-4">
                      {existingCartQuantity > 0 && (
                        <div className="text-center p-2 bg-primary/10 rounded-lg">
                          <p className="text-sm text-muted-foreground">
                            You already have <span className="font-bold">{existingCartQuantity}</span> of this item in your cart
                          </p>
                        </div>
                      )}
                      <div className="flex items-center justify-center gap-4">
                        <Button
                          variant="outline"
                          size="lg"
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          disabled={quantity <= 1}
                          className="w-12 h-12 rounded-full"
                        >
                          <Minus className="w-5 h-5" />
                        </Button>
                        <span className="text-2xl font-bold min-w-[4ch] text-center">{quantity}</span>
                        <Button
                          variant="outline"
                          size="lg"
                          onClick={() => setQuantity(quantity + 1)}
                          className="w-12 h-12 rounded-full"
                        >
                          <Plus className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Meat Choice Screen */}
                {currentScreen === 'meat-choice' && (
                  <div className="space-y-6">
                    <div className="text-center space-y-2">
                      <div className="text-4xl">🥩</div>
                      <h3 className="text-xl font-bold">{meatGroup?.group_name || 'Choose Your Protein'}</h3>
                      {meatGroup?.description && (
                        <p className="text-sm text-muted-foreground">{meatGroup.description}</p>
                      )}
                      {requiresMeatSelection && (
                        <Badge variant="destructive" className="text-sm">Required</Badge>
                      )}
                    </div>
                    
                    <RadioGroup value={selectedMeat} onValueChange={setSelectedMeat} className="space-y-4">
                      {meatOptions.map((meat) => (
                        <div
                          key={meat.id}
                          className={cn(
                            "flex items-center space-x-4 p-4 rounded-lg border transition-all",
                            selectedMeat === meat.id ? "border-primary bg-primary/10 shadow-md" : "border-muted hover:border-primary/50"
                          )}
                        >
                          <RadioGroupItem value={meat.id} id={meat.id} className="w-6 h-6" />
                          <Label
                            htmlFor={meat.id}
                            className="flex-1 cursor-pointer flex justify-between items-center"
                          >
                            <div>
                              <span className="text-lg font-bold">{meat.name}</span>
                              {meat.description && (
                                <p className="text-sm text-muted-foreground mt-1">{meat.description}</p>
                              )}
                              {meat.is_popular && (
                                <Badge variant="secondary" className="mt-2">
                                  <Star className="w-3 h-3 mr-1" />
                                  Popular Choice
                                </Badge>
                              )}
                            </div>
                            {Number(meat.price_adjustment) > 0 && (
                              <span className="text-lg font-semibold text-green-600">
                                +${Number(meat.price_adjustment).toFixed(2)}
                              </span>
                            )}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                )}

                {/* Sauce Choice Screen */}
                {currentScreen === 'sauce-choice' && (
                  <div className="space-y-6">
                    <div className="text-center space-y-2">
                      <div className="text-4xl">
                        {isWingsItem ? '🔥' : '🌶️'}
                      </div>
                      <h3 className="text-xl font-bold">
                        {isWingsItem ? 'Choose Your Wing Flavors' : 'Choose Your CHEFA SAUCE'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {isWingsItem 
                          ? 'Select from our signature wing sauce collection'
                          : 'House-made sauces crafted fresh daily'
                        }
                      </p>
                      <Badge 
                        variant={minSauceSelections > 0 ? "destructive" : "secondary"}
                        className="text-sm"
                      >
                        {minSauceSelections > 0 
                          ? `Required - Select ${minSauceSelections}-${maxSauceSelections}` 
                          : `Optional - Up to ${maxSauceSelections}`}
                      </Badge>
                      {selectedSauces.length > 0 && (
                        <p className="text-sm text-muted-foreground">
                          Selected: {selectedSauces.length} / {maxSauceSelections}
                        </p>
                      )}
                    </div>
                    
                    <div className="space-y-4">
                      {sauceOptions.map((sauce) => (
                        <div
                          key={sauce.id}
                          className={cn(
                            "flex items-center space-x-4 p-4 rounded-lg border transition-all",
                            selectedSauces.includes(sauce.id) ? "border-primary bg-primary/10 shadow-md" : "border-muted hover:border-primary/50"
                          )}
                        >
                          <Checkbox
                            id={sauce.id}
                            checked={selectedSauces.includes(sauce.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                if (selectedSauces.length < maxSauceSelections) {
                                  setSelectedSauces(prev => [...prev, sauce.id]);
                                } else {
                                  toast({
                                    title: "Maximum reached",
                                    description: `You can only select up to ${maxSauceSelections} sauces`,
                                    variant: "destructive"
                                  });
                                }
                              } else {
                                setSelectedSauces(prev => prev.filter(id => id !== sauce.id));
                              }
                            }}
                            disabled={!selectedSauces.includes(sauce.id) && selectedSauces.length >= maxSauceSelections}
                            className="w-6 h-6"
                          />
                          <Label
                            htmlFor={sauce.id}
                            className="flex-1 cursor-pointer flex justify-between items-center"
                          >
                            <div>
                              <span className="text-lg font-bold">{sauce.name}</span>
                              {sauce.description && (
                                <p className="text-sm text-muted-foreground mt-1">{sauce.description}</p>
                              )}
                              <div className="flex items-center gap-3 mt-2">
                                {sauce.spice_level && <SpiceIndicator level={sauce.spice_level} />}
                                {sauce.is_popular && (
                                  <Badge variant="secondary">
                                    <Star className="w-3 h-3 mr-1" />
                                    Popular
                                  </Badge>
                                )}
                              </div>
                            </div>
                            {Number(sauce.price_adjustment) > 0 && (
                              <span className="text-lg font-semibold text-green-600">
                                +${Number(sauce.price_adjustment).toFixed(2)}
                              </span>
                            )}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Review Screen */}
                {currentScreen === 'review' && (
                  <div className="space-y-6">
                    <div className="text-center space-y-2">
                      <div className="text-4xl">📋</div>
                      <h3 className="text-xl font-bold">Order Summary</h3>
                      <p className="text-sm text-muted-foreground">
                        Review your selections before adding to cart
                      </p>
                    </div>
                    
                    <div className="space-y-4">
                      {/* Main item */}
                      <div className="flex justify-between items-center p-4 bg-card rounded-lg border shadow-sm">
                        <div>
                          <span className="text-lg font-bold">{item.name}</span>
                          <p className="text-sm text-muted-foreground">Base price</p>
                        </div>
                        <span className="text-lg font-bold text-primary">
                          ${Number(item.price).toFixed(2)}
                        </span>
                      </div>
                      
                      {/* Selected modifiers */}
                      {selectedMeat && (
                        <div className="flex justify-between items-center text-base p-3 bg-muted rounded-lg">
                          <span className="flex items-center gap-2">
                            <span className="text-primary">•</span>
                            {meatOptions.find(m => m.id === selectedMeat)?.name}
                          </span>
                          {Number(meatOptions.find(m => m.id === selectedMeat)?.price_adjustment || 0) > 0 && (
                            <span className="text-lg font-semibold text-green-600">
                              +${Number(meatOptions.find(m => m.id === selectedMeat)?.price_adjustment || 0).toFixed(2)}
                            </span>
                          )}
                        </div>
                      )}
                      
                      {/* Selected sauces */}
                      {selectedSauces.map((sauceId) => {
                        const sauce = sauceOptions.find(s => s.id === sauceId);
                        if (!sauce) return null;
                        
                        return (
                          <div 
                            key={sauceId}
                            className="flex justify-between items-center text-base p-3 bg-muted rounded-lg"
                          >
                            <span className="flex items-center gap-2">
                              <span className="text-primary">•</span>
                              {sauce.name}
                              {sauce.spice_level && sauce.spice_level > 0 && (
                                <div className="flex items-center gap-1 ml-2">
                                  {[...Array(sauce.spice_level)].map((_, i) => (
                                    <Flame key={i} className="w-3 h-3 text-red-500" />
                                  ))}
                                </div>
                              )}
                            </span>
                            {Number(sauce.price_adjustment) > 0 && (
                              <span className="text-lg font-semibold text-green-600">
                                +${Number(sauce.price_adjustment).toFixed(2)}
                              </span>
                            )}
                          </div>
                        );
                      })}
                      
                      {/* Quantity */}
                      <div className="flex justify-between items-center text-base p-3 bg-muted rounded-lg">
                        <span className="flex items-center gap-2">
                          <span className="text-primary">•</span>
                          Quantity: {quantity}
                        </span>
                      </div>
                      
                      {/* Special instructions */}
                      <div className="space-y-3">
                        <Button
                          variant="outline"
                          onClick={() => setShowInstructionsInput(!showInstructionsInput)}
                          className="w-full"
                        >
                          {showInstructionsInput ? 'Hide' : 'Add'} Special Instructions
                        </Button>
                        
                        {showInstructionsInput && (
                          <textarea
                            value={specialInstructions}
                            onChange={(e) => setSpecialInstructions(e.target.value)}
                            placeholder="Any special requests or modifications..."
                            className="w-full p-3 rounded-lg border border-muted bg-background min-h-[80px] resize-none"
                            maxLength={200}
                          />
                        )}
                      </div>
                      
                      {/* Total */}
                      <div className="flex justify-between items-center p-4 bg-primary/10 rounded-lg border-2 border-primary/20 shadow-lg">
                        <span className="text-xl font-bold">Total:</span>
                        <span className="text-2xl font-bold text-primary">
                          ${calculateTotal().toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        {/* Footer with action buttons */}
        <div className="p-6 border-t bg-background">
          {currentScreen === 'review' ? (
            <Button
              onClick={handleAddToCart}
              disabled={isCheckingAccess}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-lg py-6 rounded-xl font-bold shadow-lg"
            >
              {isCheckingAccess ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Adding to Cart...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Add {quantity} to Cart - ${calculateTotal().toFixed(2)}
                </div>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleContinue}
              disabled={!canContinue()}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-lg py-6 rounded-xl font-bold shadow-lg"
            >
              <div className="flex items-center justify-center gap-2">
                Continue
                <ArrowLeft className="w-5 h-5 rotate-180" />
              </div>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
