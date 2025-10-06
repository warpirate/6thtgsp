import React, { useState } from 'react'
import { CheckCircle, Clock } from 'lucide-react'
import { useAuth } from '@/lib/auth/AuthProvider'

const ApprovalsPage: React.FC = () => {
  const { hasPermission } = useAuth()
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Approvals</h1>
        <p className="mt-1 text-muted-foreground">
          Review and approve pending receipts
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('pending')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'pending'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
            }`}
          >
            Pending Approvals
            <span className="ml-2 bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs">
              0
            </span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'history'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
            }`}
          >
            History
          </button>
        </nav>
      </div>

      {/* Pending Tab */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          <div className="card p-12 text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-medium text-foreground">No pending approvals</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              All receipts have been processed. New submissions will appear here.
            </p>
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="card p-12 text-center">
            <Clock className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-medium text-foreground">No history yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Approval history will appear here once you start processing receipts.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default ApprovalsPage
