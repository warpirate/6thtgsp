import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/context/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';

// Pages
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import ReceiptList from '@/pages/ReceiptList';
import ReceiptCreate from '@/pages/ReceiptCreate';
import ReceiptDetail from '@/pages/ReceiptDetail';
import ItemList from '@/pages/ItemList';
import ItemCreate from '@/pages/ItemCreate';
import UserList from '@/pages/UserList';
import UserCreate from '@/pages/UserCreate';
import Reports from '@/pages/Reports';
import AuditLogs from '@/pages/AuditLogs';
import Profile from '@/pages/Profile';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />

            {/* Protected routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="receipts" element={<ReceiptList />} />
              <Route path="receipts/create" element={<ReceiptCreate />} />
              <Route path="receipts/:id" element={<ReceiptDetail />} />
              <Route path="receipts/:id/edit" element={<ReceiptCreate />} />
              <Route path="items" element={<ItemList />} />
              <Route path="items/create" element={<ItemCreate />} />
              <Route path="items/:id/edit" element={<ItemCreate />} />
              <Route path="users" element={<UserList />} />
              <Route path="users/create" element={<UserCreate />} />
              <Route path="users/:id/edit" element={<UserCreate />} />
              <Route path="reports" element={<Reports />} />
              <Route path="audit-logs" element={<AuditLogs />} />
              <Route path="profile" element={<Profile />} />
            </Route>

            {/* 404 route */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>

          {/* Toast notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                theme: {
                  primary: '#10B981',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 5000,
                theme: {
                  primary: '#EF4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
