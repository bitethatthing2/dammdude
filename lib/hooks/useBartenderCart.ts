// lib/hooks/useBartenderCart.ts
import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';
import type { MenuItem, CartItem, BartenderOrder, MenuItemModifier } from '@/lib/types/menu';

interface BartenderCartState {
  currentOrder: BartenderOrder | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  initializeCart: (tableLocation?: string) => Promise<void>;
  addItem: (item: MenuItem, modifiers?: MenuItemModifier[], specialInstructions?: string) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  
  // Getters
  getTotalPrice: () => number;
  getTotalItems: () => number;
  getItems: () => CartItem[];
  
  // Order management
  submitOrder: (customerNotes?: string) => Promise<string | null>;
  loadPendingOrder: (tableLocation?: string) => Promise<void>;
}

export const useBartenderCart = create<BartenderCartState>((set, get) => ({
  currentOrder: null,
  isLoading: false,
  error: null,

  initializeCart: async (tableLocation?: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const supabase = createClient();
      
      // Look for existing pending order for this table
      const { data: existingOrder, error: fetchError } = await supabase
        .from('bartender_orders')
        .select('*')
        .eq('status', 'pending')
        .eq('table_location', tableLocation || 'unknown')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchError) {
        console.error('Error fetching pending order:', fetchError);
        set({ error: fetchError.message, isLoading: false });
        return;
      }

      let currentOrder = existingOrder;

      if (!currentOrder) {
        // Create new pending order
        const newOrder = {
          status: 'pending',
          order_type: 'table_delivery',
          table_location: tableLocation || 'unknown',
          items: [],
          total_amount: 0,
          payment_status: 'pending'
        };

        const { data: createdOrder, error: createError } = await supabase
          .from('bartender_orders')
          .insert(newOrder)
          .select()
          .single();

        if (createError) {
          console.error('Error creating order:', createError);
          set({ error: createError.message, isLoading: false });
          return;
        }

        currentOrder = createdOrder;
      }

      set({ currentOrder: currentOrder, isLoading: false });
    } catch (error) {
      console.error('Error initializing cart:', error);
      set({ error: error instanceof Error ? error.message : 'Unknown error', isLoading: false });
    }
  },

  addItem: async (item: MenuItem, modifiers: MenuItemModifier[] = [], specialInstructions: string = '') => {
    const state = get();
    if (!state.currentOrder) {
      await state.initializeCart();
    }

    const currentOrder = get().currentOrder;
    if (!currentOrder) return;

    set({ isLoading: true, error: null });

    try {
      const supabase = createClient();
      const items = Array.isArray(currentOrder.items) ? [...currentOrder.items] : [];
      
      // Check if item already exists
      const existingItemIndex = items.findIndex((i: CartItem) => 
        i.id === item.id && 
        JSON.stringify(i.modifiers || []) === JSON.stringify(modifiers) &&
        i.notes === specialInstructions
      );

      if (existingItemIndex >= 0) {
        // Update existing item quantity
        items[existingItemIndex].quantity += 1;
        items[existingItemIndex].subtotal = items[existingItemIndex].price * items[existingItemIndex].quantity;
      } else {
        // Add new item
        const newCartItem: CartItem = {
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: 1,
          menu_category_id: item.menu_category_id,
          modifiers: modifiers,
          notes: specialInstructions,
          subtotal: item.price,
          image_url: item.image_url
        };
        items.push(newCartItem);
      }

      // Calculate new total
      const totalAmount = items.reduce((sum: number, item: CartItem) => sum + (item.subtotal || 0), 0);

      // Update order in database
      const { data: updatedOrder, error } = await supabase
        .from('bartender_orders')
        .update({
          items: items,
          total_amount: totalAmount
        })
        .eq('id', currentOrder.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating order:', error);
        set({ error: error.message, isLoading: false });
        return;
      }

      set({ currentOrder: updatedOrder, isLoading: false });
    } catch (error) {
      console.error('Error adding item:', error);
      set({ error: error instanceof Error ? error.message : 'Unknown error', isLoading: false });
    }
  },

  removeItem: async (itemId: string) => {
    const state = get();
    const currentOrder = state.currentOrder;
    if (!currentOrder) return;

    set({ isLoading: true, error: null });

    try {
      const supabase = createClient();
      const items = Array.isArray(currentOrder.items) ? [...currentOrder.items] : [];
      
      // Remove item
      const filteredItems = items.filter((item: CartItem) => item.id !== itemId);
      
      // Calculate new total
      const totalAmount = filteredItems.reduce((sum: number, item: CartItem) => sum + (item.subtotal || 0), 0);

      // Update order in database
      const { data: updatedOrder, error } = await supabase
        .from('bartender_orders')
        .update({
          items: filteredItems,
          total_amount: totalAmount
        })
        .eq('id', currentOrder.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating order:', error);
        set({ error: error.message, isLoading: false });
        return;
      }

      set({ currentOrder: updatedOrder, isLoading: false });
    } catch (error) {
      console.error('Error removing item:', error);
      set({ error: error instanceof Error ? error.message : 'Unknown error', isLoading: false });
    }
  },

  updateQuantity: async (itemId: string, quantity: number) => {
    const state = get();
    const currentOrder = state.currentOrder;
    if (!currentOrder) return;

    if (quantity <= 0) {
      await state.removeItem(itemId);
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const supabase = createClient();
      const items = Array.isArray(currentOrder.items) ? [...currentOrder.items] : [];
      
      // Update item quantity
      const updatedItems = items.map((item: CartItem) => {
        if (item.id === itemId) {
          return {
            ...item,
            quantity: quantity,
            subtotal: item.price * quantity
          };
        }
        return item;
      });
      
      // Calculate new total
      const totalAmount = updatedItems.reduce((sum: number, item: CartItem) => sum + (item.subtotal || 0), 0);

      // Update order in database
      const { data: updatedOrder, error } = await supabase
        .from('bartender_orders')
        .update({
          items: updatedItems,
          total_amount: totalAmount
        })
        .eq('id', currentOrder.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating order:', error);
        set({ error: error.message, isLoading: false });
        return;
      }

      set({ currentOrder: updatedOrder, isLoading: false });
    } catch (error) {
      console.error('Error updating quantity:', error);
      set({ error: error instanceof Error ? error.message : 'Unknown error', isLoading: false });
    }
  },

  clearCart: async () => {
    const state = get();
    const currentOrder = state.currentOrder;
    if (!currentOrder) return;

    set({ isLoading: true, error: null });

    try {
      const supabase = createClient();

      // Clear items and reset total
      const { data: updatedOrder, error } = await supabase
        .from('bartender_orders')
        .update({
          items: [],
          total_amount: 0
        })
        .eq('id', currentOrder.id)
        .select()
        .single();

      if (error) {
        console.error('Error clearing cart:', error);
        set({ error: error.message, isLoading: false });
        return;
      }

      set({ currentOrder: updatedOrder, isLoading: false });
    } catch (error) {
      console.error('Error clearing cart:', error);
      set({ error: error instanceof Error ? error.message : 'Unknown error', isLoading: false });
    }
  },

  getTotalPrice: () => {
    const state = get();
    return state.currentOrder?.total_amount || 0;
  },

  getTotalItems: () => {
    const state = get();
    const items = state.currentOrder?.items || [];
    if (!Array.isArray(items)) return 0;
    return items.reduce((total: number, item: CartItem) => total + item.quantity, 0);
  },

  getItems: () => {
    const state = get();
    const items = state.currentOrder?.items || [];
    return Array.isArray(items) ? items : [];
  },

  submitOrder: async (customerNotes?: string) => {
    const state = get();
    const currentOrder = state.currentOrder;
    if (!currentOrder) return null;

    set({ isLoading: true, error: null });

    try {
      const supabase = createClient();

      // Update order status to submitted/placed
      const { data: submittedOrder, error } = await supabase
        .from('bartender_orders')
        .update({
          status: 'placed',
          customer_notes: customerNotes,
          created_at: new Date().toISOString() // Update timestamp for actual order
        })
        .eq('id', currentOrder.id)
        .select()
        .single();

      if (error) {
        console.error('Error submitting order:', error);
        set({ error: error.message, isLoading: false });
        return null;
      }

      // Clear current order since it's been submitted
      set({ currentOrder: null, isLoading: false });
      
      return submittedOrder.id;
    } catch (error) {
      console.error('Error submitting order:', error);
      set({ error: error instanceof Error ? error.message : 'Unknown error', isLoading: false });
      return null;
    }
  },

  loadPendingOrder: async (tableLocation?: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const supabase = createClient();
      
      const { data: pendingOrder, error } = await supabase
        .from('bartender_orders')
        .select('*')
        .eq('status', 'pending')
        .eq('table_location', tableLocation || 'unknown')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error loading pending order:', error);
        set({ error: error.message, isLoading: false });
        return;
      }

      set({ currentOrder: pendingOrder, isLoading: false });
    } catch (error) {
      console.error('Error loading pending order:', error);
      set({ error: error instanceof Error ? error.message : 'Unknown error', isLoading: false });
    }
  }
}));
