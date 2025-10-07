import React, { useState, useEffect } from 'react'
import { UserPlus, Search, Edit, Trash2, Key, Shield, X, Save, AlertCircle } from 'lucide-react'
import { useAuth } from '@/lib/auth/AuthProvider'
import { supabase } from '@/lib/supabase'
import { User, UserRoleName } from '@/types'
import { toast } from 'react-hot-toast'

interface CreateUserForm {
  email: string
  full_name: string
  username: string
  role: UserRoleName
  rank?: string
  service_number?: string
  department?: string
}

const UsersPage: React.FC = () => {
  const { userProfile, hasPermission } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createForm, setCreateForm] = useState<CreateUserForm>({
    email: '',
    full_name: '',
    username: '',
    role: 'semi_user',
    rank: '',
    service_number: '',
    department: ''
  })
  const [createLoading, setCreateLoading] = useState(false)

  // Load users from database
  const loadUsers = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setUsers(data || [])
    } catch (error: any) {
      console.error('Error loading users:', error)
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (hasPermission('manage_users')) {
      loadUsers()
    }
  }, [hasPermission])

  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
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

  // Create new user
  const handleCreateUser = async () => {
    if (!createForm.email || !createForm.full_name || !createForm.username) {
      toast.error('Please fill in all required fields')
      return
    }

    setCreateLoading(true)
    try {
      // Create user in Supabase Auth first
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: createForm.email,
        password: 'TempPassword123!', // Temporary password - user will need to reset
        email_confirm: true,
        user_metadata: {
          full_name: createForm.full_name
        }
      })

      if (authError) throw authError

      // Create user profile in public.users table
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: createForm.email,
          username: createForm.username,
          full_name: createForm.full_name,
          role: createForm.role,
          rank: createForm.rank || null,
          service_number: createForm.service_number || null,
          department: createForm.department || null,
          password_hash: 'supabase_auth', // Placeholder since we use Supabase auth
          is_active: true
        })

      if (profileError) throw profileError

      toast.success(`User ${createForm.full_name} created successfully`)
      setShowCreateModal(false)
      setCreateForm({
        email: '',
        full_name: '',
        username: '',
        role: 'semi_user',
        rank: '',
        service_number: '',
        department: ''
      })
      loadUsers() // Reload users list
    } catch (error: any) {
      console.error('Error creating user:', error)
      toast.error(error.message || 'Failed to create user')
    } finally {
      setCreateLoading(false)
    }
  }

  const handleEdit = (user: User) => {
    toast('Edit functionality coming soon', { icon: 'ℹ️' })
  }

  const handleDelete = async (user: User) => {
    if (user.id === userProfile?.id) {
      toast.error('Cannot delete yourself!')
      return
    }
    
    if (!confirm(`Delete user ${user.full_name}? This action cannot be undone.`)) {
      return
    }

    try {
      // Delete from public.users table first
      const { error: profileError } = await supabase
        .from('users')
        .delete()
        .eq('id', user.id)

      if (profileError) throw profileError

      // Delete from Supabase Auth
      const { error: authError } = await supabase.auth.admin.deleteUser(user.id)
      if (authError) {
        console.warn('Auth user deletion failed:', authError)
        // Don't throw - profile is already deleted
      }

      toast.success(`User ${user.full_name} deleted successfully`)
      loadUsers() // Reload users list
    } catch (error: any) {
      console.error('Error deleting user:', error)
      toast.error(error.message || 'Failed to delete user')
    }
  }

  const handleResetPassword = async (user: User) => {
    if (!user.email) {
      toast.error('User has no email address')
      return
    }

    if (!confirm(`Send password reset email to ${user.email}?`)) {
      return
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      })

      if (error) throw error
      toast.success(`Password reset email sent to ${user.email}`)
    } catch (error: any) {
      console.error('Error sending password reset:', error)
      toast.error(error.message || 'Failed to send password reset email')
    }
  }

  const handleToggleStatus = async (user: User) => {
    if (user.id === userProfile?.id) {
      toast.error('Cannot deactivate yourself!')
      return
    }
    
    const action = user.is_active ? 'deactivate' : 'activate'
    if (!confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} user ${user.full_name}?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('users')
        .update({ is_active: !user.is_active })
        .eq('id', user.id)

      if (error) throw error
      
      toast.success(`User ${user.full_name} ${action}d successfully`)
      loadUsers() // Reload users list
    } catch (error: any) {
      console.error('Error toggling user status:', error)
      toast.error(error.message || 'Failed to update user status')
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  // Don't render if user doesn't have permission
  if (!hasPermission('manage_users')) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Access Denied</h3>
          <p className="text-muted-foreground">You don't have permission to manage users.</p>
        </div>
      </div>
    )
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
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                    Loading users...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-foreground">Create New User</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-muted-foreground hover:text-foreground"
                disabled={createLoading}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleCreateUser(); }} className="space-y-4">
              {/* Email */}
              <div>
                <label className="label">Email Address *</label>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  className="input w-full"
                  placeholder="user@example.com"
                  required
                  disabled={createLoading}
                />
              </div>

              {/* Full Name */}
              <div>
                <label className="label">Full Name *</label>
                <input
                  type="text"
                  value={createForm.full_name}
                  onChange={(e) => setCreateForm({ ...createForm, full_name: e.target.value })}
                  className="input w-full"
                  placeholder="John Doe"
                  required
                  disabled={createLoading}
                />
              </div>

              {/* Username */}
              <div>
                <label className="label">Username *</label>
                <input
                  type="text"
                  value={createForm.username}
                  onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                  className="input w-full"
                  placeholder="johndoe"
                  required
                  disabled={createLoading}
                />
              </div>

              {/* Role */}
              <div>
                <label className="label">Role *</label>
                <select
                  value={createForm.role}
                  onChange={(e) => setCreateForm({ ...createForm, role: e.target.value as UserRoleName })}
                  className="input w-full"
                  required
                  disabled={createLoading}
                >
                  <option value="semi_user">Semi User (Requester)</option>
                  <option value="user">User (Watchman/Store Keeper)</option>
                  <option value="admin">Admin (Approver)</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>

              {/* Department */}
              <div>
                <label className="label">Department</label>
                <input
                  type="text"
                  value={createForm.department}
                  onChange={(e) => setCreateForm({ ...createForm, department: e.target.value })}
                  className="input w-full"
                  placeholder="IT Department"
                  disabled={createLoading}
                />
              </div>

              {/* Rank */}
              <div>
                <label className="label">Rank</label>
                <input
                  type="text"
                  value={createForm.rank}
                  onChange={(e) => setCreateForm({ ...createForm, rank: e.target.value })}
                  className="input w-full"
                  placeholder="Captain"
                  disabled={createLoading}
                />
              </div>

              {/* Service Number */}
              <div>
                <label className="label">Service Number</label>
                <input
                  type="text"
                  value={createForm.service_number}
                  onChange={(e) => setCreateForm({ ...createForm, service_number: e.target.value })}
                  className="input w-full"
                  placeholder="12345"
                  disabled={createLoading}
                />
              </div>

              {/* Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Password Information</p>
                    <p>A temporary password will be assigned. The user will receive an email to set their own password.</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-secondary flex-1"
                  disabled={createLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary flex-1 flex items-center justify-center gap-2"
                  disabled={createLoading}
                >
                  {createLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Create User
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default UsersPage
