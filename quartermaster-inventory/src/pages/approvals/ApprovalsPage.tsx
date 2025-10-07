import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle, XCircle, Clock, Package, AlertCircle } from 'lucide-react'
import { useAuth } from '@/lib/auth/AuthProvider'
import { ReceiptStatus } from '@/types'
import { usePendingApprovals, useVerifyReceipt, useApproveReceipt, useRejectReceipt } from '@/hooks'
import { useAuditLogs } from '@/hooks'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { toast } from 'react-hot-toast'

const ApprovalsPage: React.FC = () => {
  const { roleName, hasPermission, userProfile } = useAuth()
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending')
  const [selectedReceipts, setSelectedReceipts] = useState<string[]>([])
  const [actionComments, setActionComments] = useState<Record<string, string>>({})

  // Fetch pending approvals
  const { data: pendingData, isLoading: pendingLoading } = usePendingApprovals()
  const receipts = pendingData?.data || []

  // Fetch approval history
  const historyFilters = React.useMemo(() => {
    const f: any = { table_name: 'stock_receipts', action: 'UPDATE' }
    if (userProfile?.id) f.user_id = userProfile.id
    return f
  }, [userProfile?.id])

  const { data: historyData, isLoading: historyLoading } = useAuditLogs(historyFilters, 1, 50)
  const history = historyData?.data || []

  // Mutations
  const { mutate: verify, isPending: isVerifying } = useVerifyReceipt()
  const { mutate: approve, isPending: isApproving } = useApproveReceipt()
  const { mutate: reject, isPending: isRejecting } = useRejectReceipt()

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status: ReceiptStatus) => {
    const config = {
      draft: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Draft' },
      submitted: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Submitted' },
      verified: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Verified' },
      approved: { bg: 'bg-green-100', text: 'text-green-800', label: 'Approved' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejected' },
    }[status]

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    )
  }

  const handleSelectReceipt = (id: string) => {
    setSelectedReceipts((prev) =>
      prev.includes(id) ? prev.filter((rid) => rid !== id) : [...prev, id]
    )
  }

  const handleSelectAll = () => {
    if (selectedReceipts.length === receipts.length) {
      setSelectedReceipts([])
    } else {
      setSelectedReceipts(receipts.map((r) => r.id))
    }
  }

  const handleVerify = (id: string) => {
    const comments = actionComments[id]
    verify({ id, comments }, {
      onSuccess: () => {
        setSelectedReceipts(prev => prev.filter(rid => rid !== id))
        setActionComments(prev => ({ ...prev, [id]: '' }))
      }
    })
  }

  const handleApprove = (id: string) => {
    const comments = actionComments[id]
    approve({ id, comments }, {
      onSuccess: () => {
        setSelectedReceipts(prev => prev.filter(rid => rid !== id))
        setActionComments(prev => ({ ...prev, [id]: '' }))
      }
    })
  }

  const handleReject = (id: string) => {
    const comments = actionComments[id] || ''
    if (!comments.trim()) {
      toast.error('Please provide a reason for rejection')
      return
    }
    reject({ id, comments }, {
      onSuccess: () => {
        setSelectedReceipts(prev => prev.filter(rid => rid !== id))
        setActionComments(prev => ({ ...prev, [id]: '' }))
      }
    })
  }

  const handleBulkAction = (action: 'verify' | 'approve' | 'reject') => {
    if (selectedReceipts.length === 0) {
      toast.error('Please select at least one receipt')
      return
    }

    if (action === 'reject') {
      toast.error('Bulk reject is not supported. Please reject receipts individually with comments.')
      return
    }

    selectedReceipts.forEach(id => {
      if (action === 'verify') handleVerify(id)
      else if (action === 'approve') handleApprove(id)
    })
  }

  const canVerify = hasPermission('verify_receipt')
  const canApprove = hasPermission('approve_receipt')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Approvals</h1>
        <p className="mt-1 text-muted-foreground">
          Review and approve pending receipts
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('pending')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'pending'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
            }`}
          >
            Pending Approvals
            <span className="ml-2 bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs">
              {pendingLoading ? '...' : receipts.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'history'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
            }`}
          >
            History
          </button>
        </nav>
      </div>

      {/* Pending Approvals Tab */}
      {activeTab === 'pending' && pendingLoading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : activeTab === 'pending' && (
        <div className="space-y-4">
          {/* Bulk Actions */}
          {selectedReceipts.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-900">
                  {selectedReceipts.length} receipt(s) selected
                </span>
                <div className="flex gap-3">
                  {canVerify && (
                    <button 
                      onClick={() => handleBulkAction('verify')}
                      disabled={isVerifying}
                      className="btn btn-success btn-sm"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Verify Selected
                    </button>
                  )}
                  {canApprove && (
                    <button 
                      onClick={() => handleBulkAction('approve')}
                      disabled={isApproving}
                      className="btn btn-success btn-sm"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve Selected
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedReceipts([])}
                    className="btn btn-secondary btn-sm"
                  >
                    Clear Selection
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Select All */}
          {receipts.length > 0 && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedReceipts.length === receipts.length && receipts.length > 0}
                onChange={handleSelectAll}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-muted-foreground">Select all</span>
            </div>
          )}

          {/* Receipt Cards */}
          {receipts.length === 0 ? (
            <div className="card p-12 text-center">
              <CheckCircle className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-medium text-foreground">No pending approvals</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                All receipts have been processed
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {receipts.map((receipt) => (
                <div key={receipt.id} className="card p-6">
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={selectedReceipts.includes(receipt.id)}
                      onChange={() => handleSelectReceipt(receipt.id)}
                      className="mt-1 rounded border-gray-300"
                    />

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Link
                            to={`/receipts/${receipt.id}`}
                            className="text-lg font-semibold text-primary hover:text-primary/80"
                          >
                            {receipt.grn_number}
                          </Link>
                          {getStatusBadge(receipt.status)}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(receipt.created_at || receipt.receipt_date)}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Supplier</div>
                          <div className="text-sm font-medium text-foreground">
                            {receipt.supplier_name}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Challan No</div>
                          <div className="text-sm font-medium text-foreground">
                            {receipt.challan_number}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Received By</div>
                          <div className="text-sm font-medium text-foreground">
                            {receipt.received_by_user?.full_name || 'Unknown'}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Status</div>
                          <div className="text-sm font-medium text-foreground">
                            {receipt.status === 'submitted' && 'Awaiting Verification'}
                            {receipt.status === 'verified' && 'Awaiting Approval'}
                          </div>
                        </div>
                      </div>

                      {/* Comments Input */}
                      <div className="mb-4">
                        <label className="text-xs text-muted-foreground mb-1 block">
                          Comments (optional for approval/verify, required for reject)
                        </label>
                        <input
                          type="text"
                          value={actionComments[receipt.id] || ''}
                          onChange={(e) => setActionComments(prev => ({ ...prev, [receipt.id]: e.target.value }))}
                          placeholder="Add your comments..."
                          className="input text-sm"
                        />
                      </div>

                      {/* Actions */}
                      <div className="flex gap-3">
                        <Link
                          to={`/receipts/${receipt.id}`}
                          className="btn btn-secondary btn-sm"
                        >
                          View Details
                        </Link>

                        {receipt.status === 'submitted' && canVerify && (
                          <>
                            <button 
                              onClick={() => handleVerify(receipt.id)}
                              disabled={isVerifying}
                              className="btn btn-success btn-sm"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              {isVerifying ? 'Verifying...' : 'Verify'}
                            </button>
                            <button 
                              onClick={() => handleReject(receipt.id)}
                              disabled={isRejecting}
                              className="btn btn-danger btn-sm"
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              {isRejecting ? 'Rejecting...' : 'Reject'}
                            </button>
                          </>
                        )}

                        {receipt.status === 'verified' && canApprove && (
                          <>
                            <button 
                              onClick={() => handleApprove(receipt.id)}
                              disabled={isApproving}
                              className="btn btn-success btn-sm"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              {isApproving ? 'Approving...' : 'Approve'}
                            </button>
                            <button 
                              onClick={() => handleReject(receipt.id)}
                              disabled={isRejecting}
                              className="btn btn-danger btn-sm"
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              {isRejecting ? 'Rejecting...' : 'Reject'}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && historyLoading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : activeTab === 'history' && (
        <div className="space-y-4">
          {history.length === 0 ? (
            <div className="card p-12 text-center">
              <Clock className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-medium text-foreground">No history yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Your approval history will appear here
              </p>
            </div>
          ) : (
            <div className="card">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                        Receipt ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                        Item
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                        Action
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                        Created By
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-card divide-y divide-border">
                    {history.map((item) => (
                      <tr key={item.id} className="hover:bg-muted/50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link
                            to={`/receipts/${item.record_id}`}
                            className="text-sm font-medium text-primary hover:text-primary/80"
                          >
                            {item.record_id?.slice(0, 8)}...
                          </Link>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-foreground">{item.table_name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {item.action}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                          {formatDate(item.timestamp || new Date().toISOString())}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                          {item.user?.full_name || 'System'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ApprovalsPage
