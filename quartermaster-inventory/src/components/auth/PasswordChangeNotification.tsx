import React, { useState } from 'react'
import { AlertTriangle, Eye, EyeOff, Save, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'react-hot-toast'
import { useAuth } from '@/lib/auth/AuthProvider'

interface PasswordChangeNotificationProps {
  isVisible: boolean
  onClose?: () => void
  canDismiss?: boolean
}

const PasswordChangeNotification: React.FC<PasswordChangeNotificationProps> = ({
  isVisible,
  onClose,
  canDismiss = false
}) => {
  const { userProfile, refreshProfile } = useAuth()
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })

  if (!isVisible) return null

  const handlePasswordChange = async () => {
    if (!passwords.current || !passwords.new || !passwords.confirm) {
      toast.error('Please fill in all password fields')
      return
    }

    if (passwords.new !== passwords.confirm) {
      toast.error('New passwords do not match')
      return
    }

    if (passwords.new.length < 6) {
      toast.error('New password must be at least 6 characters long')
      return
    }

    if (passwords.current === passwords.new) {
      toast.error('New password must be different from current password')
      return
    }

    setLoading(true)
    try {
      // 1) Update password in Supabase Auth (current session must be valid)
      const { error: updErr } = await supabase.auth.updateUser({ password: passwords.new })
      if (updErr) throw updErr

      // 2) Update local profile flag so UI stops prompting
      if (userProfile?.id) {
        const { error: profErr } = await (supabase as any)
          .from('users')
          .update({ password_change_required: false, last_password_change: new Date().toISOString() })
          .eq('id', userProfile.id)

        if (profErr) {
          // Not critical for auth, but surface warning
          console.warn('Profile flag update failed:', profErr)
        }
      }

      toast.success('Password changed successfully!')
      setPasswords({ current: '', new: '', confirm: '' })
      setShowForm(false)
      await refreshProfile()
      if (onClose) onClose()
    } catch (error: any) {
      console.error('Error changing password:', error)
      toast.error(error.message || 'Failed to change password')
    } finally {
      setLoading(false)
    }
  }

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }))
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-orange-600">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="text-lg font-semibold">Password Change Required</h3>
          </div>
          {canDismiss && (
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {!showForm ? (
          <div className="space-y-4">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <p className="text-sm text-orange-800">
                <strong>Security Notice:</strong> Your account requires a password change for security reasons. 
                This is typically required for new accounts or after password resets.
              </p>
            </div>

            <div className="text-sm text-muted-foreground space-y-2">
              <p>• Choose a strong password with at least 6 characters</p>
              <p>• Include a mix of letters, numbers, and symbols</p>
              <p>• Avoid using personal information</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowForm(true)}
                className="btn btn-primary flex-1"
              >
                Change Password Now
              </button>
              {canDismiss && (
                <button
                  onClick={onClose}
                  className="btn btn-secondary"
                >
                  Later
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <form onSubmit={(e) => { e.preventDefault(); handlePasswordChange(); }}>
              {/* Current Password */}
              <div>
                <label className="label">Current Password *</label>
                <div className="relative">
                  <input
                    type={showPasswords.current ? 'text' : 'password'}
                    value={passwords.current}
                    onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                    className="input w-full pr-10"
                    placeholder="Enter your current password"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('current')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="label">New Password *</label>
                <div className="relative">
                  <input
                    type={showPasswords.new ? 'text' : 'password'}
                    value={passwords.new}
                    onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                    className="input w-full pr-10"
                    placeholder="Enter your new password"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('new')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Minimum 6 characters
                </p>
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="label">Confirm New Password *</label>
                <div className="relative">
                  <input
                    type={showPasswords.confirm ? 'text' : 'password'}
                    value={passwords.confirm}
                    onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                    className="input w-full pr-10"
                    placeholder="Confirm your new password"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('confirm')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="btn btn-secondary flex-1"
                  disabled={loading}
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="btn btn-primary flex-1 flex items-center justify-center gap-2"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Changing...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Change Password
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}

export default PasswordChangeNotification
