
// Minimal database types to prevent build errors
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          first_name?: string | null;
          last_name?: string | null;
          display_name?: string | null;
          wolf_emoji?: string | null;
          is_wolfpack_member?: boolean | null;
          avatar_url?: string | null;
          created_at: string;
          [key: string]: any;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
      restaurant_tables: {
        Row: {
          id: string;
          table_number: number;
          is_active: boolean;
          location_id?: string | null;
          [key: string]: any;
        };
        Insert: Omit<Database['public']['Tables']['restaurant_tables']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['restaurant_tables']['Insert']>;
      };
      [key: string]: {
        Row: Record<string, any>;
        Insert: Record<string, any>;
        Update: Record<string, any>;
      };
    };
    Views: Record<string, any>;
    Functions: Record<string, any>;
    Enums: Record<string, any>;
    CompositeTypes: Record<string, any>;
  };
}
