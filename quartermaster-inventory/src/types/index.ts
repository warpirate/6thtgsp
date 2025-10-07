import type { Database, UserRole as DBUserRole, ReceiptStatus, WorkflowAction } from './database.types'

// Database table types
export type User = Database['public']['Tables']['users']['Row']
export type UserInsert = Database['public']['Tables']['users']['Insert']
export type UserUpdate = Database['public']['Tables']['users']['Update']

export type ItemMaster = Database['public']['Tables']['items_master']['Row']
export type ItemMasterInsert = Database['public']['Tables']['items_master']['Insert']
export type ItemMasterUpdate = Database['public']['Tables']['items_master']['Update']

export type StockReceipt = Database['public']['Tables']['stock_receipts']['Row']
export type StockReceiptInsert = Database['public']['Tables']['stock_receipts']['Insert']
export type StockReceiptUpdate = Database['public']['Tables']['stock_receipts']['Update']

export type ReceiptItem = Database['public']['Tables']['receipt_items']['Row']
export type ReceiptItemInsert = Database['public']['Tables']['receipt_items']['Insert']
export type ReceiptItemUpdate = Database['public']['Tables']['receipt_items']['Update']

export type Document = Database['public']['Tables']['documents']['Row']
export type DocumentInsert = Database['public']['Tables']['documents']['Insert']
export type DocumentUpdate = Database['public']['Tables']['documents']['Update']

export type AuditLog = Database['public']['Tables']['audit_logs']['Row']
export type AuditLogInsert = Database['public']['Tables']['audit_logs']['Insert']

export type ApprovalWorkflow = Database['public']['Tables']['approval_workflow']['Row']
export type ApprovalWorkflowInsert = Database['public']['Tables']['approval_workflow']['Insert']

// Extended types with relationships
export interface UserWithDetails extends User {
  created_items?: ItemMaster[]
  received_receipts?: StockReceipt[]
  verified_receipts?: StockReceipt[]
  approved_receipts?: StockReceipt[]
}

export interface StockReceiptWithDetails extends StockReceipt {
  received_by_user?: User
  verified_by_user?: User
  approved_by_user?: User
  receipt_items?: ReceiptItem[]
  documents?: Document[]
  approval_workflow?: ApprovalWorkflow[]
}

export interface ApprovalWorkflowWithUser extends ApprovalWorkflow {
  approver?: User
}

export interface DocumentWithReceipt extends Document {
  stock_receipt?: StockReceipt
  uploaded_by_user?: User
}

export interface ReceiptItemWithDetails extends ReceiptItem {
  item?: ItemMaster
  stock_receipt?: StockReceipt
}

// Re-export database enums with more convenient names
export type UserRoleName = DBUserRole
export type { ReceiptStatus, WorkflowAction }
export type ApprovalAction = WorkflowAction

// Runtime enum for backward compatibility and value access
export enum UserRole {
  SEMI_USER = 'semi_user',
  USER = 'user',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}

// Export UserRole as UserRoleName as well for compatibility
export { UserRole as UserRoleEnum }

// Also create runtime enum for UserRoleName
export const UserRoleValues = {
  SEMI_USER: 'semi_user' as const,
  USER: 'user' as const,
  ADMIN: 'admin' as const,
  SUPER_ADMIN: 'super_admin' as const,
} as const

// Permission types
export interface RolePermissions {
  create_receipt?: boolean
  edit_own_draft?: boolean
  verify_receipt?: boolean
  approve_receipt?: boolean
  view_reports?: boolean
  all?: boolean
}

// API Response types
export interface ApiResponse<T = any> {
  data?: T
  error?: string
  message?: string
  success: boolean
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Form types
export interface LoginForm {
  email: string
  password: string
  remember?: boolean
}

export interface ReceiptForm {
  item_name: string
  description?: string
  quantity: number
  unit: string
  unit_price?: number
  supplier?: string
  purchase_date?: string
}

export interface ApprovalForm {
  action: ApprovalAction
  comments?: string
}

export interface UserProfileForm {
  full_name: string
  phone?: string
  department?: string
}

export interface PasswordChangeForm {
  current_password: string
  new_password: string
  confirm_password: string
}

// Filter and search types
export interface ReceiptFilters {
  status?: ReceiptStatus[]
  created_by?: string
  date_from?: string
  date_to?: string
  search?: string
  department?: string
}

export interface AuditLogFilters {
  user_id?: string
  table_name?: string
  operation?: string
  date_from?: string
  date_to?: string
}

// Dashboard statistics
export interface DashboardStats {
  total_receipts: number
  pending_approvals: number
  approved_today: number
  rejected_today: number
  status_breakdown: {
    [key in ReceiptStatus]: number
  }
  recent_activities: AuditLog[]
}

// Chart data types
export interface ChartDataPoint {
  name: string
  value: number
  color?: string
}

export interface TimeSeriesData {
  date: string
  value: number
  category?: string
}

// Export types
export interface ExportOptions {
  format: 'csv' | 'pdf' | 'xlsx'
  filters?: ReceiptFilters
  columns?: string[]
  date_range?: {
    from: string
    to: string
  }
}

// File upload types
export interface FileUploadProgress {
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
  url?: string
}

export interface FileValidationResult {
  valid: boolean
  error?: string
  warnings?: string[]
}

// Notification types
export interface NotificationMessage {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  timestamp: Date
  read?: boolean
  action?: {
    label: string
    handler: () => void
  }
}

// Session types
export interface UserSession {
  user: User
  role: UserRoleName
  permissions: RolePermissions
  expires_at: string
}

// Component prop types
export interface BaseComponentProps {
  className?: string
  children?: React.ReactNode
}

export interface LoadingState {
  isLoading: boolean
  error?: string | null
}

export interface FormState<T = any> extends LoadingState {
  data?: T
  isDirty?: boolean
  isValid?: boolean
}

// Route types
export interface RouteConfig {
  path: string
  element: React.ComponentType
  requiredRole?: UserRoleName[]
  requiredPermission?: string
  exact?: boolean
}

// Theme types
export interface ThemeConfig {
  mode: 'light' | 'dark' | 'system'
  primaryColor: string
  accentColor: string
  fontFamily: string
}

// Error types
export interface AppError extends Error {
  code?: string
  status?: number
  context?: Record<string, any>
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public field?: string,
    public code?: string
  ) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class AuthenticationError extends Error {
  constructor(message: string = 'Authentication required') {
    super(message)
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends Error {
  constructor(message: string = 'Insufficient permissions') {
    super(message)
    this.name = 'AuthorizationError'
  }
}

// Utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>

// Generic CRUD operations
export interface CrudOperations<T, TInsert = Partial<T>, TUpdate = Partial<T>> {
  list: (filters?: any) => Promise<T[]>
  get: (id: string) => Promise<T | null>
  create: (data: TInsert) => Promise<T>
  update: (id: string, data: TUpdate) => Promise<T>
  delete: (id: string) => Promise<boolean>
}

// Search and pagination
export interface SearchParams {
  query?: string
  page?: number
  limit?: number
  sort?: string
  order?: 'asc' | 'desc'
}

export interface PaginationInfo {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export type { Database }
export type { Database as default }

// Re-export requisition types
export * from './requisition.types'
