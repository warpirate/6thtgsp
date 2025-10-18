import { supabase, supabaseHelpers } from '@/lib/supabase'
import type { AuditLog } from '@/types'
import { toast } from 'react-hot-toast'

export interface AuditLogFilters {
  user_id?: string
  table_name?: string
  action?: string
  date_from?: string
  date_to?: string
  record_id?: string
}

class AuditService {
  /**
   * Get audit logs with filters
   */
  async getAuditLogs(filters?: AuditLogFilters, page: number = 1, limit: number = 50) {
    try {
      let query = supabase
        .from('audit_logs')
        .select(`
          *,
          user:users(id, full_name, email, role)
        `, { count: 'exact' })
        .order('timestamp', { ascending: false })

      // Apply filters
      if (filters?.user_id) {
        query = query.eq('user_id', filters.user_id)
      }

      if (filters?.table_name) {
        query = query.eq('table_name', filters.table_name)
      }

      if (filters?.action) {
        query = query.eq('action', filters.action)
      }

      if (filters?.record_id) {
        query = query.eq('record_id', filters.record_id)
      }

      if (filters?.date_from) {
        query = query.gte('timestamp', filters.date_from)
      }

      if (filters?.date_to) {
        query = query.lte('timestamp', filters.date_to)
      }

      // Apply pagination
      const offset = (page - 1) * limit
      query = query.range(offset, offset + limit - 1)

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
      console.error('Error fetching audit logs:', error)
      toast.error(supabaseHelpers.formatError(error))
      throw error
    }
  }

  /**
   * Get recent activities
   */
  async getRecentActivities(limit: number = 10) {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select(`
          *,
          user:users(id, full_name, email, role)
        `)
        .order('timestamp', { ascending: false })
        .limit(limit)

      if (error) throw error

      return data || []
    } catch (error: any) {
      console.error('Error fetching recent activities:', error)
      toast.error(supabaseHelpers.formatError(error))
      throw error
    }
  }

  /**
   * Get audit logs for specific receipt
   */
  async getReceiptAuditLogs(receiptId: string) {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select(`
          *,
          user:users(id, full_name, email, role)
        `)
        .eq('table_name', 'stock_receipts')
        .eq('record_id', receiptId)
        .order('timestamp', { ascending: false })

      if (error) throw error

      return data || []
    } catch (error: any) {
      console.error('Error fetching receipt audit logs:', error)
      toast.error(supabaseHelpers.formatError(error))
      throw error
    }
  }

  /**
   * Get user activity summary
   */
  async getUserActivitySummary(userId: string, days: number = 30) {
    try {
      const dateFrom = new Date()
      dateFrom.setDate(dateFrom.getDate() - days)

      const { data, error } = await supabase
        .from('audit_logs')
        .select('action, table_name, timestamp')
        .eq('user_id', userId)
        .gte('timestamp', dateFrom.toISOString())

      if (error) throw error

      // Group by action
      const summary = {
        total: data?.length || 0,
        byAction: {} as Record<string, number>,
        byTable: {} as Record<string, number>,
        recentDays: [] as Array<{ date: string; count: number }>,
      }

      data?.forEach(log => {
        summary.byAction[log.action] = (summary.byAction[log.action] || 0) + 1
        summary.byTable[log.table_name] = (summary.byTable[log.table_name] || 0) + 1
      })

      return summary
    } catch (error: any) {
      console.error('Error fetching user activity summary:', error)
      toast.error(supabaseHelpers.formatError(error))
      throw error
    }
  }

  /**
   * Create audit log entry
   */
  async createAuditLog(params: {
    action: string
    table_name: string
    record_id: string
    old_values?: Record<string, any>
    new_values?: Record<string, any>
    description?: string
  }) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await (supabase as any)
        .from('audit_logs')
        .insert({
          user_id: user.id,
          action: params.action,
          table_name: params.table_name,
          record_id: params.record_id,
          old_values: params.old_values || null,
          new_values: params.new_values || null,
          description: params.description || null,
          timestamp: new Date().toISOString()
        })

      if (error) throw error
    } catch (error: any) {
      console.error('Error creating audit log:', error)
      // Don't throw - audit logging failure shouldn't break the main operation
    }
  }

  /**
   * Format audit log message
   */
  formatAuditMessage(log: AuditLog): string {
    const action = log.action.toLowerCase()
    const table = log.table_name.replace('_', ' ')
    
    return `${action} ${table} record`
  }
}

export const auditService = new AuditService()
