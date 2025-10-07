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

  // Load users from database using our custom function
  const loadUsers = async () => {
    try {
      setLoading(true)
      const { data, error } = await (supabase as any).rpc('admin_get_all_users')
      
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

  // Create new user using our custom function
  const handleCreateUser = async () => {
    // Validate required fields
    const missingFields = []
    if (!createForm.full_name?.trim()) missingFields.push('Full Name')
    if (!createForm.username?.trim()) missingFields.push('Username')
    if (!createForm.role) missingFields.push('Role')
    if (!createForm.department?.trim()) missingFields.push('Department')
    if (!createForm.rank?.trim()) missingFields.push('Rank')
    if (!createForm.service_number?.trim()) missingFields.push('Service Number')

    if (missingFields.length > 0) {
      toast.error(
        <div>
          <p><strong>Missing required fields:</strong></p>
          <ul className="list-disc list-inside mt-1">
            {missingFields.map(field => <li key={field}>{field}</li>)}
          </ul>
        </div>,
        { duration: 6000 }
      )
      return
    }

    // Validate username format (no spaces, special characters)
    if (createForm.username && !/^[a-zA-Z0-9_]+$/.test(createForm.username)) {
      toast.error('Username can only contain letters, numbers, and underscores')
      return
    }

    // Validate service number format (numbers only)
    if (createForm.service_number && !/^[0-9]+$/.test(createForm.service_number)) {
      toast.error('Service Number must contain only numbers')
      return
    }

    setCreateLoading(true)
    try {
      // Use our custom admin_create_user function
      const { data, error } = await (supabase as any).rpc('admin_create_user', {
        p_full_name: createForm.full_name,
        p_username: createForm.username,
        p_role: createForm.role,
        p_department: createForm.department || null,
        p_rank: createForm.rank || null,
        p_service_number: createForm.service_number || null,
        p_email: createForm.email || null
      })

      if (error) throw error
      
      const result = data[0] as any // RPC returns array
      if (!result.success) {
        throw new Error(result.message)
      }

      toast.success(
        <div>
          <p>User {createForm.full_name} created successfully!</p>
          <p className="text-sm mt-1">Temporary password: <strong>{result.temp_password}</strong></p>
        </div>,
        { duration: 8000 }
      )
      
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

  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editForm, setEditForm] = useState<Partial<CreateUserForm>>({})
  const [editLoading, setEditLoading] = useState(false)

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setEditForm({
      full_name: user.full_name,
      username: user.username,
      role: user.role as UserRoleName,
      department: user.department || '',
      rank: user.rank || '',
      service_number: user.service_number || ''
    })
  }

  const handleUpdateUser = async () => {
    if (!editingUser) return

    // Validate required fields for editing
    const missingFields = []
    if (!editForm.full_name?.trim()) missingFields.push('Full Name')
    if (!editForm.username?.trim()) missingFields.push('Username')
    if (!editForm.role) missingFields.push('Role')
    if (!editForm.department?.trim()) missingFields.push('Department')
    if (!editForm.rank?.trim()) missingFields.push('Rank')
    if (!editForm.service_number?.trim()) missingFields.push('Service Number')

    if (missingFields.length > 0) {
      toast.error(
        <div>
          <p><strong>Missing required fields:</strong></p>
          <ul className="list-disc list-inside mt-1">
            {missingFields.map(field => <li key={field}>{field}</li>)}
          </ul>
        </div>,
        { duration: 6000 }
      )
      return
    }

    // Validate username format
    if (editForm.username && !/^[a-zA-Z0-9_]+$/.test(editForm.username)) {
      toast.error('Username can only contain letters, numbers, and underscores')
      return
    }

    // Validate service number format
    if (editForm.service_number && !/^[0-9]+$/.test(editForm.service_number)) {
      toast.error('Service Number must contain only numbers')
      return
    }

    setEditLoading(true)
    try {
      const { data, error } = await (supabase as any).rpc('update_system_user', {
        p_user_id: editingUser.id,
        p_full_name: editForm.full_name,
        p_username: editForm.username,
        p_role: editForm.role,
        p_department: editForm.department || null,
        p_rank: editForm.rank || null,
        p_service_number: editForm.service_number || null
      })

      if (error) throw error
      
      const result = data[0] as any
      if (!result.success) {
        throw new Error(result.message)
      }

      toast.success(`User ${editForm.full_name} updated successfully`)
      setEditingUser(null)
      setEditForm({})
      loadUsers()
    } catch (error: any) {
      console.error('Error updating user:', error)
      toast.error(error.message || 'Failed to update user')
    } finally {
      setEditLoading(false)
    }
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
      const { data, error } = await (supabase as any).rpc('admin_delete_user', {
        p_user_id: user.id
      })

      if (error) throw error
      
      const result = data[0] as any
      if (!result.success) {
        throw new Error(result.message)
      }

      toast.success(`User ${user.full_name} deleted successfully`)
      loadUsers() // Reload users list
    } catch (error: any) {
      console.error('Error deleting user:', error)
      toast.error(error.message || 'Failed to delete user')
    }
  }

  const handleResetPassword = async (user: User) => {
    if (!confirm(`Reset password for ${user.full_name}?`)) {
      return
    }

    try {
      const { data, error } = await (supabase as any).rpc('admin_reset_user_password', {
        p_user_id: user.id
      })

      if (error) throw error
      
      const result = data[0] as any
      if (!result.success) {
        throw new Error(result.message)
      }

      toast.success(
        <div>
          <p>Password reset for {user.full_name}</p>
          <p className="text-sm mt-1">New password: <strong>{result.temp_password}</strong></p>
        </div>,
        { duration: 8000 }
      )
    } catch (error: any) {
      console.error('Error resetting password:', error)
      toast.error(error.message || 'Failed to reset password')
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
      const { data, error } = await (supabase as any).rpc('update_system_user', {
        p_user_id: user.id,
        p_is_active: !user.is_active
      })

      if (error) throw error
      
      const result = data[0] as any
      if (!result.success) {
        throw new Error(result.message)
      }
      
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
              {/* Email (Optional - will be auto-generated) */}
              <div>
                <label className="label">Email Address (Optional)</label>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  className="input w-full"
                  placeholder="user@example.com (leave blank for auto-generation)"
                  disabled={createLoading}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  If left blank, email will be auto-generated as username@quartermaster.mil
                </p>
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
                <label className="label">Department *</label>
                <input
                  type="text"
                  value={createForm.department}
                  onChange={(e) => setCreateForm({ ...createForm, department: e.target.value })}
                  className="input w-full"
                  placeholder="IT Department"
                  required
                  disabled={createLoading}
                />
              </div>

              {/* Rank */}
              <div>
                <label className="label">Rank *</label>
                <input
                  type="text"
                  value={createForm.rank}
                  onChange={(e) => setCreateForm({ ...createForm, rank: e.target.value })}
                  className="input w-full"
                  placeholder="Captain"
                  required
                  disabled={createLoading}
                />
              </div>

              {/* Service Number */}
              <div>
                <label className="label">Service Number *</label>
                <input
                  type="text"
                  value={createForm.service_number}
                  onChange={(e) => setCreateForm({ ...createForm, service_number: e.target.value })}
                  className="input w-full"
                  placeholder="12345"
                  required
                  disabled={createLoading}
                />
              </div>

              {/* Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Password Information</p>
                    <p>A temporary password will be generated and displayed after user creation.</p>
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

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-foreground">Edit User</h3>
              <button
                onClick={() => setEditingUser(null)}
                className="text-muted-foreground hover:text-foreground"
                disabled={editLoading}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleUpdateUser(); }} className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="label">Full Name *</label>
                <input
                  type="text"
                  value={editForm.full_name || ''}
                  onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                  className="input w-full"
                  placeholder="John Doe"
                  required
                  disabled={editLoading}
                />
              </div>

              {/* Username */}
              <div>
                <label className="label">Username *</label>
                <input
                  type="text"
                  value={editForm.username || ''}
                  onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                  className="input w-full"
                  placeholder="johndoe"
                  required
                  disabled={editLoading}
                />
              </div>

              {/* Role */}
              <div>
                <label className="label">Role *</label>
                <select
                  value={editForm.role || 'semi_user'}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value as UserRoleName })}
                  className="input w-full"
                  required
                  disabled={editLoading}
                >
                  <option value="semi_user">Semi User (Requester)</option>
                  <option value="user">User (Watchman/Store Keeper)</option>
                  <option value="admin">Admin (Approver)</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>

              {/* Department */}
              <div>
                <label className="label">Department *</label>
                <input
                  type="text"
                  value={editForm.department || ''}
                  onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                  className="input w-full"
                  placeholder="IT Department"
                  required
                  disabled={editLoading}
                />
              </div>

              {/* Rank */}
              <div>
                <label className="label">Rank *</label>
                <input
                  type="text"
                  value={editForm.rank || ''}
                  onChange={(e) => setEditForm({ ...editForm, rank: e.target.value })}
                  className="input w-full"
                  placeholder="Captain"
                  required
                  disabled={editLoading}
                />
              </div>

              {/* Service Number */}
              <div>
                <label className="label">Service Number *</label>
                <input
                  type="text"
                  value={editForm.service_number || ''}
                  onChange={(e) => setEditForm({ ...editForm, service_number: e.target.value })}
                  className="input w-full"
                  placeholder="12345"
                  required
                  disabled={editLoading}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="btn btn-secondary flex-1"
                  disabled={editLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary flex-1 flex items-center justify-center gap-2"
                  disabled={editLoading}
                >
                  {editLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Update User
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
