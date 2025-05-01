'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCartState } from '@/lib/hooks/useCartState';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { ShoppingCart } from 'lucide-react';
import { Minus, Plus } from 'lucide-react';

export default function OrderDetailsPage() {
  const router = useRouter();
  const { items, updateQuantity, getTotalPrice, clearCart } = useCartState();
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [tableNumber, setTableNumber] = useState<string>('1');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Get table number from localStorage if available
  useEffect(() => {
    const storedTable = localStorage.getItem('tableNumber');
    if (storedTable) {
      setTableNumber(storedTable);
    }
  }, []);
  
  // Handle back button
  const handleBack = () => {
    router.back();
  };
  
  // Handle promo code application
  const applyPromoCode = () => {
    if (promoCode.trim()) {
      // In a real app, you'd validate this against a database
      // For now, just simulate a discount
      setDiscount(Math.round(getTotalPrice() * 0.1 * 100) / 100);
    }
  };
  
  // Handle checkout process
  const handleCheckout = async () => {
    if (items.length === 0) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      const supabase = getSupabaseBrowserClient();
      
      // Load table number from localStorage or use default
      const savedTableNumber = localStorage.getItem('tableNumber') || '1';
      
      // Format items for the database
      const formattedItems = items.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image_url: item.image_url || null
      }));
      
      // Create order in database
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          table_id: savedTableNumber,
          location: 'main-bar', // Default location
          items: formattedItems,
          status: 'pending',
          total_amount: getTotalPrice() + deliveryFee - discount,
          notes: null,
          metadata: {
            delivery_fee: deliveryFee,
            discount: discount,
            promo_code: promoCode || null
          }
        })
        .select()
        .single();
        
      if (orderError) {
        console.error('Error creating order:', orderError);
        throw orderError;
      }
      
      // Create order items
      const orderItems = items.map(item => ({
        order_id: order.id,
        menu_item_id: parseInt(item.id),
        quantity: item.quantity,
        price: item.price,
        name: item.name,
        options: null // could be added for special requests
      }));
      
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);
        
      if (itemsError) {
        console.error('Error adding order items:', itemsError);
        throw itemsError;
      }
      
      // Subscribe to changes on this order for notifications
      const subscription = supabase
        .channel(`order-${order.id}`)
        .on('postgres_changes', { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'orders',
          filter: `id=eq.${order.id}`
        }, (payload: { new: any; old: any }) => {
          // This will be handled by the confirmation page
          console.log('Order status updated:', payload.new.status);
        })
        .subscribe();
      
      // Clear cart and show confirmation
      clearCart();
      
      // Store order info for confirmation page
      localStorage.setItem('lastOrderId', order.id.toString());
      localStorage.setItem('lastOrderTime', new Date().toISOString());
      
      // Navigate to confirmation page
      router.push(`/menu/confirmation?orderId=${order.id}`);
      
    } catch (error) {
      console.error('Error placing order:', error);
      // In a real app, you'd show a proper error message to the user
      alert('There was a problem placing your order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Calculate subtotal
  const subtotal = getTotalPrice();
  const total = subtotal + deliveryFee - discount;
  
  // Increment item quantity
  const incrementQuantity = (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (item) {
      updateQuantity(itemId, item.quantity + 1);
    }
  };
  
  // Decrement item quantity
  const decrementQuantity = (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (item && item.quantity > 1) {
      updateQuantity(itemId, item.quantity - 1);
    }
  };
  
  return (
    <div className="max-w-md mx-auto min-h-screen pb-20 bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border p-4 flex items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBack}
          className="mr-2"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold flex-1 text-center pr-8">Order Details</h1>
      </div>
      
      {/* Order Items */}
      <div className="px-4 py-3">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
            <ShoppingCart className="h-12 w-12 mb-4 text-muted-foreground/50" />
            <p>Your cart is empty</p>
            <Button 
              onClick={handleBack} 
              variant="default"
              className="mt-4"
            >
              Add Items
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map(item => (
              <div key={item.id} className="bg-card p-3 rounded-lg border-border border">
                <div className="flex gap-3">
                  {/* Item image */}
                  <div className="w-16 h-16 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                    {item.image_url ? (
                      <Image
                        src={item.image_url}
                        alt={item.name}
                        width={64}
                        height={64}
                        className="object-cover h-full w-full"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/placeholder-image.webp';
                        }}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <span className="text-xl">🥤</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Item details */}
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <h3 className="font-medium text-sm">{item.name}</h3>
                    </div>
                    <div className="flex items-center mt-1">
                      <div className="flex items-center text-amber-500 text-xs">
                        ★★★★★
                        <span className="ml-1 text-xs text-muted-foreground">4.9</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <div className="flex items-center border border-border rounded-full">
                        <Button
                          onClick={() => decrementQuantity(item.id)}
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 p-0 rounded-full"
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-5 text-xs font-medium text-center">{item.quantity}</span>
                        <Button
                          onClick={() => incrementQuantity(item.id)}
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 p-0 rounded-full"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold text-sm">Price: ${(item.price ?? 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Separator */}
      <div className="h-3 border-b border-t border-dashed border-border mx-4"></div>
      
      {/* Promo Code */}
      <div className="px-4 py-3">
        <div className="flex space-x-2">
          <Input
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value)}
            placeholder="Enter Promo Code"
            className="flex-1 bg-muted/30 text-sm"
          />
          <Button 
            onClick={applyPromoCode} 
            className="bg-amber-400 border-amber-400 text-amber-950 hover:bg-amber-500 hover:border-amber-500 hover:text-amber-950"
          >
            Apply
          </Button>
        </div>
      </div>
      
      {/* Separator */}
      <div className="h-3 border-b border-t border-dashed border-border mx-4"></div>
      
      {/* Order Summary */}
      <div className="px-4 py-3 space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Subtotal:</span>
          <span className="text-sm font-medium">${subtotal.toFixed(2)}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Delivery:</span>
          <span className="text-sm font-medium">${deliveryFee.toFixed(2)}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Discount:</span>
          <span className="text-sm font-medium text-green-600">-${discount.toFixed(2)}</span>
        </div>
        
        {/* Total row with larger text */}
        <div className="flex justify-between items-center pt-2 border-t border-border">
          <span className="font-semibold">Total:</span>
          <span className="font-bold text-lg">${total.toFixed(2)}</span>
        </div>
      </div>
      
      {/* Checkout Button - Fixed at bottom */}
      {items.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border">
          <Button 
            onClick={handleCheckout}
            className="w-full py-6 text-base bg-primary hover:bg-primary/90"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Processing...' : 'Process to Checkout'}
          </Button>
          <p className="text-xs text-center text-muted-foreground mt-2">
            Your order will be sent to the bar for processing
          </p>
        </div>
      )}
    </div>
  );
}
