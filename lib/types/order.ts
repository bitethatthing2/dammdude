export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price?: number;      // Optional in response for flexibility
}

export interface Order {
  id: string;
  table_id: string;
  location: string;    // Added location field
  status: 'pending' | 'in_progress' | 'completed';
  items: OrderItem[];
  inserted_at: string; // ISO string
  updated_at?: string; // Optional update timestamp
  completed_at?: string; // Optional completion timestamp
  notes?: string;      // Optional order notes
  total_amount?: number; // Optional calculated total
  metadata?: Record<string, unknown>; // Additional flexible data
} 