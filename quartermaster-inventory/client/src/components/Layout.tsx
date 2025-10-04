import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  Package,
  PlusCircle,
  Users,
  FileText,
  Search,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  User
} from 'lucide-react';

const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      roles: ['semi_user', 'user', 'admin', 'super_admin']
    },
    {
      name: 'Receipts',
      href: '/receipts',
      icon: Package,
      roles: ['semi_user', 'user', 'admin', 'super_admin']
    },
    {
      name: 'Create Receipt',
      href: '/receipts/create',
      icon: PlusCircle,
      roles: ['user', 'admin', 'super_admin']
    },
    {
      name: 'Items',
      href: '/items',
      icon: Search,
      roles: ['semi_user', 'user', 'admin', 'super_admin']
    },
    {
      name: 'Users',
      href: '/users',
      icon: Users,
      roles: ['super_admin']
    },
    {
      name: 'Reports',
      href: '/reports',
      icon: FileText,
      roles: ['admin', 'super_admin']
    },
    {
      name: 'Audit Logs',
      href: '/audit-logs',
      icon: FileText,
      roles: ['admin', 'super_admin']
    }
  ];

  const filteredNavigation = navigation.filter(item =>
    user?.role && item.roles.includes(user.role)
  );

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">
            Quarter Master
          </h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav className="mt-8 px-4">
          <ul className="space-y-2">
            {filteredNavigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive
                        ? 'bg-blue-100 text-blue-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon className={`mr-3 h-5 w-5 ${
                      isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                    }`} />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col flex-1">
        {/* Top header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-1 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              >
                <Menu className="h-6 w-6" />
              </button>

              <div className="ml-4 lg:ml-0">
                <h2 className="text-lg font-semibold text-gray-900">
                  {getPageTitle(location.pathname)}
                </h2>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <button className="p-1 rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-100">
                <Bell className="h-6 w-6" />
              </button>

              {/* User menu */}
              <div className="relative">
                <button className="flex items-center space-x-2 p-1 rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-100">
                  <User className="h-6 w-6" />
                  <span className="text-sm font-medium text-gray-700">
                    {user?.full_name}
                  </span>
                </button>

                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200 hidden">
                  <Link
                    to="/profile"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <LogOut className="inline h-4 w-4 mr-2" />
                    Sign out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

function getPageTitle(pathname: string): string {
  const pathSegments = pathname.split('/').filter(Boolean);

  if (pathSegments.length === 0) return 'Dashboard';

  const segment = pathSegments[0];

  switch (segment) {
    case 'dashboard':
      return 'Dashboard';
    case 'receipts':
      return pathSegments[1] === 'create' ? 'Create Receipt' : 'Receipts';
    case 'items':
      return pathSegments[1] === 'create' ? 'Create Item' : 'Items';
    case 'users':
      return pathSegments[1] === 'create' ? 'Create User' : 'Users';
    case 'reports':
      return 'Reports';
    case 'audit-logs':
      return 'Audit Logs';
    case 'profile':
      return 'Profile';
    default:
      return 'Dashboard';
  }
}

export default Layout;
