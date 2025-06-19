'use client';

import { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Minus, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useCartAccess } from '@/hooks/useCartAccess';
import { useAuth } from '@/lib/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image_url?: string;
  notes?: string;
  modifiers?: {
    meat?: { id: string; name: string; price_adjustment: number } | null;
    sauces?: Array<{ id: string; name: string; price_adjustment: number }>;
  };
}

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckout: (items: CartItem[], notes: string, total: number) => Promise<void>;
}

export default function Cart({ isOpen, onClose, onCheckout }: CartProps) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [orderNotes, setOrderNotes] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const { canAccess, isLoading, reason } = useCartAccess();
  const { user } = useAuth();

  // Load cart from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && user) {
      const savedCart = localStorage.getItem(`cart_${user.id}`);
      if (savedCart) {
        try {
          setCartItems(JSON.parse(savedCart));
        } catch (error) {
          console.error('Error loading cart:', error);
          localStorage.removeItem(`cart_${user.id}`);
        }
      }
    }
  }, [user]);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined' && user) {
      localStorage.setItem(`cart_${user.id}`, JSON.stringify(cartItems));
    }
  }, [cartItems, user]);

  // Calculate item total including modifiers
  const calculateItemTotal = (item: CartItem): number => {
    let total = item.price;
    
    if (item.modifiers?.meat?.price_adjustment) {
      total += item.modifiers.meat.price_adjustment;
    }
    
    if (item.modifiers?.sauces) {
      total += item.modifiers.sauces.reduce((sum, sauce) => sum + (sauce.price_adjustment || 0), 0);
    }
    
    return total * item.quantity;
  };

  // Calculate cart total
  const cartTotal = cartItems.reduce((sum, item) => sum + calculateItemTotal(item), 0);

  // Update item quantity
  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(itemId);
      return;
    }

    setCartItems(prev => 
      prev.map(item => 
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  // Remove item from cart
  const removeItem = (itemId: string) => {
    setCartItems(prev => prev.filter(item => item.id !== itemId));
    toast({
      title: "Item Removed",
      description: "Item has been removed from your cart",
    });
  };

  // Clear entire cart
  const clearCart = () => {
    setCartItems([]);
    setOrderNotes('');
    if (typeof window !== 'undefined' && user) {
      localStorage.removeItem(`cart_${user.id}`);
    }
    toast({
      title: "Cart Cleared",
      description: "All items have been removed from your cart",
    });
  };

  // Handle checkout
  const handleCheckout = async () => {
    if (!canAccess) {
      toast({
        title: "Cannot Checkout",
        description: reason === 'not-member' 
          ? "You must join the WolfPack to place orders" 
          : "Location access is required to place orders",
        variant: "destructive"
      });
      return;
    }

    if (cartItems.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Add items to your cart before checking out",
        variant: "destructive"
      });
      return;
    }

    setIsChecking(true);
    
    try {
      await onCheckout(cartItems, orderNotes, cartTotal);
      
      // Clear cart after successful checkout
      clearCart();
      onClose();
      
      toast({
        title: "Order Placed!",
        description: "Your order has been sent to the kitchen. You'll be notified when it's ready!",
      });
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: "Checkout Failed",
        description: "Failed to place your order. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsChecking(false);
    }
  };

  // Get access status message
  const getAccessMessage = () => {
    if (isLoading) return "Checking access...";
    if (reason === 'not-member') return "Join the WolfPack to place orders";
    if (reason === 'not-at-location') return "You must be at the bar to place orders";
    return null;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-end sm:items-center justify-center p-4">
      <Card className="w-full max-w-lg max-h-[90vh] sm:max-h-[80vh] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Your Cart
            {cartItems.length > 0 && (
              <Badge variant="secondary">{cartItems.length}</Badge>
            )}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden">
          {!canAccess && (
            <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                {getAccessMessage()}
              </p>
            </div>
          )}

          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ShoppingCart className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">Your cart is empty</h3>
              <p className="text-muted-foreground text-sm">
                Add items from the menu to get started
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <ScrollArea className="flex-1 max-h-[300px]">
                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex gap-3 pb-4 border-b last:border-0">
                      {item.image_url && (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded-md"
                        />
                      )}
                      
                      <div className="flex-1">
                        <h4 className="font-medium">{item.name}</h4>
                        
                        {/* Modifiers */}
                        {item.modifiers?.meat && (
                          <p className="text-xs text-muted-foreground">
                            Meat: {item.modifiers.meat.name}
                          </p>
                        )}
                        {item.modifiers?.sauces && item.modifiers.sauces.length > 0 && (
                          <p className="text-xs text-muted-foreground">
                            Sauces: {item.modifiers.sauces.map(s => s.name).join(', ')}
                          </p>
                        )}
                        
                        {item.notes && (
                          <p className="text-xs text-muted-foreground italic">
                            &quot;{item.notes}&quot;
                          </p>
                        )}
                        
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="font-medium w-8 text-center">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              ${calculateItemTotal(item).toFixed(2)}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => removeItem(item.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <Separator />

              {/* Order Notes */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Order Notes (Optional)
                </label>
                <Textarea
                  placeholder="Any special requests or dietary notes..."
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  className="resize-none"
                  rows={3}
                />
              </div>
            </div>
          )}
        </CardContent>

        {cartItems.length > 0 && (
          <CardFooter className="flex flex-col gap-4">
            <div className="flex justify-between items-center w-full text-lg font-bold">
              <span>Total:</span>
              <span>${cartTotal.toFixed(2)}</span>
            </div>
            
            <div className="flex gap-2 w-full">
              <Button
                variant="outline"
                onClick={clearCart}
                className="flex-1"
              >
                Clear Cart
              </Button>
              <Button
                onClick={handleCheckout}
                disabled={!canAccess || isChecking}
                className="flex-1"
              >
                {isChecking ? "Placing Order..." : "Checkout"}
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}

// Hook to manage cart state globally
export function useCart() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const { user } = useAuth();

  // Load cart from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && user) {
      const savedCart = localStorage.getItem(`cart_${user.id}`);
      if (savedCart) {
        try {
          setCartItems(JSON.parse(savedCart));
        } catch (error) {
          console.error('Error loading cart:', error);
          localStorage.removeItem(`cart_${user.id}`);
        }
      }
    }
  }, [user]);

  // Save cart to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && user) {
      localStorage.setItem(`cart_${user.id}`, JSON.stringify(cartItems));
    }
  }, [cartItems, user]);

  // Add item to cart
  const addToCart = (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
    const quantity = item.quantity || 1;
    const itemId = `${item.id}_${JSON.stringify(item.modifiers || {})}`;

    setCartItems(prev => {
      const existingItem = prev.find(cartItem => cartItem.id === itemId);
      
      if (existingItem) {
        return prev.map(cartItem =>
          cartItem.id === itemId
            ? { ...cartItem, quantity: cartItem.quantity + quantity }
            : cartItem
        );
      } else {
        return [...prev, { ...item, id: itemId, quantity }];
      }
    });

    toast({
      title: "Added to Cart",
      description: `${item.name} has been added to your cart`,
    });
  };

  // Get cart item count
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Calculate cart total
  const cartTotal = cartItems.reduce((sum, item) => {
    let itemTotal = item.price;
    
    if (item.modifiers?.meat?.price_adjustment) {
      itemTotal += item.modifiers.meat.price_adjustment;
    }
    
    if (item.modifiers?.sauces) {
      itemTotal += item.modifiers.sauces.reduce((sauceSum, sauce) => sauceSum + (sauce.price_adjustment || 0), 0);
    }
    
    return sum + (itemTotal * item.quantity);
  }, 0);

  return {
    cartItems,
    cartCount,
    cartTotal,
    addToCart,
    setCartItems
  };
}
