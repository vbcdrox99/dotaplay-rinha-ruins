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
      chat_messages: {
        Row: {
          created_at: string
          id: string
          is_deleted: boolean
          message: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_deleted?: boolean
          message: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_deleted?: boolean
          message?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          end_time: string | null
          id: string
          is_active: boolean | null
          remaining_time: number | null
          start_time: string | null
          team1_block_id: number
          team1_won: boolean | null
          team2_block_id: number
        }
        Insert: {
          end_time?: string | null
          id?: string
          is_active?: boolean | null
          remaining_time?: number | null
          start_time?: string | null
          team1_block_id: number
          team1_won?: boolean | null
          team2_block_id: number
        }
        Update: {
          end_time?: string | null
          id?: string
          is_active?: boolean | null
          remaining_time?: number | null
          start_time?: string | null
          team1_block_id?: number
          team1_won?: boolean | null
          team2_block_id?: number
        }
        Relationships: []
      }
      queue_entries: {
        Row: {
          block_id: number | null
          id: string
          joined_at: string | null
          user_id: string | null
        }
        Insert: {
          block_id?: number | null
          id?: string
          joined_at?: string | null
          user_id?: string | null
        }
        Update: {
          block_id?: number | null
          id?: string
          joined_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "queue_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "queue_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar: string | null
          banned_until: string | null
          created_at: string | null
          discord_name: string
          id: string
          is_admin: boolean | null
          is_vip: boolean | null
          matches_lost: number | null
          matches_played: number | null
          matches_won: number | null
          mvp_core_count: number | null
          mvp_sup_count: number | null
          password: string
          quote: string | null
          rank: string | null
          steam_id: string
          total_points: number | null
          vip_expires_at: string | null
        }
        Insert: {
          avatar?: string | null
          banned_until?: string | null
          created_at?: string | null
          discord_name: string
          id?: string
          is_admin?: boolean | null
          is_vip?: boolean | null
          matches_lost?: number | null
          matches_played?: number | null
          matches_won?: number | null
          mvp_core_count?: number | null
          mvp_sup_count?: number | null
          password: string
          quote?: string | null
          rank?: string | null
          steam_id: string
          total_points?: number | null
          vip_expires_at?: string | null
        }
        Update: {
          avatar?: string | null
          banned_until?: string | null
          created_at?: string | null
          discord_name?: string
          id?: string
          is_admin?: boolean | null
          is_vip?: boolean | null
          matches_lost?: number | null
          matches_played?: number | null
          matches_won?: number | null
          mvp_core_count?: number | null
          mvp_sup_count?: number | null
          password?: string
          quote?: string | null
          rank?: string | null
          steam_id?: string
          total_points?: number | null
          vip_expires_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      leaderboard: {
        Row: {
          avatar: string | null
          discord_name: string | null
          id: string | null
          is_vip: boolean | null
          matches_lost: number | null
          matches_won: number | null
          mvp_core_count: number | null
          mvp_sup_count: number | null
          rank: string | null
          total_points: number | null
          vip_expires_at: string | null
        }
        Insert: {
          avatar?: string | null
          discord_name?: string | null
          id?: string | null
          is_vip?: boolean | null
          matches_lost?: number | null
          matches_won?: number | null
          mvp_core_count?: number | null
          mvp_sup_count?: number | null
          rank?: string | null
          total_points?: number | null
          vip_expires_at?: string | null
        }
        Update: {
          avatar?: string | null
          discord_name?: string | null
          id?: string | null
          is_vip?: boolean | null
          matches_lost?: number | null
          matches_won?: number | null
          mvp_core_count?: number | null
          mvp_sup_count?: number | null
          rank?: string | null
          total_points?: number | null
          vip_expires_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      is_user_vip: {
        Args: {
          user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
