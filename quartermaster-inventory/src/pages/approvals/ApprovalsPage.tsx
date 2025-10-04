import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle, XCircle, Clock, Package, AlertCircle } from 'lucide-react'
import { useAuth } from '@/lib/auth/AuthProvider'
import { ReceiptStatus } from '@/types'

// Mock data - replace with actual API calls
const mockPendingReceipts = [
  {
    id: '2',
    receipt_id: 'REC-2024-002',
    item_name: 'Office Chairs',
    quantity: 20,
    unit: 'units',
    status: 'submitted' as ReceiptStatus,
    created_at: '2024-10-02T14:30:00Z',
    submitted_at: '2024-10-02T14:30:00Z',
    created_by_user: { full_name: 'Jane Doe' },
  },
  {
    id: '4',
    receipt_id: 'REC-2024-004',
    item_name: 'Network Cables',
    quantity: 50,
    unit: 'meters',
    status: 'verified' as ReceiptStatus,
    created_at: '2024-10-03T11:00:00Z',
    verified_at: '2024-10-03T15:00:00Z',
    created_by_user: { full_name: 'Sarah Wilson' },
  },
]

const mockHistory = [
  {
    id: '1',
    receipt_id: 'REC-2024-001',
    item_name: 'Laptop Dell XPS 15',
    quantity: 5,
    unit: 'units',
    status: 'approved' as ReceiptStatus,
    action: 'approved' as const,
    action_date: '2024-10-01T16:00:00Z',
    action_by: 'Current User',
    created_by_user: { full_name: 'John Smith' },
  },
]

const ApprovalsPage: React.FC = () => {
  const { roleName, hasPermission } = useAuth()
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending')
  const [selectedReceipts, setSelectedReceipts] = useState<string[]>([])

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
    if (selectedReceipts.length === mockPendingReceipts.length) {
      setSelectedReceipts([])
    } else {
      setSelectedReceipts(mockPendingReceipts.map((r) => r.id))
    }
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
              {mockPendingReceipts.length}
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
      {activeTab === 'pending' && (
        <div className="space-y-4">
          {/* Bulk Actions */}
          {selectedReceipts.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-900">
                  {selectedReceipts.length} receipt(s) selected
                </span>
                <div className="flex gap-3">
                  <button className="btn btn-success btn-sm">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve Selected
                  </button>
                  <button className="btn btn-danger btn-sm">
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject Selected
                  </button>
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
          {mockPendingReceipts.length > 0 && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedReceipts.length === mockPendingReceipts.length}
                onChange={handleSelectAll}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-muted-foreground">Select all</span>
            </div>
          )}

          {/* Receipt Cards */}
          {mockPendingReceipts.length === 0 ? (
            <div className="card p-12 text-center">
              <CheckCircle className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-medium text-foreground">No pending approvals</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                All receipts have been processed
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {mockPendingReceipts.map((receipt) => (
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
                            {receipt.receipt_id}
                          </Link>
                          {getStatusBadge(receipt.status)}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(receipt.submitted_at || receipt.created_at)}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Item</div>
                          <div className="text-sm font-medium text-foreground">
                            {receipt.item_name}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Quantity</div>
                          <div className="text-sm font-medium text-foreground">
                            {receipt.quantity} {receipt.unit}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Submitted By</div>
                          <div className="text-sm font-medium text-foreground">
                            {receipt.created_by_user.full_name}
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
                            <button className="btn btn-success btn-sm">
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Verify
                            </button>
                            <button className="btn btn-danger btn-sm">
                              <XCircle className="w-4 h-4 mr-1" />
                              Reject
                            </button>
                          </>
                        )}

                        {receipt.status === 'verified' && canApprove && (
                          <>
                            <button className="btn btn-success btn-sm">
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Approve
                            </button>
                            <button className="btn btn-danger btn-sm">
                              <XCircle className="w-4 h-4 mr-1" />
                              Reject
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
      {activeTab === 'history' && (
        <div className="space-y-4">
          {mockHistory.length === 0 ? (
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
                    {mockHistory.map((item) => (
                      <tr key={item.id} className="hover:bg-muted/50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link
                            to={`/receipts/${item.id}`}
                            className="text-sm font-medium text-primary hover:text-primary/80"
                          >
                            {item.receipt_id}
                          </Link>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-foreground">{item.item_name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              item.action === 'approved'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {item.action === 'approved' ? (
                              <CheckCircle className="w-3 h-3" />
                            ) : (
                              <XCircle className="w-3 h-3" />
                            )}
                            {item.action.charAt(0).toUpperCase() + item.action.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                          {formatDate(item.action_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                          {item.created_by_user.full_name}
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
