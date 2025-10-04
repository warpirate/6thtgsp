import React, { useState } from 'react'
import { TrendingUp, Package, DollarSign, Calendar, Download, RefreshCw } from 'lucide-react'

// Mock data - replace with API calls
const mockStats = {
  totalItems: 47,
  totalValue: 125450.75,
  recentAdditions: 12,
  approvedToday: 3,
}

const mockTrends = [
  { date: '2024-09-28', received: 5, approved: 4 },
  { date: '2024-09-29', received: 3, approved: 2 },
  { date: '2024-09-30', received: 7, approved: 6 },
  { date: '2024-10-01', received: 10, approved: 8 },
  { date: '2024-10-02', received: 6, approved: 5 },
  { date: '2024-10-03', received: 8, approved: 7 },
  { date: '2024-10-04', received: 4, approved: 3 },
]

const mockCategoryBreakdown = [
  { name: 'Electronics', count: 25, value: 75000 },
  { name: 'Furniture', count: 15, value: 30000 },
  { name: 'Office Supplies', count: 7, value: 20450.75 },
]

const mockInventory = [
  {
    id: '1',
    receipt_id: 'REC-2024-001',
    item_name: 'Laptop Dell XPS 15',
    quantity: 5,
    unit: 'units',
    unit_price: 1299.99,
    supplier: 'Dell Direct',
    approved_at: '2024-10-01T10:00:00Z',
  },
  {
    id: '2',
    receipt_id: 'REC-2024-002',
    item_name: 'Office Chairs',
    quantity: 20,
    unit: 'units',
    unit_price: 299.50,
    supplier: 'Office Depot',
    approved_at: '2024-10-02T14:30:00Z',
  },
  {
    id: '3',
    receipt_id: 'REC-2024-003',
    item_name: 'Printer HP LaserJet',
    quantity: 3,
    unit: 'units',
    unit_price: 599.00,
    supplier: 'HP Direct',
    approved_at: '2024-10-03T09:15:00Z',
  },
]

const InventoryPage: React.FC = () => {
  const [dateRange, setDateRange] = useState<{ from?: string; to?: string }>({})
  const [groupBy, setGroupBy] = useState<'supplier' | 'unit'>('supplier')

  const handleExport = (format: 'csv' | 'xlsx') => {
    // TODO: Implement export
    alert(`Export to ${format.toUpperCase()} - Coming soon!`)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Inventory & Reports</h1>
          <p className="mt-1 text-muted-foreground">
            Track inventory trends and generate reports
          </p>
        </div>
        <button className="btn btn-secondary flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="label">Date Range</label>
            <div className="flex gap-2">
              <input
                type="date"
                value={dateRange.from || ''}
                onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                className="input"
              />
              <span className="self-center text-muted-foreground">to</span>
              <input
                type="date"
                value={dateRange.to || ''}
                onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                className="input"
              />
            </div>
          </div>

          <div>
            <label className="label">Group By</label>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as 'supplier' | 'unit')}
              className="input"
            >
              <option value="supplier">Supplier</option>
              <option value="unit">Unit Type</option>
            </select>
          </div>

          <div className="ml-auto self-end">
            <div className="flex gap-2">
              <button
                onClick={() => handleExport('csv')}
                className="btn btn-secondary btn-sm flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                CSV
              </button>
              <button
                onClick={() => handleExport('xlsx')}
                className="btn btn-secondary btn-sm flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Excel
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Items</p>
              <p className="text-2xl font-bold">{mockStats.totalItems}</p>
            </div>
            <Package className="w-10 h-10 text-blue-600" />
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Value</p>
              <p className="text-2xl font-bold">
                ${mockStats.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <DollarSign className="w-10 h-10 text-green-600" />
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Recent (30d)</p>
              <p className="text-2xl font-bold">{mockStats.recentAdditions}</p>
            </div>
            <Calendar className="w-10 h-10 text-purple-600" />
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Approved Today</p>
              <p className="text-2xl font-bold">{mockStats.approvedToday}</p>
            </div>
            <TrendingUp className="w-10 h-10 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Charts Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">Inventory Trends</h3>
          <div className="h-64 flex items-center justify-center bg-muted/20 rounded">
            <p className="text-muted-foreground">Chart: Install recharts library to display trends</p>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">Category Breakdown</h3>
          <div className="space-y-3">
            {mockCategoryBreakdown.map((category) => (
              <div key={category.name} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{category.name}</span>
                    <span className="text-sm text-muted-foreground">{category.count} items</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{ width: `${(category.count / mockStats.totalItems) * 100}%` }}
                    />
                  </div>
                </div>
                <span className="ml-4 text-sm font-semibold">
                  ${category.value.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="card">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">Detailed Inventory</h3>
        </div>
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
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Unit Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Total Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Supplier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {mockInventory.map((item) => (
                <tr key={item.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {item.receipt_id}
                  </td>
                  <td className="px-6 py-4 text-sm">{item.item_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {item.quantity} {item.unit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    ${item.unit_price.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                    ${(item.quantity * item.unit_price).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-sm">{item.supplier}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {formatDate(item.approved_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default InventoryPage
