import { supabase } from '@/lib/supabase'

/**
 * Authentication debugging utilities
 */
export const authDebug = {
  /**
   * Check current authentication status
   */
  checkAuthStatus: async () => {
    console.group('🔐 Authentication Status Check')
    
    try {
      // Check session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.error('❌ Session Error:', sessionError)
        return { authenticated: false, error: sessionError }
      }
      
      if (!session) {
        console.warn('⚠️ No active session found')
        return { authenticated: false, error: 'No session' }
      }
      
      console.log('✅ Session found:', {
        user: session.user.email,
        expiresAt: new Date(session.expires_at! * 1000).toLocaleString(),
        accessToken: session.access_token.substring(0, 20) + '...',
      })
      
      // Check user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError) {
        console.error('❌ User Error:', userError)
        return { authenticated: false, error: userError }
      }
      
      if (!user) {
        console.warn('⚠️ No user found')
        return { authenticated: false, error: 'No user' }
      }
      
      console.log('✅ User authenticated:', {
        id: user.id,
        email: user.email,
        emailConfirmed: !!user.email_confirmed_at,
      })
      
      // Check localStorage
      const storageKeys = Object.keys(localStorage).filter(key => 
        key.includes('auth') || key.includes('supabase')
      )
      console.log('📦 Auth-related localStorage keys:', storageKeys)
      
      console.groupEnd()
      return { authenticated: true, session, user }
    } catch (error) {
      console.error('❌ Unexpected error:', error)
      console.groupEnd()
      return { authenticated: false, error }
    }
  },
  
  /**
   * Clear all authentication data
   */
  clearAuthData: async () => {
    console.log('🧹 Clearing all authentication data...')
    
    // Sign out from Supabase
    await supabase.auth.signOut()
    
    // Clear localStorage
    const authKeys = Object.keys(localStorage).filter(key => 
      key.includes('auth') || key.includes('supabase')
    )
    authKeys.forEach(key => localStorage.removeItem(key))
    
    console.log('✅ Authentication data cleared')
  },
  
  /**
   * Test API call with current auth
   */
  testAuthenticatedCall: async () => {
    console.group('🧪 Testing Authenticated API Call')
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, full_name')
        .limit(1)
      
      if (error) {
        console.error('❌ API call failed:', error)
        console.groupEnd()
        return { success: false, error }
      }
      
      console.log('✅ API call successful:', data)
      console.groupEnd()
      return { success: true, data }
    } catch (error) {
      console.error('❌ Unexpected error:', error)
      console.groupEnd()
      return { success: false, error }
    }
  },
  
  /**
   * Monitor auth state changes
   */
  monitorAuthChanges: () => {
    console.log('👀 Monitoring auth state changes...')
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(`🔄 Auth event: ${event}`, {
        hasSession: !!session,
        user: session?.user?.email,
      })
    })
    
    return subscription
  },
}

// Expose to window for debugging in browser console
if (typeof window !== 'undefined') {
  (window as any).authDebug = authDebug
}
