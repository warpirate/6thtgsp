import React from 'react'
import { Link } from 'react-router-dom'
import { Shield, ArrowLeft, Home } from 'lucide-react'
import { useAuth } from '@/lib/auth/AuthProvider'

const UnauthorizedPage: React.FC = () => {
  const { userProfile, roleName } = useAuth()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full text-center">
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center">
            <Shield className="w-12 h-12 text-red-600" />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Access Denied</h1>
        <p className="text-gray-600 mb-4">
          You don't have permission to access this page.
        </p>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-yellow-800">
            <strong>Current Role:</strong> {roleName || 'Unknown'}<br />
            <strong>User:</strong> {userProfile?.full_name || 'Unknown User'}
          </p>
          <p className="text-xs text-yellow-700 mt-2">
            Contact your administrator to request access or role upgrade.
          </p>
        </div>
        
        <div className="space-y-3">
          <Link
            to="/dashboard"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors w-full justify-center"
          >
            <Home className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          
          <Link
            to="/receipts"
            className="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors w-full justify-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            View Receipts
          </Link>
        </div>
      </div>
    </div>
  )
}

export default UnauthorizedPage
