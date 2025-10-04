import React from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Home, RefreshCw } from 'lucide-react'

const ServerErrorPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="flex justify-center mb-6">
            <AlertTriangle className="w-20 h-20 text-warning" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Server Error</h1>
          <p className="text-muted-foreground mt-2">
            Something went wrong with our servers. We're working to fix this issue. Please try again later.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => window.location.reload()}
            className="btn btn-secondary flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
          
          <Link
            to="/dashboard"
            className="btn btn-primary flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}

export default ServerErrorPage
