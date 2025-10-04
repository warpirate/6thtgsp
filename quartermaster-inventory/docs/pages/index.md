# Page Documentation Index

## 📄 Complete Page Reference

This document provides a quick reference to all pages in the Quarter Master system.

---

## Authentication Pages

### [Login Page](./login-page.md)
**Route**: `/auth/login`  
**Access**: Public  
**Purpose**: User authentication gateway  
**Key Features**: Email/password login, form validation, demo accounts display  
**Technologies**: React Hook Form, Zod validation, Supabase Auth

### [Forgot Password Page](./forgot-password-page.md)
**Route**: `/auth/forgot-password`  
**Access**: Public  
**Purpose**: Password recovery initiation  
**Key Features**: Email validation, recovery link generation  
**Technologies**: Supabase Auth reset password API

### [Reset Password Page](./reset-password-page.md)
**Route**: `/auth/reset-password`  
**Access**: Public (with token)  
**Purpose**: Complete password reset  
**Key Features**: Token validation, new password submission  
**Technologies**: Supabase Auth

---

## Core Application Pages

### [Dashboard Page](./dashboard-page.md) ⭐
**Route**: `/dashboard`  
**Access**: All authenticated users (role-based content)  
**Purpose**: Central hub with analytics and quick actions  
**Key Features**: Role-specific stats, pending tasks, recent activity feed  
**Technologies**: React, Tailwind, Lucide icons

### [Stock Receipts Page](./receipts-page.md)
**Route**: `/receipts`  
**Access**: All authenticated users  
**Purpose**: Browse and manage all stock receipts  
**Key Features**: List view, filtering, sorting, status badges  
**Technologies**: React Table, Supabase queries

### [Create Receipt Page](./create-receipt-page.md)
**Route**: `/receipts/create`  
**Access**: Users with `create_receipt` permission  
**Purpose**: Submit new stock receipts  
**Key Features**: Multi-step form, document upload, draft saving  
**Technologies**: React Hook Form, Zod, Supabase Storage

### [Receipt Detail Page](./receipt-detail-page.md)
**Route**: `/receipts/:id`  
**Access**: All authenticated users (read), creator/approvers (edit)  
**Purpose**: View and edit individual receipt details  
**Key Features**: Status display, document viewer, approval actions  
**Technologies**: React, Supabase real-time

---

## Workflow Pages

### [Approvals Page](./approvals-page.md)
**Route**: `/approvals`  
**Access**: Users with approval permissions  
**Purpose**: Review and approve pending receipts  
**Key Features**: Queue view, approve/reject actions, comments  
**Technologies**: React, workflow state machine

### [Inventory Page](./inventory-page.md)
**Route**: `/inventory`  
**Access**: Users with `view_reports` permission  
**Purpose**: Track and analyze inventory  
**Key Features**: Charts, export functionality, trend analysis  
**Technologies**: Recharts, CSV export

---

## Management Pages

### [Documents Page](./documents-page.md)
**Route**: `/documents`  
**Access**: All authenticated users  
**Purpose**: Centralized document management  
**Key Features**: Upload, download, categorization  
**Technologies**: Supabase Storage

### [Audit Logs Page](./audit-logs-page.md)
**Route**: `/audit`  
**Access**: Admin/Super Admin only  
**Purpose**: System-wide activity tracking  
**Key Features**: Filterable log viewer, export  
**Technologies**: Supabase queries

### [User Management Page](./users-page.md)
**Route**: `/users`  
**Access**: Super Admin only  
**Purpose**: Manage user accounts and roles  
**Key Features**: User CRUD, role assignment  
**Technologies**: Supabase Auth Admin API

---

## User Pages

### [Profile Page](./profile-page.md)
**Route**: `/profile`  
**Access**: All authenticated users  
**Purpose**: Personal profile management  
**Key Features**: Edit details, change password  
**Technologies**: React Hook Form

### [Settings Page](./settings-page.md)
**Route**: `/settings`  
**Access**: All authenticated users  
**Purpose**: Application preferences  
**Key Features**: Theme, notifications, display options  
**Technologies**: Local storage, context

---

## Error Pages

### [404 Not Found Page](./not-found-page.md)
**Route**: `*` (catch-all)  
**Access**: All users  
**Purpose**: Handle invalid routes  
**Key Features**: Friendly error message, navigation links

### [401 Unauthorized Page](./unauthorized-page.md)
**Route**: `/unauthorized`  
**Access**: All users  
**Purpose**: Display access denied message  
**Key Features**: Role information, contact admin link

### [500 Server Error Page](./server-error-page.md)
**Route**: `/server-error`  
**Access**: All users  
**Purpose**: Handle server errors  
**Key Features**: Error details, retry action

---

## Page Statistics

| Category | Count | Notes |
|----------|-------|-------|
| **Authentication** | 3 | Login, forgot password, reset password |
| **Core Application** | 4 | Dashboard, receipts, create, detail |
| **Workflow** | 2 | Approvals, inventory |
| **Management** | 3 | Documents, audit logs, users |
| **User** | 2 | Profile, settings |
| **Error** | 3 | 404, 401, 500 |
| **Total** | 17 | All pages documented |

---

## Access Matrix

| Role | Accessible Pages |
|------|------------------|
| **Semi User** | Dashboard, Receipts, Create Receipt, Receipt Detail (own), Documents, Profile, Settings |
| **User** | All Semi User pages + Approvals (verification), Inventory |
| **Admin** | All User pages + Audit Logs, Full Approvals |
| **Super Admin** | All pages including User Management |

---

## Page Complexity Rankings

### High Complexity 🔴
- **Receipt Detail Page**: Multiple states, real-time updates, file handling
- **Create Receipt Page**: Multi-step form, validation, draft system
- **Approvals Page**: Workflow logic, bulk actions
- **Inventory Page**: Data visualization, complex queries

### Medium Complexity 🟡
- **Dashboard Page**: Role-based rendering, multiple data sources
- **Receipts Page**: Filtering, sorting, pagination
- **User Management Page**: CRUD operations, role management
- **Audit Logs Page**: Log parsing, filtering

### Low Complexity 🟢
- **Login Page**: Simple form, standard validation
- **Profile Page**: Basic form, single-record update
- **Settings Page**: Preference management
- **Error Pages**: Static content, minimal logic

---

## Development Status

| Page | Status | Documentation | Tests | Notes |
|------|--------|---------------|-------|-------|
| Login Page | ✅ Complete | ✅ Done | ⏳ Partial | Fully functional |
| Dashboard Page | ✅ Complete | ✅ Done | ⏳ Partial | Using mock data |
| Receipts Page | 🚧 In Progress | ⏳ Pending | ❌ None | Under construction |
| Create Receipt | 🚧 In Progress | ⏳ Pending | ❌ None | Under construction |
| Receipt Detail | 🚧 In Progress | ⏳ Pending | ❌ None | Under construction |
| Approvals Page | 🚧 In Progress | ⏳ Pending | ❌ None | Under construction |
| Inventory Page | 🚧 In Progress | ⏳ Pending | ❌ None | Under construction |
| Documents Page | 🚧 In Progress | ⏳ Pending | ❌ None | Under construction |
| Audit Logs Page | 🚧 In Progress | ⏳ Pending | ❌ None | Under construction |
| Users Page | 🚧 In Progress | ⏳ Pending | ❌ None | Under construction |
| Profile Page | 🚧 In Progress | ⏳ Pending | ❌ None | Under construction |
| Settings Page | 🚧 In Progress | ⏳ Pending | ❌ None | Under construction |
| Forgot Password | ✅ Complete | ⏳ Pending | ❌ None | Functional |
| Reset Password | ✅ Complete | ⏳ Pending | ❌ None | Functional |
| 404 Page | ✅ Complete | ⏳ Pending | ❌ None | Functional |
| 401 Page | ✅ Complete | ⏳ Pending | ❌ None | Functional |
| 500 Page | ✅ Complete | ⏳ Pending | ❌ None | Functional |

---

## Quick Links

- [Architecture Overview](../architecture/system-architecture.md)
- [Database Schema](../database-schema.md)
- [Authentication Flow](../flows/authentication-flow.md)
- [Receipt Workflow](../flows/receipt-workflow.md)
- [Design System](../design-system.md)
- [Security Guidelines](../security.md)

---

**Last Updated**: 2025-10-04  
**Version**: 1.0.0  
**Maintainer**: Quarter Master Development Team
