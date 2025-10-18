import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2, Package, AlertCircle, Save, Send } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { auditService } from '@/lib/api/audit.service'
import { useAuth } from '@/lib/auth/AuthProvider'
import { ItemCategory } from '@/types'
import { toast } from 'react-hot-toast'

interface IVItem {
  id: string
  item_id?: string
  item_name: string
  category_id: string
  description?: string
  quantity_received: number
  unit: string
  unit_price?: number
  condition: 'new' | 'good' | 'fair' | 'damaged'
  remarks?: string
}

const CreateIVPage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<ItemCategory[]>([])
  const [existingItems, setExistingItems] = useState<any[]>([])
  
  // IV Header Information
  const [ivNumber, setIvNumber] = useState('')
  const [receivedFrom, setReceivedFrom] = useState('')
  const [receiptDate, setReceiptDate] = useState(new Date().toISOString().split('T')[0])
  const [supplierName, setSupplierName] = useState('')
  const [remarks, setRemarks] = useState('')
  
  // Items List
  const [items, setItems] = useState<IVItem[]>([
    {
      id: crypto.randomUUID(),
      item_name: '',
      category_id: '',
      quantity_received: 0,
      unit: 'piece',
      condition: 'new'
    }
  ])

  useEffect(() => {
    loadCategories()
    loadExistingItems()
  }, [])

  const loadCategories = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('item_categories')
        .select('*')
        .eq('active', true)
        .order('name')
      
      if (error) throw error
      setCategories((data || []) as ItemCategory[])
    } catch (error) {
      console.error('Error loading categories:', error)
      toast.error('Failed to load categories')
    }
  }

  const loadExistingItems = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('items_master')
        .select('id, nomenclature, item_code, category_id, unit_of_measure')
        .eq('is_active', true)
        .order('nomenclature')
      
      if (error) throw error
      setExistingItems(data || [])
    } catch (error) {
      console.error('Error loading items:', error)
    }
  }

  const addItem = () => {
    setItems([...items, {
      id: crypto.randomUUID(),
      item_name: '',
      category_id: '',
      quantity_received: 0,
      unit: 'piece',
      condition: 'new'
    }])
  }

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id))
    }
  }

  const updateItem = (id: string, field: keyof IVItem, value: any) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ))
  }

  const handleItemSelect = (id: string, itemId: string) => {
    const selectedItem = existingItems.find(item => item.id === itemId)
    if (selectedItem) {
      // Update all fields at once to avoid state batching issues
      setItems(items.map(item => 
        item.id === id 
          ? {
              ...item,
              item_id: itemId,
              item_name: selectedItem.nomenclature || '',
              category_id: selectedItem.category_id || '',
              unit: selectedItem.unit_of_measure || 'piece'
            }
          : item
      ))
    }
  }

  const validateForm = () => {
    if (!ivNumber.trim()) {
      toast.error('IV Number is required')
      return false
    }
    if (!receivedFrom.trim()) {
      toast.error('Received From is required')
      return false
    }
    if (!receiptDate) {
      toast.error('Receipt Date is required')
      return false
    }
    
    for (const item of items) {
      if (!item.item_name.trim()) {
        toast.error('All items must have a name')
        return false
      }
      if (!item.category_id) {
        toast.error('All items must have a category')
        return false
      }
      if (item.quantity_received <= 0) {
        toast.error('All items must have quantity greater than 0')
        return false
      }
    }
    
    return true
  }

  const handleSave = async (status: 'draft' | 'submitted') => {
    if (!validateForm()) return
    
    try {
      setLoading(true)
      
      // Calculate totals
      const totalItems = items.reduce((sum, item) => sum + item.quantity_received, 0)
      
      // Create stock receipt
      const { data: receipt, error: receiptError } = await (supabase as any)
        .from('stock_receipts')
        .insert({
          iv_number: ivNumber,
          supplier_name: supplierName || null,
          receipt_date: receiptDate,
          received_from: receivedFrom,
          total_items: totalItems,
          total_value: 0, // Price tracking removed
          remarks: remarks || null,
          status: status,
          received_by: user?.id,
          submitted_at: status === 'submitted' ? new Date().toISOString() : null
        })
        .select()
        .single()
      
      if (receiptError) throw receiptError
      
      // Create receipt items
      const receiptItems = items.map(item => ({
        receipt_id: receipt.id,
        item_id: item.item_id || null,
        item_name: !item.item_id ? item.item_name : null, // For new items
        category_id: item.category_id || null,
        unit_of_measure: item.unit || null,
        condition: item.condition || null,
        challan_quantity: item.quantity_received,
        received_quantity: item.quantity_received,
        unit_rate: null, // Price tracking removed
        condition_notes: item.remarks || item.description || null // Use condition_notes not remarks
      }))
      
      const { error: itemsError} = await (supabase as any)
        .from('receipt_items')
        .insert(receiptItems)
      
      if (itemsError) throw itemsError
      
      // Create audit log
      await auditService.createAuditLog({
        action: status === 'draft' ? 'CREATED' : 'SUBMITTED',
        table_name: 'stock_receipts',
        record_id: receipt.id,
        new_values: {
          iv_number: ivNumber,
          status: status,
          total_items: totalItems,
          received_from: receivedFrom
        },
        description: status === 'draft' 
          ? `Created IV ${ivNumber} as draft with ${totalItems} items`
          : `Submitted IV ${ivNumber} for verification with ${totalItems} items`
      })
      
      toast.success(
        status === 'draft' 
          ? 'IV saved as draft successfully!' 
          : 'IV submitted for verification successfully!'
      )
      
      navigate('/receipts')
    } catch (error: any) {
      console.error('Error saving IV:', error)
      toast.error(error.message || 'Failed to save IV')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create IV Entry</h1>
          <p className="text-gray-600 mt-1">Step 1: Stock Receipt (Issued Voucher Entry)</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/receipts')}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => handleSave('draft')}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save as Draft
          </button>
          <button
            onClick={() => handleSave('submitted')}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            Submit for Verification
          </button>
        </div>
      </div>

      {/* IV Header Information */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Package className="w-5 h-5" />
          Receipt Information
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              IV Number *
            </label>
            <input
              type="text"
              value={ivNumber}
              onChange={(e) => setIvNumber(e.target.value)}
              className="input w-full"
              placeholder="Enter Issued Voucher number"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Receipt Date *
            </label>
            <input
              type="date"
              value={receiptDate}
              onChange={(e) => setReceiptDate(e.target.value)}
              className="input w-full"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Received From *
            </label>
            <select
              value={receivedFrom === 'Head Office' || receivedFrom === 'Chief Office' ? receivedFrom : 'Other'}
              onChange={(e) => {
                if (e.target.value === 'Head Office' || e.target.value === 'Chief Office') {
                  setReceivedFrom(e.target.value)
                } else {
                  setReceivedFrom('')
                }
              }}
              className="input w-full"
            >
              <option value="">Select source</option>
              <option value="Head Office">Head Office</option>
              <option value="Chief Office">Chief Office</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {(receivedFrom !== 'Head Office' && receivedFrom !== 'Chief Office') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Other Source *
              </label>
              <input
                type="text"
                value={receivedFrom === 'Head Office' || receivedFrom === 'Chief Office' ? '' : receivedFrom}
                onChange={(e) => setReceivedFrom(e.target.value)}
                className="input w-full"
                placeholder="Enter source name"
                required
              />
            </div>
          )}

          {(receivedFrom !== 'Head Office' && receivedFrom !== 'Chief Office' && receivedFrom !== '') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Supplier Name
              </label>
              <input
                type="text"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                className="input w-full"
                placeholder="Enter supplier name (if applicable)"
              />
            </div>
          )}
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Remarks
          </label>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            className="input w-full"
            rows={3}
            placeholder="Enter any additional remarks"
          />
        </div>
      </div>

      {/* Items List */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Package className="w-5 h-5" />
            Items List
          </h2>
          <button
            onClick={addItem}
            className="px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Item
          </button>
        </div>

        <div className="space-y-4">
          {items.map((item, index) => (
            <div key={item.id} className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-700">Item #{index + 1}</h3>
                {items.length > 1 && (
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Item Name *
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={item.item_id || ''}
                      onChange={(e) => {
                        if (e.target.value === 'new') {
                          updateItem(item.id, 'item_id', undefined)
                          updateItem(item.id, 'item_name', '')
                        } else if (e.target.value) {
                          handleItemSelect(item.id, e.target.value)
                        }
                      }}
                      className="input flex-1"
                    >
                      <option value="">Select existing item or create new</option>
                      <option value="new">➕ Create New Item</option>
                      {existingItems.map(existingItem => (
                        <option key={existingItem.id} value={existingItem.id}>
                          {existingItem.nomenclature} ({existingItem.item_code})
                        </option>
                      ))}
                    </select>
                  </div>
                  {!item.item_id && (
                    <input
                      type="text"
                      value={item.item_name}
                      onChange={(e) => updateItem(item.id, 'item_name', e.target.value)}
                      className="input w-full mt-2"
                      placeholder="Enter new item name"
                      required
                    />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={item.category_id}
                    onChange={(e) => updateItem(item.id, 'category_id', e.target.value)}
                    className="input w-full"
                    required
                  >
                    <option value="">Select category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icon} {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity Received *
                  </label>
                  <input
                    type="number"
                    value={item.quantity_received}
                    onChange={(e) => updateItem(item.id, 'quantity_received', parseFloat(e.target.value) || 0)}
                    className="input w-full"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit
                  </label>
                  <select
                    value={item.unit}
                    onChange={(e) => updateItem(item.id, 'unit', e.target.value)}
                    className="input w-full"
                  >
                    <option value="piece">Piece</option>
                    <option value="kg">Kilogram</option>
                    <option value="liter">Liter</option>
                    <option value="meter">Meter</option>
                    <option value="box">Box</option>
                    <option value="pack">Pack</option>
                    <option value="set">Set</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Condition *
                  </label>
                  <select
                    value={item.condition}
                    onChange={(e) => updateItem(item.id, 'condition', e.target.value as any)}
                    className="input w-full"
                  >
                    <option value="new">New</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="damaged">Damaged</option>
                  </select>
                </div>

                <div className="md:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description/Remarks
                  </label>
                  <textarea
                    value={item.description || ''}
                    onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                    className="input w-full"
                    rows={2}
                    placeholder="Enter item description or remarks"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="mt-6 pt-4 border-t">
          <div className="flex justify-between items-center text-sm">
            <span className="font-medium text-gray-700">Total Items:</span>
            <span className="font-semibold text-gray-900">
              {items.reduce((sum, item) => sum + item.quantity_received, 0).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Next Steps:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>After submission, this IV will be sent for physical verification</li>
              <li>Inspector will verify quantities and generate RV (Received Voucher)</li>
              <li>Admin will approve the RV and stock will be added to inventory</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CreateIVPage
