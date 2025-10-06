import React, { Suspense, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth/AuthProvider'
import { UserRole } from '@/types'
import { authDebug } from '@/lib/auth/authDebug'
import { supabaseHelpers } from '@/lib/supabase'
import { debugUtils } from '@/lib/debug'

// Layout Components
import MainLayout from '@/components/layout/MainLayout'
import AuthLayout from '@/components/layout/AuthLayout'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ErrorBoundary from '@/components/ui/ErrorBoundary'
import AuthErrorBoundary from '@/components/ui/AuthErrorBoundary'

// Auth Pages
import LoginPage from '@/pages/auth/LoginPage'
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage'
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage'

// Other Pages
import DashboardPage from '@/pages/dashboard/DashboardPage'
import CatalogPage from '@/pages/catalog/CatalogPage'
import RequisitionsPage from '@/pages/requisitions/RequisitionsPage'
import RequisitionDetailPage from '@/pages/requisitions/RequisitionDetailPage'
import CreateRequisitionPage from '@/pages/requisitions/CreateRequisitionPage'
import ReceiptsPage from '@/pages/receipts/ReceiptsPage'
import ReceiptDetailPage from '@/pages/receipts/ReceiptDetailPage'
import CreateReceiptPage from '@/pages/receipts/CreateReceiptPage'
import IssuancePage from '@/pages/issuance/IssuancePage'
import ApprovalsPage from '@/pages/approvals/ApprovalsPage'
import InventoryPage from '@/pages/inventory/InventoryPage'
import DocumentsPage from '@/pages/documents/DocumentsPage'
import AuditLogsPage from '@/pages/audit/AuditLogsPage'
import SettingsPage from '@/pages/settings/SettingsPage'
import ReturnsPage from '@/pages/returns/ReturnsPage'
import UsersPage from '@/pages/users/UsersPage'

// Error Pages
import NotFoundPage from '@/pages/errors/NotFoundPage'
import UnauthorizedPage from '@/pages/errors/UnauthorizedPage'
import ServerErrorPage from '@/pages/errors/ServerErrorPage'

// Route Protection Component
interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRoles?: UserRole[]
  requiredPermission?: string
  fallback?: React.ReactNode
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRoles,
  requiredPermission,
  fallback = <UnauthorizedPage />
}) => {
  const { user, canAccess, initializing } = useAuth()

  if (initializing) {
    return <LoadingSpinner />
  }

  if (!user) {
    return <Navigate to="/auth/login" replace />
  }

  if (!canAccess(requiredRoles, requiredPermission)) {
    return fallback
  }

  return <>{children}</>
}

// Public Route Component (only accessible when not authenticated)
interface PublicRouteProps {
  children: React.ReactNode
}

const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { user, initializing } = useAuth()

  if (initializing) {
    return <LoadingSpinner />
  }

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

