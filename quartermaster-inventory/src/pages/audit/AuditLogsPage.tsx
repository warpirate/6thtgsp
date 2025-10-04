import React, { useState } from 'react'
import { Search, Download, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'

// Mock audit logs data
const mockLogs = [
  {
    id: '1',
    action: 'created',
    entity_type: 'receipt',
    entity_id: 'REC-2024-001',
    user_name: 'John Smith',
    created_at: '2024-10-04T14:30:00Z',
    metadata: { item_name: 'Laptop Dell XPS 15', quantity: 5 },
  },
  {
    id: '2',
    action: 'verified',
    entity_type: 'receipt',
    entity_id: 'REC-2024-001',
    user_name: 'Jane Doe',
    created_at: '2024-10-04T15:00:00Z',
    metadata: { comments: 'All documents verified' },
  },
  {
    id: '3',
    action: 'approved',
    entity_type: 'receipt',
    entity_id: 'REC-2024-001',
    user_name: 'Admin User',
    created_at: '2024-10-04T15:30:00Z',
    metadata: { comments: 'Approved for processing' },
  },
  {
    id: '4',
    action: 'updated',
    entity_type: 'user',
    entity_id: 'user-002',
    user_name: 'Admin User',
    created_at: '2024-10-04T10:15:00Z',
    metadata: { field: 'role', old_value: 'user', new_value: 'semi_user' },
  },
  {
    id: '5',
    action: 'deleted',
    entity_type: 'document',
    entity_id: 'doc-003',
    user_name: 'John Smith',
    created_at: '2024-10-03T16:45:00Z',
    metadata: { file_name: 'old_receipt.pdf' },
  },
]

const AuditLogsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [entityFilter, setEntityFilter] = useState('')
  const [expandedLog, setExpandedLog] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(false)

  const filteredLogs = mockLogs.filter((log) => {
    const matchesSearch = log.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entity_id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesAction = !actionFilter || log.action === actionFilter
    const matchesEntity = !entityFilter || log.entity_type === entityFilter
    return matchesSearch && matchesAction && matchesEntity
  })

  const getActionColor = (action: string) => {
    const colors = {
      created: 'text-green-600 bg-green-100',
      updated: 'text-blue-600 bg-blue-100',
      deleted: 'text-red-600 bg-red-100',
      verified: 'text-yellow-600 bg-yellow-100',
      approved: 'text-green-600 bg-green-100',
      rejected: 'text-red-600 bg-red-100',
    }
    return colors[action as keyof typeof colors] || 'text-gray-600 bg-gray-100'
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  const handleExport = () => {
    alert('Export logs - API integration pending')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Audit Logs</h1>
          <p className="mt-1 text-muted-foreground">
            Track all system activities and changes
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="btn btn-secondary flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button className="btn btn-secondary flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by user or entity ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10 w-full"
            />
          </div>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="input"
          >
            <option value="">All Actions</option>
            <option value="created">Created</option>
            <option value="updated">Updated</option>
            <option value="deleted">Deleted</option>
            <option value="verified">Verified</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>

          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="input"
          >
            <option value="">All Entities</option>
            <option value="receipt">Receipt</option>
            <option value="user">User</option>
            <option value="document">Document</option>
          </select>

          <label className="flex items-center gap-2 whitespace-nowrap">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">Auto-refresh (30s)</span>
          </label>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredLogs.length} of {mockLogs.length} logs
      </div>

      {/* Logs Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase w-12">
                  {/* Expand column */}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Entity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Entity ID
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {filteredLogs.map((log) => (
                <React.Fragment key={log.id}>
                  <tr className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        {expandedLog === log.id ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground whitespace-nowrap">
                      {formatDate(log.created_at)}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      {log.user_name}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                        {log.action.charAt(0).toUpperCase() + log.action.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm capitalize">
                      {log.entity_type}
                    </td>
                    <td className="px-6 py-4 text-sm font-mono">
                      {log.entity_id}
                    </td>
                  </tr>
                  {expandedLog === log.id && (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 bg-muted/20">
                        <div className="text-sm">
                          <h4 className="font-semibold mb-2">Details:</h4>
                          <pre className="bg-card p-3 rounded border border-border overflow-x-auto">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default AuditLogsPage
