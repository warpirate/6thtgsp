# Inventory & Reports Page Implementation

**Status**: 🔴 **High Priority**  
**Current File**: `src/pages/inventory/InventoryPage.tsx` (19 lines placeholder)  
**Estimated Effort**: 2-3 days  
**Complexity**: Medium-High  

---

## 📊 Page Purpose

Display inventory analytics, trends, and reports with interactive charts and export functionality.

---

## 🎯 Required Features

### 1. Summary Cards (Top Section)
Display key inventory metrics:
- **Total Items** - Count of unique items in inventory
- **Total Value** - Sum of all approved receipts (quantity × unit_price)
- **Low Stock Alerts** - Items below threshold (future feature)
- **Recent Additions** - Items added in last 30 days

### 2. Filters & Controls
- **Date Range Picker** - Filter data by date range
- **Group By Selector** - Group data by: Item, Category, Supplier
- **Export Button** - Export to CSV, XLSX, PDF
- **Refresh Button** - Manually refresh data

### 3. Charts Section
#### A. Inventory Trends (Line Chart)
- X-axis: Date
- Y-axis: Number of items received/approved
- Two lines: Received, Approved
- Time range: Last 30/60/90 days

#### B. Category Breakdown (Pie Chart)
- Show distribution by category or supplier
- Interactive: Click to filter table below

#### C. Value Over Time (Bar Chart)
- Show total value of inventory over time
- Monthly aggregation

### 4. Detailed Table
- All approved receipts with:
  - Receipt ID, Item Name, Quantity, Unit, Unit Price, Total Value
  - Supplier, Date, Status
- Sortable columns
- Pagination
- Click row to view receipt details

---

## 🔧 Implementation Plan

### Phase 1: Install Dependencies (15 minutes)

```bash
npm install recharts
npm install xlsx
npm install jspdf jspdf-autotable
npm install date-fns
```

### Phase 2: Create API Functions (1 hour)

**File**: `src/lib/api/inventory.ts` (NEW)

```typescript
import { supabase } from '@/lib/supabase'

export interface InventoryStats {
  totalItems: number
  totalValue: number
  recentAdditions: number
  approvedToday: number
}

export interface InventoryTrend {
  date: string
  received: number
  approved: number
}

export interface CategoryBreakdown {
  name: string
  value: number
  count: number
}

export const inventoryApi = {
  // Get summary statistics
  async getStats(dateFrom?: string, dateTo?: string): Promise<InventoryStats> {
    let query = supabase
      .from('stock_receipts')
      .select('quantity, unit_price, status, created_at')

    if (dateFrom) query = query.gte('created_at', dateFrom)
    if (dateTo) query = query.lte('created_at', dateTo)

    const { data, error } = await query

    if (error) throw error

    const totalItems = data?.length || 0
    const totalValue = data?.reduce((sum, item) => {
      if (item.status === 'approved' && item.unit_price) {
        return sum + (item.quantity * item.unit_price)
      }
      return sum
    }, 0) || 0

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const recentAdditions = data?.filter(
      item => new Date(item.created_at) > thirtyDaysAgo
    ).length || 0

    const today = new Date().toISOString().split('T')[0]
    const approvedToday = data?.filter(
      item => item.status === 'approved' && 
              item.created_at?.startsWith(today)
    ).length || 0

    return { totalItems, totalValue, recentAdditions, approvedToday }
  },

  // Get trends data for charts
  async getTrends(days: number = 30): Promise<InventoryTrend[]> {
    const dateFrom = new Date()
    dateFrom.setDate(dateFrom.getDate() - days)

    const { data, error } = await supabase
      .from('stock_receipts')
      .select('created_at, submitted_at, approved_at')
      .gte('created_at', dateFrom.toISOString())
      .order('created_at', { ascending: true })

    if (error) throw error

    // Group by date
    const trends = new Map<string, { received: number; approved: number }>()
    
    data?.forEach(item => {
      const date = item.created_at.split('T')[0]
      const existing = trends.get(date) || { received: 0, approved: 0 }
      existing.received++
      if (item.approved_at) existing.approved++
      trends.set(date, existing)
    })

    return Array.from(trends.entries()).map(([date, counts]) => ({
      date,
      ...counts,
    }))
  },

  // Get category breakdown
  async getCategoryBreakdown(groupBy: 'supplier' | 'unit' = 'supplier') {
    const { data, error } = await supabase
      .from('stock_receipts')
      .select('supplier, unit, quantity, unit_price')
      .eq('status', 'approved')

    if (error) throw error

    const breakdown = new Map<string, { count: number; value: number }>()

    data?.forEach(item => {
      const key = groupBy === 'supplier' 
        ? (item.supplier || 'Unknown')
        : (item.unit || 'Unknown')
      
      const existing = breakdown.get(key) || { count: 0, value: 0 }
      existing.count += item.quantity
      if (item.unit_price) {
        existing.value += item.quantity * item.unit_price
      }
      breakdown.set(key, existing)
    })

    return Array.from(breakdown.entries()).map(([name, stats]) => ({
      name,
      ...stats,
    }))
  },

  // Get detailed inventory list
  async getDetailedInventory() {
    const { data, error } = await supabase
      .from('stock_receipts')
      .select(`
        id,
        receipt_id,
        item_name,
        quantity,
        unit,
        unit_price,
        supplier,
        created_at,
        approved_at,
        status
      `)
      .eq('status', 'approved')
      .order('approved_at', { ascending: false })

    if (error) throw error
    return data
  },
}
```

