export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      appointment_services: {
        Row: {
          appointment_id: string
          duration_snapshot: number
          id: string
          price_snapshot: number
          service_id: string
        }
        Insert: {
          appointment_id: string
          duration_snapshot: number
          id?: string
          price_snapshot: number
          service_id: string
        }
        Update: {
          appointment_id?: string
          duration_snapshot?: number
          id?: string
          price_snapshot?: number
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointment_services_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          barbershop_id: string
          created_at: string
          created_by: string | null
          customer_id: string
          id: string
          notes: string | null
          professional_id: string
          scheduled_end: string
          scheduled_start: string
          source: string | null
          status: Database["public"]["Enums"]["appointment_status"]
          total_amount: number
          updated_at: string
        }
        Insert: {
          barbershop_id: string
          created_at?: string
          created_by?: string | null
          customer_id: string
          id?: string
          notes?: string | null
          professional_id: string
          scheduled_end: string
          scheduled_start: string
          source?: string | null
          status?: Database["public"]["Enums"]["appointment_status"]
          total_amount?: number
          updated_at?: string
        }
        Update: {
          barbershop_id?: string
          created_at?: string
          created_by?: string | null
          customer_id?: string
          id?: string
          notes?: string | null
          professional_id?: string
          scheduled_end?: string
          scheduled_start?: string
          source?: string | null
          status?: Database["public"]["Enums"]["appointment_status"]
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      barbershop_invitations: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          barbershop_id: string
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          role: Database["public"]["Enums"]["app_role"]
          status: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          barbershop_id: string
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          role: Database["public"]["Enums"]["app_role"]
          status?: string
          token?: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          barbershop_id?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          status?: string
          token?: string
        }
        Relationships: []
      }
      barbershop_members: {
        Row: {
          active: boolean
          barbershop_id: string
          created_at: string
          id: string
          profile_id: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          active?: boolean
          barbershop_id: string
          created_at?: string
          id?: string
          profile_id: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          active?: boolean
          barbershop_id?: string
          created_at?: string
          id?: string
          profile_id?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: [
          {
            foreignKeyName: "barbershop_members_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "barbershop_members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      barbershops: {
        Row: {
          active: boolean
          address: Json | null
          banner_url: string | null
          contacts: Json | null
          created_at: string
          description: string | null
          id: string
          logo_url: string | null
          name: string
          settings: Json | null
          slug: string
          social: Json | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          address?: Json | null
          banner_url?: string | null
          contacts?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name: string
          settings?: Json | null
          slug: string
          social?: Json | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          address?: Json | null
          banner_url?: string | null
          contacts?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          settings?: Json | null
          slug?: string
          social?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      cash_sessions: {
        Row: {
          barbershop_id: string
          closed_at: string | null
          closed_by: string | null
          closing_amount: number | null
          created_at: string
          id: string
          notes: string | null
          opened_at: string
          opened_by: string
          opening_amount: number
          status: Database["public"]["Enums"]["cash_status"]
        }
        Insert: {
          barbershop_id: string
          closed_at?: string | null
          closed_by?: string | null
          closing_amount?: number | null
          created_at?: string
          id?: string
          notes?: string | null
          opened_at?: string
          opened_by: string
          opening_amount?: number
          status?: Database["public"]["Enums"]["cash_status"]
        }
        Update: {
          barbershop_id?: string
          closed_at?: string | null
          closed_by?: string | null
          closing_amount?: number | null
          created_at?: string
          id?: string
          notes?: string | null
          opened_at?: string
          opened_by?: string
          opening_amount?: number
          status?: Database["public"]["Enums"]["cash_status"]
        }
        Relationships: []
      }
      cash_transactions: {
        Row: {
          amount: number
          appointment_id: string | null
          barbershop_id: string
          created_at: string
          created_by: string | null
          customer_id: string | null
          description: string | null
          id: string
          kind: string
          method: Database["public"]["Enums"]["payment_method"]
          professional_id: string | null
          session_id: string | null
        }
        Insert: {
          amount: number
          appointment_id?: string | null
          barbershop_id: string
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          description?: string | null
          id?: string
          kind: string
          method?: Database["public"]["Enums"]["payment_method"]
          professional_id?: string | null
          session_id?: string | null
        }
        Update: {
          amount?: number
          appointment_id?: string | null
          barbershop_id?: string
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          description?: string | null
          id?: string
          kind?: string
          method?: Database["public"]["Enums"]["payment_method"]
          professional_id?: string | null
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cash_transactions_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_transactions_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_transactions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "cash_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      commissions: {
        Row: {
          amount: number
          appointment_id: string | null
          barbershop_id: string
          base_amount: number
          created_at: string
          id: string
          paid_at: string | null
          professional_id: string
          rate: number
          status: string
          transaction_id: string | null
        }
        Insert: {
          amount: number
          appointment_id?: string | null
          barbershop_id: string
          base_amount: number
          created_at?: string
          id?: string
          paid_at?: string | null
          professional_id: string
          rate: number
          status?: string
          transaction_id?: string | null
        }
        Update: {
          amount?: number
          appointment_id?: string | null
          barbershop_id?: string
          base_amount?: number
          created_at?: string
          id?: string
          paid_at?: string | null
          professional_id?: string
          rate?: number
          status?: string
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commissions_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "cash_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_subscriptions: {
        Row: {
          barbershop_id: string
          created_at: string
          customer_id: string
          expires_at: string | null
          id: string
          notes: string | null
          package_id: string
          purchased_at: string
          sessions_remaining: number
          status: string
          transaction_id: string | null
          updated_at: string
        }
        Insert: {
          barbershop_id: string
          created_at?: string
          customer_id: string
          expires_at?: string | null
          id?: string
          notes?: string | null
          package_id: string
          purchased_at?: string
          sessions_remaining: number
          status?: string
          transaction_id?: string | null
          updated_at?: string
        }
        Update: {
          barbershop_id?: string
          created_at?: string
          customer_id?: string
          expires_at?: string | null
          id?: string
          notes?: string | null
          package_id?: string
          purchased_at?: string
          sessions_remaining?: number
          status?: string
          transaction_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          barbershop_id: string
          birth_date: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          notes: string | null
          phone: string | null
          profile_id: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          barbershop_id: string
          birth_date?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          notes?: string | null
          phone?: string | null
          profile_id?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          barbershop_id?: string
          birth_date?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          notes?: string | null
          phone?: string | null
          profile_id?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      packages: {
        Row: {
          active: boolean
          barbershop_id: string
          created_at: string
          description: string | null
          id: string
          name: string
          price: number
          sessions_total: number
          updated_at: string
          validity_days: number | null
        }
        Insert: {
          active?: boolean
          barbershop_id: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          price?: number
          sessions_total?: number
          updated_at?: string
          validity_days?: number | null
        }
        Update: {
          active?: boolean
          barbershop_id?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          price?: number
          sessions_total?: number
          updated_at?: string
          validity_days?: number | null
        }
        Relationships: []
      }
      portfolio_items: {
        Row: {
          barbershop_id: string
          caption: string | null
          created_at: string
          id: string
          image_url: string
          professional_id: string | null
          sort: number
          storage_path: string | null
        }
        Insert: {
          barbershop_id: string
          caption?: string | null
          created_at?: string
          id?: string
          image_url: string
          professional_id?: string | null
          sort?: number
          storage_path?: string | null
        }
        Update: {
          barbershop_id?: string
          caption?: string | null
          created_at?: string
          id?: string
          image_url?: string
          professional_id?: string | null
          sort?: number
          storage_path?: string | null
        }
        Relationships: []
      }
      professionals: {
        Row: {
          active: boolean
          avatar_url: string | null
          barbershop_id: string
          bio: string | null
          commission_rule: Json | null
          created_at: string
          display_name: string
          id: string
          profile_id: string | null
          slug: string
          specialties: string[] | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          avatar_url?: string | null
          barbershop_id: string
          bio?: string | null
          commission_rule?: Json | null
          created_at?: string
          display_name: string
          id?: string
          profile_id?: string | null
          slug: string
          specialties?: string[] | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          avatar_url?: string | null
          barbershop_id?: string
          bio?: string | null
          commission_rule?: Json | null
          created_at?: string
          display_name?: string
          id?: string
          profile_id?: string | null
          slug?: string
          specialties?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "professionals_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professionals_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          birth_date: string | null
          created_at: string
          default_barbershop_id: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          birth_date?: string | null
          created_at?: string
          default_barbershop_id?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          birth_date?: string | null
          created_at?: string
          default_barbershop_id?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_default_barbershop_id_fkey"
            columns: ["default_barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
        ]
      }
      satisfaction_surveys: {
        Row: {
          answered_at: string
          appointment_id: string
          barbershop_id: string
          comment: string | null
          id: string
          is_public: boolean
          nps: number | null
          professional_id: string | null
          professional_rating: number | null
          shop_rating: number | null
        }
        Insert: {
          answered_at?: string
          appointment_id: string
          barbershop_id: string
          comment?: string | null
          id?: string
          is_public?: boolean
          nps?: number | null
          professional_id?: string | null
          professional_rating?: number | null
          shop_rating?: number | null
        }
        Update: {
          answered_at?: string
          appointment_id?: string
          barbershop_id?: string
          comment?: string | null
          id?: string
          is_public?: boolean
          nps?: number | null
          professional_id?: string | null
          professional_rating?: number | null
          shop_rating?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "satisfaction_surveys_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: true
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "satisfaction_surveys_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      service_professionals: {
        Row: {
          professional_id: string
          service_id: string
        }
        Insert: {
          professional_id: string
          service_id: string
        }
        Update: {
          professional_id?: string
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_professionals_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_professionals_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          active: boolean
          barbershop_id: string
          created_at: string
          description: string | null
          duration_min: number
          id: string
          name: string
          price: number
          sort: number | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          barbershop_id: string
          created_at?: string
          description?: string | null
          duration_min: number
          id?: string
          name: string
          price: number
          sort?: number | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          barbershop_id?: string
          created_at?: string
          description?: string | null
          duration_min?: number
          id?: string
          name?: string
          price?: number
          sort?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_barbershop_id_fkey"
            columns: ["barbershop_id"]
            isOneToOne: false
            referencedRelation: "barbershops"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_redemptions: {
        Row: {
          appointment_id: string | null
          barbershop_id: string
          id: string
          notes: string | null
          professional_id: string | null
          redeemed_at: string
          redeemed_by: string | null
          subscription_id: string
        }
        Insert: {
          appointment_id?: string | null
          barbershop_id: string
          id?: string
          notes?: string | null
          professional_id?: string | null
          redeemed_at?: string
          redeemed_by?: string | null
          subscription_id: string
        }
        Update: {
          appointment_id?: string | null
          barbershop_id?: string
          id?: string
          notes?: string | null
          professional_id?: string | null
          redeemed_at?: string
          redeemed_by?: string | null
          subscription_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_redemptions_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "customer_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      time_off: {
        Row: {
          end_at: string
          id: string
          professional_id: string
          reason: string | null
          start_at: string
        }
        Insert: {
          end_at: string
          id?: string
          professional_id: string
          reason?: string | null
          start_at: string
        }
        Update: {
          end_at?: string
          id?: string
          professional_id?: string
          reason?: string | null
          start_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_off_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      working_hours: {
        Row: {
          break_end: string | null
          break_start: string | null
          end_time: string
          id: string
          professional_id: string
          start_time: string
          weekday: number
        }
        Insert: {
          break_end?: string | null
          break_start?: string | null
          end_time: string
          id?: string
          professional_id: string
          start_time: string
          weekday: number
        }
        Update: {
          break_end?: string | null
          break_start?: string | null
          end_time?: string
          id?: string
          professional_id?: string
          start_time?: string
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "working_hours_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_barbershop_role: {
        Args: {
          _barbershop_id: string
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_barbershop_member: {
        Args: { _barbershop_id: string; _user_id: string }
        Returns: boolean
      }
      is_barbershop_staff: {
        Args: { _barbershop_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "owner" | "professional" | "receptionist" | "customer"
      appointment_status:
        | "scheduled"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "no_show"
      cash_status: "open" | "closed"
      payment_method: "cash" | "debit" | "credit" | "pix" | "transfer" | "other"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["owner", "professional", "receptionist", "customer"],
      appointment_status: [
        "scheduled",
        "in_progress",
        "completed",
        "cancelled",
        "no_show",
      ],
      cash_status: ["open", "closed"],
      payment_method: ["cash", "debit", "credit", "pix", "transfer", "other"],
    },
  },
} as const
