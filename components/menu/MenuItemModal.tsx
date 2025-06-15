// components/menu/MenuItemModal.tsx
import { useState, useMemo, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Plus, Minus, ImageOff, MapPin, Crown, Shield, Loader2 } from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { useWolfpackStatus } from '@/hooks/useWolfpackStatus';
import { useLocationAccess } from '@/hooks/useLocationAccess';
import { useRouter } from 'next/navigation';

// Database types matching your Supabase schema
interface MenuItem {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  is_available: boolean;
  image_id?: string | null;
  display_order: number;
  image_url?: string | null; // From joined images table
}

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

// Type for the cart order data
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

export default function MenuItemModal({ item, open, onClose, onAddToCart }: MenuItemModalProps) {
  const [selectedMeat, setSelectedMeat] = useState<string>('');
  const [selectedSauces, setSelectedSauces] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [modifiers, setModifiers] = useState<MenuItemModifier[]>([]);
  const [modifierGroups, setModifierGroups] = useState<ItemModifierGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCheckingAccess, setIsCheckingAccess] = useState(false);

  // Get the Supabase client
  const supabase = getSupabaseBrowserClient();

  const wolfpackStatus = useWolfpackStatus();
  const { requestAccess: requestLocationAccess, isLoading: isLocationLoading } = useLocationAccess();
  const router = useRouter();
  const joinWolfpack = () => router.push('/wolfpack');

  // Determine if item requires meat selection
  const requiresMeatSelection = useMemo(() => {
    // First check modifier groups
    const meatModGroup = modifierGroups.find(g => g.modifier_type === 'meat');
    if (meatModGroup?.is_required) return true;
    
    // Then check description and name
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

  const handleReset = useCallback(() => {
    setSelectedMeat('');
    setSelectedSauces([]);
    setQuantity(1);
  }, []);

  const fetchModifiersForItem = useCallback(async () => {
    try {
      setLoading(true);
      
      // First, get the modifier groups for this item
      const { data: groups, error: groupsError } = await supabase
        .from('item_modifier_groups')
        .select('*')
        .eq('item_id', item.id);

      if (groupsError) throw groupsError;

      setModifierGroups(groups || []);

      // If there are modifier groups, we need to fetch the actual modifiers
      if (groups && groups.length > 0) {
        // For now, fetch all available modifiers of the types needed
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
        // If no specific modifier groups, check if item needs modifiers based on description
        if (requiresMeatSelection || item.name.toLowerCase().includes('wings')) {
          // Fetch all available modifiers
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

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      handleReset();
    }
  }, [open, handleReset]);

  // Fetch modifiers and modifier groups when modal opens
  useEffect(() => {
    if (open && item.id) {
      fetchModifiersForItem();
    }
  }, [open, item.id, fetchModifiersForItem]);

  // Process modifiers into meat and sauce options
  const { meatOptions, sauceOptions } = useMemo(() => {
    const meats = modifiers.filter(mod => mod.modifier_type === 'meat');
    const sauces = modifiers.filter(mod => 
      mod.modifier_type === 'sauce' || 
      mod.modifier_type === 'wing_sauce'
    );
    return { meatOptions: meats, sauceOptions: sauces };
  }, [modifiers]);

  // Get modifier group settings
  const meatGroup = modifierGroups.find(g => g.modifier_type === 'meat');
  const sauceGroup = modifierGroups.find(g => 
    g.modifier_type === 'sauce' || g.modifier_type === 'wing_sauce'
  );

  // Check if this is a wings item
  const isWingsItem = item.name.toLowerCase().includes('wings');
  const maxSauceSelections = sauceGroup?.max_selections || 3;
  
  // Calculate total price including modifier adjustments
  const calculateTotal = () => {
    let modifierTotal = 0;
    
    // Add meat price adjustment
    if (selectedMeat) {
      const meatMod = meatOptions.find(m => m.id === selectedMeat);
      if (meatMod) modifierTotal += Number(meatMod.price_adjustment);
    }
    
    // Add sauce price adjustments
    selectedSauces.forEach(sauceId => {
      const sauceMod = sauceOptions.find(s => s.id === sauceId);
      if (sauceMod) modifierTotal += Number(sauceMod.price_adjustment);
    });
    
    return (Number(item.price) + modifierTotal) * quantity;
  };

  const canAddToCart = () => {
    // Must select meat if required
    if (requiresMeatSelection && !selectedMeat) {
      return false;
    }
    
    // Check sauce requirements
    if (sauceGroup?.is_required && selectedSauces.length === 0) {
      return false;
    }
    
    // Wings must have at least 1 sauce
    if (isWingsItem && selectedSauces.length === 0) {
      return false;
    }
    
    // Check max sauce selections
    if (selectedSauces.length > maxSauceSelections) {
      return false;
    }
    
    return true;
  };

  const handleAddToCart = async () => {
    if (!canAddToCart()) return;

    // Check access based on Wolfpack status
    if (!wolfpackStatus.isWolfpackMember && !wolfpackStatus.isLocationVerified) {
      toast({
        title: "Access Required",
        description: "Please verify your location or join the Wolfpack to add items to cart.",
        variant: "destructive"
      });
      return;
    }

    setIsCheckingAccess(true);

    try {
      // Proceed with adding to cart
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

  const handleLocationRequest = async () => {
    const success = await requestLocationAccess();
    if (success) {
      toast({
        title: "Location Verified",
        description: "You can now add items to your cart!",
      });
    }
  };

  const handleSauceChange = (sauceId: string, checked: boolean) => {
    if (checked) {
      if (selectedSauces.length < maxSauceSelections) {
        setSelectedSauces(prev => [...prev, sauceId]);
      }
    } else {
      setSelectedSauces(prev => prev.filter(id => id !== sauceId));
    }
  };

  // Get image URL - either from joined data or construct from image_id
  const imageUrl = item.image_url || 
    (item.image_id ? `/api/images/${item.image_id}` : null);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] sm:max-w-md max-h-[90vh] overflow-y-auto menu-modal-content">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-lg sm:text-xl font-bold pr-8">{item.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Item Image */}
          <div className="relative h-48 bg-muted flex items-center justify-center rounded-lg overflow-hidden">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={item.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                priority={true}
              />
            ) : (
              <div className="flex flex-col items-center justify-center space-y-2">
                <ImageOff className="w-12 h-12 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">No image available</span>
              </div>
            )}
          </div>

          {/* Item Description */}
          {item.description && (
            <p className="text-sm text-muted-foreground">{item.description}</p>
          )}

          {/* Base Price */}
          <div className="flex justify-between items-center">
            <span className="font-medium">Base Price:</span>
            <Badge variant="secondary" className="text-base">
              ${Number(item.price).toFixed(2)}
            </Badge>
          </div>

          {/* Loading state */}
          {loading ? (
            <div className="text-center py-4">Loading modifiers...</div>
          ) : (
            <>
              {/* Meat Selection */}
              {(requiresMeatSelection || meatGroup) && meatOptions.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Label className="text-base font-semibold">
                      {meatGroup?.group_name || 'Choose Meat'}
                    </Label>
                    {(requiresMeatSelection || meatGroup?.is_required) && (
                      <Badge variant="destructive" className="text-xs">Required</Badge>
                    )}
                  </div>
                  
                  <RadioGroup value={selectedMeat} onValueChange={setSelectedMeat}>
                    {meatOptions.map(meat => (
                      <div key={meat.id} className="flex items-center space-x-2">
                        <RadioGroupItem value={meat.id} id={meat.id} />
                        <Label
                          htmlFor={meat.id}
                          className="flex-1 cursor-pointer flex justify-between items-center"
                        >
                          <span>{meat.name}</span>
                          {Number(meat.price_adjustment) > 0 && (
                            <span className="text-muted-foreground font-medium">
                              +${Number(meat.price_adjustment).toFixed(2)}
                            </span>
                          )}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              )}

              {/* Sauce Selection */}
              {sauceOptions.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Label className="text-base font-semibold">
                      {sauceGroup?.group_name || `Choose ${isWingsItem ? 'Wing' : 'Chef'} Sauces`}
                    </Label>
                    <Badge 
                      variant={sauceGroup?.is_required || isWingsItem ? "destructive" : "secondary"} 
                      className="text-xs"
                    >
                      {sauceGroup?.is_required || isWingsItem 
                        ? `Required - Select ${sauceGroup?.is_required ? '1' : '1'}-${maxSauceSelections}` 
                        : `Optional - Select up to ${maxSauceSelections}`}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    {sauceOptions.map(sauce => (
                      <div key={sauce.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={sauce.id}
                          checked={selectedSauces.includes(sauce.id)}
                          onCheckedChange={(checked) => handleSauceChange(sauce.id, checked as boolean)}
                          disabled={!selectedSauces.includes(sauce.id) && selectedSauces.length >= maxSauceSelections}
                        />
                        <Label
                          htmlFor={sauce.id}
                          className="flex-1 cursor-pointer flex justify-between items-center"
                        >
                          <span>{sauce.name}</span>
                          {Number(sauce.price_adjustment) > 0 && (
                            <span className="text-muted-foreground">
                              +${Number(sauce.price_adjustment).toFixed(2)}
                            </span>
                          )}
                        </Label>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>{selectedSauces.length}/{maxSauceSelections} sauces selected</span>
                    {selectedSauces.length === maxSauceSelections && (
                      <span className="text-amber-600">Maximum reached</span>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Quantity Selector */}
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold">Quantity:</Label>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
                className="h-9 w-9"
              >
                <Minus className="w-4 h-4" />
              </Button>
              <span className="w-12 text-center font-semibold text-lg">{quantity}</span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(quantity + 1)}
                className="h-9 w-9"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Total Price */}
          <div className="flex justify-between items-center pt-4 border-t">
            <span className="text-lg font-semibold">Total:</span>
            <Badge variant="default" className="text-lg px-4 py-1">
              ${calculateTotal().toFixed(2)}
            </Badge>
          </div>

          {/* Access Verification Section */}
          {!wolfpackStatus.isLoading && (
            <div className="space-y-3 pt-2 border-t">
              {/* Wolfpack Status Display */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Membership Status:</span>
                <div className="flex items-center space-x-2">
                  {wolfpackStatus.isWolfpackMember ? (
                    <>
                      <Crown className="h-4 w-4 text-yellow-500" />
                      <Badge variant="default" className="bg-yellow-500">
                        Wolfpack Member
                      </Badge>
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4 text-gray-500" />
                      <Badge variant="outline">Guest</Badge>
                    </>
                  )}
                </div>
              </div>

              {/* Location Status Display */}
              {!wolfpackStatus.isWolfpackMember && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Location Status:</span>
                  <div className="flex items-center space-x-2">
                    {wolfpackStatus.isLocationVerified ? (
                      <>
                        <MapPin className="h-4 w-4 text-green-500" />
                        <Badge variant="default" className="bg-green-500">
                          Verified
                        </Badge>
                      </>
                    ) : (
                      <>
                        <MapPin className="h-4 w-4 text-red-500" />
                        <Badge variant="destructive">
                          {isLocationLoading ? 'Checking...' : 'Required'}
                        </Badge>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Access Requirements Alert */}
              {!wolfpackStatus.isWolfpackMember && !wolfpackStatus.isLocationVerified && (
                <Alert>
                  <MapPin className="h-4 w-4" />
                  <AlertTitle>Location Verification Required</AlertTitle>
                  <AlertDescription className="space-y-2">
                    <p>To add items to your cart, we need to verify you&apos;re at our establishment.</p>
                    <Button 
                      onClick={handleLocationRequest}
                      disabled={isLocationLoading}
                      size="sm"
                      className="w-full"
                    >
                      {isLocationLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Verifying Location...
                        </>
                      ) : (
                        <>
                          <MapPin className="h-4 w-4 mr-2" />
                          Verify Location
                        </>
                      )}
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              {/* Wolfpack Promotion for Non-Members */}
              {!wolfpackStatus.isWolfpackMember && wolfpackStatus.isLocationVerified && (
                <Alert>
                  <Crown className="h-4 w-4" />
                  <AlertTitle>Upgrade to Wolfpack</AlertTitle>
                  <AlertDescription className="space-y-2">
                    <p>Skip location verification and get exclusive perks!</p>
                    <Button 
                      onClick={joinWolfpack}
                      size="sm"
                      variant="outline"
                      className="w-full"
                    >
                      <Crown className="h-4 w-4 mr-2" />
                      Join the Wolfpack
                    </Button>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Validation Messages */}
          {requiresMeatSelection && !selectedMeat && (
            <p className="text-sm text-destructive">Please select a meat option</p>
          )}
          {(sauceGroup?.is_required || isWingsItem) && selectedSauces.length === 0 && (
            <p className="text-sm text-destructive">
              Please select {sauceGroup?.is_required ? 'at least 1' : '1-3'} sauce{sauceGroup?.is_required || selectedSauces.length === 0 ? 's' : ''}
            </p>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 pt-4">
          <Button 
            variant="outline" 
            onClick={handleReset} 
            className="w-full sm:w-auto"
          >
            Reset
          </Button>
          <Button 
            onClick={handleAddToCart} 
            className="w-full sm:w-auto"
            disabled={!canAddToCart() || loading || isCheckingAccess || isLocationLoading}
          >
            {isCheckingAccess ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Checking Access...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Add to Cart
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
