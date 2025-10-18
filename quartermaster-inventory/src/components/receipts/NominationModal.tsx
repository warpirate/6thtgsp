import React, { useState, useEffect } from 'react'
import { X, UserCheck, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { auditService } from '@/lib/api/audit.service'
import { toast } from 'react-hot-toast'

interface NominationModalProps {
  isOpen: boolean
  onClose: () => void
  receiptId: string
  receiptNumber: string
  onSuccess: () => void
}

interface SemiSuperAdmin {
  id: string
  full_name: string
  email: string
  department?: string
  rank?: string
}

export const NominationModal: React.FC<NominationModalProps> = ({
  isOpen,
  onClose,
  receiptId,
  receiptNumber,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false)
  const [loadingSemiAdmins, setLoadingSemiAdmins] = useState(true)
  const [semiSuperAdmins, setSemiSuperAdmins] = useState<SemiSuperAdmin[]>([])
  const [selectedAdminId, setSelectedAdminId] = useState<string>('')

  useEffect(() => {
    if (isOpen) {
      loadSemiSuperAdmins()
    }
  }, [isOpen])

  const loadSemiSuperAdmins = async () => {
    try {
      setLoadingSemiAdmins(true)
      const { data, error } = await (supabase as any)
        .from('users')
        .select('id, full_name, email, department, rank')
        .eq('role', 'semi_super_admin')
        .eq('is_active', true)
        .order('full_name')

      if (error) throw error
      setSemiSuperAdmins(data || [])
    } catch (error: any) {
      console.error('Error loading semi super admins:', error)
      toast.error('Failed to load verification officers')
    } finally {
      setLoadingSemiAdmins(false)
    }
  }

  const handleNominate = async () => {
    if (!selectedAdminId) {
      toast.error('Please select a verification officer')
      return
    }

    try {
      setLoading(true)

      // Get current user for nominated_by
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Update receipt with nomination
      const { error } = await (supabase as any)
        .from('stock_receipts')
        .update({
          status: 'nominated',
          nominated_to: selectedAdminId,
          nominated_by: user.id,
          nominated_at: new Date().toISOString()
        })
        .eq('id', receiptId)

      if (error) throw error

      // Get nominated officer details for audit log
      const nominatedOfficer = semiSuperAdmins.find(admin => admin.id === selectedAdminId)

      // Create audit log
      await auditService.createAuditLog({
        action: 'NOMINATED',
        table_name: 'stock_receipts',
        record_id: receiptId,
        new_values: {
          nominated_to: selectedAdminId,
          nominated_by: user.id,
          status: 'nominated'
        },
        description: `Nominated ${nominatedOfficer?.full_name || 'officer'} for physical verification of IV ${receiptNumber}`
      })

      toast.success('Verification officer nominated successfully!')
      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('Error nominating:', error)
      toast.error(error.message || 'Failed to nominate verification officer')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Nominate Verification Officer</h2>
              <p className="text-sm text-gray-600">IV Number: {receiptNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Info Alert */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">About Nomination</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Select an Additional Commandant (Semi Super Admin) for physical verification</li>
                <li>Only the nominated officer can verify this IV</li>
                <li>Once nominated, the assignment cannot be changed</li>
              </ul>
            </div>
          </div>

          {/* Semi Super Admin Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Verification Officer (Additional Commandant) *
            </label>
            
            {loadingSemiAdmins ? (
              <div className="text-center py-8 text-gray-500">
                Loading verification officers...
              </div>
            ) : semiSuperAdmins.length === 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                <p className="text-yellow-800 font-medium">No Semi Super Admins Available</p>
                <p className="text-sm text-yellow-700 mt-1">
                  Please create a Semi Super Admin user first in User Management.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {semiSuperAdmins.map((admin) => (
                  <label
                    key={admin.id}
                    className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedAdminId === admin.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="semiSuperAdmin"
                      value={admin.id}
                      checked={selectedAdminId === admin.id}
                      onChange={(e) => setSelectedAdminId(e.target.value)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{admin.full_name}</div>
                      <div className="text-sm text-gray-600">{admin.email}</div>
                      {(admin.rank || admin.department) && (
                        <div className="text-xs text-gray-500 mt-1">
                          {admin.rank && <span>{admin.rank}</span>}
                          {admin.rank && admin.department && <span> • </span>}
                          {admin.department && <span>{admin.department}</span>}
                        </div>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleNominate}
            disabled={loading || !selectedAdminId || semiSuperAdmins.length === 0}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <UserCheck className="w-4 h-4" />
            {loading ? 'Nominating...' : 'Nominate Officer'}
          </button>
        </div>
      </div>
    </div>
  )
}
