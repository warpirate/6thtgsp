# 🚀 Quarter Master Inventory Management System

A comprehensive inventory management application with role-based access control, workflow automation, and military-grade security.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Installation](#installation)
- [Documentation](#documentation)
- [Tech Stack](#tech-stack)

## Overview

The Quarter Master Inventory Management System is designed to provide secure, efficient inventory tracking with multi-level approval workflows. Built with modern web technologies and enterprise-grade security.

## Features

### 🔐 Authentication & Authorization
- Secure JWT-based authentication via Supabase Auth
- Role-based access control (4 levels: Semi User, User, Admin, Super Admin)
- Multi-factor authentication support
- Session management and timeout handling

### 📦 Inventory Management
- Stock receipt creation and tracking
- Multi-stage approval workflow (Draft → Submitted → Verified → Approved)
- Document attachment and management
- Real-time status updates

### 📊 Analytics & Reporting
- Comprehensive dashboard with role-based views
- Inventory analytics and trends
- Export capabilities (PDF, CSV)
- Audit trail and activity logs

### 👥 User Management
- User role assignment and management
- Profile management and settings
- Activity tracking and audit logs

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Supabase      │    │   Storage       │
│   React + Vite  │◄──►│   PostgreSQL    │◄──►│   File System   │
│   Tailwind CSS  │    │   Auth + RLS    │    │   Documents     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Installation

1. **Clone the repository**
   ```bash
   git clone [repository-url]
   cd quartermaster-inventory
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Configure your Supabase credentials
   ```

4. **Run database migrations**
   ```bash
   npm run db:migrate
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

## Documentation

### 📋 Core Documentation
- [Design System](./design-system.md) - UI/UX guidelines and component library
- [Database Schema](./database-schema.md) - Complete database structure
- [Security Guidelines](./security.md) - Security policies and best practices
- [Setup Guide](./setup-guide.md) - Local development environment setup
- [Deployment Guide](./deployment-guide.md) - Production deployment instructions

### 🚧 Implementation Status
- [**🎉 IMPLEMENTATION COMPLETE**](./IMPLEMENTATION_COMPLETE.md) - **✅ ALL 17 PAGES IMPLEMENTED!**
- [Documentation Complete](./DOCUMENTATION_COMPLETE.md) - Master documentation index and status
- [Project Summary](./PROJECT_SUMMARY.md) - Executive summary and deliverables
- [Pending Work](./pending/README.md) - API Integration & testing roadmap

### 📄 Page Documentation
- [Dashboard Page](./pages/dashboard-page.md) - Main dashboard with analytics
- [Login Page](./pages/login-page.md) - User authentication
- [Stock Receipts Page](./pages/receipts-page.md) - Receipt management
- [Create Receipt Page](./pages/create-receipt-page.md) - New receipt creation
- [Receipt Detail Page](./pages/receipt-detail-page.md) - View/edit receipts
- [Approvals Page](./pages/approvals-page.md) - Approval workflow
- [Inventory Page](./pages/inventory-page.md) - Inventory tracking
- [Documents Page](./pages/documents-page.md) - Document management
- [Audit Logs Page](./pages/audit-logs-page.md) - System audit trail
- [User Management Page](./pages/users-page.md) - User administration
- [Profile Page](./pages/profile-page.md) - User profile management
- [Settings Page](./pages/settings-page.md) - Application settings

### 🔄 Flows & Diagrams
- [Authentication Flow](./flows/authentication-flow.md) - Login and session management
- [Receipt Workflow](./flows/receipt-workflow.md) - From draft to approved
- [Approval Process](./flows/approval-process.md) - Multi-tier approval system
- [Data Flow Diagram](./flows/data-flow-diagram.md) - System data flows

## Tech Stack

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Component library
- **Lucide React** - Icon library
- **Recharts** - Data visualization

### Backend
- **Supabase** - Backend-as-a-Service
- **PostgreSQL** - Primary database
- **Row Level Security** - Data access control
- **Supabase Auth** - Authentication service
- **Supabase Storage** - File storage

### Development Tools
- **TypeScript** - Type safety
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Husky** - Git hooks

## Project Structure

```
quartermaster-inventory/
├── docs/                     # Documentation
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ui/             # shadcn/ui components
│   │   ├── layout/         # Layout components
│   │   └── forms/          # Form components
│   ├── pages/              # Page components
│   │   ├── auth/           # Authentication pages
│   │   ├── dashboard/      # Dashboard views
│   │   ├── receipts/       # Stock receipt pages
│   │   ├── approvals/      # Approval workflow
│   │   ├── inventory/      # Inventory management
│   │   ├── audit/          # Audit logs
│   │   ├── users/          # User management
│   │   └── profile/        # User profile
│   ├── hooks/              # Custom React hooks
│   ├── utils/              # Utility functions
│   ├── types/              # TypeScript type definitions
│   └── lib/                # Configuration and setup
├── supabase/
│   ├── migrations/         # Database migrations
│   └── functions/          # Edge functions
└── public/                 # Static assets
```

---

Built with ❤️ for efficient inventory management.
