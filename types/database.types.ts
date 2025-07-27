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
      users: {
        Row: {
          id: string
          auth_id: string | null
          email: string
          first_name: string | null
          last_name: string | null
          display_name: string | null
          avatar_url: string | null
          avatar_id: string | null
          custom_avatar_id: string | null
          profile_image_url: string | null
          wolf_emoji: string | null
          bio: string | null
          gender: string | null
          pronouns: string | null
          vibe_status: string | null
          favorite_drink: string | null
          favorite_bartender: string | null
          looking_for: string | null
          instagram_handle: string | null
          is_online: boolean | null
          last_seen_at: string | null
          last_activity: string | null
          last_login: string | null
          location_id: string | null
          location_permissions_granted: boolean
          is_wolfpack_member: boolean
          wolfpack_status: string | null
          wolfpack_joined_at: string | null
          wolfpack_tier: string | null
          role: "user" | "admin" | "dj" | "bartender"
          status: "active" | "inactive" | "blocked"
          is_approved: boolean
          permanent_member_since: string | null
          permanent_member_benefits: Json | null
          permanent_member_notes: string | null
          phone: string | null
          phone_verified: boolean
          phone_verification_code: string | null
          phone_verification_sent_at: string | null
          permissions: Json | null
          notification_preferences: Json | null
          privacy_settings: Json | null
          sensitive_data_encrypted: Json | null
          notes: string | null
          password_hash: string | null
          block_reason: string | null
          blocked_at: string | null
          blocked_by: string | null
          deleted_at: string | null
          created_at: string
          updated_at: string
          daily_customization: Json | null
          allow_messages: boolean
          session_id: string | null
          is_profile_visible: boolean | null
          username: string | null
          verified: boolean | null
          is_vip: boolean | null
          business_account: boolean | null
          artist_account: boolean | null
          city: string | null
          state: string | null
          location_verified: boolean | null
          loyalty_score: number | null
          pack_badges: Json | null
          pack_achievements: Json | null
        }
        Insert: {
          id?: string
          auth_id?: string | null
          email: string
          first_name?: string | null
          last_name?: string | null
          display_name?: string | null
          avatar_url?: string | null
          avatar_id?: string | null
          custom_avatar_id?: string | null
          profile_image_url?: string | null
          wolf_emoji?: string | null
          bio?: string | null
          gender?: string | null
          pronouns?: string | null
          vibe_status?: string | null
          favorite_drink?: string | null
          favorite_bartender?: string | null
          looking_for?: string | null
          instagram_handle?: string | null
          is_online?: boolean | null
          last_seen_at?: string | null
          last_activity?: string | null
          last_login?: string | null
          location_id?: string | null
          location_permissions_granted?: boolean
          is_wolfpack_member?: boolean
          wolfpack_status?: string | null
          wolfpack_joined_at?: string | null
          wolfpack_tier?: string | null
          role?: "user" | "admin" | "dj" | "bartender"
          status?: "active" | "inactive" | "blocked"
          is_approved?: boolean
          permanent_member_since?: string | null
          permanent_member_benefits?: Json | null
          permanent_member_notes?: string | null
          phone?: string | null
          phone_verified?: boolean
          phone_verification_code?: string | null
          phone_verification_sent_at?: string | null
          permissions?: Json | null
          notification_preferences?: Json | null
          privacy_settings?: Json | null
          sensitive_data_encrypted?: Json | null
          notes?: string | null
          password_hash?: string | null
          block_reason?: string | null
          blocked_at?: string | null
          blocked_by?: string | null
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
          daily_customization?: Json | null
          allow_messages?: boolean
          session_id?: string | null
          is_profile_visible?: boolean | null
          username?: string | null
          verified?: boolean | null
          is_vip?: boolean | null
          business_account?: boolean | null
          artist_account?: boolean | null
          city?: string | null
          state?: string | null
          location_verified?: boolean | null
          loyalty_score?: number | null
          pack_badges?: Json | null
          pack_achievements?: Json | null
        }
        Update: {
          id?: string
          auth_id?: string | null
          email?: string
          first_name?: string | null
          last_name?: string | null
          display_name?: string | null
          avatar_url?: string | null
          avatar_id?: string | null
          custom_avatar_id?: string | null
          profile_image_url?: string | null
          wolf_emoji?: string | null
          bio?: string | null
          gender?: string | null
          pronouns?: string | null
          vibe_status?: string | null
          favorite_drink?: string | null
          favorite_bartender?: string | null
          looking_for?: string | null
          instagram_handle?: string | null
          is_online?: boolean | null
          last_seen_at?: string | null
          last_activity?: string | null
          last_login?: string | null
          location_id?: string | null
          location_permissions_granted?: boolean
          is_wolfpack_member?: boolean
          wolfpack_status?: string | null
          wolfpack_joined_at?: string | null
          wolfpack_tier?: string | null
          role?: "user" | "admin" | "dj" | "bartender"
          status?: "active" | "inactive" | "blocked"
          is_approved?: boolean
          permanent_member_since?: string | null
          permanent_member_benefits?: Json | null
          permanent_member_notes?: string | null
          phone?: string | null
          phone_verified?: boolean
          phone_verification_code?: string | null
          phone_verification_sent_at?: string | null
          permissions?: Json | null
          notification_preferences?: Json | null
          privacy_settings?: Json | null
          sensitive_data_encrypted?: Json | null
          notes?: string | null
          password_hash?: string | null
          block_reason?: string | null
          blocked_at?: string | null
          blocked_by?: string | null
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
          daily_customization?: Json | null
          allow_messages?: boolean
          session_id?: string | null
          is_profile_visible?: boolean | null
          username?: string | null
          verified?: boolean | null
          is_vip?: boolean | null
          business_account?: boolean | null
          artist_account?: boolean | null
          city?: string | null
          state?: string | null
          location_verified?: boolean | null
          loyalty_score?: number | null
          pack_badges?: Json | null
          pack_achievements?: Json | null
        }
        Relationships: []
      }
      locations: {
        Row: {
          id: string
          name: string
          address: string | null
          city: string | null
          state: string | null
          latitude: number
          longitude: number
          radius_miles: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          address?: string | null
          city?: string | null
          state?: string | null
          latitude: number
          longitude: number
          radius_miles?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          address?: string | null
          city?: string | null
          state?: string | null
          latitude?: number
          longitude?: number
          radius_miles?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      food_drink_categories: {
        Row: {
          id: string
          name: string
          description: string | null
          is_active: boolean
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          is_active?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          is_active?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      food_drink_items: {
        Row: {
          id: string
          category_id: string
          name: string
          description: string | null
          price: number
          is_available: boolean
          image_url: string | null
          alcohol_content: number | null
          calories: number | null
          ingredients: string[] | null
          allergens: string[] | null
          modifiers: Json | null
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          category_id: string
          name: string
          description?: string | null
          price: number
          is_available?: boolean
          image_url?: string | null
          alcohol_content?: number | null
          calories?: number | null
          ingredients?: string[] | null
          allergens?: string[] | null
          modifiers?: Json | null
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          category_id?: string
          name?: string
          description?: string | null
          price?: number
          is_available?: boolean
          image_url?: string | null
          alcohol_content?: number | null
          calories?: number | null
          ingredients?: string[] | null
          allergens?: string[] | null
          modifiers?: Json | null
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "food_drink_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "food_drink_categories"
            referencedColumns: ["id"]
          }
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

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
      Database["public"]["Views"])
  ? (Database["public"]["Tables"] &
      Database["public"]["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
  ? Database["public"]["Enums"][PublicEnumNameOrOptions]
  : never
