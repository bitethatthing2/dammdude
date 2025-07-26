export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      food_drink_categories: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          icon: string | null;
          sort_order: number | null;
          is_active: boolean | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          icon?: string | null;
          sort_order?: number | null;
          is_active?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          icon?: string | null;
          sort_order?: number | null;
          is_active?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      food_drink_items: {
        Row: {
          id: string;
          category_id: string;
          name: string;
          description: string | null;
          price: number;
          image_url: string | null;
          is_available: boolean | null;
          is_featured: boolean | null;
          ingredients: string[] | null;
          allergens: string[] | null;
          nutritional_info: Json | null;
          preparation_time: number | null;
          sort_order: number | null;
          created_at: string | null;
          updated_at: string | null;
          image_id: string | null;
        };
        Insert: {
          id?: string;
          category_id: string;
          name: string;
          description?: string | null;
          price: number;
          image_url?: string | null;
          is_available?: boolean | null;
          is_featured?: boolean | null;
          ingredients?: string[] | null;
          allergens?: string[] | null;
          nutritional_info?: Json | null;
          preparation_time?: number | null;
          sort_order?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
          image_id?: string | null;
        };
        Update: {
          id?: string;
          category_id?: string;
          name?: string;
          description?: string | null;
          price?: number;
          image_url?: string | null;
          is_available?: boolean | null;
          is_featured?: boolean | null;
          ingredients?: string[] | null;
          allergens?: string[] | null;
          nutritional_info?: Json | null;
          preparation_time?: number | null;
          sort_order?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
          image_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "food_drink_items_category_id_fkey";
            columns: ["category_id"];
            referencedRelation: "food_drink_categories";
            referencedColumns: ["id"];
          },
        ];
      };
      images: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          url: string;
          size: number;
          mime_type: string;
          image_type: string;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          url: string;
          size: number;
          mime_type: string;
          image_type?: string;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          url?: string;
          size?: number;
          mime_type?: string;
          image_type?: string;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "images_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      locations: {
        Row: {
          id: string;
          name: string;
          latitude: number;
          longitude: number;
          radius_miles: number | null;
          is_active: boolean | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          latitude: number;
          longitude: number;
          radius_miles?: number | null;
          is_active?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          latitude?: number;
          longitude?: number;
          radius_miles?: number | null;
          is_active?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      notification_topics: {
        Row: {
          id: string;
          topic_key: string;
          display_name: string;
          description: string | null;
          is_active: boolean | null;
          requires_role: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          topic_key: string;
          display_name: string;
          description?: string | null;
          is_active?: boolean | null;
          requires_role?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          topic_key?: string;
          display_name?: string;
          description?: string | null;
          is_active?: boolean | null;
          requires_role?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      user_fcm_tokens: {
        Row: {
          id: string;
          user_id: string;
          token: string;
          device_info: string | null;
          is_active: boolean | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          token: string;
          device_info?: string | null;
          is_active?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          token?: string;
          device_info?: string | null;
          is_active?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "user_fcm_tokens_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      user_preferences: {
        Row: {
          id: string;
          user_id: string;
          favorite_content_types: string[];
          favorite_categories: string[];
          interaction_patterns: Json;
          location_preferences: Json;
          interests: string[];
          last_updated: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          favorite_content_types?: string[];
          favorite_categories?: string[];
          interaction_patterns?: Json;
          location_preferences?: Json;
          interests?: string[];
          last_updated?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          favorite_content_types?: string[];
          favorite_categories?: string[];
          interaction_patterns?: Json;
          location_preferences?: Json;
          interests?: string[];
          last_updated?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_preferences_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      users: {
        Row: {
          id: string;
          auth_id: string;
          email: string;
          first_name: string | null;
          last_name: string | null;
          display_name: string | null;
          avatar_url: string | null;
          role: string | null;
          is_active: boolean | null;
          created_at: string | null;
          updated_at: string | null;
          profile_pic_url: string | null;
          profile_image_url: string | null;
          custom_avatar_id: string | null;
          wolfpack_status: string | null;
          is_wolfpack_member: boolean | null;
          wolfpack_tier: string | null;
          location_permissions_granted: boolean | null;
          location_id: string | null;
        };
        Insert: {
          id?: string;
          auth_id: string;
          email: string;
          first_name?: string | null;
          last_name?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          role?: string | null;
          is_active?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
          profile_pic_url?: string | null;
          profile_image_url?: string | null;
          custom_avatar_id?: string | null;
          wolfpack_status?: string | null;
          is_wolfpack_member?: boolean | null;
          wolfpack_tier?: string | null;
          location_permissions_granted?: boolean | null;
          location_id?: string | null;
        };
        Update: {
          id?: string;
          auth_id?: string;
          email?: string;
          first_name?: string | null;
          last_name?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          role?: string | null;
          is_active?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
          profile_pic_url?: string | null;
          profile_image_url?: string | null;
          custom_avatar_id?: string | null;
          wolfpack_status?: string | null;
          is_wolfpack_member?: boolean | null;
          wolfpack_tier?: string | null;
          location_permissions_granted?: boolean | null;
          location_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "users_location_id_fkey";
            columns: ["location_id"];
            referencedRelation: "locations";
            referencedColumns: ["id"];
          },
        ];
      };
      wolfpack_activity_notifications: {
        Row: {
          id: string;
          recipient_id: string;
          message: string;
          type: string;
          status: string;
          created_at: string;
          link: string | null;
          metadata: Json | null;
          updated_at: string | null;
          notification_type: string | null;
          related_video_id: string | null;
          related_user_id: string | null;
        };
        Insert: {
          id?: string;
          recipient_id: string;
          message: string;
          type?: string;
          status?: string;
          created_at?: string;
          link?: string | null;
          metadata?: Json | null;
          updated_at?: string | null;
          notification_type?: string | null;
          related_video_id?: string | null;
          related_user_id?: string | null;
        };
        Update: {
          id?: string;
          recipient_id?: string;
          message?: string;
          type?: string;
          status?: string;
          created_at?: string;
          link?: string | null;
          metadata?: Json | null;
          updated_at?: string | null;
          notification_type?: string | null;
          related_video_id?: string | null;
          related_user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "wolfpack_activity_notifications_recipient_id_fkey";
            columns: ["recipient_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName:
              "wolfpack_activity_notifications_related_video_id_fkey";
            columns: ["related_video_id"];
            referencedRelation: "wolfpack_videos";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName:
              "wolfpack_activity_notifications_related_user_id_fkey";
            columns: ["related_user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      wolfpack_videos: {
        Row: {
          id: string;
          user_id: string;
          title: string | null;
          description: string | null;
          video_url: string;
          thumbnail_url: string | null;
          duration: number | null;
          view_count: number | null;
          like_count: number | null;
          is_featured: boolean | null;
          is_active: boolean | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string | null;
          description?: string | null;
          video_url: string;
          thumbnail_url?: string | null;
          duration?: number | null;
          view_count?: number | null;
          like_count?: number | null;
          is_featured?: boolean | null;
          is_active?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string | null;
          description?: string | null;
          video_url?: string;
          thumbnail_url?: string | null;
          duration?: number | null;
          view_count?: number | null;
          like_count?: number | null;
          is_featured?: boolean | null;
          is_active?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "wolfpack_videos_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      wolfpack_post_likes: {
        Row: {
          id: string;
          user_id: string;
          video_id: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          video_id: string;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          video_id?: string;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "wolfpack_post_likes_video_id_fkey";
            columns: ["video_id"];
            referencedRelation: "wolfpack_videos";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_video_likes_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      wolfpack_comments: {
        Row: {
          id: string;
          user_id: string;
          video_id: string;
          content: string;
          parent_comment_id: string | null;
          like_count: number | null;
          is_pinned: boolean | null;
          is_edited: boolean | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          video_id: string;
          content: string;
          parent_comment_id?: string | null;
          like_count?: number | null;
          is_pinned?: boolean | null;
          is_edited?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          video_id?: string;
          content?: string;
          parent_comment_id?: string | null;
          like_count?: number | null;
          is_pinned?: boolean | null;
          is_edited?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "wolfpack_comments_parent_comment_id_fkey";
            columns: ["parent_comment_id"];
            referencedRelation: "wolfpack_comments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_comments_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wolfpack_comments_video_id_fkey";
            columns: ["video_id"];
            referencedRelation: "wolfpack_videos";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      admin_update_item_image: {
        Args: {
          p_item_id: string;
          p_image_url: string;
        };
        Returns: undefined;
      };
      create_image_record: {
        Args: {
          p_name: string;
          p_url: string;
          p_size: number;
          p_type?: string;
        };
        Returns: string;
      };
      fetch_notifications: {
        Args: {
          p_limit?: number;
          p_offset?: number;
        };
        Returns: {
          id: string;
          recipient_id: string;
          type: string;
          title: string;
          message: string;
          link: string;
          read: boolean;
          data: Json;
          created_at: string;
          updated_at: string;
        }[];
      } | {
        Args: {
          p_user_id: string;
          p_limit?: number;
          p_offset?: number;
        };
        Returns: {
          id: string;
          recipient_id: string;
          type: string;
          title: string;
          message: string;
          link: string;
          read: boolean;
          data: Json;
          created_at: string;
          updated_at: string;
        }[];
      };
      handle_image_upload: {
        Args: {
          p_user_id: string;
          p_file_name: string;
          p_file_size: number;
          p_mime_type: string;
          p_image_type?: string;
        };
        Returns: string;
      };
      mark_notification_read: {
        Args: {
          p_notification_id: string;
        };
        Returns: undefined;
      };
      update_updated_at_column: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      user_liked_video: {
        Args: { p_video_id: string };
        Returns: boolean;
      };
      check_user_liked_video: {
        Args: { p_video_id: string };
        Returns: boolean;
      };
    };
    Enums: {
      notification_status: "unread" | "read" | "dismissed";
      notification_type:
        | "info"
        | "warning"
        | "error"
        | "order_new"
        | "order_ready";
      user_role: "user" | "admin" | "bartender" | "dj";
      wolfpack_status: "active" | "inactive" | "pending" | "banned";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
