// Requisition System Types
// Complete type definitions for the requisition/issuance workflow

import { User } from './index'

// =============================================
// ENUMS
// =============================================

export type RequestType = 'self' | 'department' | 'bulk'
export type Priority = 'normal' | 'urgent' | 'emergency'
export type RequisitionStatus = 'draft' | 'pending' | 'approved' | 'ready_for_pickup' | 'issued' | 'completed' | 'rejected' | 'cancelled'
export type ItemCondition = 'new' | 'good' | 'fair' | 'damaged'
export type ReturnStatus = 'pending' | 'accepted' | 'rejected'
export type ReturnCondition = 'good' | 'fair' | 'damaged' | 'lost'
export type AllocationStatus = 'active' | 'returned' | 'lost' | 'damaged'
export type MovementType = 'receipt' | 'issue' | 'return' | 'adjustment' | 'transfer' | 'damage' | 'loss'
export type WeaponStatus = 'available' | 'issued' | 'maintenance' | 'damaged' | 'decommissioned'
export type StockStatus = 'available' | 'low' | 'out_of_stock'

// =============================================
// ITEM CATEGORY
// =============================================

export interface ItemCategory {
  id: string
  name: string
  description?: string
  code: string
  icon?: string
  requires_serial_number: boolean
  is_returnable: boolean
  requires_authorization: boolean
  is_weapon: boolean
  active: boolean
  created_at: string
  updated_at: string
}

export interface ItemCategoryInsert extends Omit<ItemCategory, 'id' | 'created_at' | 'updated_at'> {}
export interface ItemCategoryUpdate extends Partial<ItemCategoryInsert> {}

// =============================================
// ITEMS MASTER (Catalog)
// =============================================

export interface ItemMaster {
  id: string
  item_code: string
  name: string
  description?: string
  category_id: string
  unit: string
  unit_price?: number
  reorder_level: number
  current_stock: number
  allocated_stock: number
  available_stock: number // computed
  location?: string
  specifications?: Record<string, any>
  image_url?: string
  active: boolean
  created_by?: string
  created_at: string
  updated_at: string
}

export interface ItemMasterInsert extends Omit<ItemMaster, 'id' | 'item_code' | 'available_stock' | 'created_at' | 'updated_at'> {}
export interface ItemMasterUpdate extends Partial<ItemMasterInsert> {}

export interface ItemMasterWithCategory extends ItemMaster {
  category?: ItemCategory
  category_name?: string
  category_code?: string
  is_weapon?: boolean
  requires_authorization?: boolean
  requires_serial_number?: boolean
  is_returnable?: boolean
  stock_status?: StockStatus
}

// =============================================
// REQUISITION
// =============================================

export interface Requisition {
  id: string
  requisition_number: string
  requester_id: string
  department?: string
  request_type: RequestType
  priority: Priority
  purpose: string
  status: RequisitionStatus
  total_value: number
  approved_by?: string
  approved_at?: string
  approval_comments?: string
  issued_by?: string
  issued_at?: string
  completed_at?: string
  rejection_reason?: string
  authorization_document?: string
  created_at: string
  updated_at: string
}

export interface RequisitionInsert extends Omit<Requisition, 'id' | 'requisition_number' | 'total_value' | 'created_at' | 'updated_at'> {}
export interface RequisitionUpdate extends Partial<RequisitionInsert> {}

export interface RequisitionWithDetails extends Requisition {
  requester?: User
  requester_name?: string
  requester_department?: string
  requester_badge?: string
  approver?: User
  issuer?: User
  items?: RequisitionItemWithDetails[]
  item_count?: number
}

// =============================================
// REQUISITION ITEM
// =============================================

export interface RequisitionItem {
  id: string
  requisition_id: string
  item_id: string
  quantity_requested: number
  quantity_approved?: number
  quantity_issued: number
  unit_price?: number
  total_price: number // computed
  notes?: string
  created_at: string
}

export interface RequisitionItemInsert extends Omit<RequisitionItem, 'id' | 'total_price' | 'created_at'> {}
export interface RequisitionItemUpdate extends Partial<RequisitionItemInsert> {}

