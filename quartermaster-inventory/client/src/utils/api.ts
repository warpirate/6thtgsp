import axios, { AxiosResponse } from 'axios';
import {
  LoginRequest,
  LoginResponse,
  User,
  Item,
  Receipt,
  ReceiptWithItems,
  CreateReceiptRequest,
  UpdateReceiptRequest,
  CreateItemRequest,
  ApiResponse,
  PaginatedResponse,
  ReceiptRegisterReport,
  ItemHistoryReport,
  PendingApprovalsReport,
  SystemStats,
  ChangePasswordRequest,
  DashboardStats,
  ReceiptFilters,
  ItemFilters,
  UserFilters,
  AuditFilters,
  Document
} from '@/types';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, clear local storage and redirect to login
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Authentication API
export const authApi = {
  login: async (credentials: LoginRequest): Promise<AxiosResponse<LoginResponse>> => {
    return api.post('/auth/login', credentials);
  },

  logout: async (): Promise<AxiosResponse<{ message: string }>> => {
    return api.post('/auth/logout');
  },

  getMe: async (): Promise<AxiosResponse<ApiResponse<User>>> => {
    return api.get('/auth/me');
  },

  changePassword: async (data: ChangePasswordRequest): Promise<AxiosResponse<ApiResponse<{ message: string }>>> => {
    return api.post('/auth/change-password', data);
  },

  refreshToken: async (): Promise<AxiosResponse<ApiResponse<{ token: string }>>> => {
    return api.post('/auth/refresh-token');
  },
};

// User Management API
export const userApi = {
  getAll: async (filters?: UserFilters): Promise<AxiosResponse<PaginatedResponse<User>>> => {
    return api.get('/users', { params: filters });
  },

  getById: async (id: string): Promise<AxiosResponse<ApiResponse<User>>> => {
    return api.get(`/users/${id}`);
  },

  create: async (userData: Omit<User, 'id' | 'created_at' | 'updated_at' | 'last_login'> & { password: string }): Promise<AxiosResponse<ApiResponse<User>>> => {
    return api.post('/users', userData);
  },

  update: async (id: string, userData: Partial<User>): Promise<AxiosResponse<ApiResponse<User>>> => {
    return api.put(`/users/${id}`, userData);
  },

  deactivate: async (id: string): Promise<AxiosResponse<ApiResponse<{ message: string }>>> => {
    return api.post(`/users/${id}/deactivate`);
  },

  activate: async (id: string): Promise<AxiosResponse<ApiResponse<{ message: string }>>> => {
    return api.post(`/users/${id}/activate`);
  },

  resetPassword: async (id: string, newPassword: string): Promise<AxiosResponse<ApiResponse<{ message: string }>>> => {
    return api.post(`/users/${id}/reset-password`, { new_password: newPassword });
  },

  getActivity: async (id: string, filters?: AuditFilters): Promise<AxiosResponse<PaginatedResponse<any>>> => {
    return api.get(`/users/${id}/activity`, { params: filters });
  },
};

// Item Management API
export const itemApi = {
  getAll: async (filters?: ItemFilters): Promise<AxiosResponse<PaginatedResponse<Item>>> => {
    return api.get('/items', { params: filters });
  },

  getById: async (id: string): Promise<AxiosResponse<ApiResponse<Item>>> => {
    return api.get(`/items/${id}`);
  },

  create: async (itemData: CreateItemRequest): Promise<AxiosResponse<ApiResponse<Item>>> => {
    return api.post('/items', itemData);
  },

  update: async (id: string, itemData: Partial<CreateItemRequest>): Promise<AxiosResponse<ApiResponse<Item>>> => {
    return api.put(`/items/${id}`, itemData);
  },

  search: async (query: string, category?: string): Promise<AxiosResponse<PaginatedResponse<Item>>> => {
    return api.get('/items/search', { params: { q: query, category } });
  },

  getStats: async (): Promise<AxiosResponse<ApiResponse<any>>> => {
    return api.get('/items/stats');
  },

  getByCategory: async (category: string): Promise<AxiosResponse<PaginatedResponse<Item>>> => {
    return api.get(`/items/category/${category}`);
  },
};

