import React, { createContext, useContext, useEffect, useState } from 'react'
import { User as SupabaseUser, Session } from '@supabase/supabase-js'
import { supabase, supabaseHelpers } from '@/lib/supabase'
import { User, UserRoleName } from '@/types'
import { toast } from 'react-hot-toast'

interface AuthContextType {
  // Authentication state
  user: SupabaseUser | null
  userProfile: User | null
  session: Session | null
  role: UserRoleName | null
  roleName: UserRoleName | null
  
  // Loading states
  loading: boolean
  initializing: boolean
  
  // Authentication methods
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  signUp: (email: string, password: string, fullName: string) => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updatePassword: (newPassword: string) => Promise<void>
  
  // Profile methods
  updateProfile: (updates: Partial<User>) => Promise<void>
  refreshProfile: () => Promise<void>
  
  // Permission methods
  hasPermission: (permission: string) => boolean
  hasRole: (role: UserRoleName) => boolean
  canAccess: (requiredRoles?: UserRoleName[], requiredPermission?: string) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [userProfile, setUserProfile] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [role, setRole] = useState<UserRoleName | null>(null)
  const [roleName, setRoleName] = useState<UserRoleName | null>(null)
  const [loading, setLoading] = useState(false)
  const [initializing, setInitializing] = useState(true)

  // Load user profile and role information
  const loadUserProfile = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error loading user profile:', error)
        return
      }

      setUserProfile(profile)
      
      // Set role information from the user's role field
      if (profile.role) {
        setRole(profile.role as UserRoleName)
        setRoleName(profile.role as UserRoleName)
      }
    } catch (error) {
      console.error('Error in loadUserProfile:', error)
    }
  }

  // Initialize auth state
  useEffect(() => {
    let mounted = true

    const initAuth = async () => {
      try {
        // Get initial session
        const { data: { session: initialSession }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting initial session:', error)
        } else if (initialSession && mounted) {
          setSession(initialSession)
          setUser(initialSession.user)
          await loadUserProfile(initialSession.user.id)
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
      } finally {
        if (mounted) {
          setInitializing(false)
        }
      }
    }

    initAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return

        console.log('Auth state changed:', event, session?.user?.email)

        setSession(session)
        setUser(session?.user || null)

        if (session?.user) {
          await loadUserProfile(session.user.id)
        } else {
          setUserProfile(null)
          setRole(null)
          setRoleName(null)
        }

        setInitializing(false)
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password,
      })

      if (error) {
        throw error
      }

      if (data.user && !data.user.email_confirmed_at) {
        toast.error('Please check your email and confirm your account before signing in.')
        await signOut()
        return
      }

      toast.success('Welcome back!')
    } catch (error: any) {
      console.error('Sign in error:', error)
      let message = 'Failed to sign in'
      
      if (error.message?.includes('Invalid login credentials')) {
        message = 'Invalid email or password'
      } else if (error.message?.includes('Email not confirmed')) {
        message = 'Please confirm your email address'
      } else if (error.message) {
        message = error.message
      }
      
      toast.error(message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  // Sign out
  const signOut = async () => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      // Clear all state
      setUser(null)
      setUserProfile(null)
      setSession(null)
      setRole(null)
      setRoleName(null)
      
      toast.success('Signed out successfully')
    } catch (error: any) {
      console.error('Sign out error:', error)
      toast.error('Failed to sign out')
      throw error
    } finally {
      setLoading(false)
    }
  }

  // Sign up with email and password
  const signUp = async (email: string, password: string, fullName: string) => {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.toLowerCase().trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
        },
      })

      if (error) throw error

      if (data.user && !data.user.email_confirmed_at) {
        toast.success('Please check your email and click the confirmation link to activate your account.')
      } else {
        toast.success('Account created successfully!')
      }
    } catch (error: any) {
      console.error('Sign up error:', error)
      let message = 'Failed to create account'
      
      if (error.message?.includes('already registered')) {
        message = 'An account with this email already exists'
      } else if (error.message) {
        message = error.message
      }
      
      toast.error(message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  // Reset password
  const resetPassword = async (email: string) => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.toLowerCase().trim(),
        {
          redirectTo: `${window.location.origin}/auth/reset-password`,
        }
      )

      if (error) throw error
      toast.success('Password reset email sent!')
    } catch (error: any) {
      console.error('Reset password error:', error)
      toast.error(error.message || 'Failed to send reset email')
      throw error
    } finally {
      setLoading(false)
    }
  }

  // Update password
  const updatePassword = async (newPassword: string) => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) throw error
      toast.success('Password updated successfully!')
    } catch (error: any) {
      console.error('Update password error:', error)
      toast.error(error.message || 'Failed to update password')
      throw error
    } finally {
      setLoading(false)
    }
  }

  // Update user profile
  const updateProfile = async (updates: Partial<User>) => {
    if (!user) throw new Error('No user logged in')

    setLoading(true)
    try {
      // Update auth user metadata if needed
      if (updates.full_name) {
        const { error: authError } = await supabase.auth.updateUser({
          data: { full_name: updates.full_name }
        })
        if (authError) throw authError
      }

      // Update user profile in database
      const { data, error } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select()
        .single()

      if (error) throw error

      // Refresh profile data
      await refreshProfile()
      toast.success('Profile updated successfully!')
    } catch (error: any) {
      console.error('Update profile error:', error)
      toast.error(error.message || 'Failed to update profile')
      throw error
    } finally {
      setLoading(false)
    }
  }

  // Refresh user profile
  const refreshProfile = async () => {
    if (!user) return
    await loadUserProfile(user.id)
  }

  // Check if user has specific permission
  const hasPermission = (permission: string): boolean => {
    if (!role) return false
    
    // Permission mapping based on roles
    const rolePermissions: Record<string, string[]> = {
      'semi_user': ['create_receipt', 'edit_own_draft'],
      'user': ['create_receipt', 'edit_own_draft', 'verify_receipt'],
      'admin': ['create_receipt', 'edit_own_draft', 'verify_receipt', 'approve_receipt', 'view_reports'],
      'super_admin': ['all']
    }
    
    const userPermissions = rolePermissions[role] || []
    return userPermissions.includes('all') || userPermissions.includes(permission)
  }

  // Check if user has specific role
  const hasRole = (checkRole: UserRoleName): boolean => {
    return roleName === checkRole
  }

  // Check if user can access resource
  const canAccess = (
    requiredRoles?: UserRoleName[],
    requiredPermission?: string
  ): boolean => {
    // If no requirements specified, allow access
    if (!requiredRoles && !requiredPermission) return true
    
    // Check role requirement
    if (requiredRoles && roleName) {
      const hasRequiredRole = requiredRoles.includes(roleName)
      if (!hasRequiredRole) return false
    }
    
    // Check permission requirement
    if (requiredPermission) {
      return hasPermission(requiredPermission)
    }
    
    return true
  }

  const contextValue: AuthContextType = {
    // State
    user,
    userProfile,
    session,
    role,
    roleName,
    loading,
    initializing,
    
    // Methods
    signIn,
    signOut,
    signUp,
    resetPassword,
    updatePassword,
    updateProfile,
    refreshProfile,
    hasPermission,
    hasRole,
    canAccess,
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthProvider
