import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'

// Get environment variables (no fallbacks; must be provided)
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY

// Only log in development mode
if ((import.meta as any).env?.DEV) {
  console.log('🔧 Supabase Configuration Check:')
  console.log('URL:', supabaseUrl ? 'Set' : 'Missing')
  console.log('Key:', supabaseAnonKey ? `Set (${supabaseAnonKey.length} chars)` : 'Missing')
  console.log('Environment:', (import.meta as any).env?.MODE)
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables')
  console.log('Available env vars:', Object.keys((import.meta as any).env || {}))
  throw new Error('Missing Supabase environment variables')
}

// Create Supabase client with proper session storage
if ((import.meta as any).env?.DEV) {
  console.log('🚀 Creating Supabase client...')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storage: {
      getItem: (key: string) => {
        if (typeof window === 'undefined') return null
        try {
          return window.localStorage.getItem(key)
        } catch {
          return null
        }
      },
      setItem: (key: string, value: string) => {
        if (typeof window === 'undefined') return
        try {
          window.localStorage.setItem(key, value)
        } catch {
          // Ignore storage errors
        }
      },
      removeItem: (key: string) => {
        if (typeof window === 'undefined') return
        try {
          window.localStorage.removeItem(key)
        } catch {
          // Ignore storage errors
        }
      },
    },
    storageKey: 'sb-ehjudngdvilwvrukcxle-auth-token',
    debug: false,
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

if ((import.meta as any).env?.DEV) {
  console.log('✅ Supabase client created successfully')
}

// Global error handler for auth errors
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'TOKEN_REFRESHED') {
    console.log('Token refreshed successfully')
  } else if (event === 'SIGNED_OUT') {
    console.log('User signed out')
  } else if (event === 'USER_UPDATED') {
    console.log('User updated')
  }
})

// Storage bucket names
export const STORAGE_BUCKETS = {
  RECEIPT_DOCUMENTS: 'receipt-documents',
} as const

// Helper to ensure authenticated requests
export const ensureAuthenticated = async () => {
  try {
    // First check if we have a session in storage
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('Session error:', sessionError)
      throw new Error('Authentication error: ' + sessionError.message)
    }
    
    if (!session) {
      console.error('No active session found')
      throw new Error('No active session. Please log in again.')
    }
    
    // Validate the session is still valid with the server
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.error('Session validation failed:', userError)
      // Clear invalid session
      await supabase.auth.signOut()
      throw new Error('Session expired. Please log in again.')
    }
    
    return session
  } catch (error) {
    console.error('ensureAuthenticated failed:', error)
    throw error
  }
}

// Helper to recover from authentication errors
export const recoverFromAuthError = async (error: any): Promise<boolean> => {
  try {
    // First try to get current session
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      // No session to recover, sign out cleanly
      await supabase.auth.signOut()
      return false
    }
    
    // Session exists, try to refresh it
    const { error: refreshError } = await supabase.auth.refreshSession()
    
    if (refreshError) {
      // Refresh failed, sign out
      await supabase.auth.signOut()
      return false
    }
    
    return true
  } catch (recoveryError) {
    // Any error during recovery, sign out
    await supabase.auth.signOut()
    return false
  }
}

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

  // Test database connectivity and permissions
  testConnection: async () => {
    try {
      console.log('Testing database connection...')
      
      // Test basic connection
      const { data, error } = await supabase
        .from('users')
        .select('count', { count: 'exact', head: true })
      
      if (error) {
        console.error('Database connection test failed:', error)
        return { success: false, error: error.message }
      }
      
      console.log('Database connection successful')
      return { success: true, count: data }
    } catch (error: any) {
      console.error('Database connection test error:', error)
      return { success: false, error: error.message }
    }
  },

  // Create user profile if missing
  createUserProfile: async (authUser: any) => {
    try {
      console.log('Creating user profile for:', authUser.email)
      
      const { data, error } = await supabase
        .from('users')
        .insert({
          id: authUser.id,
          email: authUser.email,
          full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
          username: authUser.email?.split('@')[0] || 'user',
          password_hash: 'supabase_auth', // Placeholder since we use Supabase auth
          role: 'semi_user',
          is_active: true
        })
        .select()
        .single()
      
      if (error) {
        console.error('Failed to create user profile:', error)
        return { success: false, error: error.message }
      }
      
      console.log('User profile created successfully')
      return { success: true, profile: data }
    } catch (error: any) {
      console.error('Error creating user profile:', error)
      return { success: false, error: error.message }
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

  // Workflow helpers for corrected flow
  workflow: {
    // Check if user can approve requisitions (admin only)
    canApproveRequisition: async (requisitionId: string, userId: string): Promise<boolean> => {
      const { data, error } = await (supabase as any).rpc('can_approve_requisition', {
        requisition_uuid: requisitionId,
        user_uuid: userId
      })
      return data === true
    },

    // Check if user can issue items (watchman after admin approval)
    canIssueItems: async (requisitionId: string, userId: string): Promise<boolean> => {
      const { data, error } = await (supabase as any).rpc('can_issue_items', {
        requisition_uuid: requisitionId,
        user_uuid: userId
      })
      return data === true
    },

    // Validate status transition
    validateTransition: async (currentStatus: string, newStatus: string, userRole: string): Promise<boolean> => {
      const { data, error } = await (supabase as any).rpc('validate_requisition_transition', {
        current_status: currentStatus,
        new_status: newStatus,
        user_role: userRole
      })
      return data === true
    },

    // Get pending approvals (for admins)
    getPendingApprovals: async () => {
      return await (supabase as any).from('v_pending_approvals').select('*')
    },

    // Get items ready for issue (for watchmen)
    getReadyForIssue: async () => {
      return await (supabase as any).from('v_ready_for_issue').select('*')
    }
  }
}

export default supabase
