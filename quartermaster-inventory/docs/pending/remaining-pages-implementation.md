# Remaining Pages Implementation Guide

**Status**: 🟢 **Low-Medium Priority**  
**Total Estimated Effort**: 4-6 days  

This document covers implementation details for the remaining 4 pages: User Management, Audit Logs, Profile, and Settings.

---

## 1. User Management Page

**File**: `src/pages/users/UsersPage.tsx`  
**Current Status**: Placeholder (19 lines)  
**Priority**: 🟡 **Medium**  
**Estimated Effort**: 2 days  
**Access**: Super Admin only

### Required Features

- ✅ Users table with all user data
- ✅ Search by name or email
- ✅ Filter by role (Semi User, User, Admin, Super Admin)
- ✅ Filter by status (Active/Inactive)
- ✅ Create new user modal
- ✅ Edit user modal
- ✅ Role assignment dropdown
- ✅ Activate/Deactivate toggle
- ✅ Delete user with confirmation
- ✅ Reset password button (sends email)
- ✅ View user's receipts/activity

### API Functions

```typescript
// src/lib/api/users.ts
export const usersApi = {
  async getAll(filters?: { role?: string; status?: string; search?: string }) {
    let query = supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (filters?.role) query = query.eq('role', filters.role)
    if (filters?.status === 'active') query = query.eq('is_active', true)
    if (filters?.status === 'inactive') query = query.eq('is_active', false)
    if (filters?.search) {
      query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`)
    }

    const { data, error } = await query
    if (error) throw error
    return data
  },

  async create(userData: { email: string; password: string; full_name: string; role: string }) {
    // Use Supabase Auth Admin API
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true,
    })

    if (authError) throw authError

    // Create user profile
    const { data, error } = await supabase
      .from('users')
      .insert({
        id: authUser.user.id,
        email: userData.email,
        full_name: userData.full_name,
        role: userData.role,
        is_active: true,
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async update(id: string, updates: Partial<User>) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async delete(id: string) {
    // Delete from auth
    const { error: authError } = await supabase.auth.admin.deleteUser(id)
    if (authError) throw authError

    // User record will be deleted via CASCADE
  },

  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    if (error) throw error
  },
}
```

### Component Structure

```typescript
const UsersPage = () => {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [filters, setFilters] = useState({ role: '', status: '', search: '' })

  const { data: users } = useUsers(filters)
  const createMutation = useCreateUser()
  const updateMutation = useUpdateUser()
  const deleteMutation = useDeleteUser()

  return (
    <div>
      <Header />
      <Filters />
      <UsersTable 
        users={users}
        onEdit={setEditingUser}
        onDelete={handleDelete}
      />
      {showCreateModal && <CreateUserModal onClose={() => setShowCreateModal(false)} />}
      {editingUser && <EditUserModal user={editingUser} onClose={() => setEditingUser(null)} />}
    </div>
  )
}
```

### Key Features to Implement

1. **Create User Modal**
   - Email validation
   - Strong password requirements
   - Role selection
   - Auto-generate password option

2. **Edit User Modal**
   - Update full name
   - Change role
   - Toggle active status
   - Cannot edit own role/status

3. **Security Checks**
   - Prevent deleting yourself
   - Prevent demoting yourself
   - Require confirmation for destructive actions

---

## 2. Audit Logs Page

**File**: `src/pages/audit/AuditLogsPage.tsx`  
**Current Status**: Placeholder (19 lines)  
**Priority**: 🟡 **Medium**  
**Estimated Effort**: 1-2 days  
**Access**: Admin and Super Admin

### Required Features

- ✅ Comprehensive log table
- ✅ Filter by user
- ✅ Filter by action type (Created, Updated, Deleted, etc.)
- ✅ Filter by entity type (Receipt, User, etc.)
- ✅ Date range filter
- ✅ Search by keywords
- ✅ Expandable row details
- ✅ Export logs to CSV
- ✅ Auto-refresh toggle
- ✅ Pagination

### Audit Log Table Structure

```sql
create table if not exists public.audit_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id),
  action text not null, -- 'created', 'updated', 'deleted', 'verified', 'approved', 'rejected'
  entity_type text not null, -- 'receipt', 'user', 'document'
  entity_id uuid,
  old_values jsonb,
  new_values jsonb,
  metadata jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index idx_audit_logs_user_id on public.audit_logs(user_id);
