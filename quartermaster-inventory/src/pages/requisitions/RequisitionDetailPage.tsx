import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle, XCircle, Clock, Package, User, Calendar, FileText, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth/AuthProvider'
import { RequisitionWithDetails, RequisitionItemWithDetails } from '@/types'
import { toast } from 'react-hot-toast'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

const RequisitionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, hasPermission } = useAuth()
  
  const [requisition, setRequisition] = useState<RequisitionWithDetails | null>(null)
  const [items, setItems] = useState<RequisitionItemWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve')
  const [comments, setComments] = useState('')

  useEffect(() => {
    if (id) {
      loadRequisition()
    }
  }, [id])

  const loadRequisition = async () => {
    try {
      setLoading(true)

      // Load requisition
      const { data: reqData, error: reqError } = await (supabase as any)
        .from('requisitions')
        .select(`
          *,
          requester:users!requester_id(id, full_name, username, rank, service_number),
          approver:users!approved_by(id, full_name, username),
          issuer:users!issued_by(id, full_name, username)
        `)
        .eq('id', id)
        .single()

      if (reqError) throw reqError

      setRequisition(reqData as RequisitionWithDetails)

      // Load items
      const { data: itemsData, error: itemsError } = await (supabase as any)
        .from('requisition_items')
        .select(`
          *,
          item:items_master(
            *,
            category:item_categories(*)
          )
        `)
        .eq('requisition_id', id)

      if (itemsError) throw itemsError

      // Transform items data
      const transformedItems = (itemsData || []).map((ri: any) => ({
        ...ri,
        item: {
          ...ri.item,
          name: ri.item.nomenclature,
          unit: ri.item.unit_of_measure,
          category_name: ri.item.category?.name,
        }
      }))

      setItems(transformedItems as RequisitionItemWithDetails[])
    } catch (error: any) {
      console.error('Error loading requisition:', error)
      toast.error('Failed to load requisition details')
    } finally {
      setLoading(false)
    }
  }

  const handleApproval = async () => {
    if (!requisition || !user) return

    setActionLoading(true)
    try {
      const newStatus = approvalAction === 'approve' ? 'approved' : 'rejected'
      
      const { error } = await (supabase as any)
        .from('requisitions')
        .update({
          status: newStatus,
          approved_by: approvalAction === 'approve' ? user.id : null,
          approved_at: approvalAction === 'approve' ? new Date().toISOString() : null,
          approval_comments: comments,
          rejection_reason: approvalAction === 'reject' ? comments : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', requisition.id)

      if (error) throw error

      toast.success(`Requisition ${approvalAction === 'approve' ? 'approved' : 'rejected'} successfully`)
      setShowApprovalModal(false)
      loadRequisition()
    } catch (error: any) {
      console.error('Error updating requisition:', error)
      toast.error(`Failed to ${approvalAction} requisition`)
    } finally {
      setActionLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      draft: 'bg-gray-100 text-gray-800 border-gray-200',
      pending: 'bg-blue-100 text-blue-800 border-blue-200',
      approved: 'bg-green-100 text-green-800 border-green-200',
      ready_for_pickup: 'bg-purple-100 text-purple-800 border-purple-200',
      issued: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      completed: 'bg-teal-100 text-teal-800 border-teal-200',
      rejected: 'bg-red-100 text-red-800 border-red-200',
      cancelled: 'bg-gray-100 text-gray-800 border-gray-200',
    }
    return badges[status as keyof typeof badges] || badges.draft
  }

  const formatStatusText = (status: string) => {
    const statusLabels = {
      draft: 'Draft',
      pending: 'Pending',
      approved: 'Approved',
      ready_for_pickup: 'Ready for Pickup',
      issued: 'Issued',
      completed: 'Completed',
      rejected: 'Rejected',
      cancelled: 'Cancelled',
    }
    return statusLabels[status as keyof typeof statusLabels] || status.charAt(0).toUpperCase() + status.slice(1)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!requisition) {
    return (
      <div className="p-6 max-w-4xl mx-auto text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Requisition Not Found</h2>
        <p className="text-gray-600 mb-4">The requisition you're looking for doesn't exist.</p>
        <button onClick={() => navigate('/requisitions')} className="btn btn-primary">
          Back to Requisitions
        </button>
      </div>
    )
  }

  const canApprove = hasPermission('approve_requisition') && requisition.status === 'pending'

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/requisitions')} className="btn btn-secondary">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold text-gray-900">{requisition.requisition_number}</h1>
            <span className={`status-badge ${getStatusBadge(requisition.status)}`}>
              {formatStatusText(requisition.status)}
            </span>
            {requisition.priority !== 'normal' && (
              <span className={`px-3 py-1 rounded text-sm font-medium ${
                requisition.priority === 'urgent' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
              }`}>
                {requisition.priority.toUpperCase()}
              </span>
            )}
          </div>
          <p className="text-gray-600">Requisition Details</p>
        </div>

        {/* Action Buttons */}
        {canApprove && (
          <div className="flex gap-2">
            <button
              onClick={() => {
                setApprovalAction('approve')
                setShowApprovalModal(true)
              }}
              className="btn btn-success flex items-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              Approve
            </button>
            <button
              onClick={() => {
                setApprovalAction('reject')
                setShowApprovalModal(true)
              }}
              className="btn btn-danger flex items-center gap-2"
            >
              <XCircle className="w-5 h-5" />
              Reject
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Purpose */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Purpose
            </h2>
            <p className="text-gray-700 whitespace-pre-wrap">{requisition.purpose}</p>
          </div>

          {/* Items */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Items ({items.length})
            </h2>
            
            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={item.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900">{index + 1}. {item.item?.name}</span>
                        {item.item?.category_name && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">
                            {item.item.category_name}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{item.item?.item_code}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">
                        {item.quantity_approved || item.quantity_requested} {item.item?.unit}
                      </div>
                      {item.unit_price && (
                        <div className="text-sm text-gray-600">
                          ₹{item.unit_price.toLocaleString()} each
                        </div>
                      )}
                    </div>
                  </div>

                  {item.quantity_approved && item.quantity_approved !== item.quantity_requested && (
                    <div className="text-sm text-orange-600 bg-orange-50 p-2 rounded mt-2">
                      Requested: {item.quantity_requested} {item.item?.unit} → Approved: {item.quantity_approved} {item.item?.unit}
                    </div>
                  )}

                  {item.notes && (
                    <div className="text-sm text-gray-600 mt-2 italic">
                      Note: {item.notes}
                    </div>
                  )}

                  <div className="flex justify-between items-center mt-3 pt-3 border-t text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-semibold text-gray-900">
                      ₹{item.total_price.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t mt-4 pt-4 flex justify-between items-center">
              <span className="text-lg font-semibold">Total Value:</span>
              <span className="text-2xl font-bold text-gray-900">
                ₹{requisition.total_value.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Comments/Rejection Reason */}
          {(requisition.approval_comments || requisition.rejection_reason) && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold mb-4">
                {requisition.status === 'rejected' ? 'Rejection Reason' : 'Approval Comments'}
              </h2>
              <p className="text-gray-700 whitespace-pre-wrap">
                {requisition.rejection_reason || requisition.approval_comments}
              </p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Requester Info */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Requester
            </h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-600">Name:</span>
                <p className="font-medium">{requisition.requester?.full_name}</p>
              </div>
              {requisition.requester?.rank && (
                <div>
                  <span className="text-gray-600">Rank:</span>
                  <p className="font-medium">{requisition.requester.rank}</p>
                </div>
              )}
              {requisition.requester?.service_number && (
                <div>
                  <span className="text-gray-600">Service No:</span>
                  <p className="font-medium">{requisition.requester.service_number}</p>
                </div>
              )}
              {requisition.department && (
                <div>
                  <span className="text-gray-600">Department:</span>
                  <p className="font-medium">{requisition.department}</p>
                </div>
              )}
            </div>
          </div>

          {/* Request Details */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Request Details
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-gray-600">Type:</span>
                <p className="font-medium capitalize">{requisition.request_type}</p>
              </div>
              <div>
                <span className="text-gray-600">Priority:</span>
                <p className="font-medium capitalize">{requisition.priority}</p>
              </div>
              <div>
                <span className="text-gray-600">Created:</span>
                <p className="font-medium">
                  {new Date(requisition.created_at).toLocaleString('en-IN')}
                </p>
              </div>
              {requisition.approved_at && (
                <div>
                  <span className="text-gray-600">Approved:</span>
                  <p className="font-medium">
                    {new Date(requisition.approved_at).toLocaleString('en-IN')}
                  </p>
                  {requisition.approver && (
                    <p className="text-xs text-gray-500">by {requisition.approver.full_name}</p>
                  )}
                </div>
              )}
              {requisition.issued_at && (
                <div>
                  <span className="text-gray-600">Issued:</span>
                  <p className="font-medium">
                    {new Date(requisition.issued_at).toLocaleString('en-IN')}
                  </p>
                  {requisition.issuer && (
                    <p className="text-xs text-gray-500">by {requisition.issuer.full_name}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Timeline
            </h3>
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5"></div>
                <div className="flex-1 text-sm">
                  <p className="font-medium">Created</p>
                  <p className="text-gray-600 text-xs">
                    {new Date(requisition.created_at).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
              {requisition.approved_at && (
                <div className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5"></div>
                  <div className="flex-1 text-sm">
                    <p className="font-medium">Approved</p>
                    <p className="text-gray-600 text-xs">
                      {new Date(requisition.approved_at).toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
              )}
              {requisition.issued_at && (
                <div className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-purple-500 mt-1.5"></div>
                  <div className="flex-1 text-sm">
                    <p className="font-medium">Issued</p>
                    <p className="text-gray-600 text-xs">
                      {new Date(requisition.issued_at).toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Approval Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4">
              {approvalAction === 'approve' ? 'Approve Requisition' : 'Reject Requisition'}
            </h2>
            <p className="text-gray-600 mb-4">
              {approvalAction === 'approve' 
                ? 'Are you sure you want to approve this requisition?' 
                : 'Please provide a reason for rejection.'}
            </p>

            <div className="mb-4">
              <label className="label">
                {approvalAction === 'approve' ? 'Comments (Optional)' : 'Rejection Reason *'}
              </label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                className="textarea w-full"
                rows={4}
                placeholder={approvalAction === 'approve' ? 'Add any comments...' : 'Explain why this requisition is being rejected...'}
                required={approvalAction === 'reject'}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowApprovalModal(false)}
                className="btn btn-secondary flex-1"
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleApproval}
                className={`btn ${approvalAction === 'approve' ? 'btn-success' : 'btn-danger'} flex-1`}
                disabled={actionLoading || (approvalAction === 'reject' && !comments.trim())}
              >
                {actionLoading ? 'Processing...' : approvalAction === 'approve' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RequisitionDetailPage
