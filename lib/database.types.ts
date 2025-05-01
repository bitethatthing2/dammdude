/* eslint-disable max-len */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      active_sessions: {
        Row: {
          created_at: string | null
          id: string
          last_activity: string | null
          table_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_activity?: string | null
          table_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          last_activity?: string | null
          table_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "active_sessions_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_table"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_users: {
        Row: {
          created_at: string | null
          email: string
          id: string
          role: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id: string
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      device_registrations: {
        Row: {
          device_id: string
          is_primary: boolean | null
          last_active: string | null
          staff_id: string | null
          table_id: string | null
          type: string
        }
        Insert: {
          device_id: string
          is_primary?: boolean | null
          last_active?: string | null
          staff_id?: string | null
          table_id?: string | null
          type: string
        }
        Update: {
          device_id?: string
          is_primary?: boolean | null
          last_active?: string | null
          staff_id?: string | null
          table_id?: string | null
          type?: string
        }
        Relationships: []
      }
      fruit_flavors: {
        Row: {
          available: boolean | null
          id: string
          name: string
        }
        Insert: {
          available?: boolean | null
          id?: string
          name: string
        }
        Update: {
          available?: boolean | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      house_sauces: {
        Row: {
          available: boolean | null
          id: string
          name: string
        }
        Insert: {
          available?: boolean | null
          id?: string
          name: string
        }
        Update: {
          available?: boolean | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      meat_options: {
        Row: {
          available: boolean | null
          id: string
          name: string
          price: number | null
        }
        Insert: {
          available?: boolean | null
          id?: string
          name: string
          price?: number | null
        }
        Update: {
          available?: boolean | null
          id?: string
          name?: string
          price?: number | null
        }
        Relationships: []
      }
      menu_categories: {
        Row: {
          display_order: number | null
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          display_order?: number | null
          icon?: string | null
          id?: string
          name: string
        }
        Update: {
          display_order?: number | null
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      menu_items: {
        Row: {
          available: boolean | null
          created_at: string
          description: string | null
          display_order: number | null
          id: string
          image_url: string | null
          menu_category_id: string | null
          name: string
          price: number
        }
        Insert: {
          available?: boolean | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          menu_category_id?: string | null
          name: string
          price: number
        }
        Update: {
          available?: boolean | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          menu_category_id?: string | null
          name?: string
          price?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_menu_category"
            columns: ["menu_category_id"]
            isOneToOne: false
            referencedRelation: "menu_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          recipient_id: string
          status: string | null
          type: Database["public"]["Enums"]["notification_type"]
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          recipient_id: string
          status?: string | null
          type?: Database["public"]["Enums"]["notification_type"]
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          recipient_id?: string
          status?: string | null
          type?: Database["public"]["Enums"]["notification_type"]
        }
        Relationships: []
      }
      orders: {
        Row: {
          created_at: string
          customer_notes: string | null
          id: string
          session_id: string | null
          status: string | null
          table_id: string
          total_price: number | null
        }
        Insert: {
          created_at?: string
          customer_notes?: string | null
          id?: string
          session_id?: string | null
          status?: string | null
          table_id: string
          total_price?: number | null
        }
        Update: {
          created_at?: string
          customer_notes?: string | null
          id?: string
          session_id?: string | null
          status?: string | null
          table_id?: string
          total_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_session"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "active_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_table"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          item_id: string
          item_name: string | null
          modifiers: Json | null
          order_id: string
          price_at_order: number | null
          quantity: number
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          item_name?: string | null
          modifiers?: Json | null
          order_id: string
          price_at_order?: number | null
          quantity: number
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          item_name?: string | null
          modifiers?: Json | null
          order_id?: string
          price_at_order?: number | null
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_item"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_order"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      tables: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          last_activity: string | null
          location: string | null
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_activity?: string | null
          location?: string | null
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_activity?: string | null
          location?: string | null
          name?: string
        }
        Relationships: []
      }
      wing_flavors: {
        Row: {
          available: boolean | null
          id: string
          name: string
        }
        Insert: {
          available?: boolean | null
          id?: string
          name: string
        }
        Update: {
          available?: boolean | null
          id?: string
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      notification_type: "info" | "warning" | "error"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type DbResult<T> = T extends PromiseLike<infer U> ? U : never
export type DbResultOk<T> = T extends PromiseLike<{ data: infer U }> ? Exclude<U, null> : never
// DbResultErr is removed, use PostgrestError directly

export type DbResultStatus = "idle" | "loading" | "success" | "error"
export type DbResultAction = <T>(promise: PromiseLike<T>) => Promise<DbResult<T>>
export type DbResultActionArgs<T> = [DbResult<T>, DbResultStatus]

import { PostgrestError } from "@supabase/supabase-js";

// Helper types for Schema Inference
export type SchemaName = keyof Database;
export type TableName<S extends SchemaName> = keyof Database[S]["Tables"];
export type ViewName<S extends SchemaName> = keyof Database[S]["Views"];
export type FunctionName<S extends SchemaName> = keyof Database[S]["Functions"];
export type EnumName<S extends SchemaName> = keyof Database[S]["Enums"];
export type CompositeTypeName<S extends SchemaName> = keyof Database[S]["CompositeTypes"];

// Specific Aliases

// Tables
export type ActiveSession = PublicSchema["Tables"]["active_sessions"]["Row"]
export type ActiveSessionInsert = PublicSchema["Tables"]["active_sessions"]["Insert"]
export type ActiveSessionUpdate = PublicSchema["Tables"]["active_sessions"]["Update"]

export type AdminUser = PublicSchema["Tables"]["admin_users"]["Row"]
export type AdminUserInsert = PublicSchema["Tables"]["admin_users"]["Insert"]
export type AdminUserUpdate = PublicSchema["Tables"]["admin_users"]["Update"]

export type DeviceRegistration = PublicSchema["Tables"]["device_registrations"]["Row"]
export type DeviceRegistrationInsert = PublicSchema["Tables"]["device_registrations"]["Insert"]
export type DeviceRegistrationUpdate = PublicSchema["Tables"]["device_registrations"]["Update"]

export type FruitFlavor = PublicSchema["Tables"]["fruit_flavors"]["Row"]
export type FruitFlavorInsert = PublicSchema["Tables"]["fruit_flavors"]["Insert"]
export type FruitFlavorUpdate = PublicSchema["Tables"]["fruit_flavors"]["Update"]

export type HouseSauce = PublicSchema["Tables"]["house_sauces"]["Row"]
export type HouseSauceInsert = PublicSchema["Tables"]["house_sauces"]["Insert"]
export type HouseSauceUpdate = PublicSchema["Tables"]["house_sauces"]["Update"]

export type MeatOption = PublicSchema["Tables"]["meat_options"]["Row"]
export type MeatOptionInsert = PublicSchema["Tables"]["meat_options"]["Insert"]
export type MeatOptionUpdate = PublicSchema["Tables"]["meat_options"]["Update"]

export type MenuCategory = PublicSchema["Tables"]["menu_categories"]["Row"]
export type MenuCategoryInsert = PublicSchema["Tables"]["menu_categories"]["Insert"]
export type MenuCategoryUpdate = PublicSchema["Tables"]["menu_categories"]["Update"]

export type MenuItem = PublicSchema["Tables"]["menu_items"]["Row"]
export type MenuItemInsert = PublicSchema["Tables"]["menu_items"]["Insert"]
export type MenuItemUpdate = PublicSchema["Tables"]["menu_items"]["Update"]

export type Notification = PublicSchema["Tables"]["notifications"]["Row"]
export type NotificationInsert = PublicSchema["Tables"]["notifications"]["Insert"]
export type NotificationUpdate = PublicSchema["Tables"]["notifications"]["Update"]

export type Order = PublicSchema["Tables"]["orders"]["Row"]
export type OrderInsert = PublicSchema["Tables"]["orders"]["Insert"]
export type OrderUpdate = PublicSchema["Tables"]["orders"]["Update"]

export type OrderItem = PublicSchema["Tables"]["order_items"]["Row"]
export type OrderItemInsert = PublicSchema["Tables"]["order_items"]["Insert"]
export type OrderItemUpdate = PublicSchema["Tables"]["order_items"]["Update"]

export type Table = PublicSchema["Tables"]["tables"]["Row"]
export type TableInsert = PublicSchema["Tables"]["tables"]["Insert"]
export type TableUpdate = PublicSchema["Tables"]["tables"]["Update"]

export type WingFlavor = PublicSchema["Tables"]["wing_flavors"]["Row"]
export type WingFlavorInsert = PublicSchema["Tables"]["wing_flavors"]["Insert"]
export type WingFlavorUpdate = PublicSchema["Tables"]["wing_flavors"]["Update"]

// Enums
export type NotificationType = PublicSchema["Enums"]["notification_type"]

// Composite Types
// No composite types found in schema public

// Default schema alias
declare global {
  // eslint-disable-next-line no-unused-vars
  type DefaultSchema = Database["public"];
}
