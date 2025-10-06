import { supabase, supabaseHelpers } from './supabase'

/**
 * Debug utilities for troubleshooting API issues
 */
export const debugUtils = {
  /**
   * Test all critical database operations
   */
  runDiagnostics: async () => {
    // Filter out chrome extension errors from console
    const originalError = console.error
    console.error = (...args) => {
      const message = args.join(' ')
      if (!message.includes('chrome-extension://') && !message.includes('net::ERR_FAILED')) {
        originalError.apply(console, args)
      }
    }
    
    console.group('🔍 Running System Diagnostics')
    
    const results = {
      connection: false,
      auth: false,
      userTable: false,
      userCreation: false,
      errors: [] as string[]
    }
    
    try {
      // Test 1: Basic connection
      console.log('1. Testing database connection...')
      const connectionTest = await supabaseHelpers.testConnection()
      results.connection = connectionTest.success
      if (!connectionTest.success) {
        results.errors.push(`Connection failed: ${connectionTest.error}`)
      } else {
        console.log('✅ Database connection successful')
      }
      
      // Test 1.5: Simple query test
      console.log('1.5. Testing simple query...')
      try {
        const { data, error } = await supabase
          .from('users')
          .select('count', { count: 'exact', head: true })
        
        if (error) {
          console.error('❌ Simple query failed:', error)
          results.errors.push(`Simple query failed: ${error.message}`)
        } else {
          console.log('✅ Simple query successful, user count:', data)
        }
      } catch (queryError: any) {
        console.error('❌ Query test error:', queryError)
        results.errors.push(`Query test error: ${queryError.message}`)
      }
      
      // Test 2: Auth status
      console.log('2. Testing authentication...')
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) {
        results.errors.push(`Auth session error: ${sessionError.message}`)
      } else if (session) {
        results.auth = true
        console.log('✅ User is authenticated:', session.user.email)
        
        // Test 3: User table access
        console.log('3. Testing user table access...')
        const { data: userProfile, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()
        
        if (userError) {
          console.error('User query error details:', {
            code: userError.code,
            message: userError.message,
            details: userError.details,
            hint: userError.hint
          })
          
          if (userError.code === 'PGRST116') {
            console.log('⚠️ User profile not found, testing creation...')
            
            // Test 4: User creation
            const createResult = await supabaseHelpers.createUserProfile(session.user)
            results.userCreation = createResult.success
            if (!createResult.success) {
              results.errors.push(`User creation failed: ${createResult.error}`)
            } else {
              console.log('✅ User profile created successfully')
              results.userTable = true
            }
          } else {
            results.errors.push(`User table error: ${userError.code} - ${userError.message}`)
          }
        } else {
          results.userTable = true
          console.log('✅ User profile found:', userProfile?.email)
        }
      } else {
        console.log('ℹ️ No active session')
      }
      
    } catch (error: any) {
      results.errors.push(`Unexpected error: ${error.message}`)
      console.error('❌ Diagnostic error:', error)
    }
    
    console.log('📊 Diagnostic Results:', results)
    console.groupEnd()
    
    return results
  },
  
  /**
   * Test specific table access
   */
  testTableAccess: async (tableName: string) => {
    try {
      console.log(`Testing access to ${tableName} table...`)
      
      const { data, error } = await (supabase as any)
        .from(tableName)
        .select('*', { count: 'exact', head: true })
      
      if (error) {
        console.error(`❌ ${tableName} table error:`, error)
        return { success: false, error: error.message }
      }
      
      console.log(`✅ ${tableName} table accessible`)
      return { success: true, count: data }
    } catch (error: any) {
      console.error(`❌ ${tableName} table test failed:`, error)
      return { success: false, error: error.message }
    }
  },
  
  /**
   * Check environment configuration
   */
  checkEnvironment: () => {
    console.group('🌍 Environment Check')
    
    const env = {
      supabaseUrl: !!(import.meta as any).env?.VITE_SUPABASE_URL,
      supabaseKey: !!(import.meta as any).env?.VITE_SUPABASE_ANON_KEY,
      isDev: !!(import.meta as any).env?.DEV,
      mode: (import.meta as any).env?.MODE
    }
    
    console.log('Environment variables:', env)
    
    if (!env.supabaseUrl || !env.supabaseKey) {
      console.error('❌ Missing required environment variables')
      return false
    }
    
    console.log('✅ Environment configuration looks good')
    console.groupEnd()
    return true
  }
}

// Expose to window for debugging
if (typeof window !== 'undefined') {
  (window as any).debugUtils = debugUtils
}
