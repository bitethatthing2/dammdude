"use client";

import { useCart } from '@/components/bartap/CartContext';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Minus, Plus, Trash2, Clock, AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';
import { NotificationIndicator } from '@/components/shared/NotificationIndicator';
import { OrderConfirmation } from '@/components/bartap/OrderConfirmation';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from '@/components/ui/use-toast';
import { useNotifications } from '@/components/shared/notification-provider';
import { useBarTap } from '@/lib/contexts/bartap-context';
import { useRouter } from 'next/navigation';

interface TableData {
  id: string;
  name: string;
  section?: string;
}

interface CheckoutFormProps {
  tableData: TableData;
}

// Meat type options for applicable items
const MEAT_TYPES = [
  { value: 'beef', label: 'Beef' },
  { value: 'chicken', label: 'Chicken' },
  { value: 'pork', label: 'Pork' },
  { value: 'shrimp', label: 'Shrimp' },
  { value: 'fish', label: 'Fish' },
  { value: 'vegetarian', label: 'Vegetarian' }
];

// Extra options that can be added
const EXTRA_OPTIONS = [
  { id: 'extra_sauce', label: 'Extra Sauce', price: 0.75 },
  { id: 'extra_cheese', label: 'Extra Cheese', price: 1.50 },
  { id: 'extra_meat', label: 'Extra Meat', price: 2.50 },
  { id: 'extra_avocado', label: 'Add Avocado', price: 1.50 }
];

// Preference options
const PREFERENCE_OPTIONS = [
  { id: 'spicy', label: 'Make it Spicy' },
  { id: 'mild', label: 'Make it Mild' },
  { id: 'no_onions', label: 'No Onions' },
  { id: 'no_cilantro', label: 'No Cilantro' },
  { id: 'gluten_free', label: 'Gluten Free (when possible)' }
];

// Categories that might have meat options
const MEAT_OPTION_CATEGORIES = ['Birria Specialties', 'Main Dishes', 'Small Bites'];

