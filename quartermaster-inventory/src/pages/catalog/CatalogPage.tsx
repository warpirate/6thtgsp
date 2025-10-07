import React, { useState, useEffect } from 'react'
import { Search, ShoppingCart, Filter, Package, AlertCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth/AuthProvider'
import { ItemMasterWithCategory, ItemCategory, CartItem, StockStatus } from '@/types'
import { toast } from 'react-hot-toast'

const CatalogPage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const [items, setItems] = useState<ItemMasterWithCategory[]>([])
  const [categories, setCategories] = useState<ItemCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [cart, setCart] = useState<CartItem[]>([])
  const [showCart, setShowCart] = useState(false)

  useEffect(() => {
    loadCategories()
    loadItems()
  }, [selectedCategory, searchQuery])

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

      if (error) {
        console.error('Query error:', error)
        throw error
      }

      console.log('Loaded items:', data?.length || 0)

      // Transform data to include computed fields
      const transformedData = ((data || []) as any[]).map((item: any) => ({
        ...item,
        name: item.nomenclature || item.name,
        unit: item.unit_of_measure || item.unit || 'piece',
        category_name: item.category?.name || 'Uncategorized',
        category_code: item.category?.code || 'GENERAL',
        is_weapon: item.category?.is_weapon || false,
        requires_authorization: item.category?.requires_authorization || false,
        requires_serial_number: item.category?.requires_serial_number || false,
        is_returnable: item.category?.is_returnable || false,
        stock_status: getStockStatus(item.available_stock || item.current_stock || 0, item.reorder_level || 10)
      }))

      setItems(transformedData as ItemMasterWithCategory[])
    } catch (error: any) {
      console.error('Error loading items:', error)
      toast.error(error.message || 'Failed to load items')
    } finally {
      setLoading(false)
    }
  }

  const getStockStatus = (available: number, reorder: number): StockStatus => {
    if (available === 0) return 'out_of_stock'
    if (available <= reorder) return 'low'
    return 'available'
  }

  const addToCart = (item: ItemMasterWithCategory) => {
    const existingItem = cart.find(ci => ci.item.id === item.id)
    
    if (existingItem) {
      if (existingItem.quantity >= item.available_stock) {
        toast.error('Cannot add more than available stock')
        return
      }
      setCart(cart.map(ci => 
        ci.item.id === item.id 
          ? { ...ci, quantity: ci.quantity + 1 }
          : ci
      ))
    } else {
      setCart([...cart, { item, quantity: 1 }])
    }
    
    toast.success(`${item.name} added to cart`)
  }

  const updateCartQuantity = (itemId: string, quantity: number) => {
    if (quantity === 0) {
      removeFromCart(itemId)
      return
    }

    const item = items.find(i => i.id === itemId)
    if (item && quantity > item.available_stock) {
      toast.error('Quantity exceeds available stock')
      return
    }

    setCart(cart.map(ci => 
      ci.item.id === itemId 
        ? { ...ci, quantity }
        : ci
    ))
  }

  const removeFromCart = (itemId: string) => {
    setCart(cart.filter(ci => ci.item.id !== itemId))
  }

  const proceedToRequisition = () => {
    if (cart.length === 0) {
      toast.error('Cart is empty')
      return
    }
    
    // Store cart in sessionStorage and navigate to requisition form
    sessionStorage.setItem('requisition_cart', JSON.stringify(cart))
    navigate('/requisitions/create')
  }

  const getTotalValue = () => {
    return cart.reduce((sum, ci) => sum + (ci.item.unit_price || 0) * ci.quantity, 0)
  }

  const getStockBadgeColor = (status: StockStatus) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800 border-green-200'
      case 'low': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'out_of_stock': return 'bg-red-100 text-red-800 border-red-200'
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Item Catalog</h1>
          <p className="text-gray-600 mt-1">Browse and request items from inventory</p>
        </div>
        
        <button
          onClick={() => setShowCart(!showCart)}
          className="relative btn btn-primary flex items-center gap-2"
        >
          <ShoppingCart className="w-5 h-5" />
          Cart
          {cart.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
              {cart.length}
            </span>
          )}
        </button>
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

      {/* Items Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
          <p className="text-gray-600">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map(item => (
            <div key={item.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
              {/* Item Image */}
              <div className="h-48 bg-gray-100 rounded-t-lg flex items-center justify-center">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.name} className="h-full w-full object-cover rounded-t-lg" />
                ) : (
                  <Package className="w-16 h-16 text-gray-400" />
                )}
              </div>

              {/* Item Details */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{item.name}</h3>
                    <p className="text-sm text-gray-600">{item.item_code}</p>
                  </div>
                  <span className={`status-badge ${getStockBadgeColor(item.stock_status!)}`}>
                    {item.stock_status === 'available' && 'In Stock'}
                    {item.stock_status === 'low' && 'Low Stock'}
                    {item.stock_status === 'out_of_stock' && 'Out of Stock'}
                  </span>
                </div>

                {item.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
                )}

                <div className="flex items-center justify-between text-sm mb-3">
                  <span className="text-gray-600">Available:</span>
                  <span className="font-medium text-gray-900">{item.available_stock} {item.unit}</span>
                </div>

                {item.unit_price && (
                  <div className="flex items-center justify-between text-sm mb-3">
                    <span className="text-gray-600">Unit Price:</span>
                    <span className="font-medium text-gray-900">₹{item.unit_price.toLocaleString()}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-xs text-gray-600 mb-4">
                  <span className="px-2 py-1 bg-gray-100 rounded">{item.category_name}</span>
                  {item.is_weapon && (
                    <span className="px-2 py-1 bg-red-100 text-red-800 rounded flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Weapon
                    </span>
                  )}
                </div>

                <button
                  onClick={() => addToCart(item)}
                  disabled={item.available_stock === 0}
                  className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {item.available_stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cart Sidebar */}
      {showCart && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setShowCart(false)}>
          <div 
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Cart ({cart.length})</h2>
                <button onClick={() => setShowCart(false)} className="text-gray-500 hover:text-gray-700">
                  ✕
                </button>
              </div>

              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Your cart is empty</p>
                </div>
              ) : (
                <>
                  <div className="space-y-4 mb-6">
                    {cart.map(cartItem => (
                      <div key={cartItem.item.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{cartItem.item.name}</h3>
                            <p className="text-sm text-gray-600">{cartItem.item.item_code}</p>
                          </div>
                          <button
                            onClick={() => removeFromCart(cartItem.item.id)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Remove
                          </button>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateCartQuantity(cartItem.item.id, cartItem.quantity - 1)}
                              className="w-8 h-8 rounded border flex items-center justify-center hover:bg-gray-100"
                            >
                              -
                            </button>
                            <span className="w-12 text-center font-medium">{cartItem.quantity}</span>
                            <button
                              onClick={() => updateCartQuantity(cartItem.item.id, cartItem.quantity + 1)}
                              className="w-8 h-8 rounded border flex items-center justify-center hover:bg-gray-100"
                              disabled={cartItem.quantity >= cartItem.item.available_stock}
                            >
                              +
                            </button>
                          </div>
                          {cartItem.item.unit_price && (
                            <span className="font-medium">
                              ₹{(cartItem.item.unit_price * cartItem.quantity).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-4 mb-6">
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>Total Value:</span>
                      <span>₹{getTotalValue().toLocaleString()}</span>
                    </div>
                  </div>

                  <button
                    onClick={proceedToRequisition}
                    className="btn btn-primary w-full"
                  >
                    Proceed to Requisition
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CatalogPage
