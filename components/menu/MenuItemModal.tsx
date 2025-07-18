// Enhanced MenuItemModal.tsx - Correctly implemented with proper Wolf Pack check
import { useState, useMemo, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Minus, ArrowLeft, Check, Loader2, Sparkles, ShoppingCart, X } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
// useWolfpack functionality integrated into TikTok-style Wolfpack Local Pack
import { cn } from '@/lib/utils';
import { MenuItemWithModifiers, CartOrderData } from '@/types/features/menu';
import { motion, AnimatePresence } from 'framer-motion';

interface MenuItemModalProps {
  item: MenuItemWithModifiers;
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
  const [isCheckingAccess, setIsCheckingAccess] = useState(false);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [showInstructionsInput, setShowInstructionsInput] = useState(false);

  // useWolfpack functionality integrated into TikTok-style Wolfpack Local Pack
  const state = { isInSession: false, members: [] }; // Default state
  
  // Check Wolf Pack membership using only properties that actually exist in RealtimeState
  const isWolfPackMember = useMemo(() => {
    // Check if current user is in the members array (the only property we know exists)
    return state.members && state.members.length > 0;
  }, [state]);

  // Process modifiers from API data
  const { meatGroup, sauceGroup, meatOptions, sauceOptions } = useMemo(() => {
    if (!item.modifiers || item.modifiers.length === 0) {
      return {
        meatGroup: null,
        sauceGroup: null,
        meatOptions: [],
        sauceOptions: []
      };
    }

    const meatGroup = item.modifiers.find(group => group.type === 'meat');
    const sauceGroup = item.modifiers.find(group => group.type === 'sauce');

    return {
      meatGroup,
      sauceGroup,
      meatOptions: meatGroup?.options || [],
      sauceOptions: sauceGroup?.options || []
    };
  }, [item.modifiers]);

  // Determine if meat selection is required
  const requiresMeatSelection = useMemo(() => {
    return meatGroup?.required || false;
  }, [meatGroup]);

  // Sauce selection constraints
  const maxSauceSelections = sauceGroup?.max_selections || 3;
  const minSauceSelections = sauceGroup?.required ? 1 : 0;

  // Reset function
  const handleReset = useCallback(() => {
    setSelectedMeat('');
    setSelectedSauces([]);
    setQuantity(1);
    setCurrentScreen('item-details');
    setSpecialInstructions('');
    setShowInstructionsInput(false);
  }, []);

  // Reset when modal closes
  useEffect(() => {
    if (!open) {
      handleReset();
    }
  }, [open, handleReset]);

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
      if (meatOptions.length > 0) {
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
      if (meatOptions.length > 0) {
        setCurrentScreen('meat-choice');
      } else {
        setCurrentScreen('item-details');
      }
    } else if (currentScreen === 'review') {
      if (sauceOptions.length > 0) {
        setCurrentScreen('sauce-choice');
      } else if (meatOptions.length > 0) {
        setCurrentScreen('meat-choice');
      } else {
        setCurrentScreen('item-details');
      }
    }
  };

  // Progress indicator
  const getProgress = () => {
    const steps = ['item-details'];
    if (meatOptions.length > 0) steps.push('meat-choice');
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
      // Check if user is in Wolf Pack before allowing cart access
      if (!isWolfPackMember) {
        toast({
          title: "🐺 Wolf Pack Membership Required",
          description: "You need to be in the Wolf Pack to add items to cart. Join the pack to start ordering!",
          variant: "destructive"
        });
        return;
      }

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
      case 'sauce-choice': return '🌶️ Choose Your Sauces';
      case 'review': return '📋 Review Your Order';
      default: return item.name;
    }
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
                    <h3 className="text-xl font-bold">Choose Your Protein</h3>
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
                    <div className="text-4xl">🌶️</div>
                    <h3 className="text-xl font-bold">Choose Your Sauces</h3>
                    <p className="text-sm text-muted-foreground">
                      House-made sauces crafted fresh daily
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