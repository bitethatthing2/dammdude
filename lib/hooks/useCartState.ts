import { create } from 'zustand';
import {
  persist,
  createJSONStorage,
  PersistOptions,
} from 'zustand/middleware';
import type { MenuItem } from '@/lib/types/menu';

// Define the shape of the cart item and EXPORT it
export interface CartItem extends MenuItem {
  quantity: number;
}

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

// Define the persist options separately for clarity
const persistOptions: PersistOptions<CartState> = {
  name: 'cart-storage',
  storage: createJSONStorage(() => {
    // Check if window is defined (we're in the browser)
    if (typeof window !== 'undefined') {
      return localStorage;
    }
    // Return a no-op storage for SSR
    return {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {}
    };
  }),
};

// Create the store using create<CartState>(persist(...) as any) structure
export const useCartState = create<CartState>(
  persist(
    (set, get, api) => ({
      items: [],
      showCart: false,
      addItem: (item) => {
        set((state) => {
          const existingItem = state.items.find((i) => i.id === item.id);
          if (existingItem) {
            return {
              items: state.items.map((i) =>
                i.id === item.id
                  ? { ...i, quantity: existingItem.quantity + 1 }
                  : i
              ),
            };
          } else {
            return {
              items: [...state.items, { ...item, quantity: 1 }],
            };
          }
        });
      },
      removeItem: (itemId) => {
        set((state) => ({
          items: state.items.filter((i) => i.id !== itemId),
        }));
      },
      updateQuantity: (itemId, quantity) => {
        set((state) => ({
          items: state.items
            .map((i) =>
              i.id === itemId ? { ...i, quantity: Math.max(0, quantity) } : i
            )
            .filter((i) => i.quantity > 0),
        }));
      },
      updateItemQuantity: (itemId, quantity) => {
        get().updateQuantity(itemId, quantity);
      },
      clearCart: () => set({ items: [] }),
      getTotalPrice: () => {
        return get().items.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        );
      },
      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },
      toggleCart: () => {
        set((state) => ({ showCart: !state.showCart }));
      },
    }),
    persistOptions
  ) as any
);
