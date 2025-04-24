export interface Event {
  id: string;
  title: string;
  description: string;
  event_date: string;  // ISO format date
  event_time: string;
  image_url: string;
  location_id: 'salem' | 'portland' | 'both';
  external_ticket_link?: string;  // nullable
  featured?: boolean;
  category?: string;
  is_cancelled?: boolean;
  price?: number;
}