export interface RequisitionItemWithDetails extends RequisitionItem {
  item?: ItemMasterWithCategory
  item_name?: string
  item_code?: string
  category_name?: string
  unit?: string
  available_stock?: number
}

// =============================================
// ISSUANCE
// =============================================

export interface Issuance {
  id: string
  issuance_number: string
  requisition_id: string
  requisition_item_id: string
  item_id: string
  quantity: number
  serial_numbers?: string[]
  asset_tags?: string[]
  condition: ItemCondition
  issued_by: string
  issued_to: string
  issued_at: string
  expected_return_date?: string
  gate_pass_number?: string
  delivery_challan_number?: string
  receiver_signature?: string
  notes?: string
  created_at: string
}

export interface IssuanceInsert extends Omit<Issuance, 'id' | 'issuance_number' | 'created_at'> {}
export interface IssuanceUpdate extends Partial<IssuanceInsert> {}

export interface IssuanceWithDetails extends Issuance {
  item?: ItemMasterWithCategory
  item_name?: string
  requisition?: Requisition
  requisition_number?: string
  issuer?: User
  receiver?: User
  receiver_name?: string
  is_overdue?: boolean
}

// =============================================
// RETURN
// =============================================

export interface Return {
  id: string
  return_number: string
  issuance_id: string
  item_id: string
  quantity: number
  serial_numbers?: string[]
  condition: ReturnCondition
  return_reason?: string
  damage_description?: string
  damage_charge: number
  returned_by: string
  accepted_by?: string
  returned_at: string
  accepted_at?: string
  status: ReturnStatus
  rejection_reason?: string
  notes?: string
  created_at: string
}

export interface ReturnInsert extends Omit<Return, 'id' | 'return_number' | 'created_at'> {}
export interface ReturnUpdate extends Partial<ReturnInsert> {}

export interface ReturnWithDetails extends Return {
  item?: ItemMasterWithCategory
  item_name?: string
  issuance?: IssuanceWithDetails
  returner?: User
  returner_name?: string
  acceptor?: User
}

// =============================================
// ITEM ALLOCATION
// =============================================

export interface ItemAllocation {
  id: string
  item_id: string
  issuance_id: string
  allocated_to: string
  serial_number?: string
  asset_tag?: string
  quantity: number
  status: AllocationStatus
  allocated_at: string
  returned_at?: string
  created_at: string
}

export interface ItemAllocationInsert extends Omit<ItemAllocation, 'id' | 'created_at'> {}
export interface ItemAllocationUpdate extends Partial<ItemAllocationInsert> {}

export interface ItemAllocationWithDetails extends ItemAllocation {
  item?: ItemMasterWithCategory
  item_name?: string
  item_code?: string
  category_name?: string
  user?: User
  user_name?: string
  department?: string
  issuance?: Issuance
  issued_at?: string
  expected_return_date?: string
  is_overdue?: boolean
}

// =============================================
// STOCK MOVEMENT
// =============================================

export interface StockMovement {
  id: string
  item_id: string
  movement_type: MovementType
  quantity: number
  reference_type?: string
  reference_id?: string
  from_location?: string
  to_location?: string
  performed_by: string
  notes?: string
  created_at: string
}

export interface StockMovementInsert extends Omit<StockMovement, 'id' | 'created_at'> {}

export interface StockMovementWithDetails extends StockMovement {
  item?: ItemMasterWithCategory
  item_name?: string
  performer?: User
  performer_name?: string
}

// =============================================
// WEAPON REGISTER
// =============================================

export interface WeaponRegister {
  id: string
  item_id: string
  serial_number: string
  weapon_type: string
  make?: string
  model?: string
  caliber?: string
  manufacture_year?: number
  license_number?: string
  status: WeaponStatus
  current_holder?: string
  last_issued_at?: string
  last_maintenance_date?: string
  next_maintenance_due?: string
  condition_notes?: string
  created_at: string
  updated_at: string
}

export interface WeaponRegisterInsert extends Omit<WeaponRegister, 'id' | 'created_at' | 'updated_at'> {}
export interface WeaponRegisterUpdate extends Partial<WeaponRegisterInsert> {}

