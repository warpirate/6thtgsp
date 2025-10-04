import React, { useState } from 'react'
import { UserPlus, Search, Edit, Trash2, Key, Shield } from 'lucide-react'
import { useAuth } from '@/lib/auth/AuthProvider'

// Mock users data
const mockUsers = [
  {
    id: '1',
    email: 'admin@quartermaster.dev',
    full_name: 'Admin User',
    role: 'super_admin',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    email: 'user@quartermaster.dev',
    full_name: 'Regular User',
    role: 'user',
    is_active: true,
    created_at: '2024-02-15T00:00:00Z',
  },
  {
    id: '3',
    email: 'verifier@quartermaster.dev',
    full_name: 'Semi User',
    role: 'semi_user',
    is_active: true,
    created_at: '2024-03-20T00:00:00Z',
  },
  {
    id: '4',
    email: 'inactive@quartermaster.dev',
    full_name: 'Inactive User',
    role: 'user',
    is_active: false,
    created_at: '2024-04-10T00:00:00Z',
  },
]

const UsersPage: React.FC = () => {
  const { userProfile } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)

  const filteredUsers = mockUsers.filter((user) => {
    const matchesSearch = user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = !roleFilter || user.role === roleFilter
    const matchesStatus = !statusFilter ||
      (statusFilter === 'active' && user.is_active) ||
      (statusFilter === 'inactive' && !user.is_active)
    return matchesSearch && matchesRole && matchesStatus
  })

  const getRoleBadge = (role: string) => {
    const config = {
      super_admin: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Super Admin' },
      admin: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Admin' },
      user: { bg: 'bg-green-100', text: 'text-green-800', label: 'User' },
      semi_user: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Semi User' },
    }[role] || { bg: 'bg-gray-100', text: 'text-gray-800', label: role }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    )
  }

  const handleEdit = (user: typeof mockUsers[0]) => {
    alert(`Edit user: ${user.full_name} - API integration pending`)
  }

  const handleDelete = (user: typeof mockUsers[0]) => {
    if (user.id === userProfile?.id) {
      alert('Cannot delete yourself!')
      return
    }
    if (confirm(`Delete user ${user.full_name}?`)) {
      alert('Delete functionality - API integration pending')
    }
  }

  const handleResetPassword = (user: typeof mockUsers[0]) => {
    if (confirm(`Send password reset email to ${user.email}?`)) {
      alert('Password reset - API integration pending')
    }
  }

  const handleToggleStatus = (user: typeof mockUsers[0]) => {
    if (user.id === userProfile?.id) {
      alert('Cannot deactivate yourself!')
      return
    }
    const action = user.is_active ? 'Deactivate' : 'Activate'
    if (confirm(`${action} user ${user.full_name}?`)) {
      alert(`${action} functionality - API integration pending`)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">User Management</h1>
          <p className="mt-1 text-muted-foreground">
            Manage system users and their roles
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          Add User
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10 w-full"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="input"
          >
            <option value="">All Roles</option>
            <option value="super_admin">Super Admin</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
            <option value="semi_user">Semi User</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-foreground">{user.full_name}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getRoleBadge(user.role)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {formatDate(user.created_at)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(user)}
                        className="text-primary hover:text-primary/80"
                        title="Edit User"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleResetPassword(user)}
                        className="text-yellow-600 hover:text-yellow-700"
                        title="Reset Password"
                      >
                        <Key className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(user)}
                        className={user.is_active ? 'text-orange-600 hover:text-orange-700' : 'text-green-600 hover:text-green-700'}
                        title={user.is_active ? 'Deactivate' : 'Activate'}
                        disabled={user.id === userProfile?.id}
                      >
                        <Shield className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(user)}
                        className="text-red-600 hover:text-red-700"
                        title="Delete User"
                        disabled={user.id === userProfile?.id}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User Modal Placeholder */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-foreground mb-4">Add New User</h3>
            <p className="text-muted-foreground mb-4">
              Create user modal - API integration pending
            </p>
            <button
              onClick={() => setShowCreateModal(false)}
              className="btn btn-secondary w-full"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default UsersPage
