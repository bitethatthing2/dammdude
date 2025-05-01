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

// Create the context with a default undefined value
const BarTapContext = createContext<BarTapContextType | undefined>(undefined);

// Provider component
export function BarTapProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  
  // Initialize state from localStorage if available
  const [tableId, setTableIdState] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('table_id');
    }
    return null;
  });
  
  const [cartItems, setCartItems] = useState<BarTapCartItem[]>([]);
  const [flowStep, setFlowStep] = useState<BarTapFlowStep>('table');
  
  // Sync tableId with localStorage and cookie whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined' && tableId) {
      console.log('[BarTapContext] Syncing tableId to storage:', tableId);
      localStorage.setItem('table_id', tableId);
      document.cookie = `table_id=${tableId}; path=/; max-age=${60 * 60 * 24}; SameSite=Lax`;
    }
  }, [tableId]);
  
  // Set table ID and sync with storage
  const setTableId = (id: string) => {
    console.log('[BarTapContext] Setting tableId:', id);
    setTableIdState(id);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('table_id', id);
      document.cookie = `table_id=${id}; path=/; max-age=${60 * 60 * 24}; SameSite=Lax`;
    }
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
    console.log('[BarTapContext] proceedToCheckout called, tableId:', tableId);
    console.log('[BarTapContext] localStorage table_id:', localStorage.getItem('table_id'));
    
    if (!tableId) {
      // Try to get table ID from localStorage before redirecting
      const storedTableId = localStorage.getItem('table_id');
      console.log('[BarTapContext] No tableId in context, found in localStorage:', storedTableId);
      
      if (storedTableId) {
        console.log('[BarTapContext] Setting tableId from localStorage and proceeding to checkout');
        setTableId(storedTableId);
        setFlowStep('checkout');
        
        // Use a timeout to ensure the tableId is set before navigation
        setTimeout(() => {
          router.push(`/checkout?table=${storedTableId}`);
        }, 100);
        return;
      }
      
      // No table ID found, redirect to table entry
      console.log('[BarTapContext] No tableId found anywhere, redirecting to /table');
      router.push('/table');
      return;
    }
    
    if (cartItems.length === 0) {
      // Can't checkout with empty cart
      console.log('[BarTapContext] Cart is empty, cannot proceed to checkout');
      return;
    }
    
    console.log('[BarTapContext] All conditions met, proceeding to checkout');
    setFlowStep('checkout');
    router.push(`/checkout?table=${tableId}`);
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
