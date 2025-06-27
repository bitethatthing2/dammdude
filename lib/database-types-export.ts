import { Database } from './database.types';

export type Order = Database['public']['Tables']['bartender_orders']['Row'];
export type OrderItem = Database['public']['Tables']['order_items']['Row'];
export type User = Database['public']['Tables']['users']['Row'];
export type Table = Database['public']['Tables']['tables']['Row'];
export type MenuCategory = Database['public']['Tables']['food_drink_categories']['Row'];
export type MenuItem = Database['public']['Tables']['food_drink_items']['Row'];
export type BartenderOrder = Database['public']['Tables']['bartender_orders']['Row'];
export type Notification = Database['public']['Tables']['push_notifications']['Row'];
export type Announcement = Database['public']['Tables']['announcements']['Row'];
export type WolfPackVote = Database['public']['Tables']['wolf_pack_votes']['Row'];
export type DJEvent = Database['public']['Tables']['dj_events']['Row'];
export type DJBroadcast = Database['public']['Tables']['dj_broadcasts']['Row'];

// Define notification type
export type NotificationType = 'info' | 'warning' | 'error' | 'order_new' | 'order_ready';

// Menu item with options (for compatibility)
export type MenuItemWithOptions = Database['public']['Tables']['food_drink_items']['Row'] & {
  options?: Record<string, unknown>;
};

// Export the notification type enum directly instead of using namespace
export type DatabaseNotificationType = 'info' | 'warning' | 'error' | 'order_new' | 'order_ready';