export interface WeaponRegisterWithDetails extends WeaponRegister {
  item?: ItemMasterWithCategory
  item_name?: string
  holder?: User
  holder_name?: string
  is_overdue_maintenance?: boolean
}

// =============================================
// FORM TYPES
// =============================================

export interface RequisitionForm {
  request_type: RequestType
  priority: Priority
  purpose: string
  department?: string
  authorization_document?: string
  items: Array<{
    item_id: string
    quantity: number
    notes?: string
  }>
}

export interface IssuanceForm {
  requisition_id: string
  requisition_item_id: string
  item_id: string
  quantity: number
  serial_numbers?: string[]
  asset_tags?: string[]
  condition: ItemCondition
  issued_to: string
  expected_return_date?: string
  gate_pass_number?: string
  delivery_challan_number?: string
  notes?: string
}

export interface ReturnForm {
  issuance_id: string
  quantity: number
  serial_numbers?: string[]
  condition: ReturnCondition
  return_reason?: string
  damage_description?: string
  notes?: string
}

export interface ApprovalForm {
  action: 'approve' | 'reject'
  comments?: string
  quantity_approved?: number // For modifying quantities
}

// =============================================
// FILTER TYPES
// =============================================

export interface RequisitionFilters {
  status?: RequisitionStatus[]
  requester_id?: string
  department?: string
  priority?: Priority[]
  date_from?: string
  date_to?: string
  search?: string
}

export interface ItemFilters {
  category_id?: string
  search?: string
  stock_status?: StockStatus[]
  active?: boolean
  min_price?: number
  max_price?: number
}

export interface IssuanceFilters {
  issued_to?: string
  item_id?: string
  date_from?: string
  date_to?: string
  is_overdue?: boolean
}

export interface AllocationFilters {
  allocated_to?: string
  item_id?: string
  status?: AllocationStatus[]
  is_overdue?: boolean
}

// =============================================
// DASHBOARD STATS
// =============================================

export interface RequesterDashboardStats {
  pending_approvals: number
  ready_for_pickup: number
  items_allocated: number
  overdue_returns: number
  recent_requisitions: RequisitionWithDetails[]
  my_allocations: ItemAllocationWithDetails[]
}

export interface StoreKeeperDashboardStats {
  items_issued_today: number
  items_returned_today: number
  stock_received_today: number
  pending_issues: number
  urgent_requests: number
  overdue_returns: number
  low_stock_items: number
  ready_to_issue: RequisitionWithDetails[]
  pending_returns: ReturnWithDetails[]
}

export interface AdminDashboardStats {
  pending_approvals: number
  approved_today: number
  rejected_today: number
  total_value_pending: number
  requisitions_by_status: Record<RequisitionStatus, number>
  requisitions_by_department: Array<{ department: string; count: number }>
  recent_activities: any[]
}

export interface ArmoryDashboardStats {
  weapons_available: number
  weapons_issued: number
  weapons_maintenance: number
  overdue_returns: number
  pending_weapon_requests: number
  maintenance_due_soon: number
  weapon_allocations: ItemAllocationWithDetails[]
}

// =============================================
// CART TYPES (for requisition creation)
// =============================================

export interface CartItem {
  item: ItemMasterWithCategory
  quantity: number
  notes?: string
}

export interface Cart {
  items: CartItem[]
  total_items: number
  estimated_value: number
}

// =============================================
// NOTIFICATION TYPES
// =============================================

export interface RequisitionNotification {
  type: 'requisition_approved' | 'requisition_rejected' | 'requisition_ready_for_pickup' | 'requisition_issued' | 'return_overdue'
  requisition_id: string
  requisition_number: string
  message: string
  timestamp: string
}

// =============================================
// EXPORT TYPES
// =============================================

export interface RequisitionExportOptions {
  format: 'csv' | 'pdf' | 'xlsx'
  filters?: RequisitionFilters
  include_items?: boolean
  date_range?: {
    from: string
    to: string
  }
}

export interface StockReportOptions {
  category_id?: string
  stock_status?: StockStatus[]
  format: 'csv' | 'pdf' | 'xlsx'
}
