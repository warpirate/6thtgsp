import React from 'react'
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

const DashboardPage: React.FC = () => {
  const { userProfile, roleName, hasPermission } = useAuth()

  // Mock data - in real app, this would come from API
  const stats = {
    totalReceipts: 1247,
    pendingApprovals: 23,
    approvedToday: 15,
    rejectedToday: 2,
    myDrafts: 3,
    myPendingVerification: 7,
  }

  const recentActivities = [
    {
      id: '1',
      type: 'approval',
      message: 'Receipt REC-2024-001234 was approved',
      time: '2 minutes ago',
      user: 'John Admin',
    },
    {
      id: '2',
      type: 'submission',
      message: 'New receipt REC-2024-001235 submitted for verification',
      time: '15 minutes ago',
      user: 'Jane User',
    },
    {
      id: '3',
      type: 'verification',
      message: 'Receipt REC-2024-001233 was verified',
      time: '1 hour ago',
      user: 'Mike Verifier',
    },
  ]

  const pendingTasks = [
    {
      id: '1',
      title: 'Verify submitted receipts',
      count: 5,
      href: '/approvals',
      icon: CheckCircle,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      id: '2',
      title: 'Review rejected receipts',
      count: 2,
      href: '/receipts?status=rejected',
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      id: '3',
      title: 'Complete draft receipts',
      count: 3,
      href: '/receipts?status=draft',
      icon: FileText,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
  ]

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
            Welcome back, {userProfile?.full_name?.split(' ')[0]}!
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
        {roleName === UserRole.SEMI_USER && (
          <>
            <QuickStatCard
              title="My Drafts"
              value={stats.myDrafts}
              icon={FileText}
              color="text-gray-600"
              bgColor="bg-gray-50"
              href="/receipts?status=draft&created_by=me"
            />
            <QuickStatCard
              title="Submitted Today"
              value={5}
              icon={TrendingUp}
              color="text-blue-600"
              bgColor="bg-blue-50"
            />
          </>
        )}

        {roleName === UserRole.USER && (
          <>
            <QuickStatCard
              title="Pending Verification"
              value={stats.myPendingVerification}
              icon={Clock}
              color="text-yellow-600"
              bgColor="bg-yellow-50"
              href="/approvals"
            />
            <QuickStatCard
              title="Verified Today"
              value={12}
              icon={CheckCircle}
              color="text-green-600"
              bgColor="bg-green-50"
            />
          </>
        )}

        {(roleName === UserRole.ADMIN || roleName === UserRole.SUPER_ADMIN) && (
          <>
            <QuickStatCard
              title="Total Receipts"
              value={stats.totalReceipts}
              icon={Package}
              color="text-blue-600"
              bgColor="bg-blue-50"
              href="/inventory"
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
              title="Approved Today"
              value={stats.approvedToday}
              icon={CheckCircle}
              color="text-green-600"
              bgColor="bg-green-50"
            />
            <QuickStatCard
              title="Rejected Today"
              value={stats.rejectedToday}
              icon={XCircle}
              color="text-red-600"
              bgColor="bg-red-50"
            />
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
                {pendingTasks.map((task) => (
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
                ))}
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
                {recentActivities.map((activity) => (
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
                ))}
              </div>
              <div className="mt-4 pt-4 border-t">
                <Link
                  to="/audit"
                  className="text-sm text-primary hover:text-primary/80 font-medium"
                >
                  View all activity →
                </Link>
              </div>
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
