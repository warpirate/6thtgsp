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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      approval_workflow: {
        Row: {
          action: Database["public"]["Enums"]["workflow_action"]
          action_date: string | null
          approver_id: string
          comments: string | null
          id: string
          receipt_id: string
        }
        Insert: {
          action: Database["public"]["Enums"]["workflow_action"]
          action_date?: string | null
          approver_id: string
          comments?: string | null
          id?: string
          receipt_id: string
        }
        Update: {
          action?: Database["public"]["Enums"]["workflow_action"]
          action_date?: string | null
          approver_id?: string
          comments?: string | null
          id?: string
          receipt_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "approval_workflow_approver_id_fkey"
            columns: ["approver_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_workflow_receipt_id_fkey"
            columns: ["receipt_id"]
            isOneToOne: false
            referencedRelation: "stock_receipts"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          id: string
          ip_address: unknown | null
          new_value: Json | null
          old_value: Json | null
          record_id: string | null
          table_name: string
          timestamp: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          id?: string
          ip_address?: unknown | null
          new_value?: Json | null
          old_value?: Json | null
          record_id?: string | null
          table_name: string
          timestamp?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          id?: string
          ip_address?: unknown | null
          new_value?: Json | null
          old_value?: Json | null
          record_id?: string | null
          table_name?: string
          timestamp?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          receipt_id: string
          uploaded_at: string | null
          uploaded_by: string
        }
        Insert: {
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id?: string
          receipt_id: string
          uploaded_at?: string | null
          uploaded_by: string
        }
        Update: {
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          receipt_id?: string
          uploaded_at?: string | null
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_receipt_id_fkey"
            columns: ["receipt_id"]
            isOneToOne: false
            referencedRelation: "stock_receipts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      items_master: {
        Row: {
          allocated_stock: number | null
          available_stock: number | null
          category: Database["public"]["Enums"]["item_category"]
          category_id: string | null
          created_at: string | null
          created_by: string | null
          current_stock: number | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          item_code: string
          location: string | null
          nomenclature: string
          reorder_level: number | null
          specifications: Json | null
          unit_of_measure: string
          unit_price: number | null
          updated_at: string | null
        }
        Insert: {
          allocated_stock?: number | null
          available_stock?: number | null
          category: Database["public"]["Enums"]["item_category"]
          category_id?: string | null
          created_at?: string | null
          created_by?: string | null
          current_stock?: number | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          item_code: string
          location?: string | null
          nomenclature: string
          reorder_level?: number | null
          specifications?: Json | null
          unit_of_measure: string
          unit_price?: number | null
          updated_at?: string | null
        }
        Update: {
          allocated_stock?: number | null
          available_stock?: number | null
          category?: Database["public"]["Enums"]["item_category"]
          category_id?: string | null
          created_at?: string | null
          created_by?: string | null
          current_stock?: number | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          item_code?: string
          location?: string | null
          nomenclature?: string
          reorder_level?: number | null
          specifications?: Json | null
          unit_of_measure?: string
          unit_price?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "items_master_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "item_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "items_master_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      receipt_items: {
        Row: {
          challan_quantity: number
          condition_notes: string | null
          created_at: string | null
          id: string
          item_id: string
          receipt_id: string
          received_quantity: number
          total_value: number | null
          unit_rate: number
          variance: number | null
        }
        Insert: {
          challan_quantity: number
          condition_notes?: string | null
          created_at?: string | null
          id?: string
          item_id: string
          receipt_id: string
          received_quantity: number
          total_value?: number | null
          unit_rate: number
          variance?: number | null
        }
        Update: {
          challan_quantity?: number
          condition_notes?: string | null
          created_at?: string | null
          id?: string
          item_id?: string
          receipt_id?: string
          received_quantity?: number
          total_value?: number | null
          unit_rate?: number
          variance?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "receipt_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items_master"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipt_items_receipt_id_fkey"
            columns: ["receipt_id"]
            isOneToOne: false
            referencedRelation: "stock_receipts"
            referencedColumns: ["id"]
          },
        ]
      }
      receipts: {
        Row: {
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          item_name: string | null
          purchase_date: string | null
          quantity: number | null
          receipt_number: string
          status: string | null
          supplier: string | null
          total_value: number | null
          unit: string | null
          unit_price: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: string
          item_name?: string | null
          purchase_date?: string | null
          quantity?: number | null
          receipt_number: string
          status?: string | null
          supplier?: string | null
          total_value?: number | null
          unit?: string | null
          unit_price?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          item_name?: string | null
          purchase_date?: string | null
          quantity?: number | null
          receipt_number?: string
          status?: string | null
          supplier?: string | null
          total_value?: number | null
          unit?: string | null
          unit_price?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "receipts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      requisition_items: {
        Row: {
          created_at: string | null
          id: string
          item_id: string
          notes: string | null
          quantity_approved: number | null
          quantity_issued: number | null
          quantity_requested: number
          requisition_id: string
          total_price: number | null
          unit_price: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          item_id: string
          notes?: string | null
          quantity_approved?: number | null
          quantity_issued?: number | null
          quantity_requested: number
          requisition_id: string
          total_price?: number | null
          unit_price?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          item_id?: string
          notes?: string | null
          quantity_approved?: number | null
          quantity_issued?: number | null
          quantity_requested?: number
          requisition_id?: string
          total_price?: number | null
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "requisition_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items_master"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requisition_items_requisition_id_fkey"
            columns: ["requisition_id"]
            isOneToOne: false
            referencedRelation: "requisitions"
            referencedColumns: ["id"]
          },
        ]
      }
      requisitions: {
        Row: {
          approval_comments: string | null
          approved_at: string | null
          approved_by: string | null
          authorization_document: string | null
          completed_at: string | null
          created_at: string | null
          department: string | null
          id: string
          issued_at: string | null
          issued_by: string | null
          priority: string | null
          purpose: string
          rejection_reason: string | null
          request_type: string | null
          requester_id: string
          requisition_number: string
          status: string | null
          total_value: number | null
          updated_at: string | null
        }
        Insert: {
          approval_comments?: string | null
          approved_at?: string | null
          approved_by?: string | null
          authorization_document?: string | null
          completed_at?: string | null
          created_at?: string | null
          department?: string | null
          id?: string
          issued_at?: string | null
          issued_by?: string | null
          priority?: string | null
          purpose: string
          rejection_reason?: string | null
          request_type?: string | null
          requester_id: string
          requisition_number: string
          status?: string | null
          total_value?: number | null
          updated_at?: string | null
        }
        Update: {
          approval_comments?: string | null
          approved_at?: string | null
          approved_by?: string | null
          authorization_document?: string | null
          completed_at?: string | null
          created_at?: string | null
          department?: string | null
          id?: string
          issued_at?: string | null
          issued_by?: string | null
          priority?: string | null
          purpose?: string
          rejection_reason?: string | null
          request_type?: string | null
          requester_id?: string
          requisition_number?: string
          status?: string | null
          total_value?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "requisitions_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requisitions_issued_by_fkey"
            columns: ["issued_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requisitions_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_receipts: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          challan_date: string
          challan_number: string
          created_at: string | null
          grn_number: string
          id: string
          receipt_date: string
          received_by: string
          remarks: string | null
          status: Database["public"]["Enums"]["receipt_status"]
          supplier_name: string
          updated_at: string | null
          vehicle_number: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          challan_date: string
          challan_number: string
          created_at?: string | null
          grn_number: string
          id?: string
          receipt_date?: string
          received_by: string
          remarks?: string | null
          status?: Database["public"]["Enums"]["receipt_status"]
          supplier_name: string
          updated_at?: string | null
          vehicle_number?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          challan_date?: string
          challan_number?: string
          created_at?: string | null
          grn_number?: string
          id?: string
          receipt_date?: string
          received_by?: string
          remarks?: string | null
          status?: Database["public"]["Enums"]["receipt_status"]
          supplier_name?: string
          updated_at?: string | null
          vehicle_number?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_receipts_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_receipts_received_by_fkey"
            columns: ["received_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_receipts_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          department: string | null
          email: string | null
          full_name: string
          id: string
          is_active: boolean
          last_login: string | null
          last_password_change: string | null
          login_attempts: number | null
          password_change_required: boolean | null
          password_hash: string | null
          password_reset_token: string | null
          rank: string | null
          role: Database["public"]["Enums"]["user_role"]
          service_number: string | null
          updated_at: string | null
          username: string
        }
        Insert: {
          created_at?: string | null
          department?: string | null
          email?: string | null
          full_name: string
          id?: string
          is_active?: boolean
          last_login?: string | null
          last_password_change?: string | null
          login_attempts?: number | null
          password_change_required?: boolean | null
          password_hash?: string | null
          password_reset_token?: string | null
          rank?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          service_number?: string | null
          updated_at?: string | null
          username: string
        }
        Update: {
          created_at?: string | null
          department?: string | null
          email?: string | null
          full_name?: string
          id?: string
          is_active?: boolean
          last_login?: string | null
          last_password_change?: string | null
          login_attempts?: number | null
          password_change_required?: boolean | null
          password_hash?: string | null
          password_reset_token?: string | null
          rank?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          service_number?: string | null
          updated_at?: string | null
          username?: string
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
      item_category:
        | "consumable"
        | "non_consumable"
        | "sensitive"
        | "capital_asset"
      receipt_status:
        | "draft"
        | "submitted"
        | "verified"
        | "approved"
        | "rejected"
      user_role: "semi_user" | "user" | "admin" | "super_admin"
      workflow_action: "submitted" | "verified" | "approved" | "rejected"
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
      item_category: [
        "consumable",
        "non_consumable",
        "sensitive",
        "capital_asset",
      ],
      receipt_status: [
        "draft",
        "submitted",
        "verified",
        "approved",
        "rejected",
      ],
      user_role: ["semi_user", "user", "admin", "super_admin"],
      workflow_action: ["submitted", "verified", "approved", "rejected"],
    },
  },
} as const

// Re-export convenient type aliases
export type UserRole = Database['public']['Enums']['user_role']
export type ItemCategory = Database['public']['Enums']['item_category']
export type ReceiptStatus = Database['public']['Enums']['receipt_status']
export type WorkflowAction = Database['public']['Enums']['workflow_action']
