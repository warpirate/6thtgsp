import React from 'react'
import { Package } from 'lucide-react'

interface AuthLayoutProps {
  children: React.ReactNode
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-background">
      <div className="flex min-h-screen">
        {/* Left Side - Branding */}
        <div className="hidden lg:flex lg:w-1/2 xl:w-2/5 bg-primary text-primary-foreground">
          <div className="flex flex-col justify-center px-12 py-16">
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-primary-foreground/10 rounded-lg">
                  <Package className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Quarter Master</h1>
                  <p className="text-primary-foreground/80 text-sm">Inventory Management</p>
                </div>
              </div>
              
              <h2 className="text-4xl font-bold mb-4 leading-tight">
                Secure Inventory
                <br />
                Management System
              </h2>
              
              <p className="text-lg text-primary-foreground/90 mb-8 leading-relaxed">
                Streamline your inventory operations with role-based workflows, 
                comprehensive audit trails, and military-grade security.
              </p>
            </div>

            {/* Features List */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-accent rounded-full mt-2 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold mb-1">Role-Based Access Control</h3>
                  <p className="text-sm text-primary-foreground/80">
                    Four-tier authorization with granular permissions
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-accent rounded-full mt-2 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold mb-1">Workflow Automation</h3>
                  <p className="text-sm text-primary-foreground/80">
                    Automated approval processes from draft to approved
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-accent rounded-full mt-2 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold mb-1">Complete Audit Trail</h3>
                  <p className="text-sm text-primary-foreground/80">
                    Comprehensive logging for compliance and security
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-12 pt-8 border-t border-primary-foreground/20">
              <p className="text-sm text-primary-foreground/70">
                Built with enterprise-grade security and modern web technologies
              </p>
            </div>
          </div>
        </div>

        {/* Right Side - Authentication Form */}
        <div className="flex-1 flex items-center justify-center px-4 py-16">
          <div className="w-full max-w-md">
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-8">
              <div className="inline-flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Package className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">Quarter Master</h1>
                  <p className="text-sm text-muted-foreground">Inventory Management</p>
                </div>
              </div>
            </div>

            {/* Auth Form Container */}
            <div className="bg-card rounded-lg border shadow-sm p-8">
              {children}
            </div>

            {/* Footer Links */}
            <div className="mt-8 text-center text-sm text-muted-foreground">
              <p>
                Need help?{' '}
                <button className="text-primary hover:text-primary/80 font-medium">
                  Contact Support
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuthLayout
