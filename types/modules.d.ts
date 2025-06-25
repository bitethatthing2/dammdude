// Module declarations for components and configurations

// Cart Context types
declare module '@/components/cart/CartContext' {
  export interface CartItem {
    id: string;
    cartId?: string;
    name: string;
    price: number;
    quantity: number;
    image_url?: string;
    customizations?: {
      meat?: {
        id: string;
        name: string;
        price_adjustment: number;
      } | null;
      sauces?: Array<{
        id: string;
        name: string;
        price_adjustment: number;
      }>;
      wingFlavor?: string;
      meatChoice?: string;
      chefaSauces?: string[];
      special_instructions?: string;
    };
    notes?: string;
    originalItem?: {
      id: string;
      name: string;
      price: number;
      image_url?: string;
    };
  }

  export interface CartContextType {
    items: CartItem[];
    cartItems: CartItem[];
    addToCart: (item: CartItem) => void;
    removeFromCart: (cartId: string) => void;
    updateQuantity: (cartId: string, quantity: number) => void;
    clearCart: () => void;
    getCartTotal: () => number;
    getCartItemCount: () => number;
    cartCount: number;
    cartTotal: number;
  }

  export const useCart: () => CartContextType;
  export const CartProvider: React.FC<{ children: React.ReactNode }>;
  export { CartItem };
}

// Menu Options Config types
declare module './MenuOptionsConfig' {
  export interface MenuCategory {
    name?: string;
  }

  export interface MenuItem {
    name?: string;
    description?: string;
  }

  export interface ItemOptions {
    showWingFlavors: boolean;
    showMeatChoices: boolean;
    showChefaSauce: boolean;
  }

  export const MENU_OPTIONS_CONFIG: {
    wingFlavors: string[];
    chefaSauces: string[];
    meatChoices: string[];
    categoryOptions: Record<string, string[]>;
    itemsRequiringMeat: string[];
    itemsWithChefaSauce: string[];
  };

  export function getOptionsForCategory(category: string | undefined): string[];
  export function shouldShowWingFlavors(category: string | undefined): boolean;
  export function shouldShowMeatChoices(category: string | undefined, itemType: string | undefined): boolean;
  export function shouldShowChefaSauce(category: string | undefined, itemType: string | undefined): boolean;
  export function detectItemOptions(item: MenuItem, category: MenuCategory): ItemOptions;
}

// Menu Item Options component types
declare module './MenuItemOptions' {
  export interface MenuItemOptionsProps {
    item: MenuItem;
    category: MenuCategory;
    onOptionsChange: (options: Record<string, string | string[]>) => void;
    selectedOptions?: Record<string, string | string[]>;
  }

  const MenuItemOptions: React.FC<MenuItemOptionsProps>;
  export default MenuItemOptions;
}

// Additional type augmentations for better TypeScript support
declare module 'framer-motion' {
  export interface AnimatePresenceProps {
    mode?: 'wait' | 'sync' | 'popLayout';
    children: React.ReactNode;
  }
  
  export const AnimatePresence: React.FC<AnimatePresenceProps>;
  export const motion: {
    div: React.ComponentType<Record<string, unknown>>;
    [key: string]: React.ComponentType<Record<string, unknown>>;
  };
}
