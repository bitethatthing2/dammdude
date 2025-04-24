export interface MerchItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl: string;  // Image URL is mandatory for merchandise
  category_id: string;
  available: boolean;
  popular?: boolean;
  variants?: MerchVariant[];
  metadata?: Record<string, unknown>;
}

export interface MerchVariant {
  id: string;
  name: string;
  price_adjustment: number;
  options: string[];  // Size/color options
  available: boolean;
}

export interface MerchCategory {
  id: string;
  name: string;
  description?: string;
  items: MerchItem[];
  display_order: number;
  icon?: string;  // Icon identifier for the category
  location?: 'salem' | 'portland' | 'both';
}