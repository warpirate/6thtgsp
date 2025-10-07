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
  AlertCircle
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
import { toast } from 'react-hot-toast'

const ReceiptDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { userProfile, roleName, hasPermission } = useAuth()
  const [showActionModal, setShowActionModal] = useState(false)
  const [actionType, setActionType] = useState<'verify' | 'approve' | 'reject' | null>(null)
  const [comments, setComments] = useState('')

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
  const canVerify = receipt.status === 'submitted' && hasPermission('verify_receipt')
  const canApprove = receipt.status === 'verified' && hasPermission('approve_receipt')

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
            <h1 className="text-3xl font-bold text-foreground">{receipt.grn_number}</h1>
            <p className="mt-1 text-muted-foreground">
              Created on {formatDate(receipt.created_at)}
            </p>
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
          <h2 className="text-lg font-semibold text-foreground">Item Details</h2>
          
          <div>
            <div className="text-sm font-medium text-muted-foreground">Supplier Name</div>
            <div className="text-foreground">{receipt.supplier_name}</div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Challan Number</div>
              <div className="text-foreground">{receipt.challan_number}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Challan Date</div>
              <div className="text-foreground">
                {formatDate(receipt.challan_date)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Receipt Date</div>
              <div className="text-foreground">{formatDate(receipt.receipt_date)}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Vehicle Number</div>
              <div className="text-foreground">{receipt.vehicle_number || '-'}</div>
            </div>
          </div>

          {receipt.remarks && (
            <div>
              <div className="text-sm font-medium text-muted-foreground">Remarks</div>
              <div className="text-foreground">{receipt.remarks}</div>
            </div>
          )}
        </div>

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
    </div>
  )
}

export default ReceiptDetailPage
