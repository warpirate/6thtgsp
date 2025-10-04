# 🚀 Quarter Master Setup Guide

Complete step-by-step guide to set up and deploy the Quarter Master Inventory Management System.

## 📋 Prerequisites

Before starting, ensure you have:

- **Node.js 18+** and **npm 9+**
- **Git** (for version control)
- **Supabase Account** (free tier available)
- **Modern web browser** (Chrome, Firefox, Safari, Edge)

## 🛠️ Initial Setup

### 1. Install Dependencies

The project structure is already created. Now install the required packages:

```bash
cd quartermaster-inventory
npm install
```

This will install all dependencies including:
- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS + shadcn/ui
- Supabase client
- React Query for data fetching
- React Hook Form + Zod validation
- And many more...

### 2. Environment Configuration

The `.env.local` file is already configured with your Supabase credentials:

```env
VITE_SUPABASE_URL=https://ehjudngdvilwvrukcxle.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_APP_TITLE=Quarter Master Inventory
NODE_ENV=development
```

### 3. Database Setup

The database schema has been designed but needs to be applied. The existing database already has a good foundation with the following tables:

- `users` - User management with roles
- `items_master` - Item catalog
- `stock_receipts` - Main receipt records
- `receipt_items` - Individual items in receipts
- `documents` - File attachments
- `audit_logs` - Activity tracking
- `approval_workflow` - Approval process tracking

### 4. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## 🔧 Development Commands

```bash
# Development
npm run dev              # Start development server
npm run build            # Build for production
npm run preview          # Preview production build

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Fix linting errors
npm run type-check       # Check TypeScript types
npm run format           # Format code with Prettier

# Database (when Supabase CLI is installed)
npm run db:generate-types # Generate TypeScript types
npm run db:reset         # Reset database
npm run db:migrate       # Apply migrations
```

## 🎯 Application Structure

The application follows a modern React architecture:

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Base components (Button, Input, etc.)
│   ├── layout/         # Layout components (Header, Sidebar)
│   └── forms/          # Form-specific components
├── pages/              # Page components (routed)
├── lib/                # Core utilities and configurations
├── hooks/              # Custom React hooks
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
└── styles/             # Global styles and CSS
```

## 🔐 Authentication Flow

The application uses Supabase Auth with the existing user table structure:

1. Users authenticate via email/password
2. User profile is loaded from the `users` table
3. Role-based permissions are checked
4. Routes are protected based on user roles

### Current User Roles

Based on the existing database schema:

- **semi_user** - Can create draft receipts
- **user** - Can verify submitted receipts  
- **admin** - Can approve verified receipts
- **super_admin** - Full system access

## 📊 Database Integration

The application integrates with your existing Supabase database:

### Key Tables Mapping

| Database Table | Frontend Usage |
|---------------|----------------|
| `users` | User authentication and profiles |
| `stock_receipts` | Main receipt management |
| `receipt_items` | Individual line items |
| `approval_workflow` | Workflow tracking |
| `documents` | File attachments |
| `audit_logs` | Activity monitoring |

### Row Level Security

The existing database should have RLS policies. If not, you can apply them using the SQL files in `supabase/policies/`.

## 🎨 UI Components

The application uses **shadcn/ui** components with **Tailwind CSS**:

- **Consistent Design System**: Navy blue primary, clean typography
- **Responsive Layout**: Works on desktop, tablet, and mobile
- **Accessibility**: WCAG compliant components
- **Dark Mode Ready**: Theme system in place

## 🔄 Workflow System

The approval workflow follows this pattern:

```
Draft → Submitted → Verified → Approved
  ↓         ↓          ↓         ↓
Semi     User      Admin    Complete
User   (Verify)  (Approve)
```

## 🚀 Production Deployment

### Build for Production

```bash
npm run build
```

This creates a `dist/` folder with optimized production files.

### Deployment Options

1. **Vercel** (Recommended)
   ```bash
   npm i -g vercel
   vercel
   ```

2. **Netlify**
   - Connect your Git repository
   - Set build command: `npm run build`
   - Set publish directory: `dist`

3. **Traditional Hosting**
   - Upload the `dist/` folder to your web server
   - Configure for SPA routing (redirect all routes to index.html)

### Environment Variables for Production

Set these in your hosting platform:

```env
VITE_SUPABASE_URL=https://ehjudngdvilwvrukcxle.supabase.co
VITE_SUPABASE_ANON_KEY=your_production_anon_key
VITE_APP_TITLE=Quarter Master Inventory
NODE_ENV=production
```

## 🧪 Testing the Application

### Initial Test Plan

1. **Authentication Testing**
   - Try logging in with existing users
   - Test role-based access

2. **CRUD Operations**
   - Create new stock receipts
   - Add receipt items
   - Test approval workflow

3. **File Uploads**
   - Upload documents to receipts
   - Verify file storage

4. **Responsive Design**
   - Test on different screen sizes
   - Verify mobile navigation

### Creating Test Users

If you need test users, you can create them directly in your Supabase dashboard or through the application's user management (for super admins).

## 🔧 Troubleshooting

### Common Issues

1. **TypeScript Errors**
   - Run `npm run type-check` to identify issues
   - Most errors will resolve after `npm install`

2. **Supabase Connection Issues**
   - Verify environment variables
   - Check Supabase project status
   - Ensure RLS policies are configured

3. **Build Errors**
   - Clear node_modules: `rm -rf node_modules && npm install`
   - Check for TypeScript errors: `npm run type-check`

4. **Styling Issues**
   - Ensure Tailwind is compiling: Check `npm run dev` output
   - Verify CSS imports in main.tsx

### Development Tips

1. **Database Schema Changes**
   - Use Supabase dashboard SQL editor
   - Update TypeScript types afterwards
   - Test RLS policies thoroughly

2. **Adding New Features**
   - Follow the existing component patterns
   - Update types in `src/types/`
   - Add proper error handling

3. **Performance Optimization**
   - Use React Query for data caching
   - Implement proper loading states
   - Optimize images and assets

## 📞 Support & Maintenance

### Regular Maintenance Tasks

1. **Dependency Updates**
   ```bash
   npm update
   npm audit fix
   ```

2. **Database Monitoring**
   - Monitor Supabase usage
   - Review audit logs regularly
   - Check for performance issues

3. **Security Updates**
   - Keep dependencies updated
   - Monitor Supabase security advisories
   - Review user access regularly

### Getting Help

1. **Documentation**: Check the `/docs` folder for detailed guides
2. **Issues**: Create detailed bug reports with steps to reproduce
3. **Feature Requests**: Document requirements and use cases

## ✅ Final Checklist

Before going live:

- [ ] All dependencies installed successfully
- [ ] Application starts without errors (`npm run dev`)
- [ ] Database connection working
- [ ] Authentication flow functional
- [ ] Role-based access working
- [ ] File uploads operational
- [ ] Responsive design verified
- [ ] Production build successful (`npm run build`)
- [ ] Environment variables configured for production
- [ ] SSL certificate configured (for production)
- [ ] Backup procedures in place

---

Your Quarter Master Inventory Management System is ready for deployment! 🚀

The application provides a comprehensive, secure, and user-friendly inventory management solution with modern web technologies and enterprise-grade features.
