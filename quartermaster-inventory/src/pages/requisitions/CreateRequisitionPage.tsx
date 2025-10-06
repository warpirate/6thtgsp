import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, AlertCircle, FileText, Upload } from 'lucide-react'
import { supabase, ensureAuthenticated } from '@/lib/supabase'
import { useAuth } from '@/lib/auth/AuthProvider'
import { CartItem, RequestType, Priority } from '@/types'
import { toast } from 'react-hot-toast'

const CreateRequisitionPage: React.FC = () => {
  const navigate = useNavigate()
  const { user, userProfile } = useAuth()
  
  const [cart, setCart] = useState<CartItem[]>([])
  const [requestType, setRequestType] = useState<RequestType>('self')
  const [priority, setPriority] = useState<Priority>('normal')
  const [purpose, setPurpose] = useState('')
  const [department, setDepartment] = useState(userProfile?.department || '')
  const [authDocument, setAuthDocument] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [hasWeapons, setHasWeapons] = useState(false)

  useEffect(() => {
    // Load cart from sessionStorage
    const cartData = sessionStorage.getItem('requisition_cart')
    if (cartData) {
      const parsedCart = JSON.parse(cartData)
      setCart(parsedCart)
      
      // Check if cart contains weapons
      const containsWeapons = parsedCart.some((item: CartItem) => item.item.is_weapon)
      setHasWeapons(containsWeapons)
    } else {
      toast.error('No items in cart')
      navigate('/catalog')
    }
  }, [navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast.error('You must be logged in')
      return
    }

    if (cart.length === 0) {
      toast.error('Cart is empty')
      return
    }

    if (!purpose.trim()) {
      toast.error('Please provide a purpose for this requisition')
      return
    }

    if (hasWeapons && !authDocument) {
      toast.error('Authorization document is required for weapon requisitions')
      return
    }

    setLoading(true)

    try {
      // Ensure user is authenticated before making API calls
      await ensureAuthenticated()

      // Upload authorization document if provided
      let authDocumentPath = null
      if (authDocument) {
        const fileExt = authDocument.name.split('.').pop()
        const fileName = `${user.id}/${Date.now()}.${fileExt}`
        
        const { error: uploadError } = await supabase.storage
          .from('receipt-documents')
          .upload(fileName, authDocument, {
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) throw uploadError
        authDocumentPath = fileName
      }

      // Create requisition - user.id now matches public.users.id
      const { data: requisition, error: reqError} = await (supabase as any)
        .from('requisitions')
        .insert({
          requester_id: user.id,
          department: department,
          request_type: requestType,
          priority,
          purpose,
          status: 'pending',
          authorization_document: authDocumentPath
        })
        .select()
        .single()

      if (reqError) throw reqError

      // Create requisition items
      const requisitionItems = cart.map(cartItem => ({
        requisition_id: requisition.id,
        item_id: cartItem.item.id,
        quantity_requested: cartItem.quantity,
        unit_price: cartItem.item.unit_price,
        notes: cartItem.notes
      }))

      const { error: itemsError } = await (supabase as any)
        .from('requisition_items')
        .insert(requisitionItems)

      if (itemsError) throw itemsError

      // Clear cart from sessionStorage
      sessionStorage.removeItem('requisition_cart')

      toast.success('Requisition submitted successfully!')
      navigate(`/requisitions/${requisition.id}`)
    } catch (error: any) {
      console.error('Error creating requisition:', error)
      
      // Handle authentication errors
      if (error.message?.includes('JWT') || 
          error.message?.includes('session') || 
          error.message?.includes('authenticated')) {
        toast.error('Session expired. Please log in again.')
        navigate('/auth/login')
      } else {
        toast.error(error.message || 'Failed to create requisition')
      }
    } finally {
      setLoading(false)
    }
  }

  const getTotalValue = () => {
    return cart.reduce((sum, ci) => sum + (ci.item.unit_price || 0) * ci.quantity, 0)
  }

  const updateItemNotes = (itemId: string, notes: string) => {
    setCart(cart.map(ci => 
      ci.item.id === itemId ? { ...ci, notes } : ci
    ))
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/catalog')}
          className="btn btn-secondary"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create Requisition</h1>
          <p className="text-gray-600 mt-1">Fill in the details to submit your request</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Request Details */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold mb-4">Request Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Request Type */}
            <div>
              <label className="label">Request Type</label>
              <select
                value={requestType}
                onChange={(e) => setRequestType(e.target.value as RequestType)}
                className="input w-full"
                required
              >
                <option value="self">For Self</option>
                <option value="department">For Department</option>
                <option value="bulk">Bulk Request</option>
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="label">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="input w-full"
                required
              >
                <option value="normal">Normal</option>
                <option value="urgent">Urgent</option>
                <option value="emergency">Emergency</option>
              </select>
            </div>

            {/* Department */}
            <div className="md:col-span-2">
              <label className="label">Department</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="input w-full"
                placeholder="Enter department name"
              />
            </div>

            {/* Purpose */}
            <div className="md:col-span-2">
              <label className="label">Purpose / Justification *</label>
              <textarea
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="textarea w-full"
                rows={4}
                placeholder="Explain why you need these items..."
                required
              />
            </div>

            {/* Authorization Document (for weapons) */}
            {hasWeapons && (
              <div className="md:col-span-2">
                <label className="label flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  Authorization Document (Required for Weapons) *
                </label>
                <div className="mt-2">
                  <label className="flex items-center gap-2 cursor-pointer border-2 border-dashed rounded-lg p-4 hover:bg-gray-50">
                    <Upload className="w-5 h-5 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {authDocument ? authDocument.name : 'Click to upload authorization letter'}
                    </span>
                    <input
                      type="file"
                      onChange={(e) => setAuthDocument(e.target.files?.[0] || null)}
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png"
                      required
                    />
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Upload authorization certificate or permission letter for weapon requisition
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Items Summary */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold mb-4">Items ({cart.length})</h2>
          
          <div className="space-y-4">
            {cart.map((cartItem, index) => (
              <div key={cartItem.item.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{index + 1}. {cartItem.item.name}</span>
                      {cartItem.item.is_weapon && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-800 text-xs rounded flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Weapon
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{cartItem.item.item_code}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">Qty: {cartItem.quantity} {cartItem.item.unit}</p>
                    {cartItem.item.unit_price && (
                      <p className="text-sm text-gray-600">
                        ₹{(cartItem.item.unit_price * cartItem.quantity).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>

                {/* Item Notes */}
                <div>
                  <label className="label text-sm">Notes (Optional)</label>
                  <input
                    type="text"
                    value={cartItem.notes || ''}
                    onChange={(e) => updateItemNotes(cartItem.item.id, e.target.value)}
                    className="input w-full text-sm"
                    placeholder="Any specific requirements or notes for this item..."
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="border-t mt-6 pt-4">
            <div className="flex justify-between items-center text-lg font-bold">
              <span>Estimated Total Value:</span>
              <span>₹{getTotalValue().toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Warning for Weapons */}
        {hasWeapons && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900 mb-1">Weapon Requisition Notice</h3>
              <p className="text-sm text-red-800">
                This requisition contains weapons and will require approval from the Armory Officer. 
                Please ensure you have proper authorization and valid justification for this request.
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => navigate('/catalog')}
            className="btn btn-secondary flex-1"
            disabled={loading}
          >
            Back to Catalog
          </button>
          <button
            type="submit"
            className="btn btn-primary flex-1"
            disabled={loading}
          >
            {loading ? 'Submitting...' : 'Submit Requisition'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default CreateRequisitionPage
