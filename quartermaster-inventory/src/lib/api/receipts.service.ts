import { supabase, supabaseHelpers } from '@/lib/supabase'
import type { 
  StockReceipt, 
  StockReceiptInsert, 
  StockReceiptUpdate, 
  ReceiptStatus 
} from '@/types'
import { toast } from 'react-hot-toast'

export interface ReceiptFilters {
  status?: ReceiptStatus[]
  created_by?: string
  verified_by?: string
  approved_by?: string
  date_from?: string
  date_to?: string
  search?: string
}

export interface PaginationParams {
  page?: number
  limit?: number
}

class ReceiptsService {
  /**
   * Get all receipts with filters and pagination
   */
  async getReceipts(filters?: ReceiptFilters, pagination?: PaginationParams) {
    try {
      const { page = 1, limit = 20 } = pagination || {}
      let query = supabase
        .from('stock_receipts')
        .select(`
          *,
          received_by_user:users!stock_receipts_received_by_fkey(id, full_name, email),
          verified_by_user:users!stock_receipts_verified_by_fkey(id, full_name, email),
          approved_by_user:users!stock_receipts_approved_by_fkey(id, full_name, email),
          receipt_items(
            *,
            item:items_master(*)
          ),
          documents(*),
          approval_workflow(*)
        `, { count: 'exact' })

      // Apply filters
      if (filters?.status && filters.status.length > 0) {
        query = query.in('status', filters.status)
      }

      if (filters?.created_by) {
        query = query.eq('received_by', filters.created_by)
      }

      if (filters?.verified_by) {
        query = query.eq('verified_by', filters.verified_by)
      }

      if (filters?.approved_by) {
        query = query.eq('approved_by', filters.approved_by)
      }

      if (filters?.date_from) {
        query = query.gte('created_at', filters.date_from)
      }

      if (filters?.date_to) {
        query = query.lte('created_at', filters.date_to)
      }

      if (filters?.search) {
        query = query.or(`grn_number.ilike.%${filters.search}%,supplier_name.ilike.%${filters.search}%,challan_number.ilike.%${filters.search}%`)
      }

      // Apply pagination
      const offset = (page - 1) * limit
      query = query.range(offset, offset + limit - 1)

      // Order by created_at descending
      query = query.order('created_at', { ascending: false })

      const { data, error, count } = await query

      if (error) throw error

      return {
        data: data || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
        },
      }
    } catch (error: any) {
      console.error('Error fetching receipts:', error)
      toast.error(supabaseHelpers.formatError(error))
      throw error
    }
  }

  /**
   * Get a single receipt by ID
   */
  async getReceiptById(id: string) {
    try {
      const { data, error } = await supabase
        .from('stock_receipts')
        .select(`
          *,
          received_by_user:users!stock_receipts_received_by_fkey(id, full_name, email, role),
          verified_by_user:users!stock_receipts_verified_by_fkey(id, full_name, email, role),
          approved_by_user:users!stock_receipts_approved_by_fkey(id, full_name, email, role),
          receipt_items(
            *,
            item:items_master(*)
          ),
          documents(*),
          approval_workflow(
            *,
            approver:users(id, full_name, email, role)
          )
        `)
        .eq('id', id)
        .single()

      if (error) throw error

      return data
    } catch (error: any) {
      console.error('Error fetching receipt:', error)
      toast.error(supabaseHelpers.formatError(error))
      throw error
    }
  }

  /**
   * Create a new receipt
   */
  async createReceipt(receipt: StockReceiptInsert) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('stock_receipts')
        .insert({
          ...receipt,
          received_by: user.id,
          status: 'draft',
        })
        .select()
        .single()

      if (error) throw error

      toast.success('Receipt created successfully!')
      return data
    } catch (error: any) {
      console.error('Error creating receipt:', error)
      toast.error(supabaseHelpers.formatError(error))
      throw error
    }
  }

  /**
   * Update a receipt
   */
  async updateReceipt(id: string, updates: StockReceiptUpdate) {
    try {
      const { data, error } = await supabase
        .from('stock_receipts')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      toast.success('Receipt updated successfully!')
      return data
    } catch (error: any) {
      console.error('Error updating receipt:', error)
      toast.error(supabaseHelpers.formatError(error))
      throw error
    }
  }

  /**
   * Delete a receipt
   */
  async deleteReceipt(id: string) {
    try {
      const { error } = await supabase
        .from('stock_receipts')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast.success('Receipt deleted successfully!')
      return true
    } catch (error: any) {
      console.error('Error deleting receipt:', error)
      toast.error(supabaseHelpers.formatError(error))
      throw error
    }
  }

  /**
   * Submit receipt for verification
   */
  async submitReceipt(id: string, comments?: string) {
    try {
      // Use type assertion for RPC call
      const { data, error } = await (supabase as any).rpc('update_receipt_status', {
        receipt_uuid: id,
        new_status: 'submitted',
        approval_comments: comments
      })

      if (error) throw error

      toast.success('Receipt submitted for verification!')
      return data
    } catch (error: any) {
      console.error('Error submitting receipt:', error)
      toast.error(supabaseHelpers.formatError(error))
      throw error
    }
  }

  /**
   * Verify a receipt (USER role)
   */
  async verifyReceipt(id: string, comments?: string) {
    try {
      // Use type assertion for RPC call
      const { data, error } = await (supabase as any).rpc('update_receipt_status', {
        receipt_uuid: id,
        new_status: 'verified',
        approval_comments: comments
      })

      if (error) throw error

      toast.success('Receipt verified successfully!')
      return data
    } catch (error: any) {
      console.error('Error verifying receipt:', error)
      toast.error(supabaseHelpers.formatError(error))
      throw error
    }
  }

  /**
   * Approve a receipt (ADMIN role)
   */
  async approveReceipt(id: string, comments?: string) {
    try {
      // Use type assertion for RPC call
      const { data, error } = await (supabase as any).rpc('update_receipt_status', {
        receipt_uuid: id,
        new_status: 'approved',
        approval_comments: comments
      })

      if (error) throw error

      toast.success('Receipt approved successfully!')
      return data
    } catch (error: any) {
      console.error('Error approving receipt:', error)
      toast.error(supabaseHelpers.formatError(error))
      throw error
    }
  }

  /**
   * Reject a receipt
   */
  async rejectReceipt(id: string, comments: string) {
    try {
      // Use type assertion for RPC call
      const { data, error } = await (supabase as any).rpc('update_receipt_status', {
        receipt_uuid: id,
        new_status: 'rejected',
        approval_comments: comments
      })

      if (error) throw error

      toast.success('Receipt rejected')
      return data
    } catch (error: any) {
      console.error('Error rejecting receipt:', error)
      toast.error(supabaseHelpers.formatError(error))
      throw error
    }
  }

  /**
   * Get receipts pending user action based on role
   */
  async getPendingApprovals() {
    try {
      const userRole = await supabaseHelpers.getUserRole()
      
      let statusFilter: ReceiptStatus[] = []
      
      // Semi users don't see pending approvals
      if (userRole === 'semi_user') {
        return { data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } }
      }
      
      // Users see submitted receipts for verification
      if (userRole === 'user') {
        statusFilter = ['submitted']
      }
      
      // Admins see verified receipts for approval
      if (userRole === 'admin' || userRole === 'super_admin') {
        statusFilter = ['verified']
      }

      return await this.getReceipts({ status: statusFilter })
    } catch (error: any) {
      console.error('Error fetching pending approvals:', error)
      toast.error(supabaseHelpers.formatError(error))
      throw error
    }
  }

  /**
   * Get dashboard statistics
   */
  async getDashboardStats() {
    try {
      const userRole = await supabaseHelpers.getUserRole()
      const user = await supabaseHelpers.getCurrentUser()

      // Get all receipts
      const { data: allReceipts } = await supabase
        .from('stock_receipts')
        .select('id, status, created_at')

      // Get user's receipts
      const { data: myReceipts } = await supabase
        .from('stock_receipts')
        .select('id, status, created_at')
        .eq('received_by', user?.id || '')

      const today = new Date().toISOString().split('T')[0]

      const stats = {
        totalReceipts: allReceipts?.length || 0,
        pendingApprovals: allReceipts?.filter(r => 
          userRole === 'user' ? r.status === 'submitted' : 
          userRole === 'admin' || userRole === 'super_admin' ? r.status === 'verified' : false
        ).length || 0,
        approvedToday: allReceipts?.filter(r => 
          r.status === 'approved' && r.created_at?.startsWith(today)
        ).length || 0,
        rejectedToday: allReceipts?.filter(r => 
          r.status === 'rejected' && r.created_at?.startsWith(today)
        ).length || 0,
        myDrafts: myReceipts?.filter(r => r.status === 'draft').length || 0,
        myPendingVerification: myReceipts?.filter(r => r.status === 'submitted').length || 0,
      }

      return stats
    } catch (error: any) {
      console.error('Error fetching dashboard stats:', error)
      toast.error(supabaseHelpers.formatError(error))
      throw error
    }
  }
}

export const receiptsService = new ReceiptsService()
