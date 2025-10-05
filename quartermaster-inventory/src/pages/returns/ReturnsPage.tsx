import React, { useState, useEffect } from 'react'
import { RotateCcw, Search, CheckCircle, XCircle, AlertTriangle, Package } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth/AuthProvider'
import { ReturnWithDetails } from '@/types'
import { toast } from 'react-hot-toast'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

const ReturnsPage: React.FC = () => {
  const { user, hasPermission } = useAuth()
  
  const [returns, setReturns] = useState<ReturnWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('pending')
  const [selectedReturn, setSelectedReturn] = useState<ReturnWithDetails | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [showRejectModal, setShowRejectModal] = useState(false)

  useEffect(() => {
    loadReturns()
  }, [statusFilter, user])

  const loadReturns = async () => {
    if (!user) return
    
    try {
      setLoading(true)
      let query = (supabase as any)
        .from('returns')
        .select(`
          *,
          item:items_master(
            *,
            category:item_categories(*)
          ),
          returner:users!returned_by(id, full_name, username, rank),
          acceptor:users!accepted_by(id, full_name, username),
          issuance:issuances(
            *,
            requisition:requisitions(requisition_number)
          )
        `)
        .order('returned_at', { ascending: false })

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      // If not admin/store keeper, only show own returns
      if (!hasPermission('accept_returns')) {
        query = query.eq('returned_by', user.id)
      }

      const { data, error } = await query

      if (error) throw error

      // Transform data
      const transformedData = (data || []).map((ret: any) => ({
        ...ret,
        item: {
          ...ret.item,
          name: ret.item.nomenclature,
          unit: ret.item.unit_of_measure,
          category_name: ret.item.category?.name,
        }
      }))

      setReturns(transformedData as ReturnWithDetails[])
    } catch (error: any) {
      console.error('Error loading returns:', error)
      toast.error('Failed to load returns')
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptReturn = async (returnItem: ReturnWithDetails) => {
    if (!user) return

    setActionLoading(true)
    try {
      // Update return status
      const { error: returnError } = await (supabase as any)
        .from('returns')
        .update({
          status: 'accepted',
          accepted_by: user.id,
          accepted_at: new Date().toISOString()
        })
        .eq('id', returnItem.id)

      if (returnError) throw returnError

      // Update item allocation status
      const { error: allocationError } = await (supabase as any)
        .from('item_allocations')
        .update({
          status: returnItem.condition === 'lost' ? 'lost' : 
                  returnItem.condition === 'damaged' ? 'damaged' : 'returned',
          returned_at: new Date().toISOString()
        })
        .eq('issuance_id', returnItem.issuance_id)
        .eq('allocated_to', returnItem.returned_by)

      if (allocationError) console.error('Error updating allocation:', allocationError)

      // Update stock levels
      const { error: stockError } = await (supabase as any)
        .from('items_master')
        .update({
          allocated_stock: (returnItem.item as any).allocated_stock - returnItem.quantity,
          current_stock: returnItem.condition === 'lost' 
            ? (returnItem.item as any).current_stock - returnItem.quantity
            : (returnItem.item as any).current_stock
        })
        .eq('id', returnItem.item_id)

      if (stockError) console.error('Error updating stock:', stockError)

      toast.success('Return accepted successfully')
      loadReturns()
      setSelectedReturn(null)
    } catch (error: any) {
      console.error('Error accepting return:', error)
      toast.error('Failed to accept return')
    } finally {
      setActionLoading(false)
    }
  }

  const handleRejectReturn = async () => {
    if (!selectedReturn || !user || !rejectionReason.trim()) return

    setActionLoading(true)
    try {
      const { error } = await (supabase as any)
        .from('returns')
        .update({
          status: 'rejected',
          rejection_reason: rejectionReason,
          accepted_by: user.id,
          accepted_at: new Date().toISOString()
        })
        .eq('id', selectedReturn.id)

      if (error) throw error

      toast.success('Return rejected')
      setShowRejectModal(false)
      setRejectionReason('')
      loadReturns()
      setSelectedReturn(null)
    } catch (error: any) {
      console.error('Error rejecting return:', error)
      toast.error('Failed to reject return')
    } finally {
      setActionLoading(false)
    }
  }

  const filteredReturns = returns.filter(ret => {
    if (!searchQuery) return true
    const search = searchQuery.toLowerCase()
    return (
      ret.return_number.toLowerCase().includes(search) ||
      ret.item?.name?.toLowerCase().includes(search) ||
      ret.returner?.full_name?.toLowerCase().includes(search)
    )
  })

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      accepted: 'bg-green-100 text-green-800 border-green-200',
      rejected: 'bg-red-100 text-red-800 border-red-200',
    }
    return badges[status as keyof typeof badges] || badges.pending
  }

  const getConditionBadge = (condition: string) => {
    const badges = {
      good: 'bg-green-100 text-green-800',
      fair: 'bg-yellow-100 text-yellow-800',
      damaged: 'bg-orange-100 text-orange-800',
      lost: 'bg-red-100 text-red-800',
    }
    return badges[condition as keyof typeof badges] || badges.good
  }

  const canAcceptReturns = hasPermission('accept_returns')

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Returns Management</h1>
        <p className="text-gray-600 mt-1">
          {canAcceptReturns ? 'Accept and process item returns' : 'View your return requests'}
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by return number, item, or returner..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10 w-full"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="input w-full"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Returns List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : filteredReturns.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border">
          <RotateCcw className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No returns found</h3>
          <p className="text-gray-600">
            {searchQuery || statusFilter !== 'all' 
              ? 'Try adjusting your search or filters' 
              : 'No return requests at the moment'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredReturns.map((returnItem) => (
            <div key={returnItem.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{returnItem.return_number}</h3>
                      <span className={`status-badge ${getStatusBadge(returnItem.status)}`}>
                        {returnItem.status.charAt(0).toUpperCase() + returnItem.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Returned by: <span className="font-medium">{returnItem.returner?.full_name}</span>
                    </p>
                  </div>
                </div>

                {/* Item Details */}
                <div className="border rounded-lg p-4 mb-4 bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{returnItem.item?.name}</h4>
                      <p className="text-sm text-gray-600">{returnItem.item?.item_code}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{returnItem.quantity} {returnItem.item?.unit}</div>
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium mt-1 ${getConditionBadge(returnItem.condition)}`}>
                        {returnItem.condition.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {returnItem.serial_numbers && returnItem.serial_numbers.length > 0 && (
                    <div className="text-sm text-gray-600 mt-2">
                      <span className="font-medium">Serial Numbers:</span> {returnItem.serial_numbers.join(', ')}
                    </div>
                  )}
                </div>

                {/* Return Details */}
                <div className="space-y-2 text-sm mb-4">
                  {returnItem.return_reason && (
                    <div>
                      <span className="text-gray-600">Reason:</span>
                      <p className="text-gray-900">{returnItem.return_reason}</p>
                    </div>
                  )}
                  
                  {returnItem.damage_description && (
                    <div className="bg-orange-50 border border-orange-200 rounded p-2">
                      <span className="text-orange-800 font-medium flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4" />
                        Damage Description:
                      </span>
                      <p className="text-orange-900 text-sm mt-1">{returnItem.damage_description}</p>
                      {returnItem.damage_charge > 0 && (
                        <p className="text-orange-900 text-sm font-medium mt-1">
                          Damage Charge: ₹{returnItem.damage_charge.toLocaleString()}
                        </p>
                      )}
                    </div>
                  )}

                  {returnItem.notes && (
                    <div>
                      <span className="text-gray-600">Notes:</span>
                      <p className="text-gray-900">{returnItem.notes}</p>
                    </div>
                  )}

                  {returnItem.rejection_reason && (
                    <div className="bg-red-50 border border-red-200 rounded p-2">
                      <span className="text-red-800 font-medium">Rejection Reason:</span>
                      <p className="text-red-900 text-sm mt-1">{returnItem.rejection_reason}</p>
                    </div>
                  )}
                </div>

                {/* Timeline */}
                <div className="text-xs text-gray-500 border-t pt-3">
                  <p>Returned: {new Date(returnItem.returned_at).toLocaleString('en-IN')}</p>
                  {returnItem.accepted_at && (
                    <p>
                      {returnItem.status === 'accepted' ? 'Accepted' : 'Rejected'}: {new Date(returnItem.accepted_at).toLocaleString('en-IN')}
                      {returnItem.acceptor && ` by ${returnItem.acceptor.full_name}`}
                    </p>
                  )}
                </div>

                {/* Actions */}
                {canAcceptReturns && returnItem.status === 'pending' && (
                  <div className="flex gap-2 mt-4 pt-4 border-t">
                    <button
                      onClick={() => handleAcceptReturn(returnItem)}
                      className="btn btn-success btn-sm flex-1 flex items-center justify-center gap-1"
                      disabled={actionLoading}
                    >
                      <CheckCircle className="w-4 h-4" />
                      Accept
                    </button>
                    <button
                      onClick={() => {
                        setSelectedReturn(returnItem)
                        setShowRejectModal(true)
                      }}
                      className="btn btn-danger btn-sm flex-1 flex items-center justify-center gap-1"
                      disabled={actionLoading}
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedReturn && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4">Reject Return</h2>
            <p className="text-gray-600 mb-4">
              Please provide a reason for rejecting this return request.
            </p>

            <div className="mb-4">
              <label className="label">Rejection Reason *</label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="textarea w-full"
                rows={4}
                placeholder="Explain why this return is being rejected..."
                required
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false)
                  setRejectionReason('')
                  setSelectedReturn(null)
                }}
                className="btn btn-secondary flex-1"
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleRejectReturn}
                className="btn btn-danger flex-1"
                disabled={actionLoading || !rejectionReason.trim()}
              >
                {actionLoading ? 'Rejecting...' : 'Reject Return'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ReturnsPage
