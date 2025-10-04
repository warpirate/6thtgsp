import React, { useState, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Package, Plus, Filter, Search, Download } from 'lucide-react'
import { useAuth } from '@/lib/auth/AuthProvider'
import { ReceiptStatus } from '@/types'

// Mock data - replace with actual API calls
const mockReceipts = [
  {
    id: '1',
    receipt_id: 'REC-2024-001',
    item_name: 'Laptop Dell XPS 15',
    quantity: 5,
    unit: 'units',
    status: 'approved' as ReceiptStatus,
    created_at: '2024-10-01T10:00:00Z',
    created_by_user: { full_name: 'John Smith' },
  },
  {
    id: '2',
    receipt_id: 'REC-2024-002',
    item_name: 'Office Chairs',
    quantity: 20,
    unit: 'units',
    status: 'submitted' as ReceiptStatus,
    created_at: '2024-10-02T14:30:00Z',
    created_by_user: { full_name: 'Jane Doe' },
  },
  {
    id: '3',
    receipt_id: 'REC-2024-003',
    item_name: 'Printer Supplies',
    quantity: 100,
    unit: 'boxes',
    status: 'draft' as ReceiptStatus,
    created_at: '2024-10-03T09:15:00Z',
    created_by_user: { full_name: 'Mike Johnson' },
  },
  {
    id: '4',
    receipt_id: 'REC-2024-004',
    item_name: 'Network Cables',
    quantity: 50,
    unit: 'meters',
    status: 'verified' as ReceiptStatus,
    created_at: '2024-10-03T11:00:00Z',
    created_by_user: { full_name: 'Sarah Wilson' },
  },
]

const ReceiptsPage: React.FC = () => {
  const { hasPermission } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '')
  const [statusFilter, setStatusFilter] = useState<ReceiptStatus[]>([])
  const [showFilters, setShowFilters] = useState(false)

  // Filter receipts
  const filteredReceipts = useMemo(() => {
    return mockReceipts.filter((receipt) => {
      const matchesSearch = receipt.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        receipt.receipt_id.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter.length === 0 || statusFilter.includes(receipt.status)
      return matchesSearch && matchesStatus
    })
  }, [searchTerm, statusFilter])

  const getStatusBadge = (status: ReceiptStatus) => {
    const config = {
      draft: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Draft' },
      submitted: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Submitted' },
      verified: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Verified' },
      approved: { bg: 'bg-green-100', text: 'text-green-800', label: 'Approved' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejected' },
    }[status]

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    )
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
          <h1 className="text-3xl font-bold text-foreground">Stock Receipts</h1>
          <p className="mt-1 text-muted-foreground">
            Manage and track all stock receipt records
          </p>
        </div>

        {hasPermission('create_receipt') && (
          <Link
            to="/receipts/create"
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Receipt
          </Link>
        )}
      </div>

      {/* Search and Filters */}
      <div className="card p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-muted-foreground" />
            </div>
            <input
              type="text"
              className="input pl-10 w-full"
              placeholder="Search receipts by item name or receipt ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filter Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn btn-secondary flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>

          {/* Export Button */}
          <button className="btn btn-secondary flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t">
            <div className="space-y-3">
              <label className="label">Status</label>
              <div className="flex flex-wrap gap-2">
                {(['draft', 'submitted', 'verified', 'approved', 'rejected'] as ReceiptStatus[]).map((status) => (
                  <label key={status} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={statusFilter.includes(status)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setStatusFilter([...statusFilter, status])
                        } else {
                          setStatusFilter(statusFilter.filter((s) => s !== status))
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm capitalize">{status}</span>
                  </label>
                ))}
              </div>
              {statusFilter.length > 0 && (
                <button
                  onClick={() => setStatusFilter([])}
                  className="text-sm text-primary hover:text-primary/80"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredReceipts.length} of {mockReceipts.length} receipts
      </div>

      {/* Receipts Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Receipt ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Item Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Created By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {filteredReceipts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <Package className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-2 text-sm font-medium text-foreground">No receipts found</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {searchTerm || statusFilter.length > 0
                        ? 'Try adjusting your search or filters'
                        : 'Get started by creating a new receipt'}
                    </p>
                    {hasPermission('create_receipt') && !searchTerm && statusFilter.length === 0 && (
                      <div className="mt-6">
                        <Link
                          to="/receipts/create"
                          className="inline-flex items-center gap-2 btn btn-primary"
                        >
                          <Plus className="w-4 h-4" />
                          New Receipt
                        </Link>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                filteredReceipts.map((receipt) => (
                  <tr key={receipt.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        to={`/receipts/${receipt.id}`}
                        className="text-sm font-medium text-primary hover:text-primary/80"
                      >
                        {receipt.receipt_id}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-foreground">{receipt.item_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-foreground">
                        {receipt.quantity} {receipt.unit}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(receipt.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-foreground">{receipt.created_by_user.full_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-muted-foreground">{formatDate(receipt.created_at)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Link
                        to={`/receipts/${receipt.id}`}
                        className="text-primary hover:text-primary/80 font-medium"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default ReceiptsPage
