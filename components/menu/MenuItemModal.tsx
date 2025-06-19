// Enhanced MenuItemModal.tsx - Improved with animations, better UX, and fixes
import { useState, useMemo, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Minus, ImageOff, ArrowLeft, Check, Loader2, Sparkles, ShoppingCart, Star, Flame, AlertCircle } from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { useWolfpackStatus } from '@/hooks/useWolfpackStatus';
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
  const wolfpackStatus = useWolfpackStatus();

  // Enhanced meat selection requirements with more keywords
  const requiresMeatSelection = useMemo(() => {
    const meatModGroup = modifierGroups.find(g => g.modifier_type === 'meat');
    if (meatModGroup?.is_required) return true;
    
    const desc = (item.description || '').toLowerCase();
    const name = item.name.toLowerCase();
    
    const meatKeywords = [
      'choice of meat', 'choose meat', 'select meat', 'pick your protein',
      'tacos', 'burritos', 'quesadillas', 'loaded fries', 
      'loaded nacho', 'tortas', 'mulitas', 'hustle bowl', 
      'taco salad', 'empanadas', 'chilaquiles', 'enchiladas', 
      'flautas', 'wet burrito', 'chimichanga', 'fajitas',
      'protein choice', 'meat option'
    ];
    
    return meatKeywords.some(keyword => 
      desc.includes(keyword) || name.includes(keyword)
    );
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

  // Process modifiers with enhanced filtering
  const { meatOptions, sauceOptions } = useMemo(() => {
    const meats = modifiers.filter(mod => mod.modifier_type === 'meat');
    const sauces = modifiers.filter(mod => 
      mod.modifier_type === 'sauce' || 
      mod.modifier_type === 'wing_sauce' ||
      mod.modifier_type === 'salsa'
    );
    return { meatOptions: meats, sauceOptions: sauces };
  }, [modifiers]);

  const meatGroup = modifierGroups.find(g => g.modifier_type === 'meat');
  const sauceGroup = modifierGroups.find(g => 
    g.modifier_type === 'sauce' || 
    g.modifier_type === 'wing_sauce' ||
    g.modifier_type === 'salsa'
  );

  const isWingsItem = item.name.toLowerCase().includes('wings');
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
    if (!wolfpackStatus.isWolfpackMember && !wolfpackStatus.isLocationVerified) {
      toast({
        title: "Wolfpack Access Required",
        description: "Join the pack or verify your location to add items to cart.",
        variant: "destructive",
        action: (
          <Button variant="outline" size="sm" onClick={() => window.location.href = '/login'}>
            Sign In
          </Button>
        )
      });
      return;
    }

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

  const imageUrl = item.image_url || 
    (item.image_id ? `/api/images/${item.image_id}` : null);

  // Screen titles with emojis
  const getScreenTitle = () => {
    switch (currentScreen) {
      case 'item-details': return `🍽️ ${item.name}`;
      case 'meat-choice': return '🥩 Choose Your Protein';
      case 'sauce-choice': return isWingsItem ? '🔥 Choose Your Wing Sauce' : '🌶️ Choose Your Sauces';
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <DialogHeader className="space-y-4">
          <div className="flex items-center gap-4">
            {currentScreen !== 'item-details' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="p-3 hover:bg-white/20 rounded-full transition-all"
              >
                <ArrowLeft className="w-6 h-6" />
              </Button>
            )}
            <DialogTitle className="wolfpack-modal-title flex-1">
              {getScreenTitle()}
            </DialogTitle>
            <Sparkles className="w-8 h-8 opacity-80 animate-pulse" />
          </div>
          
          {/* Progress indicator */}
          {progress.total > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              {progress.steps.map((step, index) => (
                <div key={step} className="flex items-center">
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
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
                  </motion.div>
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
        </DialogHeader>

        <div className="space-y-6">
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
                  <div className="space-y-8">
                    {/* Item Image */}
                    <div className="relative h-64 rounded-lg overflow-hidden bg-muted">
                      {imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 50vw"
                          priority
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full bg-muted rounded-lg">
                          <ImageOff className="w-16 h-16 text-muted-foreground" />
                          <span className="text-lg text-muted-foreground mt-4">No image available</span>
                        </div>
                      )}
                    </div>

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
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="text-4xl"
                      >
                        🥩
                      </motion.div>
                      <h3 className="text-xl font-bold">{meatGroup?.group_name || 'Choose Your Protein'}</h3>
                      {meatGroup?.description && (
                        <p className="text-sm text-muted-foreground">{meatGroup.description}</p>
                      )}
                      {requiresMeatSelection && (
                        <Badge variant="destructive" className="text-sm">Required</Badge>
                      )}
                    </div>
                    
                    <RadioGroup value={selectedMeat} onValueChange={setSelectedMeat} className="space-y-4">
                      {meatOptions.map((meat, index) => (
                        <motion.div
                          key={meat.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
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
                        </motion.div>
                      ))}
                    </RadioGroup>
                  </div>
                )}

                {/* Sauce Choice Screen */}
                {currentScreen === 'sauce-choice' && (
                  <div className="space-y-6">
                    <div className="text-center space-y-2">
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="text-4xl"
                      >
                        {isWingsItem ? '🔥' : '🌶️'}
                      </motion.div>
                      <h3 className="text-xl font-bold">
                        {sauceGroup?.group_name || `Choose ${isWingsItem ? 'Wing' : 'Your'} Sauces`}
                      </h3>
                      {sauceGroup?.description && (
                        <p className="text-sm text-muted-foreground">{sauceGroup.description}</p>
                      )}
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
                      {sauceOptions.map((sauce, index) => (
                        <motion.div
                          key={sauce.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
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
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Review Screen */}
                {currentScreen === 'review' && (
                  <div className="space-y-6">
                    <div className="text-center space-y-2">
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="text-4xl"
                      >
                        📋
                      </motion.div>
                      <h3 className="text-xl font-bold">Order Summary</h3>
                      <p className="text-sm text-muted-foreground">
                        Review your selections before adding to cart
                      </p>
                    </div>
                    
                    <div className="space-y-4">
                      {/* Main item */}
                      <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex justify-between items-center p-4 bg-card rounded-lg border shadow-sm"
                      >
                        <div>
                          <span className="text-lg font-bold">{item.name}</span>
                          <p className="text-sm text-muted-foreground">Base price</p>
                        </div>
                        <span className="text-lg font-bold text-primary">
                          ${Number(item.price).toFixed(2)}
                        </span>
                      </motion.div>
                      
                      {/* Selected modifiers */}
                      {selectedMeat && (
                        <motion.div 
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 }}
                          className="flex justify-between items-center text-base p-3 bg-muted rounded-lg"
                        >
                          <span className="flex items-center gap-2">
                            <span className="text-primary">•</span>
                            {meatOptions.find(m => m.id === selectedMeat)?.name}
                          </span>
                          {Number(meatOptions.find(m => m.id === selectedMeat)?.price_adjustment || 0) > 0 && (
                            <span className="font-semibold text-green-600">
                              +${Number(meatOptions.find(m => m.id === selectedMeat)?.price_adjustment || 0).toFixed(2)}
                            </span>
                          )}
                        </motion.div>
                      )}
                      
                      {selectedSauces.map((sauceId, index) => {
                        const sauce = sauceOptions.find(s => s.id === sauceId);
                        return sauce ? (
                          <motion.div 
                            key={sauceId}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 + index * 0.1 }}
                            className="flex justify-between items-center text-base p-3 bg-muted rounded-lg"
                          >
                            <span className="flex items-center gap-2">
                              <span className="text-primary">•</span>
                              {sauce.name}
                            </span>
                            {Number(sauce.price_adjustment) > 0 && (
                              <span className="font-semibold text-green-600">
                                +${Number(sauce.price_adjustment).toFixed(2)}
                              </span>
                            )}
                          </motion.div>
                        ) : null;
                      })}
                      
                      {/* Special instructions */}
                      <div className="space-y-2">
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => setShowInstructionsInput(!showInstructionsInput)}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          {specialInstructions ? 'Edit' : 'Add'} Special Instructions
                        </Button>
                        {showInstructionsInput && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                          >
                            <textarea
                              value={specialInstructions}
                              onChange={(e) => setSpecialInstructions(e.target.value)}
                              placeholder="Any special requests? (e.g., extra crispy, no onions, etc.)"
                              className="w-full p-3 rounded-lg border bg-background resize-none"
                              rows={3}
                              maxLength={200}
                            />
                            <p className="text-xs text-muted-foreground mt-1 text-right">
                              {specialInstructions.length}/200
                            </p>
                          </motion.div>
                        )}
                      </div>
                      
                      {/* Total */}
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="border-t-2 pt-4 flex justify-between items-center p-4 bg-primary/10 rounded-lg"
                      >
                        <span className="text-xl font-bold">Total (×{quantity}):</span>
                        <div className="text-right">
                          <span className="text-2xl font-bold text-primary">
                            ${calculateTotal().toFixed(2)}
                          </span>
                          {quantity > 1 && (
                            <p className="text-sm text-muted-foreground">
                              ${(calculateTotal() / quantity).toFixed(2)} each
                            </p>
                          )}
                        </div>
                      </motion.div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="border-t pt-4">
          <div className="flex gap-3 w-full">
            {currentScreen === 'review' ? (
              <>
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="flex-1"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={handleAddToCart}
                  disabled={isCheckingAccess}
                  className="flex-[2] bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                >
                  {isCheckingAccess ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Add to Cart • ${calculateTotal().toFixed(2)}
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleContinue}
                  disabled={!canContinue()}
                  className={cn(
                    "flex-[2] transition-all",
                    canContinue() 
                      ? "bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70" 
                      : ""
                  )}
                >
                  Continue
                  <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                </Button>
              </>
            )}
          </div>
          
          {/* Validation message */}
          {!canContinue() && currentScreen !== 'item-details' && currentScreen !== 'review' && (
            <p className="text-sm text-destructive text-center mt-2">
              {currentScreen === 'meat-choice' && requiresMeatSelection && 'Please select a protein to continue'}
              {currentScreen === 'sauce-choice' && minSauceSelections > 0 && selectedSauces.length < minSauceSelections && 
                `Please select at least ${minSauceSelections} sauce${minSauceSelections > 1 ? 's' : ''}`}
            </p>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
