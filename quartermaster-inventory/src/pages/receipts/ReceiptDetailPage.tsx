import React, { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { 
  ChevronLeft, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Package,
  Edit,
  Trash2,
  Download,
  FileText,
  AlertCircle,
  UserCheck
} from 'lucide-react'
import { useAuth } from '@/lib/auth/AuthProvider'
import { ReceiptStatus } from '@/types'
import { 
  useReceipt, 
  useVerifyReceipt, 
  useApproveReceipt, 
  useRejectReceipt,
  useDeleteReceipt,
  useReceiptDocuments 
} from '@/hooks'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { NominationModal } from '@/components/receipts/NominationModal'
import { toast } from 'react-hot-toast'

const ReceiptDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { userProfile, roleName, hasPermission } = useAuth()
  const [showActionModal, setShowActionModal] = useState(false)
  const [actionType, setActionType] = useState<'verify' | 'approve' | 'reject' | null>(null)
  const [comments, setComments] = useState('')
  const [showNominationModal, setShowNominationModal] = useState(false)

  // Fetch receipt data
  const { data: receipt, isLoading, error } = useReceipt(id!)
  const { data: documents } = useReceiptDocuments(id!)
  
  // Mutations
  const { mutate: verify, isPending: isVerifying } = useVerifyReceipt()
  const { mutate: approve, isPending: isApproving } = useApproveReceipt()
  const { mutate: reject, isPending: isRejecting } = useRejectReceipt()
  const { mutate: deleteReceipt, isPending: isDeleting } = useDeleteReceipt()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error || !receipt) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Receipt not found</h3>
          <p className="mt-1 text-sm text-gray-500">The receipt you're looking for doesn't exist.</p>
          <Link to="/receipts" className="mt-4 btn btn-primary">
            Back to Receipts
          </Link>
        </div>
      </div>
    )
  }

  const getStatusBadge = (status: ReceiptStatus) => {
    const config = {
      draft: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Draft', icon: FileText },
      submitted: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Submitted', icon: Clock },
      nominated: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Nominated for Verification', icon: UserCheck },
      verified: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Verified', icon: CheckCircle },
      approved: { bg: 'bg-green-100', text: 'text-green-800', label: 'Approved', icon: CheckCircle },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejected', icon: XCircle },
    }[status]

    const Icon = config.icon

    return (
      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>
        <Icon className="w-4 h-4" />
        {config.label}
      </span>
    )
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const canEdit = receipt.status === 'draft' && receipt.received_by === userProfile?.id
  const canDelete = receipt.status === 'draft' && receipt.received_by === userProfile?.id
  
  // Super Admin can nominate when status is submitted
  const canNominate = receipt.status === 'submitted' && roleName === 'super_admin' && hasPermission('nominate_verifier')
  
  // Semi Super Admin can verify ONLY if nominated to them
  const canVerify = receipt.status === 'nominated' && 
                     roleName === 'semi_super_admin' && 
                     (receipt as any).nominated_to === userProfile?.id &&
                     hasPermission('verify_receipts')
  
  // Admin can approve after verification
  const canApprove = receipt.status === 'verified' && hasPermission('approve_receipts')

  const handleAction = () => {
    if (!actionType) return
    
    const data = { id: receipt.id, comments }
    
    switch (actionType) {
      case 'verify':
        verify(data, {
          onSuccess: () => {
            toast.success('Receipt verified successfully!')
            setShowActionModal(false)
            setComments('')
          }
        })
        break
      case 'approve':
        approve(data, {
          onSuccess: () => {
            toast.success('Receipt approved successfully!')
            setShowActionModal(false)
            setComments('')
          }
        })
        break
      case 'reject':
        if (!comments.trim()) {
          toast.error('Please provide a reason for rejection')
          return
        }
        reject(data, {
          onSuccess: () => {
            toast.success('Receipt rejected successfully!')
            setShowActionModal(false)
            setComments('')
          }
        })
        break
    }
  }

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this receipt? This action cannot be undone.')) {
      deleteReceipt(receipt.id, {
        onSuccess: () => {
          toast.success('Receipt deleted successfully!')
          navigate('/receipts')
        }
      })
    }
  }

  const handleActionClick = (type: 'verify' | 'approve' | 'reject') => {
    setActionType(type)
    setShowActionModal(true)
  }

  const timeline = [
    {
      status: 'created',
      label: 'Created',
      date: receipt.created_at,
      user: receipt.received_by_user?.full_name || 'Unknown',
      completed: true,
    },
    {
      status: 'submitted',
      label: 'Submitted',
      date: receipt.status !== 'draft' ? receipt.created_at : null,
      user: receipt.received_by_user?.full_name || 'Unknown',
      completed: receipt.status !== 'draft',
    },
    {
      status: 'nominated',
      label: 'Nominated for Verification',
      date: (receipt as any).nominated_at,
      user: (receipt as any).nominated_by_user?.full_name 
        ? `Nominated ${(receipt as any).nominated_to_user?.full_name || 'officer'} by ${(receipt as any).nominated_by_user?.full_name}`
        : null,
      completed: !!(receipt as any).nominated_at,
    },
    {
      status: 'verified',
      label: 'Verified',
      date: receipt.verified_at,
      user: receipt.verified_by_user?.full_name || 'Unknown',
      completed: !!receipt.verified_at,
    },
    {
      status: 'approved',
      label: 'Approved',
      date: receipt.approved_at,
      user: receipt.approved_by_user?.full_name || 'Unknown',
      completed: !!receipt.approved_at,
    },
  ].filter((item, index) => {
    // Don't show future steps for rejected receipts
    if (receipt.status === 'rejected') {
      if (item.status === 'approved') return false
      if (item.status === 'verified' && !receipt.verified_at) return false
      if (item.status === 'nominated' && !(receipt as any).nominated_at) return false
    }
    return true
  })

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate('/receipts')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Receipts
        </button>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {(receipt as any).iv_number || receipt.grn_number}
            </h1>
            <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
              <div>
                <span className="font-medium">IV Number:</span> {(receipt as any).iv_number || 'N/A'}
              </div>
              {receipt.grn_number && (
                <div>
                  <span className="font-medium">RV Number:</span> {receipt.grn_number}
                </div>
              )}
              <div>
                <span className="font-medium">Created:</span> {formatDate(receipt.created_at)}
              </div>
            </div>
          </div>
          <div>{getStatusBadge(receipt.status)}</div>
        </div>
      </div>

      {/* Status Timeline */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Status Timeline</h2>
        <div className="relative">
          {timeline.map((item, index) => (
            <div key={item.status} className="flex gap-4 pb-8 last:pb-0">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    item.completed
                      ? 'bg-green-100 text-green-800'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {item.completed ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <Clock className="w-5 h-5" />
                  )}
                </div>
                {index < timeline.length - 1 && (
                  <div
                    className={`w-0.5 flex-1 mt-2 ${
                      item.completed ? 'bg-green-500' : 'bg-muted'
                    }`}
                    style={{ minHeight: '2rem' }}
                  />
                )}
              </div>
              <div className="flex-1 pt-1">
                <div className="font-medium text-foreground">{item.label}</div>
                {item.date && (
                  <div className="text-sm text-muted-foreground">
                    {formatDate(item.date)}
                    {item.user && ` by ${item.user}`}
                  </div>
                )}
                {!item.completed && (
                  <div className="text-sm text-muted-foreground">Pending</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Receipt Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Receipt Information</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground">IV Number</div>
              <div className="text-foreground">{(receipt as any).iv_number || '-'}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">RV Number</div>
              <div className="text-foreground">
                {receipt.grn_number || <span className="italic text-muted-foreground">Pending Verification</span>}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Received From</div>
              <div className="text-foreground">{(receipt as any).received_from || '-'}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Supplier Name</div>
              <div className="text-foreground">{(receipt as any).supplier_name || '-'}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Receipt Date</div>
              <div className="text-foreground">{formatDate((receipt as any).receipt_date || receipt.created_at)}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Invoice Number</div>
              <div className="text-foreground">{(receipt as any).invoice_number || '-'}</div>
            </div>
          </div>

          <div>
            <div className="text-sm font-medium text-muted-foreground">Total Items</div>
            <div className="text-foreground font-semibold">{(receipt as any).total_items || 0}</div>
          </div>

          {(receipt as any).remarks && (
            <div>
              <div className="text-sm font-medium text-muted-foreground">Remarks</div>
              <div className="text-foreground">{(receipt as any).remarks}</div>
            </div>
          )}
        </div>

        {/* Nomination Details */}
        {(receipt.status === 'nominated' || receipt.status === 'verified' || receipt.status === 'approved') && (receipt as any).nominated_to && (
          <div className="card p-6 space-y-4 lg:col-span-2">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-blue-600" />
              Verification Nomination
            </h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="font-medium text-blue-900 mb-1">Nominated By</div>
                  <div className="text-blue-800">{(receipt as any).nominated_by_user?.full_name || 'Commandant'}</div>
                  <div className="text-xs text-blue-600">{formatDate((receipt as any).nominated_at)}</div>
                </div>
                <div>
                  <div className="font-medium text-blue-900 mb-1">Nominated To</div>
                  <div className="text-blue-800">{(receipt as any).nominated_to_user?.full_name || 'Additional Commandant'}</div>
                  <div className="text-xs text-blue-600">{(receipt as any).nominated_to_user?.rank || 'Verification Officer'}</div>
                </div>
                <div>
                  <div className="font-medium text-blue-900 mb-1">Status</div>
                  <div className="text-blue-800">
                    {receipt.status === 'nominated' && '⏳ Pending Verification'}
                    {receipt.status === 'verified' && '✅ Verified'}
                    {receipt.status === 'approved' && '✅ Approved'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Items Section */}
      <div className="grid grid-cols-1 gap-6">

        <div className="card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Additional Information</h2>
          
          <div>
            <div className="text-sm font-medium text-muted-foreground">Received By</div>
            <div className="text-foreground">{receipt.received_by_user?.full_name || 'Unknown'}</div>
          </div>

          <div>
            <div className="text-sm font-medium text-muted-foreground">Created At</div>
            <div className="text-foreground">{formatDate(receipt.created_at)}</div>
          </div>

          {/* Documents Section */}
          {documents && documents.length > 0 && (
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-2">Attached Documents</div>
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-500" />
                      <span className="text-sm">{doc.file_name}</span>
                    </div>
                    <button
                      onClick={() => {
                        // Use file_path or construct download URL
                        const downloadUrl = doc.file_path || `/api/documents/${doc.id}/download`
                        window.open(downloadUrl, '_blank')
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {receipt.status === 'rejected' && receipt.remarks && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="text-sm font-medium text-red-800 mb-1">Rejection Reason</div>
              <div className="text-sm text-red-700">{receipt.remarks}</div>
            </div>
          )}
        </div>
      </div>

      {/* Receipt Items */}
      {(receipt as any).receipt_items && (receipt as any).receipt_items.length > 0 && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Items</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                    Item Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                    Quantity Received
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                    Condition
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {(receipt as any).receipt_items.map((item: any) => (
                  <tr key={item.id} className="hover:bg-muted/50">
                    <td className="px-4 py-3 text-sm">
                      <div className="font-medium text-foreground">
                        {item.item?.nomenclature || item.item_name || 'N/A'}
                      </div>
                      {item.description && (
                        <div className="text-xs text-muted-foreground mt-1">{item.description}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      {item.quantity_received || item.challan_quantity || 0} {item.unit_of_measure || ''}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                        item.condition === 'new' ? 'bg-green-100 text-green-800' :
                        item.condition === 'good' ? 'bg-blue-100 text-blue-800' :
                        item.condition === 'fair' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {item.condition || 'N/A'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="card p-6">
        <div className="flex flex-wrap gap-3">
          {canEdit && (
            <Link to={`/receipts/${id}/edit`} className="btn btn-secondary flex items-center gap-2">
              <Edit className="w-4 h-4" />
              Edit
            </Link>
          )}

          {canDelete && (
            <button 
              onClick={handleDelete}
              disabled={isDeleting}
              className="btn btn-danger flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          )}

          {canNominate && (
            <button
              onClick={() => setShowNominationModal(true)}
              className="btn btn-primary flex items-center gap-2"
            >
              <UserCheck className="w-4 h-4" />
              Nominate for Verification
            </button>
          )}

          {canVerify && (
            <>
              <button
                onClick={() => handleActionClick('verify')}
                disabled={isVerifying}
                className="btn btn-success flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                {isVerifying ? 'Verifying...' : 'Verify Receipt'}
              </button>
              <button
                onClick={() => handleActionClick('reject')}
                disabled={isRejecting}
                className="btn btn-danger flex items-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                {isRejecting ? 'Rejecting...' : 'Reject'}
              </button>
            </>
          )}

          {canApprove && (
            <>
              <button
                onClick={() => handleActionClick('approve')}
                disabled={isApproving}
                className="btn btn-success flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                {isApproving ? 'Approving...' : 'Approve Receipt'}
              </button>
              <button
                onClick={() => handleActionClick('reject')}
                disabled={isRejecting}
                className="btn btn-danger flex items-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                {isRejecting ? 'Rejecting...' : 'Reject'}
              </button>
            </>
          )}

          <button className="btn btn-secondary flex items-center gap-2 ml-auto">
            <Download className="w-4 h-4" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Action Modal */}
      {showActionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              {actionType === 'verify' && 'Verify Receipt'}
              {actionType === 'approve' && 'Approve Receipt'}
              {actionType === 'reject' && 'Reject Receipt'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {actionType === 'reject'
                ? 'Please provide a reason for rejection:'
                : 'Add any comments (optional):'}
            </p>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="input w-full"
              rows={4}
              placeholder={actionType === 'reject' ? 'Rejection reason...' : 'Comments...'}
              required={actionType === 'reject'}
            />
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowActionModal(false)
                  setComments('')
                }}
                className="btn btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleAction}
                disabled={(actionType === 'reject' && !comments.trim()) || isVerifying || isApproving || isRejecting}
                className={`btn ${actionType === 'reject' ? 'btn-danger' : 'btn-success'} flex-1`}
              >
                {isVerifying || isApproving || isRejecting ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Nomination Modal */}
      <NominationModal
        isOpen={showNominationModal}
        onClose={() => setShowNominationModal(false)}
        receiptId={receipt.id}
        receiptNumber={(receipt as any).iv_number || receipt.grn_number}
        onSuccess={() => {
          // Refresh receipt data
          window.location.reload()
        }}
      />
    </div>
  )
}

export default ReceiptDetailPage
