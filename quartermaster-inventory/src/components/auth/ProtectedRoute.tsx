import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/lib/auth/AuthProvider'
import { UserRole } from '@/types'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRoles?: UserRole[]
  requiredPermission?: string
  fallbackPath?: string
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRoles,
  requiredPermission,
  fallbackPath = '/unauthorized'
}) => {
  const { user, loading, initializing, canAccess } = useAuth()
  const location = useLocation()

  if (loading || initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />
  }

  if (!canAccess(requiredRoles, requiredPermission)) {
    return <Navigate to={fallbackPath} replace />
  }

  return <>{children}</>
}

export default ProtectedRoute
