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
      _postgis_security_notice: {
        Row: {
          created_at: string | null
          id: number
          notice: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          notice?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          notice?: string | null
        }
        Relationships: []
      }
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
            referencedRelation: "active_wolfpack_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "image_usage_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "admin_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "wolfpack_members_at_location"
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
          delivery_stats: Json | null
          featured_image: string | null
          featured_image_id: string | null
          id: string
          metadata: Json | null
          priority: string | null
          push_failed_count: number | null
          push_scheduled_at: string | null
          push_sent_count: number | null
          scheduled_at: string | null
          send_push_notification: boolean | null
          sent_at: string | null
          target_audience: Json | null
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
          delivery_stats?: Json | null
          featured_image?: string | null
          featured_image_id?: string | null
          id?: string
          metadata?: Json | null
          priority?: string | null
          push_failed_count?: number | null
          push_scheduled_at?: string | null
          push_sent_count?: number | null
          scheduled_at?: string | null
          send_push_notification?: boolean | null
          sent_at?: string | null
          target_audience?: Json | null
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
          delivery_stats?: Json | null
          featured_image?: string | null
          featured_image_id?: string | null
          id?: string
          metadata?: Json | null
          priority?: string | null
          push_failed_count?: number | null
          push_scheduled_at?: string | null
          push_sent_count?: number | null
          scheduled_at?: string | null
          send_push_notification?: boolean | null
          sent_at?: string | null
          target_audience?: Json | null
          title?: string
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "announcements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "active_wolfpack_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "image_usage_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "announcements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "wolfpack_members_at_location"
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
          customer_gender: string | null
          customer_id: string | null
          customer_notes: string | null
          id: string
          items: Json
          location_id: string | null
          modification_notes: string | null
          notification_sent: boolean | null
          order_number: number
          order_type: string | null
          paid_at: string | null
          ready_at: string | null
          ready_notification_sent: boolean | null
          seating_location: string | null
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
          customer_gender?: string | null
          customer_id?: string | null
          customer_notes?: string | null
          id?: string
          items: Json
          location_id?: string | null
          modification_notes?: string | null
          notification_sent?: boolean | null
          order_number?: number
          order_type?: string | null
          paid_at?: string | null
          ready_at?: string | null
          ready_notification_sent?: boolean | null
          seating_location?: string | null
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
          customer_gender?: string | null
          customer_id?: string | null
          customer_notes?: string | null
          id?: string
          items?: Json
          location_id?: string | null
          modification_notes?: string | null
          notification_sent?: boolean | null
          order_number?: number
          order_type?: string | null
          paid_at?: string | null
          ready_at?: string | null
          ready_notification_sent?: boolean | null
          seating_location?: string | null
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
            referencedRelation: "active_wolfpack_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bartender_orders_bartender_id_fkey"
            columns: ["bartender_id"]
            isOneToOne: false
            referencedRelation: "image_usage_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "bartender_orders_bartender_id_fkey"
            columns: ["bartender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bartender_orders_bartender_id_fkey"
            columns: ["bartender_id"]
            isOneToOne: false
            referencedRelation: "wolfpack_members_at_location"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bartender_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "active_wolfpack_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bartender_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "image_usage_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "bartender_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bartender_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "wolfpack_members_at_location"
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
            foreignKeyName: "bartender_orders_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "wolf_pack_stats"
            referencedColumns: ["location_id"]
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
      bartender_quick_replies: {
        Row: {
          bartender_id: string | null
          created_at: string | null
          display_order: number | null
          emoji: string | null
          id: string
          is_default: boolean | null
          reply_text: string
        }
        Insert: {
          bartender_id?: string | null
          created_at?: string | null
          display_order?: number | null
          emoji?: string | null
          id?: string
          is_default?: boolean | null
          reply_text: string
        }
        Update: {
          bartender_id?: string | null
          created_at?: string | null
          display_order?: number | null
          emoji?: string | null
          id?: string
          is_default?: boolean | null
          reply_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "bartender_quick_replies_bartender_id_fkey"
            columns: ["bartender_id"]
            isOneToOne: false
            referencedRelation: "active_wolfpack_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bartender_quick_replies_bartender_id_fkey"
            columns: ["bartender_id"]
            isOneToOne: false
            referencedRelation: "image_usage_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "bartender_quick_replies_bartender_id_fkey"
            columns: ["bartender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bartender_quick_replies_bartender_id_fkey"
            columns: ["bartender_id"]
            isOneToOne: false
            referencedRelation: "wolfpack_members_at_location"
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
            referencedRelation: "active_wolfpack_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bartender_tabs_bartender_id_fkey"
            columns: ["bartender_id"]
            isOneToOne: false
            referencedRelation: "image_usage_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "bartender_tabs_bartender_id_fkey"
            columns: ["bartender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bartender_tabs_bartender_id_fkey"
            columns: ["bartender_id"]
            isOneToOne: false
            referencedRelation: "wolfpack_members_at_location"
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
            referencedRelation: "active_wolfpack_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_flags_flagged_by_fkey"
            columns: ["flagged_by"]
            isOneToOne: false
            referencedRelation: "image_usage_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "content_flags_flagged_by_fkey"
            columns: ["flagged_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_flags_flagged_by_fkey"
            columns: ["flagged_by"]
            isOneToOne: false
            referencedRelation: "wolfpack_members_at_location"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_flags_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "active_wolfpack_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_flags_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "image_usage_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "content_flags_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_flags_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "wolfpack_members_at_location"
            referencedColumns: ["id"]
          },
        ]
      }
      device_registrations: {
        Row: {
          created_at: string | null
          device_id: string
          id: string
          is_primary: boolean | null
          last_active: string | null
          staff_id: string | null
          table_id: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          device_id: string
          id?: string
          is_primary?: boolean | null
          last_active?: string | null
          staff_id?: string | null
          table_id?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          device_id?: string
          id?: string
          is_primary?: boolean | null
          last_active?: string | null
          staff_id?: string | null
          table_id?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "device_registrations_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "active_wolfpack_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "device_registrations_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "image_usage_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "device_registrations_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "device_registrations_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "wolfpack_members_at_location"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "device_registrations_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
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
          user_id: string | null
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
          user_id?: string | null
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
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "device_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "active_wolfpack_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "device_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "image_usage_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "device_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "device_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "wolfpack_members_at_location"
            referencedColumns: ["id"]
          },
        ]
      }
      dj_broadcast_templates: {
        Row: {
          created_at: string | null
          dj_id: string | null
          emoji_prefix: string | null
          emoji_suffix: string | null
          id: string
          is_global: boolean | null
          message_template: string
          template_name: string
        }
        Insert: {
          created_at?: string | null
          dj_id?: string | null
          emoji_prefix?: string | null
          emoji_suffix?: string | null
          id?: string
          is_global?: boolean | null
          message_template: string
          template_name: string
        }
        Update: {
          created_at?: string | null
          dj_id?: string | null
          emoji_prefix?: string | null
          emoji_suffix?: string | null
          id?: string
          is_global?: boolean | null
          message_template?: string
          template_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "dj_broadcast_templates_dj_id_fkey"
            columns: ["dj_id"]
            isOneToOne: false
            referencedRelation: "active_wolfpack_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dj_broadcast_templates_dj_id_fkey"
            columns: ["dj_id"]
            isOneToOne: false
            referencedRelation: "image_usage_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "dj_broadcast_templates_dj_id_fkey"
            columns: ["dj_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dj_broadcast_templates_dj_id_fkey"
            columns: ["dj_id"]
            isOneToOne: false
            referencedRelation: "wolfpack_members_at_location"
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
            referencedRelation: "active_wolfpack_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dj_broadcasts_dj_id_fkey"
            columns: ["dj_id"]
            isOneToOne: false
            referencedRelation: "image_usage_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "dj_broadcasts_dj_id_fkey"
            columns: ["dj_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dj_broadcasts_dj_id_fkey"
            columns: ["dj_id"]
            isOneToOne: false
            referencedRelation: "wolfpack_members_at_location"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dj_broadcasts_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dj_broadcasts_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "wolf_pack_stats"
            referencedColumns: ["location_id"]
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
            referencedRelation: "active_wolfpack_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dj_event_participants_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "image_usage_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "dj_event_participants_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dj_event_participants_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "wolfpack_members_at_location"
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
          options: Json | null
          started_at: string | null
          status: string | null
          title: string
          voting_ends_at: string | null
          voting_format: string | null
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
          options?: Json | null
          started_at?: string | null
          status?: string | null
          title: string
          voting_ends_at?: string | null
          voting_format?: string | null
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
          options?: Json | null
          started_at?: string | null
          status?: string | null
          title?: string
          voting_ends_at?: string | null
          voting_format?: string | null
          winner_data?: Json | null
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dj_events_dj_id_fkey"
            columns: ["dj_id"]
            isOneToOne: false
            referencedRelation: "active_wolfpack_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dj_events_dj_id_fkey"
            columns: ["dj_id"]
            isOneToOne: false
            referencedRelation: "image_usage_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "dj_events_dj_id_fkey"
            columns: ["dj_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dj_events_dj_id_fkey"
            columns: ["dj_id"]
            isOneToOne: false
            referencedRelation: "wolfpack_members_at_location"
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
            foreignKeyName: "dj_events_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "wolf_pack_stats"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "dj_events_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "active_wolfpack_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dj_events_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "image_usage_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "dj_events_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dj_events_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "wolfpack_members_at_location"
            referencedColumns: ["id"]
          },
        ]
      }
      flirt_interaction_rules: {
        Row: {
          allowed_actions: string[] | null
          created_at: string | null
          id: string
          receiver_gender: string | null
          sender_gender: string | null
        }
        Insert: {
          allowed_actions?: string[] | null
          created_at?: string | null
          id?: string
          receiver_gender?: string | null
          sender_gender?: string | null
        }
        Update: {
          allowed_actions?: string[] | null
          created_at?: string | null
          id?: string
          receiver_gender?: string | null
          sender_gender?: string | null
        }
        Relationships: []
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
            referencedRelation: "active_wolfpack_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "food_drink_categories_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "image_usage_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "food_drink_categories_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "food_drink_categories_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "wolfpack_members_at_location"
            referencedColumns: ["id"]
          },
        ]
      }
      food_drink_items: {
        Row: {
          category_id: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          display_order: number | null
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
          display_order?: number | null
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
          display_order?: number | null
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
            isOneToOne: false
            referencedRelation: "food_drink_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "food_drink_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "menu_items_with_categories"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "food_drink_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "active_wolfpack_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "food_drink_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "image_usage_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "food_drink_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "food_drink_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "wolfpack_members_at_location"
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
            referencedRelation: "active_wolfpack_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "images_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "image_usage_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "images_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "images_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "wolfpack_members_at_location"
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
          {
            foreignKeyName: "item_modifier_groups_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "menu_item_modifier_details"
            referencedColumns: ["item_id"]
          },
          {
            foreignKeyName: "item_modifier_groups_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "menu_items_full"
            referencedColumns: ["item_id"]
          },
          {
            foreignKeyName: "item_modifier_groups_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "menu_items_with_categories"
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
          geofence: unknown | null
          geom: unknown | null
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
          geofence?: unknown | null
          geom?: unknown | null
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
          geofence?: unknown | null
          geom?: unknown | null
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
      modifier_group_items: {
        Row: {
          created_at: string | null
          display_order: number | null
          group_id: string
          id: string
          is_default: boolean | null
          modifier_id: string
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          group_id: string
          id?: string
          is_default?: boolean | null
          modifier_id: string
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          group_id?: string
          id?: string
          is_default?: boolean | null
          modifier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "modifier_group_items_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "item_modifier_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "modifier_group_items_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "menu_item_modifier_details"
            referencedColumns: ["modifier_group_id"]
          },
          {
            foreignKeyName: "modifier_group_items_modifier_id_fkey"
            columns: ["modifier_id"]
            isOneToOne: false
            referencedRelation: "menu_item_modifiers"
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
          link: string | null
          read_at: string | null
          retry_count: number | null
          sent_at: string | null
          status: string | null
          title: string
          user_id: string | null
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
          link?: string | null
          read_at?: string | null
          retry_count?: number | null
          sent_at?: string | null
          status?: string | null
          title: string
          user_id?: string | null
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
          link?: string | null
          read_at?: string | null
          retry_count?: number | null
          sent_at?: string | null
          status?: string | null
          title?: string
          user_id?: string | null
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
            foreignKeyName: "push_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "active_wolfpack_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "push_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "image_usage_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "push_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "push_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "wolfpack_members_at_location"
            referencedColumns: ["id"]
          },
        ]
      }
      quick_reply_templates: {
        Row: {
          created_at: string | null
          emoji: string | null
          id: string
          message_template: string
          reply_type: string
          role_required: string | null
        }
        Insert: {
          created_at?: string | null
          emoji?: string | null
          id?: string
          message_template: string
          reply_type: string
          role_required?: string | null
        }
        Update: {
          created_at?: string | null
          emoji?: string | null
          id?: string
          message_template?: string
          reply_type?: string
          role_required?: string | null
        }
        Relationships: []
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
      spatial_ref_sys: {
        Row: {
          auth_name: string | null
          auth_srid: number | null
          proj4text: string | null
          srid: number
          srtext: string | null
        }
        Insert: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid: number
          srtext?: string | null
        }
        Update: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid?: number
          srtext?: string | null
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
          user_id: string | null
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
          user_id?: string | null
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
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_app_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "active_wolfpack_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_app_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "image_usage_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_app_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_app_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "wolfpack_members_at_location"
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
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_at_location?: boolean | null
          latitude: number
          location_id?: string | null
          longitude: number
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_at_location?: boolean | null
          latitude?: number
          location_id?: string | null
          longitude?: number
          user_id?: string | null
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
            foreignKeyName: "user_location_history_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "wolf_pack_stats"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "user_location_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "active_wolfpack_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_location_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "image_usage_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_location_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_location_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "wolfpack_members_at_location"
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
          location_permissions_granted: boolean | null
          notes: string | null
          password_hash: string | null
          permissions: Json | null
          phone: string | null
          phone_verification_code: string | null
          phone_verification_sent_at: string | null
          phone_verified: boolean | null
          privacy_settings: Json | null
          role: string | null
          sensitive_data_encrypted: Json | null
          status: string | null
          updated_at: string
          wolfpack_joined_at: string | null
          wolfpack_status: string | null
          wolfpack_tier: string | null
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
          location_permissions_granted?: boolean | null
          notes?: string | null
          password_hash?: string | null
          permissions?: Json | null
          phone?: string | null
          phone_verification_code?: string | null
          phone_verification_sent_at?: string | null
          phone_verified?: boolean | null
          privacy_settings?: Json | null
          role?: string | null
          sensitive_data_encrypted?: Json | null
          status?: string | null
          updated_at?: string
          wolfpack_joined_at?: string | null
          wolfpack_status?: string | null
          wolfpack_tier?: string | null
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
          location_permissions_granted?: boolean | null
          notes?: string | null
          password_hash?: string | null
          permissions?: Json | null
          phone?: string | null
          phone_verification_code?: string | null
          phone_verification_sent_at?: string | null
          phone_verified?: boolean | null
          privacy_settings?: Json | null
          role?: string | null
          sensitive_data_encrypted?: Json | null
          status?: string | null
          updated_at?: string
          wolfpack_joined_at?: string | null
          wolfpack_status?: string | null
          wolfpack_tier?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_users_blocked_by"
            columns: ["blocked_by"]
            isOneToOne: false
            referencedRelation: "active_wolfpack_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_users_blocked_by"
            columns: ["blocked_by"]
            isOneToOne: false
            referencedRelation: "image_usage_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_users_blocked_by"
            columns: ["blocked_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_users_blocked_by"
            columns: ["blocked_by"]
            isOneToOne: false
            referencedRelation: "wolfpack_members_at_location"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_avatar_id_fkey"
            columns: ["avatar_id"]
            isOneToOne: false
            referencedRelation: "images"
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
          location_id: string | null
          message: string
          updated_at: string | null
          user_id: string | null
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
          location_id?: string | null
          message: string
          updated_at?: string | null
          user_id?: string | null
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
          location_id?: string | null
          message?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wolf_chat_flagged_by_fkey"
            columns: ["flagged_by"]
            isOneToOne: false
            referencedRelation: "active_wolfpack_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolf_chat_flagged_by_fkey"
            columns: ["flagged_by"]
            isOneToOne: false
            referencedRelation: "image_usage_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "wolf_chat_flagged_by_fkey"
            columns: ["flagged_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolf_chat_flagged_by_fkey"
            columns: ["flagged_by"]
            isOneToOne: false
            referencedRelation: "wolfpack_members_at_location"
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
            foreignKeyName: "wolf_chat_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolf_chat_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "wolf_pack_stats"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "wolf_chat_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "active_wolfpack_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolf_chat_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "image_usage_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "wolf_chat_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolf_chat_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "wolfpack_members_at_location"
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
          user_id: string | null
        }
        Insert: {
          checked_in_at?: string | null
          checked_out_at?: string | null
          duration_minutes?: number | null
          id?: string
          location_id?: string | null
          user_id?: string | null
        }
        Update: {
          checked_in_at?: string | null
          checked_out_at?: string | null
          duration_minutes?: number | null
          id?: string
          location_id?: string | null
          user_id?: string | null
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
            foreignKeyName: "wolf_check_ins_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "wolf_pack_stats"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "wolf_check_ins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "active_wolfpack_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolf_check_ins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "image_usage_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "wolf_check_ins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolf_check_ins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "wolfpack_members_at_location"
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
            referencedRelation: "active_wolfpack_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolf_connections_user_one_id_fkey"
            columns: ["user_one_id"]
            isOneToOne: false
            referencedRelation: "image_usage_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "wolf_connections_user_one_id_fkey"
            columns: ["user_one_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolf_connections_user_one_id_fkey"
            columns: ["user_one_id"]
            isOneToOne: false
            referencedRelation: "wolfpack_members_at_location"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolf_connections_user_two_id_fkey"
            columns: ["user_two_id"]
            isOneToOne: false
            referencedRelation: "active_wolfpack_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolf_connections_user_two_id_fkey"
            columns: ["user_two_id"]
            isOneToOne: false
            referencedRelation: "image_usage_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "wolf_connections_user_two_id_fkey"
            columns: ["user_two_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolf_connections_user_two_id_fkey"
            columns: ["user_two_id"]
            isOneToOne: false
            referencedRelation: "wolfpack_members_at_location"
            referencedColumns: ["id"]
          },
        ]
      }
      wolf_pack_avatars: {
        Row: {
          created_at: string | null
          id: string
          image_id: string
          is_active: boolean | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_id: string
          is_active?: boolean | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          image_id?: string
          is_active?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wolf_pack_avatars_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "images"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolf_pack_avatars_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "active_wolfpack_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolf_pack_avatars_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "image_usage_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "wolf_pack_avatars_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolf_pack_avatars_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "wolfpack_members_at_location"
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
          results: Json | null
          started_at: string | null
          winner_id: string | null
        }
        Insert: {
          contest_type?: string | null
          created_by?: string | null
          custom_title?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean | null
          location_id?: string | null
          results?: Json | null
          started_at?: string | null
          winner_id?: string | null
        }
        Update: {
          contest_type?: string | null
          created_by?: string | null
          custom_title?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean | null
          location_id?: string | null
          results?: Json | null
          started_at?: string | null
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wolf_pack_contests_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "active_wolfpack_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolf_pack_contests_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "image_usage_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "wolf_pack_contests_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolf_pack_contests_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "wolfpack_members_at_location"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolf_pack_contests_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolf_pack_contests_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "wolf_pack_stats"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "wolf_pack_contests_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "active_wolfpack_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolf_pack_contests_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "image_usage_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "wolf_pack_contests_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolf_pack_contests_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "wolfpack_members_at_location"
            referencedColumns: ["id"]
          },
        ]
      }
      wolf_pack_emojis: {
        Row: {
          created_at: string | null
          display_order: number | null
          emoji_category: string
          emoji_code: string
          emoji_name: string
          emoji_url: string | null
          id: string
          is_premium: boolean | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          emoji_category: string
          emoji_code: string
          emoji_name: string
          emoji_url?: string | null
          id?: string
          is_premium?: boolean | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          emoji_category?: string
          emoji_code?: string
          emoji_name?: string
          emoji_url?: string | null
          id?: string
          is_premium?: boolean | null
        }
        Relationships: []
      }
      wolf_pack_interactions: {
        Row: {
          created_at: string | null
          flirt_type: string | null
          from_user_id: string | null
          id: string
          interaction_type: string | null
          is_flirt: boolean | null
          to_user_id: string | null
        }
        Insert: {
          created_at?: string | null
          flirt_type?: string | null
          from_user_id?: string | null
          id?: string
          interaction_type?: string | null
          is_flirt?: boolean | null
          to_user_id?: string | null
        }
        Update: {
          created_at?: string | null
          flirt_type?: string | null
          from_user_id?: string | null
          id?: string
          interaction_type?: string | null
          is_flirt?: boolean | null
          to_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wolf_pack_interactions_from_user_id_fkey"
            columns: ["from_user_id"]
            isOneToOne: false
            referencedRelation: "active_wolfpack_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolf_pack_interactions_from_user_id_fkey"
            columns: ["from_user_id"]
            isOneToOne: false
            referencedRelation: "image_usage_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "wolf_pack_interactions_from_user_id_fkey"
            columns: ["from_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolf_pack_interactions_from_user_id_fkey"
            columns: ["from_user_id"]
            isOneToOne: false
            referencedRelation: "wolfpack_members_at_location"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolf_pack_interactions_to_user_id_fkey"
            columns: ["to_user_id"]
            isOneToOne: false
            referencedRelation: "active_wolfpack_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolf_pack_interactions_to_user_id_fkey"
            columns: ["to_user_id"]
            isOneToOne: false
            referencedRelation: "image_usage_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "wolf_pack_interactions_to_user_id_fkey"
            columns: ["to_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolf_pack_interactions_to_user_id_fkey"
            columns: ["to_user_id"]
            isOneToOne: false
            referencedRelation: "wolfpack_members_at_location"
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
          user_id: string
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
          user_id: string
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
          user_id?: string
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
            foreignKeyName: "wolf_pack_members_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "wolf_pack_stats"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "wolf_pack_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "active_wolfpack_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolf_pack_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "image_usage_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "wolf_pack_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolf_pack_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "wolfpack_members_at_location"
            referencedColumns: ["id"]
          },
        ]
      }
      wolf_pack_votes: {
        Row: {
          choice: string | null
          contest_id: string | null
          created_at: string | null
          event_id: string | null
          id: string
          participant_id: string | null
          voted_for_id: string | null
          voter_id: string | null
        }
        Insert: {
          choice?: string | null
          contest_id?: string | null
          created_at?: string | null
          event_id?: string | null
          id?: string
          participant_id?: string | null
          voted_for_id?: string | null
          voter_id?: string | null
        }
        Update: {
          choice?: string | null
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
            referencedRelation: "active_wolfpack_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolf_pack_votes_voted_for_id_fkey"
            columns: ["voted_for_id"]
            isOneToOne: false
            referencedRelation: "image_usage_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "wolf_pack_votes_voted_for_id_fkey"
            columns: ["voted_for_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolf_pack_votes_voted_for_id_fkey"
            columns: ["voted_for_id"]
            isOneToOne: false
            referencedRelation: "wolfpack_members_at_location"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolf_pack_votes_voter_id_fkey"
            columns: ["voter_id"]
            isOneToOne: false
            referencedRelation: "active_wolfpack_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolf_pack_votes_voter_id_fkey"
            columns: ["voter_id"]
            isOneToOne: false
            referencedRelation: "image_usage_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "wolf_pack_votes_voter_id_fkey"
            columns: ["voter_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolf_pack_votes_voter_id_fkey"
            columns: ["voter_id"]
            isOneToOne: false
            referencedRelation: "wolfpack_members_at_location"
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
          from_user_id: string
          id: string
          image_id: string | null
          image_url: string | null
          is_deleted: boolean | null
          is_flirt_message: boolean | null
          is_read: boolean | null
          message: string
          read_at: string | null
          to_user_id: string
        }
        Insert: {
          created_at?: string | null
          flag_reason?: string | null
          flagged?: boolean | null
          flagged_at?: string | null
          flagged_by?: string | null
          from_user_id: string
          id?: string
          image_id?: string | null
          image_url?: string | null
          is_deleted?: boolean | null
          is_flirt_message?: boolean | null
          is_read?: boolean | null
          message: string
          read_at?: string | null
          to_user_id: string
        }
        Update: {
          created_at?: string | null
          flag_reason?: string | null
          flagged?: boolean | null
          flagged_at?: string | null
          flagged_by?: string | null
          from_user_id?: string
          id?: string
          image_id?: string | null
          image_url?: string | null
          is_deleted?: boolean | null
          is_flirt_message?: boolean | null
          is_read?: boolean | null
          message?: string
          read_at?: string | null
          to_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wolf_private_messages_flagged_by_fkey"
            columns: ["flagged_by"]
            isOneToOne: false
            referencedRelation: "active_wolfpack_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolf_private_messages_flagged_by_fkey"
            columns: ["flagged_by"]
            isOneToOne: false
            referencedRelation: "image_usage_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "wolf_private_messages_flagged_by_fkey"
            columns: ["flagged_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolf_private_messages_flagged_by_fkey"
            columns: ["flagged_by"]
            isOneToOne: false
            referencedRelation: "wolfpack_members_at_location"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolf_private_messages_from_user_id_fkey"
            columns: ["from_user_id"]
            isOneToOne: false
            referencedRelation: "active_wolfpack_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolf_private_messages_from_user_id_fkey"
            columns: ["from_user_id"]
            isOneToOne: false
            referencedRelation: "image_usage_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "wolf_private_messages_from_user_id_fkey"
            columns: ["from_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolf_private_messages_from_user_id_fkey"
            columns: ["from_user_id"]
            isOneToOne: false
            referencedRelation: "wolfpack_members_at_location"
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
            foreignKeyName: "wolf_private_messages_to_user_id_fkey"
            columns: ["to_user_id"]
            isOneToOne: false
            referencedRelation: "active_wolfpack_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolf_private_messages_to_user_id_fkey"
            columns: ["to_user_id"]
            isOneToOne: false
            referencedRelation: "image_usage_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "wolf_private_messages_to_user_id_fkey"
            columns: ["to_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolf_private_messages_to_user_id_fkey"
            columns: ["to_user_id"]
            isOneToOne: false
            referencedRelation: "wolfpack_members_at_location"
            referencedColumns: ["id"]
          },
        ]
      }
      wolf_profiles: {
        Row: {
          bio: string | null
          created_at: string | null
          custom_avatar_id: string | null
          daily_customization: Json | null
          display_name: string | null
          favorite_drink: string | null
          favorite_song: string | null
          gender: string | null
          id: string
          instagram_handle: string | null
          is_visible: boolean | null
          last_seen_at: string | null
          looking_for: string | null
          profile_pic_url: string | null
          pronouns: string | null
          user_id: string
          vibe_status: string | null
          wolf_emoji: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string | null
          custom_avatar_id?: string | null
          daily_customization?: Json | null
          display_name?: string | null
          favorite_drink?: string | null
          favorite_song?: string | null
          gender?: string | null
          id?: string
          instagram_handle?: string | null
          is_visible?: boolean | null
          last_seen_at?: string | null
          looking_for?: string | null
          profile_pic_url?: string | null
          pronouns?: string | null
          user_id: string
          vibe_status?: string | null
          wolf_emoji?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string | null
          custom_avatar_id?: string | null
          daily_customization?: Json | null
          display_name?: string | null
          favorite_drink?: string | null
          favorite_song?: string | null
          gender?: string | null
          id?: string
          instagram_handle?: string | null
          is_visible?: boolean | null
          last_seen_at?: string | null
          looking_for?: string | null
          profile_pic_url?: string | null
          pronouns?: string | null
          user_id?: string
          vibe_status?: string | null
          wolf_emoji?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wolf_profiles_custom_avatar_id_fkey"
            columns: ["custom_avatar_id"]
            isOneToOne: false
            referencedRelation: "images"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolf_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "active_wolfpack_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolf_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "image_usage_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "wolf_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolf_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "wolfpack_members_at_location"
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
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          emoji: string
          id?: string
          message_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          emoji?: string
          id?: string
          message_id?: string | null
          user_id?: string | null
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
            foreignKeyName: "wolf_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "active_wolfpack_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolf_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "image_usage_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "wolf_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolf_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "wolfpack_members_at_location"
            referencedColumns: ["id"]
          },
        ]
      }
      wolfpack_analytics: {
        Row: {
          created_at: string | null
          event_data: Json | null
          event_type: string
          features_used: Json | null
          id: string
          interactions_count: number | null
          location_id: string | null
          orders_placed: number | null
          session_duration: unknown | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_data?: Json | null
          event_type: string
          features_used?: Json | null
          id?: string
          interactions_count?: number | null
          location_id?: string | null
          orders_placed?: number | null
          session_duration?: unknown | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_data?: Json | null
          event_type?: string
          features_used?: Json | null
          id?: string
          interactions_count?: number | null
          location_id?: string | null
          orders_placed?: number | null
          session_duration?: unknown | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wolfpack_analytics_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolfpack_analytics_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "wolf_pack_stats"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "wolfpack_analytics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "active_wolfpack_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolfpack_analytics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "image_usage_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "wolfpack_analytics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolfpack_analytics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "wolfpack_members_at_location"
            referencedColumns: ["id"]
          },
        ]
      }
      wolfpack_bar_tabs: {
        Row: {
          closed_at: string | null
          created_at: string | null
          id: string
          location_id: string
          notes: string | null
          opened_at: string | null
          status: string
          total_amount: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          closed_at?: string | null
          created_at?: string | null
          id?: string
          location_id: string
          notes?: string | null
          opened_at?: string | null
          status?: string
          total_amount?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          closed_at?: string | null
          created_at?: string | null
          id?: string
          location_id?: string
          notes?: string | null
          opened_at?: string | null
          status?: string
          total_amount?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wolfpack_bar_tabs_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolfpack_bar_tabs_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "wolf_pack_stats"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "wolfpack_bar_tabs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "active_wolfpack_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolfpack_bar_tabs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "image_usage_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "wolfpack_bar_tabs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolfpack_bar_tabs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "wolfpack_members_at_location"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      active_wolf_pack_view: {
        Row: {
          display_name: string | null
          email: string | null
          first_name: string | null
          id: string | null
          joined_at: string | null
          last_activity: string | null
          last_name: string | null
          location_id: string | null
          location_name: string | null
          presence_status: string | null
          table_location: string | null
          user_id: string | null
          wolf_emoji: string | null
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
            foreignKeyName: "wolf_pack_members_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "wolf_pack_stats"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "wolf_pack_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "active_wolfpack_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolf_pack_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "image_usage_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "wolf_pack_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolf_pack_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "wolfpack_members_at_location"
            referencedColumns: ["id"]
          },
        ]
      }
      active_wolfpack_members: {
        Row: {
          email: string | null
          first_name: string | null
          id: string | null
          last_name: string | null
          location_permissions_granted: boolean | null
          open_bar_tabs: number | null
          total_bar_tabs: number | null
          wolfpack_joined_at: string | null
          wolfpack_status: string | null
          wolfpack_tier: string | null
        }
        Relationships: []
      }
      available_flirt_responses: {
        Row: {
          allowed_actions: string[] | null
          gender: string | null
          quick_responses: string[] | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wolf_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "active_wolfpack_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolf_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "image_usage_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "wolf_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolf_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "wolfpack_members_at_location"
            referencedColumns: ["id"]
          },
        ]
      }
      geography_columns: {
        Row: {
          coord_dimension: number | null
          f_geography_column: unknown | null
          f_table_catalog: unknown | null
          f_table_name: unknown | null
          f_table_schema: unknown | null
          srid: number | null
          type: string | null
        }
        Relationships: []
      }
      geometry_columns: {
        Row: {
          coord_dimension: number | null
          f_geometry_column: unknown | null
          f_table_catalog: string | null
          f_table_name: unknown | null
          f_table_schema: unknown | null
          srid: number | null
          type: string | null
        }
        Insert: {
          coord_dimension?: number | null
          f_geometry_column?: unknown | null
          f_table_catalog?: string | null
          f_table_name?: unknown | null
          f_table_schema?: unknown | null
          srid?: number | null
          type?: string | null
        }
        Update: {
          coord_dimension?: number | null
          f_geometry_column?: unknown | null
          f_table_catalog?: string | null
          f_table_name?: unknown | null
          f_table_schema?: unknown | null
          srid?: number | null
          type?: string | null
        }
        Relationships: []
      }
      image_usage_summary: {
        Row: {
          avatar_count: number | null
          chat_images: number | null
          email: string | null
          full_name: string | null
          last_upload: string | null
          message_images: number | null
          total_bytes: number | null
          total_images: number | null
          total_size_formatted: string | null
          user_id: string | null
        }
        Relationships: []
      }
      menu_item_modifier_details: {
        Row: {
          category: string | null
          category_order: number | null
          description: string | null
          group_name: string | null
          is_available: boolean | null
          is_required: boolean | null
          item_id: string | null
          item_name: string | null
          max_selections: number | null
          modifier_group_id: string | null
          modifier_type: string | null
          price: number | null
        }
        Relationships: []
      }
      menu_items_full: {
        Row: {
          category_name: string | null
          category_order: number | null
          category_type: string | null
          description: string | null
          is_available: boolean | null
          item_id: string | null
          item_name: string | null
          item_order: number | null
          modifier_groups: Json | null
          price: number | null
        }
        Relationships: []
      }
      menu_items_modifier_summary: {
        Row: {
          category: string | null
          description: string | null
          display_order: number | null
          item_name: string | null
          required_modifiers: string[] | null
        }
        Relationships: []
      }
      menu_items_with_categories: {
        Row: {
          category_color: string | null
          category_icon: string | null
          category_id: string | null
          category_name: string | null
          category_order: number | null
          category_type: string | null
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string | null
          image_id: string | null
          is_available: boolean | null
          name: string | null
          price: number | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "food_drink_items_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "images"
            referencedColumns: ["id"]
          },
        ]
      }
      spatial_ref_sys_view: {
        Row: {
          auth_name: string | null
          auth_srid: number | null
          proj4text: string | null
          srid: number | null
          srtext: string | null
        }
        Insert: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid?: number | null
          srtext?: string | null
        }
        Update: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid?: number | null
          srtext?: string | null
        }
        Relationships: []
      }
      wolf_pack_admin_dashboard: {
        Row: {
          active_profiles: number | null
          active_users: number | null
          current_pack_members: number | null
          location_stats: Json | null
          messages_last_hour: number | null
          orders_today: number | null
          revenue_today: number | null
          total_bartenders: number | null
          total_djs: number | null
        }
        Relationships: []
      }
      wolf_pack_stats: {
        Row: {
          active_members: number | null
          female_wolves: number | null
          location_id: string | null
          location_name: string | null
          male_wolves: number | null
          messages_last_hour: number | null
          orders_last_hour: number | null
        }
        Relationships: []
      }
      wolfpack_members_at_location: {
        Row: {
          avatar_url: string | null
          display_name: string | null
          first_name: string | null
          id: string | null
          last_name: string | null
          last_seen: string | null
          location_id: string | null
          vibe_status: string | null
          wolf_emoji: string | null
          wolfpack_tier: string | null
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
            foreignKeyName: "user_location_history_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "wolf_pack_stats"
            referencedColumns: ["location_id"]
          },
        ]
      }
    }
    Functions: {
      _postgis_deprecate: {
        Args: { oldname: string; newname: string; version: string }
        Returns: undefined
      }
      _postgis_index_extent: {
        Args: { tbl: unknown; col: string }
        Returns: unknown
      }
      _postgis_pgsql_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      _postgis_scripts_pgsql_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      _postgis_selectivity: {
        Args: { tbl: unknown; att_name: string; geom: unknown; mode?: string }
        Returns: number
      }
      _st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_bestsrid: {
        Args: { "": unknown }
        Returns: number
      }
      _st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_coveredby: {
        Args:
          | { geog1: unknown; geog2: unknown }
          | { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_covers: {
        Args:
          | { geog1: unknown; geog2: unknown }
          | { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_crosses: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      _st_equals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_intersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      _st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      _st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      _st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_pointoutside: {
        Args: { "": unknown }
        Returns: unknown
      }
      _st_sortablehash: {
        Args: { geom: unknown }
        Returns: number
      }
      _st_touches: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_voronoi: {
        Args: {
          g1: unknown
          clip?: unknown
          tolerance?: number
          return_polygons?: boolean
        }
        Returns: unknown
      }
      _st_within: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      add_modifier_to_group: {
        Args: {
          p_group_id: string
          p_modifier_id: string
          p_display_order?: number
          p_is_default?: boolean
        }
        Returns: string
      }
      addauth: {
        Args: { "": string }
        Returns: boolean
      }
      addgeometrycolumn: {
        Args:
          | {
              catalog_name: string
              schema_name: string
              table_name: string
              column_name: string
              new_srid_in: number
              new_type: string
              new_dim: number
              use_typmod?: boolean
            }
          | {
              schema_name: string
              table_name: string
              column_name: string
              new_srid: number
              new_type: string
              new_dim: number
              use_typmod?: boolean
            }
          | {
              table_name: string
              column_name: string
              new_srid: number
              new_type: string
              new_dim: number
              use_typmod?: boolean
            }
        Returns: string
      }
      admin_add_item_modifiers: {
        Args: {
          p_item_id: string
          p_group_name: string
          p_modifier_names: string[]
          p_is_required?: boolean
        }
        Returns: Json
      }
      admin_approve_redemption: {
        Args: { p_redemption_id: string }
        Returns: Json
      }
      admin_block_user: {
        Args: { p_user_id: string; p_reason?: string }
        Returns: Json
      }
      admin_create_menu_category: {
        Args: {
          p_name: string
          p_type: string
          p_icon?: string
          p_color?: string
          p_description?: string
        }
        Returns: Json
      }
      admin_create_menu_item: {
        Args: {
          p_name: string
          p_description: string
          p_price: number
          p_category_id: string
          p_is_available?: boolean
        }
        Returns: Json
      }
      admin_create_user: {
        Args: {
          p_email: string
          p_password: string
          p_first_name?: string
          p_last_name?: string
          p_role?: string
        }
        Returns: Json
      }
      admin_delete_announcement: {
        Args: { p_id: string }
        Returns: Json
      }
      admin_delete_chat_message: {
        Args: { p_message_id: string }
        Returns: Json
      }
      admin_delete_image: {
        Args: { p_image_id: string }
        Returns: Json
      }
      admin_delete_menu_item: {
        Args: { p_item_id: string }
        Returns: Json
      }
      admin_delete_message: {
        Args: { p_message_id: string; p_message_type: string }
        Returns: boolean
      }
      admin_delete_user: {
        Args: { p_user_id: string }
        Returns: Json
      }
      admin_force_checkout: {
        Args: { p_checkin_id: string }
        Returns: Json
      }
      admin_get_all_blocks: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      admin_get_all_chat_messages: {
        Args: { p_limit?: number; p_offset?: number }
        Returns: Json
      }
      admin_get_all_roles: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      admin_get_analytics: {
        Args: { p_metric?: string; p_date_from?: string; p_date_to?: string }
        Returns: Json
      }
      admin_get_app_config: {
        Args: { p_key?: string }
        Returns: Json
      }
      admin_get_blocked_users: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      admin_get_checkin_history: {
        Args: { p_user_id?: string; p_limit?: number }
        Returns: Json
      }
      admin_get_connection_stats: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      admin_get_current_checkins: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      admin_get_image_stats: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      admin_get_images: {
        Args: { p_limit?: number }
        Returns: Json
      }
      admin_get_menu_categories: {
        Args: { p_type?: string }
        Returns: Json
      }
      admin_get_menu_items: {
        Args: {
          p_category_id?: string
          p_search?: string
          p_available_only?: boolean
        }
        Returns: Json
      }
      admin_get_messageable_users: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      admin_get_notification_preferences: {
        Args: { p_user_id?: string }
        Returns: Json
      }
      admin_get_private_message_overview: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      admin_get_private_message_overview_bypass: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      admin_get_private_message_overview_explicit: {
        Args: { p_user_id: string }
        Returns: Json
      }
      admin_get_private_messages: {
        Args: { p_limit?: number; p_offset?: number; p_user_filter?: string }
        Returns: {
          message_id: string
          from_user_id: string
          from_email: string
          from_name: string
          to_user_id: string
          to_email: string
          to_name: string
          message: string
          image_url: string
          is_read: boolean
          created_at: string
          read_at: string
        }[]
      }
      admin_get_public_chat_monitor: {
        Args: { p_limit?: number; p_offset?: number; p_filter_admin?: boolean }
        Returns: {
          message_id: string
          user_id: string
          user_email: string
          user_name: string
          message: string
          image_url: string
          is_admin: boolean
          created_at: string
          reaction_count: number
          reported_count: number
        }[]
      }
      admin_get_push_audit_log: {
        Args: { p_limit?: number }
        Returns: Json
      }
      admin_get_push_history: {
        Args: { p_limit?: number; p_offset?: number }
        Returns: Json
      }
      admin_get_quick_stats: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      admin_get_recent_private_conversations: {
        Args: { p_limit?: number }
        Returns: Json
      }
      admin_get_role_permissions: {
        Args: { p_role_id: string }
        Returns: Json
      }
      admin_get_simple_chat_stats: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      admin_get_system_summary: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      admin_get_table_assignments: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      admin_get_user_connections: {
        Args: { p_user_id?: string }
        Returns: Json
      }
      admin_get_user_stats: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      admin_get_users: {
        Args: { p_search?: string; p_status?: string; p_role?: string }
        Returns: {
          user_id: string
          email: string
          first_name: string
          last_name: string
          role: string
          status: string
          is_blocked: boolean
          blocked_at: string
          block_reason: string
          created_at: string
          last_login: string
          avatar_url: string
        }[]
      }
      admin_manage_user_status: {
        Args: { p_user_id: string; p_action: string; p_reason?: string }
        Returns: boolean
      }
      admin_moderate_report: {
        Args: { p_report_id: string; p_action: string; p_notes?: string }
        Returns: Json
      }
      admin_restore_user: {
        Args: { target_user_id: string }
        Returns: Json
      }
      admin_search_private_messages: {
        Args: { p_search_term: string }
        Returns: Json
      }
      admin_send_announcement_push: {
        Args: { p_announcement_id: string }
        Returns: Json
      }
      admin_send_chat_message: {
        Args: { p_message: string; p_image_url?: string }
        Returns: Json
      }
      admin_send_message: {
        Args: { p_to_user_id: string; p_message: string; p_image_id?: string }
        Returns: string
      }
      admin_send_private_message: {
        Args: { p_to_user_id: string; p_message: string; p_image_url?: string }
        Returns: Json
      }
      admin_send_push_notification: {
        Args: {
          p_title: string
          p_body: string
          p_target_type: string
          p_target_users?: string[]
          p_target_role?: string
        }
        Returns: Json
      }
      admin_set_app_config: {
        Args: { p_key: string; p_value: string }
        Returns: Json
      }
      admin_toggle_item_availability: {
        Args: { p_item_id: string }
        Returns: Json
      }
      admin_unblock_user: {
        Args: { p_user_id: string }
        Returns: Json
      }
      admin_update_announcement: {
        Args: {
          p_id: string
          p_title?: string
          p_content?: string
          p_active?: boolean
          p_featured_image?: string
        }
        Returns: Json
      }
      admin_update_item_image: {
        Args: { p_item_id: string; p_image_url: string }
        Returns: Json
      }
      admin_update_menu_item: {
        Args: {
          p_item_id: string
          p_name?: string
          p_description?: string
          p_price?: number
          p_category_id?: string
          p_is_available?: boolean
        }
        Returns: Json
      }
      admin_update_user: {
        Args: {
          p_user_id: string
          p_email?: string
          p_first_name?: string
          p_last_name?: string
          p_role?: string
          p_status?: string
        }
        Returns: Json
      }
      admin_update_user_password: {
        Args: { p_user_id: string; p_new_password: string }
        Returns: Json
      }
      admin_update_user_status: {
        Args: { target_user_id: string; new_status: string }
        Returns: Json
      }
      analyze_index_usage: {
        Args: Record<PropertyKey, never>
        Returns: {
          schema_name: string
          table_name: string
          index_name: string
          index_size: string
          usage_count: number
          recommendation: string
        }[]
      }
      apply_for_wolfpack_membership: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      approve_wolfpack_membership: {
        Args: { target_user_id: string }
        Returns: Json
      }
      assign_user_role: {
        Args: { p_user_id: string; p_role: string; p_assigned_by?: string }
        Returns: Json
      }
      background_location_sync: {
        Args: { p_locations: Json }
        Returns: Json
      }
      bartender_message_customer: {
        Args: { p_customer_id: string; p_message: string; p_order_id?: string }
        Returns: string
      }
      box: {
        Args: { "": unknown } | { "": unknown }
        Returns: unknown
      }
      box2d: {
        Args: { "": unknown } | { "": unknown }
        Returns: unknown
      }
      box2d_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      box2d_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      box2df_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      box2df_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      box3d: {
        Args: { "": unknown } | { "": unknown }
        Returns: unknown
      }
      box3d_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      box3d_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      box3dtobox: {
        Args: { "": unknown }
        Returns: unknown
      }
      bytea: {
        Args: { "": unknown } | { "": unknown }
        Returns: string
      }
      can_access_bar_tab: {
        Args: { user_id: string; location_id: string }
        Returns: boolean
      }
      can_access_wolf_chat: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      can_message_user: {
        Args: { p_target_user_id: string }
        Returns: Json
      }
      cast_dj_event_vote: {
        Args: {
          p_voter_id: string
          p_event_id: string
          p_voted_for_id?: string
          p_participant_id?: string
          p_choice?: string
        }
        Returns: string
      }
      check_cart_access: {
        Args: {
          user_id: string
          user_lat: number
          user_lng: number
          location_id: string
        }
        Returns: Json
      }
      check_cron_job_runs: {
        Args: { p_limit?: number }
        Returns: Json
      }
      check_cron_jobs: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      check_functions_without_search_path: {
        Args: Record<PropertyKey, never>
        Returns: {
          function_name: string
          security_type: string
          recommendation: string
        }[]
      }
      check_in_at_bar: {
        Args: { p_table_number?: number; p_mood?: string }
        Returns: Json
      }
      check_is_admin: {
        Args: { check_auth_id: string }
        Returns: boolean
      }
      check_is_admin_no_rls: {
        Args: { check_auth_id: string }
        Returns: boolean
      }
      check_is_admin_simple: {
        Args: { check_auth_id: string }
        Returns: boolean
      }
      check_out_of_bar: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      check_rls_performance_issues: {
        Args: Record<PropertyKey, never>
        Returns: {
          table_name: string
          policy_name: string
          issue_type: string
          recommendation: string
        }[]
      }
      check_rls_status: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      check_srid_exists: {
        Args: { check_srid: number }
        Returns: boolean
      }
      check_user_exists: {
        Args: { p_name: string }
        Returns: Json
      }
      check_wolfpack_location_access: {
        Args: { user_lat: number; user_lng: number }
        Returns: Json
      }
      cleanup_cache: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_expired_sessions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_invalid_device_tokens: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      close_dj_event: {
        Args: { p_event_id: string }
        Returns: Json
      }
      close_old_wolfpack_tabs: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_announcement: {
        Args: {
          p_title: string
          p_content: string
          p_type?: string
          p_priority?: string
          p_featured_image?: string
        }
        Returns: Json
      }
      create_bartender_order: {
        Args: {
          p_customer_id: string
          p_items: Json
          p_total: number
          p_order_type: string
          p_table_location?: string
          p_customer_notes?: string
        }
        Returns: string
      }
      create_connection: {
        Args: {
          p_user_one_id: string
          p_user_two_id: string
          p_connection_type?: string
        }
        Returns: undefined
      }
      create_customer_order: {
        Args: {
          p_items: Json
          p_order_type?: string
          p_table_location?: string
          p_notes?: string
        }
        Returns: Json
      }
      create_dj_event: {
        Args: {
          p_dj_id: string
          p_location_id: string
          p_event_type: string
          p_title: string
          p_description?: string
          p_voting_duration_minutes?: number
          p_options?: Json
        }
        Returns: string
      }
      create_image_record: {
        Args: {
          p_name: string
          p_url: string
          p_size?: number
          p_type?: string
          p_dimensions?: Json
        }
        Returns: Json
      }
      create_menu_item_complete: {
        Args: {
          p_category_id: string
          p_name: string
          p_description: string
          p_price: number
          p_modifier_groups?: Json
        }
        Returns: string
      }
      create_notification: {
        Args: {
          p_recipient_id: string
          p_message: string
          p_type?: string
          p_link?: string
          p_metadata?: Json
        }
        Returns: string
      }
      create_test_push_notification: {
        Args: { p_title?: string; p_body?: string }
        Returns: Json
      }
      debug_auth_context: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      debug_current_user: {
        Args: Record<PropertyKey, never>
        Returns: {
          current_auth_uid: string
          found_user_email: string
          found_user_role: string
          is_admin_check: boolean
        }[]
      }
      debug_my_auth_status: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      debug_user_auth_mapping: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      delete_env_var: {
        Args: { p_key: string }
        Returns: Json
      }
      demo_complete_order_flow: {
        Args: { p_customer_id: string; p_location_id: string }
        Returns: Json
      }
      demo_wolf_pack_complete_flow: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      disablelongtransactions: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      dj_broadcast_message: {
        Args: { p_message: string; p_broadcast_type?: string }
        Returns: Json
      }
      dj_create_dance_battle: {
        Args: { p_dancer1_id: string; p_dancer2_id: string }
        Returns: Json
      }
      dj_create_song_vote: {
        Args: { p_songs: Json }
        Returns: Json
      }
      dj_create_voting_event: {
        Args: {
          p_event_type: string
          p_title: string
          p_description: string
          p_voting_duration_minutes: number
          p_participants: string[]
        }
        Returns: Json
      }
      dropgeometrycolumn: {
        Args:
          | {
              catalog_name: string
              schema_name: string
              table_name: string
              column_name: string
            }
          | { schema_name: string; table_name: string; column_name: string }
          | { table_name: string; column_name: string }
        Returns: string
      }
      dropgeometrytable: {
        Args:
          | { catalog_name: string; schema_name: string; table_name: string }
          | { schema_name: string; table_name: string }
          | { table_name: string }
        Returns: string
      }
      enablelongtransactions: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      equals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      fetch_notifications: {
        Args: { p_user_id?: string; p_limit?: number; p_offset?: number }
        Returns: {
          id: string
          user_id: string
          type: string
          title: string
          message: string
          read: boolean
          data: Json
          created_at: string
          updated_at: string
        }[]
      }
      fix_firebase_credentials: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      geography: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      geography_analyze: {
        Args: { "": unknown }
        Returns: boolean
      }
      geography_gist_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      geography_gist_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      geography_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      geography_send: {
        Args: { "": unknown }
        Returns: string
      }
      geography_spgist_compress_nd: {
        Args: { "": unknown }
        Returns: unknown
      }
      geography_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      geography_typmod_out: {
        Args: { "": number }
        Returns: unknown
      }
      geometry: {
        Args:
          | { "": string }
          | { "": string }
          | { "": unknown }
          | { "": unknown }
          | { "": unknown }
          | { "": unknown }
          | { "": unknown }
          | { "": unknown }
        Returns: unknown
      }
      geometry_above: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_analyze: {
        Args: { "": unknown }
        Returns: boolean
      }
      geometry_below: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_cmp: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_contained_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_distance_box: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_distance_centroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_eq: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_ge: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_gist_compress_2d: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_gist_compress_nd: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_gist_decompress_2d: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_gist_decompress_nd: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_gist_sortsupport_2d: {
        Args: { "": unknown }
        Returns: undefined
      }
      geometry_gt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_hash: {
        Args: { "": unknown }
        Returns: number
      }
      geometry_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_le: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_left: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_lt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_overabove: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overbelow: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overleft: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overright: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_recv: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_right: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_send: {
        Args: { "": unknown }
        Returns: string
      }
      geometry_sortsupport: {
        Args: { "": unknown }
        Returns: undefined
      }
      geometry_spgist_compress_2d: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_spgist_compress_3d: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_spgist_compress_nd: {
        Args: { "": unknown }
        Returns: unknown
      }
      geometry_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      geometry_typmod_out: {
        Args: { "": number }
        Returns: unknown
      }
      geometry_within: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometrytype: {
        Args: { "": unknown } | { "": unknown }
        Returns: string
      }
      geomfromewkb: {
        Args: { "": string }
        Returns: unknown
      }
      geomfromewkt: {
        Args: { "": string }
        Returns: unknown
      }
      get_active_orders: {
        Args: Record<PropertyKey, never>
        Returns: {
          order_id: string
          order_number: number
          customer_name: string
          table_location: string
          items: Json
          total_amount: number
          status: string
          payment_status: string
          time_waiting: unknown
          order_type: string
          customer_notes: string
        }[]
      }
      get_active_users: {
        Args: Record<PropertyKey, never>
        Returns: {
          user_id: string
          email: string
          first_name: string
          last_name: string
          avatar_url: string
          display_name: string
          wolf_emoji: string
          vibe_status: string
          checked_in_at: string
          table_number: number
          mood: string
        }[]
      }
      get_admin_dashboard_overview: {
        Args: Record<PropertyKey, never>
        Returns: {
          total_users: number
          users_today: number
          users_this_week: number
          approved_users: number
          active_users: number
          last_updated: string
        }[]
      }
      get_admin_simple_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          total_users: number
          current_wolf_pack: number
          orders_today: number
          active_events: number
        }[]
      }
      get_all_users: {
        Args: Record<PropertyKey, never>
        Returns: {
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
          location_permissions_granted: boolean | null
          notes: string | null
          password_hash: string | null
          permissions: Json | null
          phone: string | null
          phone_verification_code: string | null
          phone_verification_sent_at: string | null
          phone_verified: boolean | null
          privacy_settings: Json | null
          role: string | null
          sensitive_data_encrypted: Json | null
          status: string | null
          updated_at: string
          wolfpack_joined_at: string | null
          wolfpack_status: string | null
          wolfpack_tier: string | null
        }[]
      }
      get_analytics_overview: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_announcements: {
        Args: { p_limit?: number; p_offset?: number }
        Returns: Json
      }
      get_app_env_vars: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_basic_metrics: {
        Args: Record<PropertyKey, never>
        Returns: {
          metric: string
          value: number
        }[]
      }
      get_blocked_users: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_cached_data: {
        Args: { p_key: string; p_ttl_minutes?: number }
        Returns: Json
      }
      get_chat_feed: {
        Args: { p_limit?: number; p_offset?: number }
        Returns: {
          message_id: string
          user_id: string
          email: string
          first_name: string
          last_name: string
          avatar_url: string
          display_name: string
          wolf_emoji: string
          message: string
          image_url: string
          is_admin: boolean
          created_at: string
          reactions: Json
        }[]
      }
      get_chat_messages: {
        Args: { p_other_user_id: string; p_limit?: number }
        Returns: {
          message_id: string
          message: string
          image_url: string
          is_from_me: boolean
          created_at: string
          is_read: boolean
        }[]
      }
      get_chat_monitor_messages: {
        Args: { p_limit?: number; p_room_filter?: string }
        Returns: Json
      }
      get_chat_monitor_stats: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_complete_menu: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_conversation: {
        Args: { p_user1_id: string; p_user2_id: string; p_limit?: number }
        Returns: {
          id: string
          from_user_id: string
          to_user_id: string
          message: string
          image_url: string
          is_read: boolean
          created_at: string
        }[]
      }
      get_cron_status: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_current_user_profile: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          email: string
          first_name: string
          last_name: string
          role: string
          permissions: Json
          is_approved: boolean
          is_admin: boolean
          auth_id: string
        }[]
      }
      get_database_health: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_device_tokens_admin: {
        Args: {
          p_limit?: number
          p_offset?: number
          p_filter_platform?: string
          p_filter_active?: boolean
        }
        Returns: Json
      }
      get_env_var: {
        Args: { p_key: string }
        Returns: string
      }
      get_env_vars_by_category: {
        Args: { p_category: string }
        Returns: Json
      }
      get_event_leaderboard: {
        Args: { p_event_id?: string }
        Returns: {
          event_id: string
          event_title: string
          event_type: string
          participant_id: string
          participant_name: string
          vote_count: number
          rank: number
        }[]
      }
      get_firebase_config: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_firebase_credentials: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_image_url: {
        Args: { image_id: string }
        Returns: string
      }
      get_menu_categories: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          name: string
          description: string
          display_order: number
          is_active: boolean
          icon: string
          created_at: string
          updated_at: string
        }[]
      }
      get_menu_items: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          menu_category_id: string
          name: string
          description: string
          price: number
          is_available: boolean
          available: boolean
          image_url: string
          image_id: string
          display_order: number
          created_at: string
          updated_at: string
        }[]
      }
      get_menu_items_view: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          name: string
          description: string
          price: number
          is_available: boolean
          category_name: string
          menu_type: string
          category_icon: string
          category_color: string
          display_order: number
        }[]
      }
      get_menu_items_with_modifier_groups: {
        Args: Record<PropertyKey, never>
        Returns: {
          item_id: string
          item_name: string
          description: string
          price: number
          is_available: boolean
          category: string
          category_order: number
          modifier_groups: Json
        }[]
      }
      get_menu_items_with_modifiers: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          name: string
          description: string
          price: number
          is_available: boolean
          category_name: string
          menu_type: string
          category_icon: string
          modifiers: Json
        }[]
      }
      get_messageable_users: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_my_wolf_pack_status: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_notification_analytics: {
        Args: { p_days?: number }
        Returns: Json
      }
      get_performance_metrics: {
        Args: Record<PropertyKey, never>
        Returns: {
          metric_name: string
          metric_value: string
          metric_category: string
        }[]
      }
      get_private_chats: {
        Args: Record<PropertyKey, never>
        Returns: {
          other_user_id: string
          display_name: string
          wolf_emoji: string
          last_message: string
          last_message_time: string
          is_from_me: boolean
          unread_count: number
        }[]
      }
      get_private_conversation: {
        Args: { p_user_id: string; p_other_user_id: string; p_limit?: number }
        Returns: {
          message_id: string
          from_user_id: string
          from_user_name: string
          from_user_emoji: string
          is_from_me: boolean
          message: string
          image_url: string
          created_at: string
          is_read: boolean
        }[]
      }
      get_proj4_from_srid: {
        Args: { "": number }
        Returns: string
      }
      get_push_notification_audience_count: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_push_notification_stats: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_role_details: {
        Args: { p_role: string }
        Returns: Json
      }
      get_role_permissions: {
        Args: { p_role: string }
        Returns: Json
      }
      get_srid_info: {
        Args: { p_srid: number }
        Returns: {
          srid: number
          auth_name: string
          auth_srid: number
          srtext: string
          proj4text: string
        }[]
      }
      get_unread_count: {
        Args: { p_user_id: string }
        Returns: number
      }
      get_unread_counts: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_user_conversations: {
        Args: { p_user_id?: string }
        Returns: {
          conversation_user_id: string
          email: string
          first_name: string
          last_name: string
          avatar_url: string
          display_name: string
          wolf_emoji: string
          last_message: string
          last_message_time: string
          unread_count: number
          is_online: boolean
        }[]
      }
      get_user_dashboard: {
        Args: Record<PropertyKey, never>
        Returns: {
          unread_messages: number
          total_connections: number
          active_users_count: number
          recent_announcements: Json
        }[]
      }
      get_user_profile: {
        Args: { p_user_id: string }
        Returns: {
          user_id: string
          display_name: string
          wolf_emoji: string
          bio: string
          favorite_drink: string
          vibe_status: string
          instagram_handle: string
          favorite_song: string
          looking_for: string
          is_here_now: boolean
          last_seen: string
          total_howls: number
          member_since: string
        }[]
      }
      get_user_role: {
        Args: { user_auth_id?: string }
        Returns: string
      }
      get_user_storage_usage: {
        Args: { user_id: string }
        Returns: {
          total_size_bytes: number
          image_count: number
          size_formatted: string
        }[]
      }
      get_users_at_bar: {
        Args: Record<PropertyKey, never>
        Returns: {
          user_id: string
          display_name: string
          wolf_emoji: string
          table_number: number
          mood: string
          checked_in_at: string
          minutes_here: number
        }[]
      }
      get_valid_roles: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_wolf_pack_at_location: {
        Args: { p_location_id: string }
        Returns: {
          member_id: string
          user_id: string
          display_name: string
          wolf_emoji: string
          vibe_status: string
          table_location: string
          joined_at: string
          last_activity: string
        }[]
      }
      get_wolfpack_dashboard: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_wolfpack_members_at_location: {
        Args: { p_location_id: string }
        Returns: Json
      }
      get_wolfpack_metrics: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_wolfpack_status: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      gettransactionid: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      gidx_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gidx_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      handle_image_upload: {
        Args: {
          p_user_id: string
          p_file_name: string
          p_file_size: number
          p_mime_type: string
          p_image_type: string
        }
        Returns: string
      }
      handle_venue_checkin: {
        Args: { p_location_id: string }
        Returns: Json
      }
      handle_venue_checkout: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      has_role_permission: {
        Args: { required_roles: string[] }
        Returns: boolean
      }
      hello_rpc: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      init_user_app: {
        Args: { p_platform: string; p_app_version: string }
        Returns: Json
      }
      is_admin: {
        Args: Record<PropertyKey, never> | { user_auth_id: string }
        Returns: boolean
      }
      is_admin_by_email: {
        Args: { p_email?: string }
        Returns: boolean
      }
      is_admin_cached: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_bartender_cached: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_dj_cached: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_in_wolf_pack: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_user_in_wolf_pack: {
        Args: { user_id: string; location_id: string }
        Returns: boolean
      }
      is_user_within_location: {
        Args: { user_lat: number; user_lng: number; location_id: string }
        Returns: boolean
      }
      is_valid_role: {
        Args: { p_role: string }
        Returns: boolean
      }
      is_within_location_radius: {
        Args: { user_lat: number; user_lon: number; location_id: string }
        Returns: boolean
      }
      is_wolf_pack_available: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_wolfpack_member: {
        Args: { user_id: string }
        Returns: boolean
      }
      join_wolf_pack: {
        Args:
          | {
              p_user_id: string
              p_location_id: string
              p_latitude: number
              p_longitude: number
              p_table_location?: string
            }
          | {
              p_user_lat: number
              p_user_lon: number
              p_table_location?: string
            }
        Returns: Json
      }
      json: {
        Args: { "": unknown }
        Returns: Json
      }
      jsonb: {
        Args: { "": unknown }
        Returns: Json
      }
      kick_all_from_wolf_pack: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      leave_wolf_pack: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      link_my_auth_account: {
        Args: { p_user_email: string }
        Returns: Json
      }
      list_common_srids: {
        Args: Record<PropertyKey, never>
        Returns: {
          srid: number
          auth_name: string
          description: string
        }[]
      }
      list_env_vars: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      longtransactionsenabled: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      mark_message_read: {
        Args: { p_user_id: string; p_message_id: string }
        Returns: boolean
      }
      mark_messages_read: {
        Args:
          | { p_from_user_id: string }
          | { p_user_id: string; p_from_user_id: string }
        Returns: Json
      }
      mark_notification_read: {
        Args: { p_notification_id: string }
        Returns: boolean
      }
      mark_order_paid: {
        Args: { p_order_id: string; p_payment_method?: string }
        Returns: boolean
      }
      monitor_index_usage: {
        Args: Record<PropertyKey, never>
        Returns: {
          table_name: string
          index_name: string
          size: string
          scans: number
          status: string
        }[]
      }
      open_wolfpack_bar_tab: {
        Args: { location_id: string }
        Returns: Json
      }
      path: {
        Args: { "": unknown }
        Returns: unknown
      }
      pgis_asflatgeobuf_finalfn: {
        Args: { "": unknown }
        Returns: string
      }
      pgis_asgeobuf_finalfn: {
        Args: { "": unknown }
        Returns: string
      }
      pgis_asmvt_finalfn: {
        Args: { "": unknown }
        Returns: string
      }
      pgis_asmvt_serialfn: {
        Args: { "": unknown }
        Returns: string
      }
      pgis_geometry_clusterintersecting_finalfn: {
        Args: { "": unknown }
        Returns: unknown[]
      }
      pgis_geometry_clusterwithin_finalfn: {
        Args: { "": unknown }
        Returns: unknown[]
      }
      pgis_geometry_collect_finalfn: {
        Args: { "": unknown }
        Returns: unknown
      }
      pgis_geometry_makeline_finalfn: {
        Args: { "": unknown }
        Returns: unknown
      }
      pgis_geometry_polygonize_finalfn: {
        Args: { "": unknown }
        Returns: unknown
      }
      pgis_geometry_union_parallel_finalfn: {
        Args: { "": unknown }
        Returns: unknown
      }
      pgis_geometry_union_parallel_serialfn: {
        Args: { "": unknown }
        Returns: string
      }
      ping: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      place_wolf_pack_order: {
        Args: {
          p_customer_id: string
          p_location_id: string
          p_items: Json
          p_seating_location?: string
          p_modification_notes?: string
          p_customer_notes?: string
          p_bartender_id?: string
        }
        Returns: string
      }
      point: {
        Args: { "": unknown }
        Returns: unknown
      }
      polygon: {
        Args: { "": unknown }
        Returns: unknown
      }
      populate_geometry_columns: {
        Args:
          | { tbl_oid: unknown; use_typmod?: boolean }
          | { use_typmod?: boolean }
        Returns: string
      }
      postgis_addbbox: {
        Args: { "": unknown }
        Returns: unknown
      }
      postgis_constraint_dims: {
        Args: { geomschema: string; geomtable: string; geomcolumn: string }
        Returns: number
      }
      postgis_constraint_srid: {
        Args: { geomschema: string; geomtable: string; geomcolumn: string }
        Returns: number
      }
      postgis_constraint_type: {
        Args: { geomschema: string; geomtable: string; geomcolumn: string }
        Returns: string
      }
      postgis_dropbbox: {
        Args: { "": unknown }
        Returns: unknown
      }
      postgis_extensions_upgrade: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_full_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_geos_noop: {
        Args: { "": unknown }
        Returns: unknown
      }
      postgis_geos_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_getbbox: {
        Args: { "": unknown }
        Returns: unknown
      }
      postgis_hasbbox: {
        Args: { "": unknown }
        Returns: boolean
      }
      postgis_index_supportfn: {
        Args: { "": unknown }
        Returns: unknown
      }
      postgis_lib_build_date: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_lib_revision: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_lib_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_libjson_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_liblwgeom_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_libprotobuf_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_libxml_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_noop: {
        Args: { "": unknown }
        Returns: unknown
      }
      postgis_proj_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_scripts_build_date: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_scripts_installed: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_scripts_released: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_svn_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_type_name: {
        Args: {
          geomname: string
          coord_dimension: number
          use_new_name?: boolean
        }
        Returns: string
      }
      postgis_typmod_dims: {
        Args: { "": number }
        Returns: number
      }
      postgis_typmod_srid: {
        Args: { "": number }
        Returns: number
      }
      postgis_typmod_type: {
        Args: { "": number }
        Returns: string
      }
      postgis_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      postgis_wagyu_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      process_notifications_direct: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      process_push_notifications_cron: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      promote_user_to_admin: {
        Args: { user_email: string }
        Returns: Json
      }
      public_test: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      react_to_message: {
        Args: { p_message_id: string; p_emoji: string }
        Returns: Json
      }
      refresh_admin_views: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      refresh_dashboard_stats: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      refresh_user_stats: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      register_device_token: {
        Args: {
          p_token: string
          p_platform: string
          p_device_name?: string
          p_device_model?: string
          p_app_version?: string
        }
        Returns: Json
      }
      report_message: {
        Args: {
          p_message_id: string
          p_message_type: string
          p_reason: string
          p_details?: string
        }
        Returns: Json
      }
      request_song: {
        Args: { p_song_name: string; p_artist_name: string; p_notes?: string }
        Returns: string
      }
      reset_wolf_pack: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      run_security_audit: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      search_users: {
        Args: { p_query: string; p_limit?: number }
        Returns: {
          id: string
          email: string
          first_name: string
          last_name: string
          role: string
          status: string
          avatar_url: string
          display_name: string
          wolf_emoji: string
        }[]
      }
      send_announcement_with_push: {
        Args: {
          p_title: string
          p_content: string
          p_priority?: string
          p_type?: string
          p_send_push?: boolean
        }
        Returns: Json
      }
      send_chat_message: {
        Args: { p_message: string; p_image_url?: string }
        Returns: string
      }
      send_dj_broadcast_to_pack: {
        Args: {
          p_dj_id: string
          p_location_id: string
          p_message: string
          p_template_id?: string
        }
        Returns: string
      }
      send_flirt_interaction: {
        Args: {
          p_from_user_id: string
          p_to_user_id: string
          p_location_id: string
          p_flirt_type: string
        }
        Returns: string
      }
      send_food_ready_notification: {
        Args: {
          p_user_id: string
          p_order_details: string
          p_table_number?: number
        }
        Returns: Json
      }
      send_message: {
        Args: { p_message: string; p_to_user_id?: string; p_image_url?: string }
        Returns: Json
      }
      send_order_ready_notification: {
        Args: {
          p_order_id: string
          p_bartender_id: string
          p_custom_message?: string
        }
        Returns: boolean
      }
      send_private_message: {
        Args:
          | {
              p_from_user_id: string
              p_to_user_id: string
              p_message: string
              p_image_url?: string
            }
          | { p_to_user_id: string; p_message: string; p_image_url?: string }
        Returns: Json
      }
      send_private_message_simple: {
        Args: { p_to_user_id: string; p_message: string }
        Returns: Json
      }
      send_test_push_notification: {
        Args: { p_title?: string; p_body?: string }
        Returns: Json
      }
      send_wolf_chat_message: {
        Args: {
          p_user_id: string
          p_location_id: string
          p_message: string
          p_image_id?: string
          p_chat_type?: string
        }
        Returns: string
      }
      send_wolf_pack_interaction: {
        Args: {
          p_from_user_id: string
          p_to_user_id: string
          p_location_id: string
          p_interaction_type: string
        }
        Returns: string
      }
      send_wolf_pack_welcome_notification: {
        Args: { p_user_id: string; p_location_name: string }
        Returns: undefined
      }
      set_cached_data: {
        Args: { p_key: string; p_value: Json; p_ttl_minutes?: number }
        Returns: undefined
      }
      set_env_var: {
        Args: { p_key: string; p_value: string; p_description?: string }
        Returns: Json
      }
      set_performance_config: {
        Args: { p_key: string; p_value: string }
        Returns: boolean
      }
      setup_item_modifiers: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      smart_location_check: {
        Args:
          | { p_user_lat: number; p_user_lon: number }
          | {
              p_user_lat: number
              p_user_lon: number
              p_table_location?: string
            }
        Returns: Json
      }
      spheroid_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      spheroid_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_3dclosestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3ddistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_3dlength: {
        Args: { "": unknown }
        Returns: number
      }
      st_3dlongestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmakebox: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmaxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dperimeter: {
        Args: { "": unknown }
        Returns: number
      }
      st_3dshortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_addpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_angle: {
        Args:
          | { line1: unknown; line2: unknown }
          | { pt1: unknown; pt2: unknown; pt3: unknown; pt4?: unknown }
        Returns: number
      }
      st_area: {
        Args:
          | { "": string }
          | { "": unknown }
          | { geog: unknown; use_spheroid?: boolean }
        Returns: number
      }
      st_area2d: {
        Args: { "": unknown }
        Returns: number
      }
      st_asbinary: {
        Args: { "": unknown } | { "": unknown }
        Returns: string
      }
      st_asencodedpolyline: {
        Args: { geom: unknown; nprecision?: number }
        Returns: string
      }
      st_asewkb: {
        Args: { "": unknown }
        Returns: string
      }
      st_asewkt: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: string
      }
      st_asgeojson: {
        Args:
          | { "": string }
          | { geog: unknown; maxdecimaldigits?: number; options?: number }
          | { geom: unknown; maxdecimaldigits?: number; options?: number }
          | {
              r: Record<string, unknown>
              geom_column?: string
              maxdecimaldigits?: number
              pretty_bool?: boolean
            }
        Returns: string
      }
      st_asgml: {
        Args:
          | { "": string }
          | {
              geog: unknown
              maxdecimaldigits?: number
              options?: number
              nprefix?: string
              id?: string
            }
          | { geom: unknown; maxdecimaldigits?: number; options?: number }
          | {
              version: number
              geog: unknown
              maxdecimaldigits?: number
              options?: number
              nprefix?: string
              id?: string
            }
          | {
              version: number
              geom: unknown
              maxdecimaldigits?: number
              options?: number
              nprefix?: string
              id?: string
            }
        Returns: string
      }
      st_ashexewkb: {
        Args: { "": unknown }
        Returns: string
      }
      st_askml: {
        Args:
          | { "": string }
          | { geog: unknown; maxdecimaldigits?: number; nprefix?: string }
          | { geom: unknown; maxdecimaldigits?: number; nprefix?: string }
        Returns: string
      }
      st_aslatlontext: {
        Args: { geom: unknown; tmpl?: string }
        Returns: string
      }
      st_asmarc21: {
        Args: { geom: unknown; format?: string }
        Returns: string
      }
      st_asmvtgeom: {
        Args: {
          geom: unknown
          bounds: unknown
          extent?: number
          buffer?: number
          clip_geom?: boolean
        }
        Returns: unknown
      }
      st_assvg: {
        Args:
          | { "": string }
          | { geog: unknown; rel?: number; maxdecimaldigits?: number }
          | { geom: unknown; rel?: number; maxdecimaldigits?: number }
        Returns: string
      }
      st_astext: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: string
      }
      st_astwkb: {
        Args:
          | {
              geom: unknown[]
              ids: number[]
              prec?: number
              prec_z?: number
              prec_m?: number
              with_sizes?: boolean
              with_boxes?: boolean
            }
          | {
              geom: unknown
              prec?: number
              prec_z?: number
              prec_m?: number
              with_sizes?: boolean
              with_boxes?: boolean
            }
        Returns: string
      }
      st_asx3d: {
        Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
        Returns: string
      }
      st_azimuth: {
        Args:
          | { geog1: unknown; geog2: unknown }
          | { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_boundary: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_boundingdiagonal: {
        Args: { geom: unknown; fits?: boolean }
        Returns: unknown
      }
      st_buffer: {
        Args:
          | { geom: unknown; radius: number; options?: string }
          | { geom: unknown; radius: number; quadsegs: number }
        Returns: unknown
      }
      st_buildarea: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_centroid: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      st_cleangeometry: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_clipbybox2d: {
        Args: { geom: unknown; box: unknown }
        Returns: unknown
      }
      st_closestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_clusterintersecting: {
        Args: { "": unknown[] }
        Returns: unknown[]
      }
      st_collect: {
        Args: { "": unknown[] } | { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_collectionextract: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_collectionhomogenize: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_concavehull: {
        Args: {
          param_geom: unknown
          param_pctconvex: number
          param_allow_holes?: boolean
        }
        Returns: unknown
      }
      st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_convexhull: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_coorddim: {
        Args: { geometry: unknown }
        Returns: number
      }
      st_coveredby: {
        Args:
          | { geog1: unknown; geog2: unknown }
          | { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_covers: {
        Args:
          | { geog1: unknown; geog2: unknown }
          | { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_crosses: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_curvetoline: {
        Args: { geom: unknown; tol?: number; toltype?: number; flags?: number }
        Returns: unknown
      }
      st_delaunaytriangles: {
        Args: { g1: unknown; tolerance?: number; flags?: number }
        Returns: unknown
      }
      st_difference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_dimension: {
        Args: { "": unknown }
        Returns: number
      }
      st_disjoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_distance: {
        Args:
          | { geog1: unknown; geog2: unknown; use_spheroid?: boolean }
          | { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_distancesphere: {
        Args:
          | { geom1: unknown; geom2: unknown }
          | { geom1: unknown; geom2: unknown; radius: number }
        Returns: number
      }
      st_distancespheroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_dump: {
        Args: { "": unknown }
        Returns: Database["public"]["CompositeTypes"]["geometry_dump"][]
      }
      st_dumppoints: {
        Args: { "": unknown }
        Returns: Database["public"]["CompositeTypes"]["geometry_dump"][]
      }
      st_dumprings: {
        Args: { "": unknown }
        Returns: Database["public"]["CompositeTypes"]["geometry_dump"][]
      }
      st_dumpsegments: {
        Args: { "": unknown }
        Returns: Database["public"]["CompositeTypes"]["geometry_dump"][]
      }
      st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      st_endpoint: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_envelope: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_equals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_expand: {
        Args:
          | { box: unknown; dx: number; dy: number }
          | { box: unknown; dx: number; dy: number; dz?: number }
          | { geom: unknown; dx: number; dy: number; dz?: number; dm?: number }
        Returns: unknown
      }
      st_exteriorring: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_flipcoordinates: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_force2d: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_force3d: {
        Args: { geom: unknown; zvalue?: number }
        Returns: unknown
      }
      st_force3dm: {
        Args: { geom: unknown; mvalue?: number }
        Returns: unknown
      }
      st_force3dz: {
        Args: { geom: unknown; zvalue?: number }
        Returns: unknown
      }
      st_force4d: {
        Args: { geom: unknown; zvalue?: number; mvalue?: number }
        Returns: unknown
      }
      st_forcecollection: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_forcecurve: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_forcepolygonccw: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_forcepolygoncw: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_forcerhr: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_forcesfs: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_generatepoints: {
        Args:
          | { area: unknown; npoints: number }
          | { area: unknown; npoints: number; seed: number }
        Returns: unknown
      }
      st_geogfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_geogfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_geographyfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_geohash: {
        Args:
          | { geog: unknown; maxchars?: number }
          | { geom: unknown; maxchars?: number }
        Returns: string
      }
      st_geomcollfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_geomcollfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_geometricmedian: {
        Args: {
          g: unknown
          tolerance?: number
          max_iter?: number
          fail_if_not_converged?: boolean
        }
        Returns: unknown
      }
      st_geometryfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_geometrytype: {
        Args: { "": unknown }
        Returns: string
      }
      st_geomfromewkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_geomfromewkt: {
        Args: { "": string }
        Returns: unknown
      }
      st_geomfromgeojson: {
        Args: { "": Json } | { "": Json } | { "": string }
        Returns: unknown
      }
      st_geomfromgml: {
        Args: { "": string }
        Returns: unknown
      }
      st_geomfromkml: {
        Args: { "": string }
        Returns: unknown
      }
      st_geomfrommarc21: {
        Args: { marc21xml: string }
        Returns: unknown
      }
      st_geomfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_geomfromtwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_geomfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_gmltosql: {
        Args: { "": string }
        Returns: unknown
      }
      st_hasarc: {
        Args: { geometry: unknown }
        Returns: boolean
      }
      st_hausdorffdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_hexagon: {
        Args: { size: number; cell_i: number; cell_j: number; origin?: unknown }
        Returns: unknown
      }
      st_hexagongrid: {
        Args: { size: number; bounds: unknown }
        Returns: Record<string, unknown>[]
      }
      st_interpolatepoint: {
        Args: { line: unknown; point: unknown }
        Returns: number
      }
      st_intersection: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_intersects: {
        Args:
          | { geog1: unknown; geog2: unknown }
          | { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_isclosed: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_iscollection: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_isempty: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_ispolygonccw: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_ispolygoncw: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_isring: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_issimple: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_isvalid: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_isvaliddetail: {
        Args: { geom: unknown; flags?: number }
        Returns: Database["public"]["CompositeTypes"]["valid_detail"]
      }
      st_isvalidreason: {
        Args: { "": unknown }
        Returns: string
      }
      st_isvalidtrajectory: {
        Args: { "": unknown }
        Returns: boolean
      }
      st_length: {
        Args:
          | { "": string }
          | { "": unknown }
          | { geog: unknown; use_spheroid?: boolean }
        Returns: number
      }
      st_length2d: {
        Args: { "": unknown }
        Returns: number
      }
      st_letters: {
        Args: { letters: string; font?: Json }
        Returns: unknown
      }
      st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      st_linefromencodedpolyline: {
        Args: { txtin: string; nprecision?: number }
        Returns: unknown
      }
      st_linefrommultipoint: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_linefromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_linefromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_linelocatepoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_linemerge: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_linestringfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_linetocurve: {
        Args: { geometry: unknown }
        Returns: unknown
      }
      st_locatealong: {
        Args: { geometry: unknown; measure: number; leftrightoffset?: number }
        Returns: unknown
      }
      st_locatebetween: {
        Args: {
          geometry: unknown
          frommeasure: number
          tomeasure: number
          leftrightoffset?: number
        }
        Returns: unknown
      }
      st_locatebetweenelevations: {
        Args: { geometry: unknown; fromelevation: number; toelevation: number }
        Returns: unknown
      }
      st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_m: {
        Args: { "": unknown }
        Returns: number
      }
      st_makebox2d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makeline: {
        Args: { "": unknown[] } | { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makepolygon: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_makevalid: {
        Args: { "": unknown } | { geom: unknown; params: string }
        Returns: unknown
      }
      st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_maximuminscribedcircle: {
        Args: { "": unknown }
        Returns: Record<string, unknown>
      }
      st_memsize: {
        Args: { "": unknown }
        Returns: number
      }
      st_minimumboundingcircle: {
        Args: { inputgeom: unknown; segs_per_quarter?: number }
        Returns: unknown
      }
      st_minimumboundingradius: {
        Args: { "": unknown }
        Returns: Record<string, unknown>
      }
      st_minimumclearance: {
        Args: { "": unknown }
        Returns: number
      }
      st_minimumclearanceline: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_mlinefromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_mlinefromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_mpointfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_mpointfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_mpolyfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_mpolyfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_multi: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_multilinefromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_multilinestringfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_multipointfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_multipointfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_multipolyfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_multipolygonfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_ndims: {
        Args: { "": unknown }
        Returns: number
      }
      st_node: {
        Args: { g: unknown }
        Returns: unknown
      }
      st_normalize: {
        Args: { geom: unknown }
        Returns: unknown
      }
      st_npoints: {
        Args: { "": unknown }
        Returns: number
      }
      st_nrings: {
        Args: { "": unknown }
        Returns: number
      }
      st_numgeometries: {
        Args: { "": unknown }
        Returns: number
      }
      st_numinteriorring: {
        Args: { "": unknown }
        Returns: number
      }
      st_numinteriorrings: {
        Args: { "": unknown }
        Returns: number
      }
      st_numpatches: {
        Args: { "": unknown }
        Returns: number
      }
      st_numpoints: {
        Args: { "": unknown }
        Returns: number
      }
      st_offsetcurve: {
        Args: { line: unknown; distance: number; params?: string }
        Returns: unknown
      }
      st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_orientedenvelope: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_perimeter: {
        Args: { "": unknown } | { geog: unknown; use_spheroid?: boolean }
        Returns: number
      }
      st_perimeter2d: {
        Args: { "": unknown }
        Returns: number
      }
      st_pointfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_pointfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_pointm: {
        Args: {
          xcoordinate: number
          ycoordinate: number
          mcoordinate: number
          srid?: number
        }
        Returns: unknown
      }
      st_pointonsurface: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_points: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_pointz: {
        Args: {
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
          srid?: number
        }
        Returns: unknown
      }
      st_pointzm: {
        Args: {
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
          mcoordinate: number
          srid?: number
        }
        Returns: unknown
      }
      st_polyfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_polyfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_polygonfromtext: {
        Args: { "": string }
        Returns: unknown
      }
      st_polygonfromwkb: {
        Args: { "": string }
        Returns: unknown
      }
      st_polygonize: {
        Args: { "": unknown[] }
        Returns: unknown
      }
      st_project: {
        Args: { geog: unknown; distance: number; azimuth: number }
        Returns: unknown
      }
      st_quantizecoordinates: {
        Args: {
          g: unknown
          prec_x: number
          prec_y?: number
          prec_z?: number
          prec_m?: number
        }
        Returns: unknown
      }
      st_reduceprecision: {
        Args: { geom: unknown; gridsize: number }
        Returns: unknown
      }
      st_relate: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: string
      }
      st_removerepeatedpoints: {
        Args: { geom: unknown; tolerance?: number }
        Returns: unknown
      }
      st_reverse: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_segmentize: {
        Args: { geog: unknown; max_segment_length: number }
        Returns: unknown
      }
      st_setsrid: {
        Args: { geog: unknown; srid: number } | { geom: unknown; srid: number }
        Returns: unknown
      }
      st_sharedpaths: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_shiftlongitude: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_shortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_simplifypolygonhull: {
        Args: { geom: unknown; vertex_fraction: number; is_outer?: boolean }
        Returns: unknown
      }
      st_split: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_square: {
        Args: { size: number; cell_i: number; cell_j: number; origin?: unknown }
        Returns: unknown
      }
      st_squaregrid: {
        Args: { size: number; bounds: unknown }
        Returns: Record<string, unknown>[]
      }
      st_srid: {
        Args: { geog: unknown } | { geom: unknown }
        Returns: number
      }
      st_startpoint: {
        Args: { "": unknown }
        Returns: unknown
      }
      st_subdivide: {
        Args: { geom: unknown; maxvertices?: number; gridsize?: number }
        Returns: unknown[]
      }
      st_summary: {
        Args: { "": unknown } | { "": unknown }
        Returns: string
      }
      st_swapordinates: {
        Args: { geom: unknown; ords: unknown }
        Returns: unknown
      }
      st_symdifference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_symmetricdifference: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_tileenvelope: {
        Args: {
          zoom: number
          x: number
          y: number
          bounds?: unknown
          margin?: number
        }
        Returns: unknown
      }
      st_touches: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_transform: {
        Args:
          | { geom: unknown; from_proj: string; to_proj: string }
          | { geom: unknown; from_proj: string; to_srid: number }
          | { geom: unknown; to_proj: string }
        Returns: unknown
      }
      st_triangulatepolygon: {
        Args: { g1: unknown }
        Returns: unknown
      }
      st_union: {
        Args:
          | { "": unknown[] }
          | { geom1: unknown; geom2: unknown }
          | { geom1: unknown; geom2: unknown; gridsize: number }
        Returns: unknown
      }
      st_voronoilines: {
        Args: { g1: unknown; tolerance?: number; extend_to?: unknown }
        Returns: unknown
      }
      st_voronoipolygons: {
        Args: { g1: unknown; tolerance?: number; extend_to?: unknown }
        Returns: unknown
      }
      st_within: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_wkbtosql: {
        Args: { wkb: string }
        Returns: unknown
      }
      st_wkttosql: {
        Args: { "": string }
        Returns: unknown
      }
      st_wrapx: {
        Args: { geom: unknown; wrap: number; move: number }
        Returns: unknown
      }
      st_x: {
        Args: { "": unknown }
        Returns: number
      }
      st_xmax: {
        Args: { "": unknown }
        Returns: number
      }
      st_xmin: {
        Args: { "": unknown }
        Returns: number
      }
      st_y: {
        Args: { "": unknown }
        Returns: number
      }
      st_ymax: {
        Args: { "": unknown }
        Returns: number
      }
      st_ymin: {
        Args: { "": unknown }
        Returns: number
      }
      st_z: {
        Args: { "": unknown }
        Returns: number
      }
      st_zmax: {
        Args: { "": unknown }
        Returns: number
      }
      st_zmflag: {
        Args: { "": unknown }
        Returns: number
      }
      st_zmin: {
        Args: { "": unknown }
        Returns: number
      }
      start_event_voting: {
        Args: { p_event_id: string }
        Returns: boolean
      }
      test_admin_functions: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      test_admin_functions_for_user: {
        Args: { p_auth_id: string }
        Returns: Json
      }
      test_admin_with_specific_auth: {
        Args: { p_auth_id: string }
        Returns: Json
      }
      test_auth_and_admin: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      test_firebase_connection: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      test_menu_access: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      test_notification_setup: {
        Args: Record<PropertyKey, never>
        Returns: {
          check_name: string
          status: string
          details: string
        }[]
      }
      test_push_notification_system: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      text: {
        Args: { "": unknown }
        Returns: string
      }
      toggle_block_user: {
        Args: { p_user_id: string }
        Returns: Json
      }
      track_wolfpack_event: {
        Args: { event_type: string; event_data?: Json; location_id?: string }
        Returns: undefined
      }
      trigger_push_notifications: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      unlockrows: {
        Args: { "": string }
        Returns: number
      }
      update_location_geofence: {
        Args: {
          location_id: string
          latitude: number
          longitude: number
          radius_meters?: number
        }
        Returns: undefined
      }
      update_location_permission: {
        Args: { p_granted: boolean }
        Returns: Json
      }
      update_my_profile: {
        Args: { p_updates: Json }
        Returns: Json
      }
      update_notification_status: {
        Args: {
          p_notification_id: string
          p_status: string
          p_firebase_message_id?: string
        }
        Returns: Json
      }
      update_order_status: {
        Args: {
          p_order_id: string
          p_status: string
          p_bartender_notes?: string
        }
        Returns: boolean
      }
      update_user_role: {
        Args: { user_id: string; new_role: string }
        Returns: Json
      }
      update_wolf_profile: {
        Args: {
          p_user_id: string
          p_display_name?: string
          p_bio?: string
          p_favorite_drink?: string
          p_vibe_status?: string
          p_instagram_handle?: string
          p_favorite_song?: string
          p_looking_for?: string
          p_wolf_emoji?: string
        }
        Returns: Json
      }
      updategeometrysrid: {
        Args: {
          catalogn_name: string
          schema_name: string
          table_name: string
          column_name: string
          new_srid_in: number
        }
        Returns: string
      }
      upload_wolf_profile_image: {
        Args: {
          p_user_id: string
          p_image_data: string
          p_content_type: string
          p_filename: string
        }
        Returns: string
      }
      user_check_in: {
        Args: { p_table_number?: number; p_mood?: string }
        Returns: string
      }
      user_check_out: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      user_has_permission: {
        Args: { p_resource: string; p_action: string }
        Returns: boolean
      }
      validate_env_vars: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      your_function_name: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      geometry_dump: {
        path: number[] | null
        geom: unknown | null
      }
      valid_detail: {
        valid: boolean | null
        reason: string | null
        location: unknown | null
      }
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
  public: {
    Enums: {},
  },
} as const