const App: React.FC = () => {
  const { initializing, user } = useAuth()
  const [forceReady, setForceReady] = React.useState(false)
  
  // Force app to be ready after 3 seconds if still initializing
  React.useEffect(() => {
    const timeout = setTimeout(() => {
      if (initializing) {
        setForceReady(true)
      }
    }, 3000)
    
    return () => clearTimeout(timeout)
  }, [initializing])

  // Debug authentication and database on mount (development only)
  useEffect(() => {
    // Clear any corrupted auth tokens on app start
    if (typeof window !== 'undefined') {
      const authKeys = Object.keys(localStorage).filter(key => 
        key.includes('auth') || key.includes('supabase') || key.includes('sb-')
      )
      // Only clear if there are auth errors (not on every load)
      const hasAuthErrors = authKeys.some(key => {
        try {
          const value = localStorage.getItem(key)
          return value && (value.includes('error') || value.includes('invalid'))
        } catch {
          return true
        }
      })
      
      if (hasAuthErrors) {
        authKeys.forEach(key => localStorage.removeItem(key))
      }
    }
    
    // Filter out Chrome extension errors globally
    const originalError = console.error
    console.error = (...args) => {
      const message = args.join(' ')
      if (message.includes('chrome-extension://') || 
          message.includes('net::ERR_FAILED') ||
          message.includes('Denying load of')) {
        return // Ignore Chrome extension errors
      }
      originalError.apply(console, args)
    }
    
    // Skip diagnostics for now to avoid blocking
    if ((import.meta as any).env?.DEV) {
      console.log('🔍 App initialized')
    }
  }, [])

  // Show loading spinner while initializing authentication
  if (initializing && !forceReady) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F8FAFC' }}>
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  console.log('App: Auth initialized, user:', user?.email || 'none')

  return (
    <ErrorBoundary>
      <AuthErrorBoundary>
        <div className="min-h-screen bg-background">
          <Suspense 
            fallback={
              <div className="min-h-screen flex items-center justify-center">
                <LoadingSpinner size="lg" />
              </div>
            }
          >
            <Routes>
            {/* Authentication Routes */}
            <Route
              path="/auth/*"
              element={
                <PublicRoute>
                  <AuthLayout>
                    <Routes>
                      <Route path="login" element={<LoginPage />} />
                      <Route path="forgot-password" element={<ForgotPasswordPage />} />
                      <Route path="reset-password" element={<ResetPasswordPage />} />
                      <Route path="*" element={<Navigate to="/auth/login" replace />} />
                    </Routes>
                  </AuthLayout>
                </PublicRoute>
              }
            />

            {/* Main Application Routes */}
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <Routes>
                      {/* Dashboard */}
                      <Route path="/" element={<Navigate to="/dashboard" replace />} />
                      <Route path="/dashboard" element={<DashboardPage />} />

                      {/* Stock Receipts */}
                      <Route path="/receipts" element={<ReceiptsPage />} />
                      <Route path="/receipts/create" element={
                        <ProtectedRoute requiredPermission="create_receipt">
                          <CreateReceiptPage />
                        </ProtectedRoute>
                      } />
                      <Route path="/receipts/:id" element={<ReceiptDetailPage />} />

                      {/* Approvals */}
                      <Route path="/approvals" element={
                        <ProtectedRoute 
                          requiredRoles={[UserRole.USER, UserRole.ADMIN, UserRole.SUPER_ADMIN]}
                        >
                          <ApprovalsPage />
                        </ProtectedRoute>
                      } />

                      {/* Inventory & Reports */}
                      <Route path="/inventory" element={
                        <ProtectedRoute requiredPermission="view_reports">
                          <InventoryPage />
                        </ProtectedRoute>
                      } />

                      {/* Audit Logs */}
                      <Route path="/audit" element={
                        <ProtectedRoute 
                          requiredRoles={[UserRole.ADMIN, UserRole.SUPER_ADMIN]}
                        >
                          <AuditLogsPage />
                        </ProtectedRoute>
                      } />

                      {/* Documents */}
                      <Route path="/documents" element={<DocumentsPage />} />

                      {/* Catalog & Requisitions */}
                      <Route path="/catalog" element={<CatalogPage />} />
                      <Route path="/requisitions" element={<RequisitionsPage />} />
                      <Route path="/requisitions/create" element={<CreateRequisitionPage />} />
                      <Route path="/requisitions/:id" element={<RequisitionDetailPage />} />

                      {/* Issuance (Store Keeper) */}
                      <Route path="/issuance" element={
                        <ProtectedRoute requiredPermission="issue_items">
                          <IssuancePage />
                        </ProtectedRoute>
                      } />

                      {/* Returns */}
                      <Route path="/returns" element={<ReturnsPage />} />

                      {/* User Management (Super Admin Only) */}
                      <Route path="/users" element={
                        <ProtectedRoute 
                          requiredRoles={[UserRole.SUPER_ADMIN]}
                          requiredPermission="manage_users"
                        >
                          <UsersPage />
                        </ProtectedRoute>
                      } />

                      {/* Profile & Settings */}
                      <Route path="/profile" element={<SettingsPage />} />
                      <Route path="/settings" element={<SettingsPage />} />

                      {/* Error Pages */}
                      <Route path="/unauthorized" element={<UnauthorizedPage />} />
                      <Route path="/server-error" element={<ServerErrorPage />} />
                      <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                  </MainLayout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </Suspense>
      </div>
      </AuthErrorBoundary>
    </ErrorBoundary>
  )
}

export default App
