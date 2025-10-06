import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Filter, Plus, Eye, Clock, CheckCircle, XCircle, Package, Send } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth/AuthProvider'
import { RequisitionWithDetails, RequisitionStatus } from '@/types'
import { toast } from 'react-hot-toast'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

const RequisitionsPage: React.FC = () => {
  const navigate = useNavigate()
  const { user, hasPermission } = useAuth()
  
  const [requisitions, setRequisitions] = useState<RequisitionWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<RequisitionStatus | 'all'>('all')

  useEffect(() => {
    loadRequisitions()
  }, [statusFilter, user])

  const loadRequisitions = async () => {
    if (!user) return
    
    try {
      setLoading(true)
      let query = (supabase as any)
        .from('requisitions')
        .select(`
          *,
          requester:users!requester_id(id, full_name, username, rank),
          approver:users!approved_by(id, full_name, username),
          issuer:users!issued_by(id, full_name, username)
        `)
        .order('created_at', { ascending: false })

      // Filter by status
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      // If not admin, only show own requisitions
      if (!hasPermission('view_all_requisitions')) {
        query = query.eq('requester_id', user.id)
      }

      const { data, error } = await query

      if (error) throw error

      setRequisitions((data || []) as RequisitionWithDetails[])
    } catch (error: any) {
      console.error('Error loading requisitions:', error)
      toast.error('Failed to load requisitions')
    } finally {
      setLoading(false)
    }
  }

  const filteredRequisitions = requisitions.filter(req => {
    if (!searchQuery) return true
    const search = searchQuery.toLowerCase()
    return (
      req.requisition_number.toLowerCase().includes(search) ||
      req.purpose.toLowerCase().includes(search) ||
      req.department?.toLowerCase().includes(search)
    )
  })

  const getStatusBadge = (status: RequisitionStatus) => {
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
    return badges[status] || badges.draft
  }

  const getStatusIcon = (status: RequisitionStatus) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />
      case 'approved': return <CheckCircle className="w-4 h-4" />
      case 'ready_for_pickup': return <Package className="w-4 h-4" />
      case 'issued': return <Send className="w-4 h-4" />
      case 'completed': return <CheckCircle className="w-4 h-4" />
      case 'rejected': return <XCircle className="w-4 h-4" />
      case 'cancelled': return <XCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const getPriorityBadge = (priority: string) => {
    const badges = {
      normal: 'bg-gray-100 text-gray-700',
      urgent: 'bg-orange-100 text-orange-700',
      emergency: 'bg-red-100 text-red-700',
    }
    return badges[priority as keyof typeof badges] || badges.normal
  }

  const formatStatusText = (status: RequisitionStatus) => {
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
    return statusLabels[status] || status.charAt(0).toUpperCase() + status.slice(1)
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {hasPermission('view_all_requisitions') ? 'All Requisitions' : 'My Requisitions'}
          </h1>
          <p className="text-gray-600 mt-1">
            {hasPermission('view_all_requisitions') 
              ? 'Manage and track all requisition requests' 
              : 'View and track your requisition requests'}
          </p>
        </div>
        
        <button
          onClick={() => navigate('/catalog')}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          New Requisition
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by requisition number, purpose, or department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10 w-full"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as RequisitionStatus | 'all')}
              className="input pl-10 w-full"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="ready_for_pickup">Ready for Pickup</option>
              <option value="issued">Issued</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Requisitions List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : filteredRequisitions.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No requisitions found</h3>
          <p className="text-gray-600 mb-4">
            {searchQuery || statusFilter !== 'all' 
              ? 'Try adjusting your search or filters' 
              : 'Start by creating your first requisition'}
          </p>
          {!searchQuery && statusFilter === 'all' && (
            <button
              onClick={() => navigate('/catalog')}
              className="btn btn-primary"
            >
              Browse Catalog
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequisitions.map((requisition) => (
            <div
              key={requisition.id}
              className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`/requisitions/${requisition.id}`)}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {requisition.requisition_number}
                      </h3>
                      <span className={`status-badge ${getStatusBadge(requisition.status)} flex items-center gap-1`}>
                        {getStatusIcon(requisition.status)}
                        {formatStatusText(requisition.status)}
                      </span>
                      {requisition.priority !== 'normal' && (
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityBadge(requisition.priority)}`}>
                          {requisition.priority.toUpperCase()}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-gray-600 mb-2 line-clamp-2">{requisition.purpose}</p>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>
                        Requester: <span className="font-medium text-gray-700">
                          {requisition.requester?.full_name || 'Unknown'}
                        </span>
                      </span>
                      {requisition.department && (
                        <span>Department: <span className="font-medium text-gray-700">{requisition.department}</span></span>
                      )}
                      <span>Type: <span className="font-medium text-gray-700">{requisition.request_type}</span></span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900 mb-1">
                      ₹{requisition.total_value.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(requisition.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                <div className="flex items-center gap-2 text-xs text-gray-500 pt-4 border-t">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Created: {new Date(requisition.created_at).toLocaleString('en-IN')}
                  </span>
                  {requisition.approved_at && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Approved: {new Date(requisition.approved_at).toLocaleString('en-IN')}
                      </span>
                    </>
                  )}
                  {requisition.issued_at && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Package className="w-3 h-3" />
                        Issued: {new Date(requisition.issued_at).toLocaleString('en-IN')}
                      </span>
                    </>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate(`/requisitions/${requisition.id}`)
                    }}
                    className="btn btn-secondary btn-sm flex items-center gap-1"
                  >
                    <Eye className="w-4 h-4" />
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default RequisitionsPage
