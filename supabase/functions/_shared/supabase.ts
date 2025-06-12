// types/supabase.ts
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      food_drink_categories: {
        Row: {
          color: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          display_order: number | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          type: string
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          type: string
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "food_drink_categories_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      food_drink_items: {
        Row: {
          category_id: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          image_id: string | null
          is_available: boolean | null
          name: string
          price: number
          updated_at: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          image_id?: string | null
          is_available?: boolean | null
          name: string
          price: number
          updated_at?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          image_id?: string | null
          is_available?: boolean | null
          name?: string
          price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "food_drink_items_category_id_fkey"
            columns: ["category_id"]
            referencedRelation: "food_drink_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "food_drink_items_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "food_drink_items_image_id_fkey"
            columns: ["image_id"]
            referencedRelation: "images"
            referencedColumns: ["id"]
          }
        ]
      }
      menu_item_modifiers: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          is_available: boolean | null
          modifier_type: string
          name: string
          price_adjustment: number | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_available?: boolean | null
          modifier_type: string
          name: string
          price_adjustment?: number | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_available?: boolean | null
          modifier_type?: string
          name?: string
          price_adjustment?: number | null
        }
        Relationships: []
      }
      bartender_orders: {
        Row: {
          accepted_at: string | null
          bartender_id: string | null
          bartender_notes: string | null
          completed_at: string | null
          created_at: string | null
          customer_id: string | null
          customer_notes: string | null
          id: string
          items: Json
          location_id: string | null
          order_number: number
          order_type: string | null
          paid_at: string | null
          payment_handled_by: string | null
          payment_status: string | null
          ready_at: string | null
          status: string | null
          tab_id: string | null
          table_location: string | null
          total_amount: number
        }
        Insert: {
          accepted_at?: string | null
          bartender_id?: string | null
          bartender_notes?: string | null
          completed_at?: string | null
          created_at?: string | null
          customer_id?: string | null
          customer_notes?: string | null
          id?: string
          items: Json
          location_id?: string | null
          order_number?: number
          order_type?: string | null
          paid_at?: string | null
          payment_handled_by?: string | null
          payment_status?: string | null
          ready_at?: string | null
          status?: string | null
          tab_id?: string | null
          table_location?: string | null
          total_amount: number
        }
        Update: {
          accepted_at?: string | null
          bartender_id?: string | null
          bartender_notes?: string | null
          completed_at?: string | null
          created_at?: string | null
          customer_id?: string | null
          customer_notes?: string | null
          id?: string
          items?: Json
          location_id?: string | null
          order_number?: number
          order_type?: string | null
          paid_at?: string | null
          payment_handled_by?: string | null
          payment_status?: string | null
          ready_at?: string | null
          status?: string | null
          tab_id?: string | null
          table_location?: string | null
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "bartender_orders_bartender_id_fkey"
            columns: ["bartender_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bartender_orders_customer_id_fkey"
            columns: ["customer_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bartender_orders_location_id_fkey"
            columns: ["location_id"]
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bartender_orders_tab_id_fkey"
            columns: ["tab_id"]
            referencedRelation: "bartender_tabs"
            referencedColumns: ["id"]
          }
        ]
      }
      users: {
        Row: {
          auth_id: string | null
          avatar_id: string | null
          avatar_url: string | null
          block_reason: string | null
          blocked_at: string | null
          blocked_by: string | null
          created_at: string
          deleted_at: string | null
          email: string
          first_name: string | null
          id: string
          is_approved: boolean | null
          last_login: string | null
          last_name: string | null
          location_id: string | null
          notes: string | null
          password_hash: string | null
          permissions: Json | null
          role: string | null
          sensitive_data_encrypted: Json | null
          status: string | null
          updated_at: string
        }
        Insert: {
          auth_id?: string | null
          avatar_id?: string | null
          avatar_url?: string | null
          block_reason?: string | null
          blocked_at?: string | null
          blocked_by?: string | null
          created_at?: string
          deleted_at?: string | null
          email: string
          first_name?: string | null
          id?: string
          is_approved?: boolean | null
          last_login?: string | null
          last_name?: string | null
          location_id?: string | null
          notes?: string | null
          password_hash?: string | null
          permissions?: Json | null
          role?: string | null
          sensitive_data_encrypted?: Json | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          auth_id?: string | null
          avatar_id?: string | null
          avatar_url?: string | null
          block_reason?: string | null
          blocked_at?: string | null
          blocked_by?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string
          first_name?: string | null
          id?: string
          is_approved?: boolean | null
          last_login?: string | null
          last_name?: string | null
          location_id?: string | null
          notes?: string | null
          password_hash?: string | null
          permissions?: Json | null
          role?: string | null
          sensitive_data_encrypted?: Json | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      images: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          id: string
          image_type: string | null
          metadata: Json | null
          mime_type: string | null
          name: string
          size: number | null
          storage_path: string | null
          updated_at: string | null
          uploaded_by: string | null
          url: string
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          image_type?: string | null
          metadata?: Json | null
          mime_type?: string | null
          name: string
          size?: number | null
          storage_path?: string | null
          updated_at?: string | null
          uploaded_by?: string | null
          url: string
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          image_type?: string | null
          metadata?: Json | null
          mime_type?: string | null
          name?: string
          size?: number | null
          storage_path?: string | null
          updated_at?: string | null
          uploaded_by?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "images_uploaded_by_fkey"
            columns: ["uploaded_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      locations: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          deleted_at: string | null
          email: string | null
          id: string
          latitude: number
          longitude: number
          name: string
          phone: string | null
          radius_miles: number | null
          state: string | null
          updated_at: string
          website: string | null
          zip: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          id?: string
          latitude: number
          longitude: number
          name: string
          phone?: string | null
          radius_miles?: number | null
          state?: string | null
          updated_at?: string
          website?: string | null
          zip?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          id?: string
          latitude?: number
          longitude?: number
          name?: string
          phone?: string | null
          radius_miles?: number | null
          state?: string | null
          updated_at?: string
          website?: string | null
          zip?: string | null
        }
        Relationships: []
      }
      bartender_tabs: {
        Row: {
          bartender_id: string | null
          closed_at: string | null
          created_at: string | null
          customer_name: string | null
          id: string
          notes: string | null
          status: string | null
          total_amount: number | null
        }
        Insert: {
          bartender_id?: string | null
          closed_at?: string | null
          created_at?: string | null
          customer_name?: string | null
          id?: string
          notes?: string | null
          status?: string | null
          total_amount?: number | null
        }
        Update: {
          bartender_id?: string | null
          closed_at?: string | null
          created_at?: string | null
          customer_name?: string | null
          id?: string
          notes?: string | null
          status?: string | null
          total_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bartender_tabs_bartender_id_fkey"
            columns: ["bartender_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: Record<PropertyKey, never>
    Functions: {
      create_customer_order: {
        Args: {
          p_items: Json
          p_order_type?: string
          p_table_location?: string
          p_notes?: string
        }
        Returns: Json
      }
    }
    Enums: Record<PropertyKey, never>
    CompositeTypes: Record<PropertyKey, never>
  }
}