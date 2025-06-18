// COMPLETELY FIXED MenuItemModal.tsx - All errors resolved!
import { useState, useMemo, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Minus, ImageOff, ArrowLeft, Check, Loader2, Sparkles } from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { useWolfpackStatus } from '@/hooks/useWolfpackStatus';
import { cn } from '@/lib/utils';
import { MenuItem } from '@/lib/types/menu';

interface MenuItemModifier {
  id: string;
  name: string;
  modifier_type: string;
  price_adjustment: number;
  is_available: boolean;
  display_order: number;
}

interface ItemModifierGroup {
  id: string;
  item_id: string;
  modifier_type: string;
  is_required: boolean;
  max_selections: number;
  group_name: string;
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
}

interface MenuItemModalProps {
  item: MenuItem;
  open: boolean;
  onClose: () => void;
  onAddToCart: (orderData: CartOrderData) => void;
}

// McDonald's-style screen types
type ModalScreen = 'item-details' | 'meat-choice' | 'sauce-choice' | 'review';

export default function MenuItemModal({ item, open, onClose, onAddToCart }: MenuItemModalProps) {
  const [currentScreen, setCurrentScreen] = useState<ModalScreen>('item-details');
  const [selectedMeat, setSelectedMeat] = useState<string>('');
  const [selectedSauces, setSelectedSauces] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [modifiers, setModifiers] = useState<MenuItemModifier[]>([]);
  const [modifierGroups, setModifierGroups] = useState<ItemModifierGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCheckingAccess, setIsCheckingAccess] = useState(false);

  const supabase = getSupabaseBrowserClient();
  const wolfpackStatus = useWolfpackStatus();

  // Keep your existing logic for meat selection requirements
  const requiresMeatSelection = useMemo(() => {
    const meatModGroup = modifierGroups.find(g => g.modifier_type === 'meat');
    if (meatModGroup?.is_required) return true;
    
    const desc = (item.description || '').toLowerCase();
    const name = item.name.toLowerCase();
    
    const meatKeywords = [
      'choice of meat', 'choose meat', 'select meat',
      'tacos', 'burritos', 'quesadillas', 'loaded fries', 
      'loaded nacho', 'tortas', 'mulitas', 'hustle bowl', 
      'taco salad', 'empanadas', 'chilaquiles', 'enchiladas', 
      'flautas', 'wet burrito'
    ];
    
    return meatKeywords.some(keyword => 
      desc.includes(keyword) || name.includes(keyword)
    );
  }, [item, modifierGroups]);

  // Keep your existing reset and fetch functions
  const handleReset = useCallback(() => {
    setSelectedMeat('');
    setSelectedSauces([]);
    setQuantity(1);
    setCurrentScreen('item-details');
  }, []);

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
        description: "Failed to load modifiers",
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

  // Process modifiers
  const { meatOptions, sauceOptions } = useMemo(() => {
    const meats = modifiers.filter(mod => mod.modifier_type === 'meat');
    const sauces = modifiers.filter(mod => 
      mod.modifier_type === 'sauce' || 
      mod.modifier_type === 'wing_sauce'
    );
    return { meatOptions: meats, sauceOptions: sauces };
  }, [modifiers]);

  const meatGroup = modifierGroups.find(g => g.modifier_type === 'meat');
  const sauceGroup = modifierGroups.find(g => 
    g.modifier_type === 'sauce' || g.modifier_type === 'wing_sauce'
  );

  const isWingsItem = item.name.toLowerCase().includes('wings');
  const maxSauceSelections = sauceGroup?.max_selections || 3;

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

  // McDonald's-style navigation logic
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

  // Validation
  const canContinue = () => {
    if (currentScreen === 'meat-choice' && requiresMeatSelection && !selectedMeat) {
      return false;
    }
    if (currentScreen === 'sauce-choice' && isWingsItem && selectedSauces.length === 0) {
      return false;
    }
    return true;
  };

  // Keep your existing add to cart logic
  const handleAddToCart = async () => {
    if (!wolfpackStatus.isWolfpackMember && !wolfpackStatus.isLocationVerified) {
      toast({
        title: "Wolfpack Access Required",
        description: "Join the pack or verify your location to add items to cart.",
        variant: "destructive"
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
        totalPrice: calculateTotal()
      };

      onAddToCart(orderData);
      handleReset();
      onClose();
      
      toast({
        title: "Added to Cart! 🐺",
        description: `${item.name} has been added to your order.`,
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
      case 'meat-choice': return '🥩 Choose Your Meat';
      case 'sauce-choice': return '🌶️ Choose Your Sauces';
      case 'review': return '📋 Review Your Order';
      default: return item.name;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="wolfpack-modal-content">
        {/* Awesome header */}
        <DialogHeader className="wolfpack-modal-header">
          <div className="flex items-center gap-4">
            {currentScreen !== 'item-details' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="p-3 hover:bg-white/20 rounded-full"
              >
                <ArrowLeft className="w-6 h-6" />
              </Button>
            )}
            <DialogTitle className="wolfpack-modal-title flex-1">
              {getScreenTitle()}
            </DialogTitle>
            <Sparkles className="w-8 h-8 opacity-80" />
          </div>
          
          {/* Progress indicator */}
          {progress.total > 1 && (
            <div className="wolfpack-progress-container mt-6">
              {progress.steps.map((step, index) => (
                <div key={step} className="flex items-center">
                  <div className={cn(
                    "wolfpack-progress-step",
                    index < progress.currentIndex ? "completed" :
                    index === progress.currentIndex ? "active" : "inactive"
                  )}>
                    {index < progress.currentIndex ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  {index < progress.steps.length - 1 && (
                    <div className={cn(
                      "wolfpack-progress-line",
                      index < progress.currentIndex && "completed"
                    )} />
                  )}
                </div>
              ))}
            </div>
          )}
        </DialogHeader>

        <div className="wolfpack-modal-body">
          {loading ? (
            <div className="wolfpack-loading">
              <div className="wolfpack-loading-spinner" />
              <p className="mt-6 text-center text-lg font-medium">Loading awesome options...</p>
            </div>
          ) : (
            <>
              {/* Item Details Screen */}
              {currentScreen === 'item-details' && (
                <div className="space-y-8">
                  {/* Item Image */}
                  <div className="wolfpack-item-image relative h-64">
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
                      <div className="flex flex-col items-center justify-center h-full bg-muted rounded-20">
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
                  <div className="flex justify-between items-center p-6 bg-muted rounded-16">
                    <span className="text-xl font-bold">Price:</span>
                    <span className="wolfpack-price">${Number(item.price).toFixed(2)}</span>
                  </div>

                  {/* Quantity */}
                  <div className="wolfpack-quantity-control">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                      className="wolfpack-quantity-button"
                    >
                      <Minus className="w-5 h-5" />
                    </Button>
                    <span className="wolfpack-quantity-display">{quantity}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setQuantity(quantity + 1)}
                      className="wolfpack-quantity-button"
                    >
                      <Plus className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Meat Choice Screen */}
              {currentScreen === 'meat-choice' && (
                <div className="wolfpack-selection-group">
                  <div className="wolfpack-selection-title">
                    <span className="text-3xl">🥩</span>
                    {meatGroup?.group_name || 'Choose Your Meat'}
                    {requiresMeatSelection && (
                      <Badge variant="destructive" className="ml-3 text-sm">Required</Badge>
                    )}
                  </div>
                  
                  <RadioGroup value={selectedMeat} onValueChange={setSelectedMeat} className="space-y-4">
                    {meatOptions.map(meat => (
                      <div key={meat.id} className={cn(
                        "wolfpack-selection-option",
                        selectedMeat === meat.id && "selected"
                      )}>
                        <div className="flex items-center space-x-4">
                          <RadioGroupItem value={meat.id} id={meat.id} className="w-6 h-6" />
                          <Label
                            htmlFor={meat.id}
                            className="flex-1 cursor-pointer flex justify-between items-center text-lg"
                          >
                            <span className="font-bold">{meat.name}</span>
                            {Number(meat.price_adjustment) > 0 && (
                              <span className="wolfpack-price-adjustment text-lg">
                                +${Number(meat.price_adjustment).toFixed(2)}
                              </span>
                            )}
                          </Label>
                        </div>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              )}

              {/* Sauce Choice Screen */}
              {currentScreen === 'sauce-choice' && (
                <div className="wolfpack-selection-group">
                  <div className="wolfpack-selection-title">
                    <span className="text-3xl">🌶️</span>
                    {sauceGroup?.group_name || `Choose ${isWingsItem ? 'Wing' : 'Chef'} Sauces`}
                    <Badge 
                      variant={sauceGroup?.is_required || isWingsItem ? "destructive" : "secondary"}
                      className="ml-3 text-sm"
                    >
                      {sauceGroup?.is_required || isWingsItem 
                        ? `Required - Select 1-${maxSauceSelections}` 
                        : `Optional - Up to ${maxSauceSelections}`}
                    </Badge>
                  </div>
                  
                  <div className="space-y-4">
                    {sauceOptions.map(sauce => (
                      <div key={sauce.id} className={cn(
                        "wolfpack-selection-option",
                        selectedSauces.includes(sauce.id) && "selected"
                      )}>
                        <div className="flex items-center space-x-4">
                          <Checkbox
                            id={sauce.id}
                            checked={selectedSauces.includes(sauce.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                if (selectedSauces.length < maxSauceSelections) {
                                  setSelectedSauces(prev => [...prev, sauce.id]);
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
                            className="flex-1 cursor-pointer flex justify-between items-center text-lg"
                          >
                            <span className="font-bold">{sauce.name}</span>
                            {Number(sauce.price_adjustment) > 0 && (
                              <span className="wolfpack-price-adjustment text-lg">
                                +${Number(sauce.price_adjustment).toFixed(2)}
                              </span>
                            )}
                          </Label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Review Screen */}
              {currentScreen === 'review' && (
                <div className="space-y-8">
                  <div className="wolfpack-selection-group">
                    <div className="wolfpack-selection-title">
                      <span className="text-3xl">📋</span>
                      Order Summary
                    </div>
                    
                    <div className="space-y-6">
                      <div className="flex justify-between items-center p-4 bg-card rounded-12">
                        <span className="text-xl font-bold">{item.name}</span>
                        <span className="wolfpack-price">${Number(item.price).toFixed(2)}</span>
                      </div>
                      
                      {selectedMeat && (
                        <div className="flex justify-between items-center text-lg p-3 bg-muted rounded-12">
                          <span>• {meatOptions.find(m => m.id === selectedMeat)?.name}</span>
                          <span className="wolfpack-price-adjustment">
                            +${Number(meatOptions.find(m => m.id === selectedMeat)?.price_adjustment || 0).toFixed(2)}
                          </span>
                        </div>
                      )}
                      
                      {selectedSauces.map(sauceId => {
                        const sauce = sauceOptions.find(s => s.id === sauceId);
                        return sauce ? (
                          <div key={sauceId} className="flex justify-between items-center text-lg p-3 bg-muted rounded-12">
                            <span>• {sauce.name}</span>
                            <span className="wolfpack-price-adjustment">
                              +${Number(sauce.price_adjustment).toFixed(2)}
                            </span>
                          </div>
                        ) : null;
                      })}
                      
                      <div className="border-t-2 pt-6 flex justify-between items-center p-4 bg-primary/10 rounded-16">
                        <span className="text-2xl font-bold">Total (x{quantity}):</span>
                        <span className="wolfpack-price text-3xl">${calculateTotal().toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Awesome footer */}
        <DialogFooter className="p-8 border-t-2">
          <div className="flex gap-4 w-full">
            {currentScreen === 'review' ? (
              <>
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="wolfpack-button-secondary flex-1"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={handleAddToCart}
                  disabled={isCheckingAccess}
                  className="wolfpack-button-primary flex-2"
                >
                  {isCheckingAccess ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Adding to Pack...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
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
                  className="wolfpack-button-secondary flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleContinue}
                  disabled={!canContinue()}
                  className="wolfpack-button-primary flex-2"
                >
                  Continue
                  <ArrowLeft className="w-5 h-5 ml-2 rotate-180" />
                </Button>
              </>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
