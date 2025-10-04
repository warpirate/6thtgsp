import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  Package, 
  LayoutDashboard, 
  Receipt, 
  CheckCircle, 
  BarChart3, 
  FileText, 
  Users, 
  Settings,
  Folder,
  ChevronLeft,
  ChevronRight,
  type LucideIcon
} from 'lucide-react'
import { useAuth } from '@/lib/auth/AuthProvider'
import { UserRole } from '@/types'
import { cn } from '@/utils/cn'

interface SidebarProps {
  open: boolean
  collapsed: boolean
  onClose: () => void
  onToggle: () => void
}

interface NavItem {
  name: string
  href: string
  icon: LucideIcon
  requiredRoles?: UserRole[]
  requiredPermission?: string
  badge?: string | number
}

const Sidebar: React.FC<SidebarProps> = ({ open, collapsed, onClose, onToggle }) => {
  const location = useLocation()
  const { userProfile, roleName, hasPermission, canAccess } = useAuth()

  const navigation: NavItem[] = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      name: 'Stock Receipts',
      href: '/receipts',
      icon: Receipt,
    },
    {
      name: 'Approvals',
      href: '/approvals',
      icon: CheckCircle,
      requiredRoles: [UserRole.USER, UserRole.ADMIN, UserRole.SUPER_ADMIN],
    },
    {
      name: 'Inventory & Reports',
      href: '/inventory',
      icon: BarChart3,
      requiredPermission: 'view_reports',
    },
    {
      name: 'Documents',
      href: '/documents',
      icon: Folder,
    },
    {
      name: 'Audit Logs',
      href: '/audit',
      icon: FileText,
      requiredRoles: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
    },
    {
      name: 'User Management',
      href: '/users',
      icon: Users,
      requiredRoles: [UserRole.SUPER_ADMIN],
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: Settings,
    },
  ]

  const filteredNavigation = navigation.filter(item => 
    canAccess(item.requiredRoles, item.requiredPermission)
  )

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/'
    }
    return location.pathname.startsWith(href)
  }

  return (
    <>
      <div className={cn(
        'fixed inset-y-0 left-0 z-40 flex flex-col bg-card border-r border-border transition-all duration-200 ease-in-out',
        collapsed ? 'w-16' : 'w-64',
        open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          {!collapsed && (
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Package className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="font-bold text-foreground">Quarter Master</h1>
                <p className="text-xs text-muted-foreground">Inventory System</p>
              </div>
            </div>
          )}
          
          {collapsed && (
            <div className="p-2 bg-primary/10 rounded-lg mx-auto">
              <Package className="w-6 h-6 text-primary" />
            </div>
          )}

          {/* Desktop toggle button */}
          <button
            onClick={onToggle}
            className="hidden lg:flex p-1 rounded-md hover:bg-muted transition-colors"
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* User Info */}
        {!collapsed && userProfile && (
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                {userProfile.full_name?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {userProfile.full_name}
                </p>
                <p className="text-xs text-muted-foreground capitalize">
                  {roleName?.replace('_', ' ')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
          {filteredNavigation.map((item) => {
            const active = isActive(item.href)
            const Icon = item.icon

            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  'hover:bg-accent hover:text-accent-foreground',
                  active 
                    ? 'bg-primary text-primary-foreground shadow-sm' 
                    : 'text-muted-foreground',
                  collapsed && 'justify-center'
                )}
                title={collapsed ? item.name : undefined}
              >
                <Icon className={cn('flex-shrink-0', collapsed ? 'w-5 h-5' : 'w-4 h-4')} />
                {!collapsed && (
                  <>
                    <span className="truncate">{item.name}</span>
                    {item.badge && (
                      <span className="ml-auto bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        {!collapsed && (
          <div className="p-4 border-t border-border">
            <div className="text-xs text-muted-foreground text-center">
              <p>Quarter Master v1.0.0</p>
              <p>© 2024 All rights reserved</p>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default Sidebar
