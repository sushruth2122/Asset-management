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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      assets: {
        Row: {
          amc: string | null
          asset_code: string
          asset_name: string
          asset_type: string | null
          building_no: string | null
          category: string
          created_at: string
          custodian: string | null
          depreciation: string | null
          health_status: string | null
          id: string
          insurance: string | null
          latitude: number | null
          lease_status: string | null
          location: string
          longitude: number | null
          manufacturer: string | null
          model: string | null
          purchase_date: string | null
          purchase_value: number
          risk_level: string | null
          serial_number: string | null
          specification: string | null
          status: string
          updated_at: string
          voltage: string | null
          warranty_expiry: string | null
          wattage: string | null
        }
        Insert: {
          amc?: string | null
          asset_code: string
          asset_name: string
          asset_type?: string | null
          building_no?: string | null
          category?: string
          created_at?: string
          custodian?: string | null
          depreciation?: string | null
          health_status?: string | null
          id?: string
          insurance?: string | null
          latitude?: number | null
          lease_status?: string | null
          location?: string
          longitude?: number | null
          manufacturer?: string | null
          model?: string | null
          purchase_date?: string | null
          purchase_value?: number
          risk_level?: string | null
          serial_number?: string | null
          specification?: string | null
          status?: string
          updated_at?: string
          voltage?: string | null
          warranty_expiry?: string | null
          wattage?: string | null
        }
        Update: {
          amc?: string | null
          asset_code?: string
          asset_name?: string
          asset_type?: string | null
          building_no?: string | null
          category?: string
          created_at?: string
          custodian?: string | null
          depreciation?: string | null
          health_status?: string | null
          id?: string
          insurance?: string | null
          latitude?: number | null
          lease_status?: string | null
          location?: string
          longitude?: number | null
          manufacturer?: string | null
          model?: string | null
          purchase_date?: string | null
          purchase_value?: number
          risk_level?: string | null
          serial_number?: string | null
          specification?: string | null
          status?: string
          updated_at?: string
          voltage?: string | null
          warranty_expiry?: string | null
          wattage?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          priority: string
          read_status: boolean
          related_asset_id: string | null
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          priority?: string
          read_status?: boolean
          related_asset_id?: string | null
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          priority?: string
          read_status?: boolean
          related_asset_id?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_related_asset_id_fkey"
            columns: ["related_asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      spare_parts: {
        Row: {
          asset_id: string | null
          created_at: string
          description: string | null
          id: string
          minimum_threshold: number | null
          part_name: string
          part_number: string
          quantity: number
          reorder_quantity: number | null
          status: string | null
          storage_location: string | null
          supplier: string | null
          unit_cost: number | null
          updated_at: string
          warranty_days: number | null
        }
        Insert: {
          asset_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          minimum_threshold?: number | null
          part_name: string
          part_number: string
          quantity?: number
          reorder_quantity?: number | null
          status?: string | null
          storage_location?: string | null
          supplier?: string | null
          unit_cost?: number | null
          updated_at?: string
          warranty_days?: number | null
        }
        Update: {
          asset_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          minimum_threshold?: number | null
          part_name?: string
          part_number?: string
          quantity?: number
          reorder_quantity?: number | null
          status?: string | null
          storage_location?: string | null
          supplier?: string | null
          unit_cost?: number | null
          updated_at?: string
          warranty_days?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "spare_parts_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      work_orders: {
        Row: {
          asset_id: string | null
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          created_by: string
          description: string | null
          due_date: string | null
          estimated_cost: number | null
          id: string
          priority: Database["public"]["Enums"]["work_order_priority"]
          status: Database["public"]["Enums"]["work_order_status"]
          title: string
          updated_at: string
          work_order_number: string
          work_order_type: Database["public"]["Enums"]["work_order_type"] | null
        }
        Insert: {
          asset_id?: string | null
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          due_date?: string | null
          estimated_cost?: number | null
          id?: string
          priority?: Database["public"]["Enums"]["work_order_priority"]
          status?: Database["public"]["Enums"]["work_order_status"]
          title: string
          updated_at?: string
          work_order_number: string
          work_order_type?:
            | Database["public"]["Enums"]["work_order_type"]
            | null
        }
        Update: {
          asset_id?: string | null
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          estimated_cost?: number | null
          id?: string
          priority?: Database["public"]["Enums"]["work_order_priority"]
          status?: Database["public"]["Enums"]["work_order_status"]
          title?: string
          updated_at?: string
          work_order_number?: string
          work_order_type?:
            | Database["public"]["Enums"]["work_order_type"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "work_orders_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { check_user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user"
      work_order_priority: "Low" | "Medium" | "High" | "Critical"
      work_order_status:
        | "Open"
        | "In Progress"
        | "On Hold"
        | "Completed"
        | "Cancelled"
      work_order_type:
        | "Preventive"
        | "Corrective"
        | "Inspection"
        | "Warranty"
        | "Emergency"
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
      app_role: ["admin", "user"],
      work_order_priority: ["Low", "Medium", "High", "Critical"],
      work_order_status: [
        "Open",
        "In Progress",
        "On Hold",
        "Completed",
        "Cancelled",
      ],
      work_order_type: [
        "Preventive",
        "Corrective",
        "Inspection",
        "Warranty",
        "Emergency",
      ],
    },
  },
} as const
