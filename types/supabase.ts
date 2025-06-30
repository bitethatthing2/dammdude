export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      active_sessions: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          last_activity: string | null
          metadata: Json | null
          session_id: string | null
          table_id: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          last_activity?: string | null
          metadata?: Json | null
          session_id?: string | null
          table_id?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          last_activity?: string | null
          metadata?: Json | null
          session_id?: string | null
          table_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "active_sessions_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_logs: {
        Row: {
          action: string
          admin_id: string | null
          created_at: string | null
          details: Json | null
          id: string
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          admin_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          admin_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          active: boolean | null
          announcement_type: string | null
          content: string
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          featured_image: string | null
          featured_image_id: string | null
          id: string
          metadata: Json | null
          priority: string | null
          push_failed_count: number | null
          push_scheduled_at: string | null
          push_sent_count: number | null
          send_push_notification: boolean | null
          title: string
          type: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          announcement_type?: string | null
          content: string
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          featured_image?: string | null
          featured_image_id?: string | null
          id?: string
          metadata?: Json | null
          priority?: string | null
          push_failed_count?: number | null
          push_scheduled_at?: string | null
          push_sent_count?: number | null
          send_push_notification?: boolean | null
          title: string
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          announcement_type?: string | null
          content?: string
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          featured_image?: string | null
          featured_image_id?: string | null
          id?: string
          metadata?: Json | null
          priority?: string | null
          push_failed_count?: number | null
          push_scheduled_at?: string | null
          push_sent_count?: number | null
          send_push_notification?: boolean | null
          title?: string
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "announcements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcements_featured_image_id_fkey"
            columns: ["featured_image_id"]
            isOneToOne: false
            referencedRelation: "images"
            referencedColumns: ["id"]
          },
        ]
      }
      app_config: {
        Row: {
          created_at: string | null
          encrypted: boolean | null
          key: string
          updated_at: string | null
          value: string | null
        }
        Insert: {
          created_at?: string | null
          encrypted?: boolean | null
          key: string
          updated_at?: string | null
          value?: string | null
        }
        Update: {
          created_at?: string | null
          encrypted?: boolean | null
          key?: string
          updated_at?: string | null
          value?: string | null
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
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bartender_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bartender_orders_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bartender_orders_payment_handled_by_fkey"
            columns: ["payment_handled_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bartender_orders_tab_id_fkey"
            columns: ["tab_id"]
            isOneToOne: false
            referencedRelation: "bartender_tabs"
            referencedColumns: ["id"]
          },
        ]
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
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      content_flags: {
        Row: {
          admin_notes: string | null
          content_id: string
          content_type: string
          created_at: string | null
          flagged_by: string | null
          id: string
          reason: string
          resolved_at: string | null
          resolved_by: string | null
          status: string | null
        }
        Insert: {
          admin_notes?: string | null
          content_id: string
          content_type: string
          created_at?: string | null
          flagged_by?: string | null
          id?: string
          reason: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
        }
        Update: {
          admin_notes?: string | null
          content_id?: string
          content_type?: string
          created_at?: string | null
          flagged_by?: string | null
          id?: string
          reason?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_flags_flagged_by_fkey"
            columns: ["flagged_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_flags_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      device_tokens: {
        Row: {
          app_version: string | null
          created_at: string | null
          device_model: string | null
          device_name: string | null
          error_count: number | null
          id: string
          is_active: boolean | null
          last_attempt_at: string | null
          last_error: string | null
          last_used: string | null
          platform: string | null
          registration_attempts: number | null
          token: string
          updated_at: string | null
          id: string | null
        }
        Insert: {
          app_version?: string | null
          created_at?: string | null
          device_model?: string | null
          device_name?: string | null
          error_count?: number | null
          id?: string
          is_active?: boolean | null
          last_attempt_at?: string | null
          last_error?: string | null
          last_used?: string | null
          platform?: string | null
          registration_attempts?: number | null
          token: string
          updated_at?: string | null
          id?: string | null
        }
        Update: {
          app_version?: string | null
          created_at?: string | null
          device_model?: string | null
          device_name?: string | null
          error_count?: number | null
          id?: string
          is_active?: boolean | null
          last_attempt_at?: string | null
          last_error?: string | null
          last_used?: string | null
          platform?: string | null
          registration_attempts?: number | null
          token?: string
          updated_at?: string | null
          id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "device_tokens_id_fkey"
            columns: ["id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      dj_broadcasts: {
        Row: {
          broadcast_type: string | null
          created_at: string | null
          dj_id: string | null
          id: string
          location_id: string | null
          message: string
        }
        Insert: {
          broadcast_type?: string | null
          created_at?: string | null
          dj_id?: string | null
          id?: string
          location_id?: string | null
          message: string
        }
        Update: {
          broadcast_type?: string | null
          created_at?: string | null
          dj_id?: string | null
          id?: string
          location_id?: string | null
          message?: string
        }
        Relationships: [
          {
            foreignKeyName: "dj_broadcasts_dj_id_fkey"
            columns: ["dj_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dj_broadcasts_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      dj_event_participants: {
        Row: {
          added_at: string | null
          event_id: string | null
          id: string
          metadata: Json | null
          participant_id: string | null
          participant_number: number | null
        }
        Insert: {
          added_at?: string | null
          event_id?: string | null
          id?: string
          metadata?: Json | null
          participant_id?: string | null
          participant_number?: number | null
        }
        Update: {
          added_at?: string | null
          event_id?: string | null
          id?: string
          metadata?: Json | null
          participant_id?: string | null
          participant_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "dj_event_participants_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "dj_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dj_event_participants_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      dj_events: {
        Row: {
          created_at: string | null
          description: string | null
          dj_id: string | null
          ended_at: string | null
          event_config: Json | null
          event_type: string
          id: string
          location_id: string | null
          started_at: string | null
          status: string | null
          title: string
          voting_ends_at: string | null
          winner_data: Json | null
          winner_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          dj_id?: string | null
          ended_at?: string | null
          event_config?: Json | null
          event_type: string
          id?: string
          location_id?: string | null
          started_at?: string | null
          status?: string | null
          title: string
          voting_ends_at?: string | null
          winner_data?: Json | null
          winner_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          dj_id?: string | null
          ended_at?: string | null
          event_config?: Json | null
          event_type?: string
          id?: string
          location_id?: string | null
          started_at?: string | null
          status?: string | null
          title?: string
          voting_ends_at?: string | null
          winner_data?: Json | null
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dj_events_dj_id_fkey"
            columns: ["dj_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dj_events_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dj_events_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
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
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      food_drink_items: {
        Row: {
          available: boolean | null
          category_id: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          display_order: number | null
          id: string
          image_id: string | null
          image_url: string | null
          is_available: boolean | null
          name: string
          price: number
          updated_at: string | null
        }
        Insert: {
          available?: boolean | null
          category_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          image_id?: string | null
          image_url?: string | null
          is_available?: boolean | null
          name: string
          price: number
          updated_at?: string | null
        }
        Update: {
          available?: boolean | null
          category_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          image_id?: string | null
          image_url?: string | null
          is_available?: boolean | null
          name?: string
          price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "food_drink_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "food_drink_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "food_drink_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "food_drink_items_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "images"
            referencedColumns: ["id"]
          },
        ]
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
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      item_modifier_groups: {
        Row: {
          created_at: string | null
          group_name: string | null
          id: string
          is_required: boolean | null
          item_id: string | null
          max_selections: number | null
          modifier_type: string
        }
        Insert: {
          created_at?: string | null
          group_name?: string | null
          id?: string
          is_required?: boolean | null
          item_id?: string | null
          max_selections?: number | null
          modifier_type: string
        }
        Update: {
          created_at?: string | null
          group_name?: string | null
          id?: string
          is_required?: boolean | null
          item_id?: string | null
          max_selections?: number | null
          modifier_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "item_modifier_groups_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "food_drink_items"
            referencedColumns: ["id"]
          },
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
      notification_preferences: {
        Row: {
          announcements: boolean | null
          chat_mentions: boolean | null
          created_at: string | null
          id: string
          marketing: boolean | null
          private_messages: boolean | null
          quiet_hours_enabled: boolean | null
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          sound_enabled: boolean | null
          updated_at: string | null
          id: string | null
          vibration_enabled: boolean | null
        }
        Insert: {
          announcements?: boolean | null
          chat_mentions?: boolean | null
          created_at?: string | null
          id?: string
          marketing?: boolean | null
          private_messages?: boolean | null
          quiet_hours_enabled?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          sound_enabled?: boolean | null
          updated_at?: string | null
          id?: string | null
          vibration_enabled?: boolean | null
        }
        Update: {
          announcements?: boolean | null
          chat_mentions?: boolean | null
          created_at?: string | null
          id?: string
          marketing?: boolean | null
          private_messages?: boolean | null
          quiet_hours_enabled?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          sound_enabled?: boolean | null
          updated_at?: string | null
          id?: string | null
          vibration_enabled?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          link: string | null
          message: string
          metadata: Json | null
          recipient_id: string
          status: string | null
          type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          link?: string | null
          message: string
          metadata?: Json | null
          recipient_id: string
          status?: string | null
          type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          link?: string | null
          message?: string
          metadata?: Json | null
          recipient_id?: string
          status?: string | null
          type?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string | null
          customizations: Json | null
          id: string
          item_id: string
          item_name: string
          notes: string | null
          order_id: string
          price_at_order: number
          quantity: number | null
        }
        Insert: {
          created_at?: string | null
          customizations?: Json | null
          id?: string
          item_id: string
          item_name: string
          notes?: string | null
          order_id: string
          price_at_order: number
          quantity?: number | null
        }
        Update: {
          created_at?: string | null
          customizations?: Json | null
          id?: string
          item_id?: string
          item_name?: string
          notes?: string | null
          order_id?: string
          price_at_order?: number
          quantity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "food_drink_items"
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
          created_at: string | null
          customer_id: string | null
          customer_notes: string | null
          id: string
          status: string | null
          table_id: string | null
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id?: string | null
          customer_notes?: string | null
          id?: string
          status?: string | null
          table_id?: string | null
          total_amount: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string | null
          customer_notes?: string | null
          id?: string
          status?: string | null
          table_id?: string | null
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          },
        ]
      }
      push_notifications: {
        Row: {
          announcement_id: string | null
          body: string
          clicked_at: string | null
          data: Json | null
          delivered_at: string | null
          device_token_id: string | null
          error_message: string | null
          firebase_message_id: string | null
          id: string
          read_at: string | null
          retry_count: number | null
          sent_at: string | null
          status: string | null
          title: string
          id: string | null
        }
        Insert: {
          announcement_id?: string | null
          body: string
          clicked_at?: string | null
          data?: Json | null
          delivered_at?: string | null
          device_token_id?: string | null
          error_message?: string | null
          firebase_message_id?: string | null
          id?: string
          read_at?: string | null
          retry_count?: number | null
          sent_at?: string | null
          status?: string | null
          title: string
          id?: string | null
        }
        Update: {
          announcement_id?: string | null
          body?: string
          clicked_at?: string | null
          data?: Json | null
          delivered_at?: string | null
          device_token_id?: string | null
          error_message?: string | null
          firebase_message_id?: string | null
          id?: string
          read_at?: string | null
          retry_count?: number | null
          sent_at?: string | null
          status?: string | null
          title?: string
          id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "push_notifications_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "push_notifications_device_token_id_fkey"
            columns: ["device_token_id"]
            isOneToOne: false
            referencedRelation: "device_tokens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "push_notifications_id_fkey"
            columns: ["id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      schema_migrations: {
        Row: {
          applied_at: string | null
          id: number
          name: string
          version: string
        }
        Insert: {
          applied_at?: string | null
          id?: number
          name: string
          version: string
        }
        Update: {
          applied_at?: string | null
          id?: number
          name?: string
          version?: string
        }
        Relationships: []
      }
      tables: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          section: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          section?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          section?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_app_settings: {
        Row: {
          app_version: string | null
          background_location_enabled: boolean | null
          created_at: string | null
          id: string
          last_location_sync: string | null
          location_permission_granted: boolean | null
          location_permission_requested_at: string | null
          platform: string | null
          updated_at: string | null
          id: string | null
        }
        Insert: {
          app_version?: string | null
          background_location_enabled?: boolean | null
          created_at?: string | null
          id?: string
          last_location_sync?: string | null
          location_permission_granted?: boolean | null
          location_permission_requested_at?: string | null
          platform?: string | null
          updated_at?: string | null
          id?: string | null
        }
        Update: {
          app_version?: string | null
          background_location_enabled?: boolean | null
          created_at?: string | null
          id?: string
          last_location_sync?: string | null
          location_permission_granted?: boolean | null
          location_permission_requested_at?: string | null
          platform?: string | null
          updated_at?: string | null
          id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_app_settings_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_location_history: {
        Row: {
          created_at: string | null
          id: string
          is_at_location: boolean | null
          latitude: number
          location_id: string | null
          longitude: number
          id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_at_location?: boolean | null
          latitude: number
          location_id?: string | null
          longitude: number
          id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_at_location?: boolean | null
          latitude?: number
          location_id?: string | null
          longitude?: number
          id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_location_history_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_location_history_id_fkey"
            columns: ["id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
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
        Relationships: [
          {
            foreignKeyName: "users_avatar_id_fkey"
            columns: ["avatar_id"]
            isOneToOne: false
            referencedRelation: "images"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_blocked_by_fkey"
            columns: ["blocked_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      wolf_chat: {
        Row: {
          chat_type: string | null
          created_at: string | null
          flag_reason: string | null
          flagged: boolean | null
          flagged_at: string | null
          flagged_by: string | null
          id: string
          image_id: string | null
          image_url: string | null
          is_admin: boolean | null
          is_admin_message: boolean | null
          is_deleted: boolean | null
          message: string
          updated_at: string | null
          id: string | null
        }
        Insert: {
          chat_type?: string | null
          created_at?: string | null
          flag_reason?: string | null
          flagged?: boolean | null
          flagged_at?: string | null
          flagged_by?: string | null
          id?: string
          image_id?: string | null
          image_url?: string | null
          is_admin?: boolean | null
          is_admin_message?: boolean | null
          is_deleted?: boolean | null
          message: string
          updated_at?: string | null
          id?: string | null
        }
        Update: {
          chat_type?: string | null
          created_at?: string | null
          flag_reason?: string | null
          flagged?: boolean | null
          flagged_at?: string | null
          flagged_by?: string | null
          id?: string
          image_id?: string | null
          image_url?: string | null
          is_admin?: boolean | null
          is_admin_message?: boolean | null
          is_deleted?: boolean | null
          message?: string
          updated_at?: string | null
          id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wolf_chat_flagged_by_fkey"
            columns: ["flagged_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolf_chat_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "images"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolf_chat_id_fkey"
            columns: ["id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      wolf_check_ins: {
        Row: {
          checked_in_at: string | null
          checked_out_at: string | null
          duration_minutes: number | null
          id: string
          location_id: string | null
          id: string | null
        }
        Insert: {
          checked_in_at?: string | null
          checked_out_at?: string | null
          duration_minutes?: number | null
          id?: string
          location_id?: string | null
          id?: string | null
        }
        Update: {
          checked_in_at?: string | null
          checked_out_at?: string | null
          duration_minutes?: number | null
          id?: string
          location_id?: string | null
          id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wolf_check_ins_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolf_check_ins_id_fkey"
            columns: ["id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      wolf_connections: {
        Row: {
          connection_type: string | null
          created_at: string | null
          id: string
          interaction_count: number | null
          last_interaction: string | null
          user_one_id: string | null
          user_two_id: string | null
        }
        Insert: {
          connection_type?: string | null
          created_at?: string | null
          id?: string
          interaction_count?: number | null
          last_interaction?: string | null
          user_one_id?: string | null
          user_two_id?: string | null
        }
        Update: {
          connection_type?: string | null
          created_at?: string | null
          id?: string
          interaction_count?: number | null
          last_interaction?: string | null
          user_one_id?: string | null
          user_two_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wolf_connections_user_one_id_fkey"
            columns: ["user_one_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolf_connections_user_two_id_fkey"
            columns: ["user_two_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      wolf_pack_contests: {
        Row: {
          contest_type: string | null
          created_by: string | null
          custom_title: string | null
          ends_at: string | null
          id: string
          is_active: boolean | null
          location_id: string | null
          started_at: string | null
        }
        Insert: {
          contest_type?: string | null
          created_by?: string | null
          custom_title?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean | null
          location_id?: string | null
          started_at?: string | null
        }
        Update: {
          contest_type?: string | null
          created_by?: string | null
          custom_title?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean | null
          location_id?: string | null
          started_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wolf_pack_contests_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolf_pack_contests_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      wolf_pack_interactions: {
        Row: {
          created_at: string | null
          sender_id: string | null
          id: string
          interaction_type: string | null
          receiver_id: string | null
        }
        Insert: {
          created_at?: string | null
          sender_id?: string | null
          id?: string
          interaction_type?: string | null
          receiver_id?: string | null
        }
        Update: {
          created_at?: string | null
          sender_id?: string | null
          id?: string
          interaction_type?: string | null
          receiver_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wolf_pack_interactions_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolf_pack_interactions_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      wolf_pack_members: {
        Row: {
          id: string
          joined_at: string | null
          last_activity: string | null
          latitude: number | null
          location_id: string
          longitude: number | null
          status: string | null
          table_location: string | null
          id: string
        }
        Insert: {
          id?: string
          joined_at?: string | null
          last_activity?: string | null
          latitude?: number | null
          location_id: string
          longitude?: number | null
          status?: string | null
          table_location?: string | null
          id: string
        }
        Update: {
          id?: string
          joined_at?: string | null
          last_activity?: string | null
          latitude?: number | null
          location_id?: string
          longitude?: number | null
          status?: string | null
          table_location?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wolf_pack_members_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolf_pack_members_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      wolf_pack_votes: {
        Row: {
          contest_id: string | null
          created_at: string | null
          event_id: string | null
          id: string
          participant_id: string | null
          voted_for_id: string | null
          voter_id: string | null
        }
        Insert: {
          contest_id?: string | null
          created_at?: string | null
          event_id?: string | null
          id?: string
          participant_id?: string | null
          voted_for_id?: string | null
          voter_id?: string | null
        }
        Update: {
          contest_id?: string | null
          created_at?: string | null
          event_id?: string | null
          id?: string
          participant_id?: string | null
          voted_for_id?: string | null
          voter_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wolf_pack_votes_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "wolf_pack_contests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolf_pack_votes_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "dj_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolf_pack_votes_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "dj_event_participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolf_pack_votes_voted_for_id_fkey"
            columns: ["voted_for_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolf_pack_votes_voter_id_fkey"
            columns: ["voter_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      wolf_private_messages: {
        Row: {
          created_at: string | null
          flag_reason: string | null
          flagged: boolean | null
          flagged_at: string | null
          flagged_by: string | null
          sender_id: string
          id: string
          image_id: string | null
          image_url: string | null
          is_deleted: boolean | null
          is_read: boolean | null
          message: string
          read_at: string | null
          receiver_id: string
        }
        Insert: {
          created_at?: string | null
          flag_reason?: string | null
          flagged?: boolean | null
          flagged_at?: string | null
          flagged_by?: string | null
          sender_id: string
          id?: string
          image_id?: string | null
          image_url?: string | null
          is_deleted?: boolean | null
          is_read?: boolean | null
          message: string
          read_at?: string | null
          receiver_id: string
        }
        Update: {
          created_at?: string | null
          flag_reason?: string | null
          flagged?: boolean | null
          flagged_at?: string | null
          flagged_by?: string | null
          sender_id?: string
          id?: string
          image_id?: string | null
          image_url?: string | null
          is_deleted?: boolean | null
          is_read?: boolean | null
          message?: string
          read_at?: string | null
          receiver_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wolf_private_messages_flagged_by_fkey"
            columns: ["flagged_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolf_private_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolf_private_messages_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "images"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolf_private_messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      wolf_profiles: {
        Row: {
          bio: string | null
          created_at: string | null
          display_name: string | null
          favorite_drink: string | null
          favorite_song: string | null
          id: string
          instagram_handle: string | null
          is_profile_visible: boolean | null
          last_seen_at: string | null
          looking_for: string | null
          profile_pic_url: string | null
          id: string
          vibe_status: string | null
          wolf_emoji: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          favorite_drink?: string | null
          favorite_song?: string | null
          id?: string
          instagram_handle?: string | null
          is_profile_visible?: boolean | null
          last_seen_at?: string | null
          looking_for?: string | null
          profile_pic_url?: string | null
          id: string
          vibe_status?: string | null
          wolf_emoji?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          favorite_drink?: string | null
          favorite_song?: string | null
          id?: string
          instagram_handle?: string | null
          is_profile_visible?: boolean | null
          last_seen_at?: string | null
          looking_for?: string | null
          profile_pic_url?: string | null
          id?: string
          vibe_status?: string | null
          wolf_emoji?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wolf_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      wolf_reactions: {
        Row: {
          created_at: string | null
          emoji: string
          id: string
          message_id: string | null
          id: string | null
        }
        Insert: {
          created_at?: string | null
          emoji: string
          id?: string
          message_id?: string | null
          id?: string | null
        }
        Update: {
          created_at?: string | null
          emoji?: string
          id?: string
          message_id?: string | null
          id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wolf_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "wolf_chat"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolf_reactions_id_fkey"
            columns: ["id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

