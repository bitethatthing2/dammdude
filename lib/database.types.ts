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
      categories: {
        Row: {
          display_order: number | null
          icon: string | null
          id: number
          name: string
        }
        Insert: {
          display_order?: number | null
          icon?: string | null
          id?: number
          name: string
        }
        Update: {
          display_order?: number | null
          icon?: string | null
          id?: number
          name?: string
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
          category_id: number
          created_at: string | null
          description: string | null
          id: number
          image_url: string | null
          menu_category_id: string | null
          name: string
          price: number | null
          updated_at: string | null
        }
        Insert: {
          available?: boolean | null
          category_id: number
          created_at?: string | null
          description?: string | null
          id?: number
          image_url?: string | null
          menu_category_id?: string | null
          name: string
          price?: number | null
          updated_at?: string | null
        }
        Update: {
          available?: boolean | null
          category_id?: number
          created_at?: string | null
          description?: string | null
          id?: number
          image_url?: string | null
          menu_category_id?: string | null
          name?: string
          price?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_items_menu_category_id_fkey"
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
          read: boolean
          recipient_id: string | null
          recipient_type: string | null
          sender_id: string | null
          sender_type: string | null
          target_id: string | null
          target_type: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean
          recipient_id?: string | null
          recipient_type?: string | null
          sender_id?: string | null
          sender_type?: string | null
          target_id?: string | null
          target_type?: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          recipient_id?: string | null
          recipient_type?: string | null
          sender_id?: string | null
          sender_type?: string | null
          target_id?: string | null
          target_type?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          item_id: number
          notes: string | null
          order_id: string
          quantity: number
          status: string | null
          subtotal: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: number
          notes?: string | null
          order_id: string
          quantity?: number
          status?: string | null
          subtotal?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: number
          notes?: string | null
          order_id?: string
          quantity?: number
          status?: string | null
          subtotal?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          id: string
          status: string | null
          table_id: string
          total_amount: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          status?: string | null
          table_id: string
          total_amount?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          status?: string | null
          table_id?: string
          total_amount?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          },
        ]
      }
      tables: {
        Row: {
          capacity: number | null
          created_at: string | null
          id: string
          location: string | null
          qr_code_url: string | null
          status: string | null
          table_number: string
          updated_at: string | null
        }
        Insert: {
          capacity?: number | null
          created_at?: string | null
          id?: string
          location?: string | null
          qr_code_url?: string | null
          status?: string | null
          table_number: string
          updated_at?: string | null
        }
        Update: {
          capacity?: number | null
          created_at?: string | null
          id?: string
          location?: string | null
          qr_code_url?: string | null
          status?: string | null
          table_number?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      wing_flavors: {
        Row: {
          available: boolean | null
          heat_level: number | null
          id: string
          name: string
        }
        Insert: {
          available?: boolean | null
          heat_level?: number | null
          id?: string
          name: string
        }
        Update: {
          available?: boolean | null
          heat_level?: number | null
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

export type DbResultStatus = "idle" | "loading" | "success" | "error"
export type DbResultAction = <T>(promise: PromiseLike<T>) => Promise<DbResult<T>>
export type DbResultActionArgs<T> = [DbResult<T>, DbResultStatus]

import { PostgrestError } from "@supabase/supabase-js";

// Helper types for Schema Inference
// Source: https://github.com/supabase/supabase/blob/master/examples/nextjs/utils/supabase/types.ts
export type SchemaName = keyof Database;
export type TableName<S extends SchemaName> = keyof Database[S]["Tables"];
export type ViewName<S extends SchemaName> = keyof Database[S]["Views"];
export type FunctionName<S extends SchemaName> = keyof Database[S]["Functions"];
export type EnumName<S extends SchemaName> = keyof Database[S]["Enums"];
export type CompositeTypeName<S extends SchemaName> = keyof Database[S]["CompositeTypes"];

// export type Table<T extends TableName<"public">> = Database["public"]["Tables"][T]
// export type View<T extends ViewName<"public">> = Database["public"]["Views"][T]
// export type Function<T extends FunctionName<"public">> = Database["public"]["Functions"][T]
// export type Enum<T extends EnumName<"public">> = Database["public"]["Enums"][T]
// export type CompositeType<T extends CompositeTypeName<"public">> = Database["public"]["CompositeTypes"][T]

// If you have multiple schemas, you can alias the schema name like this:
// export type AuthTable<T extends TableName<"auth">> = Database["auth"]["Tables"][T]
// ...and then use it like this: AuthTable<"users">

// The following are TS types for convenience based on the default "public" schema
// If you specified a different schema in your Supabase project, update these types accordingly
// Example: export type MyTable = Tables<"MyTable", { schema: "my_schema" }>

// Tables
export type ActiveSession = PublicSchema["Tables"]["active_sessions"]["Row"]
export type ActiveSessionInsert = PublicSchema["Tables"]["active_sessions"]["Insert"]
export type ActiveSessionUpdate = PublicSchema["Tables"]["active_sessions"]["Update"]

export type AdminUser = PublicSchema["Tables"]["admin_users"]["Row"]
export type AdminUserInsert = PublicSchema["Tables"]["admin_users"]["Insert"]
export type AdminUserUpdate = PublicSchema["Tables"]["admin_users"]["Update"]

export type Category = PublicSchema["Tables"]["categories"]["Row"]
export type CategoryInsert = PublicSchema["Tables"]["categories"]["Insert"]
export type CategoryUpdate = PublicSchema["Tables"]["categories"]["Update"]

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

// Default schema alias (adjust if your default schema is not public)
declare global {
  // eslint-disable-next-line no-unused-vars
  type DefaultSchema = Database["public"];
}
