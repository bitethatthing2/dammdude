// lib/hooks/useCartState.ts
import { create } from 'zustand';
import type { MenuItem, CartItem } from '@/lib/types/menu';

// Define the shape of the cart state and actions
interface CartState {
  items: CartItem[];
  showCart: boolean;
  addItem: (item: MenuItem) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  updateItemQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
  toggleCart: () => void;
}

// Create the store
export const useCartState = create<CartState>((set, get) => ({
  items: [],
  showCart: false,
  
  addItem: (item: MenuItem) => {
    set((state) => {
      const existingItem = state.items.find((i) => i.id === item.id);
      
      if (existingItem) {
        const newQuantity = existingItem.quantity + 1;
        const newSubtotal = item.price * newQuantity;
        
        return {
          ...state,
          items: state.items.map((i) =>
            i.id === item.id
              ? { ...i, quantity: newQuantity, subtotal: newSubtotal }
              : i
          ),
        };
      } else {
        const cartItem: CartItem = {
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: 1,
          menu_category_id: item.menu_category_id,
          subtotal: item.price,
          modifiers: [],
          notes: '',
          image_url: item.image_url
        };
        
        return {
          ...state,
          items: [...state.items, cartItem],
        };
      }
    });
  },
  
  removeItem: (itemId: string) => {
    set((state) => ({
      ...state,
      items: state.items.filter((i) => i.id !== itemId),
    }));
  },
  
  updateQuantity: (itemId: string, quantity: number) => {
    set((state) => ({
      ...state,
      items: state.items
        .map((i) => {
          if (i.id === itemId) {
            const newQuantity = Math.max(0, quantity);
            const newSubtotal = i.price * newQuantity;
            return { ...i, quantity: newQuantity, subtotal: newSubtotal };
          }
          return i;
        })
        .filter((i) => i.quantity > 0),
    }));
  },
  
  updateItemQuantity: (itemId: string, quantity: number) => {
    get().updateQuantity(itemId, quantity);
  },
  
  clearCart: () => set(() => ({ items: [], showCart: false })),
  
  getTotalPrice: () => {
    return get().items.reduce(
      (total, item) => total + (item.subtotal || 0),
      0
    );
  },
  
  getTotalItems: () => {
    return get().items.reduce((total, item) => total + item.quantity, 0);
  },
  
  toggleCart: () => {
    set((state) => ({ ...state, showCart: !state.showCart }));
  },
}));
