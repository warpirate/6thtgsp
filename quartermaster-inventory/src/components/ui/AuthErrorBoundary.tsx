import React, { Component, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, LogIn } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
  isAuthError: boolean
}

class AuthErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, isAuthError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    const isAuthError = AuthErrorBoundary.isAuthenticationError(error)
    return { hasError: true, error, isAuthError }
  }

  static isAuthenticationError(error: Error): boolean {
    const authErrorMessages = [
      'JWT expired',
      'Invalid JWT',
      'Authentication required',
      'Session expired',
      'Invalid login credentials',
      'User not authenticated',
      'Token refresh failed',
      'PGRST301', // PostgREST JWT error
    ]
    
    const errorMessage = error.message || error.toString()
    return authErrorMessages.some(msg => 
      errorMessage.toLowerCase().includes(msg.toLowerCase())
    )
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ error, errorInfo })
    
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('AuthErrorBoundary caught an error:', error, errorInfo)
    }
    
    // If it's an auth error, clear the session
    if (this.state.isAuthError) {
      console.log('Authentication error detected, clearing session')
      supabase.auth.signOut().catch(signOutError => {
        console.warn('Failed to sign out after auth error:', signOutError)
      })
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, isAuthError: false })
  }

  handleSignIn = () => {
    // Clear any existing session and redirect to login
    supabase.auth.signOut().then(() => {
      window.location.href = '/auth/login'
    }).catch(() => {
      // Force redirect even if signOut fails
      window.location.href = '/auth/login'
    })
  }

  override render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Authentication-specific error UI
      if (this.state.isAuthError) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-background px-4">
            <div className="max-w-md w-full bg-card rounded-lg border shadow-sm p-6 text-center">
              <div className="flex justify-center mb-4">
                <LogIn className="w-12 h-12 text-warning" />
              </div>
              
              <h1 className="text-2xl font-semibold text-foreground mb-2">
                Authentication Required
              </h1>
              
              <p className="text-muted-foreground mb-6">
                Your session has expired or is invalid. Please sign in again to continue.
              </p>

              <div className="flex flex-col gap-3 justify-center">
                <button
                  onClick={this.handleSignIn}
                  className="btn btn-primary flex items-center justify-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  Sign In
                </button>
                
                <button
                  onClick={this.handleReset}
                  className="btn btn-secondary flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )
      }

      // General error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
          <div className="max-w-md w-full bg-card rounded-lg border shadow-sm p-6 text-center">
            <div className="flex justify-center mb-4">
              <AlertTriangle className="w-12 h-12 text-error" />
            </div>
            
            <h1 className="text-2xl font-semibold text-foreground mb-2">
              Something went wrong
            </h1>
            
            <p className="text-muted-foreground mb-6">
              We're sorry, but something unexpected happened. Please try refreshing the page or contact support if the problem persists.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-4 text-left">
                <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
                  Error Details (Development)
                </summary>
                <pre className="mt-2 p-3 bg-muted rounded text-xs overflow-auto max-h-32">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="btn btn-primary flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
              
              <button
                onClick={() => window.location.reload()}
                className="btn btn-secondary flex items-center justify-center gap-2"
              >
                Refresh Page
              </button>
            </div>

            <div className="mt-6 pt-4 border-t text-xs text-muted-foreground">
              If this problem continues, please contact our support team with the error details above.
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default AuthErrorBoundary
