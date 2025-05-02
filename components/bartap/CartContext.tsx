"use client";

import { createContext, useContext, useReducer, ReactNode, useMemo, useCallback, useEffect } from 'react';

// Define types for our cart items and context
interface CartItem {
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

type CartAction = 
  | { type: 'ADD_ITEM'; payload: Omit<CartItem, 'quantity'> }
  | { type: 'REMOVE_ITEM'; payload: { id: string } }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'UPDATE_NOTES'; payload: { id: string; notes: string } }
  | { type: 'UPDATE_CUSTOMIZATIONS'; payload: { id: string; customizations: CartItem['customizations'] } }
  | { type: 'CLEAR_CART' }
  | { type: 'APPLY_PROMO_CODE'; payload: { code: string } }
  | { type: 'REMOVE_PROMO_CODE' }
  | { type: 'SET_LAST_ORDER_TIME'; payload: { time: number } };

interface CartState {
  items: CartItem[];
  tableId: string;
  promoCode: string | null;
  discount: number;
  deliveryFee: number;
  lastOrderTime: number | null;
}

interface CartContextType extends CartState {
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  updateNotes: (id: string, notes: string) => void;
  updateCustomizations: (id: string, customizations: CartItem['customizations']) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  applyPromoCode: (code: string) => void;
  removePromoCode: () => void;
  setLastOrderTime: (time: number) => void;
  canPlaceNewOrder: boolean;
  timeUntilNextOrder: number;
  grandTotal: number;
}

// Create context with a default value
const CartContext = createContext<CartContextType | undefined>(undefined);

// Reducer function to handle cart state updates
function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingItemIndex = state.items.findIndex(item => item.id === action.payload.id);
      
      if (existingItemIndex >= 0) {
        // Item exists, update quantity
        const updatedItems = [...state.items];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + 1
        };
        return { ...state, items: updatedItems };
      } else {
        // New item, add to cart
        return {
          ...state,
          items: [...state.items, { ...action.payload, quantity: 1 }]
        };
      }
    }
    
    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter(item => item.id !== action.payload.id)
      };
    
    case 'UPDATE_QUANTITY': {
      const { id, quantity } = action.payload;
      
      // If quantity is 0 or less, remove the item
      if (quantity <= 0) {
        return {
          ...state,
          items: state.items.filter(item => item.id !== id)
        };
      }
      
      // Otherwise update the quantity
      return {
        ...state,
        items: state.items.map(item =>
          item.id === id ? { ...item, quantity } : item
        )
      };
    }
    
    case 'UPDATE_NOTES':
      return {
        ...state,
        items: state.items.map(item =>
          item.id === action.payload.id
            ? { ...item, notes: action.payload.notes }
            : item
        )
      };
    
    case 'UPDATE_CUSTOMIZATIONS':
      return {
        ...state,
        items: state.items.map(item =>
          item.id === action.payload.id
            ? { ...item, customizations: action.payload.customizations }
            : item
        )
      };
    
    case 'APPLY_PROMO_CODE':
      return {
        ...state,
        promoCode: action.payload.code,
        discount: 10 // hardcoded discount for simplicity
      };
    
    case 'REMOVE_PROMO_CODE':
      return {
        ...state,
        promoCode: null,
        discount: 0
      };
    
    case 'SET_LAST_ORDER_TIME':
      return {
        ...state,
        lastOrderTime: action.payload.time
      };
    
    case 'CLEAR_CART':
      return {
        ...state,
        items: [],
        promoCode: null,
        discount: 0
      };
      
    default:
      return state;
  }
}

// Provider component
export function CartProvider({
  children,
  tableId,
  deliveryFee
}: {
  children: ReactNode;
  tableId: string;
  deliveryFee: number;
}) {
  // Initialize state with the table ID and any saved cart items
  const [state, dispatch] = useReducer(
    cartReducer,
    {
      items: [],
      tableId,
      promoCode: null,
      discount: 0,
      deliveryFee,
      lastOrderTime: null
    },
    (initialState) => {
      // Only run in browser environment
      if (typeof window !== 'undefined') {
        const savedCart = localStorage.getItem(`cart_${tableId}`);
        if (savedCart) {
          try {
            const parsedCart = JSON.parse(savedCart);
            return { 
              ...initialState, 
              items: parsedCart.items || [],
              lastOrderTime: parsedCart.lastOrderTime || null,
              promoCode: parsedCart.promoCode || null,
              discount: parsedCart.discount || 0
            };
          } catch (e) {
            console.error('Failed to parse saved cart', e);
          }
        }
      }
      return initialState;
    }
  );
  
  // Memoized calculations for totals
  const totalItems = useMemo(() => 
    state.items.reduce((sum: number, item: CartItem) => sum + item.quantity, 0),
    [state.items]
  );
  
  const totalPrice = useMemo(() => 
    state.items.reduce((sum: number, item: CartItem) => sum + (item.price * item.quantity), 0),
    [state.items]
  );
  
  const grandTotal = useMemo(() => 
    totalPrice - (totalPrice * state.discount / 100) + state.deliveryFee,
    [totalPrice, state.discount, state.deliveryFee]
  );

  // Check if user can place a new order (10-15 minute restriction)
  const ORDER_COOLDOWN_MS = 10 * 60 * 1000; // 10 minutes in milliseconds
  
  const canPlaceNewOrder = useMemo(() => {
    if (!state.lastOrderTime) return true;
    
    const now = Date.now();
    const timeSinceLastOrder = now - state.lastOrderTime;
    return timeSinceLastOrder >= ORDER_COOLDOWN_MS;
  }, [state.lastOrderTime]);
  
  const timeUntilNextOrder = useMemo(() => {
    if (!state.lastOrderTime || canPlaceNewOrder) return 0;
    
    const now = Date.now();
    const timeSinceLastOrder = now - state.lastOrderTime;
    return Math.ceil((ORDER_COOLDOWN_MS - timeSinceLastOrder) / 60000); // Return minutes
  }, [state.lastOrderTime, canPlaceNewOrder]);
  
  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Only store the necessary data, not the entire state object
      const dataToStore = {
        items: state.items,
        lastOrderTime: state.lastOrderTime,
        promoCode: state.promoCode,
        discount: state.discount
      };
      localStorage.setItem(`cart_${tableId}`, JSON.stringify(dataToStore));
    }
  }, [state.items, state.lastOrderTime, state.promoCode, state.discount, tableId]);
  
  // Action dispatcher functions
  const addItem = useCallback((item: Omit<CartItem, 'quantity'>) => {
    dispatch({ type: 'ADD_ITEM', payload: item });
  }, []);
  
  const removeItem = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: { id } });
  }, []);
  
  const updateQuantity = useCallback((id: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });
  }, []);
  
  const updateNotes = useCallback((id: string, notes: string) => {
    dispatch({ type: 'UPDATE_NOTES', payload: { id, notes } });
  }, []);
  
  const updateCustomizations = useCallback((id: string, customizations: CartItem['customizations']) => {
    dispatch({ type: 'UPDATE_CUSTOMIZATIONS', payload: { id, customizations } });
  }, []);
  
  const clearCart = useCallback(() => {
    dispatch({ type: 'CLEAR_CART' });
  }, []);
  
  const applyPromoCode = useCallback((code: string) => {
    dispatch({ type: 'APPLY_PROMO_CODE', payload: { code } });
  }, []);
  
  const removePromoCode = useCallback(() => {
    dispatch({ type: 'REMOVE_PROMO_CODE' });
  }, []);
  
  const setLastOrderTime = useCallback((time: number) => {
    dispatch({ type: 'SET_LAST_ORDER_TIME', payload: { time } });
  }, []);
  
  const contextValue = {
    ...state,
    addItem,
    removeItem,
    updateQuantity,
    updateNotes,
    updateCustomizations,
    clearCart,
    totalItems,
    totalPrice,
    grandTotal,
    applyPromoCode,
    removePromoCode,
    setLastOrderTime,
    canPlaceNewOrder,
    timeUntilNextOrder
  };
  
  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
}

// Custom hook to use the cart context
export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
