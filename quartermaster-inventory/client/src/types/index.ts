// User types
export interface User {
  id: string;
  username: string;
  full_name: string;
  rank?: string;
  service_number?: string;
  role: 'semi_user' | 'user' | 'admin' | 'super_admin';
  email?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_login?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  token: string;
  user: User;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

// Item types
export interface Item {
  id: string;
  item_code: string;
  nomenclature: string;
  category: 'consumable' | 'non_consumable' | 'sensitive' | 'capital_asset';
  unit_of_measure: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface CreateItemRequest {
  item_code: string;
  nomenclature: string;
  category: Item['category'];
  unit_of_measure: string;
  description?: string;
}

// Receipt types
export interface Receipt {
  id: string;
  grn_number: string;
  receipt_date: string;
  challan_number: string;
  challan_date: string;
  supplier_name: string;
  vehicle_number?: string;
  status: 'draft' | 'submitted' | 'verified' | 'approved' | 'rejected';
  remarks?: string;
  created_at: string;
  updated_at: string;
  received_by_name: string;
  received_by_rank?: string;
  received_by_service_number?: string;
  verified_by_name?: string;
  approved_by_name?: string;
  verified_at?: string;
  approved_at?: string;
}

export interface ReceiptItem {
  id: string;
  receipt_id: string;
  item_id: string;
  challan_quantity: number;
  received_quantity: number;
  variance: number;
  unit_rate: number;
  total_value: number;
  condition_notes?: string;
  created_at: string;
  item_code: string;
  nomenclature: string;
  category: string;
  unit_of_measure: string;
}

export interface ReceiptWithItems extends Receipt {
  items: ReceiptItem[];
  documents?: Document[];
  workflow?: WorkflowEntry[];
}

export interface CreateReceiptRequest {
  receipt_date: string;
  challan_number: string;
  challan_date: string;
  supplier_name: string;
  vehicle_number?: string;
  items: CreateReceiptItemRequest[];
  remarks?: string;
}

export interface CreateReceiptItemRequest {
  item_id: string;
  challan_quantity: number;
  received_quantity: number;
  unit_rate: number;
  condition_notes?: string;
}

export interface UpdateReceiptRequest extends CreateReceiptRequest {}

// Document types
export interface Document {
  id: string;
  receipt_id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  uploaded_by: string;
  uploaded_at: string;
}

// Workflow types
export interface WorkflowEntry {
  id: string;
  receipt_id: string;
  approver_id: string;
  action: 'submitted' | 'verified' | 'approved' | 'rejected';
  comments?: string;
  action_date: string;
  approver_name: string;
  rank?: string;
  service_number?: string;
}

// Audit log types
export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  table_name: string;
  record_id?: string;
  old_value?: any;
  new_value?: any;
  ip_address?: string;
  timestamp: string;
  user_name: string;
  rank?: string;
  service_number?: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  count?: number;
  filters?: any;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  count: number;
  total?: number;
}

// Report types
export interface ReceiptRegisterReport extends ApiResponse<Receipt[]> {
  filters: {
    date_from?: string;
    date_to?: string;
    status?: string;
    item_category?: string;
  };
}

export interface ItemHistoryReport {
  item: Item;
  receipts: Array<{
    id: string;
    grn_number: string;
    receipt_date: string;
    challan_number: string;
    supplier_name: string;
    challan_quantity: number;
    received_quantity: number;
    unit_rate: number;
    total_value: number;
    received_by_name: string;
  }>;
  count: number;
  filters: {
    date_from?: string;
    date_to?: string;
    item_id: string;
  };
}

export interface PendingApprovalsReport extends ApiResponse<Receipt[]> {
  type: 'verification' | 'approval';
}

export interface SystemStats {
  users: {
    total: number;
    by_role: Array<{
      role: string;
      count: number;
    }>;
  };
  receipts: {
    total: number;
    by_status: Array<{
      status: string;
      count: number;
    }>;
  };
  monthly_trend: Array<{
    month: string;
    receipt_count: number;
    unique_users: number;
    total_value: number;
  }>;
  items: {
    total: number;
    by_category: Array<{
      category: string;
      count: number;
    }>;
  };
  recent_activity: Array<{
    action: string;
    count: number;
    latest_activity: string;
  }>;
}

// Dashboard types
export interface DashboardStats {
  total_receipts?: number;
  pending_submissions?: number;
  pending_verifications?: number;
  pending_approvals?: number;
  recent_receipts?: Receipt[];
  monthly_data?: Array<{
    month: string;
    count: number;
  }>;
}

// Filter types
export interface ReceiptFilters {
  status?: string;
  received_by?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
  limit?: number;
}

export interface ItemFilters {
  category?: string;
  is_active?: boolean;
  search?: string;
  limit?: number;
}

export interface UserFilters {
  role?: string;
  is_active?: boolean;
  limit?: number;
}

export interface AuditFilters {
  user_id?: string;
  action?: string;
  table_name?: string;
  date_from?: string;
  date_to?: string;
  limit?: number;
}

// Form validation types
export interface ValidationError {
  field: string;
  message: string;
}

export interface FormErrors {
  [key: string]: string;
}

// UI State types
export interface LoadingState {
  [key: string]: boolean;
}

export interface ModalState {
  isOpen: boolean;
  type?: string;
  data?: any;
}
