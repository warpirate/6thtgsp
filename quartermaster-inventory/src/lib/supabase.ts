import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'

// Get environment variables (no fallbacks; must be provided)
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Create Supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'X-Client-Info': 'quartermaster-inventory@1.0.0',
    },
  },
})

// Storage bucket names
export const STORAGE_BUCKETS = {
  RECEIPT_DOCUMENTS: 'receipt-documents',
} as const

// Helper functions for common operations
export const supabaseHelpers = {
  // Get current user session
  getCurrentSession: async () => {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) throw error
    return session
  },

  // Get current user with role information
  getCurrentUser: async () => {
    const session = await supabaseHelpers.getCurrentSession()
    if (!session?.user) return null

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single()

    if (error) throw error
    return data
  },

  // Check if user has permission
  hasPermission: async (permission: string) => {
    const user = await supabaseHelpers.getCurrentUser()
    if (!user?.role) return false

    const rolePermissions: Record<string, string[]> = {
      'semi_user': ['create_receipt', 'edit_own_draft'],
      'user': ['create_receipt', 'edit_own_draft', 'verify_receipt'],
      'admin': ['create_receipt', 'edit_own_draft', 'verify_receipt', 'approve_receipt', 'view_reports'],
      'super_admin': ['all'],
    }

    const permissions = rolePermissions[user.role] || []
    return permissions.includes('all') || permissions.includes(permission)
  },

  // Get user role name
  getUserRole: async () => {
    const user = await supabaseHelpers.getCurrentUser()
    return user?.role || null
  },

  // Upload file to storage
  uploadFile: async (
    bucket: string,
    path: string,
    file: File,
    options?: { upsert?: boolean }
  ) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: options?.upsert || false,
      })

    if (error) throw error
    return data
  },

  // Get file URL from storage
  getFileUrl: (bucket: string, path: string) => {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path)

    return data.publicUrl
  },

  // Delete file from storage
  deleteFile: async (bucket: string, path: string) => {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path])

    if (error) throw error
    return true
  },

  // Execute RPC function
  rpc: async <T = any>(
    functionName: string,
    params?: Record<string, any>
  ): Promise<T> => {
    const { data, error } = await (supabase as any).rpc(functionName, params)
    if (error) throw error
    return data
  },

  // Batch operations with transaction-like behavior
  batch: async (operations: (() => Promise<any>)[]) => {
    const results = []
    for (const operation of operations) {
      try {
        const result = await operation()
        results.push(result)
      } catch (error) {
        // If any operation fails, we might want to handle rollback
        throw error
      }
    }
    return results
  },

  // Subscribe to real-time changes
  subscribe: <T = any>(
    table: string,
    callback: (payload: T) => void,
    filters?: Record<string, any>
  ) => {
    const client = supabase as any
    let channel = client
      .channel(`${table}-changes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          ...filters,
        },
        callback
      )

    channel.subscribe()
    return channel
  },

  // Unsubscribe from channel
  unsubscribe: (channel: any) => {
    return supabase.removeChannel(channel)
  },

  // Format error messages
  formatError: (error: any): string => {
    if (typeof error === 'string') return error
    if (error?.message) return error.message
    if (error?.error_description) return error.error_description
    return 'An unexpected error occurred'
  },

  // Check database connection
  ping: async () => {
    try {
      const { error } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true })

      return !error
    } catch {
      return false
    }
  },
}

// Error handling wrapper
export const withErrorHandling = <T extends any[], R>(
  fn: (...args: T) => Promise<R>
) => {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args)
    } catch (error) {
      console.error('Supabase operation failed:', error)
      throw error
    }
  }
}

// Query builder helpers
export const queryBuilder = {
  // Build select query with joins
  selectWithJoins: (
    table: string,
    columns: string,
    joins?: Array<{
      table: string
      on: string
      type?: 'inner' | 'left' | 'right'
    }>
  ) => {
    let query = (supabase as any).from(table).select(columns)
    
    // Note: Supabase uses embedded resources instead of traditional joins
    // This is a conceptual helper - actual implementation depends on table structure
    return query
  },

  // Build filter conditions
  applyFilters: (
    query: any,
    filters: Record<string, any>
  ) => {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          query = query.in(key, value)
        } else if (typeof value === 'string' && value.includes('%')) {
          query = query.like(key, value)
        } else {
          query = query.eq(key, value)
        }
      }
    })
    return query
  },

  // Apply pagination
  applyPagination: (
    query: any,
    page: number = 1,
    limit: number = 10
  ) => {
    const offset = (page - 1) * limit
    return query.range(offset, offset + limit - 1)
  },

  // Apply sorting
  applySorting: (
    query: any,
    sortBy?: string,
    sortOrder: 'asc' | 'desc' = 'desc'
  ) => {
    if (sortBy) {
      return query.order(sortBy, { ascending: sortOrder === 'asc' })
    }
    return query.order('created_at', { ascending: false })
  },
}

export default supabase