export function CheckoutForm({ tableData }: CheckoutFormProps) {
  const { 
    items, 
    updateQuantity, 
    removeItem, 
    updateNotes, 
    updateCustomizations,
    totalPrice, 
    clearCart, 
    discount, 
    deliveryFee, 
    grandTotal,
    promoCode,
    applyPromoCode,
    removePromoCode,
    canPlaceNewOrder,
    timeUntilNextOrder,
    setLastOrderTime
  } = useCart();
  
  // Get BarTap context
  const barTap = useBarTap();
  const router = useRouter();
  
  const [newPromoCode, setNewPromoCode] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const supabase = createClient();
  
  // If no items in cart, show empty state
  if (items.length === 0 && !orderId) {
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
  
  // If order was placed successfully, show confirmation
  if (orderId) {
    return <OrderConfirmation orderId={orderId} tableData={tableData} />;
  }
  
  // Toggle expanded item for customization
  const toggleItemExpansion = (itemId: string) => {
    if (expandedItem === itemId) {
      setExpandedItem(null);
    } else {
      setExpandedItem(itemId);
    }
  };
  
  // Check if an item should have meat options based on its category
  const shouldShowMeatOptions = (item: any) => {
    return item.category_id && MEAT_OPTION_CATEGORIES.includes(item.category_id);
  };
  
  // Handle meat type selection
  const handleMeatTypeChange = (itemId: string, meatType: string) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;
    
    const currentCustomizations = item.customizations || {};
    updateCustomizations(itemId, {
      ...currentCustomizations,
      meatType
    });
  };
  
  // Handle extra option toggle
  const handleExtraToggle = (itemId: string, extraId: string, isChecked: boolean) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;
    
    const currentCustomizations = item.customizations || {};
    const currentExtras = currentCustomizations.extras || [];
    
    let newExtras;
    if (isChecked) {
      newExtras = [...currentExtras, extraId];
    } else {
      newExtras = currentExtras.filter(id => id !== extraId);
    }
    
    updateCustomizations(itemId, {
      ...currentCustomizations,
      extras: newExtras
    });
  };
  
  // Handle preference toggle
  const handlePreferenceToggle = (itemId: string, preferenceId: string, isChecked: boolean) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;
    
    const currentCustomizations = item.customizations || {};
    const currentPreferences = currentCustomizations.preferences || [];
    
    let newPreferences;
    if (isChecked) {
      newPreferences = [...currentPreferences, preferenceId];
    } else {
      newPreferences = currentPreferences.filter(id => id !== preferenceId);
    }
    
    updateCustomizations(itemId, {
      ...currentCustomizations,
      preferences: newPreferences
    });
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate order
    if (items.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Please add items to your cart before placing an order.",
        variant: "destructive",
      });
      return;
    }
    
    // Check if user can place a new order (time-based throttling)
    if (!canPlaceNewOrder) {
      toast({
        title: "Order Too Soon",
        description: `Please wait ${timeUntilNextOrder} before placing another order.`,
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      console.log('Submitting order for table:', tableData);
      
      // Create the order in the database
      const orderPayload = {
        table_id: tableData.id,
        status: 'pending',
        customer_notes: orderNotes,
        total_price: grandTotal,
      };
      
      console.log('Order payload:', orderPayload);
      
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert(orderPayload)
        .select()
        .single();
      
      if (orderError) {
        console.error('Error creating order:', orderError);
        console.error('Order payload that failed:', orderPayload);
        throw new Error(`Failed to create order: ${orderError.message || JSON.stringify(orderError)}`);
      }
      
      if (!orderData || !orderData.id) {
        console.error('Order created but no data returned');
        throw new Error('Order created but no data returned');
      }
      
      console.log('Order created successfully:', orderData);
      
      // Create order items
      const orderItems = items.map(item => {
        const orderItem = {
          order_id: orderData.id,
          item_id: item.id,
          quantity: item.quantity,
          item_name: item.name || '',
          modifiers: item.customizations ? JSON.stringify(item.customizations) : null,
          price_at_order: item.price,
        };
        return orderItem;
      });
      
      console.log('Order items payload:', orderItems);
      
      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)
        .select();
      
      if (itemsError) {
        console.error('Error creating order items:', itemsError);
        console.error('Order items payload that failed:', orderItems);
        throw new Error(`Failed to create order items: ${itemsError.message || JSON.stringify(itemsError)}`);
      }
      
      console.log('Order items created successfully:', itemsData);
      
      // Create a notification in the database for staff
      const notificationPayload = {
        message: `Order #${orderData.id.slice(-6).toUpperCase()} from Table ${tableData.name}`,
        recipient_id: 'staff', // Using a default recipient ID for staff notifications
        notification_type: 'order', // Changed from 'type' to 'notification_type'
        status: 'unread'
      };
      
      console.log('Notification payload:', notificationPayload);
      
      const { data: notificationData, error: notificationError } = await supabase
        .from('notifications')
        .insert(notificationPayload)
        .select();
      
      if (notificationError) {
        console.error('Error creating notification:', notificationError);
        console.error('Notification payload that failed:', notificationPayload);
        // Don't throw here, just log the error as notifications are not critical
      } else {
        console.log('Notification created successfully:', notificationData);
      }
      
      // Set the last order time
      setLastOrderTime(Date.now());
      
      // Clear the cart
      clearCart();
      
      // Also clear the BarTap context cart if available
      if (barTap) {
        barTap.clearCart();
      }
      
      // Set the order ID for confirmation
      setOrderId(orderData.id);
      
      // Show success toast notification
      toast({
        title: "Order Placed Successfully!",
        description: "Your order has been received. We'll notify you when it's ready!",
        variant: "default",
      });
      
      // Show notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Order Placed', {
          body: 'Your order has been received. We\'ll notify you when it\'s ready!',
          icon: '/icons/icon-192x192.png',
        });
      }
      
      // Play notification sound
      playNotificationSound();
      
    } catch (error) {
      console.error('Error submitting order:', error);
      toast({
        title: "Order Failed",
        description: "There was a problem submitting your order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Play notification sound
  const playNotificationSound = () => {
    try {
      const audio = new Audio('/sounds/notification.mp3');
      audio.volume = 0.5; // Set volume to 50%
      audio.play().catch(e => console.error("Audio play failed:", e));
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        {/* Time restriction warning */}
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
                  <p className="font-medium">{item.name}</p>
                  <p className="font-medium">{formatCurrency(item.price * item.quantity)}</p>
                </div>
                
                <div className="flex items-center gap-2 mb-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  
                  <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                  
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                  
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 ml-auto text-destructive"
                    onClick={() => removeItem(item.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                
                {/* Customization button */}
                <Button
                  type="button"
                  variant="ghost"
                  className="text-sm justify-start mb-2"
                  onClick={() => toggleItemExpansion(item.id)}
                >
                  {expandedItem === item.id ? 'Hide Customizations' : 'Customize Item'}
                </Button>
                
                {/* Expanded customization options */}
                {expandedItem === item.id && (
                  <div className="space-y-4 mb-4 pl-2 border-l-2 border-primary/20">
                    {/* Meat type selection for applicable items */}
                    {shouldShowMeatOptions(item) && (
                      <div className="space-y-2">
                        <Label htmlFor={`meat-${item.id}`}>Meat Selection</Label>
                        <Select
                          value={item.customizations?.meatType || ''}
                          onValueChange={(value) => handleMeatTypeChange(item.id, value)}
                        >
                          <SelectTrigger id={`meat-${item.id}`}>
                            <SelectValue placeholder="Select meat type" />
                          </SelectTrigger>
                          <SelectContent>
                            {MEAT_TYPES.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    
                    {/* Extra options */}
                    <div className="space-y-2">
                      <Label>Add Extras</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {EXTRA_OPTIONS.map((option) => (
                          <div key={option.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`${option.id}-${item.id}`}
                              checked={item.customizations?.extras?.includes(option.id) || false}
                              onCheckedChange={(checked: boolean | 'indeterminate') => 
                                handleExtraToggle(item.id, option.id, checked === true)
                              }
                            />
                            <Label htmlFor={`${option.id}-${item.id}`} className="text-sm">
                              {option.label} (+{formatCurrency(option.price)})
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Preferences */}
                    <div className="space-y-2">
                      <Label>Preferences</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {PREFERENCE_OPTIONS.map((option) => (
                          <div key={option.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`${option.id}-${item.id}`}
                              checked={item.customizations?.preferences?.includes(option.id) || false}
                              onCheckedChange={(checked: boolean | 'indeterminate') => 
                                handlePreferenceToggle(item.id, option.id, checked === true)
                              }
                            />
                            <Label htmlFor={`${option.id}-${item.id}`} className="text-sm">
                              {option.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Special instructions */}
                <Textarea
                  placeholder="Special instructions..."
                  value={item.notes || ''}
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
        
        {/* Promo code entry */}
        <div className="space-y-2">
          <Label htmlFor="promoCode">Promo Code</Label>
          <div className="flex gap-2">
            <Input
              id="promoCode"
              placeholder="Enter promo code"
              value={newPromoCode}
              onChange={(e) => setNewPromoCode(e.target.value)}
              disabled={!!promoCode}
            />
            {promoCode ? (
              <Button 
                variant="outline" 
                type="button" 
                onClick={() => removePromoCode()}
              >
                Remove
              </Button>
            ) : (
              <Button 
                variant="outline" 
                type="button" 
                onClick={() => {
                  if (newPromoCode.trim()) {
                    applyPromoCode(newPromoCode);
                    setNewPromoCode('');
                  }
                }}
              >
                Apply
              </Button>
            )}
          </div>
        </div>
        
        {/* Enable notifications */}
        <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg">
          <div>
            <h3 className="font-medium">Order Notifications</h3>
            <p className="text-sm text-muted-foreground">
              Get notified when your order is ready
            </p>
          </div>
          <NotificationIndicator variant="button" />
        </div>
        
        {/* Summary and actions */}
        <div className="sticky bottom-0 bg-background border-t pt-4 space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(totalPrice)}</span>
            </div>
            
            {deliveryFee > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery</span>
                <span>{formatCurrency(deliveryFee)}</span>
              </div>
            )}
            
            {discount > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Discount</span>
                <span className="text-green-600">-{formatCurrency(discount)}</span>
              </div>
            )}
            
            <div className="flex justify-between font-bold text-lg pt-2 border-t">
              <span>Total</span>
              <span>{formatCurrency(grandTotal)}</span>
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
              disabled={isSubmitting || items.length === 0 || !canPlaceNewOrder}
            >
              {isSubmitting ? 'Submitting...' : 'Place Order'}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
