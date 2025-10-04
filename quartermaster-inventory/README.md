# Quarter Master Inventory Management System

A secure web application for tracking government property received from head office to quarter master stores with multi-level approval workflows for military/police departments.

## Features

- **Multi-level User Roles**: Semi User, User, Admin, Super Admin
- **Stock Receipt Management**: Create, verify, and approve stock receipts
- **Approval Workflow**: Draft → Submit → Verify → Approve
- **Audit Trail**: Complete logging of all system activities
- **Document Management**: Upload and manage supporting documents
- **Reports & Analytics**: Comprehensive reporting with export capabilities
- **User Management**: Complete user administration for Super Admins
- **Security**: JWT authentication, bcrypt password hashing, rate limiting

## Technology Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: PostgreSQL / Supabase
- **Authentication**: JWT + bcrypt

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher) **OR** Supabase account
- npm or yarn

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   cd client && npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials (see Database Setup below)
   ```

4. **Database Setup** - Choose ONE option:

   ### Option A: Using Supabase (Recommended for Production)
   
   1. Create a new project at [supabase.com](https://supabase.com)
   2. Go to **Settings → Database**
   3. Copy the **Connection string** (URI format)
   4. In your `.env` file, set:
      ```
      DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
      ```
   5. Run migrations:
      ```bash
      npm run db:migrate
      ```
   6. Seed initial data:
      ```bash
      npm run db:seed
      ```

   ### Option B: Using Local PostgreSQL
   
   1. Create a PostgreSQL database:
      ```sql
      CREATE DATABASE quartermaster_db;
      ```
   2. In your `.env` file, set:
      ```
      DB_HOST=localhost
      DB_PORT=5432
      DB_NAME=quartermaster_db
      DB_USER=postgres
      DB_PASSWORD=your_password
      ```
   3. Run migrations:
      ```bash
      npm run db:migrate
      ```
   4. Seed initial data:
      ```bash
      npm run db:seed
      ```

## Running the Application

### Development Mode
```bash
npm run dev
```
This runs both backend (port 5000) and frontend (port 5173) concurrently.

### Production Mode
```bash
npm run build
npm start
```

## Default Credentials

- **Username**: admin
- **Password**: Admin@123

**IMPORTANT**: Change the default password immediately after first login.

## User Roles & Permissions

| Role | Permissions |
|------|-------------|
| **Semi User** | View-only access to all records |
| **User** | View + Create/Edit stock receipts (data entry) |
| **Admin** | View + Verify/Audit entries |
| **Super Admin** | Full access + Final approval + User management |

## Approval Workflow

1. **User** creates stock receipt (Draft status)
2. **User** submits for verification (Submitted status)
3. **Admin** verifies the receipt (Verified status)
4. **Super Admin** gives final approval (Approved status)

Any level can reject and send back with comments.

## Security Features

- Password hashing with bcrypt
- JWT token-based authentication
- Session timeout after 30 minutes of inactivity
- Rate limiting on login attempts (5 attempts, 15-min lockout)
- Input validation and sanitization
- File upload restrictions (PDF, JPG, PNG only; max 5MB)
- Complete audit trail
- CSRF protection

## Project Structure

```
quartermaster-inventory/
├── server/
│   ├── config/          # Configuration files
│   ├── database/        # Database migrations and seeds
│   ├── middleware/      # Express middleware
│   ├── routes/          # API routes
│   ├── controllers/     # Route controllers
│   ├── models/          # Database models
│   ├── utils/           # Utility functions
│   └── index.js         # Server entry point
├── client/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── context/     # React context
│   │   ├── hooks/       # Custom hooks
│   │   ├── utils/       # Utility functions
│   │   ├── types/       # TypeScript types
│   │   └── App.tsx      # Main app component
│   └── public/          # Static files
└── uploads/             # File upload directory

```

## API Documentation

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Stock Receipts
- `GET /api/receipts` - Get all receipts (filtered by role)
- `GET /api/receipts/:id` - Get receipt details
- `POST /api/receipts` - Create new receipt
- `PUT /api/receipts/:id` - Update receipt
- `POST /api/receipts/:id/submit` - Submit for verification
- `POST /api/receipts/:id/verify` - Verify receipt (Admin)
- `POST /api/receipts/:id/approve` - Approve receipt (Super Admin)
- `POST /api/receipts/:id/reject` - Reject receipt

### Items
- `GET /api/items` - Get all items
- `POST /api/items` - Create new item (Admin+)
- `PUT /api/items/:id` - Update item (Admin+)

### Users
- `GET /api/users` - Get all users (Super Admin)
- `POST /api/users` - Create new user (Super Admin)
- `PUT /api/users/:id` - Update user (Super Admin)
- `DELETE /api/users/:id` - Deactivate user (Super Admin)
- `POST /api/users/:id/reset-password` - Reset password (Super Admin)

### Reports
- `GET /api/reports/receipt-register` - Stock receipt register
- `GET /api/reports/item-history/:itemId` - Item-wise receipt history
- `GET /api/reports/pending-approvals` - Pending approvals report
- `GET /api/reports/user-activity` - User activity report

### Audit Logs
- `GET /api/audit-logs` - Get audit logs (Admin+)
- `GET /api/audit-logs/receipt/:id` - Get receipt audit trail

## Validation Rules

- Receipt date cannot be a future date
- Challan date cannot be after receipt date
- Received quantity cannot be negative
- GRN number is auto-generated and unique
- Username must be unique
- Email must be valid format
- Password minimum 8 characters, alphanumeric
- File uploads: PDF, JPG, PNG only; max 5MB

## Database Compatibility Notes

This application is fully compatible with both PostgreSQL and Supabase. The following PostgreSQL features are used:

- **UUID Generation**: Uses `gen_random_uuid()` (built-in from PostgreSQL 13+)
- **ENUM Types**: Custom enums for user roles, item categories, receipt statuses, and workflow actions
- **JSONB**: For storing audit log data
- **Triggers**: Automatic updated_at timestamps and audit logging
- **Generated Columns**: Automatic variance and total_value calculations
- **Full-Text Search**: Available for item nomenclature searches

All these features are fully supported by Supabase as it runs on PostgreSQL 15.

### Switching Between PostgreSQL and Supabase

To switch databases, simply update your `.env` file:

- **For Supabase**: Set `DATABASE_URL` to your Supabase connection string
- **For Local PostgreSQL**: Comment out `DATABASE_URL` and set individual `DB_*` variables

The application automatically detects which connection method to use.

## Support

For issues or questions, please contact the system administrator.

## License

Proprietary - For government use only
