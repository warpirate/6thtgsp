import React, { Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth/AuthProvider'
import { UserRole } from '@/types'

// Layout Components
import MainLayout from '@/components/layout/MainLayout'
import AuthLayout from '@/components/layout/AuthLayout'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ErrorBoundary from '@/components/ui/ErrorBoundary'

// Auth Pages
import LoginPage from '@/pages/auth/LoginPage'
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage'
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage'

// Main Pages
import DashboardPage from '@/pages/dashboard/DashboardPage'
import ReceiptsPage from '@/pages/receipts/ReceiptsPage'
import ReceiptDetailPage from '@/pages/receipts/ReceiptDetailPage'
import CreateReceiptPage from '@/pages/receipts/CreateReceiptPage'
import ApprovalsPage from '@/pages/approvals/ApprovalsPage'
import InventoryPage from '@/pages/inventory/InventoryPage'
import AuditLogsPage from '@/pages/audit/AuditLogsPage'
import DocumentsPage from '@/pages/documents/DocumentsPage'
import UsersPage from '@/pages/users/UsersPage'
import ProfilePage from '@/pages/profile/ProfilePage'
import SettingsPage from '@/pages/settings/SettingsPage'

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
  const { initializing } = useAuth()

  // Show loading spinner while initializing authentication
  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <ErrorBoundary>
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

                      {/* User Management */}
                      <Route path="/users" element={
                        <ProtectedRoute requiredRoles={[UserRole.SUPER_ADMIN]}>
                          <UsersPage />
                        </ProtectedRoute>
                      } />

                      {/* Profile & Settings */}
                      <Route path="/profile" element={<ProfilePage />} />
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
    </ErrorBoundary>
  )
}

export default App
