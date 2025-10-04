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
  FileText
} from 'lucide-react'
import { useAuth } from '@/lib/auth/AuthProvider'
import { ReceiptStatus } from '@/types'

// Mock receipt data - replace with actual API call
const mockReceipt = {
  id: '1',
  receipt_id: 'REC-2024-001',
  item_name: 'Laptop Dell XPS 15',
  quantity: 5,
  unit: 'units',
  description: 'High-performance laptops for development team',
  unit_price: 1299.99,
  supplier: 'Dell Direct',
  purchase_date: '2024-09-25',
  status: 'submitted' as ReceiptStatus,
  created_at: '2024-10-01T10:00:00Z',
  submitted_at: '2024-10-01T14:00:00Z',
  verified_at: null as string | null,
  approved_at: null as string | null,
  created_by_user: { id: '1', full_name: 'John Smith' },
  verified_by_user: null as { id: string; full_name: string } | null,
  approved_by_user: null as { id: string; full_name: string } | null,
  rejection_reason: null as string | null,
}

const ReceiptDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { userProfile, roleName, hasPermission } = useAuth()
  const [receipt] = useState(mockReceipt)
  const [showActionModal, setShowActionModal] = useState(false)
  const [actionType, setActionType] = useState<'verify' | 'approve' | 'reject' | null>(null)
  const [comments, setComments] = useState('')

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

  const canEdit = receipt.status === 'draft' && receipt.created_by_user.id === userProfile?.id
  const canDelete = receipt.status === 'draft' && receipt.created_by_user.id === userProfile?.id
  const canVerify = receipt.status === 'submitted' && hasPermission('verify_receipt')
  const canApprove = receipt.status === 'verified' && hasPermission('approve_receipt')

  const handleAction = (type: 'verify' | 'approve' | 'reject') => {
    setActionType(type)
    setShowActionModal(true)
  }

  const confirmAction = async () => {
    try {
      // TODO: Call API to perform action
      console.log(`${actionType} receipt with comments:`, comments)
      alert(`Receipt ${actionType}d successfully!`)
      setShowActionModal(false)
      setComments('')
      // Refresh receipt data here
    } catch (error) {
      console.error('Error performing action:', error)
      alert('Failed to perform action')
    }
  }

  const timeline = [
    {
      status: 'created',
      label: 'Created',
      date: receipt.created_at,
      user: receipt.created_by_user?.full_name,
      completed: true,
    },
    {
      status: 'submitted',
      label: 'Submitted',
      date: receipt.submitted_at,
      user: receipt.created_by_user?.full_name,
      completed: !!receipt.submitted_at,
    },
    {
      status: 'verified',
      label: 'Verified',
      date: receipt.verified_at,
      user: receipt.verified_by_user?.full_name,
      completed: !!receipt.verified_at,
    },
    {
      status: 'approved',
      label: 'Approved',
      date: receipt.approved_at,
      user: receipt.approved_by_user?.full_name,
      completed: !!receipt.approved_at,
    },
  ]

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
            <h1 className="text-3xl font-bold text-foreground">{receipt.receipt_id}</h1>
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
            <div className="text-sm font-medium text-muted-foreground">Item Name</div>
            <div className="text-foreground">{receipt.item_name}</div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Quantity</div>
              <div className="text-foreground">{receipt.quantity} {receipt.unit}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Unit Price</div>
              <div className="text-foreground">
                {receipt.unit_price ? `$${receipt.unit_price.toFixed(2)}` : '-'}
              </div>
            </div>
          </div>

          <div>
            <div className="text-sm font-medium text-muted-foreground">Total Value</div>
            <div className="text-lg font-semibold text-foreground">
              {receipt.unit_price
                ? `$${(receipt.quantity * receipt.unit_price).toFixed(2)}`
                : '-'}
            </div>
          </div>

          {receipt.description && (
            <div>
              <div className="text-sm font-medium text-muted-foreground">Description</div>
              <div className="text-foreground">{receipt.description}</div>
            </div>
          )}
        </div>

        <div className="card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Additional Information</h2>
          
          {receipt.supplier && (
            <div>
              <div className="text-sm font-medium text-muted-foreground">Supplier</div>
              <div className="text-foreground">{receipt.supplier}</div>
            </div>
          )}

          {receipt.purchase_date && (
            <div>
              <div className="text-sm font-medium text-muted-foreground">Purchase Date</div>
              <div className="text-foreground">
                {new Date(receipt.purchase_date).toLocaleDateString()}
              </div>
            </div>
          )}

          <div>
            <div className="text-sm font-medium text-muted-foreground">Created By</div>
            <div className="text-foreground">{receipt.created_by_user.full_name}</div>
          </div>

          {receipt.rejection_reason && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="text-sm font-medium text-red-800 mb-1">Rejection Reason</div>
              <div className="text-sm text-red-700">{receipt.rejection_reason}</div>
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
            <button className="btn btn-danger flex items-center gap-2">
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          )}

          {canVerify && (
            <>
              <button
                onClick={() => handleAction('verify')}
                className="btn btn-success flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Verify Receipt
              </button>
              <button
                onClick={() => handleAction('reject')}
                className="btn btn-danger flex items-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                Reject
              </button>
            </>
          )}

          {canApprove && (
            <>
              <button
                onClick={() => handleAction('approve')}
                className="btn btn-success flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Approve Receipt
              </button>
              <button
                onClick={() => handleAction('reject')}
                className="btn btn-danger flex items-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                Reject
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
                onClick={confirmAction}
                className={`btn ${actionType === 'reject' ? 'btn-danger' : 'btn-success'} flex-1`}
                disabled={actionType === 'reject' && !comments.trim()}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ReceiptDetailPage
