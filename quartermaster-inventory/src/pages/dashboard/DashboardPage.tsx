import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Plus,
  TrendingUp,
  FileText,
  Users,
  type LucideIcon
} from 'lucide-react'
import { useAuth } from '@/lib/auth/AuthProvider'
import { UserRole } from '@/types'
import { supabase } from '@/lib/supabase'

const DashboardPage: React.FC = () => {
  const { user, userProfile, roleName, hasPermission } = useAuth()
  
  // Debug logging (development only) - only log once when data changes
  React.useEffect(() => {
    if ((import.meta as any).env?.DEV && user) {
      console.log('Dashboard - User:', user?.email)
      console.log('Dashboard - Profile:', userProfile?.full_name)
      console.log('Dashboard - Role:', roleName)
    }
  }, [user?.email, userProfile?.full_name, roleName])
  
  // Get display name with fallbacks
  const getDisplayName = () => {
    if (userProfile?.full_name) {
      return userProfile.full_name.split(' ')[0]
    }
    if (user?.email) {
      return user.email.split('@')[0]
    }
    return 'User'
  }

  // Real-time stats from database
  const [stats, setStats] = useState({
    totalReceipts: 0,
    pendingApprovals: 0,
    approvedToday: 0,
    rejectedToday: 0,
    myDrafts: 0,
    myPendingVerification: 0,
    totalUsers: 0,
    totalItems: 0,
    totalRequisitions: 0
  })
  
  const [recentActivities, setRecentActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Load dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true)
        
        // Get counts from existing tables only
        const [receiptsResult, usersResult, itemsResult] = await Promise.all([
          supabase.from('stock_receipts').select('*', { count: 'exact', head: true }),
          supabase.from('users').select('*', { count: 'exact', head: true }),
          supabase.from('items_master').select('*', { count: 'exact', head: true })
        ])
        
        setStats({
          totalReceipts: receiptsResult.count || 0,
          pendingApprovals: 0, // Will be calculated when we have data
          approvedToday: 0,
          rejectedToday: 0,
          myDrafts: 0,
          myPendingVerification: 0,
          totalUsers: usersResult.count || 0,
          totalItems: itemsResult.count || 0,
          totalRequisitions: 0 // No requisitions table yet
        })
        
        // For now, set empty activities since we have no data
        setRecentActivities([])
        
      } catch (error) {
        console.error('Error loading dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadDashboardData()
  }, [])

  // Dynamic pending tasks based on role and actual data
  const getPendingTasks = () => {
    const tasks = []
    
    if (hasPermission('manage_users')) {
      tasks.push({
        id: 'users',
        title: 'Manage Users',
        count: stats.totalUsers,
        href: '/users',
        icon: Users,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
      })
    }
    
    if (hasPermission('create_requisition')) {
      tasks.push({
        id: 'requisitions',
        title: 'Create Requisitions',
        count: stats.totalRequisitions,
        href: '/catalog',
        icon: Package,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
      })
    }
    
    if (hasPermission('create_receipt')) {
      tasks.push({
        id: 'receipts',
        title: 'Stock Receipts',
        count: stats.totalReceipts,
        href: '/receipts',
        icon: FileText,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
      })
    }
    
    return tasks
  }

  const QuickStatCard: React.FC<{
    title: string
    value: number
    icon: LucideIcon
    color: string
    bgColor: string
    href?: string
  }> = ({ title, value, icon: Icon, color, bgColor, href }) => {
    const content = (
      <div className={`${bgColor} rounded-lg p-6 transition-all hover:shadow-md`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold text-foreground">{value.toLocaleString()}</p>
          </div>
          <div className={`p-3 rounded-full ${bgColor.replace('50', '100')}`}>
            <Icon className={`w-6 h-6 ${color}`} />
          </div>
        </div>
      </div>
    )

    return href ? <Link to={href}>{content}</Link> : content
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Welcome back, {getDisplayName()}!
          </h1>
          <p className="mt-1 text-muted-foreground">
            Here's what's happening with your inventory today.
          </p>
        </div>
        
        {hasPermission('create_receipt') && (
          <Link
            to="/receipts/create"
            className="mt-4 sm:mt-0 btn btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Receipt
          </Link>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          // Loading skeleton
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-gray-50 rounded-lg p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))
        ) : (
          <>
            {roleName === UserRole.SUPER_ADMIN && (
              <>
                <QuickStatCard
                  title="Total Users"
                  value={stats.totalUsers}
                  icon={Users}
                  color="text-purple-600"
                  bgColor="bg-purple-50"
                  href="/users"
                />
                <QuickStatCard
                  title="Total Items"
                  value={stats.totalItems}
                  icon={Package}
                  color="text-blue-600"
                  bgColor="bg-blue-50"
                  href="/catalog"
                />
                <QuickStatCard
                  title="Total Receipts"
                  value={stats.totalReceipts}
                  icon={FileText}
                  color="text-green-600"
                  bgColor="bg-green-50"
                  href="/receipts"
                />
                <QuickStatCard
                  title="Total Requisitions"
                  value={stats.totalRequisitions}
                  icon={Clock}
                  color="text-yellow-600"
                  bgColor="bg-yellow-50"
                  href="/requisitions"
                />
              </>
            )}
            
            {roleName === UserRole.ADMIN && (
              <>
                <QuickStatCard
                  title="Total Receipts"
                  value={stats.totalReceipts}
                  icon={Package}
                  color="text-blue-600"
                  bgColor="bg-blue-50"
                  href="/receipts"
                />
                <QuickStatCard
                  title="Pending Approvals"
                  value={stats.pendingApprovals}
                  icon={Clock}
                  color="text-yellow-600"
                  bgColor="bg-yellow-50"
                  href="/approvals"
                />
                <QuickStatCard
                  title="Total Items"
                  value={stats.totalItems}
                  icon={FileText}
                  color="text-green-600"
                  bgColor="bg-green-50"
                  href="/catalog"
                />
                <QuickStatCard
                  title="Total Requisitions"
                  value={stats.totalRequisitions}
                  icon={TrendingUp}
                  color="text-indigo-600"
                  bgColor="bg-indigo-50"
                  href="/requisitions"
                />
              </>
            )}
            
            {(roleName === UserRole.USER || roleName === UserRole.SEMI_USER) && (
              <>
                <QuickStatCard
                  title="My Requisitions"
                  value={stats.totalRequisitions}
                  icon={FileText}
                  color="text-blue-600"
                  bgColor="bg-blue-50"
                  href="/requisitions"
                />
                <QuickStatCard
                  title="Available Items"
                  value={stats.totalItems}
                  icon={Package}
                  color="text-green-600"
                  bgColor="bg-green-50"
                  href="/catalog"
                />
              </>
            )}
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Tasks */}
        <div className="lg:col-span-1">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Pending Tasks</h3>
              <p className="card-description">
                Items requiring your attention
              </p>
            </div>
            <div className="card-content">
              <div className="space-y-3">
                {loading ? (
                  // Loading skeleton
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg border animate-pulse">
                      <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))
                ) : getPendingTasks().length > 0 ? (
                  getPendingTasks().map((task) => (
                    <Link
                      key={task.id}
                      to={task.href}
                      className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className={`p-2 rounded-full ${task.bgColor}`}>
                        <task.icon className={`w-4 h-4 ${task.color}`} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">
                          {task.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {task.count} items
                        </p>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${task.bgColor} ${task.color}`}>
                        {task.count}
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-sm">No pending tasks</p>
                    <p className="text-xs">All caught up!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Recent Activity</h3>
              <p className="card-description">
                Latest updates from your team
              </p>
            </div>
            <div className="card-content">
              <div className="space-y-4">
                {loading ? (
                  // Loading skeleton
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-start gap-3 animate-pulse">
                      <div className="w-2 h-2 bg-gray-200 rounded-full mt-2 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))
                ) : recentActivities.length > 0 ? (
                  recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground">
                          {activity.message}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-muted-foreground">
                            by {activity.user}
                          </p>
                          <span className="text-xs text-muted-foreground">•</span>
                          <p className="text-xs text-muted-foreground">
                            {activity.time}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-sm">No recent activity</p>
                    <p className="text-xs">Activity will appear here as you use the system</p>
                  </div>
                )}
              </div>
              {recentActivities.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <Link
                    to="/audit"
                    className="text-sm text-primary hover:text-primary/80 font-medium"
                  >
                    View all activity →
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          to="/receipts"
          className="p-4 border rounded-lg hover:bg-muted/50 transition-colors group"
        >
          <Package className="w-8 h-8 text-primary group-hover:scale-110 transition-transform" />
          <h3 className="mt-2 font-semibold text-foreground">View Receipts</h3>
          <p className="text-sm text-muted-foreground">
            Browse all stock receipts
          </p>
        </Link>

        {hasPermission('verify_receipt') && (
          <Link
            to="/approvals"
            className="p-4 border rounded-lg hover:bg-muted/50 transition-colors group"
          >
            <CheckCircle className="w-8 h-8 text-green-600 group-hover:scale-110 transition-transform" />
            <h3 className="mt-2 font-semibold text-foreground">Approvals</h3>
            <p className="text-sm text-muted-foreground">
              Review pending approvals
            </p>
          </Link>
        )}

        {hasPermission('view_reports') && (
          <Link
            to="/inventory"
            className="p-4 border rounded-lg hover:bg-muted/50 transition-colors group"
          >
            <TrendingUp className="w-8 h-8 text-blue-600 group-hover:scale-110 transition-transform" />
            <h3 className="mt-2 font-semibold text-foreground">Reports</h3>
            <p className="text-sm text-muted-foreground">
              View inventory analytics
            </p>
          </Link>
        )}

        {roleName === UserRole.SUPER_ADMIN && (
          <Link
            to="/users"
            className="p-4 border rounded-lg hover:bg-muted/50 transition-colors group"
          >
            <Users className="w-8 h-8 text-purple-600 group-hover:scale-110 transition-transform" />
            <h3 className="mt-2 font-semibold text-foreground">Users</h3>
            <p className="text-sm text-muted-foreground">
              Manage user accounts
            </p>
          </Link>
        )}
      </div>
    </div>
  )
}

export default DashboardPage
