import React, { useState, useEffect } from 'react'
import { Plus, Package, Edit, Trash2, Search, Filter, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth/AuthProvider'
import { ItemMasterWithCategory, ItemCategory } from '@/types'
import { toast } from 'react-hot-toast'

const InventoryPage: React.FC = () => {
  const { hasPermission } = useAuth()
  const [items, setItems] = useState<ItemMasterWithCategory[]>([])
  const [categories, setCategories] = useState<ItemCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingItem, setEditingItem] = useState<ItemMasterWithCategory | null>(null)
  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    category_id: '',
    unit: 'piece',
    previous_stock: '0',
    received_stock: '0',
    invoice_number: '',
    firm: ''
  })

  useEffect(() => {
    loadCategories()
    loadItems()
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

  const loadItems = async () => {
    try {
      setLoading(true)
      let query = (supabase as any)
        .from('items_master')
        .select(`
          *,
          category:item_categories(*)
        `)
        .eq('is_active', true)
      
      if (selectedCategory !== 'all') {
        query = query.eq('category_id', selectedCategory)
      }
      
      if (searchQuery) {
        query = query.or(`nomenclature.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,item_code.ilike.%${searchQuery}%`)
      }
      
      const { data, error } = await query.order('nomenclature')
      
      if (error) throw error
      
      const transformedData = (data || []).map((item: any) => ({
        ...item,
        name: item.nomenclature || item.name,
        unit: item.unit_of_measure || item.unit || 'piece',
        category_name: item.category?.name || 'Uncategorized',
        is_weapon: item.category?.is_weapon || false,
        available_stock: item.current_stock - (item.allocated_stock || 0)
      }))
      
      setItems(transformedData)
    } catch (error) {
      console.error('Error loading items:', error)
      toast.error('Failed to load items')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadItems()
  }, [searchQuery, selectedCategory])

  const handleCreateItem = async () => {
    try {
      if (!newItem.name || !newItem.category_id || !newItem.firm) {
        toast.error('Please fill in all required fields (Name, Category, Firm)')
        return
      }

      const previousStock = parseInt(newItem.previous_stock) || 0
      const receivedStock = parseInt(newItem.received_stock) || 0
      const totalStock = previousStock + receivedStock

      const { data, error } = await (supabase as any)
        .from('items_master')
        .insert({
          nomenclature: newItem.name,
          description: newItem.description,
          category_id: newItem.category_id,
          unit_of_measure: newItem.unit,
          previous_stock: previousStock,
          received_stock: receivedStock,
          current_stock: totalStock,
          allocated_stock: 0,
          is_active: true,
          invoice_number: newItem.invoice_number || null,
          firm: newItem.firm
        })
        .select()

      if (error) throw error

      toast.success('Item created successfully!')
      setShowAddModal(false)
      setEditingItem(null)
      setNewItem({
        name: '',
        description: '',
        category_id: '',
        unit: 'piece',
        previous_stock: '0',
        received_stock: '0',
        invoice_number: '',
        firm: ''
      })
      loadItems()
    } catch (error: any) {
      console.error('Error creating item:', error)
      toast.error(error.message || 'Failed to create item')
    }
  }

  const handleUpdateItem = async () => {
    try {
      if (!editingItem || !newItem.name || !newItem.category_id || !newItem.firm) {
        toast.error('Please fill in all required fields (Name, Category, Firm)')
        return
      }

      const previousStock = parseInt(newItem.previous_stock) || 0
      const receivedStock = parseInt(newItem.received_stock) || 0
      const totalStock = previousStock + receivedStock

      const { data, error } = await (supabase as any)
        .from('items_master')
        .update({
          nomenclature: newItem.name,
          description: newItem.description,
          category_id: newItem.category_id,
          unit_of_measure: newItem.unit,
          previous_stock: previousStock,
          received_stock: receivedStock,
          current_stock: totalStock,
          invoice_number: newItem.invoice_number || null,
          firm: newItem.firm,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingItem.id)
        .select()

      if (error) throw error

      toast.success('Item updated successfully!')
      setShowAddModal(false)
      setEditingItem(null)
      setNewItem({
        name: '',
        description: '',
        category_id: '',
        unit: 'piece',
        previous_stock: '0',
        received_stock: '0',
        invoice_number: '',
        firm: ''
      })
      loadItems()
    } catch (error: any) {
      console.error('Error updating item:', error)
      toast.error(error.message || 'Failed to update item')
    }
  }

  const handleEditClick = (item: ItemMasterWithCategory) => {
    setEditingItem(item)
    setNewItem({
      name: item.name || item.nomenclature || '',
      description: item.description || '',
      category_id: item.category_id || '',
      unit: item.unit || item.unit_of_measure || 'piece',
      previous_stock: String((item as any).previous_stock || 0),
      received_stock: String((item as any).received_stock || 0),
      invoice_number: item.invoice_number || '',
      firm: (item as any).firm || ''
    })
    setShowAddModal(true)
  }

  const getStockBadgeColor = (stock: number, reorderLevel: number = 10) => {
    if (stock === 0) return 'bg-red-100 text-red-800 border-red-200'
    if (stock <= reorderLevel) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    return 'bg-green-100 text-green-800 border-green-200'
  }

  const getStockStatus = (stock: number, reorderLevel: number = 10) => {
    if (stock === 0) return 'Out of Stock'
    if (stock <= reorderLevel) return 'Low Stock'
    return 'In Stock'
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Item Management</h1>
          <p className="text-gray-600 mt-1">Manage inventory items and categories</p>
        </div>
        
        {hasPermission('manage_inventory') && (
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Item
          </button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search items by name, code, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10 w-full"
            />
          </div>

          {/* Category Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="input pl-10 w-full"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Items Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
          <p className="text-gray-600 mb-4">
            {searchQuery || selectedCategory !== 'all' 
              ? 'Try adjusting your search or filters' 
              : 'Get started by adding your first item'
            }
          </p>
          {hasPermission('manage_inventory') && (
            <button
              onClick={() => setShowAddModal(true)}
              className="btn btn-primary"
            >
              Add First Item
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Firm
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  {hasPermission('manage_inventory') && (
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12">
                          {item.image_url ? (
                            <img className="h-12 w-12 rounded-lg object-cover" src={item.image_url} alt={item.name} />
                          ) : (
                            <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center">
                              <Package className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                            {item.name}
                            {item.is_weapon && (
                              <span className="px-2 py-0.5 bg-red-100 text-red-800 text-xs rounded flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                Weapon
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">{item.item_code}</div>
                          {item.description && (
                            <div className="text-sm text-gray-500 mt-1 line-clamp-2">{item.description}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">
                        {item.category_name}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <div className="font-medium">{item.available_stock} {item.unit}</div>
                        <div className="text-gray-500 text-xs">
                          Total: {item.current_stock} | Allocated: {item.allocated_stock || 0}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {(item as any).firm || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`status-badge ${getStockBadgeColor(item.available_stock, 10)}`}>
                        {getStockStatus(item.available_stock, 10)}
                      </span>
                    </td>
                    {hasPermission('manage_inventory') && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEditClick(item)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit item"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {/* TODO: Delete item */}}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingItem ? 'Edit Item' : 'Add New Item'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Item Name *
                </label>
                <input
                  type="text"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  className="input w-full"
                  placeholder="Enter item name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  className="input w-full"
                  rows={3}
                  placeholder="Enter item description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  value={newItem.category_id}
                  onChange={(e) => setNewItem({ ...newItem, category_id: e.target.value })}
                  className="input w-full"
                >
                  <option value="">Select category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Invoice Number
                </label>
                <input
                  type="text"
                  value={newItem.invoice_number}
                  onChange={(e) => setNewItem({ ...newItem, invoice_number: e.target.value })}
                  className="input w-full"
                  placeholder="Enter invoice number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Received From *
                </label>
                <select
                  value={newItem.firm === 'Head Office' || newItem.firm === 'Chief Office' ? newItem.firm : 'Other'}
                  onChange={(e) => {
                    if (e.target.value === 'Head Office' || e.target.value === 'Chief Office') {
                      setNewItem({ ...newItem, firm: e.target.value })
                    } else {
                      setNewItem({ ...newItem, firm: '' })
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

              {(newItem.firm !== 'Head Office' && newItem.firm !== 'Chief Office') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Other Source *
                  </label>
                  <textarea
                    value={newItem.firm === 'Head Office' || newItem.firm === 'Chief Office' ? '' : newItem.firm}
                    onChange={(e) => setNewItem({ ...newItem, firm: e.target.value })}
                    className="input w-full"
                    rows={2}
                    placeholder="Enter firm/organization name (required)"
                    required
                  />
                </div>
              )}

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Previous Stock
                  </label>
                  <input
                    type="number"
                    value={newItem.previous_stock}
                    onChange={(e) => setNewItem({ ...newItem, previous_stock: e.target.value })}
                    className="input w-full"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Received Stock
                  </label>
                  <input
                    type="number"
                    value={newItem.received_stock}
                    onChange={(e) => setNewItem({ ...newItem, received_stock: e.target.value })}
                    className="input w-full"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Items
                  </label>
                  <input
                    type="number"
                    value={(parseInt(newItem.previous_stock) || 0) + (parseInt(newItem.received_stock) || 0)}
                    className="input w-full bg-gray-50"
                    disabled
                    readOnly
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setEditingItem(null)
                  setNewItem({
                    name: '',
                    description: '',
                    category_id: '',
                    unit: 'piece',
                    previous_stock: '0',
                    received_stock: '0',
                    invoice_number: '',
                    firm: ''
                  })
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={editingItem ? handleUpdateItem : handleCreateItem}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingItem ? 'Update Item' : 'Create Item'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default InventoryPage