### Phase 3: Create Custom Hooks (30 minutes)

**File**: `src/hooks/useInventory.ts` (NEW)

```typescript
import { useQuery } from '@tanstack/react-query'
import { inventoryApi } from '@/lib/api/inventory'

export const useInventoryStats = (dateFrom?: string, dateTo?: string) => {
  return useQuery({
    queryKey: ['inventory-stats', dateFrom, dateTo],
    queryFn: () => inventoryApi.getStats(dateFrom, dateTo),
  })
}

export const useInventoryTrends = (days: number = 30) => {
  return useQuery({
    queryKey: ['inventory-trends', days],
    queryFn: () => inventoryApi.getTrends(days),
  })
}

export const useCategoryBreakdown = (groupBy: 'supplier' | 'unit') => {
  return useQuery({
    queryKey: ['category-breakdown', groupBy],
    queryFn: () => inventoryApi.getCategoryBreakdown(groupBy),
  })
}

export const useDetailedInventory = () => {
  return useQuery({
    queryKey: ['detailed-inventory'],
    queryFn: () => inventoryApi.getDetailedInventory(),
  })
}
```

### Phase 4: Build the Component (4-6 hours)

**File**: `src/pages/inventory/InventoryPage.tsx`

```typescript
import React, { useState } from 'react'
import { 
  TrendingUp, 
  Package, 
  DollarSign, 
  Calendar,
  Download,
  RefreshCw
} from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import {
  useInventoryStats,
  useInventoryTrends,
  useCategoryBreakdown,
  useDetailedInventory,
} from '@/hooks/useInventory'
import * as XLSX from 'xlsx'
import { format } from 'date-fns'

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

const InventoryPage: React.FC = () => {
  const [dateRange, setDateRange] = useState<{ from?: string; to?: string }>({})
  const [groupBy, setGroupBy] = useState<'supplier' | 'unit'>('supplier')
  const [trendDays, setTrendDays] = useState(30)

  const { data: stats, isLoading: statsLoading } = useInventoryStats(
    dateRange.from,
    dateRange.to
  )
  const { data: trends, isLoading: trendsLoading } = useInventoryTrends(trendDays)
  const { data: breakdown, isLoading: breakdownLoading } = useCategoryBreakdown(groupBy)
  const { data: inventory, isLoading: inventoryLoading, refetch } = useDetailedInventory()

  const handleExport = (format: 'csv' | 'xlsx' | 'pdf') => {
    if (!inventory) return

    const data = inventory.map(item => ({
      'Receipt ID': item.receipt_id,
      'Item Name': item.item_name,
      'Quantity': item.quantity,
      'Unit': item.unit,
      'Unit Price': item.unit_price || 0,
      'Total Value': (item.quantity * (item.unit_price || 0)).toFixed(2),
      'Supplier': item.supplier || 'N/A',
      'Date': format(new Date(item.approved_at || item.created_at), 'yyyy-MM-dd'),
    }))

    if (format === 'csv' || format === 'xlsx') {
      const ws = XLSX.utils.json_to_sheet(data)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Inventory')
      XLSX.writeFile(wb, `inventory-report.${format}`)
    } else if (format === 'pdf') {
      // TODO: Implement PDF export with jspdf
      alert('PDF export coming soon')
    }
  }

  if (statsLoading) return <div>Loading...</div>

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
        <button
          onClick={() => refetch()}
          className="btn btn-secondary flex items-center gap-2"
        >
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
              <span className="self-center">to</span>
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

          <div>
            <label className="label">Trend Period</label>
            <select
              value={trendDays}
              onChange={(e) => setTrendDays(Number(e.target.value))}
              className="input"
            >
              <option value={30}>Last 30 Days</option>
              <option value={60}>Last 60 Days</option>
              <option value={90}>Last 90 Days</option>
            </select>
          </div>

          <div className="ml-auto self-end">
            <div className="flex gap-2">
              <button
                onClick={() => handleExport('csv')}
                className="btn btn-secondary btn-sm"
              >
                <Download className="w-4 h-4 mr-2" />
                CSV
              </button>
              <button
                onClick={() => handleExport('xlsx')}
                className="btn btn-secondary btn-sm"
              >
                <Download className="w-4 h-4 mr-2" />
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
              <p className="text-2xl font-bold">{stats?.totalItems || 0}</p>
            </div>
            <Package className="w-10 h-10 text-blue-600" />
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Value</p>
              <p className="text-2xl font-bold">
                ${(stats?.totalValue || 0).toFixed(2)}
              </p>
            </div>
            <DollarSign className="w-10 h-10 text-green-600" />
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Recent (30d)</p>
              <p className="text-2xl font-bold">{stats?.recentAdditions || 0}</p>
            </div>
            <Calendar className="w-10 h-10 text-purple-600" />
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Approved Today</p>
              <p className="text-2xl font-bold">{stats?.approvedToday || 0}</p>
            </div>
            <TrendingUp className="w-10 h-10 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trends Chart */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">Inventory Trends</h3>
          {trendsLoading ? (
            <div>Loading chart...</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="received" stroke="#3b82f6" name="Received" />
                <Line type="monotone" dataKey="approved" stroke="#22c55e" name="Approved" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Category Breakdown */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">
            By {groupBy === 'supplier' ? 'Supplier' : 'Unit Type'}
          </h3>
          {breakdownLoading ? (
            <div>Loading chart...</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={breakdown}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {breakdown?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Detailed Table */}
      <div className="card">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">Detailed Inventory</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
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
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {inventory?.map((item) => (
                <tr key={item.id} className="hover:bg-muted/50">
                  <td className="px-6 py-4 text-sm">{item.receipt_id}</td>
                  <td className="px-6 py-4 text-sm">{item.item_name}</td>
                  <td className="px-6 py-4 text-sm">
                    {item.quantity} {item.unit}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    ${(item.unit_price || 0).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold">
                    ${((item.quantity * (item.unit_price || 0)).toFixed(2))}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {format(new Date(item.approved_at || item.created_at), 'MMM dd, yyyy')}
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
```

---

## 📋 Testing Checklist

- [ ] Summary cards show correct data
- [ ] Date range filter works
- [ ] Group by selector updates pie chart
- [ ] Trend period selector updates line chart
- [ ] Charts render correctly
- [ ] CSV export works
- [ ] Excel export works
- [ ] Table pagination works (if added)
- [ ] Responsive on mobile
- [ ] Refresh button updates data

---

## 🎯 Success Criteria

✅ All 4 summary cards display correctly  
✅ Line chart shows trends over time  
✅ Pie chart shows category breakdown  
✅ Table displays all approved receipts  
✅ Export to CSV/Excel works  
✅ Filters update all visualizations  
✅ Responsive design  

---

**Estimated Time**: 16-24 hours (2-3 days)  
**Priority**: 🔴 **High**  
**Dependencies**: API Integration, Recharts, XLSX  

---

**Last Updated**: 2025-10-04
