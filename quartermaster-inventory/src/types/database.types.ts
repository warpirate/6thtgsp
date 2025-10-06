// Generated TypeScript types for Supabase database
// This file matches the existing database schema

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'semi_user' | 'user' | 'admin' | 'super_admin'
export type ItemCategory = 'consumable' | 'non_consumable' | 'sensitive' | 'capital_asset'
export type ReceiptStatus = 'draft' | 'submitted' | 'verified' | 'approved' | 'rejected'
export type WorkflowAction = 'submitted' | 'verified' | 'approved' | 'rejected'

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          username: string
          password_hash: string
          full_name: string
          rank: string | null
          service_number: string | null
          role: UserRole
          email: string | null
          department: string | null
          is_active: boolean
          created_at: string | null
          updated_at: string | null
          last_login: string | null
        }
        Insert: {
          id?: string
          username?: string
          password_hash?: string
          full_name: string
          rank?: string | null
          service_number?: string | null
          role?: UserRole
          email?: string | null
          department?: string | null
          is_active?: boolean
          created_at?: string | null
          updated_at?: string | null
          last_login?: string | null
        }
        Update: {
          id?: string
          username?: string
          password_hash?: string
          full_name?: string
          rank?: string | null
          service_number?: string | null
          role?: UserRole
          email?: string | null
          department?: string | null
          is_active?: boolean
          created_at?: string | null
          updated_at?: string | null
          last_login?: string | null
        }
        Relationships: []
      }
      items_master: {
        Row: {
          id: string
          item_code: string
          nomenclature: string
          category: ItemCategory
          unit_of_measure: string
          description: string | null
          is_active: boolean
          created_at: string | null
          updated_at: string | null
          created_by: string | null
        }
        Insert: {
          id?: string
          item_code: string
          nomenclature: string
          category: ItemCategory
          unit_of_measure: string
          description?: string | null
          is_active?: boolean
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
        }
        Update: {
          id?: string
          item_code?: string
          nomenclature?: string
          category?: ItemCategory
          unit_of_measure?: string
          description?: string | null
          is_active?: boolean
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "items_master_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      stock_receipts: {
        Row: {
          id: string
          grn_number: string
          receipt_date: string
          challan_number: string
          challan_date: string
          supplier_name: string
          vehicle_number: string | null
          received_by: string
          status: ReceiptStatus
          verified_by: string | null
          verified_at: string | null
          approved_by: string | null
          approved_at: string | null
          remarks: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          grn_number: string
          receipt_date?: string
          challan_number: string
          challan_date: string
          supplier_name: string
          vehicle_number?: string | null
          received_by: string
          status?: ReceiptStatus
          verified_by?: string | null
          verified_at?: string | null
          approved_by?: string | null
          approved_at?: string | null
          remarks?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          grn_number?: string
          receipt_date?: string
          challan_number?: string
          challan_date?: string
          supplier_name?: string
          vehicle_number?: string | null
          received_by?: string
          status?: ReceiptStatus
          verified_by?: string | null
          verified_at?: string | null
          approved_by?: string | null
          approved_at?: string | null
          remarks?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_receipts_received_by_fkey"
            columns: ["received_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_receipts_verified_by_fkey"
            columns: ["verified_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_receipts_approved_by_fkey"
            columns: ["approved_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      receipt_items: {
        Row: {
          id: string
          receipt_id: string
          item_id: string
          challan_quantity: number
          received_quantity: number
          variance: number | null
          unit_rate: number
          total_value: number | null
          condition_notes: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          receipt_id: string
          item_id: string
          challan_quantity: number
          received_quantity: number
          unit_rate: number
          condition_notes?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          receipt_id?: string
          item_id?: string
          challan_quantity?: number
          received_quantity?: number
          unit_rate?: number
          condition_notes?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "receipt_items_receipt_id_fkey"
            columns: ["receipt_id"]
            referencedRelation: "stock_receipts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipt_items_item_id_fkey"
            columns: ["item_id"]
            referencedRelation: "items_master"
            referencedColumns: ["id"]
          }
        ]
      }
      documents: {
        Row: {
          id: string
          receipt_id: string
          file_name: string
          file_path: string
          file_type: string
          file_size: number
          uploaded_by: string
          uploaded_at: string | null
        }
        Insert: {
          id?: string
          receipt_id: string
          file_name: string
          file_path: string
          file_type: string
          file_size: number
          uploaded_by: string
          uploaded_at?: string | null
        }
        Update: {
          id?: string
          receipt_id?: string
          file_name?: string
          file_path?: string
          file_type?: string
          file_size?: number
          uploaded_by?: string
          uploaded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_receipt_id_fkey"
            columns: ["receipt_id"]
            referencedRelation: "stock_receipts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string
          action: string
          table_name: string
          record_id: string | null
          old_value: Json | null
          new_value: Json | null
          ip_address: string | null
          user_agent: string | null
          timestamp: string | null
        }
        Insert: {
          id?: string
          user_id: string
          action: string
          table_name: string
          record_id?: string | null
          old_value?: Json | null
          new_value?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          timestamp?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          action?: string
          table_name?: string
          record_id?: string | null
          old_value?: Json | null
          new_value?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      approval_workflow: {
        Row: {
          id: string
          receipt_id: string
          approver_id: string
          action: WorkflowAction
          comments: string | null
          action_date: string | null
        }
        Insert: {
          id?: string
          receipt_id: string
          approver_id: string
          action: WorkflowAction
          comments?: string | null
          action_date?: string | null
        }
        Update: {
          id?: string
          receipt_id?: string
          approver_id?: string
          action?: WorkflowAction
          comments?: string | null
          action_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "approval_workflow_receipt_id_fkey"
            columns: ["receipt_id"]
            referencedRelation: "stock_receipts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_workflow_approver_id_fkey"
            columns: ["approver_id"]
            referencedRelation: "users"
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
