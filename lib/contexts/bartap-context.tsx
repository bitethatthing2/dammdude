"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

// Define types for cart items
export interface BarTapCartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
  image_url?: string | null;
  description?: string | null;
  category_id?: string | null;
  available?: boolean;
  customizations?: {
    meatType?: string;
    extras?: string[];
    preferences?: string[];
  };
}

// Define the flow steps
export type BarTapFlowStep = 'table' | 'menu' | 'checkout' | 'confirmation';

// Define the context type
interface BarTapContextType {
  tableId: string | null;
  cartItems: BarTapCartItem[];
  flowStep: BarTapFlowStep;
  setTableId: (id: string) => void;
  addToCart: (item: Omit<BarTapCartItem, 'quantity'>) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  proceedToCheckout: () => void;
  resetFlow: () => void;
  totalItems: number;
  totalPrice: number;
  updateNotes: (id: string, notes: string) => void;
  updateCustomizations: (id: string, customizations: BarTapCartItem['customizations']) => void;
}

// Create the context
const BarTapContext = createContext<BarTapContextType | undefined>(undefined);

// Provider component
export function BarTapProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  
  // State
  const [tableId, setTableIdState] = useState<string | null>(null);
  const [cartItems, setCartItems] = useState<BarTapCartItem[]>([]);
  const [flowStep, setFlowStep] = useState<BarTapFlowStep>('table');
  
  // Initialize from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Get table ID from localStorage
    const storedTableId = localStorage.getItem('table_id');
    if (storedTableId) {
      setTableIdState(storedTableId);
      setFlowStep('menu');
    }
    
    // Get cart items from localStorage
    const storedCart = localStorage.getItem('bartap_cart');
    if (storedCart) {
      try {
        const parsedCart = JSON.parse(storedCart);
        if (Array.isArray(parsedCart) && parsedCart.length > 0) {
          setCartItems(parsedCart);
        }
      } catch (error) {
        console.error('Error parsing stored cart:', error);
      }
    }
  }, []);
  
  // Update localStorage when state changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    if (tableId) {
      localStorage.setItem('table_id', tableId);
    }
    
    if (cartItems.length > 0) {
      localStorage.setItem('bartap_cart', JSON.stringify(cartItems));
    } else {
      localStorage.removeItem('bartap_cart');
    }
  }, [tableId, cartItems]);
  
  // Set table ID and advance to menu
  const setTableId = (id: string) => {
    setTableIdState(id);
    setFlowStep('menu');
  };
  
  // Add item to cart
  const addToCart = (item: Omit<BarTapCartItem, 'quantity'>) => {
    setCartItems(prev => {
      const existingItem = prev.find(i => i.id === item.id);
      
      if (existingItem) {
        // Update quantity if item already exists
        return prev.map(i => 
          i.id === item.id 
            ? { ...i, quantity: i.quantity + 1 } 
            : i
        );
      } else {
        // Add new item with quantity 1
        return [...prev, { ...item, quantity: 1 }];
      }
    });
  };
  
  // Update item quantity
  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      // Remove item if quantity is 0 or less
      removeFromCart(id);
      return;
    }
    
    setCartItems(prev => 
      prev.map(item => 
        item.id === id 
          ? { ...item, quantity } 
          : item
      )
    );
  };
  
  // Remove item from cart
  const removeFromCart = (id: string) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };
  
  // Clear cart
  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem('bartap_cart');
  };
  
  // Update item notes
  const updateNotes = (id: string, notes: string) => {
    setCartItems(prev => 
      prev.map(item => 
        item.id === id 
          ? { ...item, notes } 
          : item
      )
    );
  };
  
  // Update item customizations
  const updateCustomizations = (id: string, customizations: BarTapCartItem['customizations']) => {
    setCartItems(prev => 
      prev.map(item => 
        item.id === id 
          ? { ...item, customizations } 
          : item
      )
    );
  };
  
  // Proceed to checkout
  const proceedToCheckout = () => {
    if (!tableId) {
      // Redirect to table entry if no table ID
      router.push('/table');
      return;
    }
    
    if (cartItems.length === 0) {
      // Can't checkout with empty cart
      return;
    }
    
    setFlowStep('checkout');
    router.push('/checkout');
  };
  
  // Reset flow
  const resetFlow = () => {
    setTableIdState(null);
    setCartItems([]);
    setFlowStep('table');
    localStorage.removeItem('table_id');
    localStorage.removeItem('bartap_cart');
  };
  
  // Calculate total items
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  
  // Calculate total price
  const totalPrice = cartItems.reduce(
    (sum, item) => sum + (item.price * item.quantity), 
    0
  );
  
  // Context value
  const value: BarTapContextType = {
    tableId,
    cartItems,
    flowStep,
    setTableId,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    proceedToCheckout,
    resetFlow,
    totalItems,
    totalPrice,
    updateNotes,
    updateCustomizations
  };
  
  return (
    <BarTapContext.Provider value={value}>
      {children}
    </BarTapContext.Provider>
  );
}

// Custom hook to use the BarTap context
export function useBarTap() {
  const context = useContext(BarTapContext);
  
  if (context === undefined) {
    throw new Error('useBarTap must be used within a BarTapProvider');
  }
  
  return context;
}
