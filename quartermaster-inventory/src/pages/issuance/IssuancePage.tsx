import React, { useState, useEffect } from 'react'
import { Package, Send, Search, AlertCircle, CheckCircle, Printer } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth/AuthProvider'
import { RequisitionWithDetails, RequisitionItemWithDetails } from '@/types'
import { toast } from 'react-hot-toast'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

const IssuancePage: React.FC = () => {
  const { user } = useAuth()
  
  const [requisitions, setRequisitions] = useState<RequisitionWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRequisition, setSelectedRequisition] = useState<RequisitionWithDetails | null>(null)
  const [requisitionItems, setRequisitionItems] = useState<RequisitionItemWithDetails[]>([])
  const [issuanceData, setIssuanceData] = useState<{[key: string]: {
    quantity: number
    serialNumbers: string
    assetTags: string
    condition: string
    notes: string
  }}>({})
  const [issuing, setIssuing] = useState(false)

  useEffect(() => {
    loadApprovedRequisitions()
  }, [])

  const loadApprovedRequisitions = async () => {
    try {
      setLoading(true)
      const { data, error } = await (supabase as any)
        .from('requisitions')
        .select(`
          *,
          requester:users!requester_id(id, full_name, username, rank, service_number)
        `)
        .eq('status', 'approved')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: true })

      if (error) throw error

      setRequisitions((data || []) as RequisitionWithDetails[])
    } catch (error: any) {
      console.error('Error loading requisitions:', error)
      toast.error('Failed to load approved requisitions')
    } finally {
      setLoading(false)
    }
  }

  const loadRequisitionItems = async (requisitionId: string) => {
    try {
      const { data, error } = await (supabase as any)
        .from('requisition_items')
        .select(`
          *,
          item:items_master(
            *,
            category:item_categories(*)
          )
        `)
        .eq('requisition_id', requisitionId)

      if (error) throw error

      const transformedItems = (data || []).map((ri: any) => ({
        ...ri,
        item: {
          ...ri.item,
          name: ri.item.nomenclature,
          unit: ri.item.unit_of_measure,
          category_name: ri.item.category?.name,
          requires_serial_number: ri.item.category?.requires_serial_number,
        }
      }))

      setRequisitionItems(transformedItems as RequisitionItemWithDetails[])

      // Initialize issuance data
      const initialData: any = {}
      transformedItems.forEach((item: any) => {
        initialData[item.id] = {
          quantity: item.quantity_approved || item.quantity_requested,
          serialNumbers: '',
          assetTags: '',
          condition: 'good',
          notes: ''
        }
      })
      setIssuanceData(initialData)
    } catch (error: any) {
      console.error('Error loading items:', error)
      toast.error('Failed to load requisition items')
    }
  }

  const handleSelectRequisition = (requisition: RequisitionWithDetails) => {
    setSelectedRequisition(requisition)
    loadRequisitionItems(requisition.id)
  }

  const handleIssueItems = async () => {
    if (!selectedRequisition || !user) return

    setIssuing(true)
    try {
      // Create issuances for each item
      const issuances = requisitionItems.map(item => ({
        requisition_id: selectedRequisition.id,
        requisition_item_id: item.id,
        item_id: item.item_id,
        quantity: issuanceData[item.id].quantity,
        serial_numbers: issuanceData[item.id].serialNumbers 
          ? issuanceData[item.id].serialNumbers.split(',').map(s => s.trim()).filter(Boolean)
          : null,
        asset_tags: issuanceData[item.id].assetTags
          ? issuanceData[item.id].assetTags.split(',').map(s => s.trim()).filter(Boolean)
          : null,
        condition: issuanceData[item.id].condition,
        issued_by: user.id,
        issued_to: selectedRequisition.requester_id,
        notes: issuanceData[item.id].notes || null,
      }))

      const { error: issuanceError } = await (supabase as any)
        .from('issuances')
        .insert(issuances)

      if (issuanceError) throw issuanceError

      // Update requisition status
      const { error: updateError } = await (supabase as any)
        .from('requisitions')
        .update({
          status: 'issued',
          issued_by: user.id,
          issued_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedRequisition.id)

      if (updateError) throw updateError

      // Update item quantities
      for (const item of requisitionItems) {
        const { error: stockError } = await (supabase as any)
          .from('items_master')
          .update({
            allocated_stock: (item.item as any).allocated_stock + issuanceData[item.id].quantity
          })
          .eq('id', item.item_id)

        if (stockError) console.error('Error updating stock:', stockError)
      }

      toast.success('Items issued successfully!')
      setSelectedRequisition(null)
      setRequisitionItems([])
      loadApprovedRequisitions()
    } catch (error: any) {
      console.error('Error issuing items:', error)
      toast.error('Failed to issue items')
    } finally {
      setIssuing(false)
    }
  }

  const filteredRequisitions = requisitions.filter(req => {
    if (!searchQuery) return true
    const search = searchQuery.toLowerCase()
    return (
      req.requisition_number.toLowerCase().includes(search) ||
      req.requester?.full_name?.toLowerCase().includes(search) ||
      req.department?.toLowerCase().includes(search)
    )
  })

  const getPriorityBadge = (priority: string) => {
    const badges = {
      normal: 'bg-gray-100 text-gray-700',
      urgent: 'bg-orange-100 text-orange-700',
      emergency: 'bg-red-100 text-red-700',
    }
    return badges[priority as keyof typeof badges] || badges.normal
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Issue Items</h1>
        <p className="text-gray-600 mt-1">Issue approved requisitions to requesters</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Approved Requisitions List */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold mb-3">Ready to Issue ({requisitions.length})</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search requisitions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input pl-10 w-full"
              />
            </div>
          </div>

          <div className="overflow-y-auto max-h-[calc(100vh-300px)]">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : filteredRequisitions.length === 0 ? (
              <div className="text-center py-12 px-4">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No approved requisitions ready for issuance</p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredRequisitions.map((req) => (
                  <div
                    key={req.id}
                    onClick={() => handleSelectRequisition(req)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedRequisition?.id === req.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-900">{req.requisition_number}</span>
                          {req.priority !== 'normal' && (
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${getPriorityBadge(req.priority)}`}>
                              {req.priority.toUpperCase()}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-1">{req.purpose}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">
                        {req.requester?.full_name}
                        {req.requester?.rank && ` (${req.requester.rank})`}
                      </span>
                      <span className="font-semibold text-gray-900">
                        ₹{req.total_value.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Issuance Form */}
        <div className="bg-white rounded-lg shadow-sm border">
          {!selectedRequisition ? (
            <div className="flex items-center justify-center h-full p-12 text-center">
              <div>
                <Send className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Requisition</h3>
                <p className="text-gray-600">Choose a requisition from the list to start issuing items</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold mb-2">Issue Items</h2>
                <div className="text-sm text-gray-600">
                  <p><strong>Requisition:</strong> {selectedRequisition.requisition_number}</p>
                  <p><strong>Requester:</strong> {selectedRequisition.requester?.full_name}</p>
                  {selectedRequisition.department && (
                    <p><strong>Department:</strong> {selectedRequisition.department}</p>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {requisitionItems.map((item, index) => (
                  <div key={item.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{index + 1}. {item.item?.name}</h3>
                        <p className="text-sm text-gray-600">{item.item?.item_code}</p>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">
                          {item.quantity_approved || item.quantity_requested} {item.item?.unit}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {/* Quantity */}
                      <div>
                        <label className="label text-sm">Quantity to Issue</label>
                        <input
                          type="number"
                          value={issuanceData[item.id]?.quantity || 0}
                          onChange={(e) => setIssuanceData({
                            ...issuanceData,
                            [item.id]: { ...issuanceData[item.id], quantity: parseInt(e.target.value) || 0 }
                          })}
                          className="input w-full"
                          min="1"
                          max={item.quantity_approved || item.quantity_requested}
                        />
                      </div>

                      {/* Serial Numbers (if required) */}
                      {item.item?.requires_serial_number && (
                        <div>
                          <label className="label text-sm">Serial Numbers (comma-separated)</label>
                          <input
                            type="text"
                            value={issuanceData[item.id]?.serialNumbers || ''}
                            onChange={(e) => setIssuanceData({
                              ...issuanceData,
                              [item.id]: { ...issuanceData[item.id], serialNumbers: e.target.value }
                            })}
                            className="input w-full"
                            placeholder="SN001, SN002, SN003"
                          />
                        </div>
                      )}

                      {/* Asset Tags */}
                      <div>
                        <label className="label text-sm">Asset Tags (comma-separated, optional)</label>
                        <input
                          type="text"
                          value={issuanceData[item.id]?.assetTags || ''}
                          onChange={(e) => setIssuanceData({
                            ...issuanceData,
                            [item.id]: { ...issuanceData[item.id], assetTags: e.target.value }
                          })}
                          className="input w-full"
                          placeholder="TAG001, TAG002"
                        />
                      </div>

                      {/* Condition */}
                      <div>
                        <label className="label text-sm">Condition</label>
                        <select
                          value={issuanceData[item.id]?.condition || 'good'}
                          onChange={(e) => setIssuanceData({
                            ...issuanceData,
                            [item.id]: { ...issuanceData[item.id], condition: e.target.value }
                          })}
                          className="input w-full"
                        >
                          <option value="new">New</option>
                          <option value="good">Good</option>
                          <option value="fair">Fair</option>
                        </select>
                      </div>

                      {/* Notes */}
                      <div>
                        <label className="label text-sm">Notes (optional)</label>
                        <textarea
                          value={issuanceData[item.id]?.notes || ''}
                          onChange={(e) => setIssuanceData({
                            ...issuanceData,
                            [item.id]: { ...issuanceData[item.id], notes: e.target.value }
                          })}
                          className="textarea w-full"
                          rows={2}
                          placeholder="Any additional notes..."
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 border-t bg-gray-50">
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setSelectedRequisition(null)
                      setRequisitionItems([])
                    }}
                    className="btn btn-secondary flex-1"
                    disabled={issuing}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleIssueItems}
                    className="btn btn-primary flex-1 flex items-center justify-center gap-2"
                    disabled={issuing}
                  >
                    {issuing ? (
                      <>
                        <LoadingSpinner size="sm" />
                        Issuing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        Issue Items
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default IssuancePage