create index idx_audit_logs_entity on public.audit_logs(entity_type, entity_id);
create index idx_audit_logs_created_at on public.audit_logs(created_at desc);
```

### Component Implementation

```typescript
const AuditLogsPage = () => {
  const [filters, setFilters] = useState({
    userId: '',
    action: '',
    entityType: '',
    dateFrom: '',
    dateTo: '',
    search: '',
  })
  const [autoRefresh, setAutoRefresh] = useState(false)

  const { data: logs } = useAuditLogs(filters, {
    refetchInterval: autoRefresh ? 30000 : false,
  })

  return (
    <div>
      <Header />
      <FilterBar filters={filters} onChange={setFilters} />
      <div className="flex justify-between mb-4">
        <label>
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
          />
          Auto-refresh (30s)
        </label>
        <button onClick={handleExport}>Export CSV</button>
      </div>
      <LogsTable logs={logs} />
    </div>
  )
}
```

### Log Display

```typescript
const LogRow = ({ log }: { log: AuditLog }) => {
  const [expanded, setExpanded] = useState(false)

  const getActionColor = (action: string) => {
    const colors = {
      created: 'text-green-600',
      updated: 'text-blue-600',
      deleted: 'text-red-600',
      verified: 'text-yellow-600',
      approved: 'text-green-600',
      rejected: 'text-red-600',
    }
    return colors[action] || 'text-gray-600'
  }

  return (
    <>
      <tr onClick={() => setExpanded(!expanded)} className="cursor-pointer hover:bg-muted/50">
        <td>{format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss')}</td>
        <td>{log.user?.full_name || 'System'}</td>
        <td className={getActionColor(log.action)}>{log.action}</td>
        <td>{log.entity_type}</td>
        <td>{log.entity_id?.slice(0, 8)}...</td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={5} className="bg-muted/20 p-4">
            <div className="grid grid-cols-2 gap-4">
              {log.old_values && (
                <div>
                  <h4>Old Values</h4>
                  <pre>{JSON.stringify(log.old_values, null, 2)}</pre>
                </div>
              )}
              {log.new_values && (
                <div>
                  <h4>New Values</h4>
                  <pre>{JSON.stringify(log.new_values, null, 2)}</pre>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}
```

---

## 3. Profile Page

**File**: `src/pages/profile/ProfilePage.tsx`  
**Current Status**: Placeholder (19 lines)  
**Priority**: 🟢 **Low**  
**Estimated Effort**: 1 day  
**Access**: All authenticated users

### Required Features

- ✅ Profile information form (full name, email)
- ✅ Avatar upload
- ✅ Change password section
- ✅ Email update with verification
- ✅ Recent activity list
- ✅ Notification preferences

### Component Structure

```typescript
const ProfilePage = () => {
  const { userProfile } = useAuth()
  const [editing, setEditing] = useState(false)
  const updateMutation = useUpdateProfile()
  const changePasswordMutation = useChangePassword()

  const { register, handleSubmit } = useForm({
    defaultValues: {
      full_name: userProfile?.full_name,
      email: userProfile?.email,
    },
  })

  const onSubmit = async (data) => {
    await updateMutation.mutateAsync(data)
    setEditing(false)
    toast.success('Profile updated!')
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Avatar Section */}
      <div className="card p-6">
        <div className="flex items-center gap-6">
          <Avatar size="xl" src={userProfile?.avatar_url} />
          <div>
            <h2 className="text-2xl font-bold">{userProfile?.full_name}</h2>
            <p className="text-muted-foreground">{userProfile?.email}</p>
            <p className="text-sm mt-1">
              <span className="badge">{userProfile?.role}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Profile Information */}
      <div className="card p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Profile Information</h3>
          <button onClick={() => setEditing(!editing)} className="btn btn-secondary">
            {editing ? 'Cancel' : 'Edit'}
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Full Name</label>
            <input
              {...register('full_name')}
              className="input"
              disabled={!editing}
            />
          </div>
          <div>
            <label className="label">Email</label>
            <input
              {...register('email')}
              type="email"
              className="input"
              disabled={!editing}
            />
          </div>
          {editing && (
            <button type="submit" className="btn btn-primary">
              Save Changes
            </button>
          )}
        </form>
      </div>

      {/* Change Password */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4">Change Password</h3>
        <ChangePasswordForm />
      </div>

      {/* Recent Activity */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
        <ActivityList userId={userProfile?.id} />
      </div>
    </div>
  )
}
```

---

## 4. Settings Page

**File**: `src/pages/settings/SettingsPage.tsx`  
**Current Status**: Placeholder (19 lines)  
**Priority**: 🟢 **Low**  
**Estimated Effort**: 1 day  
**Access**: All authenticated users

### Required Features

- ✅ Theme toggle (Light/Dark/System)
- ✅ Notification preferences
- ✅ Display density (Comfortable/Compact)
- ✅ Language (if i18n implemented)
- ✅ Timezone
- ✅ Date format preference
- ✅ Items per page

### Component Structure

```typescript
const SettingsPage = () => {
  const [settings, setSettings] = useLocalStorage('user-settings', {
    theme: 'system',
    notifications: {
      email: true,
      push: false,
      receiptApproved: true,
      receiptRejected: true,
      newAssignment: true,
    },
    display: {
      density: 'comfortable',
      itemsPerPage: 25,
      dateFormat: 'yyyy-MM-dd',
    },
  })

  const updateSetting = (path: string, value: any) => {
    setSettings((prev) => {
      const updated = { ...prev }
      // Deep update logic
      return updated
    })
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Appearance */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4">Appearance</h3>
        
        <div className="space-y-4">
          <div>
            <label className="label">Theme</label>
            <div className="flex gap-4">
              {['light', 'dark', 'system'].map((theme) => (
                <button
                  key={theme}
                  onClick={() => updateSetting('theme', theme)}
                  className={`btn ${settings.theme === theme ? 'btn-primary' : 'btn-secondary'}`}
                >
                  {theme.charAt(0).toUpperCase() + theme.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Display Density</label>
            <select
              value={settings.display.density}
              onChange={(e) => updateSetting('display.density', e.target.value)}
              className="input"
            >
              <option value="comfortable">Comfortable</option>
              <option value="compact">Compact</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4">Notifications</h3>
        
        <div className="space-y-3">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={settings.notifications.receiptApproved}
              onChange={(e) => updateSetting('notifications.receiptApproved', e.target.checked)}
            />
            <span>Notify when my receipt is approved</span>
          </label>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={settings.notifications.receiptRejected}
              onChange={(e) => updateSetting('notifications.receiptRejected', e.target.checked)}
            />
            <span>Notify when my receipt is rejected</span>
          </label>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={settings.notifications.newAssignment}
              onChange={(e) => updateSetting('notifications.newAssignment', e.target.checked)}
            />
            <span>Notify for new approval assignments</span>
          </label>
        </div>
      </div>

      {/* Data & Display */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4">Data & Display</h3>
        
        <div className="space-y-4">
          <div>
            <label className="label">Items per page</label>
            <select
              value={settings.display.itemsPerPage}
              onChange={(e) => updateSetting('display.itemsPerPage', Number(e.target.value))}
              className="input"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          <div>
            <label className="label">Date Format</label>
            <select
              value={settings.display.dateFormat}
              onChange={(e) => updateSetting('display.dateFormat', e.target.value)}
              className="input"
            >
              <option value="yyyy-MM-dd">2024-10-04</option>
              <option value="MM/dd/yyyy">10/04/2024</option>
              <option value="dd/MM/yyyy">04/10/2024</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}
```

---

## 📋 Implementation Priority Summary

### Week 1-2: High Priority
1. **User Management** - 2 days (Admin functionality)
2. **Audit Logs** - 1.5 days (Compliance requirement)

### Week 3: Low Priority
3. **Profile Page** - 1 day (User convenience)
4. **Settings Page** - 1 day (User preferences)

---

## 🎯 Success Criteria

### User Management
✅ CRUD operations work  
✅ Role assignment functional  
✅ Cannot edit self destructively  
✅ Password reset works  

### Audit Logs
✅ All actions logged  
✅ Filters work correctly  
✅ Export functionality  
✅ Performance with large datasets  

### Profile
✅ Update profile works  
✅ Change password works  
✅ Avatar upload works  

### Settings
✅ Theme switching works  
✅ Settings persist  
✅ Apply across app  

---

**Total Estimated Time**: 32-40 hours (4-5 days)  
**Overall Priority**: 🟡 **Medium**  

---

**Last Updated**: 2025-10-04
