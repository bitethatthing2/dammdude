"use client";

import { useBartenderCart } from '@/lib/hooks/useBartenderCart';
import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Minus, Plus, Trash2, Clock } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';
import { NotificationIndicator } from '@/components/unified/notifications/NotificationIndicator';
import { OrderConfirmation } from '@/components/bartap/OrderConfirmation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from '@/components/ui/use-toast';
import { useBarTap } from '@/lib/contexts/bartap-context';

interface TableData {
  id: string;
  name: string;
  section?: string;
}

interface CheckoutFormProps {
  tableData: TableData;
}

// CartItem interface that matches the actual database structure
interface CartItem {
  id: string; // This is the food_drink_items.id
  name: string;
  price: number;
  quantity: number;
  category_id?: string | null; // Corrected from menu_category_id
  description?: string | null;
  is_available?: boolean;
}

// Order cooldown configuration
const ORDER_COOLDOWN_MINUTES = 5;
const ORDER_COOLDOWN_MS = ORDER_COOLDOWN_MINUTES * 60 * 1000;

export function CheckoutForm({ tableData }: CheckoutFormProps) {
  const { 
    getItems, 
    updateQuantity, 
    removeItem, 
    clearCart, 
    getTotalPrice,
    isLoading,
  } = useBartenderCart();
  
  const items = getItems() as CartItem[];
  
  // State management
  const [itemNotes, setItemNotes] = useState<Record<string, string>>({});
  const [orderNotes, setOrderNotes] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [supabaseClient, setSupabaseClient] = useState<ReturnType<typeof createClient> | null>(null);
  
  // Order throttling
  const [lastOrderTime, setLastOrderTime] = useState<number | null>(() => {
    // Retrieve last order time from sessionStorage
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('lastOrderTime');
      return saved ? parseInt(saved, 10) : null;
    }
    return null;
  });
  
  // Get BarTap context
  const barTap = useBarTap();
  
  // Initialize Supabase client
  useEffect(() => {
    setSupabaseClient(createClient());
  }, []);
  
  // Save last order time to sessionStorage
  useEffect(() => {
    if (lastOrderTime && typeof window !== 'undefined') {
      sessionStorage.setItem('lastOrderTime', lastOrderTime.toString());
    }
  }, [lastOrderTime]);
  
  // Calculate if user can place new order
  const canPlaceNewOrder = useMemo(() => {
    if (!lastOrderTime) return true;
    return (Date.now() - lastOrderTime) > ORDER_COOLDOWN_MS;
  }, [lastOrderTime]);
  
  const timeUntilNextOrder = useMemo(() => {
    if (!lastOrderTime || canPlaceNewOrder) return 0;
    return Math.ceil((ORDER_COOLDOWN_MS - (Date.now() - lastOrderTime)) / 60000);
  }, [lastOrderTime, canPlaceNewOrder]);
  
  // Calculate totals
  const subtotal = getTotalPrice();
  const totalPrice = subtotal - discount;
  
  // Helper functions
  const updateNotes = (itemId: string, notes: string) => {
    setItemNotes(prev => ({ ...prev, [itemId]: notes }));
  };
  
  const applyPromoCode = () => {
    const code = promoCode.trim().toUpperCase();
    
    // Simple promo code logic - expand as needed
    switch (code) {
      case 'SAVE10':
        setDiscount(subtotal * 0.1);
        toast({
          title: "Promo Applied!",
          description: "10% discount has been applied to your order.",
        });
        break;
      case 'HAPPY':
        setDiscount(subtotal * 0.15);
        toast({
          title: "Promo Applied!",
          description: "Happy Hour! 15% discount has been applied.",
        });
        break;
      default:
        toast({
          title: "Invalid Code",
          description: "The promo code you entered is not valid.",
          variant: "destructive",
        });
        setDiscount(0);
    }
  };
  
  const removePromoCode = () => {
    setPromoCode('');
    setDiscount(0);
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (items.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Please add items to your cart before placing an order.",
        variant: "destructive",
      });
      return;
    }
    
    if (!canPlaceNewOrder) {
      toast({
        title: "Order Too Soon",
        description: `Please wait ${timeUntilNextOrder} minute${timeUntilNextOrder === 1 ? '' : 's'} before placing another order.`,
        variant: "destructive",
      });
      return;
    }
    
    if (!supabaseClient) {
      toast({
        title: "Error",
        description: "Unable to connect to the server. Please try again.",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Create the order
      const { data: orderData, error: orderError } = await supabaseClient
        .from('orders')
        .insert({
          table_id: tableData.id,
          status: 'pending',
          customer_notes: orderNotes || null,
          total_price: totalPrice,
        })
        .select()
        .single();
      
      if (orderError) {
        console.error('Error creating order:', orderError);
        throw new Error(`Failed to create order: ${orderError.message}`);
      }
      
      if (!orderData || !orderData.id) {
        throw new Error('Order created but no data returned');
      }
      
      // Create order items
      const orderItems = items.map(item => ({
        order_id: orderData.id,
        item_id: item.id,
        quantity: item.quantity,
        price_at_order: item.price,
        item_name: item.name,
        notes: itemNotes[item.id] || null,
        customizations: {} // Empty for now, can be expanded later
      }));
      
      const { error: itemsError } = await supabaseClient
        .from('order_items')
        .insert(orderItems);
      
      if (itemsError) {
        console.error('Error creating order items:', itemsError);
        // Attempt to delete the order if items fail
        await supabaseClient
          .from('orders')
          .delete()
          .eq('id', orderData.id);
        throw new Error(`Failed to create order items: ${itemsError.message}`);
      }
      
      // Success! Update state
      setLastOrderTime(Date.now());
      setOrderId(orderData.id);
      
      // Clear carts
      clearCart();
      if (barTap) {
        barTap.clearCart();
      }
      
      // Show success notification
      toast({
        title: "Order Placed Successfully!",
        description: "Your order has been received. We'll notify you when it's ready!",
      });
      
      // Try to show browser notification
      if ('Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification('Order Placed', {
            body: 'Your order has been received. We\'ll notify you when it\'s ready!',
            icon: '/icons/icon-192x192.png',
          });
        } catch (error) {
          console.log('Notification failed:', error);
        }
      }
      
      // Try to play success sound
      try {
        const audio = new Audio('/sounds/notification.mp3');
        audio.volume = 0.5;
        await audio.play();
      } catch (error) {
        console.log('Audio playback failed:', error);
      }
      
    } catch (error) {
      console.error('Error submitting order:', error);
      toast({
        title: "Order Failed",
        description: error instanceof Error ? error.message : "There was a problem submitting your order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Show order confirmation if order was placed
  if (orderId) {
    return <OrderConfirmation orderId={orderId} tableData={tableData} />;
  }
  
  // Show empty cart state
  if (items.length === 0) {
    return (
      <Card className="bg-muted/30">
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground mb-4">Your cart is empty</p>
          <Link href="/menu">
            <Button className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Menu
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }
  
  // Main checkout form
  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        {/* Order cooldown warning */}
        {!canPlaceNewOrder && (
          <Alert className="bg-amber-50 border-amber-200">
            <Clock className="h-4 w-4" />
            <AlertTitle>Order Cooldown Period</AlertTitle>
            <AlertDescription>
              Please wait {timeUntilNextOrder} more {timeUntilNextOrder === 1 ? 'minute' : 'minutes'} before placing another order.
            </AlertDescription>
          </Alert>
        )}
        
        {/* Cart items */}
        <Card>
          <CardHeader className="pb-2">
            <h2 className="font-semibold">Your Items</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.map(item => (
              <div key={item.id} className="flex flex-col pb-4 border-b last:border-0 last:pb-0">
                <div className="flex justify-between mb-1">
                  <div className="flex-1">
                    <p className="font-medium">{item.name}</p>
                    {item.description && (
                      <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                    )}
                  </div>
                  <p className="font-medium ml-4">{formatCurrency(item.price * item.quantity)}</p>
                </div>
                
                <div className="flex items-center gap-2 mb-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => updateQuantity(item.id, Math.max(0, item.quantity - 1))}
                    disabled={isLoading}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  
                  <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                  
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    disabled={isLoading}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                  
                  <span className="text-sm text-muted-foreground ml-2">
                    @ {formatCurrency(item.price)} each
                  </span>
                  
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 ml-auto text-destructive"
                    onClick={() => removeItem(item.id)}
                    disabled={isLoading}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                
                {/* Item notes */}
                <Textarea
                  placeholder="Special instructions for this item..."
                  value={itemNotes[item.id] || ''}
                  onChange={(e) => updateNotes(item.id, e.target.value)}
                  className="text-sm min-h-[60px]"
                />
              </div>
            ))}
          </CardContent>
        </Card>
        
        {/* Order notes */}
        <div className="space-y-2">
          <Label htmlFor="orderNotes">Order Notes</Label>
          <Textarea
            id="orderNotes"
            placeholder="Any special instructions for your entire order..."
            value={orderNotes}
            onChange={(e) => setOrderNotes(e.target.value)}
            className="min-h-[80px]"
          />
        </div>
        
        {/* Promo code */}
        {discount === 0 && (
          <div className="space-y-2">
            <Label htmlFor="promoCode">Promo Code</Label>
            <div className="flex gap-2">
              <Input
                id="promoCode"
                placeholder="Enter promo code"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
              />
              <Button 
                variant="outline" 
                type="button" 
                onClick={applyPromoCode}
                disabled={!promoCode.trim()}
              >
                Apply
              </Button>
            </div>
          </div>
        )}
        
        {/* Enable notifications */}
        <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg">
          <div>
            <h3 className="font-medium">Order Notifications</h3>
            <p className="text-sm text-muted-foreground">
              Get notified when your order is ready
            </p>
          </div>
          <NotificationIndicator variant="outline" />
        </div>
        
        {/* Order summary */}
        <div className="sticky bottom-0 bg-background border-t pt-4 space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            
            {discount > 0 && (
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Discount</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={removePromoCode}
                  >
                    Remove
                  </Button>
                </div>
                <span className="text-green-600">-{formatCurrency(discount)}</span>
              </div>
            )}
            
            <div className="flex justify-between font-bold text-lg pt-2 border-t">
              <span>Total</span>
              <span>{formatCurrency(totalPrice)}</span>
            </div>
          </div>
          
          <div className="flex gap-4">
            <Link href="/menu" className="flex-1">
              <Button variant="outline" className="w-full" type="button">
                Back to Menu
              </Button>
            </Link>
            
            <Button
              type="submit"
              className="flex-1"
              disabled={isSubmitting || items.length === 0 || !canPlaceNewOrder || isLoading}
            >
              {isSubmitting ? 'Placing Order...' : 'Place Order'}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}