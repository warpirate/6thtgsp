import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  Menu, 
  Bell, 
  User, 
  Settings, 
  LogOut,
  Search,
  Plus,
  ChevronDown
} from 'lucide-react'
import { useAuth } from '@/lib/auth/AuthProvider'
import { cn } from '@/utils/cn'

interface HeaderProps {
  onMenuClick: () => void
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const location = useLocation()
  const { userProfile, signOut, hasPermission, user } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)

  // Debug logging
  React.useEffect(() => {
    console.log('Header - userProfile:', userProfile)
    console.log('Header - auth user:', user?.email)
  }, [userProfile, user])

  // Generate breadcrumbs from current path
  const generateBreadcrumbs = () => {
    const pathSegments = location.pathname.split('/').filter(Boolean)
    const breadcrumbs = [{ name: 'Dashboard', href: '/dashboard' }]

    if (pathSegments.length > 0 && pathSegments[0] !== 'dashboard') {
      const pathMap: Record<string, string> = {
        receipts: 'Stock Receipts',
        approvals: 'Approvals',
        inventory: 'Inventory & Reports',
        documents: 'Documents',
        audit: 'Audit Logs',
        users: 'User Management',
        profile: 'Profile',
        settings: 'Settings',
      }

      const currentPage = pathMap[pathSegments[0]] || pathSegments[0]
      breadcrumbs.push({
        name: currentPage,
        href: `/${pathSegments[0]}`,
      })

      // Add sub-pages if they exist
      if (pathSegments.length > 1) {
        const subPage = pathSegments[1]
        if (subPage === 'create') {
          breadcrumbs.push({
            name: 'Create New',
            href: `/${pathSegments[0]}/${subPage}`,
          })
        } else if (subPage !== 'create') {
          breadcrumbs.push({
            name: `#${subPage.slice(0, 8)}`,
            href: `/${pathSegments[0]}/${subPage}`,
          })
        }
      }
    }

    return breadcrumbs
  }

  const breadcrumbs = generateBreadcrumbs()

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  return (
    <header className="sticky top-0 z-30 bg-card border-b border-border shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 lg:px-6">
        {/* Left side */}
        <div className="flex items-center gap-4">
          {/* Mobile menu button */}
          <button
            onClick={onMenuClick}
            className="p-2 rounded-md hover:bg-muted transition-colors lg:hidden"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Breadcrumbs */}
          <nav className="flex items-center space-x-1 text-sm">
            {breadcrumbs.map((crumb, index) => (
              <div key={crumb.href} className="flex items-center">
                {index > 0 && (
                  <span className="mx-2 text-muted-foreground">/</span>
                )}
                <Link
                  to={crumb.href}
                  className={cn(
                    'hover:text-primary transition-colors',
                    index === breadcrumbs.length - 1
                      ? 'text-foreground font-medium'
                      : 'text-muted-foreground'
                  )}
                >
                  {crumb.name}
                </Link>
              </div>
            ))}
          </nav>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Search (hidden on mobile) */}
          <div className="hidden md:block">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-muted-foreground" />
              </div>
              <input
                type="text"
                placeholder="Search receipts..."
                className="input pl-10 w-64 bg-muted/50 border-0 focus:ring-1 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Quick Actions */}
          {hasPermission('create_receipt') && (
            <Link
              to="/receipts/create"
              className="btn btn-primary btn-sm flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Receipt</span>
            </Link>
          )}

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-md hover:bg-muted transition-colors relative"
            >
              <Bell className="w-5 h-5" />
              {/* Notification badge */}
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-error text-white text-xs rounded-full flex items-center justify-center">
                3
              </span>
            </button>

            {/* Notifications dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-lg shadow-lg z-50">
                <div className="p-4 border-b border-border">
                  <h3 className="font-semibold text-foreground">Notifications</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {/* Sample notifications */}
                  <div className="p-4 border-b border-border hover:bg-muted/50">
                    <p className="text-sm font-medium text-foreground">
                      New receipt submitted for verification
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      REC-2024-001234 • 2 minutes ago
                    </p>
                  </div>
                  <div className="p-4 border-b border-border hover:bg-muted/50">
                    <p className="text-sm font-medium text-foreground">
                      Receipt approved successfully
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      REC-2024-001233 • 1 hour ago
                    </p>
                  </div>
                  <div className="p-4 hover:bg-muted/50">
                    <p className="text-sm font-medium text-foreground">
                      System maintenance scheduled
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Tomorrow 2:00 AM - 4:00 AM
                    </p>
                  </div>
                </div>
                <div className="p-3 border-t border-border">
                  <button className="text-sm text-primary hover:text-primary/80 font-medium">
                    View all notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-2 rounded-md hover:bg-muted transition-colors"
            >
              <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                {userProfile?.full_name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-foreground">
                  {userProfile?.full_name || 'User'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {userProfile?.email}
                </p>
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </button>

            {/* User dropdown menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-lg shadow-lg z-50">
                <div className="p-3 border-b border-border">
                  <p className="font-medium text-foreground">
                    {userProfile?.full_name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {userProfile?.email}
                  </p>
                </div>
                
                <div className="py-2">
                  <Link
                    to="/profile"
                    className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-muted transition-colors"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <User className="w-4 h-4" />
                    Profile
                  </Link>
                  
                  <Link
                    to="/settings"
                    className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-muted transition-colors"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </Link>
                </div>

                <div className="border-t border-border py-2">
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-3 px-4 py-2 text-sm text-error hover:bg-error/10 transition-colors w-full text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Click outside to close dropdowns */}
      {(showUserMenu || showNotifications) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowUserMenu(false)
            setShowNotifications(false)
          }}
        />
      )}
    </header>
  )
}

export default Header
