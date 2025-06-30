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
            referencedRelation: "restaurant_tables"
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
            referencedRelation: "active_orders_dashboard"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "admin_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "image_usage_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "user_auth_status"
            referencedColumns: ["id"]
          },
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
            referencedRelation: "active_orders_dashboard"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "announcements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "image_usage_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_auth_status"
            referencedColumns: ["id"]
          },
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
          customer_gender: string | null
          customer_id: string | null
          customer_notes: string | null
          id: string
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
          table_location: string | null
          total_amount: number
          updated_at: string | null
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
          table_location?: string | null
          total_amount: number
          updated_at?: string | null
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
          table_location?: string | null
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bartender_orders_bartender_id_fkey"
            columns: ["bartender_id"]
            isOneToOne: false
            referencedRelation: "active_orders_dashboard"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "bartender_orders_bartender_id_fkey"
            columns: ["bartender_id"]
            isOneToOne: false
            referencedRelation: "image_usage_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bartender_orders_bartender_id_fkey"
            columns: ["bartender_id"]
            isOneToOne: false
            referencedRelation: "user_auth_status"
            referencedColumns: ["id"]
          },
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
            referencedRelation: "active_orders_dashboard"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "bartender_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "image_usage_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bartender_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "user_auth_status"
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
            referencedRelation: "location_distances"
            referencedColumns: ["from_location_id"]
          },
          {
            foreignKeyName: "bartender_orders_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "location_distances"
            referencedColumns: ["to_location_id"]
          },
          {
            foreignKeyName: "bartender_orders_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "location_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bartender_orders_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "location_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bartender_orders_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
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
            referencedRelation: "active_orders_dashboard"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "content_flags_flagged_by_fkey"
            columns: ["flagged_by"]
            isOneToOne: false
            referencedRelation: "image_usage_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_flags_flagged_by_fkey"
            columns: ["flagged_by"]
            isOneToOne: false
            referencedRelation: "user_auth_status"
            referencedColumns: ["id"]
          },
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
            referencedRelation: "active_orders_dashboard"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "content_flags_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "image_usage_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_flags_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "user_auth_status"
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
      data_retention_policies: {
        Row: {
          created_at: string | null
          enabled: boolean | null
          last_cleanup: string | null
          retention_days: number
          table_name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          enabled?: boolean | null
          last_cleanup?: string | null
          retention_days: number
          table_name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          enabled?: boolean | null
          last_cleanup?: string | null
          retention_days?: number
          table_name?: string
          updated_at?: string | null
        }
        Relationships: []
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
            referencedRelation: "active_orders_dashboard"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "device_registrations_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "image_usage_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "device_registrations_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "user_auth_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "device_registrations_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "device_registrations_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "restaurant_tables"
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
            referencedRelation: "active_orders_dashboard"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "device_tokens_id_fkey"
            columns: ["id"]
            isOneToOne: false
            referencedRelation: "image_usage_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "device_tokens_id_fkey"
            columns: ["id"]
            isOneToOne: false
            referencedRelation: "user_auth_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "device_tokens_id_fkey"
            columns: ["id"]
            isOneToOne: false
            referencedRelation: "users"
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
            referencedRelation: "active_orders_dashboard"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "dj_broadcast_templates_dj_id_fkey"
            columns: ["dj_id"]
            isOneToOne: false
            referencedRelation: "image_usage_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dj_broadcast_templates_dj_id_fkey"
            columns: ["dj_id"]
            isOneToOne: false
            referencedRelation: "user_auth_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dj_broadcast_templates_dj_id_fkey"
            columns: ["dj_id"]
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
            referencedRelation: "active_orders_dashboard"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "dj_broadcasts_dj_id_fkey"
            columns: ["dj_id"]
            isOneToOne: false
            referencedRelation: "image_usage_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dj_broadcasts_dj_id_fkey"
            columns: ["dj_id"]
            isOneToOne: false
            referencedRelation: "user_auth_status"
            referencedColumns: ["id"]
          },
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
            referencedRelation: "location_distances"
            referencedColumns: ["from_location_id"]
          },
          {
            foreignKeyName: "dj_broadcasts_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "location_distances"
            referencedColumns: ["to_location_id"]
          },
          {
            foreignKeyName: "dj_broadcasts_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "location_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dj_broadcasts_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "location_status"
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
            referencedRelation: "active_orders_dashboard"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "dj_event_participants_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "image_usage_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dj_event_participants_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "user_auth_status"
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
            referencedRelation: "active_orders_dashboard"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "dj_events_dj_id_fkey"
            columns: ["dj_id"]
            isOneToOne: false
            referencedRelation: "image_usage_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dj_events_dj_id_fkey"
            columns: ["dj_id"]
            isOneToOne: false
            referencedRelation: "user_auth_status"
            referencedColumns: ["id"]
          },
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
            referencedRelation: "location_distances"
            referencedColumns: ["from_location_id"]
          },
          {
            foreignKeyName: "dj_events_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "location_distances"
            referencedColumns: ["to_location_id"]
          },
          {
            foreignKeyName: "dj_events_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "location_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dj_events_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "location_status"
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
            referencedRelation: "active_orders_dashboard"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "dj_events_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "image_usage_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dj_events_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "user_auth_status"
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
            referencedRelation: "active_orders_dashboard"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "food_drink_categories_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "image_usage_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "food_drink_categories_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_auth_status"
            referencedColumns: ["id"]
          },
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
            foreignKeyName: "food_drink_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "active_orders_dashboard"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "food_drink_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "image_usage_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "food_drink_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_auth_status"
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
            referencedRelation: "active_orders_dashboard"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "images_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "image_usage_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "images_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "user_auth_status"
            referencedColumns: ["id"]
          },
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
          description: string | null
          group_name: string | null
          id: string
          is_required: boolean | null
          item_id: string | null
          max_selections: number | null
          min_selections: number | null
          modifier_type: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          group_name?: string | null
          id?: string
          is_required?: boolean | null
          item_id?: string | null
          max_selections?: number | null
          min_selections?: number | null
          modifier_type: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          group_name?: string | null
          id?: string
          is_required?: boolean | null
          item_id?: string | null
          max_selections?: number | null
          min_selections?: number | null
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
            referencedRelation: "menu_items_with_working_modifiers"
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
          hours: Json | null
          id: string
          is_active: boolean | null
          latitude: number
          longitude: number
          name: string
          phone: string | null
          radius_miles: number | null
          state: string | null
          timezone: string | null
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
          hours?: Json | null
          id?: string
          is_active?: boolean | null
          latitude: number
          longitude: number
          name: string
          phone?: string | null
          radius_miles?: number | null
          state?: string | null
          timezone?: string | null
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
          hours?: Json | null
          id?: string
          is_active?: boolean | null
          latitude?: number
          longitude?: number
          name?: string
          phone?: string | null
          radius_miles?: number | null
          state?: string | null
          timezone?: string | null
          updated_at?: string
          website?: string | null
          zip?: string | null
        }
        Relationships: []
      }
      menu_item_modifiers: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          is_available: boolean | null
          is_popular: boolean | null
          modifier_type: string
          name: string
          price_adjustment: number | null
          spice_level: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_available?: boolean | null
          is_popular?: boolean | null
          modifier_type: string
          name: string
          price_adjustment?: number | null
          spice_level?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_available?: boolean | null
          is_popular?: boolean | null
          modifier_type?: string
          name?: string
          price_adjustment?: number | null
          spice_level?: number | null
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
            foreignKeyName: "modifier_group_items_modifier_id_fkey"
            columns: ["modifier_id"]
            isOneToOne: false
            referencedRelation: "menu_item_modifiers"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_topics: {
        Row: {
          created_at: string | null
          description: string | null
          display_name: string
          id: string
          is_active: boolean | null
          requires_role: string | null
          topic_key: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_name: string
          id?: string
          is_active?: boolean | null
          requires_role?: string | null
          topic_key: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_name?: string
          id?: string
          is_active?: boolean | null
          requires_role?: string | null
          topic_key?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          link: string | null
          message: string
          metadata: Json | null
          recipient_id: string
          status: string
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          message: string
          metadata?: Json | null
          recipient_id: string
          status?: string
          type?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string
          metadata?: Json | null
          recipient_id?: string
          status?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "active_orders_dashboard"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "image_usage_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "user_auth_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string | null
          id: string
          item_name: string | null
          menu_item_id: string | null
          modifier_data: Json | null
          modifiers: Json | null
          order_id: string | null
          quantity: number
          special_instructions: string | null
          subtotal: number | null
          unit_price: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          item_name?: string | null
          menu_item_id?: string | null
          modifier_data?: Json | null
          modifiers?: Json | null
          order_id?: string | null
          quantity: number
          special_instructions?: string | null
          subtotal?: number | null
          unit_price: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          item_name?: string | null
          menu_item_id?: string | null
          modifier_data?: Json | null
          modifiers?: Json | null
          order_id?: string | null
          quantity?: number
          special_instructions?: string | null
          subtotal?: number | null
          unit_price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "food_drink_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items_with_working_modifiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "active_orders_dashboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "bartender_orders"
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
          priority: string | null
          read_at: string | null
          retry_count: number | null
          sent_at: string | null
          status: string | null
          title: string
          type: string | null
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
          link?: string | null
          priority?: string | null
          read_at?: string | null
          retry_count?: number | null
          sent_at?: string | null
          status?: string | null
          title: string
          type?: string | null
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
          link?: string | null
          priority?: string | null
          read_at?: string | null
          retry_count?: number | null
          sent_at?: string | null
          status?: string | null
          title?: string
          type?: string | null
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
            referencedRelation: "active_orders_dashboard"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "push_notifications_id_fkey"
            columns: ["id"]
            isOneToOne: false
            referencedRelation: "image_usage_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "push_notifications_id_fkey"
            columns: ["id"]
            isOneToOne: false
            referencedRelation: "user_auth_status"
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
      quick_reply_templates: {
        Row: {
          created_at: string | null
          emoji: string | null
          id: string
          message_template: string
          reply_type: string
          role_required: string | null
          id: string | null
        }
        Insert: {
          created_at?: string | null
          emoji?: string | null
          id?: string
          message_template: string
          reply_type: string
          role_required?: string | null
          id?: string | null
        }
        Update: {
          created_at?: string | null
          emoji?: string | null
          id?: string
          message_template?: string
          reply_type?: string
          role_required?: string | null
          id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quick_reply_templates_id_fkey"
            columns: ["id"]
            isOneToOne: false
            referencedRelation: "active_orders_dashboard"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "quick_reply_templates_id_fkey"
            columns: ["id"]
            isOneToOne: false
            referencedRelation: "image_usage_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quick_reply_templates_id_fkey"
            columns: ["id"]
            isOneToOne: false
            referencedRelation: "user_auth_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quick_reply_templates_id_fkey"
            columns: ["id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_tables: {
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
      security_audit_log: {
        Row: {
          action_taken: string
          created_at: string | null
          id: number
          issue_description: string
          issue_type: string
          resolution_status: string
        }
        Insert: {
          action_taken: string
          created_at?: string | null
          id?: number
          issue_description: string
          issue_type: string
          resolution_status: string
        }
        Update: {
          action_taken?: string
          created_at?: string | null
          id?: number
          issue_description?: string
          issue_type?: string
          resolution_status?: string
        }
        Relationships: []
      }
      security_audit_notes: {
        Row: {
          created_at: string | null
          id: string
          issue_name: string
          issue_type: string
          resolution: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          issue_name: string
          issue_type: string
          resolution: string
        }
        Update: {
          created_at?: string | null
          id?: string
          issue_name?: string
          issue_type?: string
          resolution?: string
        }
        Relationships: []
      }
      security_documentation: {
        Row: {
          created_at: string | null
          id: number
          reason: string
          schema_name: string
          security_decision: string
          table_name: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          reason: string
          schema_name: string
          security_decision: string
          table_name: string
        }
        Update: {
          created_at?: string | null
          id?: number
          reason?: string
          schema_name?: string
          security_decision?: string
          table_name?: string
        }
        Relationships: []
      }
      security_recommendations: {
        Row: {
          created_at: string
          description: string
          id: string
          issue_type: string
          remediation_notes: string | null
          remediation_status: string | null
          severity: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          issue_type: string
          remediation_notes?: string | null
          remediation_status?: string | null
          severity?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          issue_type?: string
          remediation_notes?: string | null
          remediation_status?: string | null
          severity?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      social_media_config: {
        Row: {
          account_handle: string | null
          created_at: string | null
          embed_config: Json | null
          id: string
          is_active: boolean | null
          location_id: string | null
          platform: string
          updated_at: string | null
        }
        Insert: {
          account_handle?: string | null
          created_at?: string | null
          embed_config?: Json | null
          id?: string
          is_active?: boolean | null
          location_id?: string | null
          platform: string
          updated_at?: string | null
        }
        Update: {
          account_handle?: string | null
          created_at?: string | null
          embed_config?: Json | null
          id?: string
          is_active?: boolean | null
          location_id?: string | null
          platform?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "social_media_config_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "location_distances"
            referencedColumns: ["from_location_id"]
          },
          {
            foreignKeyName: "social_media_config_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "location_distances"
            referencedColumns: ["to_location_id"]
          },
          {
            foreignKeyName: "social_media_config_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "location_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_media_config_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "location_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_media_config_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
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
      system_documentation: {
        Row: {
          created_at: string | null
          description: string | null
          feature: string
          implementation_details: Json | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          feature: string
          implementation_details?: Json | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          feature?: string
          implementation_details?: Json | null
        }
        Relationships: []
      }
      topic_subscriptions: {
        Row: {
          created_at: string | null
          id: string
          token: string
          topic: string
          updated_at: string | null
          id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          token: string
          topic: string
          updated_at?: string | null
          id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          token?: string
          topic?: string
          updated_at?: string | null
          id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "topic_subscriptions_id_fkey"
            columns: ["id"]
            isOneToOne: false
            referencedRelation: "active_orders_dashboard"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "topic_subscriptions_id_fkey"
            columns: ["id"]
            isOneToOne: false
            referencedRelation: "image_usage_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "topic_subscriptions_id_fkey"
            columns: ["id"]
            isOneToOne: false
            referencedRelation: "user_auth_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "topic_subscriptions_id_fkey"
            columns: ["id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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
            referencedRelation: "active_orders_dashboard"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "user_app_settings_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "image_usage_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_app_settings_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "user_auth_status"
            referencedColumns: ["id"]
          },
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
            referencedRelation: "location_distances"
            referencedColumns: ["from_location_id"]
          },
          {
            foreignKeyName: "user_location_history_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "location_distances"
            referencedColumns: ["to_location_id"]
          },
          {
            foreignKeyName: "user_location_history_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "location_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_location_history_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "location_status"
            referencedColumns: ["id"]
          },
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
            referencedRelation: "active_orders_dashboard"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "user_location_history_id_fkey"
            columns: ["id"]
            isOneToOne: false
            referencedRelation: "image_usage_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_location_history_id_fkey"
            columns: ["id"]
            isOneToOne: false
            referencedRelation: "user_auth_status"
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
          allow_messages: boolean | null
          auth_id: string | null
          avatar_id: string | null
          avatar_url: string | null
          bio: string | null
          block_reason: string | null
          blocked_at: string | null
          blocked_by: string | null
          created_at: string
          custom_avatar_id: string | null
          daily_customization: Json | null
          deleted_at: string | null
          display_name: string | null
          email: string
          favorite_bartender: string | null
          favorite_drink: string | null
          favorite_song: string | null
          first_name: string | null
          gender: string | null
          id: string
          instagram_handle: string | null
          is_approved: boolean | null
          is_online: boolean | null
          is_permanent_pack_member: boolean | null
          is_profile_visible: boolean | null
          is_wolfpack_member: boolean | null
          last_activity: string | null
          last_login: string | null
          last_name: string | null
          location_id: string | null
          location_permissions_granted: boolean | null
          looking_for: string | null
          notes: string | null
          notification_preferences: Json | null
          password_hash: string | null
          permanent_member_benefits: Json | null
          permanent_member_notes: string | null
          permanent_member_since: string | null
          permissions: Json | null
          phone: string | null
          phone_verification_code: string | null
          phone_verification_sent_at: string | null
          phone_verified: boolean | null
          privacy_settings: Json | null
          profile_image_url: string | null
          profile_last_seen_at: string | null
          profile_pic_url: string | null
          pronouns: string | null
          role: string | null
          sensitive_data_encrypted: Json | null
          session_id: string | null
          status: string | null
          updated_at: string
          vibe_status: string | null
          wolf_emoji: string | null
          wolfpack_joined_at: string | null
          wolfpack_status: string | null
          wolfpack_tier: string | null
        }
        Insert: {
          allow_messages?: boolean | null
          auth_id?: string | null
          avatar_id?: string | null
          avatar_url?: string | null
          bio?: string | null
          block_reason?: string | null
          blocked_at?: string | null
          blocked_by?: string | null
          created_at?: string
          custom_avatar_id?: string | null
          daily_customization?: Json | null
          deleted_at?: string | null
          display_name?: string | null
          email: string
          favorite_bartender?: string | null
          favorite_drink?: string | null
          favorite_song?: string | null
          first_name?: string | null
          gender?: string | null
          id?: string
          instagram_handle?: string | null
          is_approved?: boolean | null
          is_online?: boolean | null
          is_permanent_pack_member?: boolean | null
          is_profile_visible?: boolean | null
          is_wolfpack_member?: boolean | null
          last_activity?: string | null
          last_login?: string | null
          last_name?: string | null
          location_id?: string | null
          location_permissions_granted?: boolean | null
          looking_for?: string | null
          notes?: string | null
          notification_preferences?: Json | null
          password_hash?: string | null
          permanent_member_benefits?: Json | null
          permanent_member_notes?: string | null
          permanent_member_since?: string | null
          permissions?: Json | null
          phone?: string | null
          phone_verification_code?: string | null
          phone_verification_sent_at?: string | null
          phone_verified?: boolean | null
          privacy_settings?: Json | null
          profile_image_url?: string | null
          profile_last_seen_at?: string | null
          profile_pic_url?: string | null
          pronouns?: string | null
          role?: string | null
          sensitive_data_encrypted?: Json | null
          session_id?: string | null
          status?: string | null
          updated_at?: string
          vibe_status?: string | null
          wolf_emoji?: string | null
          wolfpack_joined_at?: string | null
          wolfpack_status?: string | null
          wolfpack_tier?: string | null
        }
        Update: {
          allow_messages?: boolean | null
          auth_id?: string | null
          avatar_id?: string | null
          avatar_url?: string | null
          bio?: string | null
          block_reason?: string | null
          blocked_at?: string | null
          blocked_by?: string | null
          created_at?: string
          custom_avatar_id?: string | null
          daily_customization?: Json | null
          deleted_at?: string | null
          display_name?: string | null
          email?: string
          favorite_bartender?: string | null
          favorite_drink?: string | null
          favorite_song?: string | null
          first_name?: string | null
          gender?: string | null
          id?: string
          instagram_handle?: string | null
          is_approved?: boolean | null
          is_online?: boolean | null
          is_permanent_pack_member?: boolean | null
          is_profile_visible?: boolean | null
          is_wolfpack_member?: boolean | null
          last_activity?: string | null
          last_login?: string | null
          last_name?: string | null
          location_id?: string | null
          location_permissions_granted?: boolean | null
          looking_for?: string | null
          notes?: string | null
          notification_preferences?: Json | null
          password_hash?: string | null
          permanent_member_benefits?: Json | null
          permanent_member_notes?: string | null
          permanent_member_since?: string | null
          permissions?: Json | null
          phone?: string | null
          phone_verification_code?: string | null
          phone_verification_sent_at?: string | null
          phone_verified?: boolean | null
          privacy_settings?: Json | null
          profile_image_url?: string | null
          profile_last_seen_at?: string | null
          profile_pic_url?: string | null
          pronouns?: string | null
          role?: string | null
          sensitive_data_encrypted?: Json | null
          session_id?: string | null
          status?: string | null
          updated_at?: string
          vibe_status?: string | null
          wolf_emoji?: string | null
          wolfpack_joined_at?: string | null
          wolfpack_status?: string | null
          wolfpack_tier?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_users_blocked_by"
            columns: ["blocked_by"]
            isOneToOne: false
            referencedRelation: "active_orders_dashboard"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "fk_users_blocked_by"
            columns: ["blocked_by"]
            isOneToOne: false
            referencedRelation: "image_usage_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_users_blocked_by"
            columns: ["blocked_by"]
            isOneToOne: false
            referencedRelation: "user_auth_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_users_blocked_by"
            columns: ["blocked_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_avatar_id_fkey"
            columns: ["avatar_id"]
            isOneToOne: false
            referencedRelation: "images"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_custom_avatar_id_fkey"
            columns: ["custom_avatar_id"]
            isOneToOne: false
            referencedRelation: "images"
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
          expires_at: string | null
          id: string
          interaction_type: string
          location_id: string | null
          message_content: string | null
          metadata: Json | null
          read_at: string | null
          receiver_id: string
          sender_id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          interaction_type: string
          location_id?: string | null
          message_content?: string | null
          metadata?: Json | null
          read_at?: string | null
          receiver_id: string
          sender_id: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          interaction_type?: string
          location_id?: string | null
          message_content?: string | null
          metadata?: Json | null
          read_at?: string | null
          receiver_id?: string
          sender_id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wolf_pack_interactions_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "location_distances"
            referencedColumns: ["from_location_id"]
          },
          {
            foreignKeyName: "wolf_pack_interactions_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "location_distances"
            referencedColumns: ["to_location_id"]
          },
          {
            foreignKeyName: "wolf_pack_interactions_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "location_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolf_pack_interactions_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "location_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolf_pack_interactions_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolf_pack_interactions_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "active_orders_dashboard"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "wolf_pack_interactions_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "image_usage_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolf_pack_interactions_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "user_auth_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolf_pack_interactions_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolf_pack_interactions_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "active_orders_dashboard"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "wolf_pack_interactions_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "image_usage_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolf_pack_interactions_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "user_auth_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolf_pack_interactions_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      wolf_pack_members: {
        Row: {
          created_at: string | null
          id: string
          last_activity: string | null
          location_id: string
          status: string
          updated_at: string | null
          id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_activity?: string | null
          location_id: string
          status?: string
          updated_at?: string | null
          id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          last_activity?: string | null
          location_id?: string
          status?: string
          updated_at?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wolf_pack_members_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "location_distances"
            referencedColumns: ["from_location_id"]
          },
          {
            foreignKeyName: "wolf_pack_members_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "location_distances"
            referencedColumns: ["to_location_id"]
          },
          {
            foreignKeyName: "wolf_pack_members_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "location_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolf_pack_members_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "location_status"
            referencedColumns: ["id"]
          },
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
            isOneToOne: false
            referencedRelation: "active_orders_dashboard"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "wolf_pack_members_id_fkey"
            columns: ["id"]
            isOneToOne: false
            referencedRelation: "image_usage_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolf_pack_members_id_fkey"
            columns: ["id"]
            isOneToOne: false
            referencedRelation: "user_auth_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolf_pack_members_id_fkey"
            columns: ["id"]
            isOneToOne: false
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
          vote_value: number | null
          voted_for_id: string | null
          voter_id: string | null
        }
        Insert: {
          contest_id?: string | null
          created_at?: string | null
          event_id?: string | null
          id?: string
          participant_id?: string | null
          vote_value?: number | null
          voted_for_id?: string | null
          voter_id?: string | null
        }
        Update: {
          contest_id?: string | null
          created_at?: string | null
          event_id?: string | null
          id?: string
          participant_id?: string | null
          vote_value?: number | null
          voted_for_id?: string | null
          voter_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wolf_pack_votes_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "dj_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolf_pack_votes_voter_id_fkey"
            columns: ["voter_id"]
            isOneToOne: false
            referencedRelation: "active_orders_dashboard"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "wolf_pack_votes_voter_id_fkey"
            columns: ["voter_id"]
            isOneToOne: false
            referencedRelation: "image_usage_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolf_pack_votes_voter_id_fkey"
            columns: ["voter_id"]
            isOneToOne: false
            referencedRelation: "user_auth_status"
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
          id: string
          image_id: string | null
          image_url: string | null
          is_deleted: boolean | null
          is_flirt_message: boolean | null
          is_read: boolean | null
          message: string
          read_at: string | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          created_at?: string | null
          flag_reason?: string | null
          flagged?: boolean | null
          flagged_at?: string | null
          flagged_by?: string | null
          id?: string
          image_id?: string | null
          image_url?: string | null
          is_deleted?: boolean | null
          is_flirt_message?: boolean | null
          is_read?: boolean | null
          message: string
          read_at?: string | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          created_at?: string | null
          flag_reason?: string | null
          flagged?: boolean | null
          flagged_at?: string | null
          flagged_by?: string | null
          id?: string
          image_id?: string | null
          image_url?: string | null
          is_deleted?: boolean | null
          is_flirt_message?: boolean | null
          is_read?: boolean | null
          message?: string
          read_at?: string | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wolf_private_messages_flagged_by_fkey"
            columns: ["flagged_by"]
            isOneToOne: false
            referencedRelation: "active_orders_dashboard"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "wolf_private_messages_flagged_by_fkey"
            columns: ["flagged_by"]
            isOneToOne: false
            referencedRelation: "image_usage_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolf_private_messages_flagged_by_fkey"
            columns: ["flagged_by"]
            isOneToOne: false
            referencedRelation: "user_auth_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolf_private_messages_flagged_by_fkey"
            columns: ["flagged_by"]
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
            referencedRelation: "active_orders_dashboard"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "wolf_private_messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "image_usage_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolf_private_messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "user_auth_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolf_private_messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolf_private_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "active_orders_dashboard"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "wolf_private_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "image_usage_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolf_private_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "user_auth_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolf_private_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
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
          id: string | null
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
          id?: string | null
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
          id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wolfpack_analytics_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "location_distances"
            referencedColumns: ["from_location_id"]
          },
          {
            foreignKeyName: "wolfpack_analytics_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "location_distances"
            referencedColumns: ["to_location_id"]
          },
          {
            foreignKeyName: "wolfpack_analytics_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "location_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolfpack_analytics_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "location_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolfpack_analytics_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolfpack_analytics_id_fkey"
            columns: ["id"]
            isOneToOne: false
            referencedRelation: "active_orders_dashboard"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "wolfpack_analytics_id_fkey"
            columns: ["id"]
            isOneToOne: false
            referencedRelation: "image_usage_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolfpack_analytics_id_fkey"
            columns: ["id"]
            isOneToOne: false
            referencedRelation: "user_auth_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolfpack_analytics_id_fkey"
            columns: ["id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      wolfpack_chat_messages: {
        Row: {
          avatar_url: string | null
          content: string
          created_at: string | null
          display_name: string
          edited_at: string | null
          id: string
          image_url: string | null
          is_deleted: boolean | null
          is_flagged: boolean | null
          message_type: string
          session_id: string
          id: string | null
        }
        Insert: {
          avatar_url?: string | null
          content: string
          created_at?: string | null
          display_name: string
          edited_at?: string | null
          id?: string
          image_url?: string | null
          is_deleted?: boolean | null
          is_flagged?: boolean | null
          message_type?: string
          session_id: string
          id?: string | null
        }
        Update: {
          avatar_url?: string | null
          content?: string
          created_at?: string | null
          display_name?: string
          edited_at?: string | null
          id?: string
          image_url?: string | null
          is_deleted?: boolean | null
          is_flagged?: boolean | null
          message_type?: string
          session_id?: string
          id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wolfpack_chat_messages_id_fkey"
            columns: ["id"]
            isOneToOne: false
            referencedRelation: "active_orders_dashboard"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "wolfpack_chat_messages_id_fkey"
            columns: ["id"]
            isOneToOne: false
            referencedRelation: "image_usage_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolfpack_chat_messages_id_fkey"
            columns: ["id"]
            isOneToOne: false
            referencedRelation: "user_auth_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolfpack_chat_messages_id_fkey"
            columns: ["id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      wolfpack_chat_reactions: {
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
            foreignKeyName: "wolfpack_chat_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "wolfpack_chat_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolfpack_chat_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "wolfpack_chat_with_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolfpack_chat_reactions_id_fkey"
            columns: ["id"]
            isOneToOne: false
            referencedRelation: "active_orders_dashboard"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "wolfpack_chat_reactions_id_fkey"
            columns: ["id"]
            isOneToOne: false
            referencedRelation: "image_usage_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolfpack_chat_reactions_id_fkey"
            columns: ["id"]
            isOneToOne: false
            referencedRelation: "user_auth_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolfpack_chat_reactions_id_fkey"
            columns: ["id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      wolfpack_sessions: {
        Row: {
          bar_location_id: string | null
          created_at: string
          created_by: string | null
          expires_at: string
          id: string
          is_active: boolean
          max_members: number
          member_count: number
          metadata: Json | null
          session_code: string | null
        }
        Insert: {
          bar_location_id?: string | null
          created_at?: string
          created_by?: string | null
          expires_at?: string
          id?: string
          is_active?: boolean
          max_members?: number
          member_count?: number
          metadata?: Json | null
          session_code?: string | null
        }
        Update: {
          bar_location_id?: string | null
          created_at?: string
          created_by?: string | null
          expires_at?: string
          id?: string
          is_active?: boolean
          max_members?: number
          member_count?: number
          metadata?: Json | null
          session_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wolfpack_sessions_bar_location_id_fkey"
            columns: ["bar_location_id"]
            isOneToOne: false
            referencedRelation: "location_distances"
            referencedColumns: ["from_location_id"]
          },
          {
            foreignKeyName: "wolfpack_sessions_bar_location_id_fkey"
            columns: ["bar_location_id"]
            isOneToOne: false
            referencedRelation: "location_distances"
            referencedColumns: ["to_location_id"]
          },
          {
            foreignKeyName: "wolfpack_sessions_bar_location_id_fkey"
            columns: ["bar_location_id"]
            isOneToOne: false
            referencedRelation: "location_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolfpack_sessions_bar_location_id_fkey"
            columns: ["bar_location_id"]
            isOneToOne: false
            referencedRelation: "location_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolfpack_sessions_bar_location_id_fkey"
            columns: ["bar_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolfpack_sessions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "active_orders_dashboard"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "wolfpack_sessions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "image_usage_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolfpack_sessions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_auth_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolfpack_sessions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      wolfpack_whitelist: {
        Row: {
          always_active: boolean | null
          bypass_geolocation: boolean | null
          created_at: string | null
          created_by: string | null
          id: string
          reason: string | null
          id: string
        }
        Insert: {
          always_active?: boolean | null
          bypass_geolocation?: boolean | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          reason?: string | null
          id: string
        }
        Update: {
          always_active?: boolean | null
          bypass_geolocation?: boolean | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          reason?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wolfpack_whitelist_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "active_orders_dashboard"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "wolfpack_whitelist_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "image_usage_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolfpack_whitelist_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_auth_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolfpack_whitelist_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolfpack_whitelist_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "active_orders_dashboard"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "wolfpack_whitelist_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "image_usage_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolfpack_whitelist_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "user_auth_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolfpack_whitelist_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      active_orders_dashboard: {
        Row: {
          accepted_at: string | null
          bartender_name: string | null
          created_at: string | null
          customer_avatar: string | null
          customer_id: string | null
          customer_name: string | null
          customer_notes: string | null
          id: string | null
          items: Json | null
          location_city: string | null
          location_name: string | null
          order_number: number | null
          order_type: string | null
          ready_at: string | null
          status: string | null
          table_location: string | null
          total_amount: number | null
        }
        Relationships: []
      }
      api_access_levels: {
        Row: {
          access_description: string | null
          accessible_resources: string[] | null
          restrictions: string[] | null
          role_name: string | null
          user_type: string | null
        }
        Relationships: []
      }
      available_notification_topics: {
        Row: {
          description: string | null
          display_name: string | null
          requires_role: string | null
          topic_key: string | null
        }
        Insert: {
          description?: string | null
          display_name?: string | null
          requires_role?: string | null
          topic_key?: string | null
        }
        Update: {
          description?: string | null
          display_name?: string | null
          requires_role?: string | null
          topic_key?: string | null
        }
        Relationships: []
      }
      data_retention_schedule: {
        Row: {
          cleanup_schedule: string | null
          enabled: boolean | null
          last_cleanup: string | null
          next_cleanup_time: string | null
          records_to_delete: number | null
          retention_days: number | null
          table_name: string | null
        }
        Insert: {
          cleanup_schedule?: never
          enabled?: boolean | null
          last_cleanup?: string | null
          next_cleanup_time?: never
          records_to_delete?: never
          retention_days?: number | null
          table_name?: string | null
        }
        Update: {
          cleanup_schedule?: never
          enabled?: boolean | null
          last_cleanup?: string | null
          next_cleanup_time?: never
          records_to_delete?: never
          retention_days?: number | null
          table_name?: string | null
        }
        Relationships: []
      }
      final_security_summary: {
        Row: {
          audit_status: string | null
          completion_time: string | null
          improvements_made: string[] | null
          issues_documented: number | null
          issues_resolved: number | null
          unoptimized_policies: number | null
        }
        Relationships: []
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
          id: string | null
        }
        Relationships: []
      }
      location_distances: {
        Row: {
          distance_meters: number | null
          from_location_id: string | null
          from_location_name: string | null
          to_location_id: string | null
          to_location_name: string | null
        }
        Relationships: []
      }
      location_info: {
        Row: {
          address: string | null
          email: string | null
          formatted_hours: string | null
          full_address: string | null
          id: string | null
          is_open: boolean | null
          latitude: number | null
          longitude: number | null
          name: string | null
          phone: string | null
          status_message: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          email?: string | null
          formatted_hours?: never
          full_address?: never
          id?: string | null
          is_open?: never
          latitude?: number | null
          longitude?: number | null
          name?: string | null
          phone?: string | null
          status_message?: never
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          email?: string | null
          formatted_hours?: never
          full_address?: never
          id?: string | null
          is_open?: never
          latitude?: number | null
          longitude?: number | null
          name?: string | null
          phone?: string | null
          status_message?: never
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      location_permission_summary: {
        Row: {
          total_users: number | null
          users_who_synced_location: number | null
          users_with_background_permission: number | null
          users_with_location_permission: number | null
        }
        Relationships: []
      }
      location_status: {
        Row: {
          address: string | null
          city: string | null
          created_at: string | null
          email: string | null
          hours: Json | null
          id: string | null
          is_active: boolean | null
          is_currently_open: boolean | null
          latitude: number | null
          longitude: number | null
          name: string | null
          phone: string | null
          radius_miles: number | null
          state: string | null
          timezone: string | null
          updated_at: string | null
          website: string | null
          zip: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          email?: string | null
          hours?: Json | null
          id?: string | null
          is_active?: boolean | null
          is_currently_open?: never
          latitude?: number | null
          longitude?: number | null
          name?: string | null
          phone?: string | null
          radius_miles?: number | null
          state?: string | null
          timezone?: string | null
          updated_at?: string | null
          website?: string | null
          zip?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          email?: string | null
          hours?: Json | null
          id?: string | null
          is_active?: boolean | null
          is_currently_open?: never
          latitude?: number | null
          longitude?: number | null
          name?: string | null
          phone?: string | null
          radius_miles?: number | null
          state?: string | null
          timezone?: string | null
          updated_at?: string | null
          website?: string | null
          zip?: string | null
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
      menu_items_with_working_modifiers: {
        Row: {
          category: Json | null
          category_id: string | null
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string | null
          image_id: string | null
          image_url: string | null
          is_available: boolean | null
          modifiers: Json | null
          name: string | null
          price: number | null
          updated_at: string | null
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
            foreignKeyName: "food_drink_items_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "images"
            referencedColumns: ["id"]
          },
        ]
      }
      modifier_system_summary: {
        Row: {
          item_count: number | null
          item_type: string | null
          modifier_groups: Json | null
        }
        Relationships: []
      }
      rls_optimization_summary: {
        Row: {
          no_auth_policies: number | null
          optimized_policies: number | null
          tablename: unknown | null
          total_policies: number | null
          unoptimized_policies: number | null
        }
        Relationships: []
      }
      rls_policy_performance_status: {
        Row: {
          optimization_status: string | null
          policy_type: string | null
          policyname: unknown | null
          schemaname: unknown | null
          tablename: unknown | null
        }
        Relationships: []
      }
      security_audit_summary: {
        Row: {
          documented_count: number | null
          issue_count: number | null
          issue_type: string | null
          last_updated: string | null
          resolved_count: number | null
        }
        Relationships: []
      }
      security_checklist: {
        Row: {
          check_item: string | null
          result: string | null
          status: string | null
        }
        Relationships: []
      }
      security_status: {
        Row: {
          documented_issues: number | null
          last_audit: string | null
          overall_status: string | null
          tables_with_rls: number | null
          total_functions: number | null
          total_views: number | null
        }
        Relationships: []
      }
      security_status_dashboard: {
        Row: {
          functions_without_search_path: number | null
          issues_documented: number | null
          issues_resolved: number | null
          last_checked: string | null
          status: string | null
          tables_without_rls: number | null
          views_without_security_invoker: number | null
        }
        Relationships: []
      }
      spatial_ref_sys_secure: {
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
      spatial_reference_systems: {
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
      system_status: {
        Row: {
          component: string | null
          details: string | null
          status: string | null
        }
        Relationships: []
      }
      user_auth_status: {
        Row: {
          auth_status: string | null
          created_at: string | null
          email: string | null
          id: string | null
          last_login: string | null
          location_permissions_granted: boolean | null
          role: string | null
          status: string | null
          wolfpack_status: string | null
        }
        Insert: {
          auth_status?: never
          created_at?: string | null
          email?: string | null
          id?: string | null
          last_login?: string | null
          location_permissions_granted?: boolean | null
          role?: string | null
          status?: string | null
          wolfpack_status?: string | null
        }
        Update: {
          auth_status?: never
          created_at?: string | null
          email?: string | null
          id?: string | null
          last_login?: string | null
          location_permissions_granted?: boolean | null
          role?: string | null
          status?: string | null
          wolfpack_status?: string | null
        }
        Relationships: []
      }
      wolf_pack_interaction_summary: {
        Row: {
          active_count: number | null
          interaction_date: string | null
          interaction_type: string | null
          read_count: number | null
          total_count: number | null
        }
        Relationships: []
      }
      wolf_pack_interactions_legacy: {
        Row: {
          created_at: string | null
          expires_at: string | null
          from_id: string | null
          id: string | null
          interaction_type: string | null
          location_id: string | null
          message_content: string | null
          metadata: Json | null
          read_at: string | null
          receiver_id: string | null
          sender_id: string | null
          status: string | null
          to_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          from_id?: string | null
          id?: string | null
          interaction_type?: string | null
          location_id?: string | null
          message_content?: string | null
          metadata?: Json | null
          read_at?: string | null
          receiver_id?: string | null
          sender_id?: string | null
          status?: string | null
          to_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          from_id?: string | null
          id?: string | null
          interaction_type?: string | null
          location_id?: string | null
          message_content?: string | null
          metadata?: Json | null
          read_at?: string | null
          receiver_id?: string | null
          sender_id?: string | null
          status?: string | null
          to_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wolf_pack_interactions_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "location_distances"
            referencedColumns: ["from_location_id"]
          },
          {
            foreignKeyName: "wolf_pack_interactions_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "location_distances"
            referencedColumns: ["to_location_id"]
          },
          {
            foreignKeyName: "wolf_pack_interactions_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "location_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolf_pack_interactions_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "location_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolf_pack_interactions_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolf_pack_interactions_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "active_orders_dashboard"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "wolf_pack_interactions_receiver_id_fkey"
            columns: ["to_id"]
            isOneToOne: false
            referencedRelation: "active_orders_dashboard"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "wolf_pack_interactions_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "image_usage_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolf_pack_interactions_receiver_id_fkey"
            columns: ["to_id"]
            isOneToOne: false
            referencedRelation: "image_usage_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolf_pack_interactions_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "user_auth_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolf_pack_interactions_receiver_id_fkey"
            columns: ["to_id"]
            isOneToOne: false
            referencedRelation: "user_auth_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolf_pack_interactions_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolf_pack_interactions_receiver_id_fkey"
            columns: ["to_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolf_pack_interactions_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "active_orders_dashboard"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "wolf_pack_interactions_sender_id_fkey"
            columns: ["from_id"]
            isOneToOne: false
            referencedRelation: "active_orders_dashboard"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "wolf_pack_interactions_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "image_usage_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolf_pack_interactions_sender_id_fkey"
            columns: ["from_id"]
            isOneToOne: false
            referencedRelation: "image_usage_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolf_pack_interactions_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "user_auth_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolf_pack_interactions_sender_id_fkey"
            columns: ["from_id"]
            isOneToOne: false
            referencedRelation: "user_auth_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolf_pack_interactions_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolf_pack_interactions_sender_id_fkey"
            columns: ["from_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      wolf_private_messages_legacy: {
        Row: {
          created_at: string | null
          flag_reason: string | null
          flagged: boolean | null
          flagged_at: string | null
          flagged_by: string | null
          from_id: string | null
          id: string | null
          image_id: string | null
          image_url: string | null
          is_deleted: boolean | null
          is_flirt_message: boolean | null
          is_read: boolean | null
          message: string | null
          read_at: string | null
          receiver_id: string | null
          sender_id: string | null
          to_id: string | null
        }
        Insert: {
          created_at?: string | null
          flag_reason?: string | null
          flagged?: boolean | null
          flagged_at?: string | null
          flagged_by?: string | null
          from_id?: string | null
          id?: string | null
          image_id?: string | null
          image_url?: string | null
          is_deleted?: boolean | null
          is_flirt_message?: boolean | null
          is_read?: boolean | null
          message?: string | null
          read_at?: string | null
          receiver_id?: string | null
          sender_id?: string | null
          to_id?: string | null
        }
        Update: {
          created_at?: string | null
          flag_reason?: string | null
          flagged?: boolean | null
          flagged_at?: string | null
          flagged_by?: string | null
          from_id?: string | null
          id?: string | null
          image_id?: string | null
          image_url?: string | null
          is_deleted?: boolean | null
          is_flirt_message?: boolean | null
          is_read?: boolean | null
          message?: string | null
          read_at?: string | null
          receiver_id?: string | null
          sender_id?: string | null
          to_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wolf_private_messages_flagged_by_fkey"
            columns: ["flagged_by"]
            isOneToOne: false
            referencedRelation: "active_orders_dashboard"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "wolf_private_messages_flagged_by_fkey"
            columns: ["flagged_by"]
            isOneToOne: false
            referencedRelation: "image_usage_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolf_private_messages_flagged_by_fkey"
            columns: ["flagged_by"]
            isOneToOne: false
            referencedRelation: "user_auth_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolf_private_messages_flagged_by_fkey"
            columns: ["flagged_by"]
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
            referencedRelation: "active_orders_dashboard"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "wolf_private_messages_receiver_id_fkey"
            columns: ["to_id"]
            isOneToOne: false
            referencedRelation: "active_orders_dashboard"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "wolf_private_messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "image_usage_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolf_private_messages_receiver_id_fkey"
            columns: ["to_id"]
            isOneToOne: false
            referencedRelation: "image_usage_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolf_private_messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "user_auth_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolf_private_messages_receiver_id_fkey"
            columns: ["to_id"]
            isOneToOne: false
            referencedRelation: "user_auth_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolf_private_messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolf_private_messages_receiver_id_fkey"
            columns: ["to_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolf_private_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "active_orders_dashboard"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "wolf_private_messages_sender_id_fkey"
            columns: ["from_id"]
            isOneToOne: false
            referencedRelation: "active_orders_dashboard"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "wolf_private_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "image_usage_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolf_private_messages_sender_id_fkey"
            columns: ["from_id"]
            isOneToOne: false
            referencedRelation: "image_usage_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolf_private_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "user_auth_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolf_private_messages_sender_id_fkey"
            columns: ["from_id"]
            isOneToOne: false
            referencedRelation: "user_auth_status"
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
            foreignKeyName: "wolf_private_messages_sender_id_fkey"
            columns: ["from_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      wolfpack_chat_with_users: {
        Row: {
          avatar_url: string | null
          content: string | null
          created_at: string | null
          display_name: string | null
          edited_at: string | null
          first_name: string | null
          id: string | null
          image_url: string | null
          is_deleted: boolean | null
          is_flagged: boolean | null
          last_name: string | null
          message_type: string | null
          reaction_count: number | null
          role: string | null
          session_id: string | null
          id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wolfpack_chat_messages_id_fkey"
            columns: ["id"]
            isOneToOne: false
            referencedRelation: "active_orders_dashboard"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "wolfpack_chat_messages_id_fkey"
            columns: ["id"]
            isOneToOne: false
            referencedRelation: "image_usage_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolfpack_chat_messages_id_fkey"
            columns: ["id"]
            isOneToOne: false
            referencedRelation: "user_auth_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolfpack_chat_messages_id_fkey"
            columns: ["id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
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
      add_event_contestant: {
        Args: { p_event_id: string; p_contestant_id: string }
        Returns: Json
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
        Args: { p_id: string; p_reason?: string }
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
        Args: { p_id: string }
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
        Args: { p_id?: string; p_limit?: number }
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
        Args: { p_id?: string }
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
        Args: { p_id: string }
        Returns: Json
      }
      admin_get_private_messages: {
        Args: { p_limit?: number; p_offset?: number; p_user_filter?: string }
        Returns: {
          message_id: string
          from_id: string
          from_email: string
          from_name: string
          to_id: string
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
          id: string
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
        Args: { p_id?: string }
        Returns: Json
      }
      admin_get_user_stats: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      admin_get_users: {
        Args: { p_search?: string; p_status?: string; p_role?: string }
        Returns: {
          id: string
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
        Args: { p_id: string; p_action: string; p_reason?: string }
        Returns: boolean
      }
      admin_moderate_report: {
        Args: { p_report_id: string; p_action: string; p_notes?: string }
        Returns: Json
      }
      admin_restore_user: {
        Args: { target_id: string }
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
        Args: { p_to_id: string; p_message: string; p_image_id?: string }
        Returns: string
      }
      admin_send_private_message: {
        Args: { p_to_id: string; p_message: string; p_image_url?: string }
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
        Args: { p_id: string }
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
          p_id: string
          p_email?: string
          p_first_name?: string
          p_last_name?: string
          p_role?: string
          p_status?: string
        }
        Returns: Json
      }
      admin_update_user_password: {
        Args: { p_id: string; p_new_password: string }
        Returns: Json
      }
      admin_update_user_status: {
        Args: { target_id: string; new_status: string }
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
        Args: { target_id: string }
        Returns: Json
      }
      assign_user_role: {
        Args: { p_id: string; p_role: string; p_assigned_by?: string }
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
      broadcast_pack_movement: {
        Args: { p_position_x: number; p_position_y: number }
        Returns: Json
      }
      bytea: {
        Args: { "": unknown } | { "": unknown }
        Returns: string
      }
      can_access_bar_tab: {
        Args: { id: string; location_id: string }
        Returns: boolean
      }
      can_access_wolf_chat: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      can_bypass_location_verification: {
        Args: { p_id?: string }
        Returns: boolean
      }
      can_message_user: {
        Args: { p_target_id: string }
        Returns: Json
      }
      cart_implementation_guide: {
        Args: Record<PropertyKey, never>
        Returns: {
          user_state: string
          cart_storage: string
          implementation: string
          security_note: string
        }[]
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
      check_auth_setup: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      check_cart_access: {
        Args: {
          id: string
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
      check_email_exists: {
        Args: { check_email: string }
        Returns: boolean
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
      check_my_access: {
        Args: Record<PropertyKey, never>
        Returns: {
          role_name: string
          is_logged_in: boolean
          id: string
          can_access_wolf_pack: boolean
          can_place_orders: boolean
          can_view_menu: boolean
        }[]
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
      check_security_issues: {
        Args: Record<PropertyKey, never>
        Returns: {
          issue_type: string
          object_name: string
          schema_name: string
          severity: string
          recommendation: string
        }[]
      }
      check_security_status: {
        Args: Record<PropertyKey, never>
        Returns: {
          status: string
          critical_issues: number
          warnings: number
          notes: string
        }[]
      }
      check_srid_exists: {
        Args: { check_srid: number }
        Returns: boolean
      }
      check_user_exists: {
        Args: { p_name: string }
        Returns: Json
      }
      check_user_membership: {
        Args: { user_uuid: string; location_uuid: string }
        Returns: {
          is_member: boolean
          membership_id: string
          status: string
          joined_at: string
        }[]
      }
      check_wolfpack_access: {
        Args: Record<PropertyKey, never> | { p_id: string }
        Returns: Json
      }
      check_wolfpack_eligibility: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      check_wolfpack_location_access: {
        Args: { user_lat: number; user_lng: number }
        Returns: Json
      }
      check_wolfpack_operating_hours: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      clean_old_wolfpack_messages: {
        Args: Record<PropertyKey, never>
        Returns: undefined
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
      cleanup_old_data: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      close_dj_event: {
        Args: { p_event_id: string }
        Returns: Json
      }
      close_old_wolfpack_tabs: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      complete_user_registration: {
        Args: { p_first_name?: string; p_last_name?: string; p_role?: string }
        Returns: Json
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
      create_auth_account_for_user: {
        Args: { p_id: string; p_temporary_password: string }
        Returns: Json
      }
      create_auth_accounts_for_existing_users: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      create_auth_for_user: {
        Args: { p_email: string; p_password: string }
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
        Args:
          | {
              p_dj_id: string
              p_location_id: string
              p_event_type: string
              p_title: string
              p_description?: string
              p_voting_duration_minutes?: number
              p_options?: Json
            }
          | {
              p_event_type: string
              p_title: string
              p_description?: string
              p_voting_duration_minutes?: number
              p_location_id?: string
            }
        Returns: Json
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
      create_push_notification: {
        Args: {
          p_id: string
          p_title: string
          p_body: string
          p_type?: string
          p_data?: Json
          p_priority?: string
          p_device_token_id?: string
          p_announcement_id?: string
        }
        Returns: string
      }
      create_test_push_notification: {
        Args: { p_title?: string; p_body?: string }
        Returns: Json
      }
      create_test_user: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      daily_wolfpack_reset: {
        Args: Record<PropertyKey, never>
        Returns: undefined
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
      ensure_user_exists: {
        Args: { p_id: string }
        Returns: undefined
      }
      ensure_user_in_public: {
        Args: { p_auth_id: string }
        Returns: undefined
      }
      ensure_whitelisted_users_in_wolfpack: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      equals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      expire_old_wolfpack_sessions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      fetch_notifications: {
        Args: { p_id?: string; p_limit?: number; p_offset?: number }
        Returns: {
          id: string
          id: string
          type: string
          title: string
          message: string
          read: boolean
          data: Json
          created_at: string
          updated_at: string
        }[]
      }
      find_nearby_locations: {
        Args: { user_lat: number; user_lng: number; radius_meters?: number }
        Returns: {
          id: string
          name: string
          distance_meters: number
        }[]
      }
      find_nearby_wolfpack_sessions: {
        Args: { user_lat: number; user_lng: number; radius_meters?: number }
        Returns: {
          id: string
          bar_location_id: string
          bar_name: string
          distance_meters: number
          member_count: number
          max_members: number
          created_at: string
          expires_at: string
        }[]
      }
      find_nearest_location: {
        Args: {
          user_lat: number
          user_lon: number
          max_distance_meters?: number
        }
        Returns: {
          location_id: string
          location_name: string
          distance_meters: number
        }[]
      }
      fix_firebase_credentials: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      format_location_hours: {
        Args: { location_hours: Json }
        Returns: string
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
      get_active_session: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          session_code: string
          member_count: number
          location_name: string
        }[]
      }
      get_active_users: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
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
      get_active_wolfpack_members: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          email: string
          first_name: string
          last_name: string
          avatar_url: string
          wolfpack_status: string
          status: string
          is_online: boolean
          last_activity: string
          wolf_profile: Json
          wolfpack_member: Json
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
          allow_messages: boolean | null
          auth_id: string | null
          avatar_id: string | null
          avatar_url: string | null
          bio: string | null
          block_reason: string | null
          blocked_at: string | null
          blocked_by: string | null
          created_at: string
          custom_avatar_id: string | null
          daily_customization: Json | null
          deleted_at: string | null
          display_name: string | null
          email: string
          favorite_bartender: string | null
          favorite_drink: string | null
          favorite_song: string | null
          first_name: string | null
          gender: string | null
          id: string
          instagram_handle: string | null
          is_approved: boolean | null
          is_online: boolean | null
          is_permanent_pack_member: boolean | null
          is_profile_visible: boolean | null
          is_wolfpack_member: boolean | null
          last_activity: string | null
          last_login: string | null
          last_name: string | null
          location_id: string | null
          location_permissions_granted: boolean | null
          looking_for: string | null
          notes: string | null
          notification_preferences: Json | null
          password_hash: string | null
          permanent_member_benefits: Json | null
          permanent_member_notes: string | null
          permanent_member_since: string | null
          permissions: Json | null
          phone: string | null
          phone_verification_code: string | null
          phone_verification_sent_at: string | null
          phone_verified: boolean | null
          privacy_settings: Json | null
          profile_image_url: string | null
          profile_last_seen_at: string | null
          profile_pic_url: string | null
          pronouns: string | null
          role: string | null
          sensitive_data_encrypted: Json | null
          session_id: string | null
          status: string | null
          updated_at: string
          vibe_status: string | null
          wolf_emoji: string | null
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
      get_anonymous_access_summary: {
        Args: Record<PropertyKey, never>
        Returns: {
          resource_type: string
          resource_name: string
          access_level: string
          purpose: string
        }[]
      }
      get_app_env_vars: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_available_contestants: {
        Args: { p_location_id?: string }
        Returns: {
          id: string
          display_name: string
          avatar_url: string
          wolf_emoji: string
          position_x: number
          position_y: number
        }[]
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
          id: string
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
        Args: { p_other_id: string; p_limit?: number }
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
          from_id: string
          to_id: string
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
      get_current_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_user_info: {
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
      get_event_results: {
        Args: { p_event_id: string }
        Returns: Json
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
      get_item_modifiers: {
        Args: { p_item_id: string }
        Returns: {
          group_name: string
          modifier_type: string
          is_required: boolean
          min_selections: number
          max_selections: number
          modifiers: Json
        }[]
      }
      get_live_pack_counts: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_location_directions: {
        Args: { p_location_id: string }
        Returns: Json
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
      get_menu_items_modifier_summary: {
        Args: Record<PropertyKey, never>
        Returns: {
          item_name: string
          category: string
          display_order: number
          required_modifiers: string[]
          description: string
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
          category_id: string
          category_name: string
          menu_type: string
          category_icon: string
          image_url: string
          display_order: number
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
      get_orders: {
        Args: { status_filter?: string }
        Returns: {
          id: string
          customer_id: string
          bartender_id: string
          status: string
          total_amount: number
          items: Json
          notes: string
          created_at: string
          updated_at: string
          completed_at: string
        }[]
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
          other_id: string
          display_name: string
          wolf_emoji: string
          last_message: string
          last_message_time: string
          is_from_me: boolean
          unread_count: number
        }[]
      }
      get_private_conversation: {
        Args: { p_id: string; p_other_id: string; p_limit?: number }
        Returns: {
          message_id: string
          from_id: string
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
      get_security_health_summary: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_session_id_by_code: {
        Args: { session_code_param: string }
        Returns: string
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
        Args: { p_id: string }
        Returns: number
      }
      get_unread_counts: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_user_conversations: {
        Args: { user_uuid: string }
        Returns: {
          conversation_partner_id: string
          last_message_id: string
          last_message: string
          last_message_time: string
          unread_count: number
          is_last_message_from_me: boolean
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
      get_id_from_auth: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_interactions: {
        Args: { user_uuid: string; interaction_types?: string[] }
        Returns: {
          id: string
          other_id: string
          interaction_type: string
          is_sender: boolean
          message_content: string
          status: string
          read_at: string
          created_at: string
        }[]
      }
      get_user_pack_status: {
        Args: { user_uuid: string }
        Returns: Json
      }
      get_user_profile: {
        Args: { p_id: string }
        Returns: {
          id: string
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
        Args: { id: string }
        Returns: string
      }
      get_user_storage_usage: {
        Args: { id: string }
        Returns: {
          total_size_bytes: number
          image_count: number
          size_formatted: string
        }[]
      }
      get_users_at_bar: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          display_name: string
          wolf_emoji: string
          table_number: number
          mood: string
          checked_in_at: string
          minutes_here: number
        }[]
      }
      get_users_for_notification: {
        Args: { p_notification_type: string; p_ids?: string[] }
        Returns: {
          id: string
          auth_id: string
          email: string
          display_name: string
          notification_enabled: boolean
        }[]
      }
      get_users_needing_auth: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          email: string
          first_name: string
          last_name: string
          role: string
          needs_auth_account: boolean
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
          id: string
          display_name: string
          wolf_emoji: string
          vibe_status: string
          table_location: string
          joined_at: string
          last_activity: string
        }[]
      }
      get_wolfpack_access_status: {
        Args: { p_id?: string }
        Returns: Json
      }
      get_wolfpack_dashboard: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_wolfpack_members_at_location: {
        Args: { p_location_id: string }
        Returns: Json
      }
      get_wolfpack_members_with_profiles: {
        Args: { location_uuid?: string }
        Returns: {
          id: string
          id: string
          location_id: string
          status: string
          display_name: string
          emoji: string
          current_vibe: string
          favorite_drink: string
          looking_for: string
          instagram_handle: string
          joined_at: string
          last_active: string
          is_active: boolean
          user_email: string
          user_first_name: string
          user_last_name: string
          user_avatar_url: string
          wolf_profile_id: string
          wolf_bio: string
          wolf_profile_pic_url: string
          wolf_is_profile_visible: boolean
        }[]
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
      grant_permanent_pack_member_status: {
        Args: { p_user_email: string; p_admin_notes?: string }
        Returns: Json
      }
      handle_image_upload: {
        Args: {
          p_id: string
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
      increment_event_participants: {
        Args: { event_id: string }
        Returns: undefined
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
      is_admin_or_staff: {
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
      is_in_wolf_pack_at_location: {
        Args: { p_location_id: string }
        Returns: boolean
      }
      is_location_open: {
        Args: { location_hours: Json; location_timezone?: string }
        Returns: boolean
      }
      is_user_in_wolf_pack: {
        Args: { id: string; location_id: string }
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
      is_valid_id: {
        Args: { input_id: string }
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
        Args: { check_id?: string }
        Returns: boolean
      }
      is_wolfpack_open: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      join_wolf_pack: {
        Args:
          | {
              p_id: string
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
        Returns: string
      }
      join_wolfpack: {
        Args:
          | {
              p_location_id: string
              p_latitude?: number
              p_longitude?: number
              p_table_location?: string
            }
          | {
              user_uuid: string
              location_uuid: string
              display_name_param?: string
              emoji_param?: string
              current_vibe_param?: string
              favorite_drink_param?: string
              looking_for_param?: string
              instagram_handle_param?: string
            }
        Returns: {
          success: boolean
          membership_id: string
          message: string
        }[]
      }
      join_wolfpack_enhanced: {
        Args: { p_location_id?: string }
        Returns: Json
      }
      join_wolfpack_membership: {
        Args: { p_table_location?: string }
        Returns: Json
      }
      join_wolfpack_permanent_safe: {
        Args: {
          p_location_id?: string
          p_latitude?: number
          p_longitude?: number
          p_table_location?: string
        }
        Returns: Json
      }
      join_wolfpack_simple: {
        Args: { p_location_id?: string; p_table_location?: string }
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
      leave_wolfpack: {
        Args: { user_uuid: string; location_uuid: string }
        Returns: {
          success: boolean
          message: string
        }[]
      }
      link_existing_users_to_auth: {
        Args: Record<PropertyKey, never>
        Returns: Json
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
      maintain_wolfpack_whitelist: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      manual_wolfpack_reset: {
        Args: { p_force?: boolean }
        Returns: Json
      }
      mark_message_read: {
        Args: { p_id: string; p_message_id: string }
        Returns: boolean
      }
      mark_messages_read: {
        Args:
          | { p_from_id: string }
          | { p_id: string; p_from_id: string }
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
      needs_location_verification: {
        Args: { p_id: string }
        Returns: boolean
      }
      next_opening_time: {
        Args: { location_id: string }
        Returns: string
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
        Returns: number
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
      reset_wolfpack_daily: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      resolve_id: {
        Args: { input_id: string }
        Returns: string
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
          p_from_id: string
          p_to_id: string
          p_location_id: string
          p_flirt_type: string
        }
        Returns: string
      }
      send_food_ready_notification: {
        Args: {
          p_id: string
          p_order_details: string
          p_table_number?: number
        }
        Returns: Json
      }
      send_message: {
        Args: { p_message: string; p_to_id?: string; p_image_url?: string }
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
              p_from_id: string
              p_to_id: string
              p_message: string
              p_image_url?: string
            }
          | { p_to_id: string; p_message: string; p_image_url?: string }
        Returns: Json
      }
      send_private_message_simple: {
        Args: { p_to_id: string; p_message: string }
        Returns: Json
      }
      send_test_push_notification: {
        Args: { p_title?: string; p_body?: string }
        Returns: Json
      }
      send_wolf_chat_message: {
        Args: {
          p_id: string
          p_location_id: string
          p_message: string
          p_image_id?: string
          p_chat_type?: string
        }
        Returns: string
      }
      send_wolf_pack_interaction: {
        Args: {
          p_from_id: string
          p_to_id: string
          p_location_id: string
          p_interaction_type: string
        }
        Returns: string
      }
      send_wolf_pack_welcome_notification: {
        Args: { p_id: string; p_location_name: string }
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
      submit_event_vote: {
        Args: { p_event_id: string; p_voted_for_id: string }
        Returns: Json
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
      test_auth_flow: {
        Args: { test_email: string }
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
        Args: { p_id: string }
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
      trigger_wolfpack_onboarding: {
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
      update_notification_preferences: {
        Args: { p_id: string; p_preferences: Json }
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
      update_pack_member_position: {
        Args: { p_id: string; p_position_x: number; p_position_y: number }
        Returns: Json
      }
      update_user_online_status: {
        Args: { user_uuid: string; online_status: boolean }
        Returns: undefined
      }
      update_user_role: {
        Args: { id: string; new_role: string }
        Returns: Json
      }
      update_wolf_profile: {
        Args: {
          p_id: string
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
          p_id: string
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
      verify_location_access: {
        Args: {
          p_latitude: number
          p_longitude: number
          p_claimed_location_id?: string
        }
        Returns: Json
      }
      which_table_to_use: {
        Args: { p_feature: string }
        Returns: string
      }
      wolfpack_daily_reset: {
        Args: Record<PropertyKey, never>
        Returns: undefined
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