// Receipt Management API
export const receiptApi = {
  getAll: async (filters?: ReceiptFilters): Promise<AxiosResponse<PaginatedResponse<Receipt>>> => {
    return api.get('/receipts', { params: filters });
  },

  getById: async (id: string): Promise<AxiosResponse<ApiResponse<ReceiptWithItems>>> => {
    return api.get(`/receipts/${id}`);
  },

  create: async (receiptData: CreateReceiptRequest): Promise<AxiosResponse<ApiResponse<ReceiptWithItems>>> => {
    return api.post('/receipts', receiptData);
  },

  update: async (id: string, receiptData: UpdateReceiptRequest): Promise<AxiosResponse<ApiResponse<ReceiptWithItems>>> => {
    return api.put(`/receipts/${id}`, receiptData);
  },

  submit: async (id: string): Promise<AxiosResponse<ApiResponse<Receipt>>> => {
    return api.post(`/receipts/${id}/submit`);
  },

  verify: async (id: string, action: 'verify' | 'reject', comments?: string): Promise<AxiosResponse<ApiResponse<Receipt>>> => {
    return api.post(`/receipts/${id}/verify`, { action, comments });
  },

  approve: async (id: string, action: 'approve' | 'reject', comments?: string): Promise<AxiosResponse<ApiResponse<Receipt>>> => {
    return api.post(`/receipts/${id}/approve`, { action, comments });
  },

  uploadDocument: async (id: string, file: File): Promise<AxiosResponse<ApiResponse<Document>>> => {
    const formData = new FormData();
    formData.append('document', file);

    return api.post(`/receipts/${id}/documents`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  deleteDocument: async (documentId: string): Promise<AxiosResponse<ApiResponse<{ message: string }>>> => {
    return api.delete(`/receipts/documents/${documentId}`);
  },

  getStats: async (): Promise<AxiosResponse<ApiResponse<DashboardStats>>> => {
    return api.get('/receipts/stats');
  },
};

// Report API
export const reportApi = {
  getReceiptRegister: async (filters?: any): Promise<AxiosResponse<ReceiptRegisterReport>> => {
    return api.get('/reports/receipt-register', { params: filters });
  },

  getItemHistory: async (itemId: string, filters?: any): Promise<AxiosResponse<ApiResponse<ItemHistoryReport>>> => {
    return api.get(`/reports/item-history/${itemId}`, { params: filters });
  },

  getPendingApprovals: async (type: 'verification' | 'approval'): Promise<AxiosResponse<PendingApprovalsReport>> => {
    return api.get('/reports/pending-approvals', { params: { type } });
  },

  getUserActivity: async (filters?: any): Promise<AxiosResponse<PaginatedResponse<any>>> => {
    return api.get('/reports/user-activity', { params: filters });
  },

  getSystemStats: async (): Promise<AxiosResponse<ApiResponse<SystemStats>>> => {
    return api.get('/reports/system-stats');
  },

  exportReport: async (reportType: string, format: string = 'csv'): Promise<AxiosResponse<Blob>> => {
    return api.get(`/reports/export/${reportType}`, {
      params: { format },
      responseType: 'blob',
    });
  },
};

// Audit Log API
export const auditApi = {
  getLogs: async (filters?: AuditFilters): Promise<AxiosResponse<PaginatedResponse<any>>> => {
    return api.get('/audit-logs', { params: filters });
  },

  getReceiptTrail: async (receiptId: string, filters?: any): Promise<AxiosResponse<PaginatedResponse<any>>> => {
    return api.get(`/audit-logs/receipt/${receiptId}`, { params: filters });
  },
};

// Utility functions
export const downloadFile = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export default api;
