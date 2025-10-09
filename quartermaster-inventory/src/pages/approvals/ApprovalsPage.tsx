import React, { useState, useEffect } from 'react'
import { CheckCircle, Clock, AlertTriangle, FileText, X, Check, MessageSquare } from 'lucide-react'
import { useAuth } from '@/lib/auth/AuthProvider'
import { supabase } from '@/lib/supabase'
import { toast } from 'react-hot-toast'
import { RequisitionWithDetails, StockReceiptWithDetails, RequisitionStatus } from '@/types'
import { format } from 'date-fns'
import { useNavigate } from 'react-router-dom'

const ApprovalsPage: React.FC = () => {
  const { hasPermission, user } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'requisitions' | 'receipts'>('requisitions')
  const [requisitions, setRequisitions] = useState<RequisitionWithDetails[]>([])
  const [receipts, setReceipts] = useState<StockReceiptWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [approving, setApproving] = useState<string | null>(null)
  const [selectedRequisition, setSelectedRequisition] = useState<RequisitionWithDetails | null>(null)
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [approvalComments, setApprovalComments] = useState('')

  // Load pending requisitions
  const loadPendingRequisitions = async () => {
    try {
      setLoading(true)
      const { data, error } = await (supabase as any)
        .from('requisitions')
        .select(`
          *,
          requester:users!requester_id(id, full_name, email, department, badge_number),
          items:requisition_items(
            *,
            item:items_master(
              *,
              category:item_categories(*)
            )
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading requisitions:', error)
        // Don't show error toast if it's just empty data
        if (error.code !== 'PGRST116') {
          toast.error('Failed to load pending requisitions')
        }
        setRequisitions([])
        return
      }

      setRequisitions((data as unknown as RequisitionWithDetails[]) || [])
    } catch (error) {
      console.error('Unexpected error:', error)
      // Only show error if it's not a "no data" scenario
      setRequisitions([])
    } finally {
      setLoading(false)
    }
  }

  // Load pending receipts (verified, waiting for final approval)
  const loadPendingReceipts = async () => {
    try {
      setLoading(true)
      const { data, error } = await (supabase as any)
        .from('stock_receipts')
        .select(`
          *,
          received_by_user:users!received_by(id, full_name, email),
          verified_by_user:users!verified_by(id, full_name, email),
          receipt_items(
            *,
            item:items_master(*)
          )
        `)
        .eq('status', 'verified')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading receipts:', error)
        // Don't show error toast if it's just empty data
        if (error.code !== 'PGRST116') {
          toast.error('Failed to load pending receipts')
        }
        setReceipts([])
        return
      }

      setReceipts((data as unknown as StockReceiptWithDetails[]) || [])
    } catch (error) {
      console.error('Unexpected error:', error)
      setReceipts([])
    } finally {
      setLoading(false)
    }
  }

  // Load data on mount
  useEffect(() => {
    if (activeTab === 'requisitions') {
      loadPendingRequisitions()
    } else {
      loadPendingReceipts()
    }
  }, [activeTab])

  // Handle approve requisition
  const handleApproveRequisition = async (requisition: RequisitionWithDetails) => {
    setSelectedRequisition(requisition)
    setShowApprovalModal(true)
  }

  // Confirm approval
  const confirmApproval = async () => {
    if (!selectedRequisition || !user) return

    setApproving(selectedRequisition.id)
    try {
      const { error } = await supabase
        .from('requisitions')
        .update({
          status: 'approved' as RequisitionStatus,
          approved_by: user.id,
          approved_at: new Date().toISOString(),
          approval_comments: approvalComments || null
        })
        .eq('id', selectedRequisition.id)

      if (error) throw error

      toast.success(`Requisition ${selectedRequisition.requisition_number} approved successfully`)
      setShowApprovalModal(false)
      setApprovalComments('')
      setSelectedRequisition(null)
      loadPendingRequisitions()
    } catch (error: any) {
      console.error('Error approving requisition:', error)
      toast.error(error.message || 'Failed to approve requisition')
    } finally {
      setApproving(null)
    }
  }

  // Handle reject requisition
  const handleRejectRequisition = async (requisition: RequisitionWithDetails, reason: string) => {
    if (!user) return

    setApproving(requisition.id)
    try {
      const { error } = await supabase
        .from('requisitions')
        .update({
          status: 'rejected' as RequisitionStatus,
          approved_by: user.id,
          approved_at: new Date().toISOString(),
          rejection_reason: reason
        })
        .eq('id', requisition.id)

      if (error) throw error

      toast.success(`Requisition ${requisition.requisition_number} rejected`)
      loadPendingRequisitions()
    } catch (error: any) {
      console.error('Error rejecting requisition:', error)
      toast.error(error.message || 'Failed to reject requisition')
    } finally {
      setApproving(null)
    }
  }

  // Handle approve receipt
  const handleApproveReceipt = async (receiptId: string) => {
    if (!user) return

    setApproving(receiptId)
    try {
      const { error } = await supabase
        .from('stock_receipts')
        .update({
          status: 'approved',
          approved_by: user.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', receiptId)

      if (error) throw error

      toast.success('Receipt approved successfully')
      loadPendingReceipts()
    } catch (error: any) {
      console.error('Error approving receipt:', error)
      toast.error(error.message || 'Failed to approve receipt')
    } finally {
      setApproving(null)
    }
  }

  // Calculate total requested value
  const calculateTotalValue = (req: RequisitionWithDetails): number => {
    return req.items?.reduce((sum, item) => {
      const price = item.unit_price || (item.item as any)?.unit_price || 0
      return sum + (price * item.quantity_requested)
    }, 0) || 0
  }

  const pendingRequisitionsCount = requisitions.length
  const pendingReceiptsCount = receipts.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Approvals</h1>
        <p className="mt-1 text-muted-foreground">
          Review and approve pending requisitions and receipts
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('requisitions')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'requisitions'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
            }`}
          >
            Requisitions
            {pendingRequisitionsCount > 0 && (
              <span className="ml-2 bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs">
                {pendingRequisitionsCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('receipts')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'receipts'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
            }`}
          >
            Stock Receipts
            {pendingReceiptsCount > 0 && (
              <span className="ml-2 bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs">
                {pendingReceiptsCount}
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="card p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
        </div>
      )}

      {/* Requisitions Tab */}
      {!loading && activeTab === 'requisitions' && (
        <div className="space-y-4">
          {requisitions.length === 0 ? (
            <div className="card p-12 text-center">
              <CheckCircle className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-medium text-foreground">No pending approvals</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                All requisitions have been processed. New submissions will appear here.
              </p>
            </div>
          ) : (
            requisitions.map((req) => (
              <div key={req.id} className="card p-6 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-foreground">
                        {req.requisition_number}
                      </h3>
                      {req.priority === 'urgent' && (
                        <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">
                          Urgent
                        </span>
                      )}
                      {req.priority === 'emergency' && (
                        <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                          Emergency
                        </span>
                      )}
                    </div>
                    <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                      <p>
                        <span className="font-medium">Requester:</span>{' '}
                        {(req.requester as any)?.full_name || 'Unknown'}
                        {(req.requester as any)?.department && ` (${(req.requester as any).department})`}
                      </p>
                      <p>
                        <span className="font-medium">Purpose:</span> {req.purpose}
                      </p>
                      <p>
                        <span className="font-medium">Items:</span> {req.items?.length || 0} item(s)
                      </p>
                      <p>
                        <span className="font-medium">Total Value:</span> ₹{calculateTotalValue(req).toFixed(2)}
                      </p>
                      <p>
                        <span className="font-medium">Requested:</span>{' '}
                        {format(new Date(req.created_at), 'MMM dd, yyyy hh:mm a')}
                      </p>
                    </div>

                    {/* Items List */}
                    <div className="mt-4 space-y-2">
                      <p className="text-sm font-medium text-foreground">Requested Items:</p>
                      <div className="bg-background/50 rounded-lg p-3 space-y-2">
                        {req.items?.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span>{(item.item as any)?.name || 'Unknown Item'}</span>
                            <span className="text-muted-foreground">
                              Qty: {item.quantity_requested} {(item.item as any)?.unit}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="ml-6 flex flex-col gap-2">
                    <button
                      onClick={() => navigate(`/requisitions/${req.id}`)}
                      className="px-4 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-lg hover:bg-muted transition-colors"
                    >
                      <FileText className="inline-block w-4 h-4 mr-2" />
                      View Details
                    </button>
                    <button
                      onClick={() => handleApproveRequisition(req)}
                      disabled={approving === req.id}
                      className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      <Check className="inline-block w-4 h-4 mr-2" />
                      {approving === req.id ? 'Approving...' : 'Approve'}
                    </button>
                    <button
                      onClick={() => {
                        const reason = window.prompt('Enter rejection reason:')
                        if (reason) handleRejectRequisition(req, reason)
                      }}
                      disabled={approving === req.id}
                      className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      <X className="inline-block w-4 h-4 mr-2" />
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Receipts Tab */}
      {!loading && activeTab === 'receipts' && (
        <div className="space-y-4">
          {receipts.length === 0 ? (
            <div className="card p-12 text-center">
              <Clock className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-medium text-foreground">No pending receipts</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                All verified receipts have been approved. New submissions will appear here.
              </p>
            </div>
          ) : (
            receipts.map((receipt) => (
              <div key={receipt.id} className="card p-6 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground">
                      Receipt #{receipt.grn_number}
                    </h3>
                    <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                      <p>
                        <span className="font-medium">Received by:</span>{' '}
                        {(receipt.received_by_user as any)?.full_name || 'Unknown'}
                      </p>
                      <p>
                        <span className="font-medium">Verified by:</span>{' '}
                        {(receipt.verified_by_user as any)?.full_name || 'Unknown'}
                      </p>
                      <p>
                        <span className="font-medium">Supplier:</span> {receipt.supplier_name || 'N/A'}
                      </p>
                      <p>
                        <span className="font-medium">Created:</span>{' '}
                        {receipt.created_at && format(new Date(receipt.created_at), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  </div>

                  <div className="ml-6 flex flex-col gap-2">
                    <button
                      onClick={() => navigate(`/receipts/${receipt.id}`)}
                      className="px-4 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-lg hover:bg-muted transition-colors"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => handleApproveReceipt(receipt.id)}
                      disabled={approving === receipt.id}
                      className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      {approving === receipt.id ? 'Approving...' : 'Approve'}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Approval Confirmation Modal */}
      {showApprovalModal && selectedRequisition && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Confirm Approval
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Are you sure you want to approve requisition{' '}
              <span className="font-medium">{selectedRequisition.requisition_number}</span>?
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-foreground mb-2">
                Comments (optional)
              </label>
              <textarea
                value={approvalComments}
                onChange={(e) => setApprovalComments(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                rows={3}
                placeholder="Add any comments or notes..."
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowApprovalModal(false)
                  setApprovalComments('')
                  setSelectedRequisition(null)
                }}
                className="px-4 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-lg hover:bg-muted transition-colors"
                disabled={approving !== null}
              >
                Cancel
              </button>
              <button
                onClick={confirmApproval}
                disabled={approving !== null}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {approving ? 'Approving...' : 'Confirm Approval'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ApprovalsPage
