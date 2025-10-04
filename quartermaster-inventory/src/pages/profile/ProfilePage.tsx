import React, { useState } from 'react'
import { User, Mail, Edit, Key, Activity } from 'lucide-react'
import { useAuth } from '@/lib/auth/AuthProvider'

const ProfilePage: React.FC = () => {
  const { userProfile } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [showChangePassword, setShowChangePassword] = useState(false)

  const mockActivity = [
    { action: 'Created receipt REC-2024-001', date: '2024-10-04 14:30' },
    { action: 'Submitted receipt for verification', date: '2024-10-04 15:00' },
    { action: 'Logged in', date: '2024-10-04 09:00' },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Profile</h1>
        <p className="mt-1 text-muted-foreground">Manage your account settings</p>
      </div>

      {/* Profile Card */}
      <div className="card p-6">
        <div className="flex items-center gap-6 mb-6">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-10 h-10 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">{userProfile?.full_name || 'User'}</h2>
            <p className="text-muted-foreground">{userProfile?.email}</p>
            <span className="inline-block mt-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
              {userProfile?.role?.replace('_', ' ').toUpperCase() || 'USER'}
            </span>
          </div>
        </div>

        <div className="border-t pt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Profile Information</h3>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="btn btn-secondary btn-sm flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              {isEditing ? 'Cancel' : 'Edit'}
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="label">Full Name</label>
              <input
                type="text"
                defaultValue={userProfile?.full_name}
                disabled={!isEditing}
                className="input"
              />
            </div>
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                defaultValue={userProfile?.email || ''}
                disabled={!isEditing}
                className="input"
              />
            </div>
            {isEditing && (
              <button className="btn btn-primary">
                Save Changes
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="card p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-semibold">Password</h3>
            <p className="text-sm text-muted-foreground">Change your password</p>
          </div>
          <button
            onClick={() => setShowChangePassword(!showChangePassword)}
            className="btn btn-secondary btn-sm flex items-center gap-2"
          >
            <Key className="w-4 h-4" />
            {showChangePassword ? 'Cancel' : 'Change Password'}
          </button>
        </div>

        {showChangePassword && (
          <div className="space-y-4 mt-4">
            <div>
              <label className="label">Current Password</label>
              <input type="password" className="input" />
            </div>
            <div>
              <label className="label">New Password</label>
              <input type="password" className="input" />
            </div>
            <div>
              <label className="label">Confirm New Password</label>
              <input type="password" className="input" />
            </div>
            <button className="btn btn-primary">
              Update Password
            </button>
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5" />
          <h3 className="text-lg font-semibold">Recent Activity</h3>
        </div>
        <div className="space-y-3">
          {mockActivity.map((item, index) => (
            <div key={index} className="flex justify-between items-center py-2 border-b last:border-b-0">
              <span className="text-sm">{item.action}</span>
              <span className="text-sm text-muted-foreground">{item.date}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ProfilePage
