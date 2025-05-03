export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;     // URL to item image
  category_id: string;    // Reference to category
  available: boolean;     // Availability flag
  isOrderable?: boolean;  // Add this flag to indicate if item can be ordered
  popular?: boolean;      // Popular item flag
  allergens?: string[];   // List of allergens
  dietary_info?: string[];// Dietary info (vegan, etc)
  options?: MenuItemOption[];// Customization options
  location?: string;      // Location specific (Portland/Salem)
  metadata?: Record<string, unknown>; // Additional flexible data
}

export interface MenuItemOption {
  id: string;
  name: string;
  price_adjustment: number; // Additional cost
  available: boolean;
}

export interface MenuCategory {
  id: string;
  name: string;
  description?: string;
  items: MenuItem[];
  display_order?: number; // Order in menu
  location?: string;      // Location specific (Portland/Salem)
} 