import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { receiptApi, reportApi } from '@/utils/api';
import { Receipt, DashboardStats } from '@/types';
import StatusBadge from '@/components/StatusBadge';
import {
  Package,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Users,
  FileText,
  Plus
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentReceipts, setRecentReceipts] = useState<Receipt[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);

      // Load stats
      const statsResponse = await receiptApi.getStats();
      setStats(statsResponse.data.data || {});

      // Load recent receipts
      const receiptsResponse = await receiptApi.getAll({
        limit: 5
      });
      setRecentReceipts(receiptsResponse.data.data || []);

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome message */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.full_name}
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          {user?.rank && `${user.rank} - `}{user?.service_number}
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {user?.role === 'user' && (
          <>
            <StatsCard
              title="My Drafts"
              value={stats?.pending_submissions || 0}
              icon={FileText}
              color="blue"
            />
            <StatsCard
              title="Submitted"
              value={stats?.total_receipts || 0}
              icon={Clock}
              color="orange"
            />
          </>
        )}

        {user?.role === 'admin' && (
          <>
            <StatsCard
              title="Pending Verification"
              value={stats?.pending_verifications || 0}
              icon={AlertCircle}
              color="orange"
            />
            <StatsCard
              title="Total Receipts"
              value={stats?.total_receipts || 0}
              icon={Package}
              color="blue"
            />
          </>
        )}

        {user?.role === 'super_admin' && (
          <>
            <StatsCard
              title="Pending Verification"
              value={stats?.pending_verifications || 0}
              icon={AlertCircle}
              color="orange"
            />
            <StatsCard
              title="Pending Approval"
              value={stats?.pending_approvals || 0}
              icon={CheckCircle}
              color="green"
            />
            <StatsCard
              title="Total Users"
              value={stats?.total_receipts || 0}
              icon={Users}
              color="blue"
            />
            <StatsCard
              title="Total Receipts"
              value={stats?.total_receipts || 0}
              icon={Package}
              color="purple"
            />
          </>
        )}

        {user?.role === 'semi_user' && (
          <StatsCard
            title="Total Receipts"
            value={stats?.total_receipts || 0}
            icon={Package}
            color="blue"
          />
        )}
      </div>

      {/* Quick actions */}
      {user?.role === 'user' && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
          <div className="flex space-x-4">
            <Link
              to="/receipts/create"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create New Receipt
            </Link>
          </div>
        </div>
      )}

      {/* Recent receipts */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Recent Receipts</h2>
            <Link
              to="/receipts"
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              View all
            </Link>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {recentReceipts.length > 0 ? (
            recentReceipts.map((receipt) => (
              <div key={receipt.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <p className="text-sm font-medium text-gray-900">
                        {receipt.grn_number}
                      </p>
                      <StatusBadge status={receipt.status} />
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {receipt.supplier_name} • {receipt.challan_number}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(receipt.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Link
                    to={`/receipts/${receipt.id}`}
                    className="text-sm text-blue-600 hover:text-blue-500"
                  >
                    View
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-8 text-center">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No receipts yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                {user?.role === 'user'
                  ? 'Create your first receipt to get started.'
                  : 'No receipts have been created yet.'
                }
              </p>
              {user?.role === 'user' && (
                <div className="mt-6">
                  <Link
                    to="/receipts/create"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Receipt
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface StatsCardProps {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: 'blue' | 'green' | 'orange' | 'purple';
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon: Icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    orange: 'bg-orange-500',
    purple: 'bg-purple-500'
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <div className={`p-3 rounded-md ${colorClasses[color]}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-gray-500 truncate">
              {title}
            </dt>
            <dd className="text-lg font-medium text-gray-900">
              {value}
            </dd>
          </dl>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
