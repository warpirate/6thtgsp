import { supabase, supabaseHelpers } from '@/lib/supabase'
import type { User, UserUpdate, UserRole } from '@/types'
import { toast } from 'react-hot-toast'

class UsersService {
  /**
   * Get all users (admin/super admin only)
   */
  async getAllUsers(filters?: { search?: string; role?: UserRole; department?: string }) {
    try {
      let query = supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      if (filters?.search) {
        query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,username.ilike.%${filters.search}%`)
      }

      if (filters?.role) {
        query = query.eq('role', filters.role)
      }

      if (filters?.department) {
        query = query.eq('department', filters.department)
      }

      const { data, error } = await query

      if (error) throw error

      return data || []
    } catch (error: any) {
      console.error('Error fetching users:', error)
      toast.error(supabaseHelpers.formatError(error))
      throw error
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error

      return data
    } catch (error: any) {
      console.error('Error fetching user:', error)
      toast.error(supabaseHelpers.formatError(error))
      throw error
    }
  }

  /**
   * Update user profile
   */
  async updateUser(userId: string, updates: UserUpdate) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single()

      if (error) throw error

      toast.success('User updated successfully!')
      return data
    } catch (error: any) {
      console.error('Error updating user:', error)
      toast.error(supabaseHelpers.formatError(error))
      throw error
    }
  }

  /**
   * Update user role (super admin only)
   */
  async updateUserRole(userId: string, newRole: UserRole) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({
          role: newRole,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single()

      if (error) throw error

      toast.success('User role updated successfully!')
      return data
    } catch (error: any) {
      console.error('Error updating user role:', error)
      toast.error(supabaseHelpers.formatError(error))
      throw error
    }
  }

  /**
   * Deactivate user (soft delete)
   */
  async deactivateUser(userId: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single()

      if (error) throw error

      toast.success('User deactivated successfully!')
      return data
    } catch (error: any) {
      console.error('Error deactivating user:', error)
      toast.error(supabaseHelpers.formatError(error))
      throw error
    }
  }

  /**
   * Activate user
   */
  async activateUser(userId: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single()

      if (error) throw error

      toast.success('User activated successfully!')
      return data
    } catch (error: any) {
      console.error('Error activating user:', error)
      toast.error(supabaseHelpers.formatError(error))
      throw error
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(userId: string) {
    try {
      const { data: receipts } = await supabase
        .from('stock_receipts')
        .select('id, status, created_at')
        .eq('received_by', userId)

      const today = new Date().toISOString().split('T')[0]
      const thisMonth = new Date().toISOString().slice(0, 7)

      const stats = {
        totalReceipts: receipts?.length || 0,
        drafts: receipts?.filter(r => r.status === 'draft').length || 0,
        submitted: receipts?.filter(r => r.status === 'submitted').length || 0,
        approved: receipts?.filter(r => r.status === 'approved').length || 0,
        rejected: receipts?.filter(r => r.status === 'rejected').length || 0,
        today: receipts?.filter(r => r.created_at?.startsWith(today)).length || 0,
        thisMonth: receipts?.filter(r => r.created_at?.startsWith(thisMonth)).length || 0,
      }

      return stats
    } catch (error: any) {
      console.error('Error fetching user stats:', error)
      toast.error(supabaseHelpers.formatError(error))
      throw error
    }
  }
}

export const usersService = new UsersService()
